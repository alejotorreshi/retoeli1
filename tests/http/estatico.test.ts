import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { crearFetchFalso } from "@tests/helpers/fetch-falso.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import { BINDINGS_PRUEBA, crearServidorPrueba } from "@tests/helpers/servidor-prueba.helper.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { ServidorPrueba } from "@tests/helpers/types/servidor-prueba.type.ts";
import {
  ARCHIVO_INDEX_WEB,
  DIRECTORIO_WEB_DIST,
  PREFIJO_API,
  RESPUESTA_HTTP,
  RUTA_API,
} from "@/config/constants/http.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";

const INDEX_HTML = '<!doctype html><html lang="es"><body><div id="root"></div>spa-indice-7Qx</body></html>';
const APP_JS = 'console.log("app-js-3Rt");';
const RUTA_APP_JS = "/assets/app.js";
const RUTA_TRAVERSAL = "/..%2f..%2fpackage.json";
const MARCA_PACKAGE_JSON = "proyecto-temporal";
const ACTIVOS_DE_MARCA = [
  { ruta: "/fuentes/montserrat-latin-400.woff2", tipo: "font/woff2" },
  { ruta: "/marca/periferia-it-group.webp", tipo: "image/webp" },
  { ruta: "/marca/favicon.jpg", tipo: "image/jpeg" },
] as const;
const CONTENIDO_ACTIVO = new Uint8Array([1, 2, 3, 4]);

let proyecto: ProyectoTemporal;
let directorioWeb: string;

beforeAll(async () => {
  proyecto = await crearProyectoTemporal();
  directorioWeb = join(proyecto.raiz, DIRECTORIO_WEB_DIST);
  await mkdir(join(directorioWeb, "assets"), { recursive: true });
  await writeFile(join(directorioWeb, ARCHIVO_INDEX_WEB), INDEX_HTML);
  await writeFile(join(directorioWeb, RUTA_APP_JS), APP_JS);
  await mkdir(join(directorioWeb, "fuentes"), { recursive: true });
  await mkdir(join(directorioWeb, "marca"), { recursive: true });
  for (const { ruta } of ACTIVOS_DE_MARCA) await writeFile(join(directorioWeb, ruta), CONTENIDO_ACTIVO);
});

afterAll(async () => {
  await proyecto.limpiar();
});

function servidor(conDirectorio = true): ServidorPrueba {
  return crearServidorPrueba({
    raiz: proyecto.raiz,
    fetch: crearFetchFalso([]).fetch,
    ...(conDirectorio ? { directorioWeb } : {}),
  });
}

async function pedirPublico(ruta: string): Promise<Response> {
  return servidor().app.request(ruta, {}, BINDINGS_PRUEBA);
}

describe("la SPA construida se sirve desde el mismo proceso", () => {
  test("GET / responde index.html sin acceso", async () => {
    const respuesta = await pedirPublico("/");
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(respuesta.headers.get("Content-Type")).toContain("text/html");
    expect(await respuesta.text()).toBe(INDEX_HTML);
  });

  test("una ruta del cliente fuera de /api cae en index.html", async () => {
    const respuesta = await pedirPublico("/casos/x");
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(await respuesta.text()).toBe(INDEX_HTML);
  });

  test("un asset existente se sirve con su tipo", async () => {
    const respuesta = await pedirPublico(RUTA_APP_JS);
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(respuesta.headers.get("Content-Type")).toContain("javascript");
    expect(await respuesta.text()).toBe(APP_JS);
  });

  for (const { ruta, tipo } of ACTIVOS_DE_MARCA) {
    test(`${ruta} se sirve como ${tipo} sin código de acceso`, async () => {
      const respuesta = await pedirPublico(ruta);
      expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
      expect(respuesta.headers.get("Content-Type")).toBe(tipo);
      expect(new Uint8Array(await respuesta.arrayBuffer())).toEqual(CONTENIDO_ACTIVO);
    });
  }

  test("un ../ codificado responde index.html y nunca el package.json de la raíz", async () => {
    expect(await Bun.file(join(proyecto.raiz, "package.json")).text()).toContain(MARCA_PACKAGE_JSON);
    const respuesta = await pedirPublico(RUTA_TRAVERSAL);
    const texto = await respuesta.text();
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(texto).toBe(INDEX_HTML);
    expect(texto).not.toContain(MARCA_PACKAGE_JSON);
  });

  test("sin webDirectory explícito sirve rootDirectory/web/dist", async () => {
    const respuesta = await servidor(false).app.request("/", {}, BINDINGS_PRUEBA);
    expect(await respuesta.text()).toBe(INDEX_HTML);
  });

  test("una ruta /api desconocida sigue respondiendo 404 con mensaje", async () => {
    const respuesta = await servidor().pedir(`${PREFIJO_API}/inexistente`);
    expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_ENCONTRADO);
    expect(await respuesta.json()).toEqual({ mensaje: MENSAJE_HTTP.rutaNoEncontrada });
  });

  test("las rutas /api conocidas no cambian", async () => {
    const respuesta = await pedirPublico(RUTA_API.SALUD);
    expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
    expect(await respuesta.json()).toMatchObject({ ok: true });
  });
});
