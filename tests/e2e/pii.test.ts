import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { correrDemo } from "@tests/helpers/correr-demo.helper.ts";
import { listarSalida } from "@tests/helpers/instantanea.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { Corrida } from "@tests/helpers/types/correr-demo.type.ts";
import type { HojaMaestro } from "@tests/helpers/types/pii.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { celdaEn, leerCeldasXlsx } from "@tests/helpers/xlsx-leer.helper.ts";
import { FECHA_DEMO, SESION_DEMO } from "@/config/constants/demo.constants.ts";
import { OUT_DIR } from "@/config/constants/files.constants.ts";
import { RUTAS_BORRADOR } from "@/config/constants/maestro.constants.ts";
import { simular_envio } from "@/tools/proveedor.ts";

const CASO_CONFIRMADO = "ec-corp-andina";
const BORRADOR = /borrador-correo\.md$/;
const RUTAS_EN_BORRADOR: ReadonlySet<string> = new Set(RUTAS_BORRADOR);

const ARCHIVOS_ESCANEADOS = [
  /^log\.jsonl$/,
  /^[^/]+\/log\.jsonl$/,
  /^[^/]+\/mapeo\.json$/,
  /^[^/]+\/paquete\/checklist\.md$/,
  /^[^/]+\/paquete\/borrador-correo\.md$/,
  /^[^/]+\/ENVIO-SIMULADO\.md$/,
];

type Elemento = { readonly origen: string; readonly texto: string };

function permitidaEn(origen: string, hoja: HojaMaestro): boolean {
  return BORRADOR.test(origen) && RUTAS_EN_BORRADOR.has(hoja.ruta);
}

let proyecto: ProyectoTemporal;
let corrida: Corrida;
let corpus: Elemento[];
let archivos: string[];
let sensibles: HojaMaestro[];

beforeAll(async () => {
  proyecto = await crearProyectoTemporal();
  sensibles = await sensiblesDelProyecto(proyecto.raiz);
  const ctx = { directory: proyecto.raiz, sessionId: SESION_DEMO };
  let confirmada = "";
  corrida = await correrDemo(proyecto.raiz, {
    despues: async () => {
      process.env.FECHA_EJECUCION = FECHA_DEMO;
      confirmada = await simular_envio.execute({ caso: CASO_CONFIRMADO, confirmado: true }, ctx);
    },
  });
  corrida.respuestas.push({ herramienta: "simular_envio", respuesta: confirmada });
  archivos = (await listarSalida(proyecto.raiz)).filter((ruta) =>
    ARCHIVOS_ESCANEADOS.some((patron) => patron.test(ruta)),
  );
  const contenidos = await Promise.all(
    archivos.map(async (ruta) => ({
      origen: ruta,
      texto: await readFile(join(proyecto.raiz, OUT_DIR, ruta), "utf8"),
    })),
  );
  corpus = [
    ...corrida.respuestas.map(({ herramienta, respuesta }) => ({ origen: herramienta, texto: respuesta })),
    ...corrida.lineas.map((linea) => ({ origen: "stdout", texto: linea })),
    ...contenidos,
  ];
});

afterAll(async () => {
  await proyecto.limpiar();
});

function contar(patron: RegExp): number {
  return archivos.filter((ruta) => patron.test(ruta)).length;
}

describe("ningún valor sensible fuera de los formularios (SEG-02, D-06)", () => {
  test("el corpus no es vacío", () => {
    expect(corrida.fallido).toBe(false);
    expect(JSON.parse(corrida.respuestas.at(-1)?.respuesta ?? "{}").ok).toBe(true);
    expect(corrida.respuestas.length).toBeGreaterThanOrEqual(20);
    expect(contar(/mapeo\.json$/)).toBeGreaterThanOrEqual(4);
    expect(contar(/checklist\.md$/)).toBeGreaterThanOrEqual(4);
    expect(contar(/borrador-correo\.md$/)).toBeGreaterThanOrEqual(4);
    expect(contar(/\.jsonl$/)).toBeGreaterThanOrEqual(5);
    expect(archivos).toContain(`${CASO_CONFIRMADO}/ENVIO-SIMULADO.md`);
  });

  test("la lista de valores sensibles sale de todo el maestro, no de unos pocos identificadores", () => {
    const rutas = sensibles.map((hoja) => hoja.ruta);
    for (const ruta of [
      "nit",
      "direccion",
      "telefono",
      "representante_legal.nombre",
      "representante_legal.identificacion",
      "contacto_comercial.email",
      "contacto_financiero.nombre",
      "ingresos_ultimo_ano.valor",
      "banco.numero_cuenta",
      "banco.swift",
    ]) {
      expect(rutas).toContain(ruta);
    }
  });

  test("ninguna respuesta, línea de consola, bitácora, mapeo, checklist, borrador ni envío trae un valor sensible", () => {
    const fugas = corpus.flatMap(({ origen, texto }) =>
      sensibles
        .filter((hoja) => texto.includes(hoja.valor) && !permitidaEn(origen, hoja))
        .map((hoja) => `${origen}: ${hoja.ruta}`),
    );
    expect(fugas).toEqual([]);
  });

  test("control positivo: los valores sí están en los formularios, donde D-25 los permite", async () => {
    const out = join(proyecto.raiz, OUT_DIR);
    const co = await leerCeldasXlsx(join(out, "co-industrias-delta", "formulario.xlsx"));
    expect(celdaEn(co, "Datos Bancarios", "C5").valor).toBe("03100012345");
    const hn = await leerCeldasXlsx(join(out, "hn-agroexport-sula", "formulario.xlsx"));
    expect(celdaEn(hn, "Registro", "B3").valor).toBe("900123456");
    const portal = await readFile(join(out, "pa-logistica-istmo", "valores-portal.md"), "utf8");
    expect(portal).toContain("COLOCOBM");
  });
});
