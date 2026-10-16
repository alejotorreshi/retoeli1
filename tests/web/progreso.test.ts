import { describe, expect, test } from "bun:test";
import {
  ACCION_UI,
  ESTADO_ETAPA,
  ETAPA,
  ETAPA_DE_HERRAMIENTA,
  ORDEN_ETAPAS,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT, TEXTO_HERRAMIENTA, TEXTO_PANEL, TEXTO_PROGRESO } from "@web/config/strings.ts";
import { firmaDelProgreso, marcasDeArchivos, progresoPorCaso } from "@web/features/casos/estado/casos.ts";
import {
  anuncioDeEstado,
  estadoInicialConversacion,
  etiquetaPensando,
  reducirConversacion,
} from "@web/features/chat/estado/conversacion.ts";
import { estadoDesdeVista } from "@web/features/sesion/estado/hidratacion.ts";
import type {
  AccionUi,
  EstadoConversacion,
  EstadoEtapa,
  HerramientaVistaUi,
  ProgresoDeCaso,
  VistaSesionUi,
} from "@web/types/chat.type.ts";
import { ACCION, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE, ORDEN_FLUJO_HERRAMIENTAS } from "@/config/constants/tools.constants.ts";
import type { ConfigResponse, SseEvent } from "@/http/types/api.type.ts";

const SESION = "sesion-de-progreso";
const TURNO = "turno-progreso";
const EC = "ec-corp-andina";
const CO = "co-industrias-delta";
const PE = "pe-andes-logistica";
const CASOS_FIXTURE = [CO, EC, "hn-agroexport-sula", "pa-logistica-istmo"];
const PREGUNTA_LISTADO = "¿Qué casos hay disponibles?";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];
const MAPEAR = NOMBRE_VISIBLE[HERRAMIENTA.MAPEAR_CAMPOS];
const GENERAR = NOMBRE_VISIBLE[HERRAMIENTA.GENERAR_FORMULARIO];
const ARMAR = NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE];
const ENVIAR = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];
const BLOQUEO = "Certificado bancario vencido";

let secuencia = 0;

function evento(eventoDelServidor: SseEvent): AccionUi {
  return { tipo: ACCION_UI.EVENTO, evento: eventoDelServidor };
}

function turno(mensaje: string): readonly AccionUi[] {
  return [
    { tipo: ACCION_UI.ENVIAR, mensaje },
    evento({
      tipo: TIPO_EVENTO.INICIO_TURNO,
      sesionId: SESION,
      turnoId: TURNO,
      sesionNueva: false,
      sesionExpirada: false,
    }),
  ];
}

function inicio(herramienta: string, caso: string | null): AccionUi {
  secuencia += 1;
  return evento({
    tipo: TIPO_EVENTO.INICIO_HERRAMIENTA,
    turnoId: TURNO,
    llamadaId: `call_${secuencia}`,
    herramienta,
    caso,
    argumentos: { caso },
  });
}

function fin(herramienta: string, caso: string, ok: boolean): AccionUi {
  return evento({
    tipo: TIPO_EVENTO.FIN_HERRAMIENTA,
    turnoId: TURNO,
    llamadaId: `call_${secuencia}`,
    herramienta,
    caso,
    ok,
    codigo: ok ? null : CODIGO_ERROR.ERROR_INTERNO,
    resumen: null,
    resultado: null,
  });
}

function lecturaRefutada(
  caso: string | null,
  codigo: string = CODIGO_ERROR.CASO_NO_ENCONTRADO,
): readonly AccionUi[] {
  return [
    inicio(LEER, caso),
    evento({
      tipo: TIPO_EVENTO.FIN_HERRAMIENTA,
      turnoId: TURNO,
      llamadaId: `call_${secuencia}`,
      herramienta: LEER,
      caso,
      ok: false,
      codigo,
      resumen: null,
      resultado: null,
    }),
  ];
}

function listado(caso: string | null): readonly AccionUi[] {
  return lecturaRefutada(caso, CODIGO_ERROR.CASO_NO_ENCONTRADO);
}

function llamada(herramienta: string, caso: string, ok = true): readonly AccionUi[] {
  return [inicio(herramienta, caso), fin(herramienta, caso, ok)];
}

function confirmacion(caso: string): AccionUi {
  return evento({
    tipo: TIPO_EVENTO.CONFIRMACION_REQUERIDA,
    turnoId: TURNO,
    caso,
    accion: ACCION.ENVIO,
    bloqueos: [],
    bloqueosLegibles: [BLOQUEO],
  });
}

function texto(contenido: string): AccionUi {
  return evento({ tipo: TIPO_EVENTO.TEXTO, turnoId: TURNO, texto: contenido });
}

const finDeTurno = evento({
  tipo: TIPO_EVENTO.FIN_TURNO,
  turnoId: TURNO,
  motivo: MOTIVO_FIN.FINAL,
  needsConfirmation: false,
});

const corte: AccionUi = { tipo: ACCION_UI.FIN_STREAM };

function flujoHastaPaquete(caso: string): readonly AccionUi[] {
  return [
    ...llamada(LEER, caso),
    ...llamada(MAPEAR, caso),
    ...llamada(GENERAR, caso),
    ...llamada(ARMAR, caso),
  ];
}

function aplicar(acciones: readonly AccionUi[]): EstadoConversacion {
  return acciones.reduce(reducirConversacion, estadoInicialConversacion);
}

function progreso(acciones: readonly AccionUi[]): readonly ProgresoDeCaso[] {
  return progresoPorCaso(aplicar(acciones));
}

function estadosDe(acciones: readonly AccionUi[], caso: string): readonly EstadoEtapa[] {
  const delCaso = progreso(acciones).find((elemento) => elemento.caso === caso);
  return delCaso === undefined ? [] : delCaso.etapas.map((etapa) => etapa.estado);
}

const { PENDIENTE, EN_CURSO, HECHA, ERROR, ESPERANDO, CANCELADA } = ESTADO_ETAPA;

function cancelar(caso: string): readonly AccionUi[] {
  return [
    {
      tipo: ACCION_UI.ENVIAR,
      mensaje: `Cancela el envío de ${caso}`,
      accion: { tipo: TIPO_ACCION.CANCELAR, caso },
    },
    evento({
      tipo: TIPO_EVENTO.INICIO_TURNO,
      sesionId: SESION,
      turnoId: TURNO,
      sesionNueva: false,
      sesionExpirada: false,
    }),
  ];
}

describe("las seis etapas del progreso por caso (UI-08)", () => {
  test("el orden de las etapas sigue el flujo de las herramientas y deja la confirmación antes del envío", () => {
    expect(ORDEN_ETAPAS).toEqual([
      ETAPA.LEIDO,
      ETAPA.MAPEADO,
      ETAPA.GENERADO,
      ETAPA.PAQUETE,
      ETAPA.CONFIRMACION,
      ETAPA.ENVIO,
    ]);
    expect(ORDEN_FLUJO_HERRAMIENTAS.map((herramienta) => ETAPA_DE_HERRAMIENTA[herramienta])).toEqual(
      ORDEN_ETAPAS.filter((etapa) => etapa !== ETAPA.CONFIRMACION),
    );
  });

  test("sin herramientas no hay casos en el panel", () => {
    expect(progreso([])).toEqual([]);
    expect(progreso([...turno("hola"), texto("Hola, ¿qué caso procesamos?"), finDeTurno])).toEqual([]);
  });

  test("tool_end ok de leer, mapear, generar y armar marca hechas las etapas 1 a 4 en orden", () => {
    const acciones = [...turno(`procesa ${EC}`), ...flujoHastaPaquete(EC), finDeTurno];
    expect(progreso(acciones)).toEqual([
      {
        caso: EC,
        etapas: [
          { etapa: ETAPA.LEIDO, estado: HECHA },
          { etapa: ETAPA.MAPEADO, estado: HECHA },
          { etapa: ETAPA.GENERADO, estado: HECHA },
          { etapa: ETAPA.PAQUETE, estado: HECHA },
          { etapa: ETAPA.CONFIRMACION, estado: PENDIENTE },
          { etapa: ETAPA.ENVIO, estado: PENDIENTE },
        ],
      },
    ]);
  });

  test("confirmation_required del caso deja la etapa 5 esperando", () => {
    const acciones = [...turno(`procesa ${EC}`), ...flujoHastaPaquete(EC), confirmacion(EC), finDeTurno];
    expect(estadosDe(acciones, EC)).toEqual([HECHA, HECHA, HECHA, HECHA, ESPERANDO, PENDIENTE]);
  });

  test("tool_end ok de simular_envio marca hecha la etapa 6 y cierra la confirmación", () => {
    const acciones = [
      ...turno(`procesa ${EC}`),
      ...flujoHastaPaquete(EC),
      confirmacion(EC),
      finDeTurno,
      ...turno(`Sí, envía ${EC}`),
      ...llamada(ENVIAR, EC),
      finDeTurno,
    ];
    expect(estadosDe(acciones, EC)).toEqual([HECHA, HECHA, HECHA, HECHA, HECHA, HECHA]);
  });

  test("un tool_end con ok false deja su etapa en error y las siguientes pendientes", () => {
    const acciones = [
      ...turno(`procesa ${EC}`),
      ...llamada(LEER, EC),
      ...llamada(MAPEAR, EC),
      ...llamada(GENERAR, EC, false),
      corte,
    ];
    expect(estadosDe(acciones, EC)).toEqual([HECHA, HECHA, ERROR, PENDIENTE, PENDIENTE, PENDIENTE]);
  });

  test("un simular_envio con ok false deja la etapa 6 en error y la 5 sigue esperando", () => {
    const acciones = [
      ...turno(`procesa ${EC}`),
      ...flujoHastaPaquete(EC),
      confirmacion(EC),
      finDeTurno,
      ...turno(`Sí, envía ${EC}`),
      ...llamada(ENVIAR, EC, false),
      confirmacion(EC),
      finDeTurno,
    ];
    expect(estadosDe(acciones, EC)).toEqual([HECHA, HECHA, HECHA, HECHA, ESPERANDO, ERROR]);
  });

  test("un armar_paquete nuevo con ok reinicia las etapas 5 y 6 a pendiente (D-63.4)", () => {
    const acciones = [
      ...turno(`procesa ${EC}`),
      ...flujoHastaPaquete(EC),
      confirmacion(EC),
      finDeTurno,
      ...turno(`Sí, envía ${EC}`),
      ...llamada(ENVIAR, EC),
      finDeTurno,
      ...turno(`arma de nuevo el paquete de ${EC}`),
      ...llamada(ARMAR, EC),
      finDeTurno,
    ];
    expect(estadosDe(acciones, EC)).toEqual([HECHA, HECHA, HECHA, HECHA, PENDIENTE, PENDIENTE]);
  });

  test("dentro de un mismo turno, la confirmación que llega después del paquete nuevo vuelve a esperar", () => {
    const acciones = [
      ...turno(`procesa ${EC}`),
      ...flujoHastaPaquete(EC),
      confirmacion(EC),
      ...llamada(ARMAR, EC),
      confirmacion(EC),
      finDeTurno,
    ];
    expect(estadosDe(acciones, EC)).toEqual([HECHA, HECHA, HECHA, HECHA, ESPERANDO, PENDIENTE]);
  });

  test("un armar_paquete con ok false no reinicia la confirmación pendiente", () => {
    const acciones = [
      ...turno(`procesa ${EC}`),
      ...flujoHastaPaquete(EC),
      confirmacion(EC),
      ...llamada(ARMAR, EC, false),
      finDeTurno,
    ];
    expect(estadosDe(acciones, EC)).toEqual([HECHA, HECHA, HECHA, ERROR, ESPERANDO, PENDIENTE]);
  });

  test("un tool_start sin tool_end deja su etapa en curso mientras corre el turno", () => {
    const acciones = [...turno(`procesa ${EC}`), ...llamada(LEER, EC), inicio(MAPEAR, EC)];
    expect(estadosDe(acciones, EC)).toEqual([HECHA, EN_CURSO, PENDIENTE, PENDIENTE, PENDIENTE, PENDIENTE]);
  });

  test("un turno cortado deja hechas solo las etapas con tool_end ok, sin etapas en curso", () => {
    const acciones = [...turno(`procesa ${EC}`), ...llamada(LEER, EC), inicio(MAPEAR, EC), corte];
    expect(estadosDe(acciones, EC)).toEqual([HECHA, PENDIENTE, PENDIENTE, PENDIENTE, PENDIENTE, PENDIENTE]);
  });

  test("el texto del agente nunca marca una etapa (T-03-42)", () => {
    const acciones = [
      ...turno(`procesa ${EC}`),
      ...llamada(LEER, EC),
      texto(`Listo: ${EC} leído, mapeado, generado, paquete armado y envío registrado.`),
      finDeTurno,
    ];
    expect(estadosDe(acciones, EC)).toEqual([HECHA, PENDIENTE, PENDIENTE, PENDIENTE, PENDIENTE, PENDIENTE]);
  });
});

describe("el listado de casos no agrega bloques al panel ni pide archivos (G-03-17)", () => {
  const pregunta = turno(PREGUNTA_LISTADO);

  test("con la forma real del cable (caso vacío, CASO_NO_ENCONTRADO), en vivo y al cerrar el turno", () => {
    const eventos = listado("");
    expect(progreso([...pregunta, ...eventos.slice(0, 1)])).toEqual([]);
    const enVivo = aplicar([...pregunta, ...eventos]);
    expect(progresoPorCaso(enVivo)).toEqual([]);
    const cerrado = reducirConversacion(enVivo, finDeTurno);
    expect(progresoPorCaso(cerrado)).toEqual([]);
    expect(marcasDeArchivos(cerrado).size).toBe(0);
  });

  test("con caso null, como lo publica el servidor nuevo", () => {
    const cerrado = aplicar([...pregunta, ...listado(null), finDeTurno]);
    expect(progresoPorCaso(cerrado)).toEqual([]);
    expect(marcasDeArchivos(cerrado).size).toBe(0);
  });

  test("tras el listado, el caso real que se procesa es el único bloque y la única marca", () => {
    const cerrado = aplicar([
      ...pregunta,
      ...listado(""),
      finDeTurno,
      ...turno(`procesa ${EC}`),
      ...llamada(LEER, EC),
      finDeTurno,
    ]);
    expect(progresoPorCaso(cerrado).map((elemento) => elemento.caso)).toEqual([EC]);
    expect([...marcasDeArchivos(cerrado)]).toEqual([[EC, 1]]);
  });
});

const CONFIG: ConfigResponse = {
  fechaEjecucion: "2026-09-15",
  zona: "America/Bogota",
  casos: CASOS_FIXTURE,
  presupuestoSesion: 200_000,
  mensajeMaximo: 2_000,
};

const conConfig: AccionUi = { tipo: ACCION_UI.CONFIG_RECIBIDA, config: CONFIG };

describe("un caso desconocido o refutado no entra al panel ni a las marcas (G-03-17, T-03-46)", () => {
  test("con config, un caso que no está en /api/config no crea bloque a mitad del turno ni al cerrarlo", () => {
    expect(progreso([conConfig, ...turno(`procesa ${PE}`), inicio(LEER, PE)])).toEqual([]);
    const cerrado = aplicar([conConfig, ...turno(`procesa ${PE}`), ...lecturaRefutada(PE), finDeTurno]);
    expect(progresoPorCaso(cerrado)).toEqual([]);
    expect(marcasDeArchivos(cerrado).size).toBe(0);
  });

  test("con config, un caso conocido sigue entrando al panel y a las marcas", () => {
    const cerrado = aplicar([conConfig, ...turno(`procesa ${EC}`), ...llamada(LEER, EC), finDeTurno]);
    expect(progresoPorCaso(cerrado).map((elemento) => elemento.caso)).toEqual([EC]);
    expect([...marcasDeArchivos(cerrado)]).toEqual([[EC, 1]]);
  });

  test("sin config, el bloque no queda tras el tool_end refutado con CASO_NO_ENCONTRADO o CASO_INVALIDO", () => {
    for (const codigo of [CODIGO_ERROR.CASO_NO_ENCONTRADO, CODIGO_ERROR.CASO_INVALIDO]) {
      const cerrado = aplicar([...turno(`procesa ${PE}`), ...lecturaRefutada(PE, codigo), finDeTurno]);
      expect(progresoPorCaso(cerrado)).toEqual([]);
      expect(marcasDeArchivos(cerrado).size).toBe(0);
    }
  });

  test("sin config, un caso real con otro fallo sigue en el panel con su etapa en error", () => {
    const acciones = [...turno(`procesa ${EC}`), ...llamada(LEER, EC, false), finDeTurno];
    expect(estadosDe(acciones, EC)).toEqual([ERROR, PENDIENTE, PENDIENTE, PENDIENTE, PENDIENTE, PENDIENTE]);
    expect([...marcasDeArchivos(aplicar(acciones))]).toEqual([[EC, 1]]);
  });
});

function herramientaVista(llamadaId: string, caso: string | null, ok: boolean): HerramientaVistaUi {
  return {
    llamadaId,
    herramienta: LEER,
    caso,
    argumentos: { caso: caso ?? "" },
    ok,
    codigo: ok ? null : CODIGO_ERROR.CASO_NO_ENCONTRADO,
    resumen: null,
    resultado: null,
  };
}

const VISTA_CON_LISTADO: VistaSesionUi = {
  sesionId: SESION,
  turnos: [
    {
      mensaje: PREGUNTA_LISTADO,
      herramientas: [herramientaVista("call_viejo", "", false), herramientaVista("call_nuevo", null, false)],
      texto: `Casos disponibles: ${CASOS_FIXTURE.join(", ")}.`,
    },
    {
      mensaje: `procesa ${EC}`,
      herramientas: [herramientaVista("call_ec", EC, true)],
      texto: `Leí ${EC}.`,
    },
  ],
  pendientes: [],
  casosEnviados: [],
  tokensUsados: 0,
  ocupada: false,
};

describe("al recargar, el listado tampoco agrega bloques ni marcas (G-03-17)", () => {
  test("con el caso vacío de un servidor anterior o con caso null, solo queda el caso real", () => {
    const recargado = { ...estadoDesdeVista(VISTA_CON_LISTADO), enCurso: false };
    expect(progresoPorCaso(recargado).map((elemento) => elemento.caso)).toEqual([EC]);
    expect([...marcasDeArchivos(recargado)]).toEqual([[EC, 1]]);
  });

  test("con config cargada el resultado es el mismo", () => {
    const recargado = { ...estadoDesdeVista(VISTA_CON_LISTADO), enCurso: false, config: CONFIG };
    expect(progresoPorCaso(recargado).map((elemento) => elemento.caso)).toEqual([EC]);
    expect([...marcasDeArchivos(recargado)]).toEqual([[EC, 1]]);
  });
});

describe("el indicador y la región viva con el listado en curso (G-03-17)", () => {
  test("dicen Leyendo la solicitud… y Ejecutando Leer solicitud, sin separador ni preposición colgando", () => {
    const enCurso = aplicar([...turno(PREGUNTA_LISTADO), inicio(LEER, "")]);
    expect(etiquetaPensando(enCurso)).toBe(TEXTO_CHAT.pensandoEn(TEXTO_HERRAMIENTA.gerundio(LEER), null));
    expect(etiquetaPensando(enCurso)).toBe("Leyendo la solicitud…");
    expect(anuncioDeEstado(enCurso)).toBe("Ejecutando Leer solicitud");
  });

  test("un caso desconocido con patrón válido se sigue nombrando mientras corre", () => {
    const enCurso = aplicar([conConfig, ...turno(`procesa ${PE}`), inicio(LEER, PE)]);
    expect(etiquetaPensando(enCurso)).toBe(`Leyendo la solicitud · ${PE}…`);
    expect(anuncioDeEstado(enCurso)).toBe(`Ejecutando Leer solicitud de ${PE}`);
  });
});

describe("la etapa 5 sigue a la tarjeta de confirmación (D-69)", () => {
  const dosPendientes = [
    ...turno("procesa los casos"),
    ...flujoHastaPaquete(EC),
    ...flujoHastaPaquete(CO),
    confirmacion(EC),
    confirmacion(CO),
    finDeTurno,
  ];

  test("mientras la tarjeta está abierta la etapa 5 espera", () => {
    expect(estadosDe(dosPendientes, EC)).toEqual([HECHA, HECHA, HECHA, HECHA, ESPERANDO, PENDIENTE]);
    expect(estadosDe(dosPendientes, CO)).toEqual([HECHA, HECHA, HECHA, HECHA, ESPERANDO, PENDIENTE]);
  });

  test("Cancelar en co deja su etapa 5 cancelada y la de ec sigue esperando", () => {
    const acciones = [...dosPendientes, ...cancelar(CO), confirmacion(EC), finDeTurno];
    expect(estadosDe(acciones, CO)).toEqual([HECHA, HECHA, HECHA, HECHA, CANCELADA, PENDIENTE]);
    expect(estadosDe(acciones, EC)).toEqual([HECHA, HECHA, HECHA, HECHA, ESPERANDO, PENDIENTE]);
  });

  test("la cancelación solo se marca al cerrar el turno, nunca por el clic", () => {
    const enCurso = [...dosPendientes, ...cancelar(CO)];
    expect(estadosDe(enCurso, CO)).toEqual([HECHA, HECHA, HECHA, HECHA, ESPERANDO, PENDIENTE]);
  });

  test("la etapa 5 queda hecha cuando la tarjeta registra el envío", () => {
    const acciones = [
      ...dosPendientes,
      ...turno(`Sí, envía ${EC}`),
      ...llamada(ENVIAR, EC),
      confirmacion(CO),
      finDeTurno,
    ];
    expect(estadosDe(acciones, EC)).toEqual([HECHA, HECHA, HECHA, HECHA, HECHA, HECHA]);
    expect(estadosDe(acciones, CO)).toEqual([HECHA, HECHA, HECHA, HECHA, ESPERANDO, PENDIENTE]);
  });

  test("un paquete nuevo después de cancelar reinicia las etapas 5 y 6 y vuelve a esperar", () => {
    const acciones = [
      ...dosPendientes,
      ...cancelar(CO),
      confirmacion(EC),
      finDeTurno,
      ...turno(`arma de nuevo el paquete de ${CO}`),
      ...llamada(ARMAR, CO),
      confirmacion(EC),
      confirmacion(CO),
      finDeTurno,
    ];
    expect(estadosDe(acciones, CO)).toEqual([HECHA, HECHA, HECHA, HECHA, ESPERANDO, PENDIENTE]);
  });

  test("la cancelación cuenta como actividad del caso en el panel", () => {
    const acciones = [...dosPendientes, ...cancelar(EC), confirmacion(CO), finDeTurno];
    expect(progreso(acciones).map((elemento) => elemento.caso)).toEqual([EC, CO]);
  });
});

describe("orden de los casos en el panel", () => {
  test("el caso con actividad más reciente va primero y el resto sigue el orden de primera aparición", () => {
    const acciones = [
      ...turno("procesa los casos"),
      ...llamada(LEER, EC),
      ...llamada(LEER, CO),
      ...llamada(LEER, PE),
      finDeTurno,
    ];
    expect(progreso(acciones).map((elemento) => elemento.caso)).toEqual([PE, EC, CO]);
    const conActividadNueva = [...acciones, ...turno(`mapea ${EC}`), ...llamada(MAPEAR, EC), finDeTurno];
    expect(progreso(conActividadNueva).map((elemento) => elemento.caso)).toEqual([EC, CO, PE]);
  });

  test("una confirmación también cuenta como actividad del caso", () => {
    const acciones = [
      ...turno("procesa los casos"),
      ...flujoHastaPaquete(EC),
      ...llamada(LEER, CO),
      confirmacion(EC),
      finDeTurno,
    ];
    expect(progreso(acciones).map((elemento) => elemento.caso)).toEqual([EC, CO]);
  });

  test("la confirmación que el servidor repite al cerrar cada turno no mueve un caso que ya esperaba", () => {
    const acciones = [
      ...turno(`procesa ${EC}`),
      ...flujoHastaPaquete(EC),
      confirmacion(EC),
      finDeTurno,
      ...turno(`procesa ${CO}`),
      ...llamada(LEER, CO),
      confirmacion(EC),
      finDeTurno,
    ];
    expect(progreso(acciones).map((elemento) => elemento.caso)).toEqual([CO, EC]);
    expect(estadosDe(acciones, EC)).toEqual([HECHA, HECHA, HECHA, HECHA, ESPERANDO, PENDIENTE]);
  });
});

describe("firma del progreso para el punto de cambios sin ver", () => {
  test("cambia cuando cambia una etapa y no cambia con el texto del agente", () => {
    const antes = [...turno(`procesa ${EC}`), ...llamada(LEER, EC)];
    const firmaAntes = firmaDelProgreso(progreso(antes));
    expect(firmaDelProgreso(progreso([...antes, texto("Seguimos.")]))).toBe(firmaAntes);
    expect(firmaDelProgreso(progreso([...antes, ...llamada(MAPEAR, EC)]))).not.toBe(firmaAntes);
    expect(firmaDelProgreso([])).toBe(firmaDelProgreso(progreso([])));
  });
});

describe("textos del progreso y del panel", () => {
  test("cada etapa lleva un aria-label completo con su estado", () => {
    expect(TEXTO_PROGRESO.aria(ETAPA.MAPEADO, HECHA)).toBe("Mapeado: hecho");
    expect(TEXTO_PROGRESO.aria(ETAPA.LEIDO, PENDIENTE)).toBe("Leído: pendiente");
    expect(TEXTO_PROGRESO.aria(ETAPA.GENERADO, EN_CURSO)).toBe("Generado: en curso");
    expect(TEXTO_PROGRESO.aria(ETAPA.PAQUETE, ERROR)).toBe("Paquete: con error");
    expect(TEXTO_PROGRESO.aria(ETAPA.CONFIRMACION, ESPERANDO)).toBe("Confirmación: esperando confirmación");
    expect(TEXTO_PROGRESO.aria(ETAPA.ENVIO, ESTADO_ETAPA.CANCELADA)).toBe("Envío: cancelado");
  });

  test("el panel vacío y el pie usan la copia del contrato", () => {
    expect(TEXTO_PANEL.titulo).toBe("Casos de esta sesión");
    expect(TEXTO_PANEL.vacio).toBe(
      "Todavía no se procesó ningún caso. Aquí verás el avance de cada caso y sus archivos.",
    );
    expect(TEXTO_PANEL.pie).toBe(
      "Los archivos viven en el disco temporal del servidor y se borran si se reinicia.",
    );
  });
});
