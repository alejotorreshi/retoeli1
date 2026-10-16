import { describe, expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { z } from "zod";
import {
  ARCHIVO_AGENTE_MODULO,
  ARCHIVO_SKILL,
  DELIMITADOR_FRONTMATTER,
  DIRECTORIO_MODULO,
  DIRECTORIO_SKILLS_MODULO,
  MODO_AGENTE_MODULO,
  NOMBRE_SKILL,
  PERMISO_MODULO,
} from "@/config/constants/modulo.constants.ts";
import { TEXTO_MODULO } from "@/config/strings.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const ARCHIVO_CONFIG = "opencode.json";
const ESQUEMA_OPENCODE = "https://opencode.ai/config.json";
const NOMBRE_AGENTE = "registro-proveedor";
const RUTA_AGENTE = `./${DIRECTORIO_MODULO}/${ARCHIVO_AGENTE_MODULO}`;
const RUTA_SKILLS = `./${DIRECTORIO_MODULO}/${DIRECTORIO_SKILLS_MODULO}`;
const PROMPT_AGENTE = `{file:${RUTA_AGENTE}}`;
const ENLACE_HERRAMIENTAS = join(".opencode", "tools", "proveedor.ts");

const permisoSchema = z.strictObject({ edit: z.string(), bash: z.string() });

const agenteSchema = z.strictObject({
  description: z.string(),
  mode: z.string(),
  prompt: z.string(),
  permission: permisoSchema,
});

const configSchema = z.strictObject({
  $schema: z.string(),
  default_agent: z.string(),
  skills: z.array(z.string()),
  agent: z.record(z.string(), agenteSchema),
});

const frontmatterSchema = z.object({
  description: z.string(),
  mode: z.string(),
  permission: permisoSchema,
});

function leerConfig(): z.infer<typeof configSchema> {
  return configSchema.parse(JSON.parse(readFileSync(join(RAIZ, ARCHIVO_CONFIG), "utf8")));
}

function agenteDe(config: z.infer<typeof configSchema>): z.infer<typeof agenteSchema> {
  const agente = config.agent[NOMBRE_AGENTE];
  if (agente === undefined) throw new Error(`${ARCHIVO_CONFIG} no declara el agente ${NOMBRE_AGENTE}`);
  return agente;
}

function frontmatterDelAgente(): z.infer<typeof frontmatterSchema> {
  const lineas = readFileSync(join(RAIZ, RUTA_AGENTE), "utf8").split("\n");
  const apertura = lineas.indexOf(DELIMITADOR_FRONTMATTER);
  const cierre = lineas.indexOf(DELIMITADOR_FRONTMATTER, apertura + 1);
  return frontmatterSchema.parse(Bun.YAML.parse(lineas.slice(apertura + 1, cierre).join("\n")));
}

describe("opencode.json registra el agente y la skill desde modulo/ (D-83, D-96)", () => {
  test("declara solo $schema, default_agent, skills y agent con los valores del módulo", () => {
    const config = leerConfig();
    expect(config.$schema).toBe(ESQUEMA_OPENCODE);
    expect(config.default_agent).toBe(NOMBRE_AGENTE);
    expect(config.skills).toEqual([RUTA_SKILLS]);
    expect(Object.keys(config.agent)).toEqual([NOMBRE_AGENTE]);
    expect(agenteDe(config).prompt).toBe(PROMPT_AGENTE);
  });

  test("la descripción, el modo y los permisos del agente son los del frontmatter de modulo/agent.md", () => {
    const agente = agenteDe(leerConfig());
    const frontmatter = frontmatterDelAgente();
    expect(agente.description).toBe(TEXTO_MODULO.descripcionAgente);
    expect(agente.description).toBe(frontmatter.description);
    expect(agente.mode).toBe(MODO_AGENTE_MODULO);
    expect(agente.mode).toBe(frontmatter.mode);
    expect(agente.permission).toEqual(frontmatter.permission);
    expect(agente.permission).toEqual({ edit: PERMISO_MODULO.DENEGADO, bash: PERMISO_MODULO.DENEGADO });
  });

  test("cada ruta que nombra existe desde la raíz del repo", () => {
    expect(existsSync(join(RAIZ, RUTA_AGENTE))).toBe(true);
    expect(existsSync(join(RAIZ, RUTA_SKILLS, NOMBRE_SKILL, ARCHIVO_SKILL))).toBe(true);
    expect(existsSync(join(RAIZ, ENLACE_HERRAMIENTAS))).toBe(true);
  });

  test("el esquema estricto muerde con una clave ajena o un agente sin prompt", () => {
    const base = {
      $schema: ESQUEMA_OPENCODE,
      default_agent: NOMBRE_AGENTE,
      skills: [RUTA_SKILLS],
      agent: {},
    };
    expect(configSchema.safeParse({ ...base, tools: {} }).success).toBe(false);
    expect(
      configSchema.safeParse({
        ...base,
        agent: { [NOMBRE_AGENTE]: { description: "", mode: "", permission: { edit: "", bash: "" } } },
      }).success,
    ).toBe(false);
    expect(configSchema.safeParse(base).success).toBe(true);
  });
});
