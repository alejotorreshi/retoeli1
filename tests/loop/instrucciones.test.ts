import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { appendFile, cp, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { crearAgentePrueba } from "@tests/helpers/agente-prueba.helper.ts";
import { errores, finDeTurno } from "@tests/helpers/eventos.helper.ts";
import { respuestaTexto } from "@tests/helpers/llm-falso.helper.ts";
import { copiarConocimiento, crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { AgentePrueba } from "@tests/helpers/types/agente-prueba.type.ts";
import type { ConocimientoTemporal, ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { CODIGO_AGENTE, MOTIVO_FIN } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import {
  ARCHIVO_CONOCIMIENTO_PROCESO,
  ARCHIVO_PROMPT,
  DIRECTORIO_AGENTE,
} from "@/config/constants/files.constants.ts";
import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { createInstructionsLoader } from "@/infra/knowledge/instructions-loader.adapter.ts";

const RAIZ_REPO = join(import.meta.dir, "..", "..");
const MARCADOR_PROMPT = "MARCADOR-EDICION-PROMPT";
const MARCADOR_CONOCIMIENTO = "MARCADOR-EDICION-CONOCIMIENTO";

let proyecto: ProyectoTemporal;
let conocimiento: ConocimientoTemporal;
let baseAgente: string;
let directorioAgente: string;
let restaurarFecha: () => void;

beforeAll(() => {
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
});

afterAll(() => {
  restaurarFecha();
});

beforeEach(async () => {
  proyecto = await crearProyectoTemporal();
  conocimiento = await copiarConocimiento();
  baseAgente = await mkdtemp(join(tmpdir(), "agente-"));
  directorioAgente = join(baseAgente, DIRECTORIO_AGENTE);
  await cp(join(RAIZ_REPO, DIRECTORIO_AGENTE), directorioAgente, { recursive: true });
});

afterEach(async () => {
  await proyecto.limpiar();
  await conocimiento.limpiar();
  await rm(baseAgente, { recursive: true, force: true });
});

function agente(textos: number): AgentePrueba {
  return crearAgentePrueba({
    raiz: proyecto.raiz,
    guion: Array.from({ length: textos }, (_, indice) => respuestaTexto(`respuesta ${indice + 1}`)),
    instrucciones: createInstructionsLoader({
      agentDirectory: directorioAgente,
      knowledgeDirectory: conocimiento.directorio,
    }),
  });
}

function prefijoDelPedido(prueba: AgentePrueba, indice: number): string {
  const pedido = prueba.llm.pedidos[indice];
  if (pedido === undefined) throw new Error(`no hay pedido ${indice}`);
  return pedido.mensajes
    .filter((mensaje) => mensaje.rol === ROL_MENSAJE.SISTEMA)
    .map((mensaje) => mensaje.contenido)
    .join("\n");
}

describe("editar prompt.md o el conocimiento cambia el siguiente pedido sin tocar código (AGT-02, D-57)", () => {
  test("cada edición llega al turno siguiente; sin prompt el turno falla sin llamar al modelo y vuelve al restaurarlo", async () => {
    const prueba = agente(4);
    const rutaPrompt = join(directorioAgente, ARCHIVO_PROMPT);
    const rutaConocimiento = join(conocimiento.directorio, ARCHIVO_CONOCIMIENTO_PROCESO);

    await prueba.turno("hola");
    expect(prefijoDelPedido(prueba, 0)).not.toContain(MARCADOR_PROMPT);
    expect(prefijoDelPedido(prueba, 0)).not.toContain(MARCADOR_CONOCIMIENTO);

    await appendFile(rutaPrompt, `\n${MARCADOR_PROMPT}\n`);
    await prueba.turno("sigue");
    expect(prefijoDelPedido(prueba, 1)).toContain(MARCADOR_PROMPT);
    expect(prefijoDelPedido(prueba, 1)).not.toContain(MARCADOR_CONOCIMIENTO);

    await appendFile(rutaConocimiento, `\n${MARCADOR_CONOCIMIENTO}\n`);
    await prueba.turno("sigue");
    expect(prefijoDelPedido(prueba, 2)).toContain(MARCADOR_CONOCIMIENTO);

    const respaldo = await readFile(rutaPrompt, "utf8");
    await rm(rutaPrompt);
    const sinPrompt = await prueba.turno("sigue");
    expect(errores(sinPrompt).map(({ codigo }) => codigo)).toEqual([
      CODIGO_AGENTE.INSTRUCCIONES_NO_DISPONIBLES,
    ]);
    expect(finDeTurno(sinPrompt).motivo).toBe(MOTIVO_FIN.ERROR);
    expect(prueba.llm.pedidos).toHaveLength(3);

    await writeFile(rutaPrompt, respaldo);
    const restaurado = await prueba.turno("sigue");
    expect(errores(restaurado)).toEqual([]);
    expect(finDeTurno(restaurado).motivo).toBe(MOTIVO_FIN.FINAL);
    expect(prueba.llm.pedidos).toHaveLength(4);
    expect(prefijoDelPedido(prueba, 3)).toContain(MARCADOR_PROMPT);
  });

  test("un registro-proveedor.md con solo espacios da INSTRUCCIONES_NO_DISPONIBLES sin llamar al modelo", async () => {
    const prueba = agente(1);
    await writeFile(join(conocimiento.directorio, ARCHIVO_CONOCIMIENTO_PROCESO), "  \n\t\n");
    const eventos = await prueba.turno("hola");
    expect(errores(eventos).map(({ codigo }) => codigo)).toEqual([
      CODIGO_AGENTE.INSTRUCCIONES_NO_DISPONIBLES,
    ]);
    expect(finDeTurno(eventos).motivo).toBe(MOTIVO_FIN.ERROR);
    expect(prueba.llm.pedidos).toHaveLength(0);
  });
});
