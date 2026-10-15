import { describe, expect, test } from "bun:test";
import {
  ACCION_UI,
  ESTADO_HERRAMIENTA,
  MAXIMO_TARJETAS_ABIERTAS,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT, TEXTO_HERRAMIENTA } from "@web/config/strings.ts";
import {
  anuncioDeEstado,
  argumentosLegibles,
  estadoInicialConversacion,
  etiquetaPensando,
  eventosDelTurno,
  grupoSeCierraAlTerminar,
  llamadaEnCurso,
  reducirConversacion,
  resumenDeLlamadas,
} from "@web/state/conversacion.ts";
import type { AccionUi, EstadoConversacion } from "@web/types/chat.type.ts";
import { MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import type { SseEvent } from "@/http/types/api.type.ts";

const SESION = "sesion-de-prueba";
const TURNO = "turno-1";
const CASO = "ec-corp-andina";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const MAPEAR = NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS];
const DESCONOCIDA = "proveedor_listar_casos";
const RESUMEN_LEER = "Solicitud de ec-corp-andina: EC, formato xlsx, 15 campos.";
const RESUMEN_MAPEAR = "13 llenos, 1 faltante, 1 por confirmar.";
const RESUMEN_FALLO = "El caso no existe.";
const CODIGO_FALLO = CODIGO_ERROR.CASO_NO_ENCONTRADO;

function evento(eventoDelServidor: SseEvent): AccionUi {
  return { tipo: ACCION_UI.EVENTO, evento: eventoDelServidor };
}

function aplicar(acciones: readonly AccionUi[]): EstadoConversacion {
  return acciones.reduce(reducirConversacion, estadoInicialConversacion);
}

const inicioDeTurno: readonly AccionUi[] = [
  { tipo: ACCION_UI.ENVIAR, mensaje: `procesa el caso ${CASO}` },
  evento({
    tipo: TIPO_EVENTO.INICIO_TURNO,
    sesionId: SESION,
    turnoId: TURNO,
    sesionNueva: true,
    sesionExpirada: false,
  }),
];

function inicio(llamadaId: string, herramienta: string, caso: string | null = CASO): AccionUi {
  return evento({
    tipo: TIPO_EVENTO.INICIO_HERRAMIENTA,
    turnoId: TURNO,
    llamadaId,
    herramienta,
    caso,
    argumentos: { caso },
  });
}

function fin(llamadaId: string, herramienta: string, ok: boolean, resumen: string): AccionUi {
  return evento({
    tipo: TIPO_EVENTO.FIN_HERRAMIENTA,
    turnoId: TURNO,
    llamadaId,
    herramienta,
    caso: CASO,
    ok,
    codigo: ok ? null : CODIGO_FALLO,
    resumen,
    resultado: null,
  });
}

const finDeTurno = evento({
  tipo: TIPO_EVENTO.FIN_TURNO,
  turnoId: TURNO,
  motivo: MOTIVO_FIN.FINAL,
  needsConfirmation: false,
});

function llamadasDelTurno(estado: EstadoConversacion) {
  return estado.turnos.at(-1)?.llamadas ?? [];
}

describe("tarjetas de herramienta del turno", () => {
  test("un turno nuevo empieza sin tarjetas", () => {
    expect(llamadasDelTurno(aplicar(inicioDeTurno))).toEqual([]);
  });

  test("tool_start abre una tarjeta En curso con su caso y sus argumentos redactados", () => {
    const estado = aplicar([...inicioDeTurno, inicio("call_1", LEER)]);
    expect(llamadasDelTurno(estado)).toEqual([
      {
        llamadaId: "call_1",
        herramienta: LEER,
        caso: CASO,
        argumentos: { caso: CASO },
        estado: ESTADO_HERRAMIENTA.EN_CURSO,
        resumen: null,
        codigo: null,
      },
    ]);
  });

  test("tool_start y tool_end con ok dejan una sola tarjeta Correcta con su caso y su resumen", () => {
    const estado = aplicar([
      ...inicioDeTurno,
      inicio("call_1", LEER),
      fin("call_1", LEER, true, RESUMEN_LEER),
    ]);
    const llamadas = llamadasDelTurno(estado);
    expect(llamadas).toHaveLength(1);
    expect(llamadas[0]).toMatchObject({
      herramienta: LEER,
      caso: CASO,
      estado: ESTADO_HERRAMIENTA.CORRECTA,
      resumen: RESUMEN_LEER,
      codigo: null,
    });
  });

  test("tool_end con ok false deja la tarjeta en Error y conserva el código", () => {
    const estado = aplicar([
      ...inicioDeTurno,
      inicio("call_1", LEER),
      fin("call_1", LEER, false, RESUMEN_FALLO),
    ]);
    expect(llamadasDelTurno(estado)[0]).toMatchObject({
      estado: ESTADO_HERRAMIENTA.ERROR,
      codigo: CODIGO_FALLO,
      resumen: RESUMEN_FALLO,
    });
  });

  test("dos llamadas conservan el orden en que empezaron y cada tool_end cierra la suya", () => {
    const estado = aplicar([
      ...inicioDeTurno,
      inicio("call_1", LEER),
      fin("call_1", LEER, true, RESUMEN_LEER),
      inicio("call_2", MAPEAR),
      fin("call_2", MAPEAR, false, RESUMEN_FALLO),
    ]);
    expect(
      llamadasDelTurno(estado).map(({ llamadaId, herramienta, estado: fase }) => [
        llamadaId,
        herramienta,
        fase,
      ]),
    ).toEqual([
      ["call_1", LEER, ESTADO_HERRAMIENTA.CORRECTA],
      ["call_2", MAPEAR, ESTADO_HERRAMIENTA.ERROR],
    ]);
  });

  test("un tool_end sin tool_start igual deja su tarjeta cerrada", () => {
    const estado = aplicar([...inicioDeTurno, fin("call_9", MAPEAR, true, RESUMEN_MAPEAR)]);
    expect(llamadasDelTurno(estado)).toEqual([
      {
        llamadaId: "call_9",
        herramienta: MAPEAR,
        caso: CASO,
        argumentos: null,
        estado: ESTADO_HERRAMIENTA.CORRECTA,
        resumen: RESUMEN_MAPEAR,
        codigo: null,
      },
    ]);
  });

  test("un tool_start repetido no duplica la tarjeta", () => {
    const estado = aplicar([...inicioDeTurno, inicio("call_1", LEER), inicio("call_1", LEER)]);
    expect(llamadasDelTurno(estado)).toHaveLength(1);
  });

  test("las tarjetas de un turno no pasan al turno siguiente", () => {
    const estado = aplicar([
      ...inicioDeTurno,
      inicio("call_1", LEER),
      fin("call_1", LEER, true, RESUMEN_LEER),
      finDeTurno,
      ...inicioDeTurno,
    ]);
    expect(estado.turnos.map((turno) => turno.llamadas.length)).toEqual([1, 0]);
  });
});

describe("resumen del grupo de herramientas", () => {
  test("cuenta las tarjetas correctas y las que terminaron con error", () => {
    const estado = aplicar([
      ...inicioDeTurno,
      inicio("call_1", LEER),
      fin("call_1", LEER, true, RESUMEN_LEER),
      inicio("call_2", MAPEAR),
      fin("call_2", MAPEAR, false, RESUMEN_FALLO),
      inicio("call_3", MAPEAR),
    ]);
    const resumen = resumenDeLlamadas(llamadasDelTurno(estado));
    expect(resumen).toEqual({ total: 3, correctas: 1, conError: 1 });
    expect(TEXTO_HERRAMIENTA.grupo(resumen)).toBe("3 llamadas a herramientas · 1 correcta · 1 con error");
  });

  test("una sola llamada usa el singular", () => {
    expect(TEXTO_HERRAMIENTA.grupo({ total: 1, correctas: 1, conError: 0 })).toBe("1 llamada a herramienta");
  });

  test("cuatro llamadas correctas usan el plural del UI-SPEC", () => {
    expect(TEXTO_HERRAMIENTA.grupo({ total: 4, correctas: 4, conError: 0 })).toBe(
      "4 llamadas a herramientas · 4 correctas · 0 con error",
    );
  });

  test("el grupo se cierra al terminar el turno solo si tiene más de seis tarjetas", () => {
    expect(grupoSeCierraAlTerminar(MAXIMO_TARJETAS_ABIERTAS)).toBe(false);
    expect(grupoSeCierraAlTerminar(MAXIMO_TARJETAS_ABIERTAS + 1)).toBe(true);
  });
});

describe("contenido de la tarjeta", () => {
  test("la etiqueta humana sale de la herramienta y una desconocida muestra su nombre técnico", () => {
    expect(TEXTO_HERRAMIENTA.etiqueta(MAPEAR)).toBe("Mapear campos");
    expect(TEXTO_HERRAMIENTA.etiqueta(NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO])).toBe("Simular envío");
    expect(TEXTO_HERRAMIENTA.etiqueta(DESCONOCIDA)).toBe(DESCONOCIDA);
  });

  test("los estados se leen En curso, Correcta y Error", () => {
    expect(Object.values(ESTADO_HERRAMIENTA).map(TEXTO_HERRAMIENTA.estado)).toEqual([
      "En curso",
      "Correcta",
      "Error",
    ]);
  });

  test("los argumentos se muestran como JSON con sangría de dos espacios", () => {
    expect(argumentosLegibles({ caso: CASO, formato: "xlsx" })).toBe(
      `{\n  "caso": "${CASO}",\n  "formato": "xlsx"\n}`,
    );
    expect(argumentosLegibles(undefined)).toBe("null");
  });

  test("el código de un fallo se lee Código: {codigo}", () => {
    expect(TEXTO_HERRAMIENTA.codigo(CODIGO_FALLO)).toBe(`Código: ${CODIGO_FALLO}`);
  });
});

describe("región viva del turno", () => {
  test("tool_start anuncia Ejecutando {etiqueta} de {caso}", () => {
    const estado = aplicar([...inicioDeTurno, inicio("call_1", MAPEAR)]);
    expect(llamadaEnCurso(estado)?.llamadaId).toBe("call_1");
    expect(anuncioDeEstado(estado)).toBe(`Ejecutando Mapear campos de ${CASO}`);
  });

  test("sin herramienta en curso no anuncia nada y al terminar anuncia la respuesta", () => {
    const enCurso = aplicar([
      ...inicioDeTurno,
      inicio("call_1", LEER),
      fin("call_1", LEER, true, RESUMEN_LEER),
    ]);
    expect(llamadaEnCurso(enCurso)).toBeNull();
    expect(anuncioDeEstado(enCurso)).toBe("");
    expect(anuncioDeEstado(reducirConversacion(enCurso, finDeTurno))).toBe(TEXTO_CHAT.respuestaLista);
  });
});

describe("indicador pensando", () => {
  test("sin herramienta en curso dice Pensando…", () => {
    expect(etiquetaPensando(aplicar(inicioDeTurno))).toBe("Pensando…");
  });

  test("con mapear_campos en curso sobre ec-corp-andina dice Mapeando campos · ec-corp-andina…", () => {
    expect(etiquetaPensando(aplicar([...inicioDeTurno, inicio("call_1", MAPEAR)]))).toBe(
      "Mapeando campos · ec-corp-andina…",
    );
  });

  test("al cerrar la herramienta vuelve a Pensando…", () => {
    const estado = aplicar([
      ...inicioDeTurno,
      inicio("call_1", MAPEAR),
      fin("call_1", MAPEAR, true, RESUMEN_MAPEAR),
    ]);
    expect(etiquetaPensando(estado)).toBe("Pensando…");
  });

  test("cada herramienta conocida usa su gerundio y sin caso solo el gerundio", () => {
    const gerundios = Object.values(HERRAMIENTA).map((herramienta) =>
      etiquetaPensando(aplicar([...inicioDeTurno, inicio("call_1", NOMBRE_VISIBLE[herramienta], null)])),
    );
    expect(gerundios).toEqual([
      "Leyendo la solicitud…",
      "Mapeando campos…",
      "Generando el formulario…",
      "Armando el paquete…",
      "Registrando el envío simulado…",
    ]);
  });

  test("una herramienta desconocida dice Ejecutando {nombre}", () => {
    expect(etiquetaPensando(aplicar([...inicioDeTurno, inicio("call_1", DESCONOCIDA, null)]))).toBe(
      `Ejecutando ${DESCONOCIDA}…`,
    );
    expect(etiquetaPensando(aplicar([...inicioDeTurno, inicio("call_1", DESCONOCIDA)]))).toBe(
      `Ejecutando ${DESCONOCIDA} · ${CASO}…`,
    );
  });

  test("cada evento del turno mueve la marca que reinicia la espera del servidor despertando", () => {
    expect(eventosDelTurno(aplicar([{ tipo: ACCION_UI.ENVIAR, mensaje: CASO }]))).toBe(0);
    const estado = aplicar([
      ...inicioDeTurno,
      inicio("call_1", LEER),
      fin("call_1", LEER, true, RESUMEN_LEER),
    ]);
    expect(eventosDelTurno(estado)).toBe(3);
    expect(eventosDelTurno(aplicar([...inicioDeTurno, finDeTurno, ...inicioDeTurno]))).toBe(1);
  });
});
