import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { TONO, TONO_DEL_MODELO } from "@web/config/constants/ui.constants.ts";
import { TEXTO_MODELO } from "@web/config/strings.ts";
import { CODIGO_AGENTE } from "@/config/constants/agent.constants.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import { MENSAJE_AGENTE } from "@/config/strings.ts";

const MODELO = "deepseek-flash";
const ZONA = "America/Bogota";
const ESTADOS_CON_AVISO = [
  ESTADO_LLM.SIN_CLAVE,
  ESTADO_LLM.SALDO_AGOTADO,
  ESTADO_LLM.NO_DISPONIBLE,
  ESTADO_LLM.TOPE_DIARIO,
] as const;

describe("estado del modelo en el encabezado", () => {
  test("cada estado se lee como '{modelo} · {estado}' con la etiqueta del UI-SPEC", () => {
    expect(Object.values(ESTADO_LLM).map((estado) => TEXTO_MODELO.estado(MODELO, estado))).toEqual([
      "deepseek-flash · Disponible",
      "deepseek-flash · Sin clave válida",
      "deepseek-flash · Sin saldo",
      "deepseek-flash · No disponible",
      "deepseek-flash · Tope diario",
    ]);
  });

  test("el color sale del estado: éxito, error para clave y saldo, atención para caída y tope", () => {
    expect(TONO_DEL_MODELO).toEqual({
      [ESTADO_LLM.DISPONIBLE]: TONO.EXITO,
      [ESTADO_LLM.SIN_CLAVE]: TONO.ERROR,
      [ESTADO_LLM.SALDO_AGOTADO]: TONO.ERROR,
      [ESTADO_LLM.NO_DISPONIBLE]: TONO.ATENCION,
      [ESTADO_LLM.TOPE_DIARIO]: TONO.ATENCION,
    });
  });
});

const MIENTRAS_TANTO =
  "Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos.";

describe("banner del modelo", () => {
  test("sin clave dice qué pasa, qué sigue funcionando, qué hacer y cuándo vuelve", () => {
    expect(TEXTO_MODELO.aviso(ESTADO_LLM.SIN_CLAVE, ZONA)).toEqual({
      titulo:
        "El chat no puede procesar mensajes: el servidor no tiene una clave válida del proveedor del modelo.",
      detalle:
        'Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos. Avisa a quien administra el servicio para que la configure. Vuelve cuando el servicio se reinicie con una clave válida; usa "Comprobar de nuevo" para verlo.',
    });
  });

  test("saldo agotado pide recargar la cuenta y volver a enviar el mensaje", () => {
    expect(TEXTO_MODELO.aviso(ESTADO_LLM.SALDO_AGOTADO, ZONA)).toEqual({
      titulo:
        "El proveedor del modelo se quedó sin saldo: los mensajes van a fallar hasta que se recargue la cuenta.",
      detalle:
        "Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos. Avisa a quien administra el servicio para que la recargue. Cuando se recargue la cuenta, vuelve a enviar tu mensaje; la sesión sigue abierta.",
    });
  });

  test("no disponible pide esperar unos minutos y volver a enviar el mensaje", () => {
    expect(TEXTO_MODELO.aviso(ESTADO_LLM.NO_DISPONIBLE, ZONA)).toEqual({
      titulo: "El proveedor del modelo no respondió en el último intento.",
      detalle:
        "Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos. Espera unos minutos y vuelve a enviar tu mensaje; si sigue fallando, avisa a quien administra el servicio. Suele volver solo; la sesión sigue abierta.",
    });
  });

  test("tope diario nombra la zona de /api/config y, sin config, la marca como sin dato", () => {
    expect(TEXTO_MODELO.aviso(ESTADO_LLM.TOPE_DIARIO, ZONA)).toEqual({
      titulo: "Se alcanzó el tope diario de uso del modelo: el chat no puede procesar más mensajes hoy.",
      detalle:
        "Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos. No hace falta que hagas nada: el tope protege el costo del servicio. El chat vuelve a estar disponible después de la medianoche (America/Bogota).",
    });
    expect(TEXTO_MODELO.aviso(ESTADO_LLM.TOPE_DIARIO, null).detalle).toEndWith("medianoche (—).");
  });

  test("ningún aviso menciona comandos y todos empiezan por lo que sigue funcionando", () => {
    for (const estado of ESTADOS_CON_AVISO) {
      const aviso = TEXTO_MODELO.aviso(estado, ZONA);
      const texto = `${aviso.titulo} ${aviso.detalle}`.toLowerCase();
      expect(texto).not.toContain("demo");
      expect(texto).not.toContain("bun");
      expect(aviso.detalle.startsWith(MIENTRAS_TANTO)).toBe(true);
    }
  });

  test("el botón del banner solo comprueba la salud", () => {
    expect(TEXTO_MODELO.comprobar).toBe("Comprobar de nuevo");
    expect(TEXTO_MODELO.comprobando).toBe("Comprobando…");
  });
});

describe("coherencia entre el banner y el aviso del turno", () => {
  test("el aviso de saldo del turno pide recargar la cuenta y volver a enviar el mensaje", () => {
    expect(MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_SALDO_AGOTADO]).toBe(
      "Saldo agotado en el proveedor del modelo: hay que recargar la cuenta antes de seguir. La sesión sigue abierta; cuando se recargue la cuenta, vuelve a enviar tu mensaje.",
    );
  });

  test("el aviso de clave rechazada pide corregirla en el servidor", () => {
    expect(MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_AUTENTICACION]).toBe(
      "La clave del proveedor del modelo no es válida o no tiene permiso: hay que corregirla en el servidor antes de seguir. La sesión sigue abierta.",
    );
  });

  test("el banner de saldo y el aviso de saldo del turno no se contradicen", () => {
    const banner = TEXTO_MODELO.aviso(ESTADO_LLM.SALDO_AGOTADO, ZONA);
    for (const texto of [
      `${banner.titulo} ${banner.detalle}`,
      MENSAJE_AGENTE[CODIGO_AGENTE.PROVEEDOR_SALDO_AGOTADO],
    ]) {
      expect(texto).toContain("vuelve a enviar tu mensaje");
      expect(texto).toContain("recargue la cuenta");
      expect(texto).not.toContain("puedes volver a intentarlo");
    }
  });
});

const AVISO_MODELO = readFileSync(
  join(import.meta.dir, "..", "..", "web", "src", "components", "aviso-modelo.tsx"),
  "utf8",
);

describe("botón Comprobar de nuevo", () => {
  test("el banner no importa el chat, la API ni el estado: solo recibe alComprobar", () => {
    const importaciones = AVISO_MODELO.split("\n").filter((linea) => linea.startsWith("import "));
    for (const prohibido of ["@web/api/", "@web/hooks/", "@web/state/"]) {
      expect(importaciones.filter((linea) => linea.includes(prohibido))).toEqual([]);
    }
    expect(AVISO_MODELO).toContain("onClick={alComprobar}");
    expect(AVISO_MODELO).toContain("disabled={comprobando}");
  });
});
