import { afterAll, describe, expect, test } from "bun:test";
import { readFile, realpath } from "node:fs/promises";
import { join } from "node:path";
import { correrDemo } from "@tests/helpers/correr-demo.ts";
import { listarSalida, tomarInstantanea } from "@tests/helpers/instantanea.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.ts";
import type { Corrida } from "@tests/helpers/types/correr-demo.type.ts";
import type { Instantanea } from "@tests/helpers/types/instantanea.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { OUT_DIR } from "@/config/constants/files.constants.ts";

const EXTENSIONES_TEXTO = /\.(?:md|json|jsonl)$/;
const proyectos: ProyectoTemporal[] = [];

afterAll(async () => {
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
});

async function proyecto(): Promise<ProyectoTemporal> {
  const creado = await crearProyectoTemporal();
  proyectos.push(creado);
  return creado;
}

async function correrYFotografiar(raiz: string): Promise<{ corrida: Corrida; instantanea: Instantanea }> {
  const corrida = await correrDemo(raiz);
  expect(corrida.fallido).toBe(false);
  return { corrida, instantanea: await tomarInstantanea(raiz) };
}

async function rutasDeRaiz(raiz: string): Promise<string[]> {
  return [...new Set([raiz, await realpath(raiz)])];
}

async function textosDeSalida(raiz: string): Promise<string[]> {
  const relativas = (await listarSalida(raiz)).filter((ruta) => EXTENSIONES_TEXTO.test(ruta));
  return Promise.all(relativas.map((relativa) => readFile(join(raiz, OUT_DIR, relativa), "utf8")));
}

describe("determinismo de punta a punta (CAL-04, DEMO-01)", () => {
  let primera: ProyectoTemporal;
  let segunda: ProyectoTemporal;
  let corridaA: { corrida: Corrida; instantanea: Instantanea };
  let corridaB: { corrida: Corrida; instantanea: Instantanea };
  let corridaOtraRaiz: { corrida: Corrida; instantanea: Instantanea };

  test("dos corridas seguidas en la misma raíz dan la misma salida y los mismos archivos", async () => {
    primera = await proyecto();
    corridaA = await correrYFotografiar(primera.raiz);
    corridaB = await correrYFotografiar(primera.raiz);
    expect(corridaB.corrida.lineas).toEqual(corridaA.corrida.lineas);
    expect(corridaB.corrida.respuestas).toEqual(corridaA.corrida.respuestas);
    expect([...corridaB.instantanea.keys()]).toEqual([...corridaA.instantanea.keys()]);
    expect(corridaB.instantanea).toEqual(corridaA.instantanea);
  });

  test("la instantánea cubre cada tipo de archivo y no está vacía", () => {
    const tipos = new Set([...corridaA.instantanea.values()].map((valor) => valor.tipo));
    expect(tipos).toEqual(new Set(["bytes", "jsonl", "xlsx"]));
    const rutas = [...corridaA.instantanea.keys()];
    for (const extension of [".pdf", ".md", ".json", ".jsonl", ".txt", ".xlsx"]) {
      expect(rutas.some((ruta) => ruta.endsWith(extension))).toBe(true);
    }
  });

  test("otra raíz da la misma salida y el mismo conjunto de rutas relativas", async () => {
    segunda = await proyecto();
    expect(segunda.raiz).not.toBe(primera.raiz);
    corridaOtraRaiz = await correrYFotografiar(segunda.raiz);
    expect(corridaOtraRaiz.corrida.lineas).toEqual(corridaA.corrida.lineas);
    expect([...corridaOtraRaiz.instantanea.keys()]).toEqual([...corridaA.instantanea.keys()]);
  });

  test("ninguna salida de texto ni línea de consola trae la ruta absoluta de una raíz (T-01-20)", async () => {
    const raices = [...(await rutasDeRaiz(primera.raiz)), ...(await rutasDeRaiz(segunda.raiz))];
    const textos = [
      ...(await textosDeSalida(primera.raiz)),
      ...(await textosDeSalida(segunda.raiz)),
      ...corridaA.corrida.lineas,
      ...corridaOtraRaiz.corrida.lineas,
      ...corridaA.corrida.respuestas.map(({ respuesta }) => respuesta),
    ];
    expect(textos.length).toBeGreaterThan(20);
    for (const texto of textos) {
      for (const raiz of raices) expect(texto).not.toContain(raiz);
    }
  });
});
