import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { crearAgentePrueba } from "@tests/helpers/agente-prueba.helper.ts";
import { finesDeHerramienta } from "@tests/helpers/eventos.helper.ts";
import { historialIntegro } from "@tests/helpers/historial.helper.ts";
import {
  llamar,
  pasoGenerarConMapeo,
  respuestaHerramientas,
  respuestaTexto,
} from "@tests/helpers/llm-falso.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import type { AgentePrueba } from "@tests/helpers/types/agente-prueba.type.ts";
import type { PasoLlmFalso } from "@tests/helpers/types/llm-falso.type.ts";
import type { HojaMaestro } from "@tests/helpers/types/pii.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { ARCHIVOS_CASO } from "@/config/constants/files.constants.ts";
import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import type { EventoAgente } from "@/loop/types/evento.type.ts";

const CASOS = ["co-industrias-delta", "ec-corp-andina", "hn-agroexport-sula", "pa-logistica-istmo"];
const CO = "co-industrias-delta";
const MASCARA = "•";
const LARGO_MINIMO_FRAGMENTO = 25;
const HERRAMIENTAS_DEL_FLUJO = [
  HERRAMIENTA.LEER_SOLICITUD,
  HERRAMIENTA.MAPEAR_CAMPOS,
  HERRAMIENTA.GENERAR_FORMULARIO,
  HERRAMIENTA.ARMAR_PAQUETE,
];

let proyecto: ProyectoTemporal;
let restaurarFecha: () => void;
let sensibles: HojaMaestro[];
let cuerpos: string[];
let prueba: AgentePrueba;
const eventos: EventoAgente[] = [];

function flujoDe(caso: string): readonly PasoLlmFalso[] {
  return [
    respuestaHerramientas(llamar(`leer-${caso}`, HERRAMIENTA.LEER_SOLICITUD, { caso })),
    respuestaHerramientas(llamar(`mapear-${caso}`, HERRAMIENTA.MAPEAR_CAMPOS, { caso, campos: [] })),
    pasoGenerarConMapeo(caso),
    respuestaHerramientas(llamar(`armar-${caso}`, HERRAMIENTA.ARMAR_PAQUETE, { caso })),
    respuestaTexto(`Procesé ${caso}.`),
  ];
}

async function cuerpoDe(caso: string): Promise<string> {
  const ruta = join(proyecto.casosDir, caso, ARCHIVOS_CASO.solicitud);
  const solicitud: { readonly cuerpo: string } = JSON.parse(await readFile(ruta, "utf8"));
  return solicitud.cuerpo;
}

beforeAll(async () => {
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
  proyecto = await crearProyectoTemporal();
  sensibles = await sensiblesDelProyecto(proyecto.raiz);
  cuerpos = await Promise.all(CASOS.map(cuerpoDe));
  prueba = crearAgentePrueba({
    raiz: proyecto.raiz,
    guion: [
      ...CASOS.flatMap(flujoDe),
      respuestaHerramientas(llamar("nit-1", HERRAMIENTA.MAPEAR_CAMPOS, { caso: CO, campos: ["NIT"] })),
      respuestaTexto("El NIT viene del maestro, enmascarado."),
    ],
  });
  for (const caso of CASOS) eventos.push(...(await prueba.turno(`Procesa el caso ${caso}.`)));
  eventos.push(...(await prueba.turno(`¿cuál es el NIT de ${CO}?`)));
});

afterAll(async () => {
  restaurarFecha();
  await proyecto.limpiar();
});

function textosEnviadosAlModelo(): string[] {
  return prueba.llm.pedidos.flatMap((pedido) =>
    pedido.mensajes.flatMap((mensaje) => {
      const contenido = mensaje.contenido ?? "";
      if (mensaje.rol !== ROL_MENSAJE.ASISTENTE) return [contenido];
      return [contenido, ...mensaje.llamadas.map((llamada) => llamada.argumentos)];
    }),
  );
}

function fragmentosDeCuerpo(cuerpo: string): string[] {
  return [
    cuerpo,
    ...cuerpo
      .split("\n")
      .map((linea) => linea.trim())
      .filter((linea) => linea.length >= LARGO_MINIMO_FRAGMENTO),
  ];
}

describe("el modelo nunca recibe un valor real del maestro ni el cuerpo del correo (AGT-03, CA2, MAP-05)", () => {
  test("los cuatro casos corren el flujo completo y la pregunta por el NIT consulta solo ese campo", () => {
    for (const herramienta of HERRAMIENTAS_DEL_FLUJO) {
      const fines = finesDeHerramienta(eventos, NOMBRE_VISIBLE[herramienta]);
      expect(fines.filter((fin) => fin.ok).length).toBeGreaterThanOrEqual(CASOS.length);
    }
    expect(prueba.llm.pedidos).toHaveLength(CASOS.length * 5 + 2);
  });

  test("ningún valor sensible del maestro aparece en ningún mensaje enviado ni en los eventos", () => {
    expect(sensibles.length).toBeGreaterThan(10);
    const corpus = [...textosEnviadosAlModelo(), JSON.stringify(eventos)].join("\n");
    expect(sensibles.filter((hoja) => corpus.includes(hoja.valor)).map((hoja) => hoja.ruta)).toEqual([]);
  });

  test("ningún fragmento del cuerpo de las solicitudes llega al modelo ni a los eventos", () => {
    const corpus = [...textosEnviadosAlModelo(), JSON.stringify(eventos)].join("\n");
    const fragmentos = cuerpos.flatMap(fragmentosDeCuerpo);
    expect(fragmentos.length).toBeGreaterThan(CASOS.length);
    expect(fragmentos.filter((fragmento) => corpus.includes(fragmento))).toEqual([]);
  });

  test("los valores enmascarados sí llegan al modelo en los mensajes de herramienta", () => {
    const deHerramienta = prueba.llm.pedidos.flatMap((pedido) =>
      pedido.mensajes.filter((mensaje) => mensaje.rol === ROL_MENSAJE.HERRAMIENTA),
    );
    expect(deHerramienta.some((mensaje) => mensaje.contenido.includes(MASCARA))).toBe(true);
  });

  test("cada pedido conserva un historial íntegro", () => {
    for (const pedido of prueba.llm.pedidos) expect(historialIntegro(pedido.mensajes)).toEqual([]);
  });
});
