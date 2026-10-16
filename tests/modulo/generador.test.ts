import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { archivosDelModulo } from "@/cli/runners/generar-modulo.runner.ts";
import { ARCHIVO_PROMPT, DIRECTORIO_AGENTE } from "@/config/constants/files.constants.ts";
import {
  ARCHIVO_AGENTE_MODULO,
  DELIMITADOR_FRONTMATTER,
  DIRECTORIO_MODULO,
} from "@/config/constants/modulo.constants.ts";
import { TEXTO_MODULO } from "@/config/strings.ts";
import { conFrontmatter, frontmatterAgente } from "@/domain/builders/modulo.builder.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const RUTA_AGENTE = join(DIRECTORIO_MODULO, ARCHIVO_AGENTE_MODULO);
const RUTA_PROMPT = join(DIRECTORIO_AGENTE, ARCHIVO_PROMPT);

type Partido = { readonly frontmatter: string; readonly cuerpo: Uint8Array };

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

async function leerBytes(ruta: string): Promise<Uint8Array> {
  return new Uint8Array(await readFile(join(RAIZ, ruta)));
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
