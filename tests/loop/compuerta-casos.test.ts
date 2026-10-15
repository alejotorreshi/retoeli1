import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { readFile, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { crearAgentePrueba } from "@tests/helpers/agente-prueba.helper.ts";
import { capturarLogs } from "@tests/helpers/bitacora.helper.ts";
import {
  casosConEnvioSimulado,
  confirmaciones,
  errores,
  finDeTurno,
  finesDeHerramienta,
  lineasDeEnvio,
  textoFinal,
} from "@tests/helpers/eventos.helper.ts";
import { historialIntegro } from "@tests/helpers/historial.helper.ts";
import {
  llamar,
  pasoGenerarConMapeo,
  respuestaHerramientas,
  respuestaTexto,
} from "@tests/helpers/llm-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { AgentePrueba } from "@tests/helpers/types/agente-prueba.type.ts";
import type { PasoLlmFalso } from "@tests/helpers/types/llm-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { CargarInstrucciones } from "@/application/types/puertos-agente.type.ts";
import {
  ACCION,
  CODIGO_AGENTE,
  EVENTO_BITACORA,
  MOTIVO_FIN,
  TIPO_EVENTO,
} from "@/config/constants/agent.constants.ts";
import {
  DECISION_CONFIRMACION,
  DESENLACE_ENVIO,
  ESTADO_COMPUERTA,
  TIPO_ACCION,
} from "@/config/constants/confirmation.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import {
  ARCHIVO_BITACORA,
  ARCHIVO_PROMPT,
  ARCHIVOS_PAQUETE,
  ARCHIVOS_SALIDA,
  DIRECTORIO_PAQUETE,
  OUT_DIR,
} from "@/config/constants/files.constants.ts";
import { TIPO_ERROR_LLM } from "@/config/constants/llm.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { SALTO_DE_LINEA, SEPARADOR_PARRAFOS } from "@/config/constants/text.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import {
  MENSAJE_AGENTE,
  MENSAJE_ERROR,
  RESUMEN_HERRAMIENTA,
  TEXTO_ENVIO_NO_REGISTRADO,
} from "@/config/strings.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import { cierreConPregunta } from "@/domain/builders/cierre-turno.builder.ts";
import { clasificarConfirmacion } from "@/domain/policies/confirmacion.policy.ts";
import type { CasoPendiente } from "@/domain/types/compuerta.type.ts";
import { cuerpoDeFallo } from "@/domain/utils/respuesta-herramienta.util.ts";
import { createInstructionsLoader } from "@/infra/knowledge/instructions-loader.adapter.ts";
import { createLogger } from "@/infra/logging/logger.adapter.ts";
import type { ErrorLlm, RespuestaLlm } from "@/llm/types/llm.type.ts";
import {
  crearRegistroHerramientas,
  resultadoDeFallo,
} from "@/loop/services/registro-herramientas.service.ts";
import { respuestaDeTurno } from "@/loop/services/respuesta-turno.service.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import type { RegistroHerramientas } from "@/loop/types/turno.type.ts";
import * as proveedor from "@/tools/proveedor.ts";

const EC = "ec-corp-andina";
const CO = "co-industrias-delta";
const BLOQUEO_EC = "ausente: certificado_cumplimiento_tributario";
const PREGUNTA_VARIOS = "¿Cuál caso confirmas para el envío simulado?";
const MARKDOWN = "**Resumen**\n# Estado\n| Campo | Valor |\n|---|---|\n| NIT | ••••3456 |";
const ERROR_SERVIDOR: ErrorLlm = {
  tipo: TIPO_ERROR_LLM.SERVIDOR,
  reintentable: true,
  estado: 503,
  reintentarTrasMs: null,
};

let proyecto: ProyectoTemporal;
let restaurarFecha: () => void;

beforeAll(() => {
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
});

afterAll(() => {
  restaurarFecha();
});

beforeEach(async () => {
  proyecto = await crearProyectoTemporal();
});

afterEach(async () => {
  await proyecto.limpiar();
});

function agente(guion: readonly PasoLlmFalso[]): AgentePrueba {
  return crearAgentePrueba({ raiz: proyecto.raiz, guion });
}

function prepararCaso(caso: string): readonly PasoLlmFalso[] {
  return [
    respuestaHerramientas(llamar(`mapear-${caso}`, HERRAMIENTA.MAPEAR_CAMPOS, { caso, campos: [] })),
    pasoGenerarConMapeo(caso),
  ];
}

function armarCaso(caso: string, texto = `Armé el paquete de ${caso}.`): readonly PasoLlmFalso[] {
  return [
    ...prepararCaso(caso),
    respuestaHerramientas(llamar(`armar-${caso}`, HERRAMIENTA.ARMAR_PAQUETE, { caso })),
    respuestaTexto(texto),
  ];
}

function simular(id: string, args: unknown) {
  return llamar(id, HERRAMIENTA.SIMULAR_ENVIO, args);
}

function enviar(id: string, caso: string): readonly PasoLlmFalso[] {
  return [respuestaHerramientas(simular(id, { caso })), respuestaTexto("Hecho.")];
}

function historialSano(prueba: AgentePrueba): void {
  expect(prueba.llm.pedidos.length).toBeGreaterThan(0);
  for (const pedido of prueba.llm.pedidos) expect(historialIntegro(pedido.mensajes)).toEqual([]);
}

function bloqueada() {
  return expect.objectContaining({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA });
}

function exitosa() {
  return expect.objectContaining({ ok: true });
}

function avisoDe(
  desenlace: Exclude<ValorDe<typeof DESENLACE_ENVIO>, typeof DESENLACE_ENVIO.SIN_CASO>,
  caso: string,
): string {
  return TEXTO_ENVIO_NO_REGISTRADO[desenlace](caso);
}

function casosPorConfirmar(eventos: readonly EventoAgente[]): string[] {
  return confirmaciones(eventos).map(({ caso }) => caso);
}

async function enviosOk(): Promise<number> {
  return (await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok).length;
}

function sinMarkdown(texto: string): void {
  expect(texto).not.toContain("**");
  expect(texto).not.toContain("|");
  expect(texto.split("\n").some((linea) => linea.startsWith("#"))).toBe(false);
}

function terminaPreguntandoPor(texto: string, caso: string): void {
  const ultimo = texto.trimEnd().split("\n\n").at(-1) ?? "";
  expect(ultimo.endsWith("?")).toBe(true);
  expect(ultimo).toContain(caso);
}

describe("D-40: varios paquetes en un turno se confirman de a uno y nombrando el caso", () => {
  test("dos paquetes piden cuál; 'envía' a secas no autoriza; 'envía ec-corp-andina' envía solo ec y co sigue pendiente (D-63.6)", async () => {
    const prueba = agente([
      ...prepararCaso(CO),
      ...prepararCaso(EC),
      respuestaHerramientas(
        llamar("armar-co", HERRAMIENTA.ARMAR_PAQUETE, { caso: CO }),
        llamar("armar-ec", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC }),
      ),
      respuestaTexto("Armé los dos paquetes."),
      ...enviar("simular-1", EC),
      ...enviar("simular-2", EC),
    ]);

    const turno1 = await prueba.turno(`procesa ${CO} y ${EC}`);
    expect(casosPorConfirmar(turno1)).toEqual([CO, EC]);
    expect(textoFinal(turno1).trimEnd().endsWith(PREGUNTA_VARIOS)).toBe(true);
    expect(finDeTurno(turno1).needsConfirmation).toBe(true);

    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([bloqueada()]);
    expect(casosPorConfirmar(turno2)).toEqual([CO, EC]);
    expect(textoFinal(turno2)).toContain(PREGUNTA_VARIOS);
    expect(finDeTurno(turno2).needsConfirmation).toBe(true);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);

    const turno3 = await prueba.turno(`envía ${EC}`);
    expect(finesDeHerramienta(turno3)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect(casosPorConfirmar(turno3)).toEqual([CO]);
    terminaPreguntandoPor(textoFinal(turno3), CO);
    expect(finDeTurno(turno3).needsConfirmation).toBe(true);
    historialSano(prueba);
  });
});

describe("D-42: re-armar el paquete en el turno confirmado revoca la autorización", () => {
  test("armar(ec) y luego simular(ec) con la autorización vigente queda bloqueado y vuelve a preguntar", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(llamar("armar-2", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })),
      respuestaHerramientas(simular("simular-1", { caso: EC })),
      respuestaTexto("Volví a armar el paquete."),
    ]);
    await prueba.turno(`procesa ${EC}`);

    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([bloqueada()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    expect(casosPorConfirmar(turno2)).toEqual([EC]);
    terminaPreguntandoPor(textoFinal(turno2), EC);
    expect(finDeTurno(turno2).needsConfirmation).toBe(true);
    historialSano(prueba);
  });
});

describe("D-63.1: un intento bloqueado sin paquete armado en la sesión no deja nada pendiente", () => {
  test("simular(ec) en una sesión nueva queda bloqueado y needsConfirmation es false", async () => {
    const prueba = agente(enviar("simular-1", EC));
    const eventos = await prueba.turno(`envía ${EC}`);
    expect(finesDeHerramienta(eventos)).toEqual([bloqueada()]);
    expect(confirmaciones(eventos)).toEqual([]);
    expect(finDeTurno(eventos).needsConfirmation).toBe(false);
    expect(textoFinal(eventos)).toBe(
      `Hecho.${SEPARADOR_PARRAFOS}${TEXTO_ENVIO_NO_REGISTRADO[DESENLACE_ENVIO.SIN_PAQUETE](EC)}`,
    );
    expect(await lineasDeEnvio(proyecto.raiz)).toEqual([
      expect.objectContaining({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA, caso: EC }),
    ]);
    historialSano(prueba);
  });
});

describe("G-03-26: un envío que no ocurrió deja el aviso del servidor en la misma respuesta", () => {
  test("escenario A: 'Sí, envía co' en una sesión nueva queda bloqueado y la afirmación del modelo sale seguida del aviso", async () => {
    const afirmacion = `Registré el envío simulado de ${CO}.`;
    const prueba = agente([
      respuestaHerramientas(simular("simular-1", { caso: CO, confirmado: true })),
      respuestaTexto(afirmacion),
    ]);
    const eventos = await prueba.turno(`Sí, envía ${CO}`);
    expect(finesDeHerramienta(eventos)).toEqual([bloqueada()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    expect(confirmaciones(eventos)).toEqual([]);
    expect(finDeTurno(eventos).needsConfirmation).toBe(false);
    const aviso = TEXTO_ENVIO_NO_REGISTRADO[DESENLACE_ENVIO.SIN_PAQUETE](CO);
    expect(textoFinal(eventos)).toBe(`${afirmacion}${SEPARADOR_PARRAFOS}${aviso}`);
    expect(ultimoParrafo(textoFinal(eventos))).toBe(aviso);
    historialSano(prueba);
  });

  test.each([{}, { caso: 7 }, { caso: "" }, { caso: "../x" }, { confirmado: true }])(
    "escenario D: simular_envio con %j no indica un caso legible y la afirmación del modelo sale seguida del aviso SIN_CASO",
    async (argumentos) => {
      const afirmacion = "Registré el envío simulado.";
      const prueba = agente([
        respuestaHerramientas(simular("simular-1", argumentos)),
        respuestaTexto(afirmacion),
      ]);
      const eventos = await prueba.turno("Sí, envíalo");
      expect(finesDeHerramienta(eventos)).toEqual([bloqueada()]);
      expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
      expect(confirmaciones(eventos)).toEqual([]);
      expect(finDeTurno(eventos).needsConfirmation).toBe(false);
      const aviso = TEXTO_ENVIO_NO_REGISTRADO[DESENLACE_ENVIO.SIN_CASO]();
      expect(textoFinal(eventos)).toBe(`${afirmacion}${SEPARADOR_PARRAFOS}${aviso}`);
      historialSano(prueba);
    },
  );

  test("escenario D: dos simular_envio sin caso legible en el mismo turno dejan el aviso SIN_CASO una sola vez", async () => {
    const afirmacion = "Registré los envíos simulados.";
    const prueba = agente([
      respuestaHerramientas(simular("simular-1", {}), simular("simular-2", { caso: "../x" })),
      respuestaTexto(afirmacion),
    ]);
    const eventos = await prueba.turno("Sí, envía todo");
    expect(finesDeHerramienta(eventos)).toEqual([bloqueada(), bloqueada()]);
    expect(finDeTurno(eventos).needsConfirmation).toBe(false);
    expect(textoFinal(eventos)).toBe(
      `${afirmacion}${SEPARADOR_PARRAFOS}${TEXTO_ENVIO_NO_REGISTRADO[DESENLACE_ENVIO.SIN_CASO]()}`,
    );
    historialSano(prueba);
  });

  test("escenario D: el aviso SIN_CASO va después de los avisos de los casos legibles y antes de la pregunta del servidor", async () => {
    const afirmacion = `Registré el envío simulado de ${EC}.`;
    const prueba = agente([
      ...prepararCaso(EC),
      respuestaHerramientas(
        simular("simular-0", {}),
        llamar("armar-1", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC }),
        simular("simular-1", { caso: EC, confirmado: true }),
      ),
      respuestaTexto(afirmacion),
    ]);
    const eventos = await prueba.turno(`procesa ${EC}`);
    expect(finDeTurno(eventos).needsConfirmation).toBe(true);
    const avisos = [
      avisoDe(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC),
      TEXTO_ENVIO_NO_REGISTRADO[DESENLACE_ENVIO.SIN_CASO](),
    ].join(SALTO_DE_LINEA);
    expect(textoFinal(eventos)).toBe(
      `${afirmacion}${SEPARADOR_PARRAFOS}${avisos}${SEPARADOR_PARRAFOS}${PREGUNTA_EC}`,
    );
    historialSano(prueba);
  });

  test("ningún aviso pregunta: los cinco desenlaces se dicen sin signos de pregunta", () => {
    for (const desenlace of Object.values(DESENLACE_ENVIO)) {
      const aviso = TEXTO_ENVIO_NO_REGISTRADO[desenlace](CO);
      expect(aviso).not.toContain("?");
      expect(aviso).not.toContain("¿");
    }
  });
});

describe("D-63.2: un turno que armó y luego falló el proveedor también termina preguntando", () => {
  test("error, texto con la pregunta, confirmation_required y turn_end con needsConfirmation", async () => {
    const prueba = agente([
      ...prepararCaso(EC),
      respuestaHerramientas(llamar("armar-ec", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })),
      ERROR_SERVIDOR,
      ...enviar("simular-1", EC),
    ]);
    const turno1 = await prueba.turno(`procesa ${EC}`);
    const tipos = turno1.map((evento) => evento.tipo);
    const error = tipos.indexOf(TIPO_EVENTO.ERROR);
    const texto = tipos.lastIndexOf(TIPO_EVENTO.TEXTO);
    const confirmacion = tipos.indexOf(TIPO_EVENTO.CONFIRMACION_REQUERIDA);
    expect(error).toBeGreaterThan(0);
    expect(texto).toBeGreaterThan(error);
    expect(confirmacion).toBeGreaterThan(texto);
    expect(tipos.at(-1)).toBe(TIPO_EVENTO.FIN_TURNO);
    expect(turno1[error]).toMatchObject({ codigo: CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE });
    terminaPreguntandoPor(textoFinal(turno1), EC);
    expect(confirmaciones(turno1)).toEqual([
      expect.objectContaining({ caso: EC, accion: ACCION.ENVIO, bloqueos: [BLOQUEO_EC] }),
    ]);
    expect(finDeTurno(turno1)).toMatchObject({ motivo: MOTIVO_FIN.ERROR, needsConfirmation: true });

    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    historialSano(prueba);
  });
});

describe("D-38: la autorización vale una vez, para un caso y en el turno siguiente", () => {
  test("simular(co) queda bloqueado y simular(ec) en el mismo turno sí envía", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(simular("simular-co", { caso: CO }), simular("simular-ec", { caso: EC })),
      respuestaTexto("Hecho."),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([bloqueada(), exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect(finDeTurno(turno2).needsConfirmation).toBe(false);
    historialSano(prueba);
  });

  test("claves extra del modelo no queman la autorización", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(simular("simular-1", { caso: EC, confirmado: true, extra: 1 })),
      respuestaTexto("Hecho."),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    historialSano(prueba);
  });

  test("dos simular(ec) en el turno confirmado: el primero envía, el segundo queda bloqueado y ec no se reabre (G-02-3)", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(simular("simular-1", { caso: EC }), simular("simular-2", { caso: EC })),
      respuestaTexto("Hecho."),
      ...enviar("simular-3", EC),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([exitosa(), bloqueada()]);
    expect(await enviosOk()).toBe(1);
    expect(confirmaciones(turno2)).toEqual([]);
    expect(finDeTurno(turno2).needsConfirmation).toBe(false);
    expect(textoFinal(turno2)).toBe(`Hecho.${SEPARADOR_PARRAFOS}${avisoDe(DESENLACE_ENVIO.YA_ENVIADO, EC)}`);

    const turno3 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno3)).toEqual([bloqueada()]);
    expect(await enviosOk()).toBe(1);
    historialSano(prueba);
  });

  test("un mensaje intermedio que no confirma conserva el caso y vuelve a preguntar; el 'envía' siguiente envía una vez (D-63.6)", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaTexto("Falta el certificado de cumplimiento tributario."),
      ...enviar("simular-1", EC),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("dime qué falta");
    expect(finDeTurno(turno2).needsConfirmation).toBe(true);
    expect(casosPorConfirmar(turno2)).toEqual([EC]);
    terminaPreguntandoPor(textoFinal(turno2), EC);

    const turno3 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno3)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect(await enviosOk()).toBe(1);
    historialSano(prueba);
  });
});

describe("AGT-04 (G-02-3, D-63.4): un caso ya enviado no se reabre ni se envía dos veces", () => {
  test("los reintentos tras el envío quedan bloqueados, no vuelven a preguntar y dejan una sola línea ok", async () => {
    const captura = capturarLogs();
    const prueba = crearAgentePrueba({
      raiz: proyecto.raiz,
      guion: [
        ...armarCaso(EC),
        ...enviar("simular-1", EC),
        ...enviar("simular-2", EC),
        ...enviar("simular-3", EC),
      ],
      bitacora: createLogger({ level: NIVELES_LOG.INFO, secrets: [], destination: captura.destino }),
    });
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([exitosa()]);
    const ruta = join(proyecto.raiz, OUT_DIR, EC, ARCHIVOS_SALIDA.ENVIO_SIMULADO);
    const primero = await readFile(ruta, "utf8");

    const turno3 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno3)).toEqual([bloqueada()]);
    expect(confirmaciones(turno3)).toEqual([]);
    expect(finDeTurno(turno3).needsConfirmation).toBe(false);
    expect(textoFinal(turno3)).toBe(`Hecho.${SEPARADOR_PARRAFOS}${avisoDe(DESENLACE_ENVIO.YA_ENVIADO, EC)}`);
    expect(await enviosOk()).toBe(1);
    expect(await readFile(ruta, "utf8")).toBe(primero);
    const sesion = prueba.sesionActual();
    expect(sesion.casosEnviados).toEqual([EC]);
    expect(Object.hasOwn(sesion.paquetesConocidos, EC)).toBe(true);
    expect(sesion.compuerta).toEqual({ tipo: ESTADO_COMPUERTA.LIBRE });

    const turno4 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno4)).toEqual([bloqueada()]);
    expect(finDeTurno(turno4).needsConfirmation).toBe(false);
    expect(await enviosOk()).toBe(1);
    expect(await readFile(ruta, "utf8")).toBe(primero);

    const lineasCaso = (await readFile(join(proyecto.raiz, OUT_DIR, EC, ARCHIVO_BITACORA), "utf8"))
      .trim()
      .split("\n")
      .map((linea): Record<string, unknown> => JSON.parse(linea))
      .filter((linea) => linea.herramienta === NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO]);
    expect(lineasCaso.map(({ ok, codigo }) => ({ ok, codigo: codigo ?? null }))).toEqual([
      { ok: true, codigo: null },
      { ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA },
      { ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA },
    ]);
    const bloqueos = captura.lineas().filter((linea) => linea.msg === EVENTO_BITACORA.COMPUERTA_BLOQUEO);
    expect(bloqueos.map(({ llamadaId, caso }) => ({ llamadaId, caso }))).toEqual([
      { llamadaId: "simular-2", caso: EC },
      { llamadaId: "simular-3", caso: EC },
    ]);
    historialSano(prueba);
  });
});

describe("T-03-49: la línea gate_blocked nombra el caso legible de la llamada", () => {
  function agenteConLogs(
    guion: readonly PasoLlmFalso[],
    destino: ReturnType<typeof capturarLogs>["destino"],
  ) {
    return crearAgentePrueba({
      raiz: proyecto.raiz,
      guion,
      bitacora: createLogger({ level: NIVELES_LOG.INFO, secrets: [], destination: destino }),
    });
  }

  function lineasDeCompuerta(captura: ReturnType<typeof capturarLogs>, evento: string) {
    return captura
      .lineas()
      .filter((linea) => linea.msg === evento)
      .map(({ llamadaId, caso }) => ({ llamadaId, caso }));
  }

  test("escenario A: un caso legible sin paquete en la sesión queda registrado en gate_blocked", async () => {
    const captura = capturarLogs();
    const prueba = agenteConLogs(
      [
        respuestaHerramientas(simular("simular-1", { caso: CO, confirmado: true })),
        respuestaTexto(`Registré el envío simulado de ${CO}.`),
      ],
      captura.destino,
    );
    await prueba.turno(`Sí, envía ${CO}`);
    expect(lineasDeCompuerta(captura, EVENTO_BITACORA.COMPUERTA_BLOQUEO)).toEqual([
      { llamadaId: "simular-1", caso: CO },
    ]);
    expect(lineasDeCompuerta(captura, EVENTO_BITACORA.COMPUERTA_PERMISO)).toEqual([]);
  });

  test("gate_permit conserva su caso y gate_blocked registra el caso legible o null sin caso legible (escenario D)", async () => {
    const captura = capturarLogs();
    const prueba = agenteConLogs(
      [
        ...armarCaso(EC),
        respuestaHerramientas(
          simular("simular-1", { caso: EC }),
          simular("simular-2", { caso: CO }),
          simular("simular-3", {}),
          simular("simular-4", { caso: "../x" }),
        ),
        respuestaTexto("Hecho."),
      ],
      captura.destino,
    );
    await prueba.turno(`procesa ${EC}`);
    await prueba.turno("envía");
    expect(lineasDeCompuerta(captura, EVENTO_BITACORA.COMPUERTA_PERMISO)).toEqual([
      { llamadaId: "simular-1", caso: EC },
    ]);
    expect(lineasDeCompuerta(captura, EVENTO_BITACORA.COMPUERTA_BLOQUEO)).toEqual([
      { llamadaId: "simular-2", caso: CO },
      { llamadaId: "simular-3", caso: null },
      { llamadaId: "simular-4", caso: null },
    ]);
  });
});

describe("D-63.4: un armado nuevo tras el envío abre otro ciclo", () => {
  test("re-armar ec tras enviarlo vuelve a preguntar y el 'envía' siguiente escribe un segundo envío", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      ...enviar("simular-1", EC),
      respuestaHerramientas(llamar("armar-ec-2", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })),
      respuestaTexto(`Volví a armar el paquete de ${EC}.`),
      ...enviar("simular-2", EC),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([exitosa()]);
    expect(prueba.sesionActual().casosEnviados).toEqual([EC]);

    const turno3 = await prueba.turno(`vuelve a armar el paquete de ${EC}`);
    expect(confirmaciones(turno3)).toEqual([
      expect.objectContaining({ caso: EC, accion: ACCION.ENVIO, bloqueos: [BLOQUEO_EC] }),
    ]);
    terminaPreguntandoPor(textoFinal(turno3), EC);
    expect(finDeTurno(turno3).needsConfirmation).toBe(true);
    expect(prueba.sesionActual().casosEnviados).toEqual([]);

    const turno4 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno4)).toEqual([exitosa()]);
    expect(await enviosOk()).toBe(2);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    historialSano(prueba);
  });
});

describe("D-68: la acción estructurada de un caso pendiente tiene precedencia sobre el texto", () => {
  test("confirmar ec con el texto visible del botón autoriza ec", async () => {
    const prueba = agente([...armarCaso(EC), ...enviar("simular-1", EC)]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno(`Sí, envía ${EC}`, {
      accion: { tipo: TIPO_ACCION.CONFIRMAR, caso: EC },
    });
    expect(finesDeHerramienta(turno2)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect(finDeTurno(turno2).needsConfirmation).toBe(false);
    historialSano(prueba);
  });

  test("confirmar ec gana aunque el texto diga que no", async () => {
    const prueba = agente([...armarCaso(EC), ...enviar("simular-1", EC)]);
    await prueba.turno(`procesa ${EC}`);
    const texto = "No envíes nada todavía";
    expect(clasificarConfirmacion(texto, [EC]).decision).toBe(DECISION_CONFIRMACION.RECHAZA);
    const turno2 = await prueba.turno(texto, { accion: { tipo: TIPO_ACCION.CONFIRMAR, caso: EC } });
    expect(finesDeHerramienta(turno2)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
  });

  test("con dos pendientes, confirmar ec con un 'sí' a secas autoriza solo ec y co sigue pendiente", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      ...armarCaso(CO),
      respuestaHerramientas(simular("simular-co", { caso: CO }), simular("simular-ec", { caso: EC })),
      respuestaTexto("Hecho."),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno(`procesa el caso ${CO}`);
    expect(casosPorConfirmar(turno2)).toEqual([EC, CO]);
    expect(clasificarConfirmacion("sí", [EC, CO]).decision).toBe(DECISION_CONFIRMACION.FALTA_CASO);

    const turno3 = await prueba.turno("sí", { accion: { tipo: TIPO_ACCION.CONFIRMAR, caso: EC } });
    expect(finesDeHerramienta(turno3)).toEqual([bloqueada(), exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect(casosPorConfirmar(turno3)).toEqual([CO]);
    terminaPreguntandoPor(textoFinal(turno3), CO);
    expect(finDeTurno(turno3).needsConfirmation).toBe(true);
    historialSano(prueba);
  });

  test("confirmar co con solo ec pendiente no autoriza nada, el texto visible pasa por el clasificador y ec sigue pendiente", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(simular("simular-ec", { caso: EC }), simular("simular-co", { caso: CO })),
      respuestaTexto("Hecho."),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const texto = `Sí, envía ${CO}`;
    expect(clasificarConfirmacion(texto, [EC])).toEqual({ decision: DECISION_CONFIRMACION.OTRO });
    const turno2 = await prueba.turno(texto, { accion: { tipo: TIPO_ACCION.CONFIRMAR, caso: CO } });
    expect(finesDeHerramienta(turno2)).toEqual([bloqueada(), bloqueada()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    expect(casosPorConfirmar(turno2)).toEqual([EC]);
    terminaPreguntandoPor(textoFinal(turno2), EC);
    expect(finDeTurno(turno2).needsConfirmation).toBe(true);
    historialSano(prueba);
  });
});

describe("D-69: Cancelar estructurado cancela solo ese caso", () => {
  test("con ec y co pendientes, cancelar co deja solo ec pendiente y el servidor vuelve a preguntar por ec", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      ...armarCaso(CO),
      respuestaTexto(`Cancelé el envío de ${CO}.`),
      ...enviar("simular-ec", EC),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno(`procesa el caso ${CO}`);
    expect(casosPorConfirmar(turno2)).toEqual([EC, CO]);
    const texto = `Cancela el envío de ${CO}`;
    expect(clasificarConfirmacion(texto, [EC, CO]).decision).toBe(DECISION_CONFIRMACION.RECHAZA);

    const turno3 = await prueba.turno(texto, { accion: { tipo: TIPO_ACCION.CANCELAR, caso: CO } });
    expect(finesDeHerramienta(turno3)).toEqual([]);
    expect(casosPorConfirmar(turno3)).toEqual([EC]);
    terminaPreguntandoPor(textoFinal(turno3), EC);
    expect(finDeTurno(turno3).needsConfirmation).toBe(true);

    const turno4 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno4)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect(finDeTurno(turno4).needsConfirmation).toBe(false);
    historialSano(prueba);
  });

  test("cancelar co con solo ec pendiente se ignora como botón y el texto visible sigue la decisión del clasificador", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaTexto("Entendido, no envío nada."),
      ...enviar("simular-ec", EC),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const texto = `Cancela el envío de ${CO}`;
    expect(clasificarConfirmacion(texto, [EC])).toEqual({ decision: DECISION_CONFIRMACION.RECHAZA });

    const turno2 = await prueba.turno(texto, { accion: { tipo: TIPO_ACCION.CANCELAR, caso: CO } });
    expect(finesDeHerramienta(turno2)).toEqual([]);
    expect(confirmaciones(turno2)).toEqual([]);
    expect(finDeTurno(turno2).needsConfirmation).toBe(false);
    expect(textoFinal(turno2)).toBe("Entendido, no envío nada.");

    const turno3 = await prueba.turno(`envía ${EC}`);
    expect(finesDeHerramienta(turno3)).toEqual([bloqueada()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    historialSano(prueba);
  });

  test("confirmar un caso ya enviado en la sesión no autoriza nada ni escribe un segundo envío (D-63.4)", async () => {
    const prueba = agente([...armarCaso(EC), ...enviar("simular-1", EC), ...enviar("simular-2", EC)]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno(`Sí, envía ${EC}`, {
      accion: { tipo: TIPO_ACCION.CONFIRMAR, caso: EC },
    });
    expect(finesDeHerramienta(turno2)).toEqual([exitosa()]);
    expect(prueba.sesionActual().casosEnviados).toEqual([EC]);

    const turno3 = await prueba.turno(`Sí, envía ${EC}`, {
      accion: { tipo: TIPO_ACCION.CONFIRMAR, caso: EC },
    });
    expect(finesDeHerramienta(turno3)).toEqual([bloqueada()]);
    expect(confirmaciones(turno3)).toEqual([]);
    expect(finDeTurno(turno3).needsConfirmation).toBe(false);
    expect(await enviosOk()).toBe(1);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    historialSano(prueba);
  });

  test("tras cancelar ec, un confirmado true del modelo sin autorización pendiente no envía", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(simular("simular-1", { caso: EC, confirmado: true })),
      respuestaTexto("Hecho."),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno(`Cancela el envío de ${EC}`, {
      accion: { tipo: TIPO_ACCION.CANCELAR, caso: EC },
    });
    expect(finesDeHerramienta(turno2)).toEqual([bloqueada()]);
    expect(await enviosOk()).toBe(0);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    expect(textoFinal(turno2)).toBe(
      `Hecho.${SEPARADOR_PARRAFOS}${avisoDe(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC)}${SEPARADOR_PARRAFOS}${PREGUNTA_EC}`,
    );
    historialSano(prueba);
  });
});

describe("D-60: el texto final sale en texto plano y la pregunta va al final", () => {
  test("negritas, encabezados y tablas del modelo desaparecen y la pregunta de ec queda como último párrafo", async () => {
    const prueba = agente(armarCaso(EC, MARKDOWN));
    const eventos = await prueba.turno(`procesa ${EC}`);
    const texto = textoFinal(eventos);
    sinMarkdown(texto);
    for (const parte of ["Resumen", "Estado", "NIT", "••••3456"]) expect(texto).toContain(parte);
    terminaPreguntandoPor(texto, EC);

    const { reply } = respuestaDeTurno(eventos);
    sinMarkdown(reply);
    terminaPreguntandoPor(reply, EC);
    historialSano(prueba);
  });
});

describe("PRD 6.4: respuestaDeTurno pliega los eventos en {reply, toolCalls, needsConfirmation}", () => {
  test("el turno 1 del §11 da una respuesta que pregunta, cinco llamadas en orden y needsConfirmation", async () => {
    const prueba = agente([
      respuestaHerramientas(llamar("leer-1", HERRAMIENTA.LEER_SOLICITUD, { caso: EC })),
      ...prepararCaso(EC),
      respuestaHerramientas(
        llamar("armar-1", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC }),
        simular("simular-1", { caso: EC, confirmado: true }),
      ),
      respuestaTexto("Armé el paquete."),
    ]);
    const respuesta = respuestaDeTurno(
      await prueba.turno(`Procesa el caso "${EC}". No envíes nada todavía.`),
    );
    expect(respuesta.reply.trimEnd().endsWith("?")).toBe(true);
    expect(respuesta.toolCalls.map(({ herramienta }) => herramienta)).toEqual(
      [
        HERRAMIENTA.LEER_SOLICITUD,
        HERRAMIENTA.MAPEAR_CAMPOS,
        HERRAMIENTA.GENERAR_FORMULARIO,
        HERRAMIENTA.ARMAR_PAQUETE,
        HERRAMIENTA.SIMULAR_ENVIO,
      ].map((nombre) => NOMBRE_VISIBLE[nombre]),
    );
    expect(respuesta.toolCalls.at(-1)).toMatchObject({
      argumentos: { caso: EC, confirmado: true },
      ok: false,
      codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA,
    });
    expect(respuesta.toolCalls.slice(0, 4).every(({ ok }) => ok)).toBe(true);
    expect(respuesta.needsConfirmation).toBe(true);
  });
});

const PENDIENTE_EC: CasoPendiente = {
  caso: EC,
  bloqueos: [BLOQUEO_EC],
  motivos: [{ tipo: "certificado_cumplimiento_tributario", causa: ESTADO_SOPORTE.AUSENTE }],
};
const PREGUNTA_EC = cierreConPregunta("", [PENDIENTE_EC]);
const PRESUPUESTO_PRUEBA = 1000;

function gastando(respuesta: RespuestaLlm, entrada: number, salida: number): RespuestaLlm {
  return { ...respuesta, uso: { entrada, salida, cacheHit: 0 } };
}

function instruccionesQueFallanEn(llamadaFallida: number): CargarInstrucciones {
  const reales = createInstructionsLoader();
  let llamadas = 0;
  return async () => {
    llamadas += 1;
    return llamadas === llamadaFallida ? { ok: false, archivo: ARCHIVO_PROMPT } : reales();
  };
}

function ultimoParrafo(texto: string): string {
  return texto.trimEnd().split(SEPARADOR_PARRAFOS).at(-1) ?? "";
}

function vuelvePreguntandoPorEc(eventos: readonly EventoAgente[], motivo: string): void {
  expect(finDeTurno(eventos)).toMatchObject({ motivo, needsConfirmation: true });
  expect(confirmaciones(eventos)).toEqual([
    expect.objectContaining({ caso: EC, accion: ACCION.ENVIO, bloqueos: [BLOQUEO_EC] }),
  ]);
  expect(PREGUNTA_EC).toContain("Certificado de cumplimiento tributario");
  expect(ultimoParrafo(textoFinal(eventos))).toBe(PREGUNTA_EC);
}

async function enviaUnaVez(prueba: AgentePrueba): Promise<void> {
  const turno3 = await prueba.turno("envía");
  expect(finesDeHerramienta(turno3)).toEqual([exitosa()]);
  expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
  expect(await enviosOk()).toBe(1);
}

async function sigueAgotadoYPreguntando(prueba: AgentePrueba, pedidos: number): Promise<void> {
  const eventos = await prueba.turno("envía");
  expect(prueba.llm.pedidos).toHaveLength(pedidos);
  expect(errores(eventos)).toEqual([]);
  vuelvePreguntandoPorEc(eventos, MOTIVO_FIN.TOPE_TOKENS);
  expect(textoFinal(eventos)).toBe(
    `${MENSAJE_AGENTE.PRESUPUESTO_AGOTADO}${SEPARADOR_PARRAFOS}${PREGUNTA_EC}`,
  );
  expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
}

describe("WR-02 (D-63.2): un turno de confirmación cortado antes de enviar conserva el caso pendiente", () => {
  test("un error del proveedor tras 'envía' vuelve a preguntar por ec y el siguiente 'envía' envía una vez", async () => {
    const prueba = agente([...armarCaso(EC), ERROR_SERVIDOR, ...enviar("simular-1", EC)]);
    await prueba.turno(`procesa ${EC}`);

    const turno2 = await prueba.turno("envía");
    expect(errores(turno2).map(({ codigo }) => codigo)).toEqual([CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE]);
    vuelvePreguntandoPorEc(turno2, MOTIVO_FIN.ERROR);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);

    await enviaUnaVez(prueba);
    historialSano(prueba);
  });

  test("sin instrucciones tras 'envía' no llama al proveedor, vuelve a preguntar y el siguiente 'envía' envía una vez", async () => {
    const prueba = crearAgentePrueba({
      raiz: proyecto.raiz,
      guion: [...armarCaso(EC), ...enviar("simular-1", EC)],
      instrucciones: instruccionesQueFallanEn(2),
    });
    await prueba.turno(`procesa ${EC}`);
    const pedidosTurno1 = prueba.llm.pedidos.length;

    const turno2 = await prueba.turno("envía");
    expect(prueba.llm.pedidos).toHaveLength(pedidosTurno1);
    expect(errores(turno2).map(({ codigo }) => codigo)).toEqual([CODIGO_AGENTE.INSTRUCCIONES_NO_DISPONIBLES]);
    vuelvePreguntandoPorEc(turno2, MOTIVO_FIN.ERROR);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);

    await enviaUnaVez(prueba);
    historialSano(prueba);
  });

  test("con el presupuesto agotado 'envía' no llama al proveedor, sigue preguntando y nunca envía", async () => {
    const prueba = crearAgentePrueba({
      raiz: proyecto.raiz,
      guion: [
        ...prepararCaso(EC),
        respuestaHerramientas(llamar(`armar-${EC}`, HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })),
        gastando(respuestaTexto(`Armé el paquete de ${EC}.`), 900, 200),
        ...enviar("simular-1", EC),
      ],
      presupuestoTokens: PRESUPUESTO_PRUEBA,
    });
    const turno1 = await prueba.turno(`procesa ${EC}`);
    expect(finDeTurno(turno1).needsConfirmation).toBe(true);
    const pedidosTurno1 = prueba.llm.pedidos.length;

    await sigueAgotadoYPreguntando(prueba, pedidosTurno1);
    await sigueAgotadoYPreguntando(prueba, pedidosTurno1);
    historialSano(prueba);
  });

  test("si el modelo solo responde texto tras 'envía', el turno termina sin usar la autorización y el caso vuelve a quedar pendiente; el 'ok' siguiente no envía y el 'sí' envía una vez (D-63.6)", async () => {
    const texto = "Entendido, todavía no envío nada.";
    const prueba = agente([
      ...armarCaso(EC),
      respuestaTexto(texto),
      ...enviar("simular-1", EC),
      ...enviar("simular-2", EC),
    ]);
    await prueba.turno(`procesa ${EC}`);

    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([]);
    vuelvePreguntandoPorEc(turno2, MOTIVO_FIN.FINAL);
    expect(textoFinal(turno2)).toBe(`${texto}${SEPARADOR_PARRAFOS}${PREGUNTA_EC}`);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);

    const turno3 = await prueba.turno("ok");
    expect(finesDeHerramienta(turno3)).toEqual([bloqueada()]);
    vuelvePreguntandoPorEc(turno3, MOTIVO_FIN.FINAL);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);

    const turno4 = await prueba.turno("sí");
    expect(finesDeHerramienta(turno4)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect(await enviosOk()).toBe(1);
    expect(finDeTurno(turno4).needsConfirmation).toBe(false);
    historialSano(prueba);
  });

  test("control: un aborto del llamante tras 'envía' no recupera la autorización y el siguiente 'envía' queda bloqueado", async () => {
    const prueba = agente([...armarCaso(EC), ...enviar("simular-1", EC)]);
    await prueba.turno(`procesa ${EC}`);
    const pedidosTurno1 = prueba.llm.pedidos.length;

    const controlador = new AbortController();
    const turno2: EventoAgente[] = [];
    for await (const evento of prueba.iniciar("envía", { signal: controlador.signal })) {
      turno2.push(evento);
      if (evento.tipo === TIPO_EVENTO.INICIO_TURNO) controlador.abort();
    }
    expect(finDeTurno(turno2)).toMatchObject({ motivo: MOTIVO_FIN.ABORTADO, needsConfirmation: false });
    expect(confirmaciones(turno2)).toEqual([]);
    expect(prueba.llm.pedidos).toHaveLength(pedidosTurno1);

    const turno3 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno3)).toEqual([bloqueada()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    historialSano(prueba);
  });
});

describe("D-63.6: un pedido ajeno con un caso pendiente se atiende y no secuestra la confirmación", () => {
  test("procesar co con ec pendiente deja los dos pendientes; un 'sí' a secas no envía; 'envía co' envía solo co y el 'sí' siguiente envía ec", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      ...armarCaso(CO),
      respuestaTexto("Hay dos paquetes pendientes."),
      ...enviar("simular-co", CO),
      ...enviar("simular-ec", EC),
    ]);
    await prueba.turno(`procesa ${EC}`);

    const turno2 = await prueba.turno(`procesa el caso ${CO}`);
    const armados = finesDeHerramienta(turno2, NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE]);
    expect(armados.length).toBeGreaterThan(0);
    expect(armados.every(({ ok }) => ok)).toBe(true);
    expect(casosPorConfirmar(turno2)).toEqual([EC, CO]);
    expect(textoFinal(turno2).trimEnd().endsWith(PREGUNTA_VARIOS)).toBe(true);
    expect(finDeTurno(turno2).needsConfirmation).toBe(true);
    expect(await enviosOk()).toBe(0);

    const turno3 = await prueba.turno("sí");
    expect(finesDeHerramienta(turno3)).toEqual([]);
    expect(casosPorConfirmar(turno3)).toEqual([EC, CO]);
    expect(textoFinal(turno3).trimEnd().endsWith(PREGUNTA_VARIOS)).toBe(true);
    expect(await enviosOk()).toBe(0);

    const turno4 = await prueba.turno(`envía ${CO}`);
    expect(finesDeHerramienta(turno4)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([CO]);
    expect(casosPorConfirmar(turno4)).toEqual([EC]);
    terminaPreguntandoPor(textoFinal(turno4), EC);
    expect(finDeTurno(turno4).needsConfirmation).toBe(true);

    const turno5 = await prueba.turno("sí");
    expect(finesDeHerramienta(turno5)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([CO, EC]);
    expect(await enviosOk()).toBe(2);
    expect(finDeTurno(turno5).needsConfirmation).toBe(false);
    historialSano(prueba);
  });

  test("un aborto durante un 'ok' cierra LIBRE y el 'sí' siguiente no autoriza (RN4)", async () => {
    const prueba = agente([...armarCaso(EC), ...enviar("simular-1", EC)]);
    await prueba.turno(`procesa ${EC}`);

    const controlador = new AbortController();
    const turno2: EventoAgente[] = [];
    for await (const evento of prueba.iniciar("ok", { signal: controlador.signal })) {
      turno2.push(evento);
      if (evento.tipo === TIPO_EVENTO.INICIO_TURNO) controlador.abort();
    }
    expect(finDeTurno(turno2)).toMatchObject({ motivo: MOTIVO_FIN.ABORTADO, needsConfirmation: false });
    expect(confirmaciones(turno2)).toEqual([]);
    expect(prueba.sesionActual().compuerta).toEqual({ tipo: ESTADO_COMPUERTA.LIBRE });

    const turno3 = await prueba.turno("sí");
    expect(finesDeHerramienta(turno3)).toEqual([bloqueada()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    historialSano(prueba);
  });
});

async function lineasDeSimularDelCaso(caso: string): Promise<Record<string, unknown>[]> {
  return (await readFile(join(proyecto.raiz, OUT_DIR, caso, ARCHIVO_BITACORA), "utf8"))
    .trim()
    .split("\n")
    .map((linea): Record<string, unknown> => JSON.parse(linea))
    .filter((linea) => linea.herramienta === NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO]);
}

function falloDeEnvio(codigo: string) {
  return expect.objectContaining({ ok: false, codigo });
}

async function quitarChecklist(caso: string): Promise<void> {
  await rm(join(proyecto.raiz, OUT_DIR, caso, DIRECTORIO_PAQUETE, ARCHIVOS_PAQUETE.CHECKLIST));
}

function codigosDeSimular(lineas: readonly Record<string, unknown>[]) {
  return lineas.map(({ ok, codigo }) => ({ ok, codigo: codigo ?? null }));
}

function envioConErrorInterno(fallosRestantes: number): RegistroHerramientas {
  const real = crearRegistroHerramientas(proveedor);
  const codigo = CODIGO_ERROR.ERROR_INTERNO;
  const fallo = resultadoDeFallo(
    cuerpoDeFallo(
      { codigo, error: MENSAJE_ERROR[codigo] },
      RESUMEN_HERRAMIENTA.fallo(HERRAMIENTA.SIMULAR_ENVIO, codigo),
    ),
  );
  let restantes = fallosRestantes;
  return {
    definiciones: real.definiciones,
    async ejecutar(llamada, ctx) {
      if (llamada.nombre !== NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO] || restantes === 0) {
        return real.ejecutar(llamada, ctx);
      }
      restantes -= 1;
      return fallo;
    },
  };
}

describe("G-02-2 (D-63.9, CR-05, D-63.10): con dos casos pendientes, un pedido que nombra un caso no cancela y un rechazo explícito cancela los dos", () => {
  test.each([
    "procesa co-industrias-delta, no pe-andes",
    "No, el de pe-andes",
    "Para pe-andes, ¿qué falta?",
    "procesa co-industrias-delta, no ec-corp-andina",
    "No, consulta el NIT de co-industrias-delta",
  ])("%p con dos pendientes no cancela ninguno", async (frase) => {
    const prueba = agente([
      ...armarCaso(EC),
      ...armarCaso(CO),
      respuestaTexto("Listo, revisé."),
      ...enviar("simular-ec", EC),
      ...enviar("simular-co", CO),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno(`procesa el caso ${CO}`);
    expect(casosPorConfirmar(turno2)).toEqual([EC, CO]);

    const turno3 = await prueba.turno(frase);
    expect(finesDeHerramienta(turno3)).toEqual([]);
    expect(casosPorConfirmar(turno3)).toEqual([EC, CO]);
    expect(textoFinal(turno3).trimEnd().endsWith(PREGUNTA_VARIOS)).toBe(true);
    expect(finDeTurno(turno3).needsConfirmation).toBe(true);

    const turno4 = await prueba.turno(`envía ${EC}`);
    expect(finesDeHerramienta(turno4)).toEqual([exitosa()]);
    expect(casosPorConfirmar(turno4)).toEqual([CO]);

    const turno5 = await prueba.turno("sí");
    expect(finesDeHerramienta(turno5)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([CO, EC]);
    expect(await enviosOk()).toBe(2);
    historialSano(prueba);
  });

  test.each([
    "espera un momento",
    "no quiero enviarlo todavía",
    "todavía no qué falta?",
    "co-industrias-delta todavía no",
    "no confirmo el envío simulado",
    "No, el de co-industrias-delta",
  ])("%p con dos pendientes cancela los dos", async (frase) => {
    const prueba = agente([
      ...armarCaso(EC),
      ...armarCaso(CO),
      respuestaTexto("Entendido, no envío nada."),
      ...enviar("simular-ec", EC),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno(`procesa el caso ${CO}`);
    expect(casosPorConfirmar(turno2)).toEqual([EC, CO]);

    const turno3 = await prueba.turno(frase);
    expect(finesDeHerramienta(turno3)).toEqual([]);
    expect(confirmaciones(turno3)).toEqual([]);
    expect(finDeTurno(turno3).needsConfirmation).toBe(false);
    expect(textoFinal(turno3)).toBe("Entendido, no envío nada.");

    const turno4 = await prueba.turno(`envía ${EC}`);
    expect(finesDeHerramienta(turno4)).toEqual([bloqueada()]);
    expect(await enviosOk()).toBe(0);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    historialSano(prueba);
  });
});

describe("WR-02 (D-63.7): un envío autorizado que falla vuelve a dejar el caso pendiente", () => {
  test("PAQUETE_NO_ARMADO tras 'envía' vuelve a preguntar; re-armar y 'sí' envía una vez", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(simular("simular-1", { caso: EC })),
      respuestaTexto("No pude registrar el envío simulado."),
      respuestaHerramientas(llamar("armar-ec-2", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })),
      respuestaTexto(`Volví a armar el paquete de ${EC}.`),
      ...enviar("simular-2", EC),
    ]);
    await prueba.turno(`procesa ${EC}`);
    await quitarChecklist(EC);

    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([falloDeEnvio(CODIGO_ERROR.PAQUETE_NO_ARMADO)]);
    vuelvePreguntandoPorEc(turno2, MOTIVO_FIN.FINAL);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    expect(prueba.sesionActual().casosEnviados).toEqual([]);
    expect(codigosDeSimular(await lineasDeSimularDelCaso(EC))).toEqual([
      { ok: false, codigo: CODIGO_ERROR.PAQUETE_NO_ARMADO },
    ]);

    const turno3 = await prueba.turno(`vuelve a armar el paquete de ${EC}`);
    expect(casosPorConfirmar(turno3)).toEqual([EC]);
    terminaPreguntandoPor(textoFinal(turno3), EC);
    expect(finDeTurno(turno3).needsConfirmation).toBe(true);

    const turno4 = await prueba.turno("sí");
    expect(finesDeHerramienta(turno4)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect(await enviosOk()).toBe(1);
    expect(finDeTurno(turno4).needsConfirmation).toBe(false);
    historialSano(prueba);
  });

  test("PAQUETE_DESACTUALIZADO y un re-armado en el mismo turno dejan el caso pendiente con los bloqueos nuevos", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(simular("simular-1", { caso: EC })),
      respuestaHerramientas(llamar("armar-ec-2", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })),
      respuestaTexto(`Volví a armar el paquete de ${EC}.`),
      ...enviar("simular-2", EC),
    ]);
    await prueba.turno(`procesa ${EC}`);
    await writeFile(join(proyecto.raiz, OUT_DIR, EC, DIRECTORIO_PAQUETE, "sobrante.txt"), "sobra");

    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([falloDeEnvio(CODIGO_ERROR.PAQUETE_DESACTUALIZADO)]);
    vuelvePreguntandoPorEc(turno2, MOTIVO_FIN.FINAL);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);

    const turno3 = await prueba.turno("sí");
    expect(finesDeHerramienta(turno3)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect(await enviosOk()).toBe(1);
    historialSano(prueba);
  });

  test("ERROR_INTERNO y luego un error del proveedor terminan en error y vuelven a preguntar; el 'envía' siguiente envía una vez", async () => {
    const prueba = crearAgentePrueba({
      raiz: proyecto.raiz,
      guion: [
        ...armarCaso(EC),
        respuestaHerramientas(simular("simular-1", { caso: EC })),
        ERROR_SERVIDOR,
        ...enviar("simular-2", EC),
      ],
      herramientas: envioConErrorInterno(1),
    });
    await prueba.turno(`procesa ${EC}`);

    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([falloDeEnvio(CODIGO_ERROR.ERROR_INTERNO)]);
    expect(errores(turno2).map(({ codigo }) => codigo)).toEqual([CODIGO_AGENTE.PROVEEDOR_NO_DISPONIBLE]);
    vuelvePreguntandoPorEc(turno2, MOTIVO_FIN.ERROR);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);

    await enviaUnaVez(prueba);
    historialSano(prueba);
  });

  test("dos envíos autorizados que fallan seguidos vuelven a preguntar cada vez y no escriben nada", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(simular("simular-1", { caso: EC })),
      respuestaTexto("No pude registrar el envío simulado."),
      respuestaHerramientas(simular("simular-2", { caso: EC })),
      respuestaTexto("No pude registrar el envío simulado."),
    ]);
    await prueba.turno(`procesa ${EC}`);
    await quitarChecklist(EC);

    for (const _intento of [1, 2]) {
      const turno = await prueba.turno("envía");
      expect(finesDeHerramienta(turno)).toEqual([falloDeEnvio(CODIGO_ERROR.PAQUETE_NO_ARMADO)]);
      vuelvePreguntandoPorEc(turno, MOTIVO_FIN.FINAL);
    }
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    expect(prueba.sesionActual().casosEnviados).toEqual([]);
    expect(codigosDeSimular(await lineasDeSimularDelCaso(EC))).toEqual([
      { ok: false, codigo: CODIGO_ERROR.PAQUETE_NO_ARMADO },
      { ok: false, codigo: CODIGO_ERROR.PAQUETE_NO_ARMADO },
    ]);
    historialSano(prueba);
  });
});

describe("G-03-26: cada envío de un caso legible que no ocurrió deja su aviso (escenarios B, C y FALLIDO)", () => {
  test("escenario B: armar ec y simular ec en el mismo turno deja el aviso de confirmación antes de la pregunta (D-44)", async () => {
    const afirmacion = `Registré el envío simulado de ${EC}.`;
    const prueba = agente([
      ...prepararCaso(EC),
      respuestaHerramientas(
        llamar("armar-1", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC }),
        simular("simular-1", { caso: EC, confirmado: true }),
      ),
      respuestaTexto(afirmacion),
    ]);
    const eventos = await prueba.turno(`procesa ${EC}`);
    expect(finesDeHerramienta(eventos, NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO])).toEqual([bloqueada()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    expect(casosPorConfirmar(eventos)).toEqual([EC]);
    expect(finDeTurno(eventos).needsConfirmation).toBe(true);
    expect(textoFinal(eventos)).toBe(
      `${afirmacion}${SEPARADOR_PARRAFOS}${avisoDe(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC)}${SEPARADOR_PARRAFOS}${PREGUNTA_EC}`,
    );
    expect(ultimoParrafo(textoFinal(eventos))).toBe(PREGUNTA_EC);
    historialSano(prueba);
  });

  test("escenario C: un reintento sobre un caso ya enviado dice que ya tiene un envío registrado y no lo reabre (D-63.4)", async () => {
    const afirmacion = "Registré el envío simulado otra vez.";
    const prueba = agente([
      ...armarCaso(EC),
      ...enviar("simular-1", EC),
      respuestaHerramientas(simular("simular-2", { caso: EC, confirmado: true })),
      respuestaTexto(afirmacion),
    ]);
    await prueba.turno(`procesa ${EC}`);
    await prueba.turno("envía");
    const turno3 = await prueba.turno(`Sí, envía ${EC}`);
    expect(finesDeHerramienta(turno3)).toEqual([bloqueada()]);
    expect(await enviosOk()).toBe(1);
    expect(confirmaciones(turno3)).toEqual([]);
    expect(finDeTurno(turno3).needsConfirmation).toBe(false);
    const aviso = avisoDe(DESENLACE_ENVIO.YA_ENVIADO, EC);
    expect(aviso).toContain(ARCHIVOS_SALIDA.ENVIO_SIMULADO);
    expect(textoFinal(turno3)).toBe(`${afirmacion}${SEPARADOR_PARRAFOS}${aviso}`);
    expect(prueba.sesionActual().compuerta).toEqual({ tipo: ESTADO_COMPUERTA.LIBRE });
    historialSano(prueba);
  });

  test("FALLIDO: un envío autorizado que la herramienta rechaza deja el aviso antes de la pregunta (D-63.7)", async () => {
    const texto = "No pude registrar el envío simulado.";
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(simular("simular-1", { caso: EC })),
      respuestaTexto(texto),
    ]);
    await prueba.turno(`procesa ${EC}`);
    await quitarChecklist(EC);

    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([falloDeEnvio(CODIGO_ERROR.PAQUETE_NO_ARMADO)]);
    vuelvePreguntandoPorEc(turno2, MOTIVO_FIN.FINAL);
    expect(textoFinal(turno2)).toBe(
      `${texto}${SEPARADOR_PARRAFOS}${avisoDe(DESENLACE_ENVIO.FALLIDO, EC)}${SEPARADOR_PARRAFOS}${PREGUNTA_EC}`,
    );
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    historialSano(prueba);
  });

  test("un turno sin simular_envio responde igual que antes", async () => {
    const texto = "Falta el certificado de cumplimiento tributario.";
    const prueba = agente([...armarCaso(EC), respuestaTexto(texto)]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("dime qué falta");
    expect(textoFinal(turno2)).toBe(`${texto}${SEPARADOR_PARRAFOS}${PREGUNTA_EC}`);
  });

  test("un turno cuyo simular_envio terminó ENVIADO responde igual que antes", async () => {
    const prueba = agente([...armarCaso(EC), ...enviar("simular-1", EC)]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([exitosa()]);
    expect(textoFinal(turno2)).toBe("Hecho.");
  });
});
