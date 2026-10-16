import { describe, expect, test } from "bun:test";
import {
  ACCION_DIALOGO_SESION,
  ACCION_SALUD,
  ACCION_UI,
  ACCIONES_DE_DIALOGO_SESION,
  ACCIONES_DE_SALUD,
} from "@web/config/constants/ui.constants.ts";
import { estadoInicialConversacion } from "@web/features/chat/estado/conversacion.ts";
import { estadoInicialSalud, reducirSalud } from "@web/features/encabezado/estado/salud.ts";
import {
  estadoInicialDialogoSesion,
  reducirDialogoSesion,
} from "@web/features/sesion/estado/dialogo-sesion.ts";
import { estadoRaizInicial, reducirRaiz } from "@web/store/raiz.ts";
import type { AccionRaiz } from "@web/types/store.type.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { HealthResponse } from "@/http/types/api.type.ts";

const SALUD: HealthResponse = {
  ok: true,
  provider: "deepseek",
  model: "deepseek-flash",
  llm: ESTADO_LLM.DISPONIBLE,
};

describe("slice salud", () => {
  test("arranca sin respuesta y sin comprobación en curso", () => {
    expect(estadoInicialSalud).toEqual({ salud: null, comprobando: false });
  });

  test("COMPROBANDO marca la comprobación en curso", () => {
    expect(reducirSalud(estadoInicialSalud, { tipo: ACCION_SALUD.COMPROBANDO })).toEqual({
      salud: null,
      comprobando: true,
    });
  });

  test("RECIBIDA guarda la respuesta de health sin tocar comprobando", () => {
    const comprobando = reducirSalud(estadoInicialSalud, { tipo: ACCION_SALUD.COMPROBANDO });
    expect(reducirSalud(comprobando, { tipo: ACCION_SALUD.RECIBIDA, salud: SALUD })).toEqual({
      salud: SALUD,
      comprobando: true,
    });
  });

  test("TERMINADA apaga la comprobación y conserva la última respuesta", () => {
    const recibida = reducirSalud(
      { salud: null, comprobando: true },
      { tipo: ACCION_SALUD.RECIBIDA, salud: SALUD },
    );
    expect(reducirSalud(recibida, { tipo: ACCION_SALUD.TERMINADA })).toEqual({
      salud: SALUD,
      comprobando: false,
    });
  });

  test("una acción que no cambia nada devuelve la misma referencia", () => {
    expect(reducirSalud(estadoInicialSalud, { tipo: ACCION_SALUD.TERMINADA })).toBe(estadoInicialSalud);
    const comprobando = reducirSalud(estadoInicialSalud, { tipo: ACCION_SALUD.COMPROBANDO });
    expect(reducirSalud(comprobando, { tipo: ACCION_SALUD.COMPROBANDO })).toBe(comprobando);
  });
});

describe("slice dialogoSesion", () => {
  test("arranca cerrado", () => {
    expect(estadoInicialDialogoSesion).toEqual({ abierto: false });
  });

  test("ABRIR lo abre y CERRAR lo cierra", () => {
    const abierto = reducirDialogoSesion(estadoInicialDialogoSesion, { tipo: ACCION_DIALOGO_SESION.ABRIR });
    expect(abierto).toEqual({ abierto: true });
    expect(reducirDialogoSesion(abierto, { tipo: ACCION_DIALOGO_SESION.CERRAR })).toEqual({ abierto: false });
  });

  test("CERRAR sobre un diálogo cerrado devuelve la misma referencia", () => {
    expect(reducirDialogoSesion(estadoInicialDialogoSesion, { tipo: ACCION_DIALOGO_SESION.CERRAR })).toBe(
      estadoInicialDialogoSesion,
    );
  });
});

describe("familias de acciones", () => {
  test("los tipos de salud y del diálogo no chocan con los de la conversación ni entre sí", () => {
    const conversacion = new Set<string>(Object.values(ACCION_UI));
    const todos = [...conversacion, ...ACCIONES_DE_SALUD, ...ACCIONES_DE_DIALOGO_SESION];
    expect(new Set(todos).size).toBe(todos.length);
  });
});

describe("reducirRaiz", () => {
  test("el estado inicial combina la conversación, la salud y el diálogo cerrado", () => {
    expect(estadoRaizInicial(null)).toEqual({
      conversacion: estadoInicialConversacion,
      salud: estadoInicialSalud,
      dialogoSesion: estadoInicialDialogoSesion,
    });
  });

  test("cada familia de acciones llega a su slice y deja las demás con la misma referencia", () => {
    const inicial = estadoRaizInicial(null);
    const conSalud = reducirRaiz(inicial, { tipo: ACCION_SALUD.RECIBIDA, salud: SALUD });
    expect(conSalud.salud.salud).toBe(SALUD);
    expect(conSalud.conversacion).toBe(inicial.conversacion);
    expect(conSalud.dialogoSesion).toBe(inicial.dialogoSesion);

    const conDialogo = reducirRaiz(conSalud, { tipo: ACCION_DIALOGO_SESION.ABRIR });
    expect(conDialogo.dialogoSesion.abierto).toBe(true);
    expect(conDialogo.salud).toBe(conSalud.salud);

    const conBorrador = reducirRaiz(conDialogo, { tipo: ACCION_UI.CAMBIAR_BORRADOR, borrador: "hola" });
    expect(conBorrador.conversacion.borrador).toBe("hola");
    expect(conBorrador.salud).toBe(conDialogo.salud);
    expect(conBorrador.dialogoSesion).toBe(conDialogo.dialogoSesion);
  });

  test("una acción que su slice ignora devuelve la raíz idéntica", () => {
    const inicial = estadoRaizInicial(null);
    const acciones: readonly AccionRaiz[] = [
      { tipo: ACCION_DIALOGO_SESION.CERRAR },
      { tipo: ACCION_SALUD.TERMINADA },
      { tipo: ACCION_UI.DETENER },
    ];
    for (const accion of acciones) expect(reducirRaiz(inicial, accion)).toBe(inicial);
  });

  test("despachar dos veces la misma acción desde el mismo estado da estados iguales", () => {
    const inicial = estadoRaizInicial("sesion-guardada");
    const accion: AccionRaiz = { tipo: ACCION_UI.CAMBIAR_BORRADOR, borrador: "hola" };
    expect(reducirRaiz(inicial, accion)).toEqual(reducirRaiz(inicial, accion));
  });
});
