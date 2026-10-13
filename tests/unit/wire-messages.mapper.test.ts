import { describe, expect, test } from "bun:test";
import { ARGUMENTOS_VACIOS, ROL_MENSAJE, TIPO_HERRAMIENTA_WIRE } from "@/config/constants/llm.constants.ts";
import { toWireMessages } from "@/llm/mappers/wire-messages.mapper.ts";
import type { Mensaje, MensajeAsistente } from "@/llm/types/llm.type.ts";
import type { WireToolCall } from "@/llm/types/provider.type.ts";

const LLAMADA_ID = "call_00_wire";
const NOMBRE = "proveedor_leer_solicitud";
const VALIDO = '{"caso": "ec-corp-andina"}';
const RAZONAMIENTO = "pienso leer la solicitud";

function asistenteCon(argumentos: string, razonamiento: string | null = null): MensajeAsistente {
  return {
    rol: ROL_MENSAJE.ASISTENTE,
    contenido: "Leo la solicitud.",
    llamadas: [{ id: LLAMADA_ID, nombre: NOMBRE, argumentos }],
    razonamiento,
  };
}

function historialCon(argumentos: string, razonamiento: string | null = null): readonly Mensaje[] {
  return [
    { rol: ROL_MENSAJE.SISTEMA, contenido: "Eres el agente de registro." },
    { rol: ROL_MENSAJE.USUARIO, contenido: "procesa el caso ec-corp-andina" },
    asistenteCon(argumentos, razonamiento),
    { rol: ROL_MENSAJE.HERRAMIENTA, llamadaId: LLAMADA_ID, contenido: '{"ok":true}' },
  ];
}

function llamadaWire(argumentos: string): WireToolCall {
  return { id: LLAMADA_ID, type: TIPO_HERRAMIENTA_WIRE, function: { name: NOMBRE, arguments: argumentos } };
}

describe("toWireMessages solo envía argumentos que son un objeto JSON", () => {
  test("unos argumentos que son un objeto JSON salen byte por byte", () => {
    const [, , asistente] = toWireMessages(historialCon(VALIDO), false);
    expect(asistente).toEqual({
      role: ROL_MENSAJE.ASISTENTE,
      content: "Leo la solicitud.",
      tool_calls: [llamadaWire(VALIDO)],
    });
  });

  test.each([
    ["truncados", '{"caso":"co'],
    ["vacíos", ""],
    ["un arreglo", "[]"],
    ["un número", "42"],
    ["null", "null"],
    ["una cadena", '"texto"'],
  ])("unos argumentos %s salen como ARGUMENTOS_VACIOS con el mismo id y nombre", (_caso, argumentos) => {
    const [, , asistente] = toWireMessages(historialCon(argumentos), false);
    expect(asistente).toEqual({
      role: ROL_MENSAJE.ASISTENTE,
      content: "Leo la solicitud.",
      tool_calls: [llamadaWire(ARGUMENTOS_VACIOS)],
    });
  });

  test("los mensajes de sistema, usuario y herramienta no cambian", () => {
    const [sistema, usuario, , herramienta] = toWireMessages(historialCon('{"caso":"co'), false);
    expect(sistema).toEqual({ role: ROL_MENSAJE.SISTEMA, content: "Eres el agente de registro." });
    expect(usuario).toEqual({ role: ROL_MENSAJE.USUARIO, content: "procesa el caso ec-corp-andina" });
    expect(herramienta).toEqual({
      role: ROL_MENSAJE.HERRAMIENTA,
      tool_call_id: LLAMADA_ID,
      content: '{"ok":true}',
    });
  });

  test("el reasoning_content se reenvía igual aunque los argumentos se reemplacen", () => {
    const [, , conPassback] = toWireMessages(historialCon('{"caso":"co', RAZONAMIENTO), true);
    expect(conPassback).toEqual({
      role: ROL_MENSAJE.ASISTENTE,
      content: "Leo la solicitud.",
      tool_calls: [llamadaWire(ARGUMENTOS_VACIOS)],
      reasoning_content: RAZONAMIENTO,
    });
    const [, , sinPassback] = toWireMessages(historialCon(VALIDO, RAZONAMIENTO), false);
    expect(sinPassback).not.toHaveProperty("reasoning_content");
  });
});
