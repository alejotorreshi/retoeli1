import { join } from "node:path";
import type {
  LecturaModulo,
  MotivoFuenteModulo,
  OpcionesGeneracion,
  ResultadoGeneracion,
} from "@/cli/types/modulo.type.ts";
import { ARCHIVO_PROMPT, ARCHIVO_PROYECTO, DIRECTORIO_AGENTE } from "@/config/constants/files.constants.ts";
import {
  ARCHIVO_AGENTE_MODULO,
  DIRECTORIO_MODULO,
  MOTIVO_FUENTE_MODULO,
} from "@/config/constants/modulo.constants.ts";
import { TEXTO_MODULO } from "@/config/strings.ts";
import { conFrontmatter, frontmatterAgente } from "@/domain/builders/modulo.builder.ts";

type Fuente =
  | { readonly ok: true; readonly bytes: Uint8Array }
  | { readonly ok: false; readonly ruta: string; readonly motivo: MotivoFuenteModulo };

const MENSAJE_POR_MOTIVO: Readonly<Record<MotivoFuenteModulo, (ruta: string) => string>> = {
  [MOTIVO_FUENTE_MODULO.AUSENTE]: TEXTO_MODULO.fuenteAusente,
  [MOTIVO_FUENTE_MODULO.VACIA]: TEXTO_MODULO.fuenteVacia,
};

async function leerFuente(raiz: string, ruta: string): Promise<Fuente> {
  const archivo = Bun.file(join(raiz, ruta));
  if (!(await archivo.exists())) return { ok: false, ruta, motivo: MOTIVO_FUENTE_MODULO.AUSENTE };
  return { ok: true, bytes: await archivo.bytes() };
}

export async function archivosDelModulo(raiz: string): Promise<LecturaModulo> {
  const prompt = await leerFuente(raiz, join(DIRECTORIO_AGENTE, ARCHIVO_PROMPT));
  if (!prompt.ok) return prompt;
  return {
    ok: true,
    archivos: [
      {
        ruta: join(DIRECTORIO_MODULO, ARCHIVO_AGENTE_MODULO),
        contenido: conFrontmatter(frontmatterAgente(TEXTO_MODULO.descripcionAgente), prompt.bytes),
      },
    ],
  };
}

export async function generarModulo({ raiz, escribir }: OpcionesGeneracion): Promise<ResultadoGeneracion> {
  if (!(await Bun.file(join(raiz, ARCHIVO_PROYECTO)).exists())) {
    escribir(TEXTO_MODULO.fueraDeLaRaiz);
    return { fallido: true };
  }
  const lectura = await archivosDelModulo(raiz);
  if (!lectura.ok) {
    escribir(MENSAJE_POR_MOTIVO[lectura.motivo](lectura.ruta));
    return { fallido: true };
  }
  for (const { ruta, contenido } of lectura.archivos) {
    await Bun.write(join(raiz, ruta), contenido);
    escribir(TEXTO_MODULO.generado(ruta));
  }
  return { fallido: false };
}

if (import.meta.main) {
  const resultado = await generarModulo({ raiz: process.cwd(), escribir: console.log });
  if (resultado.fallido) process.exitCode = 1;
}
