import { afterAll, beforeAll, describe, expect, test } from "bun:test";
import { CLAVE_PRUEBA } from "@tests/helpers/agente-fetch.helper.ts";
import { crearFetchFalso, cuerpoConHerramientas, cuerpoConTexto } from "@tests/helpers/fetch-falso.helper.ts";
import { mapearProyectado } from "@tests/helpers/flujo.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import { crearProyectoTemporal } from "@tests/helpers/proyecto-temporal.helper.ts";
import {
  CODIGO_PRUEBA,
  crearServidorPrueba,
  inicioDeFrames,
  leerSse,
  SECRETO_PRUEBA,
} from "@tests/helpers/servidor-prueba.helper.ts";
import type { RespuestaGuion } from "@tests/helpers/types/fetch-falso.type.ts";
import type { HojaMaestro } from "@tests/helpers/types/pii.type.ts";
import type { ProyectoTemporal } from "@tests/helpers/types/proyecto-temporal.type.ts";
import type { ServidorPrueba } from "@tests/helpers/types/servidor-prueba.type.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { FORMATO } from "@/config/constants/forms.constants.ts";
import { PREFIJO_API, RESPUESTA_HTTP, RUTA_API } from "@/config/constants/http.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import { TEXTO_SESION } from "@/config/strings.ts";
import { vistaSesionSchema } from "@/loop/schemas/vista-sesion.schema.ts";
import type { VistaSesion } from "@/loop/types/vista-sesion.type.ts";
import { crearHerramientas } from "@/tools/factories/herramientas.factory.ts";

const EC = "ec-corp-andina";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const MAPEAR = NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS];
const GENERAR = NOMBRE_VISIBLE[HERRAMIENTA.GENERAR_FORMULARIO];
const ARMAR = NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE];
const BLOQUEO_EC = "ausente: certificado_cumplimiento_tributario";
const BLOQUEO_LEGIBLE_EC = "ausente: Certificado de cumplimiento tributario";
const CENTINELAS = [CLAVE_PRUEBA, CODIGO_PRUEBA, SECRETO_PRUEBA];
const MENSAJE_CON_CENTINELAS = `Procesa el caso ${EC}. Notas: ${CENTINELAS.join(" ")}`;

let proyecto: ProyectoTemporal;
let restaurarFecha: () => void;
let sensibles: HojaMaestro[];

beforeAll(async () => {
  proyecto = await crearProyectoTemporal();
  restaurarFecha = pinExecutionDate(FECHA_DEMO);
  sensibles = await sensiblesDelProyecto(proyecto.raiz);
});

afterAll(async () => {
  restaurarFecha();
  await proyecto.limpiar();
});

function rutaSesion(id: string): string {
  return `${PREFIJO_API}/sessions/${id}`;
}

function cuerpoChat(sessionId: string | null, message: string): RequestInit {
  return { method: "POST", body: JSON.stringify({ sessionId, message }) };
}

async function turnoCompleto(servidor: ServidorPrueba, sessionId: string | null, message: string) {
  const respuesta = await servidor.pedir(RUTA_API.CHAT, cuerpoChat(sessionId, message));
  expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
  return inicioDeFrames((await leerSse(respuesta)).eventos);
}

async function vistaDe(
  servidor: ServidorPrueba,
  sesionId: string,
): Promise<{ texto: string; vista: VistaSesion }> {
  const respuesta = await servidor.pedir(rutaSesion(sesionId));
  expect(respuesta.status).toBe(RESPUESTA_HTTP.OK);
  const texto = await respuesta.text();
  return { texto, vista: vistaSesionSchema.parse(JSON.parse(texto)) };
}

async function guionDelCaso(): Promise<RespuestaGuion[]> {
  const ctx = { directory: proyecto.raiz, sessionId: "preparacion-vista" };
  const mapeo = await mapearProyectado(crearHerramientas(), ctx, EC);
  return [
    { cuerpo: cuerpoConHerramientas({ id: "leer-1", nombre: LEER, argumentos: { caso: EC } }) },
    {
      cuerpo: cuerpoConHerramientas({ id: "mapear-1", nombre: MAPEAR, argumentos: { caso: EC, campos: [] } }),
    },
    { cuerpo: cuerpoConHerramientas({ id: "generar-1", nombre: GENERAR, argumentos: { caso: EC, mapeo } }) },
    { cuerpo: cuerpoConHerramientas({ id: "armar-1", nombre: ARMAR, argumentos: { caso: EC } }) },
    { cuerpo: cuerpoConTexto(`Armé el paquete de ${EC}. Referencia ${CLAVE_PRUEBA}.`) },
  ];
}

describe("GET /api/sessions/:id devuelve la conversación redactada (API-02, D-69)", () => {
  let texto: string;
  let vista: VistaSesion;
  let sesionId: string;

  beforeAll(async () => {
    const falso = crearFetchFalso(await guionDelCaso());
    const servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: falso.fetch });
    sesionId = (await turnoCompleto(servidor, null, MENSAJE_CON_CENTINELAS)).sesionId;
    ({ texto, vista } = await vistaDe(servidor, sesionId));
  });

  test("el turno trae las cuatro llamadas con su caso, su resultado y el texto final", () => {
    expect(vista.sesionId).toBe(sesionId);
    expect(vista.ocupada).toBe(false);
    expect(vista.turnos).toHaveLength(1);
    const [turno] = vista.turnos;
    expect(turno?.herramientas.map(({ herramienta, caso, ok }) => ({ herramienta, caso, ok }))).toEqual([
      { herramienta: LEER, caso: EC, ok: true },
      { herramienta: MAPEAR, caso: EC, ok: true },
      { herramienta: GENERAR, caso: EC, ok: true },
      { herramienta: ARMAR, caso: EC, ok: true },
    ]);
    expect(turno?.herramientas.map(({ llamadaId }) => llamadaId)).toEqual([
      "leer-1",
      "mapear-1",
      "generar-1",
      "armar-1",
    ]);
    const [leer, mapear, generar, armar] = turno?.herramientas ?? [];
    expect(leer?.resultado).toMatchObject({ pais: "EC", formato: FORMATO.PDF });
    expect(mapear?.resultado?.conteo).toEqual({ lleno: 13, faltante: 1, requiere_confirmacion: 1 });
    expect(generar?.resultado).toMatchObject({ ruta: `out/${EC}/formulario.pdf`, formato: FORMATO.PDF });
    expect(armar?.resultado).toMatchObject({ listoParaFirma: false, bloqueosLegibles: [BLOQUEO_LEGIBLE_EC] });
    expect(turno?.texto).toStartWith(`Armé el paquete de ${EC}.`);
  });

  test("los pendientes traen ec con sus bloqueos crudos y legibles", () => {
    expect(vista.pendientes).toEqual([
      { caso: EC, bloqueos: [BLOQUEO_EC], bloqueosLegibles: [BLOQUEO_LEGIBLE_EC] },
    ]);
    expect(vista.casosEnviados).toEqual([]);
    expect(vista.tokensUsados).toBeGreaterThan(0);
  });

  test("ningún valor sensible del maestro ni centinela aparece en la vista (D-47)", () => {
    expect(sensibles.length).toBeGreaterThan(0);
    expect(sensibles.filter((hoja) => texto.includes(hoja.valor))).toEqual([]);
    for (const centinela of CENTINELAS) expect(texto).not.toContain(centinela);
    expect(vista.turnos[0]?.mensaje).toStartWith(`Procesa el caso ${EC}.`);
  });
});

describe("GET /api/sessions/:id sin sesión", () => {
  test("un id desconocido responde 404 con el texto de sesión expirada", async () => {
    const servidor = crearServidorPrueba({ raiz: proyecto.raiz, fetch: crearFetchFalso([]).fetch });
    const respuesta = await servidor.pedir(rutaSesion(crypto.randomUUID()));
    expect(respuesta.status).toBe(RESPUESTA_HTTP.NO_ENCONTRADO);
    expect(await respuesta.json()).toEqual({ mensaje: TEXTO_SESION.expirada });
  });
});
