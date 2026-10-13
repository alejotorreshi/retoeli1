import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
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
import { ACCION, CODIGO_AGENTE, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ARCHIVOS_SALIDA, OUT_DIR } from "@/config/constants/files.constants.ts";
import { TIPO_ERROR_LLM } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA, PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import type { ErrorLlm } from "@/llm/types/llm.type.ts";
import { respuestaDeTurno } from "@/loop/services/respuesta-turno.service.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";

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
  test("dos paquetes piden cuál; 'envía' a secas no autoriza; 'envía ec-corp-andina' envía solo ec", async () => {
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
    expect(finDeTurno(turno3).needsConfirmation).toBe(false);
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
    expect(textoFinal(eventos)).toBe("Hecho.");
    expect(await lineasDeEnvio(proyecto.raiz)).toEqual([
      expect.objectContaining({ ok: false, codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA, caso: EC }),
    ]);
    historialSano(prueba);
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

  test("dos simular(ec) en el turno confirmado: el primero envía y el segundo queda bloqueado", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(simular("simular-1", { caso: EC }), simular("simular-2", { caso: EC })),
      respuestaTexto("Hecho."),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno2)).toEqual([exitosa(), bloqueada()]);
    expect(await enviosOk()).toBe(1);
    historialSano(prueba);
  });

  test("una confirmación que llega un turno después ya no autoriza", async () => {
    const prueba = agente([...armarCaso(EC), respuestaTexto("¿Algo más?"), ...enviar("simular-1", EC)]);
    await prueba.turno(`procesa ${EC}`);
    await prueba.turno("dime qué falta");
    const turno3 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno3)).toEqual([bloqueada()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
    historialSano(prueba);
  });
});

describe("AGT-04: repetir 'envía' tras un envío no escribe un segundo envío", () => {
  test("el reintento del modelo queda bloqueado, vuelve a preguntar y sigue habiendo una sola línea ok", async () => {
    const prueba = agente([...armarCaso(EC), ...enviar("simular-1", EC), ...enviar("simular-2", EC)]);
    await prueba.turno(`procesa ${EC}`);
    await prueba.turno("envía");
    const ruta = join(proyecto.raiz, OUT_DIR, EC, ARCHIVOS_SALIDA.ENVIO_SIMULADO);
    const primero = await readFile(ruta, "utf8");

    const turno3 = await prueba.turno("envía");
    expect(finesDeHerramienta(turno3)).toEqual([bloqueada()]);
    expect(await enviosOk()).toBe(1);
    expect(await readFile(ruta, "utf8")).toBe(primero);
    terminaPreguntandoPor(textoFinal(turno3), EC);
    expect(finDeTurno(turno3).needsConfirmation).toBe(true);
    historialSano(prueba);
  });
});

describe("D-39: la confirmación estructurada del botón tiene precedencia sobre el texto", () => {
  test("{aprobada: true, caso: ec} con mensaje vacío autoriza ec", async () => {
    const prueba = agente([...armarCaso(EC), ...enviar("simular-1", EC)]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("", { confirmacion: { aprobada: true, caso: EC } });
    expect(finesDeHerramienta(turno2)).toEqual([exitosa()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
    historialSano(prueba);
  });

  test("el botón aprobado gana aunque el texto diga que no", async () => {
    const prueba = agente([...armarCaso(EC), ...enviar("simular-1", EC)]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("No envíes nada todavía", {
      confirmacion: { aprobada: true, caso: EC },
    });
    expect(finesDeHerramienta(turno2)).toEqual([exitosa()]);
  });

  test("{aprobada: false, caso: ec} cancela lo pendiente", async () => {
    const prueba = agente([...armarCaso(EC), respuestaTexto("No envío nada.")]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("envía", { confirmacion: { aprobada: false, caso: EC } });
    expect(confirmaciones(turno2)).toEqual([]);
    expect(finDeTurno(turno2).needsConfirmation).toBe(false);
    expect(textoFinal(turno2)).toBe("No envío nada.");
    historialSano(prueba);
  });

  test("{aprobada: true, caso: co} con solo ec pendiente no autoriza nada", async () => {
    const prueba = agente([
      ...armarCaso(EC),
      respuestaHerramientas(simular("simular-ec", { caso: EC }), simular("simular-co", { caso: CO })),
      respuestaTexto("Hecho."),
    ]);
    await prueba.turno(`procesa ${EC}`);
    const turno2 = await prueba.turno("", { confirmacion: { aprobada: true, caso: CO } });
    expect(finesDeHerramienta(turno2)).toEqual([bloqueada(), bloqueada()]);
    expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([]);
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
      ].map((nombre) => `${PREFIJO_HERRAMIENTA}${nombre}`),
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
