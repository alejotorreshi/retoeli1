import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { crearAgentePrueba } from "@tests/helpers/agente-prueba.helper.ts";
import {
  llamar,
  pasoGenerarConMapeo,
  respuestaHerramientas,
  respuestaTexto,
} from "@tests/helpers/llm-falso.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { HojaMaestro } from "@tests/helpers/types/pii.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { FORMATO } from "@/config/constants/forms.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import type {
  EventoAgente,
  EventoFinHerramienta,
  EventoInicioHerramienta,
} from "@/loop/types/evento.type.ts";

const EC = "ec-corp-andina";
const BLOQUEO_LEGIBLE_EC = "ausente: Certificado de cumplimiento tributario";

const SIN_DATOS = {
  pais: null,
  formato: null,
  conteo: null,
  listoParaFirma: null,
  bloqueosLegibles: null,
  ruta: null,
  aviso: null,
};

let proyecto: ProyectoTemporal;
let restaurarFecha: () => void;
let sensibles: HojaMaestro[];
let eventos: EventoAgente[];

function inicios(): EventoInicioHerramienta[] {
  return eventos.filter(
    (evento): evento is EventoInicioHerramienta => evento.tipo === TIPO_EVENTO.INICIO_HERRAMIENTA,
  );
}

function fines(): EventoFinHerramienta[] {
  return eventos.filter(
    (evento): evento is EventoFinHerramienta => evento.tipo === TIPO_EVENTO.FIN_HERRAMIENTA,
  );
}

function finDe(herramienta: (typeof HERRAMIENTA)[keyof typeof HERRAMIENTA]): EventoFinHerramienta {
  const fin = fines().find((evento) => evento.herramienta === NOMBRE_VISIBLE[herramienta]);
  if (fin === undefined) throw new Error(`falta el ${TIPO_EVENTO.FIN_HERRAMIENTA} de ${herramienta}`);
  return fin;
}

beforeAll(async () => {
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
  proyecto = await crearProyectoTemporal();
  sensibles = await sensiblesDelProyecto(proyecto.raiz);
  const prueba = crearAgentePrueba({
    raiz: proyecto.raiz,
    guion: [
      respuestaHerramientas(llamar("leer-1", HERRAMIENTA.LEER_SOLICITUD, { caso: EC })),
      respuestaHerramientas(llamar("mapear-1", HERRAMIENTA.MAPEAR_CAMPOS, { caso: EC, campos: [] })),
      pasoGenerarConMapeo(EC),
      respuestaHerramientas(llamar("armar-1", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })),
      respuestaTexto(`Procesé ${EC}.`),
    ],
  });
  eventos = await prueba.turno(`Procesa el caso ${EC}.`);
});

afterAll(async () => {
  restaurarFecha();
  await proyecto.limpiar();
});

describe("los eventos de herramienta llevan lo que la UI necesita (UI-02, UI-05, UI-08)", () => {
  test("cada tool_start y cada tool_end nombran el caso que tocan", () => {
    expect(inicios()).toHaveLength(4);
    expect(fines()).toHaveLength(4);
    for (const evento of [...inicios(), ...fines()]) expect(evento.caso).toBe(EC);
  });

  test("leer_solicitud trae el país y el formato pedido", () => {
    expect(finDe(HERRAMIENTA.LEER_SOLICITUD).resultado).toEqual({
      herramienta: HERRAMIENTA.LEER_SOLICITUD,
      ...SIN_DATOS,
      pais: "EC",
      formato: FORMATO.PDF,
    });
  });

  test("mapear_campos trae los contadores 13/1/1", () => {
    expect(finDe(HERRAMIENTA.MAPEAR_CAMPOS).resultado).toEqual({
      herramienta: HERRAMIENTA.MAPEAR_CAMPOS,
      ...SIN_DATOS,
      pais: "EC",
      conteo: { lleno: 13, faltante: 1, requiere_confirmacion: 1 },
    });
  });

  test("generar_formulario trae la ruta y el formato del archivo generado", () => {
    expect(finDe(HERRAMIENTA.GENERAR_FORMULARIO).resultado).toEqual({
      herramienta: HERRAMIENTA.GENERAR_FORMULARIO,
      ...SIN_DATOS,
      formato: FORMATO.PDF,
      ruta: `out/${EC}/formulario.pdf`,
    });
  });

  test("armar_paquete trae el bloqueo legible, el estado de firma y la ruta; el resumen crudo no cambia", () => {
    const armar = finDe(HERRAMIENTA.ARMAR_PAQUETE);
    expect(armar.resultado).toEqual({
      herramienta: HERRAMIENTA.ARMAR_PAQUETE,
      ...SIN_DATOS,
      listoParaFirma: false,
      bloqueosLegibles: [BLOQUEO_LEGIBLE_EC],
      ruta: `out/${EC}/paquete`,
    });
    expect(armar.resumen).toContain("certificado_cumplimiento_tributario");
  });

  test("ningún valor sensible del maestro aparece en ningún evento", () => {
    expect(sensibles.length).toBeGreaterThan(0);
    const serializados = eventos.map((evento) => JSON.stringify(evento));
    const fugas = sensibles.filter((hoja) => serializados.some((texto) => texto.includes(hoja.valor)));
    expect(fugas).toEqual([]);
  });
});
