import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { crearAgentePrueba } from "@tests/helpers/agente-prueba.helper.ts";
import {
  casosConEnvioSimulado,
  confirmaciones,
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
import { ACCION, MOTIVO_FIN } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { SEPARADOR_PARRAFOS } from "@/config/constants/text.constants.ts";
import { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { cierreConPregunta } from "@/domain/builders/cierre-turno.builder.ts";
import type { CasoPendiente } from "@/domain/types/compuerta.type.ts";
import { respuestaDeTurno } from "@/loop/services/respuesta-turno.service.ts";

const EC = "ec-corp-andina";
const LITERAL = "requiere confirmación explícita";
const BLOQUEO_EC = "ausente: certificado_cumplimiento_tributario";
const NOMBRE_BLOQUEO_EC = "Certificado de cumplimiento tributario";
const RECHAZO_LITERAL =
  '{"ok":false,"error":"requiere confirmación explícita","codigo":"CONFIRMACION_REQUERIDA","resumen":"simular_envio: CONFIRMACION_REQUERIDA"}';
const MENSAJE_TURNO_1 =
  'Procesa el caso "ec-corp-andina" del cliente Corporación Andina de Servicios. Genera el formulario, arma el paquete y dime qué falta. No envíes nada todavía.';
const TEXTO_TURNO_1 = "Armé el paquete de ec-corp-andina. Queda BLOQUEADO por un soporte ausente.";

const PENDIENTE_EC: CasoPendiente = {
  caso: EC,
  bloqueos: [BLOQUEO_EC],
  motivos: [{ tipo: "certificado_cumplimiento_tributario", causa: ESTADO_SOPORTE.AUSENTE }],
};
const PREGUNTA_AJENA = `¿Quieres que vuelva a generar el formulario de ${EC}?`;
const PREGUNTA_ENVIO_MODELO = `¿Confirmo el envío de ${EC}?`;
const LINEA_ESTADO = "Estado: BLOQUEADO por un soporte ausente.";

const PASOS_HASTA_GENERAR: readonly PasoLlmFalso[] = [
  respuestaHerramientas(llamar("leer-1", HERRAMIENTA.LEER_SOLICITUD, { caso: EC })),
  respuestaHerramientas(llamar("mapear-1", HERRAMIENTA.MAPEAR_CAMPOS, { caso: EC, campos: [] })),
  pasoGenerarConMapeo(EC),
];

function guionTurno1(textoModelo: string): readonly PasoLlmFalso[] {
  return [
    ...PASOS_HASTA_GENERAR,
    respuestaHerramientas(
      llamar("armar-1", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC }),
      llamar("simular-1", HERRAMIENTA.SIMULAR_ENVIO, { caso: EC, confirmado: true }),
    ),
    respuestaTexto(textoModelo),
  ];
}

const GUION_TURNO_1: readonly PasoLlmFalso[] = guionTurno1(TEXTO_TURNO_1);

function intentoDeEnvio(id: string): readonly PasoLlmFalso[] {
  return [
    respuestaHerramientas(llamar(id, HERRAMIENTA.SIMULAR_ENVIO, { caso: EC })),
    respuestaTexto("Listo."),
  ];
}

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

function historialSano(prueba: AgentePrueba): void {
  expect(prueba.llm.pedidos.length).toBeGreaterThan(0);
  for (const pedido of prueba.llm.pedidos) expect(historialIntegro(pedido.mensajes)).toEqual([]);
}

function resultadoDeHerramienta(prueba: AgentePrueba, llamadaId: string): string | undefined {
  for (const pedido of prueba.llm.pedidos) {
    for (const mensaje of pedido.mensajes) {
      if (mensaje.rol === ROL_MENSAJE.HERRAMIENTA && mensaje.llamadaId === llamadaId)
        return mensaje.contenido;
    }
  }
  return undefined;
}

function ultimoParrafo(texto: string): string | undefined {
  return texto.trimEnd().split(SEPARADOR_PARRAFOS).at(-1);
}

function ultimoTextoAsistente(prueba: AgentePrueba, pedido: number): string | undefined {
  const mensajes = prueba.llm.pedidos[pedido]?.mensajes ?? [];
  const asistente = mensajes
    .filter((mensaje) => mensaje.rol === ROL_MENSAJE.ASISTENTE && mensaje.llamadas.length === 0)
    .at(-1);
  return asistente?.rol === ROL_MENSAJE.ASISTENTE ? (asistente.contenido ?? undefined) : undefined;
}

describe("guion PRD §11 de punta a punta con el LLM falso (ENV-02, ENV-03, CA3)", () => {
  test("turno 1 bloquea el envío del modelo y pregunta; turno 2 'envía' escribe ENVIO-SIMULADO.md una vez", async () => {
    const prueba = agente([...GUION_TURNO_1, ...intentoDeEnvio("simular-2")]);
    const turno1 = await prueba.turno(MENSAJE_TURNO_1);

    expect(finesDeHerramienta(turno1)).toEqual([
      expect.objectContaining({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA }),
    ]);
    expect(resultadoDeHerramienta(prueba, "simular-1")).toBe(RECHAZO_LITERAL);
    expect(JSON.parse(resultadoDeHerramienta(prueba, "simular-1") ?? "{}").error).toBe(LITERAL);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    const bloqueadas = await lineasDeEnvio(proyecto.raiz);
    expect(bloqueadas).toHaveLength(1);
    expect(bloqueadas[0]).toMatchObject({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA, caso: EC });
    expect(confirmaciones(turno1)).toEqual([
      expect.objectContaining({ caso: EC, accion: ACCION.ENVIO, bloqueos: [BLOQUEO_EC] }),
    ]);
    const texto1 = textoFinal(turno1);
    expect(texto1.startsWith(TEXTO_TURNO_1)).toBe(true);
    expect(texto1.trimEnd().endsWith("?")).toBe(true);
    expect(texto1).toContain(EC);
    expect(texto1).toContain(NOMBRE_BLOQUEO_EC);
    expect(finDeTurno(turno1).needsConfirmation).toBe(true);

    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([expect.objectContaining({ ok: true })]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    const envios = await lineasDeEnvio(proyecto.raiz);
    expect(envios.filter((linea) => linea.ok)).toHaveLength(1);
    expect(envios.filter((linea) => linea.codigo === CODIGO_ERROR.CONFIRMACION_REQUERIDA)).toHaveLength(1);
    expect(confirmaciones(turno2)).toEqual([]);
    expect(finDeTurno(turno2).needsConfirmation).toBe(false);
    historialSano(prueba);
  });

  test("'No envíes nada todavía' en el turno 2 cancela lo pendiente y un 'envía' posterior ya no autoriza", async () => {
    const prueba = agente([
      ...GUION_TURNO_1,
      respuestaTexto("Entendido, no envío nada."),
      ...intentoDeEnvio("simular-3"),
    ]);
    await prueba.turno(MENSAJE_TURNO_1);

    const turno2 = await prueba.turno("No envíes nada todavía");
    expect(finDeTurno(turno2).needsConfirmation).toBe(false);
    expect(textoFinal(turno2)).toBe("Entendido, no envío nada.");
    expect(confirmaciones(turno2)).toEqual([]);

    const turno3 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno3)).toEqual([
      expect.objectContaining({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA }),
    ]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(0);
    historialSano(prueba);
  });

  test("'no envíes nada' con el modelo obediente cancela lo pendiente y el 'sí' siguiente no autoriza", async () => {
    const prueba = agente([
      ...GUION_TURNO_1,
      respuestaTexto("Entendido, no envío nada."),
      ...intentoDeEnvio("simular-2"),
    ]);
    await prueba.turno(MENSAJE_TURNO_1);

    const turno2 = await prueba.turno("no envíes nada");
    expect(finDeTurno(turno2).needsConfirmation).toBe(false);
    expect(confirmaciones(turno2)).toEqual([]);
    expect(textoFinal(turno2)).toBe("Entendido, no envío nada.");

    const turno3 = await prueba.turno("sí");
    expect(finesDeHerramienta(turno3)).toEqual([
      expect.objectContaining({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA }),
    ]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(0);
    historialSano(prueba);
  });

  test("'¿y si envío?' no autoriza: el envío del modelo queda bloqueado", async () => {
    const prueba = agente([...GUION_TURNO_1, ...intentoDeEnvio("simular-2")]);
    await prueba.turno(MENSAJE_TURNO_1);

    const turno2 = await prueba.turno("¿y si envío?");
    expect(finesDeHerramienta(turno2)).toEqual([
      expect.objectContaining({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA }),
    ]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(0);
    historialSano(prueba);
  });
});

describe("CR-01 (D-63.6): una respuesta que no confirma deja el caso pendiente y el 'sí' siguiente envía una vez", () => {
  const TEXTO_ACUSE = "Entendido.";

  test.each(["ok", "listo", "si por favor", "si gracias", `si ${EC}`])(
    "%p en el turno 2 vuelve a preguntar con needsConfirmation y el 'sí' del turno 3 envía una vez",
    async (frase) => {
      const prueba = agente([...GUION_TURNO_1, respuestaTexto(TEXTO_ACUSE), ...intentoDeEnvio("simular-2")]);
      const turno1 = await prueba.turno(MENSAJE_TURNO_1);
      expect(finDeTurno(turno1).needsConfirmation).toBe(true);

      const pedidosTurno1 = prueba.llm.pedidos.length;
      const turno2 = await prueba.turno(frase);
      expect(prueba.llm.pedidos.length - pedidosTurno1).toBe(1);
      expect(finesDeHerramienta(turno2)).toEqual([]);
      expect(finDeTurno(turno2)).toEqual(
        expect.objectContaining({ motivo: MOTIVO_FIN.FINAL, needsConfirmation: true }),
      );
      expect(confirmaciones(turno2)).toEqual([
        expect.objectContaining({ caso: EC, accion: ACCION.ENVIO, bloqueos: [BLOQUEO_EC] }),
      ]);
      expect(textoFinal(turno2)).toBe(
        `${TEXTO_ACUSE}${SEPARADOR_PARRAFOS}${cierreConPregunta("", [PENDIENTE_EC])}`,
      );
      expect(respuestaDeTurno(turno2).needsConfirmation).toBe(true);
      expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
      expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(0);

      const turno3 = await prueba.turno("sí");
      expect(finesDeHerramienta(turno3)).toEqual([expect.objectContaining({ ok: true })]);
      expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
      expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(1);
      expect(confirmaciones(turno3)).toEqual([]);
      expect(finDeTurno(turno3).needsConfirmation).toBe(false);
      historialSano(prueba);
    },
  );

  test("dos respuestas seguidas que no confirman vuelven a preguntar las dos veces y el 'envía' siguiente envía una vez", async () => {
    const prueba = agente([
      ...GUION_TURNO_1,
      respuestaTexto(TEXTO_ACUSE),
      respuestaTexto("Falta el certificado de cumplimiento tributario."),
      ...intentoDeEnvio("simular-2"),
    ]);
    await prueba.turno(MENSAJE_TURNO_1);
    const pregunta = cierreConPregunta("", [PENDIENTE_EC]);

    for (const frase of ["ok", "¿qué falta?"]) {
      const turno = await prueba.turno(frase);
      expect(ultimoParrafo(textoFinal(turno))).toBe(pregunta);
      expect(confirmaciones(turno)).toEqual([
        expect.objectContaining({ caso: EC, accion: ACCION.ENVIO, bloqueos: [BLOQUEO_EC] }),
      ]);
      expect(finDeTurno(turno).needsConfirmation).toBe(true);
      expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    }

    const turno4 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno4)).toEqual([expect.objectContaining({ ok: true })]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(1);
    historialSano(prueba);
  });
});

describe("G-02-2 (D-63.8, D-63.9, CR-05, D-63.10): un pedido o una pregunta no cancela y una negación del envío sí cancela", () => {
  const TEXTO_CONSULTA = "Consulté el NIT de co-industrias-delta: viene de maestro.nit.";
  const TEXTO_RECHAZO = "Entendido, no envío nada. Falta el certificado de cumplimiento tributario.";

  test.each([
    "Consulta el valor del NIT de co-industrias-delta para tenerlo a mano",
    "Revisa los soportes, luego vemos el otro",
    `dame el NIT de ${EC}, no el RUC`,
    "mejor dime qué falta",
    "¿por qué no se puede enviar?",
    "Para pe-andes, ¿qué falta?",
    "Luego ¿qué sigue?",
    "Luego, ¿qué sigue?",
    "Dame primero el NIT, después el paquete",
    "Mejor, ¿me das el NIT?",
    "No envié el certificado, ¿lo puedo agregar?",
    "No hagas el PDF, solo el xlsx",
    "No, el de pe-andes",
    "procesa co-industrias-delta, no ec-corp-andina",
    "No ec-corp-andina, ¿qué falta?",
  ])(
    "%p deja el caso pendiente con la pregunta del servidor y el 'sí' siguiente envía una vez",
    async (frase) => {
      const prueba = agente([
        ...GUION_TURNO_1,
        respuestaTexto(TEXTO_CONSULTA),
        ...intentoDeEnvio("simular-2"),
      ]);
      const turno1 = await prueba.turno(MENSAJE_TURNO_1);
      expect(finDeTurno(turno1).needsConfirmation).toBe(true);

      const pedidosTurno1 = prueba.llm.pedidos.length;
      const turno2 = await prueba.turno(frase);
      expect(prueba.llm.pedidos.length - pedidosTurno1).toBe(1);
      expect(finesDeHerramienta(turno2)).toEqual([]);
      expect(finDeTurno(turno2)).toEqual(
        expect.objectContaining({ motivo: MOTIVO_FIN.FINAL, needsConfirmation: true }),
      );
      expect(confirmaciones(turno2)).toEqual([
        expect.objectContaining({ caso: EC, accion: ACCION.ENVIO, bloqueos: [BLOQUEO_EC] }),
      ]);
      expect(textoFinal(turno2)).toBe(
        `${TEXTO_CONSULTA}${SEPARADOR_PARRAFOS}${cierreConPregunta("", [PENDIENTE_EC])}`,
      );
      expect(respuestaDeTurno(turno2).needsConfirmation).toBe(true);
      expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
      expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(0);

      const turno3 = await prueba.turno("sí");
      expect(finesDeHerramienta(turno3)).toEqual([expect.objectContaining({ ok: true })]);
      expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
      expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(1);
      expect(confirmaciones(turno3)).toEqual([]);
      expect(finDeTurno(turno3).needsConfirmation).toBe(false);
      historialSano(prueba);
    },
  );

  test.each([
    "No envíes nada todavía, ¿qué falta?",
    "¿Qué falta? No envíes nada todavía.",
    "No, ¿qué falta?",
    "Espera, ¿qué falta?",
    "no lo envíes aún, ¿puedes revisar el NIT?",
    "no quiero enviarlo todavía",
    "todavía no qué falta?",
    "espera un momento",
    "no lo confirmes",
    "no confirmo el envío simulado",
    "no confirmo porque falta el certificado",
    "no confirmo: falta el certificado",
    "ec-corp-andina no",
    "todavía no, ec-corp-andina",
    "Todavía no, falta el certificado de ec-corp-andina",
    "detén el envío",
  ])(
    "%p cancela lo pendiente sin la pregunta del servidor y el 'sí' siguiente no autoriza",
    async (frase) => {
      const prueba = agente([
        ...GUION_TURNO_1,
        respuestaTexto(TEXTO_RECHAZO),
        ...intentoDeEnvio("simular-2"),
      ]);
      const turno1 = await prueba.turno(MENSAJE_TURNO_1);
      expect(finDeTurno(turno1).needsConfirmation).toBe(true);

      const turno2 = await prueba.turno(frase);
      expect(finesDeHerramienta(turno2)).toEqual([]);
      expect(finDeTurno(turno2)).toEqual(
        expect.objectContaining({ motivo: MOTIVO_FIN.FINAL, needsConfirmation: false }),
      );
      expect(confirmaciones(turno2)).toEqual([]);
      expect(textoFinal(turno2)).toBe(TEXTO_RECHAZO);
      expect(respuestaDeTurno(turno2).needsConfirmation).toBe(false);

      const turno3 = await prueba.turno("sí");
      expect(finesDeHerramienta(turno3)).toEqual([
        expect.objectContaining({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA }),
      ]);
      expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
      expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(0);
      historialSano(prueba);
    },
  );
});

describe("red de seguridad (D-63.6): si el modelo desobedece el prompt y llama a simular_envio tras una frase dudosa, el envío queda bloqueado y el caso sigue pendiente", () => {
  test.each(["y el envío", "ok, gracias", "ok", "listo", "si todo bien"])(
    "%p en el turno 2 deja bloqueado el envío del modelo",
    async (frase) => {
      const prueba = agente([...GUION_TURNO_1, ...intentoDeEnvio("simular-2")]);
      const turno1 = await prueba.turno(MENSAJE_TURNO_1);
      expect(finDeTurno(turno1).needsConfirmation).toBe(true);

      const turno2 = await prueba.turno(frase);
      expect(finesDeHerramienta(turno2)).toEqual([
        expect.objectContaining({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA }),
      ]);
      expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
      expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(0);
      expect(finDeTurno(turno2).needsConfirmation).toBe(true);
      expect(ultimoParrafo(textoFinal(turno2))).toBe(cierreConPregunta("", [PENDIENTE_EC]));
      historialSano(prueba);
    },
  );

  test.each(["si", "SÍ"])("%p solo en el turno 2 escribe ENVIO-SIMULADO.md una vez", async (frase) => {
    const prueba = agente([...GUION_TURNO_1, ...intentoDeEnvio("simular-2")]);
    const turno1 = await prueba.turno(MENSAJE_TURNO_1);
    expect(finDeTurno(turno1).needsConfirmation).toBe(true);

    const turno2 = await prueba.turno(frase);
    expect(finesDeHerramienta(turno2)).toEqual([expect.objectContaining({ ok: true })]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(1);
    expect(finDeTurno(turno2).needsConfirmation).toBe(false);
    historialSano(prueba);
  });
});

describe("CR-02: con un caso pendiente la pregunta del servidor cierra el turno (ENV-02, ENV-03, D-44)", () => {
  test("(a) la pregunta ajena del modelo se quita, la del servidor es el último párrafo y el 'sí' siguiente la responde y envía una vez (vía alternativa del gap 2)", async () => {
    const prueba = agente([
      ...guionTurno1(`${TEXTO_TURNO_1}${SEPARADOR_PARRAFOS}${PREGUNTA_AJENA}`),
      ...intentoDeEnvio("simular-2"),
    ]);
    const turno1 = await prueba.turno(MENSAJE_TURNO_1);
    const pregunta = cierreConPregunta("", [PENDIENTE_EC]);

    for (const texto of [textoFinal(turno1), respuestaDeTurno(turno1).reply]) {
      expect(texto).not.toContain("¿Quieres que vuelva a generar");
      expect(texto.startsWith(TEXTO_TURNO_1)).toBe(true);
      expect(texto).toContain(NOMBRE_BLOQUEO_EC);
      expect(ultimoParrafo(texto)).toBe(pregunta);
    }
    expect(finDeTurno(turno1).needsConfirmation).toBe(true);

    const pedidosTurno1 = prueba.llm.pedidos.length;
    const turno2 = await prueba.turno("sí");
    expect(ultimoParrafo(ultimoTextoAsistente(prueba, pedidosTurno1) ?? "")).toBe(pregunta);
    expect(finesDeHerramienta(turno2)).toEqual([expect.objectContaining({ ok: true })]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(1);
    expect(finDeTurno(turno2).needsConfirmation).toBe(false);
    historialSano(prueba);
  });

  test("(a-control) sin caso pendiente la pregunta del modelo queda al final y un 'sí' no autoriza el envío", async () => {
    const preguntaModelo = `¿Quieres que arme el paquete de ${EC}?`;
    const textoModelo = `Generé el formulario de ${EC}.${SEPARADOR_PARRAFOS}${preguntaModelo}`;
    const prueba = agente([
      ...PASOS_HASTA_GENERAR,
      respuestaTexto(textoModelo),
      ...intentoDeEnvio("simular-2"),
    ]);
    const turno1 = await prueba.turno(`Procesa el caso ${EC} hasta el formulario.`);

    expect(textoFinal(turno1)).toBe(textoModelo);
    expect(respuestaDeTurno(turno1).reply.endsWith(preguntaModelo)).toBe(true);
    expect(confirmaciones(turno1)).toEqual([]);
    expect(finDeTurno(turno1).needsConfirmation).toBe(false);

    const turno2 = await prueba.turno("sí");
    expect(finesDeHerramienta(turno2)).toEqual([
      expect.objectContaining({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA }),
    ]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(0);
    historialSano(prueba);
  });

  test("(b) la pregunta de envío del modelo se quita, la línea de estado queda y la respuesta lista los bloqueos legibles", async () => {
    const prueba = agente(
      guionTurno1(`${TEXTO_TURNO_1}${SEPARADOR_PARRAFOS}${LINEA_ESTADO}\n${PREGUNTA_ENVIO_MODELO}`),
    );
    const turno1 = await prueba.turno(MENSAJE_TURNO_1);
    const pregunta = cierreConPregunta("", [PENDIENTE_EC]);
    const respuesta = respuestaDeTurno(turno1);

    for (const texto of [textoFinal(turno1), respuesta.reply]) {
      expect(texto).toContain(LINEA_ESTADO);
      expect(texto).not.toContain(PREGUNTA_ENVIO_MODELO);
      expect(texto).toContain(NOMBRE_BLOQUEO_EC);
      expect(ultimoParrafo(texto)).toBe(pregunta);
    }
    expect(respuesta.needsConfirmation).toBe(true);
    historialSano(prueba);
  });

  test("un texto del modelo sin pregunta sigue cerrando con la pregunta del servidor", async () => {
    const prueba = agente(GUION_TURNO_1);
    const turno1 = await prueba.turno(MENSAJE_TURNO_1);
    const texto = textoFinal(turno1);
    expect(texto).toBe(`${TEXTO_TURNO_1}${SEPARADOR_PARRAFOS}${cierreConPregunta("", [PENDIENTE_EC])}`);
  });
});
