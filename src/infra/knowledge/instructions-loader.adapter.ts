import { join } from "node:path";
import { fileURLToPath } from "node:url";
import type { CargarInstrucciones } from "@/application/types/puertos-agente.type.ts";
import {
  ARCHIVO_CONOCIMIENTO_PROCESO,
  ARCHIVO_PROMPT,
  DIRECTORIO_AGENTE,
} from "@/config/constants/files.constants.ts";
import { PATRON_TEXTO_NO_VACIO } from "@/config/constants/patterns.constants.ts";
import { readText } from "@/infra/fs/fs.util.ts";
import { DEFAULT_KNOWLEDGE_DIRECTORY } from "@/infra/knowledge/rules-loader.adapter.ts";

export const DEFAULT_AGENT_DIRECTORY = fileURLToPath(
  new URL(`../../../${DIRECTORIO_AGENTE}/`, import.meta.url),
);

type InstructionsDirectories = { readonly agentDirectory: string; readonly knowledgeDirectory: string };

const DEFAULT_DIRECTORIES: InstructionsDirectories = {
  agentDirectory: DEFAULT_AGENT_DIRECTORY,
  knowledgeDirectory: DEFAULT_KNOWLEDGE_DIRECTORY,
};

async function readInstruction(directory: string, file: string): Promise<string | null> {
  const content = await readText(join(directory, file));
  return content !== null && PATRON_TEXTO_NO_VACIO.test(content) ? content.trim() : null;
}

export function createInstructionsLoader(
  directories: InstructionsDirectories = DEFAULT_DIRECTORIES,
): CargarInstrucciones {
  return async () => {
    const prompt = await readInstruction(directories.agentDirectory, ARCHIVO_PROMPT);
    if (prompt === null) return { ok: false, archivo: ARCHIVO_PROMPT };
    const conocimiento = await readInstruction(directories.knowledgeDirectory, ARCHIVO_CONOCIMIENTO_PROCESO);
    if (conocimiento === null) return { ok: false, archivo: ARCHIVO_CONOCIMIENTO_PROCESO };
    return { ok: true, instrucciones: { prompt, conocimiento } };
  };
}
