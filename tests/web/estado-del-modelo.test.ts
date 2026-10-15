import { describe, expect, test } from "bun:test";
import { TONO, TONO_DEL_MODELO } from "@web/config/constants/ui.constants.ts";
import { TEXTO_MODELO } from "@web/config/strings.ts";
import { ESTADO_LLM } from "@/config/constants/llm.constants.ts";

const MODELO = "deepseek-flash";
const ZONA = "America/Bogota";

describe("estado del modelo en el encabezado", () => {
  test("cada estado se lee como '{modelo} · {estado}' con la etiqueta del UI-SPEC", () => {
    expect(Object.values(ESTADO_LLM).map((estado) => TEXTO_MODELO.estado(MODELO, estado))).toEqual([
      "deepseek-flash · Disponible",
      "deepseek-flash · Sin clave",
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

describe("banner del modelo", () => {
  test("sin clave remite a demo.ts como comando aparte", () => {
    const aviso = TEXTO_MODELO.aviso(ESTADO_LLM.SIN_CLAVE, ZONA);
    expect(aviso.comando).toBe("bun run demo.ts");
    expect(`${aviso.texto}${aviso.comando}${aviso.cierre}`).toBe(
      "El modelo no está configurado en este servidor: falta la clave del proveedor. El chat no puede procesar mensajes; para ver el flujo sin modelo, corre bun run demo.ts en local.",
    );
  });

  test("saldo agotado y no disponible usan la copia del UI-SPEC sin comando", () => {
    expect(TEXTO_MODELO.aviso(ESTADO_LLM.SALDO_AGOTADO, ZONA)).toEqual({
      texto:
        "El proveedor del modelo se quedó sin saldo. Los mensajes van a fallar hasta que se recargue la cuenta.",
      comando: null,
      cierre: "",
    });
    expect(TEXTO_MODELO.aviso(ESTADO_LLM.NO_DISPONIBLE, ZONA).texto).toBe(
      "El proveedor del modelo no respondió en el último intento. Puedes volver a intentarlo en unos minutos; la sesión sigue abierta.",
    );
  });

  test("tope diario nombra la zona de /api/config y, sin config, la marca como sin dato", () => {
    expect(TEXTO_MODELO.aviso(ESTADO_LLM.TOPE_DIARIO, ZONA).texto).toBe(
      "Se alcanzó el tope diario de uso del modelo. El chat vuelve a estar disponible después de la medianoche (America/Bogota).",
    );
    expect(TEXTO_MODELO.aviso(ESTADO_LLM.TOPE_DIARIO, null).texto).toContain("medianoche (—).");
  });
});
