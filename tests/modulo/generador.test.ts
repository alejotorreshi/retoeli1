import { afterEach, describe, expect, test } from "bun:test";
import { mkdir, mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, dirname, join } from "node:path";
import { archivosDelModulo, generarModulo } from "@/cli/runners/generar-modulo.runner.ts";
import {
  ARCHIVO_CONOCIMIENTO_PROCESO,
  ARCHIVO_PROMPT,
  ARCHIVO_PROYECTO,
  DIRECTORIO_AGENTE,
  DIRECTORIO_CONOCIMIENTO,
} from "@/config/constants/files.constants.ts";
import {
  ARCHIVO_AGENTE_MODULO,
  ARCHIVO_SKILL,
  DELIMITADOR_FRONTMATTER,
  DIRECTORIO_MODULO,
  DIRECTORIO_SKILLS_MODULO,
  NOMBRE_SKILL,
  SUFIJO_TEMPORAL_MODULO,
} from "@/config/constants/modulo.constants.ts";
import { TEXTO_MODULO } from "@/config/strings.ts";
import { conFrontmatter, frontmatterAgente, frontmatterSkill } from "@/domain/builders/modulo.builder.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const RUTA_AGENTE = join(DIRECTORIO_MODULO, ARCHIVO_AGENTE_MODULO);
const RUTA_SKILL = join(DIRECTORIO_MODULO, DIRECTORIO_SKILLS_MODULO, NOMBRE_SKILL, ARCHIVO_SKILL);
const RUTA_PROMPT = join(DIRECTORIO_AGENTE, ARCHIVO_PROMPT);
const RUTA_CONOCIMIENTO = join(DIRECTORIO_CONOCIMIENTO, ARCHIVO_CONOCIMIENTO_PROCESO);
const NOMBRE_DE_SKILL_OPENCODE = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const LARGO_MAXIMO_NOMBRE_SKILL = 64;
const LARGO_MAXIMO_DESCRIPCION_SKILL = 1024;

type Partido = { readonly frontmatter: string; readonly cuerpo: Uint8Array };

type Generacion = { readonly fallido: boolean; readonly lineas: readonly string[] };

const temporales: string[] = [];

afterEach(async () => {
  await Promise.all(temporales.splice(0).map((ruta) => rm(ruta, { recursive: true, force: true })));
});

function partir(contenido: Uint8Array): Partido {
  const texto = new TextDecoder().decode(contenido);
  const apertura = `${DELIMITADOR_FRONTMATTER}\n`;
  expect(texto.startsWith(apertura)).toBe(true);
  const cierre = texto.indexOf(`\n${apertura}`, apertura.length);
  expect(cierre).toBeGreaterThan(0);
  const cabecera = texto.slice(0, cierre + 1 + apertura.length);
  return {
    frontmatter: texto.slice(apertura.length, cierre + 1),
    cuerpo: contenido.subarray(new TextEncoder().encode(cabecera).length),
  };
}

async function leerBytes(ruta: string, raiz: string = RAIZ): Promise<Uint8Array> {
  return new Uint8Array(await readFile(join(raiz, ruta)));
}

async function generado(ruta: string): Promise<Uint8Array> {
  const lectura = await archivosDelModulo(RAIZ);
  if (!lectura.ok) throw new Error(`${lectura.ruta}: ${lectura.motivo}`);
  const archivo = lectura.archivos.find((candidato) => candidato.ruta === ruta);
  if (archivo === undefined) throw new Error(`no se generó ${ruta}`);
  return archivo.contenido;
}

function iguales(a: Uint8Array, b: Uint8Array): boolean {
  return Buffer.from(a).equals(Buffer.from(b));
}

async function raizTemporal(fuentes: Readonly<Record<string, Uint8Array | null>>): Promise<string> {
  const raiz = await mkdtemp(join(tmpdir(), "modulo-"));
  temporales.push(raiz);
  await writeFile(join(raiz, ARCHIVO_PROYECTO), '{ "name": "modulo-temporal", "private": true }\n');
  for (const [ruta, contenido] of Object.entries(fuentes)) {
    if (contenido === null) continue;
    await mkdir(join(raiz, dirname(ruta)), { recursive: true });
    await writeFile(join(raiz, ruta), contenido);
  }
  return raiz;
}

async function fuentesReales(): Promise<Record<string, Uint8Array>> {
  return {
    [RUTA_PROMPT]: await leerBytes(RUTA_PROMPT),
    [RUTA_CONOCIMIENTO]: await leerBytes(RUTA_CONOCIMIENTO),
  };
}

async function generarEn(raiz: string): Promise<Generacion> {
  const lineas: string[] = [];
  const { fallido } = await generarModulo({ raiz, escribir: (linea) => lineas.push(linea) });
  return { fallido, lineas };
}

async function existeModulo(raiz: string): Promise<boolean> {
  return (await readdir(raiz)).includes(DIRECTORIO_MODULO);
}

describe("los finales de línea no rompen la igualdad byte a byte (WR-02)", () => {
  const RUTAS_COMPARADAS = [RUTA_PROMPT, RUTA_CONOCIMIENTO, RUTA_AGENTE, RUTA_SKILL];
  const RETORNO_DE_CARRO = 0x0d;
  const EOL_LF = "eol: lf";

  test(".gitattributes fija LF en las fuentes y en lo generado, también en un checkout de Windows", () => {
    const consulta = Bun.spawnSync(["git", "check-attr", "eol", "--", ...RUTAS_COMPARADAS], { cwd: RAIZ });
    expect(consulta.exitCode).toBe(0);
    const lineas = consulta.stdout.toString().trim().split("\n");
    expect(lineas).toEqual(RUTAS_COMPARADAS.map((ruta) => `${ruta}: ${EOL_LF}`));
  });

  test("ninguna fuente ni archivo generado trae CRLF", async () => {
    for (const ruta of RUTAS_COMPARADAS) {
      expect((await leerBytes(ruta)).includes(RETORNO_DE_CARRO)).toBe(false);
    }
  });
});

describe("modulo/agent.md sale del generador (MOD-01, MOD-02)", () => {
  test("el archivo commiteado es byte a byte la salida del generador", async () => {
    expect(iguales(await leerBytes(RUTA_AGENTE), await generado(RUTA_AGENTE))).toBe(true);
  });

  test("el cuerpo después del frontmatter es exactamente agent/prompt.md", async () => {
    const { cuerpo } = partir(await leerBytes(RUTA_AGENTE));
    expect(iguales(cuerpo, await leerBytes(RUTA_PROMPT))).toBe(true);
  });

  test("el frontmatter declara descripción, modo primario y niega edición y shell", async () => {
    const { frontmatter } = partir(await leerBytes(RUTA_AGENTE));
    expect(Bun.YAML.parse(frontmatter)).toEqual({
      description: TEXTO_MODULO.descripcionAgente,
      mode: "primary",
      permission: { edit: "deny", bash: "deny" },
    });
  });

  test("el builder con el prompt reproduce el archivo commiteado", async () => {
    const esperado = conFrontmatter(
      frontmatterAgente(TEXTO_MODULO.descripcionAgente),
      await leerBytes(RUTA_PROMPT),
    );
    expect(iguales(await leerBytes(RUTA_AGENTE), esperado)).toBe(true);
  });

  test("la deriva muerde: un byte más en el prompt ya no coincide con el commiteado", async () => {
    const prompt = await leerBytes(RUTA_PROMPT);
    const editado = new Uint8Array([...prompt, 0x20]);
    const derivado = conFrontmatter(frontmatterAgente(TEXTO_MODULO.descripcionAgente), editado);
    expect(iguales(await leerBytes(RUTA_AGENTE), derivado)).toBe(false);
  });
});

describe("modulo/skill/registro-proveedor/SKILL.md sale del generador (MOD-01, MOD-02)", () => {
  test("el archivo commiteado es byte a byte la salida del generador", async () => {
    expect(iguales(await leerBytes(RUTA_SKILL), await generado(RUTA_SKILL))).toBe(true);
  });

  test("el cuerpo después del frontmatter es exactamente el conocimiento del proceso", async () => {
    const { cuerpo } = partir(await leerBytes(RUTA_SKILL));
    expect(iguales(cuerpo, await leerBytes(RUTA_CONOCIMIENTO))).toBe(true);
  });

  test("el frontmatter declara solo name y description", async () => {
    const { frontmatter } = partir(await leerBytes(RUTA_SKILL));
    expect(Bun.YAML.parse(frontmatter)).toEqual({
      name: "registro-proveedor",
      description: TEXTO_MODULO.descripcionSkill,
    });
  });

  test("name coincide con su carpeta y cumple la regla de nombres de skills de OpenCode", () => {
    expect(basename(dirname(RUTA_SKILL))).toBe(NOMBRE_SKILL);
    expect(NOMBRE_SKILL).toMatch(NOMBRE_DE_SKILL_OPENCODE);
    expect(NOMBRE_SKILL.length).toBeLessThanOrEqual(LARGO_MAXIMO_NOMBRE_SKILL);
    expect(TEXTO_MODULO.descripcionSkill.length).toBeGreaterThan(0);
    expect(TEXTO_MODULO.descripcionSkill.length).toBeLessThanOrEqual(LARGO_MAXIMO_DESCRIPCION_SKILL);
  });

  test("la deriva muerde: un byte más en el conocimiento ya no coincide con el commiteado", async () => {
    const conocimiento = await leerBytes(RUTA_CONOCIMIENTO);
    const editado = new Uint8Array([...conocimiento, 0x20]);
    const derivado = conFrontmatter(frontmatterSkill(NOMBRE_SKILL, TEXTO_MODULO.descripcionSkill), editado);
    expect(iguales(await leerBytes(RUTA_SKILL), derivado)).toBe(false);
  });

  test("el generador entrega primero el agente y después la skill", async () => {
    const lectura = await archivosDelModulo(RAIZ);
    expect(lectura.ok && lectura.archivos.map(({ ruta }) => ruta)).toEqual([RUTA_AGENTE, RUTA_SKILL]);
  });
});

describe("generarModulo falla fuerte y no escribe nada con una fuente rota", () => {
  test("un prompt vacío devuelve fallido, avisa fuenteVacia y no crea modulo/", async () => {
    const raiz = await raizTemporal({ ...(await fuentesReales()), [RUTA_PROMPT]: new Uint8Array() });
    const { fallido, lineas } = await generarEn(raiz);
    expect(fallido).toBe(true);
    expect(lineas).toEqual([TEXTO_MODULO.fuenteVacia(RUTA_PROMPT)]);
    expect(await existeModulo(raiz)).toBe(false);
  });

  test("un prompt vacío de solo espacios también es fuente vacía", async () => {
    const espacios = new TextEncoder().encode("  \n\t\r\n");
    const raiz = await raizTemporal({ ...(await fuentesReales()), [RUTA_PROMPT]: espacios });
    const { fallido, lineas } = await generarEn(raiz);
    expect(fallido).toBe(true);
    expect(lineas).toEqual([TEXTO_MODULO.fuenteVacia(RUTA_PROMPT)]);
    expect(await existeModulo(raiz)).toBe(false);
  });

  test("un conocimiento vacío devuelve fallido sin escribir siquiera agent.md", async () => {
    const raiz = await raizTemporal({ ...(await fuentesReales()), [RUTA_CONOCIMIENTO]: new Uint8Array() });
    const { fallido, lineas } = await generarEn(raiz);
    expect(fallido).toBe(true);
    expect(lineas).toEqual([TEXTO_MODULO.fuenteVacia(RUTA_CONOCIMIENTO)]);
    expect(await existeModulo(raiz)).toBe(false);
  });

  test("un conocimiento ausente devuelve fallido, avisa fuenteAusente y no escribe agent.md", async () => {
    const raiz = await raizTemporal({ ...(await fuentesReales()), [RUTA_CONOCIMIENTO]: null });
    const { fallido, lineas } = await generarEn(raiz);
    expect(fallido).toBe(true);
    expect(lineas).toEqual([TEXTO_MODULO.fuenteAusente(RUTA_CONOCIMIENTO)]);
    expect(await existeModulo(raiz)).toBe(false);
  });

  test("un prompt ausente devuelve fallido con fuenteAusente", async () => {
    const raiz = await raizTemporal({ ...(await fuentesReales()), [RUTA_PROMPT]: null });
    const { fallido, lineas } = await generarEn(raiz);
    expect(fallido).toBe(true);
    expect(lineas).toEqual([TEXTO_MODULO.fuenteAusente(RUTA_PROMPT)]);
    expect(await existeModulo(raiz)).toBe(false);
  });

  test("fuera de la raíz del proyecto no escribe nada", async () => {
    const raiz = await raizTemporal(await fuentesReales());
    await rm(join(raiz, ARCHIVO_PROYECTO));
    const { fallido, lineas } = await generarEn(raiz);
    expect(fallido).toBe(true);
    expect(lineas).toEqual([TEXTO_MODULO.fueraDeLaRaiz]);
    expect(await existeModulo(raiz)).toBe(false);
  });
});

describe("generarModulo escribe por archivo temporal y renombre", () => {
  test("no deja archivos temporales y solo escribe agent.md y SKILL.md", async () => {
    const raiz = await raizTemporal(await fuentesReales());
    expect((await generarEn(raiz)).fallido).toBe(false);
    const entradas = await readdir(join(raiz, DIRECTORIO_MODULO), { recursive: true });
    expect(entradas.filter((entrada) => entrada.endsWith(SUFIJO_TEMPORAL_MODULO))).toEqual([]);
    const relativas = [RUTA_AGENTE, RUTA_SKILL].map((ruta) => ruta.slice(DIRECTORIO_MODULO.length + 1));
    expect(entradas.filter((entrada) => entrada.endsWith(".md")).sort()).toEqual(relativas.sort());
  });
});

describe("generarModulo es idempotente", () => {
  test("dos corridas sobre la misma raíz dejan los mismos bytes", async () => {
    const raiz = await raizTemporal(await fuentesReales());
    const primera = await generarEn(raiz);
    expect(primera).toEqual({
      fallido: false,
      lineas: [TEXTO_MODULO.generado(RUTA_AGENTE), TEXTO_MODULO.generado(RUTA_SKILL)],
    });
    const agente = await leerBytes(RUTA_AGENTE, raiz);
    const skill = await leerBytes(RUTA_SKILL, raiz);
    expect((await generarEn(raiz)).fallido).toBe(false);
    expect(iguales(await leerBytes(RUTA_AGENTE, raiz), agente)).toBe(true);
    expect(iguales(await leerBytes(RUTA_SKILL, raiz), skill)).toBe(true);
    expect(iguales(agente, await leerBytes(RUTA_AGENTE))).toBe(true);
    expect(iguales(skill, await leerBytes(RUTA_SKILL))).toBe(true);
  });
});
