import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generarCaso } from "@tests/helpers/flujo.helper.ts";
import { extraerTrazos } from "@tests/helpers/pdf-texto.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { Trazo } from "@tests/helpers/types/pdf-texto.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { PDFDocument } from "pdf-lib";
import { FIXTURES_DIR } from "@/config/constants/files.constants.ts";
import { leerRuta } from "@/domain/maestro.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { CampoLista } from "@/domain/types/plantilla-caso.type.ts";
import { crearHerramientas } from "@/tools/herramientas.factory.ts";

const EC = "ec-corp-andina";
const COLOR_FALTANTE = "0.75 0 0";
const COLOR_POR_CONFIRMAR = "0.8 0.5 0";
const COLOR_TEXTO = "0 0 0";
const NOTA_EXTRANJERO = "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano";

const herramientas = crearHerramientas();
const proyectos: ProyectoTemporal[] = [];
const fechaPrevia = process.env.FECHA_EJECUCION;
let compartido: ProyectoTemporal;
let maestro: Maestro;

async function nuevoProyecto(): Promise<ProyectoTemporal> {
  const proyecto = await crearProyectoTemporal();
  proyectos.push(proyecto);
  return proyecto;
}

beforeAll(async () => {
  process.env.FECHA_EJECUCION = "2026-09-03";
  compartido = await nuevoProyecto();
  maestro = JSON.parse(
    await readFile(join(compartido.raiz, FIXTURES_DIR, "repositorio", "maestro.json"), "utf8"),
  );
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
});

function ctx(raiz: string) {
  return { directory: raiz, sessionId: "golden-pdf" };
}

async function plantilla(raiz: string): Promise<CampoLista[]> {
  return JSON.parse(await readFile(join(raiz, FIXTURES_DIR, "casos", EC, "plantilla-campos.json"), "utf8"));
}

function archivoPdf(raiz: string): string {
  return join(raiz, "out", EC, "formulario.pdf");
}

async function generarEc(raiz: string) {
  const flujo = await generarCaso(herramientas, ctx(raiz), EC);
  expect(flujo.respuesta.ok).toBe(true);
  return flujo;
}

function indiceDe(trazos: readonly Trazo[], texto: string): number {
  const indice = trazos.findIndex((trazo) => trazo.texto === texto);
  if (indice < 0) throw new Error(`sin trazo "${texto}"`);
  return indice;
}

describe("golden: proveedor_generar_formulario pdf (FORM-02, D-03)", () => {
  test("ec-corp-andina escribe formulario.pdf con las 15 etiquetas en el orden de la plantilla", async () => {
    const { respuesta } = await generarEc(compartido.raiz);
    expect(respuesta.data).toEqual({ ruta: `out/${EC}/formulario.pdf`, formato: "pdf" });
    expect(respuesta.resumen).toBe(
      `${EC}: formulario pdf generado (13 llenos, 1 faltantes, 1 por confirmar)`,
    );
    expect(existsSync(join(compartido.raiz, "out", EC, "mapeo.json"))).toBe(true);

    const trazos = await extraerTrazos(new Uint8Array(await readFile(archivoPdf(compartido.raiz))));
    const campos = await plantilla(compartido.raiz);
    expect(campos).toHaveLength(15);
    const indices = campos.map((campo) =>
      indiceDe(trazos, campo.obligatorio ? `${campo.etiqueta} *` : campo.etiqueta),
    );
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    for (const indice of indices) expect(trazos[indice]?.color).toBe(COLOR_TEXTO);
  });

  test("marca el faltante en rojo, el RUC por confirmar en ámbar y cierra con las Notas", async () => {
    await generarEc(compartido.raiz);
    const trazos = await extraerTrazos(new Uint8Array(await readFile(archivoPdf(compartido.raiz))));

    const faltante = indiceDe(trazos, "[FALTANTE]");
    expect(trazos[faltante]?.color).toBe(COLOR_FALTANTE);
    expect(faltante).toBe(indiceDe(trazos, "Número de contribuyente especial") + 1);

    const ruc = leerRuta(maestro, "nit");
    const porConfirmar = indiceDe(trazos, `${ruc} [POR CONFIRMAR]`);
    expect(trazos[porConfirmar]?.color).toBe(COLOR_POR_CONFIRMAR);
    expect(porConfirmar).toBe(indiceDe(trazos, "RUC *") + 1);

    const notas = indiceDe(trazos, "Notas");
    expect(notas).toBeGreaterThan(indiceDe(trazos, "SWIFT *"));
    const textosNotas = trazos.slice(notas + 1).map((trazo) => trazo.texto);
    expect(textosNotas).toContain(`RUC: ${NOTA_EXTRANJERO}`);
    expect(textosNotas).toContain("Número de contribuyente especial: no existe en el maestro");
    expect(textosNotas).toContain("País: Código ISO del país de constitución de Periferia");
  });

  test("cada valor lleno sale del maestro por la ruta canónica", async () => {
    const { mapeo } = await generarEc(compartido.raiz);
    const trazos = await extraerTrazos(new Uint8Array(await readFile(archivoPdf(compartido.raiz))));
    const texto = trazos.map((trazo) => trazo.texto).join(" ");
    const llenos = mapeo.filter((item) => item.estado === "lleno");
    expect(llenos).toHaveLength(13);
    for (const item of llenos) {
      if (item.ruta === null) throw new Error(`sin ruta para ${item.etiqueta}`);
      const valor = leerRuta(maestro, item.ruta);
      if (valor === null) throw new Error(`sin valor para ${item.ruta}`);
      expect(texto).toContain(valor);
    }
  });

  test("un valor con caracteres fuera de WinAnsi sale marcado por confirmar y con su motivo en las Notas", async () => {
    const proyecto = await nuevoProyecto();
    const rutaMaestro = join(proyecto.raiz, FIXTURES_DIR, "repositorio", "maestro.json");
    await writeFile(rutaMaestro, JSON.stringify({ ...maestro, razon_social: "Łódź Logística S.A." }));
    await generarEc(proyecto.raiz);
    const trazos = await extraerTrazos(new Uint8Array(await readFile(archivoPdf(proyecto.raiz))));

    const valor = indiceDe(trazos, "?ód? Logística S.A. [POR CONFIRMAR]");
    expect(trazos[valor]?.color).toBe(COLOR_POR_CONFIRMAR);
    expect(valor).toBe(indiceDe(trazos, "Nombre de la empresa *") + 1);
    const textosNotas = trazos.slice(indiceDe(trazos, "Notas") + 1).map((trazo) => trazo.texto);
    expect(textosNotas.join(" ")).toContain(
      "Nombre de la empresa: el valor tiene caracteres que el PDF no puede mostrar y salen como ?;",
    );
  });

  test("dos generaciones con la misma FECHA_EJECUCION dan bytes idénticos y metadatos fijos", async () => {
    const proyecto = await nuevoProyecto();
    await generarEc(proyecto.raiz);
    const primera = new Uint8Array(await readFile(archivoPdf(proyecto.raiz)));
    await generarEc(proyecto.raiz);
    const segunda = new Uint8Array(await readFile(archivoPdf(proyecto.raiz)));
    expect(segunda).toEqual(primera);
    expect(new Uint8Array(await readFile(archivoPdf(compartido.raiz)))).toEqual(primera);

    const documento = await PDFDocument.load(primera, { updateMetadata: false });
    expect(documento.getProducer()).toBe("registro-proveedor");
    expect(documento.getCreator()).toBe("registro-proveedor");
    expect(documento.getAuthor()).toBe("registro-proveedor");
    expect(documento.getTitle()).toBe("registro-proveedor");
    expect(documento.getCreationDate()?.toISOString()).toBe("2026-09-03T00:00:00.000Z");
    expect(documento.getModificationDate()?.toISOString()).toBe("2026-09-03T00:00:00.000Z");
  });
});
