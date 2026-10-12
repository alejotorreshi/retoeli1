import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { OUT_DIR, SESION_DEMO } from "../../src/config/constantes.ts";
import { simular_envio } from "../../src/tools/proveedor.ts";
import { type Corrida, correrDemo } from "../helpers/correr-demo.ts";
import { listarSalida } from "../helpers/instantanea.ts";
import { crearProyectoTemporal, type ProyectoTemporal } from "../helpers/proyecto-temporal.ts";
import { celdaEn, leerCeldasXlsx } from "../helpers/xlsx-leer.ts";

const VALORES_SENSIBLES = /71555123|03100012345|COLOCOBM|900123456/;
const CASO_CONFIRMADO = "ec-corp-andina";

const ARCHIVOS_ESCANEADOS = [
  /^log\.jsonl$/,
  /^[^/]+\/log\.jsonl$/,
  /^[^/]+\/mapeo\.json$/,
  /^[^/]+\/paquete\/checklist\.md$/,
  /^[^/]+\/paquete\/borrador-correo\.md$/,
  /^[^/]+\/ENVIO-SIMULADO\.md$/,
];

type Elemento = { readonly origen: string; readonly texto: string };

let proyecto: ProyectoTemporal;
let corrida: Corrida;
let corpus: Elemento[];
let archivos: string[];

beforeAll(async () => {
  proyecto = await crearProyectoTemporal();
  const ctx = { directory: proyecto.raiz, sessionId: SESION_DEMO };
  let confirmada = "";
  corrida = await correrDemo(proyecto.raiz, {
    despues: async () => {
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

  test("ninguna respuesta, línea de consola, bitácora, mapeo, checklist, borrador ni envío trae un valor sensible", () => {
    const fugas = corpus.filter(({ texto }) => VALORES_SENSIBLES.test(texto)).map(({ origen }) => origen);
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
