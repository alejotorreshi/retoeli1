import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA, crearAgenteFetch, MARCA_CLAVE } from "@tests/helpers/agente-fetch.helper.ts";
import { capturarLogs } from "@tests/helpers/bitacora.helper.ts";
import { crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { LineaLog } from "@tests/helpers/types/bitacora.type.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { EVENTO_BITACORA, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import {
  PRESET_DEEPSEEK,
  PROVEEDOR_DEEPSEEK,
  REINTENTOS_LLM_POR_DEFECTO,
  TIPO_ERROR_LLM,
} from "@/config/constants/llm.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import { HERRAMIENTA, PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { TEXTO_MASCARA } from "@/config/strings.ts";
import { redactar } from "@/domain/policies/redaccion.policy.ts";
import type { EventoAgente, EventoInicioHerramienta } from "@/loop/types/evento.type.ts";

const CASO = "co-industrias-delta";
const LEER = `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.LEER_SOLICITUD}`;
const SIMULAR = `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.SIMULAR_ENVIO}`;
const MENSAJE = `procesa el caso ${CASO}, el NIT es 900123456`;
const TEXTO_PRIVADO = "el NIT es 900123456";
const CON_LOGS = { LOG_LEVEL: NIVELES_LOG.INFO };
const NO_DISPONIBLE: RespuestaGuion = {
  estado: 503,
  cuerpo: { error: { message: "servicio no disponible" } },
};
const INTENTOS = 1 + REINTENTOS_LLM_POR_DEFECTO;
const CAMPOS_LLAMADA_LLM = ["proveedor", "modelo", "duracionMs", "entrada", "salida", "cacheHit"];

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

function deEvento(lineas: readonly LineaLog[], evento: string): LineaLog[] {
  return lineas.filter((linea) => linea.msg === evento);
}

function inicioDe(eventos: readonly EventoAgente[]): { readonly sesionId: string; readonly turnoId: string } {
  const inicio = eventos[0];
  if (inicio?.tipo !== TIPO_EVENTO.INICIO_TURNO) throw new Error("falta turn_start");
  return inicio;
}

describe("cada turno deja líneas JSON correlacionadas sin clave ni PII (SEG-03)", () => {
  test("leer, un envío bloqueado y texto dejan el contrato de líneas completo", async () => {
    const captura = capturarLogs();
    const { fetch } = crearFetchFalso([
      { cuerpo: cuerpoConHerramientas({ nombre: LEER, argumentos: { caso: CASO }, id: "leer-1" }) },
      {
        cuerpo: cuerpoConHerramientas({
          nombre: SIMULAR,
          argumentos: { caso: CASO, confirmado: true },
          id: "simular-1",
        }),
      },
      { cuerpo: cuerpoConTexto("Leí el caso y no envié nada sin tu confirmación.") },
    ]);
    const prueba = crearAgenteFetch({
      raiz: proyecto.raiz,
      fetch,
      entorno: CON_LOGS,
      destinoLogs: captura.destino,
    });

    const eventos = await prueba.turno(MENSAJE);
    const lineas = captura.lineas();
    const { sesionId, turnoId } = inicioDe(eventos);
    expect(lineas.length).toBeGreaterThan(0);
    expect(lineas[0]?.msg).toBe(EVENTO_BITACORA.TURNO_INICIO);
    for (const linea of lineas) expect(linea).toMatchObject({ sesionId, turnoId });

    expect(deEvento(lineas, EVENTO_BITACORA.TURNO_INICIO)).toEqual([
      expect.objectContaining({ mensajeLargo: MENSAJE.length }),
    ]);
    expect(deEvento(lineas, EVENTO_BITACORA.HERRAMIENTA)).toEqual([
      expect.objectContaining({
        llamadaId: "leer-1",
        herramienta: LEER,
        ok: true,
        duracionMs: expect.any(Number),
      }),
      expect.objectContaining({
        llamadaId: "simular-1",
        herramienta: SIMULAR,
        ok: false,
        codigo: CODIGO_ERROR.CONFIRMACION_REQUERIDA,
      }),
    ]);
    expect(deEvento(lineas, EVENTO_BITACORA.COMPUERTA_BLOQUEO)).toEqual([
      expect.objectContaining({ llamadaId: "simular-1", herramienta: SIMULAR }),
    ]);
    expect(deEvento(lineas, EVENTO_BITACORA.COMPUERTA_PERMISO)).toEqual([]);
    const llamadasLlm = deEvento(lineas, EVENTO_BITACORA.LLAMADA_LLM);
    expect(llamadasLlm).toHaveLength(3);
    for (const linea of llamadasLlm) {
      for (const campo of CAMPOS_LLAMADA_LLM) expect(linea).toHaveProperty(campo);
      expect(linea).toMatchObject({ proveedor: PROVEEDOR_DEEPSEEK, modelo: PRESET_DEEPSEEK.model });
    }
    expect(deEvento(lineas, EVENTO_BITACORA.TURNO_FIN)).toEqual([
      expect.objectContaining({ motivo: MOTIVO_FIN.FINAL, needsConfirmation: false }),
    ]);

    const todo = captura.crudas.join("");
    expect(todo).not.toContain(MARCA_CLAVE);
    expect(todo).not.toContain(TEXTO_PRIVADO);
    const sensibles = await sensiblesDelProyecto(proyecto.raiz);
    expect(sensibles.length).toBeGreaterThan(0);
    for (const sensible of sensibles) expect(todo).not.toContain(sensible.valor);
  });

  test("un primario con 503 que pasa al respaldo deja un llm_error por intento y un llm_fallback", async () => {
    const captura = capturarLogs();
    const { fetch } = crearFetchFalso([
      ...Array.from({ length: INTENTOS }, () => NO_DISPONIBLE),
      { cuerpo: { ...(cuerpoConTexto("respaldo") as object), model: PRESET_DEEPSEEK.fallbackModel } },
    ]);
    const prueba = crearAgenteFetch({
      raiz: proyecto.raiz,
      fetch,
      entorno: CON_LOGS,
      destinoLogs: captura.destino,
    });

    const eventos = await prueba.turno("hola");
    const lineas = captura.lineas();
    const { sesionId, turnoId } = inicioDe(eventos);
    const errores = deEvento(lineas, EVENTO_BITACORA.ERROR_LLM);
    expect(errores).toHaveLength(INTENTOS);
    for (const linea of errores) {
      expect(linea).toMatchObject({ sesionId, turnoId, tipo: TIPO_ERROR_LLM.SERVIDOR, estado: 503 });
    }
    expect(deEvento(lineas, EVENTO_BITACORA.CAMBIO_PROVEEDOR)).toEqual([
      expect.objectContaining({ sesionId, turnoId, tipo: TIPO_ERROR_LLM.SERVIDOR, estado: 503 }),
    ]);
    expect(deEvento(lineas, EVENTO_BITACORA.LLAMADA_LLM)).toEqual([
      expect.objectContaining({ modelo: PRESET_DEEPSEEK.fallbackModel }),
    ]);
  });

  test("tool_start lleva los argumentos redactados: claves sensibles y secretos ocultos", async () => {
    const argumentos = { caso: CASO, apiKey: "x", nota: `usa ${CLAVE_PRUEBA}` };
    const { fetch } = crearFetchFalso([
      { cuerpo: cuerpoConHerramientas({ nombre: LEER, argumentos, id: "leer-1" }) },
      { cuerpo: cuerpoConTexto("listo") },
    ]);
    const prueba = crearAgenteFetch({ raiz: proyecto.raiz, fetch });

    const eventos = await prueba.turno("hola");
    const inicio = eventos.find(
      (evento): evento is EventoInicioHerramienta => evento.tipo === TIPO_EVENTO.INICIO_HERRAMIENTA,
    );
    expect(inicio?.argumentos).toEqual(redactar(argumentos, [CLAVE_PRUEBA]));
    expect(inicio?.argumentos).toMatchObject({ apiKey: TEXTO_MASCARA.oculto });
    expect(JSON.stringify(eventos)).not.toContain(MARCA_CLAVE);
  });
});
