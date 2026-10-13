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
import { ACCION } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";

const EC = "ec-corp-andina";
const LITERAL = "requiere confirmación explícita";
const BLOQUEO_EC = "ausente: certificado_cumplimiento_tributario";
const NOMBRE_BLOQUEO_EC = "Certificado de cumplimiento tributario";
const RECHAZO_LITERAL =
  '{"ok":false,"error":"requiere confirmación explícita","codigo":"CONFIRMACION_REQUERIDA","resumen":"simular_envio: CONFIRMACION_REQUERIDA"}';
const MENSAJE_TURNO_1 =
  'Procesa el caso "ec-corp-andina" del cliente Corporación Andina de Servicios. Genera el formulario, arma el paquete y dime qué falta. No envíes nada todavía.';
const TEXTO_TURNO_1 = "Armé el paquete de ec-corp-andina. Queda BLOQUEADO por un soporte ausente.";

const GUION_TURNO_1: readonly PasoLlmFalso[] = [
  respuestaHerramientas(llamar("leer-1", HERRAMIENTA.LEER_SOLICITUD, { caso: EC })),
  respuestaHerramientas(llamar("mapear-1", HERRAMIENTA.MAPEAR_CAMPOS, { caso: EC, campos: [] })),
  pasoGenerarConMapeo(EC),
  respuestaHerramientas(
    llamar("armar-1", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC }),
    llamar("simular-1", HERRAMIENTA.SIMULAR_ENVIO, { caso: EC, confirmado: true }),
  ),
  respuestaTexto(TEXTO_TURNO_1),
];

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
