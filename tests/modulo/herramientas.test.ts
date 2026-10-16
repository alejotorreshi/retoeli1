import { afterAll, describe, expect, test } from "bun:test";
import { basename, join } from "node:path";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { DIRECTORIO_MODULO } from "@/config/constants/modulo.constants.ts";
import { NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import * as app from "@/tools/proveedor.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const RUTA_MODULO = join(RAIZ, DIRECTORIO_MODULO, "tools", "proveedor.ts");
const RUTA_OPENCODE = join(RAIZ, ".opencode", "tools", "proveedor.ts");
const CINCO_HERRAMIENTAS = "armar_paquete,generar_formulario,leer_solicitud,mapear_campos,simular_envio";
const CASO = "ec-corp-andina";

type RespuestaEnvio = { readonly ok: boolean; readonly codigo?: string };

const proyectos: ProyectoTemporal[] = [];

afterAll(async () => {
  await Promise.all(proyectos.map((proyecto) => proyecto.limpiar()));
});

async function importar(ruta: string): Promise<Record<string, unknown>> {
  return Object.fromEntries(Object.entries(await import(ruta)));
}

function esSimularEnvio(valor: unknown): valor is typeof app.simular_envio {
  return (
    typeof valor === "object" && valor !== null && "execute" in valor && typeof valor.execute === "function"
  );
}

async function importarSinEntorno(ruta: string): Promise<{ codigo: number; salida: string }> {
  const proceso = Bun.spawn(
    [
      process.execPath,
      "-e",
      `const m = await import(${JSON.stringify(ruta)}); console.log(Object.keys(m).sort().join(","));`,
    ],
    { cwd: RAIZ, env: {}, stdout: "pipe", stderr: "pipe" },
  );
  const salida = await new Response(proceso.stdout).text();
  return { codigo: await proceso.exited, salida: salida.trim() };
}

describe("modulo/tools/proveedor.ts reexporta las herramientas de la app (MOD-02, D-81)", () => {
  test("exporta exactamente las cinco herramientas y cada una es la misma referencia que la app", async () => {
    const modulo = await importar(RUTA_MODULO);
    expect(Object.keys(modulo).sort()).toEqual(Object.keys(app).sort());
    expect(Object.keys(modulo).sort().join(",")).toBe(CINCO_HERRAMIENTAS);
    for (const [nombre, herramienta] of Object.entries(app)) expect(modulo[nombre]).toBe(herramienta);
  });

  test("se importa con el entorno vacío, sin servidor, y lista las cinco herramientas", async () => {
    const { codigo, salida } = await importarSinEntorno(RUTA_MODULO);
    expect(codigo).toBe(0);
    expect(salida).toBe(CINCO_HERRAMIENTAS);
  });

  test("proveedor_simular_envio del módulo rechaza la llamada sin confirmado: true", async () => {
    const simular = (await importar(RUTA_MODULO)).simular_envio;
    if (!esSimularEnvio(simular))
      throw new Error(`simular_envio del módulo no es una herramienta: ${simular}`);
    const proyecto = await crearProyectoTemporal();
    proyectos.push(proyecto);
    const crudo = await simular.execute(
      { caso: CASO, confirmado: false },
      { directory: proyecto.raiz, sessionId: "modulo-prueba" },
    );
    const respuesta: RespuestaEnvio = JSON.parse(crudo);
    expect(respuesta.ok).toBe(false);
    expect(respuesta.codigo).toBe(CODIGO_ERROR.CONFIRMACION_REQUERIDA);
  });
});

describe(".opencode/tools/proveedor.ts enlaza el módulo para OpenCode (D-83, D-96)", () => {
  test("exporta exactamente las cinco herramientas y cada una es la misma referencia que la app", async () => {
    const enlace = await importar(RUTA_OPENCODE);
    const modulo = await importar(RUTA_MODULO);
    expect(Object.keys(enlace).sort().join(",")).toBe(CINCO_HERRAMIENTAS);
    for (const [nombre, herramienta] of Object.entries(app)) {
      expect(enlace[nombre]).toBe(herramienta);
      expect(enlace[nombre]).toBe(modulo[nombre]);
    }
  });

  test("se importa con el entorno vacío y lista las cinco herramientas", async () => {
    const { codigo, salida } = await importarSinEntorno(RUTA_OPENCODE);
    expect(codigo).toBe(0);
    expect(salida).toBe(CINCO_HERRAMIENTAS);
  });

  test("OpenCode nombra cada herramienta <archivo>_<export> y coincide con proveedor_<export> de la app", async () => {
    const archivo = basename(RUTA_OPENCODE, ".ts");
    const nombres = Object.keys(await importar(RUTA_OPENCODE)).map((exportado) => `${archivo}_${exportado}`);
    expect(nombres.sort()).toEqual(Object.values(NOMBRE_VISIBLE).sort());
  });
});
