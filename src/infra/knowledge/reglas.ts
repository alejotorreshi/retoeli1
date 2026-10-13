import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { z } from "zod";
import { ARCHIVO_REGLAS } from "@/config/constants/files.constants.ts";
import { VERSION_REGLAS } from "@/config/constants/knowledge.constants.ts";
import { LIMITE_LECTURA_BYTES, LIMITES_REGLAS } from "@/config/constants/limits.constants.ts";
import {
  PATRON_PAIS,
  PATRON_PLANTILLA_CONOCIMIENTO,
  PATRON_RUTA_MAESTRO,
  PATRON_TEXTO_NO_VACIO,
} from "@/config/constants/patterns.constants.ts";
import { APLICACIONES_NOTA, type Reglas } from "@/domain/reglas.ts";
import { fallo, type Resultado } from "@/domain/resultado.ts";
import { validarTextosDeReglas } from "@/domain/validar-reglas.ts";

export const DIRECTORIO_CONOCIMIENTO_POR_DEFECTO = fileURLToPath(
  new URL("../../knowledge/", import.meta.url),
);

const confianza = z.number().min(0).max(1);
const texto = z.string().max(LIMITES_REGLAS.texto).regex(PATRON_TEXTO_NO_VACIO);
const rutaMaestro = z.string().regex(PATRON_RUTA_MAESTRO);
const pais = z.string().regex(PATRON_PAIS);
const plantilla = z.string().regex(PATRON_PLANTILLA_CONOCIMIENTO);

export const esquemaReglas = z
  .object({
    version: z.literal(VERSION_REGLAS),
    confianza: z
      .object({
        umbral: z.number().gt(0).max(1),
        glosario_exacto: confianza,
        glosario_normalizado: confianza,
        clave_directa: confianza,
        regla_pais: confianza,
        etiqueta_generica: confianza,
        sin_fuente: confianza,
      })
      .strict(),
    identificador_tributario: z
      .object({
        ruta: rutaMaestro,
        pais_origen: pais,
        por_pais: z.record(pais, z.string().max(LIMITES_REGLAS.identificador).regex(PATRON_TEXTO_NO_VACIO)),
        nota_extranjero: texto,
        nota_generica: texto,
      })
      .strict(),
    etiquetas_genericas: z
      .array(z.string().max(LIMITES_REGLAS.etiqueta).regex(PATRON_TEXTO_NO_VACIO))
      .max(LIMITES_REGLAS.elementos),
    notas_contexto: z
      .array(z.object({ ruta: rutaMaestro, aplica: z.enum(APLICACIONES_NOTA), texto }).strict())
      .max(LIMITES_REGLAS.elementos),
    soportes: z
      .object({
        dias_aviso_vencimiento: z.number().int().min(0).max(LIMITES_REGLAS.diasAvisoMaximo),
        aviso_emisor_distinto: texto,
      })
      .strict(),
    plantillas: z
      .object({
        checklist: plantilla,
        borrador_correo: plantilla,
        envio_simulado: plantilla,
        valores_portal: plantilla,
      })
      .strict(),
  })
  .strict() satisfies z.ZodType<Reglas>;

function reglasInvalidas(detalle: string): Resultado<Reglas> {
  return fallo("REGLAS_INVALIDAS", { detalle: `${ARCHIVO_REGLAS}: ${detalle}` });
}

function detalleDe(issues: readonly z.core.$ZodIssue[]): string {
  const primero = issues[0];
  if (primero === undefined) return "no cumple el esquema";
  const ruta = primero.path.length === 0 ? "(raíz)" : primero.path.map(String).join(".");
  return `${ruta}: ${primero.message}`;
}

export async function leerTexto(ruta: string): Promise<string | null> {
  try {
    const info = await stat(ruta);
    if (!info.isFile() || info.size > LIMITE_LECTURA_BYTES) return null;
    return await readFile(ruta, "utf8");
  } catch {
    return null;
  }
}

function parsearJson(
  contenido: string,
): { readonly ok: true; readonly valor: unknown } | { readonly ok: false } {
  try {
    return { ok: true, valor: JSON.parse(contenido) };
  } catch {
    return { ok: false };
  }
}

export async function cargarReglas(directorio: string): Promise<Resultado<Reglas>> {
  const contenido = await leerTexto(join(directorio, ARCHIVO_REGLAS));
  if (contenido === null) return reglasInvalidas("no existe, no es un archivo o supera el tamaño permitido");
  const json = parsearJson(contenido);
  if (!json.ok) return reglasInvalidas("no es JSON válido");
  const validado = esquemaReglas.safeParse(json.valor, { error: z.locales.es().localeError });
  if (!validado.success) return reglasInvalidas(detalleDe(validado.error.issues));
  return validarTextosDeReglas(validado.data);
}
