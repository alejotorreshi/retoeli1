import { describe, expect, test } from "bun:test";
import { ACCION } from "@/config/constants/agent.constants.ts";
import {
  DECISION_CONFIRMACION,
  ESTADO_COMPUERTA,
  EVENTO_COMPUERTA,
} from "@/config/constants/confirmacion.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import {
  abrirTurno,
  casosPendientes,
  cerrarTurno,
  estadoLibre,
  evaluarEnvio,
  revocarAlArmar,
} from "@/domain/policies/compuerta.policy.ts";
import type {
  CasoPendiente,
  EntradaCierreCompuerta,
  EstadoCompuerta,
  EventoCompuerta,
} from "@/domain/types/compuerta.type.ts";
import type { DecisionConfirmacion } from "@/domain/types/confirmacion.type.ts";

const EC = "ec-corp-andina";
const CO = "co-industrias-delta";

const PENDIENTE_EC: CasoPendiente = {
  caso: EC,
  bloqueos: ["ausente: certificado_cumplimiento_tributario"],
  motivos: [{ tipo: "certificado_cumplimiento_tributario", causa: ESTADO_SOPORTE.AUSENTE }],
};
const PENDIENTE_CO: CasoPendiente = { caso: CO, bloqueos: [], motivos: [] };

function pendiente(...casos: readonly CasoPendiente[]): EstadoCompuerta {
  return { tipo: ESTADO_COMPUERTA.PENDIENTE, accion: ACCION.ENVIO, casos };
}

const LIBRE: EstadoCompuerta = { tipo: ESTADO_COMPUERTA.LIBRE };
const confirma = (caso: string): DecisionConfirmacion => ({ decision: DECISION_CONFIRMACION.CONFIRMA, caso });
const RECHAZA: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.RECHAZA };
const FALTA_CASO: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.FALTA_CASO };
const OTRO: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.OTRO };

const armado = (caso: CasoPendiente): EventoCompuerta => ({ tipo: EVENTO_COMPUERTA.ARMADO, pendiente: caso });
const bloqueado = (caso: string): EventoCompuerta => ({ tipo: EVENTO_COMPUERTA.BLOQUEADO, caso });
const enviado = (caso: string): EventoCompuerta => ({ tipo: EVENTO_COMPUERTA.ENVIADO, caso });

function cierre(entrada: Partial<EntradaCierreCompuerta>): EntradaCierreCompuerta {
  return { arrastrados: [], eventos: [], conocidos: {}, abortado: false, ...entrada };
}

describe("estado inicial y casos pendientes", () => {
  test("estadoLibre es LIBRE y no tiene casos pendientes", () => {
    expect(estadoLibre()).toEqual(LIBRE);
    expect(casosPendientes(estadoLibre())).toEqual([]);
  });

  test("casosPendientes lista los casos en su orden", () => {
    expect(casosPendientes(pendiente(PENDIENTE_EC, PENDIENTE_CO))).toEqual([EC, CO]);
  });
});

describe("abrirTurno (D-37, D-40, D-63.3)", () => {
  test.each([confirma(EC), RECHAZA, FALTA_CASO, OTRO])("LIBRE nunca autoriza: %p", (decision) => {
    expect(abrirTurno(LIBRE, decision)).toEqual({ autorizado: null, siguiente: LIBRE, preguntarCual: false });
  });

  test("PENDIENTE más confirma de un caso pendiente autoriza solo ese caso y vuelve a LIBRE", () => {
    expect(abrirTurno(pendiente(PENDIENTE_EC), confirma(EC))).toEqual({
      autorizado: EC,
      siguiente: LIBRE,
      preguntarCual: false,
    });
  });

  test("con dos casos, confirma de uno autoriza solo ese", () => {
    expect(abrirTurno(pendiente(PENDIENTE_EC, PENDIENTE_CO), confirma(CO)).autorizado).toBe(CO);
  });

  test("falta_caso no autoriza y conserva los mismos casos para preguntar cuál", () => {
    const estado = pendiente(PENDIENTE_EC, PENDIENTE_CO);
    expect(abrirTurno(estado, FALTA_CASO)).toEqual({
      autorizado: null,
      siguiente: estado,
      preguntarCual: true,
    });
  });

  test.each([RECHAZA, OTRO])("rechaza u otro cancela a LIBRE: %p", (decision) => {
    expect(abrirTurno(pendiente(PENDIENTE_EC), decision)).toEqual({
      autorizado: null,
      siguiente: LIBRE,
      preguntarCual: false,
    });
  });

  test("confirma de un caso que no está pendiente no autoriza nada", () => {
    expect(abrirTurno(pendiente(PENDIENTE_EC), confirma(CO))).toEqual({
      autorizado: null,
      siguiente: LIBRE,
      preguntarCual: false,
    });
  });
});

describe("evaluarEnvio (D-38)", () => {
  test("permite una sola vez el caso autorizado y marca la autorización como usada", () => {
    const primera = evaluarEnvio({ caso: EC, usada: false }, EC);
    expect(primera).toEqual({ permitido: true, siguiente: { caso: EC, usada: true } });
    const segunda = evaluarEnvio(primera.siguiente, EC);
    expect(segunda.permitido).toBe(false);
    expect(segunda.siguiente).toEqual({ caso: EC, usada: true });
  });

  test("niega otro caso y deja intacta la autorización", () => {
    const autorizacion = { caso: EC, usada: false };
    expect(evaluarEnvio(autorizacion, CO)).toEqual({ permitido: false, siguiente: autorizacion });
  });

  test("sin autorización niega el envío", () => {
    expect(evaluarEnvio({ caso: null, usada: false }, EC).permitido).toBe(false);
  });
});

describe("revocarAlArmar (D-42)", () => {
  test("re-armar el caso autorizado revoca la autorización", () => {
    expect(revocarAlArmar({ caso: EC, usada: false }, EC).caso).toBeNull();
  });

  test("armar otro caso no cambia la autorización", () => {
    const autorizacion = { caso: EC, usada: false };
    expect(revocarAlArmar(autorizacion, CO)).toEqual(autorizacion);
  });
});

describe("cerrarTurno (D-37, D-63.1, D-63.2)", () => {
  test("armado deja el caso pendiente", () => {
    expect(cerrarTurno(cierre({ eventos: [armado(PENDIENTE_EC)] }))).toEqual(pendiente(PENDIENTE_EC));
  });

  test("bloqueado de un caso sin paquete conocido cierra LIBRE", () => {
    expect(cerrarTurno(cierre({ eventos: [bloqueado(EC)] }))).toEqual(LIBRE);
  });

  test("bloqueado de un caso con paquete conocido lo deja pendiente con sus bloqueos conocidos", () => {
    expect(cerrarTurno(cierre({ eventos: [bloqueado(EC)], conocidos: { [EC]: PENDIENTE_EC } }))).toEqual(
      pendiente(PENDIENTE_EC),
    );
  });

  test("armado y luego enviado cierra LIBRE", () => {
    expect(cerrarTurno(cierre({ eventos: [armado(PENDIENTE_EC), enviado(EC)] }))).toEqual(LIBRE);
  });

  test("enviado y luego armado deja el caso pendiente", () => {
    expect(cerrarTurno(cierre({ eventos: [enviado(EC), armado(PENDIENTE_EC)] }))).toEqual(
      pendiente(PENDIENTE_EC),
    );
  });

  test("los casos arrastrados sin eventos siguen pendientes en su orden", () => {
    expect(cerrarTurno(cierre({ arrastrados: [PENDIENTE_EC, PENDIENTE_CO] }))).toEqual(
      pendiente(PENDIENTE_EC, PENDIENTE_CO),
    );
  });

  test("re-armar un caso arrastrado conserva el primer orden y toma los bloqueos nuevos", () => {
    const reArmado: CasoPendiente = { caso: EC, bloqueos: [], motivos: [] };
    expect(
      cerrarTurno(cierre({ arrastrados: [PENDIENTE_EC, PENDIENTE_CO], eventos: [armado(reArmado)] })),
    ).toEqual(pendiente(reArmado, PENDIENTE_CO));
  });

  test("un turno abortado cierra LIBRE", () => {
    expect(cerrarTurno(cierre({ eventos: [armado(PENDIENTE_EC)], abortado: true }))).toEqual(LIBRE);
  });
});
