import { describe, expect, test } from "bun:test";
import { DELIMITADOR_FRONTMATTER, NOMBRE_SKILL } from "@/config/constants/modulo.constants.ts";
import { conFrontmatter, frontmatterAgente, frontmatterSkill } from "@/domain/builders/modulo.builder.ts";

const DESCRIPCION_DIFICIL =
  'Llena "formularios": año, señal y \\ barra; también #almohadilla y - guion: listo.';
const BOM = [0xef, 0xbb, 0xbf];
const CRLF = [0x0d, 0x0a];

function interior(frontmatter: string): string {
  const lineas = frontmatter.split("\n");
  expect(lineas[0]).toBe(DELIMITADOR_FRONTMATTER);
  expect(lineas.at(-2)).toBe(DELIMITADOR_FRONTMATTER);
  expect(lineas.at(-1)).toBe("");
  return lineas.slice(1, -2).join("\n");
}

describe("frontmatterAgente", () => {
  test("una descripción con dos puntos, comillas y ñ vuelve intacta por Bun.YAML.parse", () => {
    expect(Bun.YAML.parse(interior(frontmatterAgente(DESCRIPCION_DIFICIL)))).toEqual({
      description: DESCRIPCION_DIFICIL,
      mode: "primary",
      permission: { edit: "deny", bash: "deny" },
    });
  });

  test("cada línea termina en salto de línea y abre y cierra con el delimitador", () => {
    const texto = frontmatterAgente("Agente.");
    expect(texto.startsWith(`${DELIMITADOR_FRONTMATTER}\n`)).toBe(true);
    expect(texto.endsWith(`\n${DELIMITADOR_FRONTMATTER}\n`)).toBe(true);
  });
});

describe("frontmatterSkill", () => {
  test("una descripción con dos puntos, comillas y ñ vuelve intacta por Bun.YAML.parse", () => {
    expect(Bun.YAML.parse(interior(frontmatterSkill(NOMBRE_SKILL, DESCRIPCION_DIFICIL)))).toEqual({
      name: NOMBRE_SKILL,
      description: DESCRIPCION_DIFICIL,
    });
  });

  test("la segunda línea es name con el nombre de la skill", () => {
    expect(frontmatterSkill(NOMBRE_SKILL, "Skill.").split("\n")[1]).toBe(`name: ${NOMBRE_SKILL}`);
  });
});

describe("conFrontmatter", () => {
  test("copia sin tocar un cuerpo que empieza con BOM y termina en CRLF", () => {
    const cuerpo = new Uint8Array([...BOM, ...new TextEncoder().encode("# Título ñ"), ...CRLF]);
    const frontmatter = frontmatterAgente("Agente.");
    const cabecera = new TextEncoder().encode(frontmatter);
    const resultado = conFrontmatter(frontmatter, cuerpo);
    expect(resultado.length).toBe(cabecera.length + cuerpo.length);
    expect(Buffer.from(resultado.subarray(0, cabecera.length)).equals(Buffer.from(cabecera))).toBe(true);
    expect(Buffer.from(resultado.subarray(cabecera.length)).equals(Buffer.from(cuerpo))).toBe(true);
  });

  test("un cuerpo vacío deja solo el frontmatter", () => {
    const frontmatter = frontmatterSkill(NOMBRE_SKILL, "Skill.");
    expect(new TextDecoder().decode(conFrontmatter(frontmatter, new Uint8Array()))).toBe(frontmatter);
  });
});
