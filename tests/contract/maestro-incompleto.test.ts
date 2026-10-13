import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generarCaso } from "@tests/helpers/flujo.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { celdaEn, leerCeldasXlsx } from "@tests/helpers/xlsx-leer.helper.ts";
import { FIXTURES_DIR } from "@/config/constants/files.constants.ts";
import { crearHerramientas } from "@/tools/factories/herramientas.factory.ts";

const CO = "co-industrias-delta";
const HOJA = "Datos Proveedor";
const RELLENO_FALTANTE = "FFFFC7CE";
const NOTA_FALTANTE = "Faltante: no existe en el maestro";

type RespuestaMapear = {
  readonly ok: boolean;
  readonly data?: {
    readonly conteo: Readonly<Record<string, number>>;
    readonly faltantes: readonly { readonly etiqueta: string; readonly valor_enmascarado: string | null }[];
  };
};

type RespuestaPaquete = {
  readonly ok: boolean;
  readonly data?: {
    readonly listo_para_firma: boolean;
    readonly checklist: { readonly faltantes: readonly string[] };
  };
};

const herramientas = crearHerramientas();
const fechaPrevia = process.env.FECHA_EJECUCION;
let proyecto: ProyectoTemporal;
let mapeo: RespuestaMapear;
let paquete: RespuestaPaquete;

function ctx() {
  return { directory: proyecto.raiz, sessionId: "contrato-maestro-incompleto" };
}

async function dejarEnBlanco(cambios: Readonly<Record<string, string>>): Promise<void> {
  const ruta = join(proyecto.raiz, FIXTURES_DIR, "repositorio", "maestro.json");
  const maestro = JSON.parse(await readFile(ruta, "utf8"));
  await writeFile(ruta, JSON.stringify({ ...maestro, ...cambios }));
}

function leerPaquete(archivo: string): Promise<string> {
  return readFile(join(proyecto.raiz, "out", CO, "paquete", archivo), "utf8");
}

beforeAll(async () => {
  process.env.FECHA_EJECUCION = "2026-09-03";
  proyecto = await crearProyectoTemporal();
  await dejarEnBlanco({ ciudad: "   ", ciiu_principal: "" });
  mapeo = JSON.parse(await herramientas.mapear_campos.execute({ caso: CO, campos: [] }, ctx()));
  const flujo = await generarCaso(herramientas, ctx(), CO);
  if (!flujo.respuesta.ok) throw new Error("generar_formulario falló");
  paquete = JSON.parse(await herramientas.armar_paquete.execute({ caso: CO }, ctx()));
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await proyecto.limpiar();
});

describe("contrato: un dato del maestro en blanco es faltante en todo el flujo (MAP-01, CR-01)", () => {
  test("mapear_campos lo reporta faltante y sin valor", () => {
    expect(mapeo.data?.conteo).toEqual({ lleno: 15, faltante: 2, requiere_confirmacion: 0 });
    expect(mapeo.data?.faltantes).toEqual([
      expect.objectContaining({ etiqueta: "Ciudad", valor_enmascarado: null }),
      expect.objectContaining({ etiqueta: "Código CIIU", valor_enmascarado: null }),
    ]);
  });

  test("el xlsx deja la celda vacía con el relleno y la nota de faltante", async () => {
    const celdas = await leerCeldasXlsx(join(proyecto.raiz, "out", CO, "formulario.xlsx"));
    for (const direccion of ["C7", "C14"]) {
      expect(celdaEn(celdas, HOJA, direccion)).toMatchObject({
        valor: null,
        relleno: RELLENO_FALTANTE,
        nota: NOTA_FALTANTE,
      });
    }
  });

  test("armar_paquete lo lista en los faltantes del checklist sin bloquear el paquete", async () => {
    expect(paquete.data?.listo_para_firma).toBe(true);
    expect(paquete.data?.checklist.faltantes).toEqual(["Ciudad", "Código CIIU"]);
    const checklist = await leerPaquete("checklist.md");
    expect(checklist).toContain("- Ciudad: no existe en el maestro");
    expect(checklist).toContain("- Código CIIU: no existe en el maestro");
    expect(checklist).not.toMatch(/## Campos faltantes\n\nNinguno\./);
  });

  test("el borrador lo menciona entre los pendientes", async () => {
    const borrador = await leerPaquete("borrador-correo.md");
    expect(borrador).toContain("Quedan pendientes:\n- Ciudad\n- Código CIIU\n");
  });
});
