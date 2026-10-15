import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  CASO_CONFIRMADO,
  generarArtefactos,
  rutaArchivo,
  rutaArchivos,
  rutaVistaPrevia,
} from "@tests/helpers/artefactos.helper.ts";
import { crearFetchFalso } from "@tests/helpers/fetch-falso.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { BINDINGS_PRUEBA, crearServidorPrueba } from "@tests/helpers/servidor-prueba.helper.ts";
import type { HojaMaestro } from "@tests/helpers/types/pii.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { ServidorPrueba } from "@tests/helpers/types/servidor-prueba.type.ts";
import { z } from "zod";
import { OUT_DIR } from "@/config/constants/files.constants.ts";
import { CABECERA, RESPUESTA_HTTP, TIPO_CONTENIDO } from "@/config/constants/http.constants.ts";
import { RUTA_MAESTRO, RUTAS_BORRADOR } from "@/config/constants/maestro.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";

const CO = "co-industrias-delta";

let proyecto: ProyectoTemporal;
let servidor: ServidorPrueba;

beforeAll(async () => {
  proyecto = await crearProyectoTemporal();
  await generarArtefactos(proyecto.raiz);
  servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: crearFetchFalso([]).fetch });
});

afterAll(async () => {
  await proyecto.limpiar();
});

async function bytesEnDisco(caso: string, nombre: string): Promise<Uint8Array<ArrayBuffer>> {
  return new Uint8Array(await Bun.file(join(proyecto.raiz, OUT_DIR, caso, nombre)).arrayBuffer());
}

const listaSchema = z.object({ archivos: z.array(z.object({ nombre: z.string() })) });

async function esperar404(respuesta: Response, mensaje: string): Promise<void> {
  expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_ENCONTRADO);
  expect(respuesta.headers.get(CABECERA.TIPO_CONTENIDO)).toStartWith(TIPO_CONTENIDO.JSON);
  expect(await respuesta.json()).toEqual({ mensaje });
}

describe("acceso a los artefactos (D-72)", () => {
  test.each([
    rutaArchivos(CO),
    rutaArchivo(CO, "formulario.xlsx"),
    rutaArchivo(CO, "paquete/borrador-correo.md"),
    rutaVistaPrevia(CO, "formulario.xlsx"),
    rutaVistaPrevia(CO, "paquete/checklist.md"),
    rutaArchivos("zz-no-existe"),
  ])("%s responde 401 sin acceso", async (ruta) => {
    const respuesta = await servidor.app.request(ruta, {}, BINDINGS_PRUEBA);
    expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_AUTORIZADO);
  });
});

describe("GET /api/casos/:caso/archivos (D-66)", () => {
  test("lista los archivos del caso con su tipo", async () => {
    const respuesta = await servidor.pedir(rutaArchivos(CASO_CONFIRMADO));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    const nombres = listaSchema.parse(await respuesta.json()).archivos.map((archivo) => archivo.nombre);
    expect(nombres.slice(0, 4)).toEqual([
      "formulario.pdf",
      "paquete/checklist.md",
      "paquete/borrador-correo.md",
      "ENVIO-SIMULADO.md",
    ]);
    expect(nombres).not.toContain("mapeo.json");
    expect(nombres).not.toContain("log.jsonl");
  });

  test("un caso desconocido responde 404 { mensaje }", async () => {
    await esperar404(await servidor.pedir(rutaArchivos("zz-no-existe")), MENSAJE_HTTP.casoNoEncontrado);
  });
});

describe("descarga del archivo real (D-64)", () => {
  test.each([
    [
      "formulario.xlsx",
      "formulario.xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    ["paquete/borrador-correo.md", "borrador-correo.md", "text/markdown; charset=utf-8"],
  ])("%s llega byte a byte como adjunto con nosniff", async (nombre, archivo, tipo) => {
    const respuesta = await servidor.pedir(rutaArchivo(CO, nombre));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(respuesta.headers.get(CABECERA.TIPO_CONTENIDO)).toBe(tipo);
    expect(respuesta.headers.get("Content-Disposition")).toBe(`attachment; filename="${archivo}"`);
    expect(respuesta.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(respuesta.headers.get(CABECERA.CACHE_CONTROL)).toBe("no-store");
    expect(new Uint8Array(await respuesta.arrayBuffer())).toEqual(await bytesEnDisco(CO, nombre));
  });

  test.each([
    rutaArchivo(CO, "mapeo.json"),
    rutaArchivo(CO, "log.jsonl"),
    rutaArchivo(CO, "..%2Fmapeo.json"),
    rutaArchivo(CO, "..%2F..%2Fpackage.json"),
    rutaArchivo(CO, "paquete/..%2Fmapeo.json"),
    rutaArchivo(CO, "paquete/formulario.xlsx"),
    rutaArchivo(CO, "formulario.pdf"),
    rutaArchivo(CO, "paquete"),
    rutaArchivo("zz-no-existe", "formulario.xlsx"),
  ])("%s responde 404 { mensaje }", async (ruta) => {
    await esperar404(await servidor.pedir(ruta), MENSAJE_HTTP.archivoNoEncontrado);
  });

  test.each([rutaArchivo(CO, "%2e%2e/mapeo.json"), rutaArchivo(CO, "../../../package.json")])(
    "%s, normalizada por la URL, cae fuera de las rutas y responde 404 { mensaje }",
    async (ruta) => {
      const respuesta = await servidor.pedir(ruta);
      expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_ENCONTRADO);
      expect(await respuesta.json()).toEqual({ mensaje: expect.any(String) });
    },
  );
});

const CASOS = [CO, CASO_CONFIRMADO, "hn-agroexport-sula", "pa-logistica-istmo"];
const BORRADOR = "paquete/borrador-correo.md";
const RUTAS_EN_BORRADOR: ReadonlySet<string> = new Set(RUTAS_BORRADOR);

const vistaSchema = z.union([
  z.object({
    tipo: z.literal("tabla"),
    filas: z.array(
      z.object({
        etiqueta: z.string(),
        valor_enmascarado: z.string().nullable(),
        estado: z.string(),
        nota: z.string().nullable(),
      }),
    ),
  }),
  z.object({ tipo: z.literal("texto"), texto: z.string() }),
]);

type VistaServida = { readonly caso: string; readonly nombre: string; readonly textos: readonly string[] };

function permitidaEn(nombre: string, hoja: HojaMaestro): boolean {
  return nombre === BORRADOR && RUTAS_EN_BORRADOR.has(hoja.ruta);
}

async function vistasDeCaso(caso: string): Promise<VistaServida[]> {
  const lista = await servidor.pedir(rutaArchivos(caso));
  const archivos = z
    .object({ archivos: z.array(z.object({ nombre: z.string(), previsualizable: z.boolean() })) })
    .parse(await lista.json()).archivos;
  const vistas: VistaServida[] = [];
  for (const archivo of archivos.filter((candidato) => candidato.previsualizable)) {
    const respuesta = await servidor.pedir(rutaVistaPrevia(caso, archivo.nombre));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    const crudo = await respuesta.text();
    const vista = vistaSchema.parse(JSON.parse(crudo));
    const textos =
      vista.tipo === "texto"
        ? [vista.texto]
        : vista.filas.flatMap((fila) => [fila.etiqueta, fila.valor_enmascarado ?? "", fila.nota ?? ""]);
    vistas.push({ caso, nombre: archivo.nombre, textos: [crudo, ...textos] });
  }
  return vistas;
}

describe("GET /api/casos/:caso/vista-previa/:nombre (D-64, D-65, D-74)", () => {
  test("ninguna vista previa de los cuatro casos trae un valor sensible del maestro, salvo el firmante en el borrador", async () => {
    const sensibles = await sensiblesDelProyecto(proyecto.raiz);
    const vistas = (await Promise.all(CASOS.map(vistasDeCaso))).flat();
    expect(vistas.length).toBe(13);
    expect(new Set(vistas.map((vista) => vista.caso))).toEqual(new Set(CASOS));
    const fugas = vistas.flatMap(({ caso, nombre, textos }) =>
      sensibles
        .filter((hoja) => textos.some((texto) => texto.includes(hoja.valor)) && !permitidaEn(nombre, hoja))
        .map((hoja) => `${caso}/${nombre}: ${hoja.ruta}`),
    );
    expect(fugas).toEqual([]);
  });

  test("control positivo: el borrador muestra completo el nombre del firmante (D-74)", async () => {
    const firmante = (await sensiblesDelProyecto(proyecto.raiz)).find(
      (hoja) => hoja.ruta === RUTA_MAESTRO.CONTACTO_FINANCIERO_NOMBRE,
    );
    const respuesta = await servidor.pedir(rutaVistaPrevia(CO, BORRADOR));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(firmante).toBeDefined();
    expect(await respuesta.text()).toContain(firmante?.valor ?? "sin firmante");
  });

  test("la vista previa del formulario es la tabla enmascarada de mapeo.json", async () => {
    const respuesta = await servidor.pedir(rutaVistaPrevia(CO, "formulario.xlsx"));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(respuesta.headers.get(CABECERA.TIPO_CONTENIDO)).toStartWith(TIPO_CONTENIDO.JSON);
    const vista = vistaSchema.parse(await respuesta.json());
    expect(vista.tipo).toBe("tabla");
    const filas = vista.tipo === "tabla" ? vista.filas : [];
    expect(filas.some((fila) => fila.valor_enmascarado?.includes("•") ?? false)).toBe(true);
    expect(JSON.stringify(filas)).not.toContain("03100012345");
  });

  test.each([
    rutaVistaPrevia(CO, "mapeo.json"),
    rutaVistaPrevia(CO, "log.jsonl"),
    rutaVistaPrevia(CO, "formulario.pdf"),
    rutaVistaPrevia(CO, "..%2Fmapeo.json"),
    rutaVistaPrevia("zz-no-existe", "formulario.xlsx"),
  ])("%s responde 404 { mensaje }", async (ruta) => {
    await esperar404(await servidor.pedir(ruta), MENSAJE_HTTP.archivoNoEncontrado);
  });

  test("un archivo que existe sin vista previa responde 422, no 404, para no simular un disco borrado", async () => {
    const respuesta = await servidor.pedir(rutaVistaPrevia(CO, "paquete/rut-2026.txt"));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_PROCESABLE);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.vistaPreviaNoDisponible });
  });
});
