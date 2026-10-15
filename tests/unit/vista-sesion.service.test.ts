import { describe, expect, test } from "bun:test";
import { ACCION } from "@/config/constants/agent.constants.ts";
import { ESTADO_COMPUERTA } from "@/config/constants/confirmation.constants.ts";
import { FORMATO } from "@/config/constants/forms.constants.ts";
import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { TEXTO_MASCARA } from "@/config/strings.ts";
import type { Mensaje } from "@/llm/types/llm.type.ts";
import { vistaDeSesion } from "@/loop/services/vista-sesion.service.ts";
import type { Sesion } from "@/loop/types/turno.type.ts";

const EC = "ec-corp-andina";
const CO = "co-industrias-delta";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const SIMULAR = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];
const SECRETO = "secreto-del-proceso-Qw8R";
const PROMPT = "PROMPT-DE-SISTEMA-Vx2L";
const RAZONAMIENTO_PASO = "RAZONAMIENTO-DEL-PASO-Jt5N";
const RAZONAMIENTO_FINAL = "RAZONAMIENTO-FINAL-Pp4C";
const BLOQUEO_EC = "ausente: certificado_cumplimiento_tributario";
const BLOQUEO_LEGIBLE_EC = "ausente: Certificado de cumplimiento tributario";
const ID_REPETIDO = "call_00_0";

const SIN_DATOS = {
  pais: null,
  formato: null,
  conteo: null,
  listoParaFirma: null,
  bloqueosLegibles: null,
  ruta: null,
  aviso: null,
};

const LEIDA = {
  ok: true,
  data: { caso: EC, pais: "EC", formato: FORMATO.PDF, campos: [] },
  resumen: `${EC}: solicitud leída`,
};

const FALLIDA = {
  ok: false,
  codigo: "SIN_CONFIRMACION",
  error: "Falta la confirmación.",
  resumen: `${SIMULAR}: falta la confirmación`,
};

const HISTORIAL: readonly Mensaje[] = [
  { rol: ROL_MENSAJE.SISTEMA, contenido: PROMPT },
  { rol: ROL_MENSAJE.USUARIO, contenido: `Procesa el caso ${EC}.` },
  {
    rol: ROL_MENSAJE.ASISTENTE,
    contenido: null,
    llamadas: [{ id: ID_REPETIDO, nombre: LEER, argumentos: JSON.stringify({ caso: EC }) }],
    razonamiento: RAZONAMIENTO_PASO,
  },
  { rol: ROL_MENSAJE.HERRAMIENTA, llamadaId: ID_REPETIDO, contenido: JSON.stringify(LEIDA) },
  {
    rol: ROL_MENSAJE.ASISTENTE,
    contenido: null,
    llamadas: [
      {
        id: ID_REPETIDO,
        nombre: SIMULAR,
        argumentos: JSON.stringify({ caso: EC, nota: `usa ${SECRETO}` }),
      },
    ],
    razonamiento: null,
  },
  { rol: ROL_MENSAJE.HERRAMIENTA, llamadaId: ID_REPETIDO, contenido: JSON.stringify(FALLIDA) },
  {
    rol: ROL_MENSAJE.ASISTENTE,
    contenido: `Leí ${EC}; el envío necesita tu confirmación.`,
    llamadas: [],
    razonamiento: RAZONAMIENTO_FINAL,
  },
  { rol: ROL_MENSAJE.USUARIO, contenido: "¿Qué falta?" },
  {
    rol: ROL_MENSAJE.ASISTENTE,
    contenido: "Falta el certificado tributario.",
    llamadas: [],
    razonamiento: null,
  },
];

const SESION: Sesion = {
  id: "4b1f2c3d-0000-4000-8000-000000000001",
  historial: HISTORIAL,
  tokensUsados: 1234,
  compuerta: {
    tipo: ESTADO_COMPUERTA.PENDIENTE,
    accion: ACCION.ENVIO,
    casos: [
      {
        caso: EC,
        bloqueos: [BLOQUEO_EC],
        motivos: [{ tipo: "certificado_cumplimiento_tributario", causa: ESTADO_SOPORTE.AUSENTE }],
      },
    ],
  },
  paquetesConocidos: {},
  casosEnviados: [CO],
};

describe("vistaDeSesion proyecta la sesión guardada para recargar el chat (API-02)", () => {
  const vista = vistaDeSesion(SESION, false, [SECRETO]);

  test("agrupa el historial en un turno por mensaje de la usuaria, con su texto final", () => {
    expect(vista.sesionId).toBe(SESION.id);
    expect(vista.turnos.map(({ mensaje, texto }) => ({ mensaje, texto }))).toEqual([
      { mensaje: `Procesa el caso ${EC}.`, texto: `Leí ${EC}; el envío necesita tu confirmación.` },
      { mensaje: "¿Qué falta?", texto: "Falta el certificado tributario." },
    ]);
    expect(vista.turnos[1]?.herramientas).toEqual([]);
  });

  test("cada llamada lleva su caso, ok, código, resumen y el mismo resultado visible del tool_end", () => {
    expect(vista.turnos[0]?.herramientas).toEqual([
      {
        llamadaId: ID_REPETIDO,
        herramienta: LEER,
        caso: EC,
        argumentos: { caso: EC },
        ok: true,
        codigo: null,
        resumen: LEIDA.resumen,
        resultado: {
          herramienta: HERRAMIENTA.LEER_SOLICITUD,
          ...SIN_DATOS,
          pais: "EC",
          formato: FORMATO.PDF,
        },
      },
      {
        llamadaId: ID_REPETIDO,
        herramienta: SIMULAR,
        caso: EC,
        argumentos: { caso: EC, nota: `usa ${TEXTO_MASCARA.oculto}` },
        ok: false,
        codigo: FALLIDA.codigo,
        resumen: FALLIDA.resumen,
        resultado: null,
      },
    ]);
  });

  test("los pendientes llevan los bloqueos crudos y legibles, y se conservan enviados y tokens", () => {
    expect(vista.pendientes).toEqual([
      { caso: EC, bloqueos: [BLOQUEO_EC], bloqueosLegibles: [BLOQUEO_LEGIBLE_EC] },
    ]);
    expect(vista.casosEnviados).toEqual([CO]);
    expect(vista.tokensUsados).toBe(1234);
    expect(vista.ocupada).toBe(false);
    expect(vistaDeSesion(SESION, true, [SECRETO]).ocupada).toBe(true);
  });

  test("nunca lleva el prompt de sistema, el razonamiento del modelo ni un secreto", () => {
    const cuerpo = JSON.stringify(vista);
    for (const oculto of [PROMPT, RAZONAMIENTO_PASO, RAZONAMIENTO_FINAL, SECRETO]) {
      expect(cuerpo).not.toContain(oculto);
    }
  });

  test("una sesión libre y sin historial da una vista vacía", () => {
    const vacia = vistaDeSesion(
      { ...SESION, historial: [], compuerta: { tipo: ESTADO_COMPUERTA.LIBRE }, casosEnviados: [] },
      false,
      [],
    );
    expect(vacia).toEqual({
      sesionId: SESION.id,
      turnos: [],
      pendientes: [],
      casosEnviados: [],
      tokensUsados: 1234,
      ocupada: false,
    });
  });

  test("una llamada sin respuesta guardada queda como no correcta y sin resultado", () => {
    const sinRespuesta = vistaDeSesion({ ...SESION, historial: HISTORIAL.slice(0, 3) }, true, []);
    expect(sinRespuesta.turnos).toEqual([
      {
        mensaje: `Procesa el caso ${EC}.`,
        texto: null,
        herramientas: [
          {
            llamadaId: ID_REPETIDO,
            herramienta: LEER,
            caso: EC,
            argumentos: { caso: EC },
            ok: false,
            codigo: null,
            resumen: null,
            resultado: null,
          },
        ],
      },
    ]);
  });
});
