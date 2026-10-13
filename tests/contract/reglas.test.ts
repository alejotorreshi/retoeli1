import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { copiarConocimiento, crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { ConocimientoTemporal, ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { MENSAJE_ERROR } from "@/config/strings.ts";
import { crearHerramientas } from "@/tools/factories/herramientas.factory.ts";

type Item = { etiqueta: string; estado: string; regla: string; confianza: number; nota: string | null };

type DatosMapeo = { llenos: Item[]; faltantes: Item[]; requiere_confirmacion: Item[] };

type Respuesta = { ok: boolean; data?: DatosMapeo; error?: string; codigo?: string };

type ReglasCrudas = Record<string, unknown> & {
  confianza: Record<string, number>;
  identificador_tributario: Record<string, unknown>;
};

const NOTA_ORIGINAL = "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano";

let proyecto: ProyectoTemporal;
const conocimientos: ConocimientoTemporal[] = [];
const fechaPrevia = process.env.FECHA_EJECUCION;

beforeAll(async () => {
  process.env.FECHA_EJECUCION = "2026-09-03";
  proyecto = await crearProyectoTemporal({ sinteticos: ["zz-generica-co"] });
});

afterAll(async () => {
  if (fechaPrevia === undefined) delete process.env.FECHA_EJECUCION;
  else process.env.FECHA_EJECUCION = fechaPrevia;
  await proyecto.limpiar();
  await Promise.all(conocimientos.map((conocimiento) => conocimiento.limpiar()));
});

type Copia = {
  readonly herramientas: ReturnType<typeof crearHerramientas>;
  leer(): Promise<ReglasCrudas>;
  escribir(contenido: string): Promise<void>;
  editar(cambio: (reglas: ReglasCrudas) => void): Promise<void>;
};

async function copia(): Promise<Copia> {
  const conocimiento = await copiarConocimiento();
  conocimientos.push(conocimiento);
  const ruta = join(conocimiento.directorio, "reglas.json");
  const leer = async (): Promise<ReglasCrudas> => JSON.parse(await readFile(ruta, "utf8"));
  const escribir = (contenido: string): Promise<void> => writeFile(ruta, contenido);
  return {
    herramientas: crearHerramientas({ directorioConocimiento: conocimiento.directorio }),
    leer,
    escribir,
    async editar(cambio) {
      const reglas = await leer();
      cambio(reglas);
      await escribir(JSON.stringify(reglas, null, 2));
    },
  };
}

const ctx = () => ({ directory: proyecto.raiz, sessionId: "reglas" });

async function mapearCrudo(herramientas: Copia["herramientas"], caso: string): Promise<string> {
  return herramientas.mapear_campos.execute({ caso, campos: [] }, ctx());
}

async function leerCrudo(herramientas: Copia["herramientas"], caso: string): Promise<string> {
  return herramientas.leer_solicitud.execute({ caso }, ctx());
}

function item(datos: DatosMapeo | undefined, etiqueta: string): Item {
  const encontrado = [
    ...(datos?.llenos ?? []),
    ...(datos?.faltantes ?? []),
    ...(datos?.requiere_confirmacion ?? []),
  ].find((candidato) => candidato.etiqueta === etiqueta);
  if (encontrado === undefined) throw new Error(`sin item ${etiqueta}`);
  return encontrado;
}

function esperarReglasInvalidas(crudo: string): void {
  const respuesta: Respuesta = JSON.parse(crudo);
  expect(respuesta.ok).toBe(false);
  expect(respuesta.codigo).toBe("REGLAS_INVALIDAS");
  expect(respuesta.error?.startsWith(MENSAJE_ERROR.REGLAS_INVALIDAS)).toBe(true);
  const lineas = [...crudo.split("\n"), ...(respuesta.error ?? "").split("\n")];
  expect(lineas.some((linea) => linea.startsWith("    at "))).toBe(false);
}

describe("reglas.json inválido da REGLAS_INVALIDAS en español y sin traza (CAL-03, D-29)", () => {
  test("umbral 2 falla en mapear_campos y en leer_solicitud", async () => {
    const reglas = await copia();
    await reglas.editar((crudas) => {
      crudas.confianza.umbral = 2;
    });
    esperarReglasInvalidas(await mapearCrudo(reglas.herramientas, "co-industrias-delta"));
    esperarReglasInvalidas(await leerCrudo(reglas.herramientas, "co-industrias-delta"));
  });

  test("un JSON truncado falla", async () => {
    const reglas = await copia();
    const texto = JSON.stringify(await reglas.leer(), null, 2);
    await reglas.escribir(texto.slice(0, Math.floor(texto.length / 2)));
    const crudo = await mapearCrudo(reglas.herramientas, "co-industrias-delta");
    esperarReglasInvalidas(crudo);
    expect(JSON.parse(crudo).error).toContain("no es JSON válido");
  });

  test("una nota de contexto con una variable desconocida falla al cargar, aunque el caso no use esa ruta (IN-09)", async () => {
    const reglas = await copia();
    await reglas.editar((crudas) => {
      crudas.notas_contexto = [{ ruta: "sitio_web", aplica: "siempre", texto: "{{monedaa}}" }];
    });
    const crudo = await leerCrudo(reglas.herramientas, "co-industrias-delta");
    esperarReglasInvalidas(crudo);
    expect(JSON.parse(crudo).error).toContain("monedaa");
  });

  test("una llave desconocida en la raíz falla por el esquema estricto", async () => {
    const reglas = await copia();
    await reglas.editar((crudas) => {
      crudas.llave_desconocida = true;
    });
    esperarReglasInvalidas(await mapearCrudo(reglas.herramientas, "co-industrias-delta"));
    esperarReglasInvalidas(await leerCrudo(reglas.herramientas, "co-industrias-delta"));
  });
});

describe("reglas.json se lee en cada ejecución, sin caché (D-28)", () => {
  test("editar nota_extranjero cambia la nota del RUC en la siguiente llamada del mismo proceso", async () => {
    const reglas = await copia();
    const antes: Respuesta = JSON.parse(await mapearCrudo(reglas.herramientas, "ec-corp-andina"));
    expect(item(antes.data, "RUC").nota).toBe(NOTA_ORIGINAL);
    const nuevaNota = "Identificador extranjero (texto editado): validar con el cliente si acepta el NIT";
    await reglas.editar((crudas) => {
      crudas.identificador_tributario.nota_extranjero = nuevaNota;
    });
    const despues: Respuesta = JSON.parse(await mapearCrudo(reglas.herramientas, "ec-corp-andina"));
    expect(item(despues.data, "RUC").nota).toBe(nuevaNota);
  });
});

describe("el umbral de confianza se aplica desde el archivo (MAP-02)", () => {
  const casos: readonly (readonly [number, string])[] = [
    [0.86, "requiere_confirmacion"],
    [0.85, "lleno"],
  ];

  for (const [umbral, estado] of casos) {
    test(`con umbral ${umbral} "Sitio web" de clave directa queda ${estado}`, async () => {
      const reglas = await copia();
      await reglas.editar((crudas) => {
        crudas.confianza.umbral = umbral;
      });
      const respuesta: Respuesta = JSON.parse(await mapearCrudo(reglas.herramientas, "zz-generica-co"));
      expect(respuesta.ok).toBe(true);
      expect(item(respuesta.data, "Sitio web")).toMatchObject({
        estado,
        regla: "clave_directa",
        confianza: 0.85,
      });
    });
  }
});

describe("RN1 no se desactiva editando la escala de confianza (WR-03)", () => {
  test("con regla_pais y etiqueta_generica en 0.95 el RUC de ec y la genérica siguen por confirmar", async () => {
    const reglas = await copia();
    await reglas.editar((crudas) => {
      crudas.confianza.regla_pais = 0.95;
      crudas.confianza.etiqueta_generica = 0.95;
    });
    const ec: Respuesta = JSON.parse(await mapearCrudo(reglas.herramientas, "ec-corp-andina"));
    expect(item(ec.data, "RUC")).toMatchObject({
      estado: "requiere_confirmacion",
      regla: "regla_pais",
      confianza: 0.95,
    });
    const generica: Respuesta = JSON.parse(await mapearCrudo(reglas.herramientas, "zz-generica-co"));
    expect(item(generica.data, "Identificación tributaria")).toMatchObject({
      estado: "requiere_confirmacion",
      regla: "etiqueta_generica",
    });
  });
});
