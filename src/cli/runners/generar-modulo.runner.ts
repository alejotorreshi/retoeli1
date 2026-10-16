import { rename, rm } from "node:fs/promises";
import { join } from "node:path";
import type {
  ArchivoModulo,
  LecturaModulo,
  MotivoFuenteModulo,
  OpcionesGeneracion,
  ResultadoGeneracion,
} from "@/cli/types/modulo.type.ts";
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
  DIRECTORIO_MODULO,
  DIRECTORIO_SKILLS_MODULO,
  MOTIVO_FUENTE_MODULO,
  NOMBRE_SKILL,
  SALTOS_HASTA_LA_RAIZ_DESDE_RUNNERS,
  SUFIJO_TEMPORAL_MODULO,
} from "@/config/constants/modulo.constants.ts";
import { PATRON_TEXTO_NO_VACIO } from "@/config/constants/patterns.constants.ts";
import { TEXTO_MODULO } from "@/config/strings.ts";
import { conFrontmatter, frontmatterAgente, frontmatterSkill } from "@/domain/builders/modulo.builder.ts";

const RAIZ_DEL_PROYECTO = join(import.meta.dir, ...SALTOS_HASTA_LA_RAIZ_DESDE_RUNNERS);

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
  const bytes = await archivo.bytes();
  if (!PATRON_TEXTO_NO_VACIO.test(new TextDecoder().decode(bytes))) {
    return { ok: false, ruta, motivo: MOTIVO_FUENTE_MODULO.VACIA };
  }
  return { ok: true, bytes };
}

export async function archivosDelModulo(raiz: string): Promise<LecturaModulo> {
  const prompt = await leerFuente(raiz, join(DIRECTORIO_AGENTE, ARCHIVO_PROMPT));
  if (!prompt.ok) return prompt;
  const conocimiento = await leerFuente(raiz, join(DIRECTORIO_CONOCIMIENTO, ARCHIVO_CONOCIMIENTO_PROCESO));
  if (!conocimiento.ok) return conocimiento;
  return {
    ok: true,
    archivos: [
      {
        ruta: join(DIRECTORIO_MODULO, ARCHIVO_AGENTE_MODULO),
        contenido: conFrontmatter(frontmatterAgente(TEXTO_MODULO.descripcionAgente), prompt.bytes),
      },
      {
        ruta: join(DIRECTORIO_MODULO, DIRECTORIO_SKILLS_MODULO, NOMBRE_SKILL, ARCHIVO_SKILL),
        contenido: conFrontmatter(
          frontmatterSkill(NOMBRE_SKILL, TEXTO_MODULO.descripcionSkill),
          conocimiento.bytes,
        ),
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
  await escribirJuntos(raiz, lectura.archivos);
  for (const { ruta } of lectura.archivos) escribir(TEXTO_MODULO.generado(ruta));
  return { fallido: false };
}

async function escribirJuntos(raiz: string, archivos: readonly ArchivoModulo[]): Promise<void> {
  const destinos = archivos.map(({ ruta, contenido }) => ({
    final: join(raiz, ruta),
    temporal: join(raiz, `${ruta}${SUFIJO_TEMPORAL_MODULO}`),
    contenido,
  }));
  try {
    await Promise.all(destinos.map(({ temporal, contenido }) => Bun.write(temporal, contenido)));
  } catch (error) {
    await Promise.all(destinos.map(({ temporal }) => rm(temporal, { force: true })));
    throw error;
  }
  for (const { temporal, final } of destinos) await rename(temporal, final);
}

if (import.meta.main) {
  const resultado = await generarModulo({ raiz: RAIZ_DEL_PROYECTO, escribir: console.log });
  if (resultado.fallido) process.exitCode = 1;
}
