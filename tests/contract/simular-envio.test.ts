import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative } from "node:path";
import { generarCaso } from "@tests/helpers/flujo.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { FIXTURES_DIR, INDICE_SOPORTES, SOPORTES_DIR } from "@/config/constants/files.constants.ts";
import { crearHerramientas } from "@/tools/factories/herramientas.factory.ts";

const CO = "co-industrias-delta";
const EC = "ec-corp-andina";
const HN = "hn-agroexport-sula";
const PA = "pa-logistica-istmo";
const INICIO_ENVIADOS = "## Archivos que se envían";
const FIN_ENVIADOS = "## Soportes vencidos que no se envían";
const INTERNOS = ["checklist.md", "borrador-correo.md"];
const FRASE_PORTAL =
  "El formulario se diligencia en el portal del cliente: paquete/valores-portal.md queda como guía de valores para la analista y no se envía.";
const ENVIADOS_ESPERADOS: Readonly<Record<string, readonly string[]>> = {
  [CO]: [
    "camara-comercio-2026-08.txt",
    "certificacion-bancaria-2026-08.txt",
    "estados-financieros-2025.txt",
    "formulario.xlsx",
    "rut-2026.txt",
  ],
  [EC]: [
    "camara-comercio-2026-08.txt",
    "certificacion-bancaria-2026-08.txt",
    "estados-financieros-2025.txt",
    "formulario.pdf",
    "rut-2026.txt",
  ],
  [HN]: ["camara-comercio-2026-08.txt", "formulario.xlsx", "rut-2026.txt"],
  [PA]: ["camara-comercio-2026-08.txt", "rut-2026.txt"],
};
const LITERAL = "requiere confirmación explícita";
const BLOQUEO_EC = "ausente: certificado_cumplimiento_tributario";
const LINEA_BLOQUEO_EC = "- ausente: Certificado de cumplimiento tributario";
const LINEA_BLOQUEO_HN = "- vencido: Certificación de aportes parafiscales (2026-08-31)";
const BLOQUEOS_VIGENTES = "## Bloqueos vigentes al confirmar";
const RENOVADO_HN = {
  tipo: "parafiscales",
  archivo: "parafiscales-2026-09.txt",
  vigencia_hasta: "2026-12-31",
  pais_emisor: "CO",
};

type RespuestaEnvio = {
  readonly ok: boolean;
  readonly data?: { readonly ruta: string; readonly bloqueos: readonly string[] };
  readonly error?: string;
  readonly codigo?: string;
  readonly parcial?: unknown;
  readonly resumen?: string;
};

const herramientas = crearHerramientas();
const proyectos: ProyectoTemporal[] = [];
const fechaPrevia = process.env.FECHA_EJECUCION;

async function nuevoProyecto(): Promise<ProyectoTemporal> {
  const proyecto = await crearProyectoTemporal();
  proyectos.push(proyecto);
  return proyecto;
}

function ctx(raiz: string) {
  return { directory: raiz, sessionId: "contrato-envio" };
}

async function simular(raiz: string, args: unknown): Promise<RespuestaEnvio> {
  return JSON.parse(await herramientas.simular_envio.execute(args, ctx(raiz)));
}

async function armado(caso: string): Promise<ProyectoTemporal> {
  const proyecto = await nuevoProyecto();
  await generarCaso(herramientas, ctx(proyecto.raiz), caso);
  const respuesta = JSON.parse(await herramientas.armar_paquete.execute({ caso }, ctx(proyecto.raiz)));
  if (respuesta.ok !== true) throw new Error(`armar_paquete falló para ${caso}`);
  return proyecto;
}

function diferencias(parcial: {
  readonly archivos_faltantes?: readonly string[];
  readonly archivos_sobrantes?: readonly string[];
  readonly archivos_desactualizados?: readonly string[];
}) {
  return { archivos_faltantes: [], archivos_sobrantes: [], archivos_desactualizados: [], ...parcial };
}

async function rechazado(proyecto: ProyectoTemporal, caso: string): Promise<RespuestaEnvio> {
  const respuesta = await simular(proyecto.raiz, { caso, confirmado: true });
  expect(respuesta.ok).toBe(false);
  expect(respuesta.codigo).toBe("PAQUETE_DESACTUALIZADO");
  expect(respuesta.error).toContain("proveedor_armar_paquete");
  expect(existsSync(envioSimulado(proyecto.raiz, caso))).toBe(false);
  return respuesta;
}

async function rearmar(proyecto: ProyectoTemporal, caso: string): Promise<void> {
  const respuesta = JSON.parse(await herramientas.armar_paquete.execute({ caso }, ctx(proyecto.raiz)));
  expect(respuesta.ok).toBe(true);
}

async function editarIndice(
  proyecto: ProyectoTemporal,
  editar: (indice: readonly { readonly tipo: string }[]) => readonly unknown[],
): Promise<void> {
  const ruta = join(proyecto.raiz, FIXTURES_DIR, SOPORTES_DIR, INDICE_SOPORTES);
  await writeFile(ruta, JSON.stringify(editar(JSON.parse(await readFile(ruta, "utf8")))));
}

function envioSimulado(raiz: string, caso: string): string {
  return join(raiz, "out", caso, "ENVIO-SIMULADO.md");
}

async function archivosBajo(directorio: string): Promise<string[]> {
  const entradas = await readdir(directorio, { recursive: true, withFileTypes: true });
  return entradas
    .filter((entrada) => entrada.isFile())
    .map((entrada) => relative(directorio, join(entrada.parentPath, entrada.name)))
    .sort();
}

function enviadosDe(registro: string): string[] {
  const inicio = registro.indexOf(INICIO_ENVIADOS);
  const fin = registro.indexOf(FIN_ENVIADOS);
  return registro
    .slice(inicio, fin)
    .split("\n")
    .filter((linea) => linea.startsWith("- paquete/"))
    .map((linea) => linea.slice("- paquete/".length));
}

async function confirmarYLeer(proyecto: ProyectoTemporal, caso: string): Promise<string> {
  const respuesta = await simular(proyecto.raiz, { caso, confirmado: true });
  if (respuesta.ok !== true) throw new Error(`simular_envio falló para ${caso}`);
  return readFile(envioSimulado(proyecto.raiz, caso), "utf8");
}

async function lineasDe(ruta: string): Promise<number> {
  if (!existsSync(ruta)) return 0;
  return (await readFile(ruta, "utf8")).split("\n").filter((linea) => linea !== "").length;
}

beforeAll(() => {
  process.env.FECHA_EJECUCION = "2026-09-03";
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
});

describe("contrato: proveedor_simular_envio (ENV-01, D-13, RN4)", () => {
  test("confirmado false responde exactamente CONFIRMACION_REQUERIDA y no escribe ENVIO-SIMULADO.md", async () => {
    const proyecto = await armado(CO);
    const crudo = await herramientas.simular_envio.execute(
      { caso: CO, confirmado: false },
      ctx(proyecto.raiz),
    );
    const respuesta: RespuestaEnvio = JSON.parse(crudo);
    expect(respuesta.ok).toBe(false);
    expect(respuesta.error).toBe(LITERAL);
    expect(Buffer.from(respuesta.error ?? "").equals(Buffer.from(LITERAL))).toBe(true);
    expect(respuesta.codigo).toBe("CONFIRMACION_REQUERIDA");
    expect(existsSync(envioSimulado(proyecto.raiz, CO))).toBe(false);
  });

  test("sin la clave confirmado también responde CONFIRMACION_REQUERIDA con el mismo literal", async () => {
    const proyecto = await armado(CO);
    const respuesta = await simular(proyecto.raiz, { caso: CO });
    expect(respuesta.ok).toBe(false);
    expect(respuesta.error).toBe(LITERAL);
    expect(respuesta.codigo).toBe("CONFIRMACION_REQUERIDA");
    expect(existsSync(envioSimulado(proyecto.raiz, CO))).toBe(false);
  });

  test('confirmado como texto "true" da ARGS_INVALIDOS', async () => {
    const proyecto = await armado(CO);
    const respuesta = await simular(proyecto.raiz, { caso: CO, confirmado: "true" });
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("ARGS_INVALIDOS");
    expect(existsSync(envioSimulado(proyecto.raiz, CO))).toBe(false);
  });

  test("el caso se valida antes que la confirmación", async () => {
    const proyecto = await nuevoProyecto();
    expect((await simular(proyecto.raiz, { caso: "../etc", confirmado: false })).codigo).toBe(
      "CASO_INVALIDO",
    );
    expect((await simular(proyecto.raiz, { caso: "zz-no-existe", confirmado: false })).codigo).toBe(
      "CASO_NO_ENCONTRADO",
    );
  });

  test("confirmado true antes de armar_paquete da PAQUETE_NO_ARMADO", async () => {
    const proyecto = await nuevoProyecto();
    await generarCaso(herramientas, ctx(proyecto.raiz), CO);
    const respuesta = await simular(proyecto.raiz, { caso: CO, confirmado: true });
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("PAQUETE_NO_ARMADO");
    expect(respuesta.error).toBe("Primero arma el paquete del caso con proveedor_armar_paquete.");
    expect(existsSync(envioSimulado(proyecto.raiz, CO))).toBe(false);
  });

  test("ec confirmado registra los bloqueos vigentes y solo agrega ENVIO-SIMULADO.md", async () => {
    const proyecto = await armado(EC);
    const carpeta = join(proyecto.raiz, "out", EC);
    const antes = await archivosBajo(carpeta);
    const respuesta = await simular(proyecto.raiz, { caso: EC, confirmado: true });
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data?.ruta).toBe(`out/${EC}/ENVIO-SIMULADO.md`);
    expect(respuesta.data?.bloqueos).toEqual([BLOQUEO_EC]);
    expect(respuesta.resumen).toBe(`${EC}: envío simulado registrado con bloqueos (${BLOQUEO_EC})`);
    const despues = await archivosBajo(carpeta);
    expect(despues.filter((archivo) => !antes.includes(archivo))).toEqual(["ENVIO-SIMULADO.md"]);
    const registro = await readFile(envioSimulado(proyecto.raiz, EC), "utf8");
    const [, bloqueos = ""] = registro.split(BLOQUEOS_VIGENTES);
    expect(bloqueos).toContain(LINEA_BLOQUEO_EC);
    expect(registro).not.toContain("certificado_cumplimiento_tributario");
    expect(registro).toContain("Fecha de ejecución: 2026-09-03");
    expect(registro).toContain("No se envió ningún correo real");
    expect(registro).toContain("Confirmado explícitamente por la usuaria");
    expect(registro).not.toContain("- paquete/checklist.md");
  });

  for (const caso of [CO, EC, HN, PA]) {
    test(`${caso} confirmado lista como enviados solo el formulario y los soportes presentes (GC-3)`, async () => {
      const proyecto = await armado(caso);
      const enviados = enviadosDe(await confirmarYLeer(proyecto, caso));
      expect(enviados).toEqual([...(ENVIADOS_ESPERADOS[caso] ?? [])]);
      for (const interno of INTERNOS) expect(enviados).not.toContain(interno);
      const paquete = await readdir(join(proyecto.raiz, "out", caso, "paquete"));
      for (const interno of INTERNOS) expect(paquete).toContain(interno);
    });
  }

  test("pa confirmado explica que valores-portal.md es la guía de la analista y no lo lista como enviado", async () => {
    const proyecto = await armado(PA);
    const registro = await confirmarYLeer(proyecto, PA);
    expect(registro).toContain(FRASE_PORTAL);
    expect(registro).not.toContain("- paquete/valores-portal.md");
    expect(enviadosDe(registro)).not.toContain("valores-portal.md");
  });

  test("xlsx y pdf no traen la frase del portal", async () => {
    for (const caso of [CO, EC]) {
      const proyecto = await armado(caso);
      expect(await confirmarYLeer(proyecto, caso)).not.toContain("se diligencia en el portal");
    }
  });

  test("un soporte borrado de paquete/ rechaza el envío con PAQUETE_DESACTUALIZADO y no escribe el registro (CR-01)", async () => {
    const proyecto = await armado(CO);
    await rm(join(proyecto.raiz, "out", CO, "paquete", "rut-2026.txt"));
    const respuesta = await simular(proyecto.raiz, { caso: CO, confirmado: true });
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("PAQUETE_DESACTUALIZADO");
    expect(respuesta.error).toContain("proveedor_armar_paquete");
    expect(respuesta.parcial).toEqual(diferencias({ archivos_faltantes: ["rut-2026.txt"] }));
    expect(respuesta.resumen).toBe("simular_envio: PAQUETE_DESACTUALIZADO");
    expect(existsSync(envioSimulado(proyecto.raiz, CO))).toBe(false);
  });

  test("el formulario borrado de paquete/ también rechaza el envío (CR-01)", async () => {
    const proyecto = await armado(PA);
    await rm(join(proyecto.raiz, "out", PA, "paquete", "valores-portal.md"));
    const respuesta = await simular(proyecto.raiz, { caso: PA, confirmado: true });
    expect(respuesta.codigo).toBe("PAQUETE_DESACTUALIZADO");
    expect(respuesta.parcial).toEqual(diferencias({ archivos_faltantes: ["valores-portal.md"] }));
    expect(existsSync(envioSimulado(proyecto.raiz, PA))).toBe(false);
  });

  test("un soporte renovado entre armar_paquete y simular_envio rechaza el envío hasta volver a armar (CR-01)", async () => {
    const proyecto = await armado(HN);
    const soportes = join(proyecto.raiz, FIXTURES_DIR, SOPORTES_DIR);
    const indice = JSON.parse(await readFile(join(soportes, INDICE_SOPORTES), "utf8"));
    indice.push({ ...RENOVADO_HN, descripcion: "Renovación ficticia" });
    await writeFile(join(soportes, INDICE_SOPORTES), JSON.stringify(indice));
    await writeFile(join(soportes, RENOVADO_HN.archivo), "soporte ficticio renovado\n");
    const respuesta = await simular(proyecto.raiz, { caso: HN, confirmado: true });
    expect(respuesta.codigo).toBe("PAQUETE_DESACTUALIZADO");
    expect(respuesta.parcial).toEqual(
      diferencias({
        archivos_faltantes: [RENOVADO_HN.archivo],
        archivos_sobrantes: ["parafiscales-2026-07.txt"],
        archivos_desactualizados: ["borrador-correo.md"],
      }),
    );
    expect(existsSync(envioSimulado(proyecto.raiz, HN))).toBe(false);
    const rearmado = JSON.parse(await herramientas.armar_paquete.execute({ caso: HN }, ctx(proyecto.raiz)));
    expect(rearmado.ok).toBe(true);
    const registro = await confirmarYLeer(proyecto, HN);
    expect(enviadosDe(registro)).toContain(RENOVADO_HN.archivo);
    expect(registro).not.toContain("parafiscales-2026-07.txt");
  });

  test("un soporte que vence entre armar_paquete y simular_envio rechaza el envío por el borrador viejo (CR-01)", async () => {
    const proyecto = await armado(CO);
    const borrador = join(proyecto.raiz, "out", CO, "paquete", "borrador-correo.md");
    expect(await readFile(borrador, "utf8")).toContain("queda listo para la firma");
    process.env.FECHA_EJECUCION = "2026-10-05";
    try {
      const respuesta = await rechazado(proyecto, CO);
      expect(respuesta.parcial).toEqual(diferencias({ archivos_desactualizados: ["borrador-correo.md"] }));
      await rearmar(proyecto, CO);
      expect(await readFile(borrador, "utf8")).not.toContain("queda listo para la firma");
      const registro = await confirmarYLeer(proyecto, CO);
      expect(registro.split(FIN_ENVIADOS)[1]).toContain("- paquete/camara-comercio-2026-08.txt");
    } finally {
      process.env.FECHA_EJECUCION = "2026-09-03";
    }
  });

  test("un soporte que sale del índice después de armar deja su archivo como sobrante y rechaza el envío (CR-01)", async () => {
    const proyecto = await armado(CO);
    await editarIndice(proyecto, (indice) => indice.filter((entrada) => entrada.tipo !== "rut"));
    const respuesta = await rechazado(proyecto, CO);
    expect(respuesta.parcial).toEqual(
      diferencias({ archivos_sobrantes: ["rut-2026.txt"], archivos_desactualizados: ["borrador-correo.md"] }),
    );
    await rearmar(proyecto, CO);
    const respuestaRearmada = await simular(proyecto.raiz, { caso: CO, confirmado: true });
    expect(respuestaRearmada.ok).toBe(true);
    expect(respuestaRearmada.data?.bloqueos).toEqual(["ausente: rut"]);
    expect(existsSync(join(proyecto.raiz, "out", CO, "paquete", "rut-2026.txt"))).toBe(false);
  });

  test("un archivo ajeno dejado en paquete/ rechaza el envío como sobrante (CR-01)", async () => {
    const proyecto = await armado(CO);
    await writeFile(join(proyecto.raiz, "out", CO, "paquete", "notas.txt"), "nota suelta\n");
    const respuesta = await rechazado(proyecto, CO);
    expect(respuesta.parcial).toEqual(diferencias({ archivos_sobrantes: ["notas.txt"] }));
  });

  test("un .DS_Store que deja Finder en paquete/ no bloquea el envío", async () => {
    const proyecto = await armado(CO);
    await writeFile(join(proyecto.raiz, "out", CO, "paquete", ".DS_Store"), "");
    const respuesta = await simular(proyecto.raiz, { caso: CO, confirmado: true });
    expect(respuesta.ok).toBe(true);
  });

  test("borrador-correo.md borrado de paquete/ rechaza el envío como faltante (CR-01)", async () => {
    const proyecto = await armado(EC);
    await rm(join(proyecto.raiz, "out", EC, "paquete", "borrador-correo.md"));
    const respuesta = await rechazado(proyecto, EC);
    expect(respuesta.parcial).toEqual(diferencias({ archivos_faltantes: ["borrador-correo.md"] }));
  });

  test("un paquete recién armado y sin cambios se envía aunque se confirme dos veces (CR-01)", async () => {
    const proyecto = await armado(HN);
    expect((await simular(proyecto.raiz, { caso: HN, confirmado: true })).ok).toBe(true);
    expect((await simular(proyecto.raiz, { caso: HN, confirmado: true })).ok).toBe(true);
  });

  test("hn deja el soporte vencido en su sección y en paquete/ (WR-06)", async () => {
    const proyecto = await armado(HN);
    const registro = await confirmarYLeer(proyecto, HN);
    const [, retenidos = ""] = registro.split(FIN_ENVIADOS);
    expect(retenidos).toContain("- paquete/parafiscales-2026-07.txt");
    expect(existsSync(join(proyecto.raiz, "out", HN, "paquete", "parafiscales-2026-07.txt"))).toBe(true);
  });

  test("hn confirmado nombra en español el soporte vencido entre los bloqueos vigentes (GC-2)", async () => {
    const proyecto = await armado(HN);
    const registro = await confirmarYLeer(proyecto, HN);
    const [, bloqueos = ""] = registro.split(BLOQUEOS_VIGENTES);
    expect(bloqueos).toContain(LINEA_BLOQUEO_HN);
  });

  test("co confirmado no exige listo_para_firma y registra Sin bloqueos", async () => {
    const proyecto = await armado(CO);
    const respuesta = await simular(proyecto.raiz, { caso: CO, confirmado: true });
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data?.bloqueos).toEqual([]);
    expect(await readFile(envioSimulado(proyecto.raiz, CO), "utf8")).toContain("Sin bloqueos.");
  });

  test("generar_formulario sobre ec después del envío borra paquete/ y ENVIO-SIMULADO.md (D-12)", async () => {
    const proyecto = await armado(EC);
    await simular(proyecto.raiz, { caso: EC, confirmado: true });
    expect(existsSync(envioSimulado(proyecto.raiz, EC))).toBe(true);
    await generarCaso(herramientas, ctx(proyecto.raiz), EC);
    expect(existsSync(envioSimulado(proyecto.raiz, EC))).toBe(false);
    expect(existsSync(join(proyecto.raiz, "out", EC, "paquete"))).toBe(false);
  });

  test("cada llamada agrega una línea a los dos log.jsonl con un resumen de estados y códigos (SEG-04)", async () => {
    const proyecto = await armado(EC);
    const global = join(proyecto.raiz, "out", "log.jsonl");
    const delCaso = join(proyecto.raiz, "out", EC, "log.jsonl");
    const llamadas = [{ caso: EC, confirmado: false }, { caso: EC }, { caso: EC, confirmado: true }];
    for (const args of llamadas) {
      const antes = { global: await lineasDe(global), caso: await lineasDe(delCaso) };
      await simular(proyecto.raiz, args);
      expect(await lineasDe(global)).toBe(antes.global + 1);
      expect(await lineasDe(delCaso)).toBe(antes.caso + 1);
    }
    const lineas = (await readFile(delCaso, "utf8")).trim().split("\n").slice(-3);
    const entradas = lineas.map((linea) => JSON.parse(linea));
    expect(entradas.map((entrada) => entrada.herramienta)).toEqual([
      "proveedor_simular_envio",
      "proveedor_simular_envio",
      "proveedor_simular_envio",
    ]);
    expect(entradas.map((entrada) => entrada.resumen)).toEqual([
      "simular_envio: CONFIRMACION_REQUERIDA",
      "simular_envio: CONFIRMACION_REQUERIDA",
      `${EC}: envío simulado registrado con bloqueos (${BLOQUEO_EC})`,
    ]);
  });
});
