import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { crearAgentePrueba } from "@tests/helpers/agente-prueba.helper.ts";
import { llamar, respuestaHerramientas, respuestaTexto } from "@tests/helpers/llm-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { AgentePrueba } from "@tests/helpers/types/agente-prueba.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import type { Mensaje, MensajeHerramienta } from "@/llm/types/llm.type.ts";
import type {
  EventoAgente,
  EventoFinHerramienta,
  EventoInicioHerramienta,
  EventoTexto,
} from "@/loop/types/evento.type.ts";

const PREGUNTA = "¿Qué casos hay disponibles?";
const ID_LLAMADA = "listar-1";
const CASOS_FIXTURE = ["co-industrias-delta", "ec-corp-andina", "hn-agroexport-sula", "pa-logistica-istmo"];
const INSTRUCCION_LISTAR = 'llama a proveedor_leer_solicitud con el caso vacío ("")';
const CINCO_HERRAMIENTAS = 5;

let proyecto: ProyectoTemporal;
let restaurarFecha: () => void;
let agente: AgentePrueba;
let eventos: EventoAgente[];

function casosDelResultado(mensajes: readonly Mensaje[]): string[] {
  const resultado = mensajes.find(
    (mensaje): mensaje is MensajeHerramienta =>
      mensaje.rol === ROL_MENSAJE.HERRAMIENTA && mensaje.llamadaId === ID_LLAMADA,
  );
  if (resultado === undefined) throw new Error("el modelo no recibió el resultado del listado");
  const cuerpo: { parcial?: { casos_disponibles?: string[] } } = JSON.parse(resultado.contenido);
  return cuerpo.parcial?.casos_disponibles ?? [];
}

function finDelListado(): EventoFinHerramienta {
  const fin = eventos.find(
    (evento): evento is EventoFinHerramienta => evento.tipo === TIPO_EVENTO.FIN_HERRAMIENTA,
  );
  if (fin === undefined) throw new Error("falta el tool_end del listado");
  return fin;
}

function inicioDelListado(): EventoInicioHerramienta {
  const inicio = eventos.find(
    (evento): evento is EventoInicioHerramienta => evento.tipo === TIPO_EVENTO.INICIO_HERRAMIENTA,
  );
  if (inicio === undefined) throw new Error("falta el tool_start del listado");
  return inicio;
}

function respuestaFinal(): string {
  return eventos
    .filter((evento): evento is EventoTexto => evento.tipo === TIPO_EVENTO.TEXTO)
    .map((evento) => evento.texto)
    .join("\n");
}

beforeAll(async () => {
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
  proyecto = await crearProyectoTemporal();
  agente = crearAgentePrueba({
    raiz: proyecto.raiz,
    guion: [
      respuestaHerramientas(llamar(ID_LLAMADA, HERRAMIENTA.LEER_SOLICITUD, { caso: "" })),
      (mensajes) => respuestaTexto(`Casos disponibles: ${casosDelResultado(mensajes).join(", ")}.`),
    ],
  });
  eventos = await agente.turno(PREGUNTA);
});

afterAll(async () => {
  restaurarFecha();
  await proyecto.limpiar();
});

describe("listar los casos con las cinco herramientas (UI-07, HERR-01)", () => {
  test("las instrucciones que recibe el modelo le dicen que llame a leer_solicitud con el caso vacío", () => {
    const sistema = agente.llm.pedidos[0]?.mensajes.find((mensaje) => mensaje.rol === ROL_MENSAJE.SISTEMA);
    expect(sistema?.contenido).toContain(INSTRUCCION_LISTAR);
  });

  test("leer_solicitud con el caso vacío termina en CASO_NO_ENCONTRADO", () => {
    const fin = finDelListado();
    expect(fin.herramienta).toBe(NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD]);
    expect(fin.ok).toBe(false);
    expect(fin.codigo).toBe(CODIGO_ERROR.CASO_NO_ENCONTRADO);
  });

  test("el tool_start y el tool_end del listado salen con caso null, nunca con el caso vacío (G-03-17)", () => {
    expect(inicioDelListado().caso).toBeNull();
    expect(finDelListado().caso).toBeNull();
  });

  test("el modelo recibe casos_disponibles con los cuatro casos y la respuesta los lista", () => {
    const pedidoFinal = agente.llm.pedidos.at(-1);
    expect(casosDelResultado(pedidoFinal?.mensajes ?? []).sort()).toEqual(CASOS_FIXTURE);
    for (const caso of CASOS_FIXTURE) expect(respuestaFinal()).toContain(caso);
  });

  test("no hace falta una sexta herramienta", () => {
    expect(Object.values(HERRAMIENTA)).toHaveLength(CINCO_HERRAMIENTAS);
  });
});
