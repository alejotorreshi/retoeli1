import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { crearFetchFalso } from "@tests/helpers/fetch-falso.helper.ts";
import { CODIGO_AGENTE } from "@/config/constants/agent.constants.ts";
import { ESQUEMA_LOOPBACK, ESQUEMA_SEGURO, HOSTS_LOOPBACK } from "@/config/constants/llm.constants.ts";
import { type EnvSource, parseAgentEnv } from "@/config/env.ts";
import { TEXTO_ENV } from "@/config/strings.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";

const RAIZ_REPO = join(import.meta.dir, "..", "..");

function valido(source: EnvSource) {
  const resultado = parseAgentEnv(source);
  if (!resultado.success) throw new Error(JSON.stringify(resultado.error.issues));
  return resultado.data;
}

function mensajesDe(source: EnvSource): string[] {
  const resultado = parseAgentEnv(source);
  if (resultado.success) throw new Error("se esperaba un error de validación");
  return resultado.error.issues.map((issue) => issue.message);
}

const CAPACIDADES_DEEPSEEK = {
  maxTokensParam: "max_tokens",
  temperature: 0,
  thinking: "disabled",
  reasoningPassback: true,
  toolChoiceNone: true,
} as const;

describe("entorno del agente: ranura principal (D-59)", () => {
  test("sin variables usa el preset de DeepSeek, sin clave", () => {
    const env = valido({});
    expect(env.primary).toEqual({
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-flash",
      apiKey: null,
      maxOutputTokens: 2048,
      capabilities: CAPACIDADES_DEEPSEEK,
    });
    expect(env.fallback).toEqual({
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-pro",
      apiKey: null,
      maxOutputTokens: 2048,
      capabilities: CAPACIDADES_DEEPSEEK,
    });
  });

  test("DEEPSEEK_API_KEY es alias y LLM_API_KEY gana si ambas existen", () => {
    expect(valido({ DEEPSEEK_API_KEY: "a1" }).primary.apiKey).toBe("a1");
    expect(valido({ DEEPSEEK_API_KEY: "a1" }).fallback?.apiKey).toBe("a1");
    expect(valido({ LLM_API_KEY: "b2", DEEPSEEK_API_KEY: "a1" }).primary.apiKey).toBe("b2");
  });

  test("el alias DEEPSEEK_API_KEY solo vale para la URL de DeepSeek", () => {
    const env = valido({
      LLM_PROVIDER: "openai",
      LLM_BASE_URL: "https://api.openai.com/v1",
      LLM_MODEL: "gpt-x",
      DEEPSEEK_API_KEY: "a1",
    });
    expect(env.primary).toMatchObject({
      provider: "openai",
      baseUrl: "https://api.openai.com/v1",
      model: "gpt-x",
      apiKey: null,
    });
    expect(
      valido({ LLM_BASE_URL: "https://otro.example.com/v1", DEEPSEEK_API_KEY: "a1" }).primary.apiKey,
    ).toBe(null);
  });

  test("la etiqueta del proveedor se normaliza a minúsculas", () => {
    expect(valido({ LLM_PROVIDER: "DeepSeek" }).primary.provider).toBe("deepseek");
  });

  test("exige https salvo en localhost y normaliza la barra final", () => {
    expect(mensajesDe({ LLM_BASE_URL: "http://api.example.com" })).toContain(TEXTO_ENV.urlNoSegura);
    expect(mensajesDe({ LLM_BASE_URL: "no es una url" })).toEqual([TEXTO_ENV.urlInvalida]);
    expect(valido({ LLM_BASE_URL: "http://localhost:11434/v1/" }).primary.baseUrl).toBe(
      "http://localhost:11434/v1",
    );
    expect(valido({ LLM_BASE_URL: "http://127.0.0.1:11434/v1" }).primary.baseUrl).toBe(
      "http://127.0.0.1:11434/v1",
    );
    expect(valido({ LLM_BASE_URL: "http://[::1]:11434/v1" }).primary.baseUrl).toBe("http://[::1]:11434/v1");
    expect(valido({ LLM_BASE_URL: "https://api.deepseek.com///" }).primary.baseUrl).toBe(
      "https://api.deepseek.com",
    );
  });

  test("el mensaje de URL no segura nombra los dos protocolos y cada host local admitido (WR-13)", () => {
    expect(TEXTO_ENV.urlNoSegura).toContain(ESQUEMA_SEGURO);
    expect(TEXTO_ENV.urlNoSegura).toContain(ESQUEMA_LOOPBACK);
    for (const host of HOSTS_LOOPBACK) expect(TEXTO_ENV.urlNoSegura).toContain(host);
  });

  test("un proveedor sin preset exige LLM_BASE_URL y LLM_MODEL con mensajes en español", () => {
    expect(mensajesDe({ LLM_PROVIDER: "openai" })).toEqual([
      TEXTO_ENV.urlRequerida,
      TEXTO_ENV.modeloRequerido,
    ]);
    expect(mensajesDe({ LLM_PROVIDER: "openai", LLM_BASE_URL: "https://api.openai.com/v1" })).toEqual([
      TEXTO_ENV.modeloRequerido,
    ]);
    expect(mensajesDe({ LLM_PROVIDER: "openai", LLM_MODEL: "gpt-x" })).toEqual([TEXTO_ENV.urlRequerida]);
  });

  test("un proveedor genérico usa las capacidades genéricas", () => {
    const env = valido({
      LLM_PROVIDER: "openrouter",
      LLM_BASE_URL: "https://openrouter.ai/api/v1",
      LLM_MODEL: "x/y",
    });
    expect(env.primary.capabilities).toEqual({
      maxTokensParam: "max_tokens",
      temperature: 0,
      thinking: null,
      reasoningPassback: false,
      toolChoiceNone: true,
    });
  });

  test("respeta las cinco capacidades por env", () => {
    const env = valido({
      LLM_TEMPERATURE: "omit",
      LLM_THINKING: "omit",
      LLM_MAX_TOKENS_PARAM: "max_completion_tokens",
      LLM_TOOL_CHOICE_NONE: "false",
      LLM_REASONING_PASSBACK: "false",
      LLM_MAX_OUTPUT_TOKENS: "4096",
    });
    expect(env.primary.capabilities).toEqual({
      maxTokensParam: "max_completion_tokens",
      temperature: null,
      thinking: null,
      reasoningPassback: false,
      toolChoiceNone: false,
    });
    expect(env.primary.maxOutputTokens).toBe(4096);
    expect(valido({ LLM_TEMPERATURE: "0.7", LLM_THINKING: "enabled" }).primary.capabilities).toMatchObject({
      temperature: 0.7,
      thinking: "enabled",
    });
  });

  test("rechaza capacidades fuera de rango", () => {
    expect(mensajesDe({ LLM_TEMPERATURE: "3" }).length).toBeGreaterThan(0);
    expect(mensajesDe({ LLM_THINKING: "quizas" }).length).toBeGreaterThan(0);
    expect(mensajesDe({ LLM_MAX_TOKENS_PARAM: "tokens" }).length).toBeGreaterThan(0);
    expect(mensajesDe({ LLM_TOOL_CHOICE_NONE: "si" }).length).toBeGreaterThan(0);
    expect(mensajesDe({ LLM_MAX_OUTPUT_TOKENS: "70000" }).length).toBeGreaterThan(0);
  });
});

describe("entorno del agente: ranura de respaldo (D-52, Pitfall 7)", () => {
  test("hereda la clave principal solo si la URL base es idéntica", () => {
    expect(valido({ LLM_API_KEY: "k1" }).fallback?.apiKey).toBe("k1");
    const otraUrl = valido({
      LLM_API_KEY: "k1",
      LLM_FALLBACK_PROVIDER: "openrouter",
      LLM_FALLBACK_BASE_URL: "https://openrouter.ai/api/v1",
      LLM_FALLBACK_MODEL: "x/y",
    });
    expect(otraUrl.fallback).toMatchObject({
      provider: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1",
      model: "x/y",
      apiKey: null,
    });
    const conClavePropia = valido({
      LLM_API_KEY: "k1",
      LLM_FALLBACK_BASE_URL: "https://openrouter.ai/api/v1",
      LLM_FALLBACK_API_KEY: "k2",
    });
    expect(conClavePropia.fallback?.apiKey).toBe("k2");
  });

  test("la URL base de respaldo con barra final cuenta como idéntica", () => {
    const env = valido({ LLM_API_KEY: "k1", LLM_FALLBACK_BASE_URL: "https://api.deepseek.com/" });
    expect(env.fallback).toMatchObject({ baseUrl: "https://api.deepseek.com", apiKey: "k1" });
  });

  test("la URL base de respaldo también exige https", () => {
    expect(mensajesDe({ LLM_FALLBACK_BASE_URL: "http://openrouter.ai/api/v1" })).toContain(
      TEXTO_ENV.urlNoSegura,
    );
  });

  test("LLM_FALLBACK_ENABLED false desactiva el respaldo", () => {
    expect(valido({ LLM_FALLBACK_ENABLED: "false" }).fallback).toBeNull();
  });

  test("un respaldo idéntico al principal queda desactivado", () => {
    expect(valido({ LLM_FALLBACK_MODEL: "deepseek-flash" }).fallback).toBeNull();
    expect(valido({ LLM_MODEL: "deepseek-v4-pro" }).fallback).toBeNull();
  });

  test("sin preset ni modelo de respaldo no hay respaldo", () => {
    const env = valido({
      LLM_PROVIDER: "openai",
      LLM_BASE_URL: "https://api.openai.com/v1",
      LLM_MODEL: "gpt-x",
    });
    expect(env.fallback).toBeNull();
  });

  test("las capacidades del respaldo vienen de su preset o de sus variables", () => {
    const env = valido({
      LLM_FALLBACK_TEMPERATURE: "omit",
      LLM_FALLBACK_THINKING: "enabled",
      LLM_FALLBACK_MAX_TOKENS_PARAM: "max_completion_tokens",
      LLM_FALLBACK_REASONING_PASSBACK: "false",
      LLM_FALLBACK_TOOL_CHOICE_NONE: "false",
    });
    expect(env.primary.capabilities).toEqual(CAPACIDADES_DEEPSEEK);
    expect(env.fallback?.capabilities).toEqual({
      maxTokensParam: "max_completion_tokens",
      temperature: null,
      thinking: "enabled",
      reasoningPassback: false,
      toolChoiceNone: false,
    });
    const generico = valido({
      LLM_FALLBACK_PROVIDER: "groq",
      LLM_FALLBACK_BASE_URL: "https://api.groq.com/openai/v1",
      LLM_FALLBACK_MODEL: "llama",
    });
    expect(generico.fallback?.capabilities).toEqual({
      maxTokensParam: "max_tokens",
      temperature: 0,
      thinking: null,
      reasoningPassback: false,
      toolChoiceNone: true,
    });
  });

  test("un proveedor de respaldo con preset toma su URL y su modelo de respaldo", () => {
    const env = valido({
      LLM_PROVIDER: "openai",
      LLM_BASE_URL: "https://api.openai.com/v1",
      LLM_MODEL: "gpt-x",
      LLM_API_KEY: "k-openai",
      LLM_FALLBACK_PROVIDER: "deepseek",
    });
    expect(env.fallback).toMatchObject({
      provider: "deepseek",
      baseUrl: "https://api.deepseek.com",
      model: "deepseek-v4-pro",
      apiKey: null,
    });
  });
});

describe("entorno del agente: topes y registro (D-51, D-58, LLM-04)", () => {
  test("cada tope tiene su valor por defecto", () => {
    const env = valido({});
    expect({
      timeoutMs: env.timeoutMs,
      maxRetries: env.maxRetries,
      turnDeadlineMs: env.turnDeadlineMs,
      maxIterations: env.maxIterations,
      sessionTokenBudget: env.sessionTokenBudget,
      sessionTtlMinutes: env.sessionTtlMinutes,
      maxSessions: env.maxSessions,
      logLevel: env.logLevel,
    }).toEqual({
      timeoutMs: 45000,
      maxRetries: 2,
      turnDeadlineMs: 120000,
      maxIterations: 25,
      sessionTokenBudget: 300000,
      sessionTtlMinutes: 120,
      maxSessions: 100,
      logLevel: "info",
    });
  });

  test("las cadenas vacías cuentan como no definidas", () => {
    const vacias = Object.fromEntries(
      [
        "LLM_PROVIDER",
        "LLM_BASE_URL",
        "LLM_MODEL",
        "LLM_API_KEY",
        "LLM_TIMEOUT_MS",
        "LLM_MAX_RETRIES",
        "AGENT_MAX_ITERATIONS",
        "LOG_LEVEL",
        "LLM_FALLBACK_ENABLED",
      ].map((nombre) => [nombre, ""]),
    );
    const env = valido(vacias);
    expect(env.primary.model).toBe("deepseek-flash");
    expect(env.primary.apiKey).toBeNull();
    expect(env.timeoutMs).toBe(45000);
    expect(env.maxIterations).toBe(25);
    expect(env.logLevel).toBe("info");
    expect(env.fallback).not.toBeNull();
  });

  test("lee valores explícitos", () => {
    const env = valido({
      LLM_TIMEOUT_MS: "30000",
      LLM_MAX_RETRIES: "0",
      AGENT_TURN_DEADLINE_MS: "90000",
      AGENT_MAX_ITERATIONS: "10",
      AGENT_SESSION_TOKEN_BUDGET: "1000",
      AGENT_SESSION_TTL_MINUTES: "5",
      AGENT_MAX_SESSIONS: "3",
      LOG_LEVEL: "debug",
    });
    expect(env).toMatchObject({
      timeoutMs: 30000,
      maxRetries: 0,
      turnDeadlineMs: 90000,
      maxIterations: 10,
      sessionTokenBudget: 1000,
      sessionTtlMinutes: 5,
      maxSessions: 3,
      logLevel: "debug",
    });
  });

  test.each([
    ["LLM_TIMEOUT_MS", "abc"],
    ["LLM_TIMEOUT_MS", "0"],
    ["LLM_MAX_RETRIES", "-1"],
    ["LLM_MAX_RETRIES", "6"],
    ["AGENT_TURN_DEADLINE_MS", "-5"],
    ["AGENT_MAX_ITERATIONS", "0"],
    ["AGENT_MAX_ITERATIONS", "101"],
    ["AGENT_SESSION_TOKEN_BUDGET", "mucho"],
    ["AGENT_SESSION_TTL_MINUTES", "1.5"],
    ["AGENT_MAX_SESSIONS", "0"],
    ["LOG_LEVEL", "verbose"],
  ])("%s=%s falla con un mensaje en español", (nombre, valor) => {
    const mensajes = mensajesDe({ [nombre]: valor });
    expect(mensajes.length).toBeGreaterThan(0);
    for (const mensaje of mensajes) expect(mensaje).not.toMatch(/\b(?:expected|Invalid|received)\b/);
  });

  test("ningún mensaje de validación repite una clave", () => {
    const resultado = parseAgentEnv({
      LLM_API_KEY: "sk-secreta-Zq9X",
      DEEPSEEK_API_KEY: "sk-alias-Wp4Y",
      LLM_FALLBACK_API_KEY: "sk-respaldo-Mn7V",
      LLM_BASE_URL: "http://api.example.com",
      LLM_TIMEOUT_MS: "nada",
      LLM_PROVIDER: "otro",
    });
    expect(resultado.success).toBe(false);
    const serializado = JSON.stringify(resultado.error);
    for (const marca of ["Zq9X", "Wp4Y", "Mn7V"]) expect(serializado).not.toContain(marca);
  });
});

const CLAVE_FICTICIA = "clave-ficticia-Qh3T";
const SESION_ABIERTA = "La sesión sigue abierta";
const MENSAJE_URL_PRINCIPAL_NO_SEGURA =
  "La configuración del proveedor del modelo no es válida. Detalle: LLM_BASE_URL: La URL del proveedor debe usar https; solo estos hosts locales admiten también http: localhost, 127.0.0.1, [::1].";

function mensajeAlCrear(fuenteEntorno: EnvSource) {
  const creacion = crearAgente({ directorio: RAIZ_REPO, fetch: crearFetchFalso([]).fetch, fuenteEntorno });
  if (creacion.ok) throw new Error("se esperaba un error al crear el agente");
  return creacion;
}

describe("mensajes de configuración al crear el agente (WR-13, G-02-19)", () => {
  test("una URL principal no segura da un solo punto final y no promete una sesión abierta", () => {
    const creacion = mensajeAlCrear({ LLM_API_KEY: CLAVE_FICTICIA, LLM_BASE_URL: "http://api.example.com" });
    expect(creacion.codigo).toBe(CODIGO_AGENTE.CONFIGURACION_LLM_INVALIDA);
    expect(creacion.mensaje).toBe(MENSAJE_URL_PRINCIPAL_NO_SEGURA);
    expect(creacion.mensaje).not.toContain("..");
    expect(creacion.mensaje).not.toContain(SESION_ABIERTA);
    expect(creacion.mensaje).not.toContain(CLAVE_FICTICIA);
  });
});
