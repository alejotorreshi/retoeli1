import { afterEach, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA } from "@tests/helpers/agente-fetch.helper.ts";
import { crearFetchFalso } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { cabecerasPrueba, crearServidorPrueba } from "@tests/helpers/servidor-prueba.helper.ts";
import { PUERTO_API_POR_DEFECTO, RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";

const SALUD_ESPERADA = { ok: true, provider: "deepseek", model: "deepseek-flash" };

const limpiezas: (() => unknown)[] = [];

afterEach(async () => {
  for (const limpiar of limpiezas.splice(0)) await limpiar();
});

async function servidorDePrueba(entorno: Readonly<Record<string, string>> = {}) {
  const proyecto = await crearProyectoTemporal();
  limpiezas.push(proyecto.limpiar);
  const falso = crearFetchFalso([]);
  const armar = () => crearServidorPrueba({ raiz: proyecto.raiz, fetch: falso.fetch, entorno });
  return { armar, pedidos: falso.pedidos };
}

function cabecerasComoTexto(respuesta: Response): string {
  return JSON.stringify([...respuesta.headers.entries()]);
}

describe("GET /api/health", () => {
  test("responde ok, proveedor y modelo sin acceso, sin llamar al proveedor y sin la clave", async () => {
    const { armar, pedidos } = await servidorDePrueba();
    const respuesta = await armar().pedir(RUTA_API.SALUD);
    const texto = await respuesta.text();
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(JSON.parse(texto)).toEqual(SALUD_ESPERADA);
    expect(pedidos).toHaveLength(0);
    expect(texto).not.toContain(CLAVE_PRUEBA);
    expect(cabecerasComoTexto(respuesta)).not.toContain(CLAVE_PRUEBA);
  });

  test("responde lo mismo sobre un socket real de Bun.serve", async () => {
    const { armar, pedidos } = await servidorDePrueba();
    const servidor = Bun.serve({ port: 0, fetch: armar().app.fetch });
    limpiezas.push(() => servidor.stop(true));
    const respuesta = await fetch(new URL(RUTA_API.SALUD, servidor.url), { headers: cabecerasPrueba() });
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(await respuesta.json()).toEqual(SALUD_ESPERADA);
    expect(cabecerasComoTexto(respuesta)).not.toContain(CLAVE_PRUEBA);
    expect(pedidos).toHaveLength(0);
  });

  test("un PORT fuera de rango no arma el servidor y explica el motivo", async () => {
    const { armar } = await servidorDePrueba({ PORT: "70000" });
    expect(armar).toThrow("PORT");
  });

  test("sin PORT el servidor usa el puerto por defecto", async () => {
    const { armar } = await servidorDePrueba();
    expect(armar().port).toBe(PUERTO_API_POR_DEFECTO);
  });
});
