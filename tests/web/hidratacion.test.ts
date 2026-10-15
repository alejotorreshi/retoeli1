import { describe, expect, test } from "bun:test";
import {
  ACCION_UI,
  AVISO_SESION,
  ESTADO_ACCESO,
  ESTADO_ETAPA,
  ESTADO_HERRAMIENTA,
  ESTADO_TARJETA_CONFIRMACION,
  ETAPA,
  RESULTADO_API,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_CONFIRMACION, TEXTO_ERROR } from "@web/config/strings.ts";
import { progresoPorCaso, resultadosPorCaso } from "@web/state/casos.ts";
import { tarjetasDelTurno } from "@web/state/confirmaciones.ts";
import {
  estadoAlCargar,
  estadoInicialConversacion,
  reducirConversacion,
  sesionDelEvento,
} from "@web/state/conversacion.ts";
import { accionDeSesion, estadoDesdeVista, olvidaLaSesion } from "@web/state/hidratacion.ts";
import type {
  AccionUi,
  EstadoConversacion,
  EstadoHidratado,
  ResultadoVisibleUi,
  TurnoConversacion,
  VistaSesionUi,
} from "@web/types/chat.type.ts";
import { ACCION, MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { TIPO_ACCION } from "@/config/constants/confirmation.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { FORMATO } from "@/config/constants/forms.constants.ts";
import { RESPUESTA_HTTP } from "@/config/constants/http.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import type { SseEvent } from "@/http/types/api.type.ts";

type LlamadaGuion = {
  readonly herramienta: (typeof HERRAMIENTA)[keyof typeof HERRAMIENTA];
  readonly caso: string;
  readonly ok: boolean;
  readonly resultado: ResultadoVisibleUi | null;
};

type TurnoGuion = {
  readonly mensaje: string;
  readonly llamadas: readonly LlamadaGuion[];
  readonly texto: string;
  readonly pendientes: readonly string[];
};

const SESION = "sesion-de-hidratacion";
const TURNO = "turno-hidratacion";
const EC = "ec-corp-andina";
const HN = "hn-agroexport-sula";
const VENCIDO = "Certificado bancario vencido";
const SIN_FIRMA = "Falta la firma del representante legal";
const BLOQUEOS: Readonly<Record<string, readonly string[]>> = { [EC]: [VENCIDO], [HN]: [SIN_FIRMA] };
const EXPIRADA = "La sesión anterior expiró; empezamos de cero.";
const { ABIERTA, REGISTRADA, CANCELADA } = ESTADO_TARJETA_CONFIRMACION;

function resultado(herramienta: LlamadaGuion["herramienta"], caso: string): ResultadoVisibleUi {
  const vacio: ResultadoVisibleUi = {
    herramienta,
    pais: null,
    formato: null,
    conteo: null,
    listoParaFirma: null,
    bloqueosLegibles: null,
    ruta: null,
    aviso: null,
  };
  switch (herramienta) {
    case HERRAMIENTA.LEER_SOLICITUD:
      return { ...vacio, pais: caso.slice(0, 2).toUpperCase(), formato: FORMATO.XLSX };
    case HERRAMIENTA.MAPEAR_CAMPOS:
      return { ...vacio, conteo: { lleno: 12, faltante: 2, requiere_confirmacion: 1 } };
    case HERRAMIENTA.GENERAR_FORMULARIO:
      return { ...vacio, formato: FORMATO.XLSX, ruta: `out/${caso}/formulario.xlsx` };
    case HERRAMIENTA.ARMAR_PAQUETE:
      return {
        ...vacio,
        listoParaFirma: false,
        bloqueosLegibles: BLOQUEOS[caso] ?? [],
        ruta: `out/${caso}/paquete/checklist.md`,
      };
    default:
      return { ...vacio, ruta: `out/${caso}/envio_simulado.json` };
  }
}

function correcta(herramienta: LlamadaGuion["herramienta"], caso: string): LlamadaGuion {
  return { herramienta, caso, ok: true, resultado: resultado(herramienta, caso) };
}

function procesar(caso: string): readonly LlamadaGuion[] {
  return [
    correcta(HERRAMIENTA.LEER_SOLICITUD, caso),
    correcta(HERRAMIENTA.MAPEAR_CAMPOS, caso),
    correcta(HERRAMIENTA.GENERAR_FORMULARIO, caso),
    correcta(HERRAMIENTA.ARMAR_PAQUETE, caso),
  ];
}

function evento(eventoDelServidor: SseEvent): AccionUi {
  return { tipo: ACCION_UI.EVENTO, evento: eventoDelServidor };
}

function llamadaId(turno: number, indice: number): string {
  return `call_${turno}_${indice}`;
}

function accionesEnVivo(turno: TurnoGuion, clave: number): readonly AccionUi[] {
  return [
    { tipo: ACCION_UI.ENVIAR, mensaje: turno.mensaje },
    evento({
      tipo: TIPO_EVENTO.INICIO_TURNO,
      sesionId: SESION,
      turnoId: TURNO,
      sesionNueva: clave === 0,
      sesionExpirada: false,
    }),
    ...turno.llamadas.flatMap((llamada, indice) => [
      evento({
        tipo: TIPO_EVENTO.INICIO_HERRAMIENTA,
        turnoId: TURNO,
        llamadaId: llamadaId(clave, indice),
        herramienta: NOMBRE_VISIBLE[llamada.herramienta],
        caso: llamada.caso,
        argumentos: { caso: llamada.caso },
      }),
      evento({
        tipo: TIPO_EVENTO.FIN_HERRAMIENTA,
        turnoId: TURNO,
        llamadaId: llamadaId(clave, indice),
        herramienta: NOMBRE_VISIBLE[llamada.herramienta],
        caso: llamada.caso,
        ok: llamada.ok,
        codigo: llamada.ok ? null : CODIGO_ERROR.CONFIRMACION_REQUERIDA,
        resumen: null,
        resultado: llamada.resultado,
      }),
    ]),
    evento({ tipo: TIPO_EVENTO.TEXTO, turnoId: TURNO, texto: turno.texto }),
    ...turno.pendientes.map((caso) =>
      evento({
        tipo: TIPO_EVENTO.CONFIRMACION_REQUERIDA,
        turnoId: TURNO,
        caso,
        accion: ACCION.ENVIO,
        bloqueos: [],
        bloqueosLegibles: BLOQUEOS[caso] ?? [],
      }),
    ),
    evento({
      tipo: TIPO_EVENTO.FIN_TURNO,
      turnoId: TURNO,
      motivo: MOTIVO_FIN.FINAL,
      needsConfirmation: turno.pendientes.length > 0,
    }),
  ];
}

function enVivo(guion: readonly TurnoGuion[]): EstadoConversacion {
  return guion
    .flatMap((turno, clave) => accionesEnVivo(turno, clave))
    .reduce(reducirConversacion, estadoInicialConversacion);
}

function vistaDe(guion: readonly TurnoGuion[], casosEnviados: readonly string[] = []): VistaSesionUi {
  return {
    sesionId: SESION,
    turnos: guion.map((turno, clave) => ({
      mensaje: turno.mensaje,
      herramientas: turno.llamadas.map((llamada, indice) => ({
        llamadaId: llamadaId(clave, indice),
        herramienta: NOMBRE_VISIBLE[llamada.herramienta],
        caso: llamada.caso,
        argumentos: { caso: llamada.caso },
        ok: llamada.ok,
        codigo: llamada.ok ? null : CODIGO_ERROR.CONFIRMACION_REQUERIDA,
        resumen: null,
        resultado: llamada.resultado,
      })),
      texto: turno.texto,
    })),
    pendientes: (guion.at(-1)?.pendientes ?? []).map((caso) => ({
      caso,
      bloqueos: [],
      bloqueosLegibles: BLOQUEOS[caso] ?? [],
    })),
    casosEnviados,
    tokensUsados: 4_200,
    ocupada: false,
  };
}

function sinConteoDeEventos(turnos: readonly TurnoConversacion[]): readonly TurnoConversacion[] {
  return turnos.map((turno) => ({ ...turno, eventos: 0 }));
}

function hidratado(vista: VistaSesionUi): EstadoConversacion {
  return reducirConversacion(estadoAlCargar(vista.sesionId), {
    tipo: ACCION_UI.HIDRATAR,
    hidratado: estadoDesdeVista(vista),
  });
}

function esperarIgualAlVivo(guion: readonly TurnoGuion[], recargado: EstadoHidratado): void {
  const vivo = enVivo(guion);
  expect(recargado.sesionId).toBe(SESION);
  expect(sinConteoDeEventos(recargado.turnos)).toEqual(sinConteoDeEventos(vivo.turnos));
  expect(recargado.tarjetasConfirmacion).toEqual(vivo.tarjetasConfirmacion);
  expect(resultadosPorCaso(recargado.turnos)).toEqual(resultadosPorCaso(vivo.turnos));
  expect(progresoPorCaso({ ...recargado, enCurso: false })).toEqual(progresoPorCaso(vivo));
}

const DEMO: readonly TurnoGuion[] = [
  {
    mensaje: `Procesa el caso "${EC}". No envíes nada todavía.`,
    llamadas: procesar(EC),
    texto: `El caso ${EC} quedó con 2 faltantes. ¿Confirmas el envío simulado de ${EC}?`,
    pendientes: [EC],
  },
];

const DOS_CASOS_Y_UN_ENVIO: readonly TurnoGuion[] = [
  {
    mensaje: `Procesa estos casos: ${EC}, ${HN}. No envíes nada todavía.`,
    llamadas: [...procesar(EC), ...procesar(HN)],
    texto: "Los dos paquetes quedaron armados.",
    pendientes: [EC, HN],
  },
  {
    mensaje: TEXTO_CONFIRMACION.mensaje({ tipo: TIPO_ACCION.CONFIRMAR, caso: EC }),
    llamadas: [correcta(HERRAMIENTA.SIMULAR_ENVIO, EC)],
    texto: `Registré el envío simulado de ${EC}.`,
    pendientes: [HN],
  },
];

describe("estadoDesdeVista: la recarga repinta lo que construyó el stream (UI-08, D-69)", () => {
  test("el turno del §11 vuelve con sus cuatro tarjetas de herramienta, Correctas, y el texto del agente", () => {
    const { turnos } = estadoDesdeVista(vistaDe(DEMO));
    expect(turnos).toHaveLength(1);
    expect(turnos[0]?.mensaje).toBe(DEMO[0]?.mensaje);
    expect(turnos[0]?.llamadas.map((llamada) => [llamada.herramienta, llamada.caso, llamada.estado])).toEqual(
      procesar(EC).map((llamada) => [NOMBRE_VISIBLE[llamada.herramienta], EC, ESTADO_HERRAMIENTA.CORRECTA]),
    );
    expect(turnos[0]?.textos.map((texto) => texto.texto)).toEqual([DEMO[0]?.texto ?? ""]);
  });

  test("la tarjeta de confirmación del caso pendiente vuelve abierta, con botones y sus bloqueos", () => {
    const { tarjetasConfirmacion } = estadoDesdeVista(vistaDe(DEMO));
    expect(tarjetasDelTurno(tarjetasConfirmacion, 0)).toEqual([
      {
        clave: 0,
        caso: EC,
        turno: 0,
        bloqueosLegibles: [VENCIDO],
        estado: ABIERTA,
        resueltaEnTurno: null,
        enviando: null,
      },
    ]);
  });

  test("la tarjeta de resultado vuelve con sus contadores, el formato, el país y la carpeta", () => {
    const { turnos } = estadoDesdeVista(vistaDe(DEMO));
    expect(resultadosPorCaso(turnos)).toEqual([
      {
        caso: EC,
        pais: "EC",
        formato: FORMATO.XLSX,
        conteo: { lleno: 12, faltante: 2, requiere_confirmacion: 1 },
        listoParaFirma: false,
        bloqueosLegibles: [VENCIDO],
        carpeta: `out/${EC}/`,
        aviso: null,
      },
    ]);
  });

  test("el progreso del caso vuelve con cuatro etapas hechas y la confirmación esperando", () => {
    const recargado = estadoDesdeVista(vistaDe(DEMO));
    const etapas = progresoPorCaso({ ...recargado, enCurso: false })[0]?.etapas ?? [];
    expect(etapas.map(({ etapa, estado }) => [etapa, estado])).toEqual([
      [ETAPA.LEIDO, ESTADO_ETAPA.HECHA],
      [ETAPA.MAPEADO, ESTADO_ETAPA.HECHA],
      [ETAPA.GENERADO, ESTADO_ETAPA.HECHA],
      [ETAPA.PAQUETE, ESTADO_ETAPA.HECHA],
      [ETAPA.CONFIRMACION, ESTADO_ETAPA.ESPERANDO],
      [ETAPA.ENVIO, ESTADO_ETAPA.PENDIENTE],
    ]);
  });

  test("el §11 recargado es igual a lo que pintó el stream en vivo", () => {
    esperarIgualAlVivo(DEMO, estadoDesdeVista(vistaDe(DEMO)));
  });

  test("dos casos y un envío: las tarjetas, los resultados y el panel recargados son iguales a los del vivo", () => {
    esperarIgualAlVivo(DOS_CASOS_Y_UN_ENVIO, estadoDesdeVista(vistaDe(DOS_CASOS_Y_UN_ENVIO, [EC])));
  });

  test("una llamada guardada sin respuesta vuelve como Error y no inventa un resultado", () => {
    const vista = vistaDe(DEMO);
    const sinRespuesta: VistaSesionUi = {
      ...vista,
      turnos: vista.turnos.map((turno) => ({
        ...turno,
        herramientas: turno.herramientas.map((herramienta) => ({
          ...herramienta,
          ok: false,
          codigo: null,
          resultado: null,
        })),
      })),
    };
    const llamadas = estadoDesdeVista(sinRespuesta).turnos[0]?.llamadas ?? [];
    expect(llamadas.every((llamada) => llamada.estado === ESTADO_HERRAMIENTA.ERROR)).toBe(true);
    expect(llamadas.every((llamada) => llamada.resultado === null && llamada.codigo === null)).toBe(true);
  });

  test("un turno cancelado con la tarjeta deja la tarjeta como Envío cancelado en ese turno", () => {
    const guion: readonly TurnoGuion[] = [
      ...DOS_CASOS_Y_UN_ENVIO.slice(0, 1),
      {
        mensaje: TEXTO_CONFIRMACION.mensaje({ tipo: TIPO_ACCION.CANCELAR, caso: HN }),
        llamadas: [],
        texto: `Cancelé el envío de ${HN}.`,
        pendientes: [EC],
      },
      { mensaje: "¿Qué casos hay?", llamadas: [], texto: "Hay cinco casos.", pendientes: [EC] },
    ];
    const recargado = estadoDesdeVista(vistaDe(guion));
    const hn = recargado.tarjetasConfirmacion.find((tarjeta) => tarjeta.caso === HN);
    expect(hn?.estado).toBe(CANCELADA);
    expect(hn?.resueltaEnTurno).toBe(1);
    esperarIgualAlVivo(guion, recargado);
  });
});

describe("HIDRATAR y la carga inicial", () => {
  test("sin id guardado la app arranca vacía y sin cargar", () => {
    expect(estadoAlCargar(null)).toBe(estadoInicialConversacion);
  });

  test("con id guardado la app arranca cargando la conversación de ese id", () => {
    expect(estadoAlCargar(SESION)).toEqual({
      ...estadoInicialConversacion,
      sesionId: SESION,
      hidratando: true,
    });
  });

  test("HIDRATAR reemplaza la conversación, termina la carga y conserva acceso, config y borrador", () => {
    const antes: EstadoConversacion = {
      ...estadoAlCargar(SESION),
      acceso: { tipo: ESTADO_ACCESO.CONCEDIDO },
      borrador: "hola",
    };
    const despues = reducirConversacion(
      antes,
      accionDeSesion({ tipo: RESULTADO_API.OK, valor: vistaDe(DEMO) }),
    );
    expect(despues.hidratando).toBe(false);
    expect(despues.turnos).toHaveLength(1);
    expect(despues.acceso).toEqual({ tipo: ESTADO_ACCESO.CONCEDIDO });
    expect(despues.borrador).toBe("hola");
    expect(hidratado(vistaDe(DEMO)).turnos).toEqual(despues.turnos);
  });

  test("un 401 al cargar pide el acceso y deja la carga pendiente para después de entrar", () => {
    const despues = reducirConversacion(
      estadoAlCargar(SESION),
      accionDeSesion({ tipo: RESULTADO_API.ACCESO_VENCIDO, mensaje: "Tu acceso venció." }),
    );
    expect(despues.acceso).toEqual({ tipo: ESTADO_ACCESO.PEDIDO, aviso: "Tu acceso venció." });
    expect(despues.hidratando).toBe(true);
    expect(despues.sesionId).toBe(SESION);
  });

  test("sin red la carga termina con un aviso de error y conserva el id para seguir en la misma sesión", () => {
    const despues = reducirConversacion(
      estadoAlCargar(SESION),
      accionDeSesion({ tipo: RESULTADO_API.SIN_RED }),
    );
    expect(despues.hidratando).toBe(false);
    expect(despues.sesionId).toBe(SESION);
    expect(despues.avisoSesion).toEqual({ tipo: AVISO_SESION.NO_CARGADA, mensaje: TEXTO_ERROR.sinConexion });
  });

  test("solo turn_start entrega el id que se guarda en el navegador", () => {
    const inicio = accionesEnVivo(DEMO[0] ?? { mensaje: "", llamadas: [], texto: "", pendientes: [] }, 0);
    expect(inicio.map(sesionDelEvento).filter((id) => id !== null)).toEqual([SESION]);
  });
});

describe("tarjetas resueltas y sesión vencida al recargar", () => {
  test("un caso enviado vuelve como Envío registrado, sin botones, en el turno donde se pidió", () => {
    const { tarjetasConfirmacion } = estadoDesdeVista(vistaDe(DOS_CASOS_Y_UN_ENVIO, [EC]));
    const ec = tarjetasConfirmacion.find((tarjeta) => tarjeta.caso === EC);
    expect(ec).toEqual({
      clave: 0,
      caso: EC,
      turno: 0,
      bloqueosLegibles: [VENCIDO],
      estado: REGISTRADA,
      resueltaEnTurno: 1,
      enviando: null,
    });
    expect(TEXTO_CONFIRMACION.desenlace(ec?.estado ?? ABIERTA)).toBe("Envío registrado");
  });

  test("el caso que sigue pendiente junto al enviado vuelve abierto con sus botones", () => {
    const { tarjetasConfirmacion } = estadoDesdeVista(vistaDe(DOS_CASOS_Y_UN_ENVIO, [EC]));
    expect(
      tarjetasConfirmacion.filter((tarjeta) => tarjeta.estado === ABIERTA).map(({ caso }) => caso),
    ).toEqual([HN]);
  });

  test("una vista sin pendientes no deja ninguna tarjeta abierta", () => {
    const guion: readonly TurnoGuion[] = [
      { mensaje: "¿Qué casos hay?", llamadas: [], texto: "Hay cinco casos.", pendientes: [] },
    ];
    expect(estadoDesdeVista(vistaDe(guion)).tarjetasConfirmacion).toEqual([]);
  });

  test("un paquete que el servidor ya no tiene pendiente no vuelve abierto aunque no haya rastro del rechazo", () => {
    const guion: readonly TurnoGuion[] = [
      ...DEMO,
      { mensaje: "no, mejor no", llamadas: [], texto: "Entendido, no envío nada.", pendientes: [] },
    ];
    const { tarjetasConfirmacion } = estadoDesdeVista(vistaDe(guion));
    expect(tarjetasConfirmacion.some((tarjeta) => tarjeta.estado === ABIERTA)).toBe(false);
  });

  test("un 404 al cargar deja el aviso del servidor al inicio y olvida el id: el próximo mensaje abre sesión nueva", () => {
    const despues = reducirConversacion(
      estadoAlCargar(SESION),
      accionDeSesion({
        tipo: RESULTADO_API.RECHAZO,
        status: RESPUESTA_HTTP.NO_ENCONTRADO,
        mensaje: EXPIRADA,
      }),
    );
    expect(despues.avisoSesion).toEqual({ tipo: AVISO_SESION.EXPIRADA, mensaje: EXPIRADA });
    expect(despues.sesionId).toBeNull();
    expect(despues.hidratando).toBe(false);
    expect(despues.turnos).toEqual([]);
  });

  test("otro rechazo al cargar avisa el error sin olvidar el id", () => {
    const despues = reducirConversacion(
      estadoAlCargar(SESION),
      accionDeSesion({
        tipo: RESULTADO_API.RECHAZO,
        status: RESPUESTA_HTTP.ERROR_INTERNO,
        mensaje: "Falló.",
      }),
    );
    expect(despues.avisoSesion).toEqual({ tipo: AVISO_SESION.NO_CARGADA, mensaje: "Falló." });
    expect(despues.sesionId).toBe(SESION);
  });

  test("solo el 404 pide olvidar el id guardado en el navegador", () => {
    const vencida = accionDeSesion({
      tipo: RESULTADO_API.RECHAZO,
      status: RESPUESTA_HTTP.NO_ENCONTRADO,
      mensaje: EXPIRADA,
    });
    const caida = accionDeSesion({ tipo: RESULTADO_API.SIN_RED });
    const cargada = accionDeSesion({ tipo: RESULTADO_API.OK, valor: vistaDe(DEMO) });
    expect([vencida, caida, cargada].map(olvidaLaSesion)).toEqual([true, false, false]);
  });
});
