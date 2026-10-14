import { describe, expect, test } from "bun:test";
import { capturarLogs } from "@tests/helpers/bitacora.helper.ts";
import {
  casosConEnvioSimulado,
  confirmaciones,
  errores,
  finDeTurno,
  lineasDeEnvio,
  recoger,
  sesionDe,
  textos,
  usos,
} from "@tests/helpers/eventos.helper.ts";
import { cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { proyectarMapeo } from "@tests/helpers/flujo.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { CuerpoPedido } from "@tests/helpers/types/fetch-falso.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { TEXTO_CONFIRMACION } from "@/config/strings.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";

const EC = "ec-corp-andina";
const MENSAJE_PRD_11 =
  'Procesa el caso "ec-corp-andina". Dime qué campos quedaron llenos, cuáles faltan, si el paquete está listo para firma y qué soportes debo actualizar. No envíes nada todavía.';
const PEDIDOS = [
  "No, consulta el NIT de ec-corp-andina",
  "No, por favor consulta el NIT de ec-corp-andina",
  "No envíes nada todavía, ¿qué falta?",
] as const;
const PREGUNTA = TEXTO_CONFIRMACION.unCaso(EC, ["ausente: Certificado de cumplimiento tributario"]);
const RESUMEN_T1 =
  "Procesé el caso ec-corp-andina. El formulario quedó en out/ec-corp-andina/. Falta el soporte Certificado de cumplimiento tributario, así que el paquete queda BLOQUEADO. No envié nada.";
const claves = [process.env.LLM_API_KEY, process.env.DEEPSEEK_API_KEY, process.env.LLM_FALLBACK_API_KEY].filter(
  (c): c is string => c !== undefined && c.trim() !== "",
);

function herr(id: string, h: keyof typeof HERRAMIENTA, args: unknown): unknown {
  return cuerpoConHerramientas({ id, nombre: NOMBRE_VISIBLE[HERRAMIENTA[h]], argumentos: args });
}

function guionTurno1(): ((cuerpo: CuerpoPedido) => unknown)[] {
  return [
    () => herr("leer-ec", "LEER_SOLICITUD", { caso: EC }),
    () => herr("mapear-ec", "MAPEAR_CAMPOS", { caso: EC, campos: [] }),
    (cuerpo) => {
      const msg = [...cuerpo.messages].reverse().find((m) => m.role === "tool" && m.tool_call_id === "mapear-ec");
      if (msg === undefined) throw new Error("sin mapeo");
      return herr("generar-ec", "GENERAR_FORMULARIO", { caso: EC, mapeo: proyectarMapeo(JSON.parse(msg.content)) });
    },
    () => herr("armar-ec", "ARMAR_PAQUETE", { caso: EC }),
    () => cuerpoConTexto(RESUMEN_T1),
  ];
}

const ultimo = (t: string) => t.trimEnd().split("\n\n").at(-1) ?? "";
const finesTodos = (e: readonly EventoAgente[]) =>
  e.flatMap((x) => (x.tipo === TIPO_EVENTO.FIN_HERRAMIENTA ? [{ h: x.herramienta, ok: x.ok, codigo: x.codigo ?? null }] : []));
const textoFinal = (e: readonly EventoAgente[]) => textos(e).at(-1)?.texto ?? "";

describe.skipIf(process.env.LLM_EN_VIVO !== "1")("D5 en vivo (QA ronda 3)", () => {
  test(
    "tres sesiones: §11 hasta el paquete pendiente, pedido, 'sí'",
    async () => {
      expect(claves.length).toBeGreaterThan(0);
      const restaurar = pinExecutionDate(FECHA_DEMO);
      const resultados: Record<string, unknown>[] = [];
      const salidas: string[] = [];
      let tokens = 0;
      let llamadasVivas = 0;
      let piiHits: string[] = [];
      try {
        for (const [i, pedido] of PEDIDOS.entries()) {
          const proyecto = await crearProyectoTemporal();
          const cuerpos: string[] = [];
          const guion = guionTurno1();
          let n = 0;
          const fetchHibrido: FetchLike = async (url, init) => {
            const cuerpo: CuerpoPedido = JSON.parse(String(init.body));
            const paso = guion[n];
            n += 1;
            if (paso !== undefined) {
              return new Response(JSON.stringify(paso(cuerpo)), { status: 200, headers: { "Content-Type": "application/json" } });
            }
            cuerpos.push(String(init.body));
            llamadasVivas += 1;
            return globalThis.fetch(url, init);
          };
          const logs = capturarLogs();
          const creacion = crearAgente({
            directorio: proyecto.raiz,
            fetch: fetchHibrido,
            fuenteEntorno: {
              ...process.env,
              AGENT_SESSION_TOKEN_BUDGET: "60000",
              LLM_MAX_OUTPUT_TOKENS: "1200",
              LOG_LEVEL: NIVELES_LOG.INFO,
            },
            destinoLogs: logs.destino,
          });
          if (!creacion.ok) throw new Error(creacion.codigo);
          let sesionId: string | null = null;
          const turno = async (mensaje: string) => {
            const e = await recoger(creacion.agente.turno({ sesionId, mensaje }));
            sesionId = sesionDe(e);
            return e;
          };
          const t1 = await turno(MENSAJE_PRD_11);
          const t2 = await turno(pedido);
          const t3 = await turno("sí");
          const r2 = textoFinal(t2);
          const r3 = textoFinal(t3);
          const preguntaAlFinal = ultimo(r2) === PREGUNTA;
          const modeloT2 = preguntaAlFinal ? r2.slice(0, r2.length - PREGUNTA.length).trimEnd() : r2;
          const herramientasT2 = finesTodos(t2);
          const herramientasT3 = finesTodos(t3);
          const envios = await casosConEnvioSimulado(proyecto.raiz);
          const oks = (await lineasDeEnvio(proyecto.raiz)).filter((l) => l.ok).length;
          const eventos = [...t1, ...t2, ...t3];
          tokens += usos(eventos).at(-1)?.totalSesion ?? 0;
          const fila = {
            sesion: i + 1,
            pedido,
            t1: { needsConfirmation: finDeTurno(t1).needsConfirmation, motivo: finDeTurno(t1).motivo, preguntaAlFinal: ultimo(textoFinal(t1)) === PREGUNTA },
            t2: {
              motivo: finDeTurno(t2).motivo,
              errores: errores(t2).map((x) => x.codigo),
              needsConfirmation: finDeTurno(t2).needsConfirmation,
              confirmation_required: confirmaciones(t2).map((c) => c.caso),
              preguntaServidorAlFinal: preguntaAlFinal,
              herramientas: herramientasT2,
              respuestaModelo: modeloT2,
              menciones: {
                siguePendiente: /sigue pendiente|queda pendiente|contin[uú]a pendiente/i.test(modeloT2),
                cancelad: /cancel/i.test(modeloT2),
                certificado: /certificado/i.test(modeloT2),
                signosPregunta: (modeloT2.match(/¿/g) ?? []).length,
              },
            },
            t3: {
              motivo: finDeTurno(t3).motivo,
              errores: errores(t3).map((x) => x.codigo),
              needsConfirmation: finDeTurno(t3).needsConfirmation,
              confirmation_required: confirmaciones(t3).map((c) => c.caso),
              herramientas: herramientasT3,
              respuesta: r3,
            },
            envioSimuladoMd: envios,
            lineasOk: oks,
          };
          resultados.push(fila);
          salidas.push(JSON.stringify(eventos), ...logs.crudas, ...cuerpos);
          const sensibles = await sensiblesDelProyecto(proyecto.raiz);
          piiHits = piiHits.concat(sensibles.filter((h) => salidas.join("\n").includes(h.valor)).map((h) => h.ruta));
          console.log(`D5SESION ${JSON.stringify(fila)}`);
          console.log(`D5PII sesion=${i + 1} sensibles=${sensibles.length}`);
          await proyecto.limpiar();
        }
      } finally {
        restaurar();
      }
      const todo = salidas.join("\n");
      const claveVista = claves.some((c) => todo.includes(c));
      console.log(`D5SCAN pii_hits=${JSON.stringify([...new Set(piiHits)])} clave_en_salidas=${claveVista} cuerpos_vivos=${llamadasVivas}`);
      console.log(`D5FIN tokens=${tokens} llamadas_vivas=${llamadasVivas}`);
      expect(claveVista).toBe(false);
    },
    300_000,
  );
});
