import { afterAll, describe, expect, test } from "bun:test";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { AnchoLeido, CeldaLeida } from "@tests/helpers/types/xlsx-leer.type.ts";
import { celdaEn, leerAnchosXlsx, leerCeldasXlsx } from "@tests/helpers/xlsx-leer.helper.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { ANCHO_COLUMNA_XLSX } from "@/config/constants/xlsx.constants.ts";
import type { FilaCelda } from "@/domain/types/formulario.type.ts";
import { writeXlsx } from "@/infra/output/xlsx-writer.adapter.ts";

const { minimo, maximo, margen } = ANCHO_COLUMNA_XLSX;
const HOJA = "Hoja";
const RELLENO_FALTANTE = "FFFFC7CE";
const NOTA_FALTANTE = "Faltante: no existe en el maestro";

const proyectos: ProyectoTemporal[] = [];
let contador = 0;

afterAll(async () => {
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
});

function texto(largo: number, caracter = "x"): string {
  return caracter.repeat(largo);
}

function fila(celda_etiqueta: string, celda_valor: string, cambios: Partial<FilaCelda> = {}): FilaCelda {
  return {
    etiqueta: "Campo",
    obligatorio: null,
    hoja: HOJA,
    celda_etiqueta,
    celda_valor,
    estado: ESTADO_CAMPO.LLENO,
    valor: "dato",
    nota: null,
    ...cambios,
  };
}

async function escribir(
  filas: readonly FilaCelda[],
): Promise<{ anchos: AnchoLeido[]; celdas: CeldaLeida[] }> {
  if (proyectos.length === 0) proyectos.push(await crearProyectoTemporal());
  const [proyecto] = proyectos;
  if (proyecto === undefined) throw new Error("sin proyecto temporal");
  contador += 1;
  const ruta = join(proyecto.raiz, `escrito-${contador}.xlsx`);
  await writeFile(ruta, await writeXlsx(filas, "2026-09-03"));
  return { anchos: await leerAnchosXlsx(ruta), celdas: await leerCeldasXlsx(ruta) };
}

function anchoDe(anchos: readonly AnchoLeido[], columna: string, hoja = HOJA): number | null {
  const encontrado = anchos.find((ancho) => ancho.hoja === hoja && ancho.columna === columna);
  if (encontrado === undefined) throw new Error(`sin columna ${hoja}!${columna}`);
  return encontrado.ancho;
}

describe("writeXlsx: ancho de columna acotado (GC-4, G-01-H1)", () => {
  test("una columna cuyo texto más largo más el margen queda bajo el mínimo recibe el mínimo", async () => {
    const corto = texto(minimo - margen - 1);
    const { anchos } = await escribir([fila("A1", "B1", { etiqueta: corto, valor: corto })]);
    expect(anchoDe(anchos, "A")).toBe(minimo);
    expect(anchoDe(anchos, "B")).toBe(minimo);
  });

  test("un texto cuyo largo más el margen iguala el máximo da el máximo y no ajusta", async () => {
    const { anchos, celdas } = await escribir([fila("A1", "B1", { valor: texto(maximo - margen) })]);
    expect(anchoDe(anchos, "B")).toBe(maximo);
    expect(celdaEn(celdas, HOJA, "B1").ajustada).toBe(false);
  });

  test("un valor con saltos de línea mide su línea más larga y ajusta el texto (IN-05)", async () => {
    const valor = `${texto(5)}\n${texto(20)}\r\n${texto(8)}`;
    const { anchos, celdas } = await escribir([fila("A1", "B1", { valor })]);
    expect(anchoDe(anchos, "B")).toBe(20 + margen);
    expect(celdaEn(celdas, HOJA, "B1").ajustada).toBe(true);
  });

  test("un valor de una sola línea bajo el máximo no ajusta el texto", async () => {
    const { celdas } = await escribir([fila("A1", "B1", { valor: texto(20) })]);
    expect(celdaEn(celdas, HOJA, "B1").ajustada).toBe(false);
  });

  test("el largo se mide en puntos de código, no en unidades UTF-16", async () => {
    const { anchos, celdas } = await escribir([fila("A1", "B1", { valor: texto(maximo - margen, "😀") })]);
    expect(anchoDe(anchos, "B")).toBe(maximo);
    expect(celdaEn(celdas, HOJA, "B1").ajustada).toBe(false);
  });

  test("las columnas salen de las direcciones de la plantilla y las demás quedan sin ancho", async () => {
    const { anchos } = await escribir([fila("D2", "F2", { etiqueta: texto(20), valor: texto(30) })]);
    expect(anchoDe(anchos, "D")).toBe(20 + margen);
    expect(anchoDe(anchos, "F")).toBe(30 + margen);
    expect(anchoDe(anchos, "E")).toBeNull();
    expect(anchoDe(anchos, "A")).toBeNull();
  });

  test("la misma letra en dos hojas recibe anchos independientes", async () => {
    const { anchos } = await escribir([
      fila("A1", "B1", { hoja: "Primera", valor: texto(15) }),
      fila("A1", "B1", { hoja: "Segunda", valor: texto(40) }),
    ]);
    expect(anchoDe(anchos, "B", "Primera")).toBe(15 + margen);
    expect(anchoDe(anchos, "B", "Segunda")).toBe(40 + margen);
  });

  test("una celda faltante queda vacía con su relleno y nota, no ajusta y no suma al ancho", async () => {
    const { anchos, celdas } = await escribir([
      fila("A1", "B1", { estado: ESTADO_CAMPO.FALTANTE, valor: texto(maximo) }),
      fila("A2", "B2", { estado: ESTADO_CAMPO.FALTANTE, valor: null }),
    ]);
    const faltante = celdaEn(celdas, HOJA, "B1");
    expect(faltante.valor).toBeNull();
    expect(faltante.relleno).toBe(RELLENO_FALTANTE);
    expect(faltante.nota).toBe(NOTA_FALTANTE);
    expect(faltante.ajustada).toBe(false);
    expect(anchoDe(anchos, "B")).toBe(minimo);
  });

  test("escribir las mismas filas dos veces da los mismos anchos y las mismas celdas", async () => {
    const filas = [
      fila("A1", "B1", { valor: texto(maximo) }),
      fila("A2", "B2", { estado: ESTADO_CAMPO.REQUIERE_CONFIRMACION, valor: "valor", nota: "nota" }),
    ];
    const primera = await escribir(filas);
    const segunda = await escribir(filas);
    expect(segunda.anchos).toEqual(primera.anchos);
    expect(segunda.celdas).toEqual(primera.celdas);
  });

  test("la celda de valor conserva el formato @ y una fórmula queda como texto", async () => {
    const { celdas } = await escribir([fila("A1", "B1", { valor: "=1+1" })]);
    const celda = celdaEn(celdas, HOJA, "B1");
    expect(celda.formato).toBe("@");
    expect(celda.tipo).toBe("texto");
    expect(celda.valor).toBe("=1+1");
    expect(celda.ajustada).toBe(false);
  });
});

describe("writeXlsx: ajuste de texto sobre el máximo (GC-4, G-01-H1)", () => {
  test("un texto de largo máximo más uno ajusta solo su celda y la columna queda en el máximo", async () => {
    const { anchos, celdas } = await escribir([
      fila("A1", "B1", { valor: texto(maximo - margen + 1) }),
      fila("A2", "B2", { valor: texto(maximo - margen) }),
      fila("A3", "B3", { valor: "corto" }),
    ]);
    expect(anchoDe(anchos, "B")).toBe(maximo);
    expect(celdaEn(celdas, HOJA, "B1").ajustada).toBe(true);
    expect(celdaEn(celdas, HOJA, "B2").ajustada).toBe(false);
    expect(celdaEn(celdas, HOJA, "B3").ajustada).toBe(false);
    expect(celdaEn(celdas, HOJA, "A1").ajustada).toBe(false);
  });

  test("una etiqueta sobre el máximo también ajusta y conserva la negrita", async () => {
    const { anchos, celdas } = await escribir([fila("A1", "B1", { etiqueta: texto(maximo - margen + 1) })]);
    const etiqueta = celdaEn(celdas, HOJA, "A1");
    expect(anchoDe(anchos, "A")).toBe(maximo);
    expect(etiqueta.ajustada).toBe(true);
    expect(etiqueta.negrita).toBe(true);
  });

  test("una celda ajustada conserva su relleno de por confirmar, su nota y su formato", async () => {
    const { celdas } = await escribir([
      fila("A1", "B1", {
        estado: ESTADO_CAMPO.REQUIERE_CONFIRMACION,
        valor: texto(maximo),
        nota: "nota",
      }),
    ]);
    const celda = celdaEn(celdas, HOJA, "B1");
    expect(celda.ajustada).toBe(true);
    expect(celda.relleno).toBe("FFFFEB9C");
    expect(celda.nota).toBe("nota");
    expect(celda.formato).toBe("@");
    expect(celda.valor).toBe(texto(maximo));
  });
});
