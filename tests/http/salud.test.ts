import { afterEach, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA } from "@tests/helpers/agente-fetch.helper.ts";
import { crearFetchFalso } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { PUERTO_API_POR_DEFECTO, RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import type { HttpBindings } from "@/http/types/server.type.ts";
import { createServer } from "@/http/wiring/server.wiring.ts";

const ENTORNO = { LLM_API_KEY: CLAVE_PRUEBA, LOG_LEVEL: NIVELES_LOG.SILENCIO };

const BINDINGS: HttpBindings = {
  timeout: () => undefined,
  requestIP: () => ({ address: "127.0.0.1" }),
};

const SALUD_ESPERADA = { ok: true, provider: "deepseek", model: "deepseek-flash" };

const limpiezas: (() => unknown)[] = [];

afterEach(async () => {
  for (const limpiar of limpiezas.splice(0)) await limpiar();
});

async function servidorDePrueba(entorno: Readonly<Record<string, string>> = ENTORNO) {
  const proyecto = await crearProyectoTemporal();
  limpiezas.push(proyecto.limpiar);
  const falso = crearFetchFalso([]);
  const creacion = createServer({ rootDirectory: proyecto.raiz, fetch: falso.fetch, envSource: entorno });
  return { creacion, pedidos: falso.pedidos };
}

function cabecerasComoTexto(respuesta: Response): string {
  return JSON.stringify([...respuesta.headers.entries()]);
}

describe("GET /api/health", () => {
  test("responde ok, proveedor y modelo sin acceso, sin llamar al proveedor y sin la clave", async () => {
    const { creacion, pedidos } = await servidorDePrueba();
    if (!creacion.ok) throw new Error(creacion.mensaje);
    const respuesta = await creacion.app.request(RUTA_API.SALUD, {}, BINDINGS);
    const texto = await respuesta.text();
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(JSON.parse(texto)).toEqual(SALUD_ESPERADA);
    expect(pedidos).toHaveLength(0);
    expect(texto).not.toContain(CLAVE_PRUEBA);
    expect(cabecerasComoTexto(respuesta)).not.toContain(CLAVE_PRUEBA);
  });

  test("responde lo mismo sobre un socket real de Bun.serve", async () => {
    const { creacion, pedidos } = await servidorDePrueba();
    if (!creacion.ok) throw new Error(creacion.mensaje);
    const servidor = Bun.serve({ port: 0, fetch: creacion.app.fetch });
    limpiezas.push(() => servidor.stop(true));
    const respuesta = await fetch(new URL(RUTA_API.SALUD, servidor.url));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(await respuesta.json()).toEqual(SALUD_ESPERADA);
    expect(cabecerasComoTexto(respuesta)).not.toContain(CLAVE_PRUEBA);
    expect(pedidos).toHaveLength(0);
  });

  test("un PORT fuera de rango no arma el servidor y explica el motivo", async () => {
    const { creacion } = await servidorDePrueba({ ...ENTORNO, PORT: "70000" });
    expect(creacion.ok).toBe(false);
    if (creacion.ok) return;
    expect(creacion.mensaje.length).toBeGreaterThan(0);
    expect(creacion.mensaje).toContain("PORT");
  });

  test("sin PORT el servidor usa el puerto por defecto", async () => {
    const { creacion } = await servidorDePrueba();
    expect(creacion.ok && creacion.port).toBe(PUERTO_API_POR_DEFECTO);
  });
});
