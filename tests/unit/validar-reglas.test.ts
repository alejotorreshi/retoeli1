import { beforeAll, describe, expect, test } from "bun:test";
import type { Reglas } from "@/domain/types/reglas.type.ts";
import { validarTextosDeReglas } from "@/domain/validar-reglas.ts";
import { DEFAULT_KNOWLEDGE_DIRECTORY, loadRules } from "@/infra/knowledge/rules-loader.adapter.ts";

let reglas: Reglas;

beforeAll(async () => {
  const cargadas = await loadRules(DEFAULT_KNOWLEDGE_DIRECTORY);
  if (!cargadas.ok) throw new Error(cargadas.error);
  reglas = cargadas.data;
});

function errorDe(editadas: Reglas): string {
  const resultado = validarTextosDeReglas(editadas);
  if (resultado.ok) throw new Error("se esperaba REGLAS_INVALIDAS");
  expect(resultado.codigo).toBe("REGLAS_INVALIDAS");
  return resultado.error;
}

describe("validarTextosDeReglas revisa las variables de cada texto al cargar (IN-09)", () => {
  test("las reglas publicadas son válidas", () => {
    expect(validarTextosDeReglas(reglas).ok).toBe(true);
  });

  test("una nota de contexto con una variable mal escrita falla aunque su ruta no se mapee", () => {
    const notas_contexto = [{ ruta: "sitio_web", aplica: "siempre" as const, texto: "{{monedaa}}" }];
    expect(errorDe({ ...reglas, notas_contexto })).toContain(
      "notas_contexto[0] usa la variable desconocida monedaa",
    );
  });

  test("una nota de campo no puede usar pais_emisor", () => {
    const notas_contexto = [
      { ruta: "pais", aplica: "siempre" as const, texto: "Emitido en {{pais_emisor}}" },
    ];
    expect(errorDe({ ...reglas, notas_contexto })).toContain("pais_emisor");
  });

  test("el aviso de emisor solo puede usar pais_emisor", () => {
    const soportes = { ...reglas.soportes, aviso_emisor_distinto: "{{pais_emisor}} en {{moneda}}" };
    expect(errorDe({ ...reglas, soportes })).toContain("soportes.aviso_emisor_distinto");
  });

  test("una nota de identificador con una etiqueta sin cerrar falla", () => {
    const identificador_tributario = { ...reglas.identificador_tributario, nota_generica: "en {{pais" };
    expect(errorDe({ ...reglas, identificador_tributario })).toContain("nota_generica");
  });
});
