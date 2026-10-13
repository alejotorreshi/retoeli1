import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { chmod, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generarCaso } from "@tests/helpers/flujo.ts";
import { crearProyectoTemporal, type ProyectoTemporal } from "@tests/helpers/proyecto-temporal.ts";
import { FIXTURES_DIR } from "@/config/constants/files.constants.ts";
import { crearHerramientas } from "@/tools/fabrica.ts";

const CO = "co-industrias-delta";
const EC = "ec-corp-andina";
const HN = "hn-agroexport-sula";
const PA = "pa-logistica-istmo";
const CASOS = [CO, EC, HN, PA] as const;
const AVISO_CO = "Emitido en CO: confirmar si el cliente lo acepta";
const NOTA_RUC = "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano";

const ESPERADO: Readonly<Record<string, { listo: boolean; bloqueos: readonly string[] }>> = {
  [CO]: { listo: true, bloqueos: [] },
  [EC]: { listo: false, bloqueos: ["ausente: certificado_cumplimiento_tributario"] },
  [HN]: { listo: false, bloqueos: ["vencido: parafiscales (2026-08-31)"] },
  [PA]: { listo: true, bloqueos: [] },
};

const ARCHIVOS_CO = [
  "borrador-correo.md",
  "camara-comercio-2026-08.txt",
  "certificacion-bancaria-2026-08.txt",
  "checklist.md",
  "estados-financieros-2025.txt",
  "formulario.xlsx",
  "rut-2026.txt",
];

type SoporteRespuesta = {
  readonly tipo: string;
  readonly estado: string;
  readonly vigencia_hasta: string | null;
  readonly archivo: string | null;
  readonly aviso: string | null;
  readonly aviso_emisor: string | null;
};

type RespuestaPaquete = {
  readonly ok: boolean;
  readonly data?: {
    readonly ruta: string;
    readonly listo_para_firma: boolean;
    readonly bloqueos: readonly string[];
    readonly checklist: {
      readonly fecha_ejecucion: string;
      readonly soportes: readonly SoporteRespuesta[];
      readonly faltantes: readonly string[];
      readonly requiere_confirmacion: readonly { readonly etiqueta: string; readonly nota: string }[];
    };
    readonly archivos: readonly string[];
  };
  readonly error?: string;
  readonly codigo?: string;
  readonly resumen?: string;
};

const herramientas = crearHerramientas();
const proyectos: ProyectoTemporal[] = [];
const fechaPrevia = process.env.FECHA_EJECUCION;
const respuestas = new Map<string, RespuestaPaquete>();
let compartido: ProyectoTemporal;

async function nuevoProyecto(): Promise<ProyectoTemporal> {
  const proyecto = await crearProyectoTemporal();
  proyectos.push(proyecto);
  return proyecto;
}

function ctx(raiz: string) {
  return { directory: raiz, sessionId: "golden-paquete" };
}

async function armar(raiz: string, caso: string): Promise<RespuestaPaquete> {
  return JSON.parse(await herramientas.armar_paquete.execute({ caso }, ctx(raiz)));
}

function carpetaPaquete(raiz: string, caso: string): string {
  return join(raiz, "out", caso, "paquete");
}

async function archivosPaquete(raiz: string, caso: string): Promise<string[]> {
  return (await readdir(carpetaPaquete(raiz, caso))).sort();
}

function checklistDe(raiz: string, caso: string): Promise<string> {
  return readFile(join(carpetaPaquete(raiz, caso), "checklist.md"), "utf8");
}

async function lineasDe(ruta: string): Promise<number> {
  if (!existsSync(ruta)) return 0;
  return (await readFile(ruta, "utf8")).split("\n").filter((linea) => linea !== "").length;
}

function respuestaDe(caso: string): RespuestaPaquete {
  const respuesta = respuestas.get(caso);
  if (respuesta === undefined) throw new Error(`sin respuesta para ${caso}`);
  return respuesta;
}

beforeAll(async () => {
  process.env.FECHA_EJECUCION = "2026-09-03";
  compartido = await nuevoProyecto();
  for (const caso of CASOS) {
    const flujo = await generarCaso(herramientas, ctx(compartido.raiz), caso);
    if (!flujo.respuesta.ok) throw new Error(`generar_formulario falló para ${caso}`);
    respuestas.set(caso, await armar(compartido.raiz, caso));
  }
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
});

describe("golden: proveedor_armar_paquete (PAQ-01, PAQ-02, PAQ-03, D-21)", () => {
  for (const caso of CASOS) {
    test(`${caso} reproduce listo_para_firma y bloqueos de la tabla de verdad`, () => {
      const respuesta = respuestaDe(caso);
      const esperado = ESPERADO[caso];
      expect(respuesta.ok).toBe(true);
      expect(respuesta.data?.listo_para_firma).toBe(esperado?.listo);
      expect(respuesta.data?.bloqueos).toEqual(esperado?.bloqueos ?? []);
      expect(respuesta.data?.ruta).toBe(`out/${caso}/paquete`);
      expect(respuesta.data?.checklist.fecha_ejecucion).toBe("2026-09-03");
      for (const archivo of respuesta.data?.archivos ?? []) {
        expect(archivo.startsWith(`out/${caso}/paquete/`)).toBe(true);
      }
    });
  }

  test("el resumen dice LISTO o BLOQUEADO con sus motivos", () => {
    expect(respuestaDe(CO).resumen).toBe(`${CO}: LISTO`);
    expect(respuestaDe(EC).resumen).toBe(`${EC}: BLOQUEADO (ausente: certificado_cumplimiento_tributario)`);
    expect(respuestaDe(HN).resumen).toBe(`${HN}: BLOQUEADO (vencido: parafiscales (2026-08-31))`);
  });

  test("co: paquete/ trae el formulario, los cuatro soportes, el checklist y el borrador, y data.archivos los lista", async () => {
    expect(await archivosPaquete(compartido.raiz, CO)).toEqual(ARCHIVOS_CO);
    expect(respuestaDe(CO).data?.archivos).toEqual(
      ARCHIVOS_CO.map((nombre) => `out/${CO}/paquete/${nombre}`),
    );
  });

  test("las copias de soportes y del formulario son idénticas a su origen", async () => {
    const soportes = join(compartido.raiz, FIXTURES_DIR, "repositorio", "soportes");
    const copia = await readFile(join(carpetaPaquete(compartido.raiz, CO), "rut-2026.txt"));
    expect(copia.equals(await readFile(join(soportes, "rut-2026.txt")))).toBe(true);
    const formulario = await readFile(join(compartido.raiz, "out", CO, "formulario.xlsx"));
    const copiaFormulario = await readFile(join(carpetaPaquete(compartido.raiz, CO), "formulario.xlsx"));
    expect(copiaFormulario.equals(formulario)).toBe(true);
  });

  test("hn copia el soporte vencido, pa copia valores-portal.md y ec copia el pdf sin el certificado ausente", async () => {
    expect(await archivosPaquete(compartido.raiz, HN)).toContain("parafiscales-2026-07.txt");
    expect(await archivosPaquete(compartido.raiz, PA)).toContain("valores-portal.md");
    const ec = await archivosPaquete(compartido.raiz, EC);
    expect(ec).toContain("formulario.pdf");
    expect(ec.some((nombre) => nombre.includes("cumplimiento"))).toBe(false);
  });

  test("data.checklist marca la cámara con su aviso y el emisor distinto en hn (D-22, D-23)", () => {
    const soportes = respuestaDe(HN).data?.checklist.soportes ?? [];
    expect(soportes.find((soporte) => soporte.tipo === "camara_comercio")).toEqual({
      tipo: "camara_comercio",
      estado: "presente",
      vigencia_hasta: "2026-09-30",
      archivo: "camara-comercio-2026-08.txt",
      aviso: "vence en 27 días",
      aviso_emisor: AVISO_CO,
    });
    expect(soportes.find((soporte) => soporte.tipo === "parafiscales")?.estado).toBe("vencido");
  });

  test("co checklist.md muestra la fecha, LISTO y el aviso de vencimiento sin aviso de emisor", async () => {
    const checklist = await checklistDe(compartido.raiz, CO);
    expect(checklist).toContain("Fecha de ejecución: 2026-09-03");
    expect(checklist).toContain("Estado: LISTO");
    expect(checklist).toContain("vence en 27 días");
    expect(checklist).not.toContain(AVISO_CO);
    expect(checklist).toContain("- [ ] Revisar el formulario y pasarlo a firma del representante legal");
  });

  test("ec checklist.md muestra el bloqueo, el faltante, el RUC con su nota, el aviso de emisor y casillas", async () => {
    const checklist = await checklistDe(compartido.raiz, EC);
    expect(checklist).toContain("Estado: BLOQUEADO");
    expect(checklist).toContain("- ausente: certificado_cumplimiento_tributario");
    expect(checklist).toContain("certificado_cumplimiento_tributario");
    expect(checklist).toContain("Número de contribuyente especial");
    expect(checklist).toContain(`- RUC: ${NOTA_RUC}`);
    expect(checklist).toContain(AVISO_CO);
    expect(checklist.split("\n").filter((linea) => linea.startsWith("- [ ]")).length).toBeGreaterThan(1);
    expect(checklist).toContain("| Tipo | Archivo | Vigencia | Estado | Aviso | País emisor |");
  });

  test("hn checklist.md marca parafiscales vencido y pide renovarlo", async () => {
    const checklist = await checklistDe(compartido.raiz, HN);
    expect(checklist).toContain("| parafiscales | parafiscales-2026-07.txt | 2026-08-31 | vencido |");
    expect(checklist).toContain("- [ ] Renovar el soporte parafiscales, vencido desde 2026-08-31");
  });

  test("armar_paquete sin formulario generado da FORMULARIO_NO_GENERADO y no crea paquete/ (D-10)", async () => {
    const proyecto = await nuevoProyecto();
    const respuesta = await armar(proyecto.raiz, CO);
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("FORMULARIO_NO_GENERADO");
    expect(respuesta.error?.startsWith("Primero genera el formulario")).toBe(true);
    expect(existsSync(carpetaPaquete(proyecto.raiz, CO))).toBe(false);
  });

  test("armar_paquete con la carpeta de soportes ilegible da DATOS_INVALIDOS y no inventa ausencias (IN-08)", async () => {
    const proyecto = await nuevoProyecto();
    await generarCaso(herramientas, ctx(proyecto.raiz), CO);
    const soportes = join(proyecto.raiz, FIXTURES_DIR, "repositorio", "soportes");
    await chmod(soportes, 0o300);
    try {
      const respuesta = await armar(proyecto.raiz, CO);
      expect(respuesta.ok).toBe(false);
      expect(respuesta.codigo).toBe("DATOS_INVALIDOS");
    } finally {
      await chmod(soportes, 0o755);
    }
  });

  test("armar_paquete recrea paquete/ vacío y quita archivos ajenos", async () => {
    const proyecto = await nuevoProyecto();
    await generarCaso(herramientas, ctx(proyecto.raiz), CO);
    await armar(proyecto.raiz, CO);
    await writeFile(join(carpetaPaquete(proyecto.raiz, CO), "ajeno.txt"), "x");
    const respuesta = await armar(proyecto.raiz, CO);
    expect(respuesta.ok).toBe(true);
    expect(await archivosPaquete(proyecto.raiz, CO)).toEqual(ARCHIVOS_CO);
  });

  test("dos armar_paquete concurrentes sobre co responden ok y dejan un solo juego de archivos (T-01-18)", async () => {
    const proyecto = await nuevoProyecto();
    await generarCaso(herramientas, ctx(proyecto.raiz), CO);
    const [primera, segunda] = await Promise.all([armar(proyecto.raiz, CO), armar(proyecto.raiz, CO)]);
    expect(primera?.ok).toBe(true);
    expect(segunda?.ok).toBe(true);
    expect(primera?.data?.archivos).toEqual(segunda?.data?.archivos ?? []);
    expect(await archivosPaquete(proyecto.raiz, CO)).toEqual(ARCHIVOS_CO);
  });

  test("cada llamada agrega una línea a out/log.jsonl y a out/<caso>/log.jsonl con un resumen sin valores (SEG-04)", async () => {
    const proyecto = await nuevoProyecto();
    await generarCaso(herramientas, ctx(proyecto.raiz), EC);
    const global = join(proyecto.raiz, "out", "log.jsonl");
    const delCaso = join(proyecto.raiz, "out", EC, "log.jsonl");
    const antes = { global: await lineasDe(global), caso: await lineasDe(delCaso) };
    await armar(proyecto.raiz, EC);
    expect(await lineasDe(global)).toBe(antes.global + 1);
    expect(await lineasDe(delCaso)).toBe(antes.caso + 1);
    const lineas = (await readFile(delCaso, "utf8")).trim().split("\n");
    const ultima = JSON.parse(lineas[lineas.length - 1] ?? "{}");
    expect(ultima.herramienta).toBe("proveedor_armar_paquete");
    expect(ultima.ok).toBe(true);
    expect(ultima.resumen).toBe(`${EC}: BLOQUEADO (ausente: certificado_cumplimiento_tributario)`);
  });
});
