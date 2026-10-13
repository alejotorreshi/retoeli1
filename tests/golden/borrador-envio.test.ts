import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { generarCaso } from "@tests/helpers/flujo.helper.ts";
import { copiarConocimiento, crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ConocimientoTemporal, ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { FIXTURES_DIR } from "@/config/constants/files.constants.ts";
import { crearHerramientas } from "@/tools/factories/herramientas.factory.ts";

const CO = "co-industrias-delta";
const EC = "ec-corp-andina";
const HN = "hn-agroexport-sula";
const PA = "pa-logistica-istmo";
const CASOS = [CO, EC, HN, PA] as const;
const NOTA_EXTRANJERO = "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano";
const PREGUNTA_POR_CONFIRMAR = "Antes de la firma necesitamos que nos confirmen estos campos:";
const FIRMA_LISTA = "El formulario queda listo para la firma de nuestro representante legal.";
const FIRMA_TRAS_CONFIRMAR =
  "Con su confirmación pasaremos el formulario a la firma de nuestro representante legal.";
const FIRMA_BLOQUEADA =
  "El formulario todavía no está listo para la firma de nuestro representante legal: falta completar los pendientes indicados.";
const PROHIBIDOS = ["Bancolombia", "Ahorros", "03100012345", "COLOCOBM", "900123456", "71555123"];

type Respuesta = {
  readonly ok: boolean;
  readonly data?: {
    readonly archivos?: readonly string[];
    readonly checklist?: { readonly soportes: readonly { readonly aviso_emisor: string | null }[] };
  };
  readonly error?: string;
  readonly codigo?: string;
};

type Herramientas = ReturnType<typeof crearHerramientas>;

const herramientas = crearHerramientas();
const proyectos: ProyectoTemporal[] = [];
const conocimientos: ConocimientoTemporal[] = [];
const fechaPrevia = process.env.FECHA_EJECUCION;
let compartido: ProyectoTemporal;

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

function ctx(raiz: string) {
  return { directory: raiz, sessionId: "golden-borrador" };
}

async function armar(conjunto: Herramientas, raiz: string, caso: string): Promise<Respuesta> {
  return JSON.parse(await conjunto.armar_paquete.execute({ caso }, ctx(raiz)));
}

function rutaPaquete(raiz: string, caso: string, archivo: string): string {
  return join(raiz, "out", caso, "paquete", archivo);
}

function leerPaquete(raiz: string, caso: string, archivo: string): Promise<string> {
  return readFile(rutaPaquete(raiz, caso, archivo), "utf8");
}

function prohibidosEn(texto: string): string[] {
  return PROHIBIDOS.filter((prohibido) => texto.includes(prohibido));
}

beforeAll(async () => {
  process.env.FECHA_EJECUCION = "2026-09-03";
  compartido = await nuevoProyecto();
  for (const caso of CASOS) {
    const flujo = await generarCaso(herramientas, ctx(compartido.raiz), caso);
    if (!flujo.respuesta.ok) throw new Error(`generar_formulario falló para ${caso}`);
    const respuesta = await armar(herramientas, compartido.raiz, caso);
    if (!respuesta.ok) throw new Error(`armar_paquete falló para ${caso}`);
  }
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await Promise.all([
    ...proyectos.map((proyecto) => proyecto.limpiar()),
    ...conocimientos.map((conocimiento) => conocimiento.limpiar()),
  ]);
});

describe("golden: borrador-correo.md y ENVIO-SIMULADO.md (PAQ-04, ENV-01, D-25, D-26, RN2)", () => {
  test("co responde al cliente y lo firma la analista con la razón social del maestro", async () => {
    const borrador = await leerPaquete(compartido.raiz, CO, "borrador-correo.md");
    const lineas = borrador.split("\n");
    expect(lineas[0]).toBe("Para: compras@industrias-delta-ficticia.com");
    expect(lineas[1]).toBe("Asunto: RE: Solicitud de registro como proveedor - Periferia IT Group");
    expect(borrador).toContain("Industrias Delta S.A.S.");
    expect(borrador).toContain("formulario.xlsx");
    expect(borrador).toContain("- Registro Único Tributario (rut-2026.txt)");
    expect(borrador).toContain("Camila Ortiz Vélez");
    expect(borrador).toContain("Analista Administrativa");
    expect(borrador).toContain("Periferia IT Group S.A.S.");
    expect(borrador).not.toContain("Quedan pendientes");
  });

  test("co borrador-correo.md y checklist.md no traen datos bancarios ni identificaciones", async () => {
    for (const archivo of ["borrador-correo.md", "checklist.md"]) {
      expect(prohibidosEn(await leerPaquete(compartido.raiz, CO, archivo))).toEqual([]);
    }
  });

  test("ningún borrador de los cuatro casos trae datos bancarios", async () => {
    for (const caso of CASOS) {
      expect(prohibidosEn(await leerPaquete(compartido.raiz, caso, "borrador-correo.md"))).toEqual([]);
    }
  });

  test("ec lista los pendientes y no anuncia como adjunto el certificado ausente", async () => {
    const borrador = await leerPaquete(compartido.raiz, EC, "borrador-correo.md");
    expect(borrador).toContain("Quedan pendientes:");
    expect(borrador).toContain("- Certificado de cumplimiento tributario\n");
    expect(borrador).toContain("- Número de contribuyente especial\n");
    expect(borrador).toContain("Los enviaremos por separado.");
    expect(borrador).toContain("formulario.pdf");
    expect(borrador).not.toContain("Certificado de cumplimiento tributario (");
  });

  test("hn anuncia el soporte vencido como pendiente y no como adjunto", async () => {
    const borrador = await leerPaquete(compartido.raiz, HN, "borrador-correo.md");
    expect(borrador).toContain(
      "- Certificación de aportes parafiscales (soporte vencido, enviaremos la versión actualizada)",
    );
    expect(borrador).not.toContain("parafiscales-2026-07.txt");
  });

  test("co adjunta el formulario y queda listo para la firma del representante legal", async () => {
    const borrador = await leerPaquete(compartido.raiz, CO, "borrador-correo.md");
    expect(borrador).toContain(
      "Adjuntamos el formulario de registro como proveedor (formulario.xlsx) y los siguientes soportes:",
    );
    expect(borrador).toContain(FIRMA_LISTA);
    expect(borrador).not.toContain(FIRMA_TRAS_CONFIRMAR);
    expect(borrador).not.toContain(FIRMA_BLOQUEADA);
    expect(borrador).not.toContain(PREGUNTA_POR_CONFIRMAR);
  });

  test("ec pregunta por el RUC y dice que el formulario todavía no está listo para la firma", async () => {
    const borrador = await leerPaquete(compartido.raiz, EC, "borrador-correo.md");
    expect(borrador).toContain(PREGUNTA_POR_CONFIRMAR);
    expect(borrador).toContain(`- RUC: ${NOTA_EXTRANJERO}\n`);
    expect(borrador).toContain(FIRMA_BLOQUEADA);
    expect(borrador).not.toContain(FIRMA_LISTA);
  });

  test("hn pregunta por el RTN y dice que el formulario todavía no está listo para la firma", async () => {
    const borrador = await leerPaquete(compartido.raiz, HN, "borrador-correo.md");
    expect(borrador).toContain(`- RTN: ${NOTA_EXTRANJERO}\n`);
    expect(borrador).toContain(FIRMA_BLOQUEADA);
    expect(borrador).not.toContain(FIRMA_LISTA);
  });

  test("pa explica el portal, pregunta por el RUC y no menciona el archivo de valores", async () => {
    const borrador = await leerPaquete(compartido.raiz, PA, "borrador-correo.md");
    expect(borrador).toContain("El formulario de registro como proveedor se diligencia en su portal.");
    expect(borrador).toContain(`- RUC: ${NOTA_EXTRANJERO}\n`);
    expect(borrador).toContain(FIRMA_TRAS_CONFIRMAR);
    expect(borrador).not.toContain(FIRMA_LISTA);
    expect(borrador).not.toContain("valores-portal.md");
    expect(borrador).not.toContain("Adjuntamos el formulario");
  });

  test("ningún borrador de los cuatro casos afirma que el formulario está firmado (GC-1)", async () => {
    for (const caso of CASOS) {
      expect(await leerPaquete(compartido.raiz, caso, "borrador-correo.md")).not.toMatch(/firmad[oa]/i);
    }
  });

  test("ENVIO-SIMULADO.md de co confirmado no trae datos bancarios ni identificaciones (RN2)", async () => {
    const crudo = await herramientas.simular_envio.execute(
      { caso: CO, confirmado: true },
      ctx(compartido.raiz),
    );
    expect(JSON.parse(crudo).ok).toBe(true);
    const registro = await readFile(join(compartido.raiz, "out", CO, "ENVIO-SIMULADO.md"), "utf8");
    expect(registro).toContain("Destinatario: compras@industrias-delta-ficticia.com");
    expect(prohibidosEn(registro)).toEqual([]);
    expect(prohibidosEn(crudo)).toEqual([]);
  });

  test("ENVIO-SIMULADO.md de hn no envía el soporte vencido que el borrador anuncia como pendiente (WR-06)", async () => {
    const crudo = await herramientas.simular_envio.execute(
      { caso: HN, confirmado: true },
      ctx(compartido.raiz),
    );
    expect(JSON.parse(crudo).ok).toBe(true);
    const registro = await readFile(join(compartido.raiz, "out", HN, "ENVIO-SIMULADO.md"), "utf8");
    const [enviados = "", retenidos = ""] = registro.split("## Soportes vencidos que no se envían");
    expect(enviados).toContain("- paquete/formulario.xlsx");
    expect(enviados).not.toContain("parafiscales-2026-07.txt");
    expect(retenidos).toContain("- paquete/parafiscales-2026-07.txt");
    expect(existsSync(rutaPaquete(compartido.raiz, HN, "parafiscales-2026-07.txt"))).toBe(true);
  });

  test("el borrador es texto plano y no escapa la barra vertical de la razón social (IN-02)", async () => {
    const proyecto = await nuevoProyecto();
    const rutaMaestro = join(proyecto.raiz, FIXTURES_DIR, "repositorio", "maestro.json");
    const maestro = JSON.parse(await readFile(rutaMaestro, "utf8"));
    await writeFile(rutaMaestro, JSON.stringify({ ...maestro, razon_social: "Periferia | IT Group" }));
    await generarCaso(herramientas, ctx(proyecto.raiz), CO);
    expect((await armar(herramientas, proyecto.raiz, CO)).ok).toBe(true);
    const borrador = await leerPaquete(proyecto.raiz, CO, "borrador-correo.md");
    expect(borrador.trimEnd().endsWith("\nPeriferia | IT Group")).toBe(true);
    expect(borrador).not.toContain("\\|");
  });

  test("una plantilla editada con {{banco.numero_cuenta}} da REGLAS_INVALIDAS y no escribe el borrador", async () => {
    const conocimiento = await nuevoConocimiento();
    const plantilla = join(conocimiento.directorio, "plantillas", "borrador-correo.md");
    await writeFile(plantilla, `${await readFile(plantilla, "utf8")}\nCuenta: {{banco.numero_cuenta}}\n`);
    const editadas = crearHerramientas({ directorioConocimiento: conocimiento.directorio });
    const proyecto = await nuevoProyecto();
    await generarCaso(editadas, ctx(proyecto.raiz), CO);
    const respuesta = await armar(editadas, proyecto.raiz, CO);
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe("REGLAS_INVALIDAS");
    expect(JSON.stringify(respuesta)).not.toContain("03100012345");
    expect(existsSync(rutaPaquete(proyecto.raiz, CO, "borrador-correo.md"))).toBe(false);
  });

  test("un texto de aviso cambiado en reglas.json aparece en la siguiente salida sin tocar código (D-28)", async () => {
    const conocimiento = await nuevoConocimiento();
    const rutaReglas = join(conocimiento.directorio, "reglas.json");
    const reglas = JSON.parse(await readFile(rutaReglas, "utf8"));
    reglas.soportes.aviso_emisor_distinto = "Soporte de {{pais_emisor}}: validar aceptación con el cliente";
    await writeFile(rutaReglas, JSON.stringify(reglas));
    const editadas = crearHerramientas({ directorioConocimiento: conocimiento.directorio });
    const proyecto = await nuevoProyecto();
    await generarCaso(editadas, ctx(proyecto.raiz), EC);
    const respuesta = await armar(editadas, proyecto.raiz, EC);
    const nuevo = "Soporte de CO: validar aceptación con el cliente";
    expect(respuesta.ok).toBe(true);
    expect(respuesta.data?.checklist?.soportes.some((soporte) => soporte.aviso_emisor === nuevo)).toBe(true);
    expect(await leerPaquete(proyecto.raiz, EC, "checklist.md")).toContain(nuevo);
  });
});
