import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import {
  casosEn,
  clavesLlm,
  escenarioDesdeUsos,
  escribirEvidencia,
  evidenciaMedida,
  fugasDeEvidencia,
} from "@tests/helpers/costo.helper.ts";
import { finesDeHerramienta, recoger, usos } from "@tests/helpers/eventos.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { EscenarioCosto } from "@tests/helpers/types/costo.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { ESCENARIO_GUION, RUTA_EVIDENCIA_COSTO } from "@/config/constants/costo.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import { CASO_GUION_PRD } from "@/config/constants/preflight.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { TEXTO_PREFLIGHT } from "@/config/strings.ts";
import type { Agente } from "@/loop/types/agente.type.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const TIMEOUT_MS = 600_000;
const TURNOS_CASO = 1;
const TURNOS_GUION = 2;
const ARMAR_PAQUETE = NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE];
const SIMULAR_ENVIO = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];

function mensajeDeCaso(caso: string): string {
  return `Procesa el caso ${caso}.`;
}

function conversacion(agente: Agente) {
  let sesionId: string | null = null;
  return async (mensaje: string): Promise<EventoAgente[]> => {
    const eventos = await recoger(agente.turno({ sesionId, mensaje }));
    const inicio = eventos[0];
    if (inicio?.tipo === TIPO_EVENTO.INICIO_TURNO) sesionId = inicio.sesionId;
    return eventos;
  };
}

function terminoBien(eventos: readonly EventoAgente[], herramienta: string, caso: string): boolean {
  return finesDeHerramienta(eventos, herramienta).some((fin) => fin.ok && fin.caso === caso);
}

describe.skipIf(process.env.COSTO_EN_VIVO !== "1")(
  "costo medido por caso contra el modelo real (COSTO_EN_VIVO=1)",
  () => {
    test(
      `cada caso del fixture y el guion PRD §11 dejan su uso real en ${RUTA_EVIDENCIA_COSTO}`,
      async () => {
        const claves = clavesLlm(process.env);
        expect(claves.length).toBeGreaterThan(0);

        const restaurarFecha = pinExecutionDate(FECHA_DEMO);
        const proyecto = await crearProyectoTemporal();
        try {
          const fuenteEntorno = {
            LLM_API_KEY: process.env.LLM_API_KEY,
            DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
            FECHA_EJECUCION: FECHA_DEMO,
            LOG_LEVEL: NIVELES_LOG.SILENCIO,
          };
          const nuevoAgente = (): Agente => {
            const creacion = crearAgente({
              directorio: proyecto.raiz,
              fetch: globalThis.fetch,
              fuenteEntorno,
            });
            if (!creacion.ok) throw new Error(creacion.codigo);
            return creacion.agente;
          };

          const escenarios: EscenarioCosto[] = [];
          const eventosDeLaCorrida: EventoAgente[] = [];
          for (const caso of await casosEn(proyecto.casosDir)) {
            const eventos = await conversacion(nuevoAgente())(mensajeDeCaso(caso));
            expect(terminoBien(eventos, ARMAR_PAQUETE, caso)).toBe(true);
            expect(usos(eventos).length).toBeGreaterThan(0);
            escenarios.push(escenarioDesdeUsos(caso, TURNOS_CASO, usos(eventos)));
            eventosDeLaCorrida.push(...eventos);
          }

          const guion = conversacion(nuevoAgente());
          const procesar = await guion(TEXTO_PREFLIGHT.mensajeGuion);
          expect(terminoBien(procesar, ARMAR_PAQUETE, CASO_GUION_PRD)).toBe(true);
          const confirmar = await guion(TEXTO_PREFLIGHT.mensajeConfirmacion);
          expect(terminoBien(confirmar, SIMULAR_ENVIO, CASO_GUION_PRD)).toBe(true);
          escenarios.push(
            escenarioDesdeUsos(ESCENARIO_GUION, TURNOS_GUION, usos([...procesar, ...confirmar])),
          );
          eventosDeLaCorrida.push(...procesar, ...confirmar);

          const usosDeLaCorrida = usos(eventosDeLaCorrida);
          const primero = usosDeLaCorrida[0];
          if (primero === undefined) throw new Error("la corrida no dejó eventos de uso");
          for (const uso of usosDeLaCorrida) {
            expect(uso.proveedor).toBe(primero.proveedor);
            expect(uso.modelo).toBe(primero.modelo);
          }

          const evidencia = evidenciaMedida(
            escenarios,
            new Date().toISOString(),
            primero.proveedor,
            primero.modelo,
          );
          const sensibles = await sensiblesDelProyecto(proyecto.raiz);
          expect(sensibles.length).toBeGreaterThan(10);
          expect(fugasDeEvidencia(JSON.stringify(evidencia), sensibles, claves)).toEqual([]);

          await escribirEvidencia(RAIZ, evidencia);
          for (const escenario of escenarios) {
            console.log(
              `COSTO ${escenario.id} turnos=${escenario.turnos} llamadas=${escenario.llamadas} entrada=${escenario.entrada} cacheHit=${escenario.cacheHit} salida=${escenario.salida} pico=${escenario.costoPicoUsd} valle=${escenario.costoValleUsd}`,
            );
          }
        } finally {
          restaurarFecha();
          await proyecto.limpiar();
        }
      },
      TIMEOUT_MS,
    );
  },
);
