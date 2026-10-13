import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generarCaso, mapearProyectado } from "@tests/helpers/flujo.helper.ts";
import { copiarConocimiento, crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { RespuestaGenerar } from "@tests/helpers/types/flujo.type.ts";
import type { ConocimientoTemporal, ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { FIXTURES_DIR } from "@/config/constants/files.constants.ts";
import { leerRuta } from "@/domain/mapeo.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { CampoLista } from "@/domain/types/plantilla-caso.type.ts";
import { crearHerramientas } from "@/tools/herramientas.factory.ts";

const PA = "pa-logistica-istmo";
const AVISO_ORIGINAL = 'hace clic en "Enviar"';

const herramientas = crearHerramientas();
const proyectos: ProyectoTemporal[] = [];
const conocimientos: ConocimientoTemporal[] = [];
const fechaPrevia = process.env.FECHA_EJECUCION;
let compartido: ProyectoTemporal;
let maestro: Maestro;

async function nuevoProyecto(): Promise<ProyectoTemporal> {
  const proyecto = await crearProyectoTemporal();
  proyectos.push(proyecto);
  return proyecto;
}

async function nuevoConocimiento(): Promise<ConocimientoTemporal> {
  const conocimiento = await copiarConocimiento();
  conocimientos.push(conocimiento);
  return conocimiento;
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
  await Promise.all([
    ...proyectos.map((proyecto) => proyecto.limpiar()),
    ...conocimientos.map((conocimiento) => conocimiento.limpiar()),
  ]);
});

function ctx(raiz: string) {
  return { directory: raiz, sessionId: "golden-portal" };
}

function archivoPortal(raiz: string): string {
  return join(raiz, "out", PA, "valores-portal.md");
}

function plantillaPortal(conocimiento: ConocimientoTemporal): string {
  return join(conocimiento.directorio, "plantillas", "valores-portal.md");
}

async function etiquetasPa(raiz: string): Promise<string[]> {
  const ruta = join(raiz, FIXTURES_DIR, "casos", PA, "plantilla-campos.json");
  const campos: CampoLista[] = JSON.parse(await readFile(ruta, "utf8"));
  return campos.map((campo) => campo.etiqueta);
}

describe("golden: proveedor_generar_formulario portal (FORM-03, D-28, D-29)", () => {
  test("pa-logistica-istmo responde ok con el aviso y escribe valores-portal.md desde la plantilla", async () => {
    const { respuesta, mapeo } = await generarCaso(herramientas, ctx(compartido.raiz), PA);
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data).toEqual({
      ruta: `out/${PA}/valores-portal.md`,
      formato: "portal",
      aviso: "formato no soportado",
    });
    expect(respuesta.data?.aviso).toBe("formato no soportado");
    expect(respuesta.resumen).toBe(
      `${PA}: valores para portal generados, formato no soportado (8 llenos, 0 faltantes, 1 por confirmar)`,
    );
    expect(existsSync(join(compartido.raiz, "out", PA, "mapeo.json"))).toBe(true);

    const contenido = await readFile(archivoPortal(compartido.raiz), "utf8");
    expect(contenido).toContain("Fecha de ejecución: 2026-09-03");
    expect(contenido).toContain(AVISO_ORIGINAL);
    const etiquetas = await etiquetasPa(compartido.raiz);
    expect(etiquetas).toHaveLength(9);
    const posiciones = etiquetas.map((etiqueta) => contenido.indexOf(`| ${etiqueta} |`));
    for (const posicion of posiciones) expect(posicion).toBeGreaterThanOrEqual(0);
    expect(posiciones).toEqual([...posiciones].sort((a, b) => a - b));
    expect(contenido).toContain("COLOCOBM");

    for (const item of mapeo) {
      if (item.ruta === null) continue;
      const valor = leerRuta(maestro, item.ruta);
      if (valor === null) throw new Error(`sin valor para ${item.ruta}`);
      expect(contenido).toContain(`| ${item.etiqueta} | ${valor} |`);
    }
    expect(contenido).toContain("- RUC (por confirmar)");
  });

  test("una plantilla editada con {{banco.numero_cuenta}} da REGLAS_INVALIDAS y no escribe el archivo", async () => {
    const proyecto = await nuevoProyecto();
    const conocimiento = await nuevoConocimiento();
    const ruta = plantillaPortal(conocimiento);
    await writeFile(ruta, `${await readFile(ruta, "utf8")}\nCuenta: {{banco.numero_cuenta}}\n`);
    const editadas = crearHerramientas({ directorioConocimiento: conocimiento.directorio });

    const { respuesta } = await generarCaso(editadas, ctx(proyecto.raiz), PA);
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("REGLAS_INVALIDAS");
    expect(existsSync(archivoPortal(proyecto.raiz))).toBe(false);
  });

  test("cambiar el texto del aviso en la plantilla cambia la salida siguiente sin tocar código", async () => {
    const proyecto = await nuevoProyecto();
    const conocimiento = await nuevoConocimiento();
    const editadas = crearHerramientas({ directorioConocimiento: conocimiento.directorio });

    await generarCaso(editadas, ctx(proyecto.raiz), PA);
    expect(await readFile(archivoPortal(proyecto.raiz), "utf8")).toContain(AVISO_ORIGINAL);

    const ruta = plantillaPortal(conocimiento);
    const original = await readFile(ruta, "utf8");
    expect(original).toContain(AVISO_ORIGINAL);
    await writeFile(ruta, original.replace(AVISO_ORIGINAL, "pulsa el botón Registrar"));

    const { respuesta } = await generarCaso(editadas, ctx(proyecto.raiz), PA);
    expect(respuesta.ok).toBe(true);
    const contenido = await readFile(archivoPortal(proyecto.raiz), "utf8");
    expect(contenido).toContain("pulsa el botón Registrar");
    expect(contenido).not.toContain(AVISO_ORIGINAL);
  });

  test("un mapeo de pa con una ruta cambiada da MAPEO_INCONSISTENTE y no escribe valores-portal.md (FORM-04)", async () => {
    const proyecto = await nuevoProyecto();
    const mapeo = await mapearProyectado(herramientas, ctx(proyecto.raiz), PA);
    const adulterado = mapeo.map((item) =>
      item.etiqueta === "SWIFT" ? { ...item, ruta: "banco.numero_cuenta" } : item,
    );

    const crudo = await herramientas.generar_formulario.execute(
      { caso: PA, mapeo: adulterado },
      ctx(proyecto.raiz),
    );
    const respuesta: RespuestaGenerar = JSON.parse(crudo);
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("MAPEO_INCONSISTENTE");
    expect(existsSync(archivoPortal(proyecto.raiz))).toBe(false);
  });
});
