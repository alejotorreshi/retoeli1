import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, readFile, stat, symlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { CASO_CONFIRMADO, generarArtefactos } from "@tests/helpers/artefactos.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { LectorArtefactos } from "@/application/types/artefactos.type.ts";
import {
  ARCHIVO_BITACORA,
  ARCHIVOS_SALIDA,
  DIRECTORIO_PAQUETE,
  OUT_DIR,
  TIPO_ARCHIVO_CASO,
  TIPO_VISTA_PREVIA,
} from "@/config/constants/files.constants.ts";
import { createArtifactReader } from "@/infra/output/artifact-reader.adapter.ts";

const CO = "co-industrias-delta";
const HN = "hn-agroexport-sula";
const PA = "pa-logistica-istmo";
const CASOS: string[] = [CO, CASO_CONFIRMADO, HN, PA];
const ENLACE_FUERA = "enlace-fuera.txt";

const ESPERADOS: Readonly<Record<string, readonly string[]>> = {
  [CO]: [
    "formulario.xlsx",
    "paquete/checklist.md",
    "paquete/borrador-correo.md",
    "paquete/camara-comercio-2026-08.txt",
    "paquete/certificacion-bancaria-2026-08.txt",
    "paquete/estados-financieros-2025.txt",
    "paquete/rut-2026.txt",
  ],
  [CASO_CONFIRMADO]: [
    "formulario.pdf",
    "paquete/checklist.md",
    "paquete/borrador-correo.md",
    "ENVIO-SIMULADO.md",
    "paquete/camara-comercio-2026-08.txt",
    "paquete/certificacion-bancaria-2026-08.txt",
    "paquete/estados-financieros-2025.txt",
    "paquete/rut-2026.txt",
  ],
  [HN]: [
    "formulario.xlsx",
    "paquete/checklist.md",
    "paquete/borrador-correo.md",
    "paquete/camara-comercio-2026-08.txt",
    "paquete/parafiscales-2026-07.txt",
    "paquete/rut-2026.txt",
  ],
  [PA]: [
    "valores-portal.md",
    "paquete/checklist.md",
    "paquete/borrador-correo.md",
    "paquete/camara-comercio-2026-08.txt",
    "paquete/rut-2026.txt",
  ],
};

let proyecto: ProyectoTemporal;
let lector: LectorArtefactos;

function salida(...partes: string[]): string {
  return join(proyecto.raiz, OUT_DIR, ...partes);
}

async function nombres(caso: string): Promise<readonly string[]> {
  return (await lector.listar(caso))?.map((archivo) => archivo.nombre) ?? [];
}

beforeAll(async () => {
  proyecto = await crearProyectoTemporal();
  await generarArtefactos(proyecto.raiz);
  await symlink(join(proyecto.raiz, "package.json"), salida(CO, DIRECTORIO_PAQUETE, ENLACE_FUERA));
  lector = createArtifactReader(proyecto.raiz);
});

afterAll(async () => {
  await proyecto.limpiar();
});

describe("listar: la lista blanca de lo que existe en disco (D-66)", () => {
  test.each(CASOS)("%s lista exactamente los archivos esperados, en orden", async (caso) => {
    expect(await nombres(caso)).toEqual(ESPERADOS[caso] ?? []);
  });

  test.each(CASOS)("%s nunca lista mapeo.json ni log.jsonl, aunque existen en disco", async (caso) => {
    expect((await stat(salida(caso, ARCHIVOS_SALIDA.MAPEO))).isFile()).toBe(true);
    expect((await stat(salida(caso, ARCHIVO_BITACORA))).isFile()).toBe(true);
    const lista = await nombres(caso);
    expect(lista.some((nombre) => nombre.endsWith(ARCHIVOS_SALIDA.MAPEO))).toBe(false);
    expect(lista.some((nombre) => nombre.endsWith(ARCHIVO_BITACORA))).toBe(false);
  });

  test("pa no lista la copia de valores-portal.md que vive en paquete/", async () => {
    expect((await stat(salida(PA, DIRECTORIO_PAQUETE, ARCHIVOS_SALIDA.VALORES_PORTAL))).isFile()).toBe(true);
    expect(await nombres(PA)).not.toContain(`${DIRECTORIO_PAQUETE}/${ARCHIVOS_SALIDA.VALORES_PORTAL}`);
  });

  test("los soportes no son previsualizables y el resto sí", async () => {
    for (const archivo of (await lector.listar(CO)) ?? []) {
      expect(archivo.previsualizable).toBe(archivo.tipo !== TIPO_ARCHIVO_CASO.SOPORTE);
    }
  });

  test("un enlace simbólico dentro de paquete/ no se lista", async () => {
    expect(await nombres(CO)).not.toContain(`${DIRECTORIO_PAQUETE}/${ENLACE_FUERA}`);
  });

  test("un caso desconocido o mal formado da null", async () => {
    expect(await lector.listar("zz-no-existe")).toBeNull();
    expect(await lector.listar("../co-industrias-delta")).toBeNull();
    expect(await lector.listar("")).toBeNull();
  });

  test("un caso conocido sin salida en disco lista vacío (el servidor se reinició, D-67)", async () => {
    const vacio = await crearProyectoTemporal();
    try {
      expect(await createArtifactReader(vacio.raiz).listar(CO)).toEqual([]);
    } finally {
      await vacio.limpiar();
    }
  });
});

describe("abrir: solo lo que está en la lista blanca, dentro del caso", () => {
  test("formulario.xlsx sale con su tipo de contenido y los mismos bytes que en disco", async () => {
    const archivo = await lector.abrir(CO, ARCHIVOS_SALIDA.FORMULARIO_XLSX);
    expect(archivo?.tipoContenido).toBe("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    const enDisco = new Uint8Array(await Bun.file(salida(CO, ARCHIVOS_SALIDA.FORMULARIO_XLSX)).arrayBuffer());
    expect(new Uint8Array((await archivo?.cuerpo.arrayBuffer()) ?? new ArrayBuffer(0))).toEqual(enDisco);
  });

  test("un archivo del paquete se abre con el prefijo paquete/ y se nombra por su archivo", async () => {
    const archivo = await lector.abrir(CO, "paquete/borrador-correo.md");
    expect(archivo?.nombre).toBe("borrador-correo.md");
    expect(archivo?.tipoContenido).toBe("text/markdown; charset=utf-8");
  });

  test.each([
    "mapeo.json",
    "log.jsonl",
    "../package.json",
    "paquete/../mapeo.json",
    "paquete/mapeo.json",
    "paquete/formulario.xlsx",
    `paquete/${ENLACE_FUERA}`,
    "formulario.pdf",
    "",
  ])("rechaza %p", async (nombre) => {
    expect(await lector.abrir(CO, nombre)).toBeNull();
  });

  test("rechaza un caso desconocido aunque el nombre sea servible", async () => {
    expect(await lector.abrir("zz-no-existe", ARCHIVOS_SALIDA.FORMULARIO_XLSX)).toBeNull();
    expect(await lector.abrir(`../${CO}`, ARCHIVOS_SALIDA.FORMULARIO_XLSX)).toBeNull();
  });
});

async function filasDelMapeo(caso: string): Promise<unknown[]> {
  const mapeo = JSON.parse(await readFile(salida(caso, ARCHIVOS_SALIDA.MAPEO), "utf8"));
  return mapeo.campos.map((campo: Record<string, unknown>) => ({
    etiqueta: campo.etiqueta,
    valor_enmascarado: campo.valor_enmascarado,
    estado: campo.estado,
    nota: campo.nota,
  }));
}

describe("vistaPrevia del formulario y del portal: tabla desde mapeo.json (D-65, D-74)", () => {
  test.each([
    [CO, "formulario.xlsx"],
    [CASO_CONFIRMADO, "formulario.pdf"],
    [HN, "formulario.xlsx"],
    [PA, "valores-portal.md"],
  ])("%s %s da las filas de mapeo.json, en orden", async (caso, nombre) => {
    const filas = await filasDelMapeo(caso);
    expect(filas.length).toBeGreaterThan(0);
    const vista: unknown = await lector.vistaPrevia(caso, nombre);
    expect(vista).toEqual({ tipo: TIPO_VISTA_PREVIA.TABLA, filas });
  });

  test("la vista previa de valores-portal.md no trae la cuenta, el SWIFT, los correos ni los teléfonos", async () => {
    const texto = JSON.stringify(await lector.vistaPrevia(PA, ARCHIVOS_SALIDA.VALORES_PORTAL));
    const portal = await readFile(salida(PA, ARCHIVOS_SALIDA.VALORES_PORTAL), "utf8");
    const completos = (await sensiblesDelProyecto(proyecto.raiz)).filter(
      (hoja) =>
        hoja.ruta === "banco.numero_cuenta" ||
        hoja.ruta === "banco.swift" ||
        hoja.ruta.endsWith("email") ||
        hoja.ruta.endsWith("telefono"),
    );
    expect(completos.some((hoja) => portal.includes(hoja.valor))).toBe(true);
    expect(texto).not.toContain("03100012345");
    expect(completos.filter((hoja) => texto.includes(hoja.valor))).toEqual([]);
  });

  test("sin mapeo.json la vista previa del formulario es null", async () => {
    const solo = await crearProyectoTemporal();
    try {
      await mkdir(join(solo.raiz, OUT_DIR, CO), { recursive: true });
      await writeFile(join(solo.raiz, OUT_DIR, CO, ARCHIVOS_SALIDA.FORMULARIO_XLSX), "xlsx");
      const lectorSolo = createArtifactReader(solo.raiz);
      expect(await lectorSolo.listar(CO)).toEqual([
        {
          nombre: ARCHIVOS_SALIDA.FORMULARIO_XLSX,
          tipo: TIPO_ARCHIVO_CASO.FORMULARIO,
          previsualizable: true,
        },
      ]);
      expect(await lectorSolo.vistaPrevia(CO, ARCHIVOS_SALIDA.FORMULARIO_XLSX)).toBeNull();
    } finally {
      await solo.limpiar();
    }
  });
});

describe("vistaPrevia de los textos del paquete: texto plano sin cambios (D-65, D-74)", () => {
  test.each([
    [CO, "paquete/checklist.md"],
    [CO, "paquete/borrador-correo.md"],
    [CASO_CONFIRMADO, "ENVIO-SIMULADO.md"],
  ])("%s %s devuelve el texto tal como está en disco", async (caso, nombre) => {
    const texto = await readFile(salida(caso, nombre), "utf8");
    expect(await lector.vistaPrevia(caso, nombre)).toEqual({ tipo: TIPO_VISTA_PREVIA.TEXTO, texto });
  });

  test.each([
    [CO, "paquete/rut-2026.txt"],
    [CO, "mapeo.json"],
    [CO, "log.jsonl"],
    [CO, "paquete/formulario.xlsx"],
    [CO, "formulario.pdf"],
    [CO, `paquete/${ENLACE_FUERA}`],
    ["zz-no-existe", "formulario.xlsx"],
  ])("%s %s no tiene vista previa", async (caso, nombre) => {
    expect(await lector.vistaPrevia(caso, nombre)).toBeNull();
  });
});
