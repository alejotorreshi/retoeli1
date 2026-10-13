import { describe, expect, test } from "bun:test";
import { existsSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { capturarLogs } from "@tests/helpers/bitacora.helper.ts";
import {
  casosConEnvioSimulado,
  confirmaciones,
  finDeTurno,
  lineasDeEnvio,
  recoger,
  usos,
} from "@tests/helpers/eventos.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { CuerpoPedido } from "@tests/helpers/types/fetch-falso.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { ARCHIVOS_CASO, ARCHIVOS_SALIDA, OUT_DIR } from "@/config/constants/files.constants.ts";
import { MODO_THINKING, PROVEEDOR_DEEPSEEK } from "@/config/constants/llm.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { SEPARADOR_PARRAFOS } from "@/config/constants/text.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { type ProviderSettings, parseAgentEnv, pinExecutionDate } from "@/config/env.ts";
import { TEXTO_SOPORTE } from "@/config/strings.ts";
import { cierreConPregunta } from "@/domain/builders/cierre-turno.builder.ts";
import type { CasoPendiente } from "@/domain/types/compuerta.type.ts";
import type { FetchLike } from "@/llm/types/provider.type.ts";
import { respuestaDeTurno } from "@/loop/services/respuesta-turno.service.ts";
import type { Agente } from "@/loop/types/agente.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import type { LlamadaRespondida } from "@/loop/types/turno.type.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";

const CO = "co-industrias-delta";
const EC = "ec-corp-andina";
const MENSAJE_CRITERIO_1 = "Procesa el caso co-industrias-delta.";
const MENSAJE_PRD_11 =
  'Procesa el caso "ec-corp-andina". Dime qué campos quedaron llenos, cuáles faltan, si el paquete está listo para firma y qué soportes debo actualizar. No envíes nada todavía.';
const MENSAJE_CONFIRMACION = "envía";
const TIPO_BLOQUEO_EC = "certificado_cumplimiento_tributario";
const BLOQUEO_EC = `ausente: ${TIPO_BLOQUEO_EC}`;
const PENDIENTE_EC: CasoPendiente = {
  caso: EC,
  bloqueos: [BLOQUEO_EC],
  motivos: [{ tipo: TIPO_BLOQUEO_EC, causa: ESTADO_SOPORTE.AUSENTE }],
};
const PENDIENTE_CO: CasoPendiente = { caso: CO, bloqueos: [], motivos: [] };
const PRESUPUESTO_SESION = "120000";
const MAX_TOKENS_SALIDA = "1500";
const TIMEOUT_MS = 300_000;
const LARGO_MINIMO_FRAGMENTO = 25;
const NEGRITA = "**";
const FLUJO = [
  HERRAMIENTA.LEER_SOLICITUD,
  HERRAMIENTA.MAPEAR_CAMPOS,
  HERRAMIENTA.GENERAR_FORMULARIO,
  HERRAMIENTA.ARMAR_PAQUETE,
].map((herramienta) => NOMBRE_VISIBLE[herramienta]);

const claves = [
  process.env.LLM_API_KEY,
  process.env.DEEPSEEK_API_KEY,
  process.env.LLM_FALLBACK_API_KEY,
].filter((clave): clave is string => clave !== undefined && clave.trim() !== "");
const hayClave = Boolean(process.env.LLM_API_KEY?.trim() || process.env.DEEPSEEK_API_KEY?.trim());

function conversacion(agente: Agente) {
  let sesionId: string | null = null;
  return async (mensaje: string): Promise<EventoAgente[]> => {
    const eventos = await recoger(agente.turno({ sesionId, mensaje }));
    const inicio = eventos[0];
    if (inicio?.tipo === TIPO_EVENTO.INICIO_TURNO) sesionId = inicio.sesionId;
    return eventos;
  };
}

function casoDe(argumentos: unknown): unknown {
  return typeof argumentos === "object" && argumentos !== null && "caso" in argumentos
    ? argumentos.caso
    : undefined;
}

function primerosOkDelFlujo(llamadas: readonly LlamadaRespondida[], caso: string): number[] {
  return FLUJO.map((herramienta) =>
    llamadas.findIndex(
      (llamada) => llamada.ok && llamada.herramienta === herramienta && casoDe(llamada.argumentos) === caso,
    ),
  );
}

function enOrden(indices: readonly number[]): boolean {
  return indices.every(
    (indice, posicion) => indice >= 0 && (posicion === 0 || indice > (indices[posicion - 1] ?? -1)),
  );
}

function fragmentosDeCuerpo(cuerpo: string): string[] {
  return [
    JSON.stringify(cuerpo).slice(1, -1),
    ...cuerpo
      .split("\n")
      .map((linea) => linea.trim())
      .filter((linea) => linea.length >= LARGO_MINIMO_FRAGMENTO),
  ];
}

function ultimoParrafo(texto: string): string | undefined {
  return texto.trimEnd().split(SEPARADOR_PARRAFOS).at(-1);
}

function totalFinal(eventos: readonly EventoAgente[]): number {
  return usos(eventos).at(-1)?.totalSesion ?? 0;
}

describe.skipIf(process.env.LLM_EN_VIVO !== "1")(
  "criterio 1 y guion PRD §11 contra el modelo real (LLM_EN_VIVO=1)",
  () => {
    test(
      "co-industrias-delta corre las cuatro herramientas en orden y ec-corp-andina pide confirmación y envía tras 'envía'",
      async () => {
        expect(hayClave).toBe(true);

        const restaurarFecha = pinExecutionDate(FECHA_DEMO);
        const proyecto = await crearProyectoTemporal();
        try {
          const cuerpos: string[] = [];
          const fetchGrabador: FetchLike = (url, init) => {
            cuerpos.push(String(init.body));
            return globalThis.fetch(url, init);
          };
          const fuenteEntorno = {
            ...process.env,
            AGENT_SESSION_TOKEN_BUDGET: PRESUPUESTO_SESION,
            LLM_MAX_OUTPUT_TOKENS: MAX_TOKENS_SALIDA,
            LOG_LEVEL: NIVELES_LOG.INFO,
          };
          const configuracion = parseAgentEnv(fuenteEntorno);
          if (!configuracion.success) throw new Error("configuración del agente inválida");
          const ranuras: ProviderSettings[] = [configuracion.data.primary];
          if (configuracion.data.fallback !== null) ranuras.push(configuracion.data.fallback);
          const modelos = ranuras.map((ranura) => ranura.model);
          const logs = capturarLogs();
          const nuevoAgente = (): Agente => {
            const creacion = crearAgente({
              directorio: proyecto.raiz,
              fetch: fetchGrabador,
              fuenteEntorno,
              destinoLogs: logs.destino,
            });
            if (!creacion.ok) throw new Error(creacion.codigo);
            return creacion.agente;
          };

          const agenteA = nuevoAgente();
          const turnoA = await conversacion(agenteA)(MENSAJE_CRITERIO_1);
          const respuestaA = respuestaDeTurno(turnoA);
          expect(enOrden(primerosOkDelFlujo(respuestaA.toolCalls, CO))).toBe(true);
          expect(respuestaA.reply.trim().length).toBeGreaterThan(0);
          expect(respuestaA.reply).not.toContain(NEGRITA);
          expect(ultimoParrafo(respuestaA.reply)).toBe(cierreConPregunta("", [PENDIENTE_CO]));
          expect(existsSync(join(proyecto.raiz, OUT_DIR, CO, ARCHIVOS_SALIDA.ENVIO_SIMULADO))).toBe(false);

          const agenteB = nuevoAgente();
          const turnoB = conversacion(agenteB);
          const turnoB1 = await turnoB(MENSAJE_PRD_11);
          const respuestaB1 = respuestaDeTurno(turnoB1);
          expect(enOrden(primerosOkDelFlujo(respuestaB1.toolCalls, EC))).toBe(true);
          expect(existsSync(join(proyecto.raiz, OUT_DIR, EC, ARCHIVOS_SALIDA.ENVIO_SIMULADO))).toBe(false);
          expect(respuestaB1.needsConfirmation).toBe(true);
          expect(
            confirmaciones(turnoB1)
              .filter((confirmacion) => confirmacion.caso === EC)
              .at(-1),
          ).toEqual(expect.objectContaining({ caso: EC, bloqueos: [BLOQUEO_EC] }));
          expect(ultimoParrafo(respuestaB1.reply)).toBe(cierreConPregunta("", [PENDIENTE_EC]));
          expect(respuestaB1.reply).toContain(TEXTO_SOPORTE.nombre(TIPO_BLOQUEO_EC));
          expect(respuestaB1.reply).toContain(`${OUT_DIR}/${EC}`);
          expect(respuestaB1.reply).not.toContain(NEGRITA);

          const turnoB2 = await turnoB(MENSAJE_CONFIRMACION);
          const respuestaB2 = respuestaDeTurno(turnoB2);
          expect(await casosConEnvioSimulado(proyecto.raiz)).toEqual([EC]);
          expect((await lineasDeEnvio(proyecto.raiz)).filter((linea) => linea.ok)).toHaveLength(1);
          expect(finDeTurno(turnoB2).needsConfirmation).toBe(false);

          const eventos = [...turnoA, ...turnoB1, ...turnoB2];
          for (const uso of usos(eventos)) expect(modelos).toContain(uso.modelo);
          for (const texto of cuerpos) {
            const cuerpo: CuerpoPedido = JSON.parse(texto);
            const ranura = ranuras.find((candidata) => candidata.model === cuerpo.model);
            expect(ranura).toBeDefined();
            if (ranura?.provider === PROVEEDOR_DEEPSEEK) {
              expect(cuerpo.thinking).toEqual({ type: MODO_THINKING.DESHABILITADO });
            }
          }

          const sensibles = await sensiblesDelProyecto(proyecto.raiz);
          expect(sensibles.length).toBeGreaterThan(10);
          const solicitudes = await Promise.all(
            [CO, EC].map(async (caso) => {
              const ruta = join(proyecto.casosDir, caso, ARCHIVOS_CASO.solicitud);
              const solicitud: { readonly cuerpo: string } = JSON.parse(await readFile(ruta, "utf8"));
              return solicitud.cuerpo;
            }),
          );
          const fragmentos = solicitudes.flatMap(fragmentosDeCuerpo);
          const pedidos = cuerpos.join("\n");
          expect(sensibles.filter((hoja) => pedidos.includes(hoja.valor)).map((hoja) => hoja.ruta)).toEqual(
            [],
          );
          expect(fragmentos.filter((fragmento) => pedidos.includes(fragmento))).toEqual([]);

          const salidas = [JSON.stringify(eventos), ...logs.crudas].join("\n");
          expect(logs.crudas.length).toBeGreaterThan(0);
          expect(claves.some((clave) => salidas.includes(clave))).toBe(false);
          expect(sensibles.filter((hoja) => salidas.includes(hoja.valor)).map((hoja) => hoja.ruta)).toEqual(
            [],
          );

          console.log(respuestaA.reply);
          console.log(respuestaB1.reply);
          console.log(respuestaB2.reply);
          const tokens = totalFinal(turnoA) + totalFinal([...turnoB1, ...turnoB2]);
          console.log(`VIVO PASS modelo=${agenteA.modelo} llamadas=${usos(eventos).length} tokens=${tokens}`);
        } finally {
          restaurarFecha();
          await proyecto.limpiar();
        }
      },
      TIMEOUT_MS,
    );
  },
);
