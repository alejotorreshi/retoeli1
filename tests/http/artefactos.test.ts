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
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { BINDINGS_PRUEBA, crearServidorPrueba } from "@tests/helpers/servidor-prueba.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { ServidorPrueba } from "@tests/helpers/types/servidor-prueba.type.ts";
import { z } from "zod";
import { OUT_DIR } from "@/config/constants/files.constants.ts";
import { CABECERA, RESPUESTA_HTTP, TIPO_CONTENIDO } from "@/config/constants/http.constants.ts";
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
