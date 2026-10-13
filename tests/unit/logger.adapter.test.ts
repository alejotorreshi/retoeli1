import { describe, expect, test } from "bun:test";
import { NIVELES_LOG, RUTAS_REDACCION_LOG } from "@/config/constants/logging.constants.ts";
import { CLAVES_SENSIBLES } from "@/config/constants/redaction.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import { createLogger } from "@/infra/logging/logger.adapter.ts";

const SECRETO = "clave-de-prueba-Zq9X";

type Captura = {
  readonly destination: { write(line: string): void };
  readonly lineas: string[];
  objetos(): Record<string, unknown>[];
};

function capturar(): Captura {
  const lineas: string[] = [];
  return {
    destination: { write: (line) => lineas.push(line) },
    lineas,
    objetos: () => lineas.map((linea) => JSON.parse(linea)),
  };
}

function bitacora(level: ValorDe<typeof NIVELES_LOG> = NIVELES_LOG.INFO) {
  const captura = capturar();
  return { captura, logger: createLogger({ level, destination: captura.destination, secrets: [SECRETO] }) };
}

describe("createLogger: líneas JSON (SEG-03)", () => {
  test("cada evento es una línea JSON con level, time ISO, msg y los campos", () => {
    const { captura, logger } = bitacora();
    logger.info("turn_start", { mensajeLargo: 42 });
    expect(captura.lineas).toHaveLength(1);
    expect(captura.lineas[0]?.endsWith("\n")).toBe(true);
    const [linea] = captura.objetos();
    expect(Object.keys(linea ?? {}).sort()).toEqual(["level", "mensajeLargo", "msg", "time"]);
    expect(linea?.msg).toBe("turn_start");
    expect(linea?.mensajeLargo).toBe(42);
    expect(linea?.level).toBe(NIVELES_LOG.INFO);
    const time = String(linea?.time);
    expect(new Date(time).toISOString()).toBe(time);
  });

  test("advertir y error escriben con su nivel y sin campos también funciona", () => {
    const { captura, logger } = bitacora();
    logger.advertir("budget_low");
    logger.error("llm_error", { tipo: "timeout" });
    expect(captura.objetos().map((linea) => [linea.level, linea.msg])).toEqual([
      [NIVELES_LOG.ADVERTENCIA, "budget_low"],
      [NIVELES_LOG.ERROR, "llm_error"],
    ]);
  });
});

describe("createLogger: correlación con hijos", () => {
  test("los hijos encadenados suman sesionId, turnoId y llamadaId a cada línea", () => {
    const { captura, logger } = bitacora();
    logger
      .hijo({ sesionId: "s1" })
      .hijo({ turnoId: "t1" })
      .hijo({ llamadaId: "c1" })
      .info("tool_exec", { ok: true });
    expect(captura.objetos()[0]).toMatchObject({
      sesionId: "s1",
      turnoId: "t1",
      llamadaId: "c1",
      ok: true,
      msg: "tool_exec",
    });
  });

  test("un hijo no cambia las líneas de su padre", () => {
    const { captura, logger } = bitacora();
    const sesion = logger.hijo({ sesionId: "s1" });
    sesion.hijo({ turnoId: "t1" });
    sesion.info("session_open");
    logger.info("server_start");
    const [deSesion, deServidor] = captura.objetos();
    expect(deSesion).toMatchObject({ sesionId: "s1", msg: "session_open" });
    expect(deSesion).not.toHaveProperty("turnoId");
    expect(deServidor).not.toHaveProperty("sesionId");
  });
});

describe("createLogger: nunca escribe la clave ni datos del maestro", () => {
  test("ni la clave ni una clave sensible llegan a la línea", () => {
    const { captura, logger } = bitacora();
    logger.info("llm_call", {
      headers: { authorization: `Bearer ${SECRETO}` },
      detalle: SECRETO,
      apiKey: "otra",
    });
    const crudo = captura.lineas.join("");
    expect(crudo).not.toContain("Zq9X");
    expect(crudo).not.toContain("otra");
    expect(captura.objetos()[0]).toMatchObject({
      headers: { authorization: "[dato oculto]" },
      detalle: "[dato oculto]",
      apiKey: "[dato oculto]",
    });
  });

  test("los vínculos de un hijo también pasan por la redacción", () => {
    const { captura, logger } = bitacora();
    logger
      .hijo({ sesionId: "s1", Authorization: `Bearer ${SECRETO}`, nota: `usa ${SECRETO}` })
      .info("turn_start");
    const crudo = captura.lineas.join("");
    expect(crudo).not.toContain("Zq9X");
    expect(captura.objetos()[0]).toMatchObject({ sesionId: "s1", Authorization: "[dato oculto]" });
  });

  test("un valor del maestro bajo valor o valores nunca se escribe", () => {
    const { captura, logger } = bitacora();
    logger.info("tool_exec", { resultado: { valor: "900123456", valores: ["03100012345"] } });
    const crudo = captura.lineas.join("");
    expect(crudo).not.toContain("900123456");
    expect(crudo).not.toContain("03100012345");
  });
});

describe("createLogger: niveles y estructuras peligrosas", () => {
  test("warn calla info y deja pasar advertir y error", () => {
    const { captura, logger } = bitacora(NIVELES_LOG.ADVERTENCIA);
    logger.info("turn_start");
    logger.advertir("budget_low");
    logger.error("llm_error");
    expect(captura.objetos().map((linea) => linea.msg)).toEqual(["budget_low", "llm_error"]);
  });

  test("silent no escribe nada", () => {
    const { captura, logger } = bitacora(NIVELES_LOG.SILENCIO);
    logger.info("turn_start");
    logger.advertir("budget_low");
    logger.error("llm_error");
    logger.hijo({ sesionId: "s1" }).error("tool_exec");
    expect(captura.lineas).toHaveLength(0);
  });

  test("un campo circular no lanza", () => {
    const { captura, logger } = bitacora();
    const circular: { nombre: string; yo?: unknown } = { nombre: "a" };
    circular.yo = circular;
    expect(() => logger.info("tool_exec", { circular })).not.toThrow();
    expect(captura.objetos()[0]).toMatchObject({ circular: { nombre: "a", yo: "[dato oculto]" } });
  });

  test("sin destino escribe a stdout sin lanzar", () => {
    const logger = createLogger({ level: NIVELES_LOG.SILENCIO, secrets: [] });
    expect(() => logger.info("server_start")).not.toThrow();
  });
});

describe("createLogger: rutas de redacción de pino (IN-19)", () => {
  test("salen de CLAVES_SENSIBLES en la raíz, un nivel abajo y en las cabeceras", () => {
    for (const clave of CLAVES_SENSIBLES) {
      expect(RUTAS_REDACCION_LOG).toEqual(
        expect.arrayContaining([clave, `*.${clave}`, `headers.${clave}`, `*.headers.${clave}`]),
      );
    }
    expect(RUTAS_REDACCION_LOG).toHaveLength(CLAVES_SENSIBLES.size * 4);
  });
});
