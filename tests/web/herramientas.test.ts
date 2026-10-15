import { describe, expect, test } from "bun:test";
import {
  ACCION_UI,
  ESTADO_FIRMA,
  ESTADO_HERRAMIENTA,
  MAXIMO_TARJETAS_ABIERTAS,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_CHAT, TEXTO_HERRAMIENTA, TEXTO_RESULTADO } from "@web/config/strings.ts";
import { contadoresDe, estadoDeFirma, resultadosDelTurno, resultadosPorCaso } from "@web/state/casos.ts";
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
import type { AccionUi, EstadoConversacion, ResultadoVisibleUi } from "@web/types/chat.type.ts";
import { MOTIVO_FIN, TIPO_EVENTO } from "@/config/constants/agent.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { FORMATO } from "@/config/constants/forms.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
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

function fin(
  llamadaId: string,
  herramienta: string,
  ok: boolean,
  resumen: string,
  resultado: ResultadoVisibleUi | null = null,
  caso: string = CASO,
): AccionUi {
  return evento({
    tipo: TIPO_EVENTO.FIN_HERRAMIENTA,
    turnoId: TURNO,
    llamadaId,
    herramienta,
    caso,
    ok,
    codigo: ok ? null : CODIGO_FALLO,
    resumen,
    resultado,
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
        resultado: null,
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
        resultado: null,
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

const GENERAR = NOMBRE_VISIBLE[HERRAMIENTA.GENERAR_FORMULARIO];
const ARMAR = NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE];
const SIMULAR = NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO];
const OTRO_CASO = "pa-logistica-istmo";
const BLOQUEO_LEGIBLE = "ausente: Certificado de cumplimiento tributario";
const CONTEO_EC = {
  [ESTADO_CAMPO.LLENO]: 13,
  [ESTADO_CAMPO.FALTANTE]: 1,
  [ESTADO_CAMPO.REQUIERE_CONFIRMACION]: 1,
};
const CONTEO_PA = {
  [ESTADO_CAMPO.LLENO]: 9,
  [ESTADO_CAMPO.FALTANTE]: 0,
  [ESTADO_CAMPO.REQUIERE_CONFIRMACION]: 2,
};

const VACIO: Omit<ResultadoVisibleUi, "herramienta"> = {
  pais: null,
  formato: null,
  conteo: null,
  listoParaFirma: null,
  bloqueosLegibles: null,
  ruta: null,
  aviso: null,
};

const RESULTADO_LEER: ResultadoVisibleUi = {
  ...VACIO,
  herramienta: HERRAMIENTA.LEER_SOLICITUD,
  pais: "EC",
  formato: FORMATO.PDF,
};
const RESULTADO_MAPEAR: ResultadoVisibleUi = {
  ...VACIO,
  herramienta: HERRAMIENTA.MAPEAR_CAMPOS,
  pais: "EC",
  conteo: CONTEO_EC,
};
const RESULTADO_GENERAR: ResultadoVisibleUi = {
  ...VACIO,
  herramienta: HERRAMIENTA.GENERAR_FORMULARIO,
  formato: FORMATO.PDF,
  ruta: `out/${CASO}/formulario.pdf`,
};
const RESULTADO_ARMAR: ResultadoVisibleUi = {
  ...VACIO,
  herramienta: HERRAMIENTA.ARMAR_PAQUETE,
  listoParaFirma: false,
  bloqueosLegibles: [BLOQUEO_LEGIBLE],
  ruta: `out/${CASO}/paquete`,
};
const RESULTADO_ENVIO: ResultadoVisibleUi = {
  ...VACIO,
  herramienta: HERRAMIENTA.SIMULAR_ENVIO,
  ruta: `out/${CASO}/ENVIO-SIMULADO.md`,
};

const turnoCompleto: readonly AccionUi[] = [
  ...inicioDeTurno,
  fin("leer", LEER, true, RESUMEN_LEER, RESULTADO_LEER),
  fin("mapear", MAPEAR, true, RESUMEN_MAPEAR, RESULTADO_MAPEAR),
  fin("generar", GENERAR, true, RESUMEN_MAPEAR, RESULTADO_GENERAR),
  fin("armar", ARMAR, true, RESUMEN_MAPEAR, RESULTADO_ARMAR),
  finDeTurno,
];

describe("resultado por caso armado solo con los datos de las herramientas (UI-05)", () => {
  test("leer, mapear, generar y armar de un caso se suman en una sola tarjeta", () => {
    expect(resultadosPorCaso(aplicar(turnoCompleto).turnos)).toEqual([
      {
        caso: CASO,
        pais: "EC",
        formato: FORMATO.PDF,
        conteo: CONTEO_EC,
        listoParaFirma: false,
        bloqueosLegibles: [BLOQUEO_LEGIBLE],
        carpeta: `out/${CASO}/`,
        aviso: null,
      },
    ]);
  });

  test("los contadores salen del mapeo en el orden Llenos, Faltantes y Por confirmar", () => {
    const [resultado] = resultadosPorCaso(aplicar(turnoCompleto).turnos);
    if (resultado === undefined) throw new Error("falta el resultado del caso");
    expect(contadoresDe(resultado)).toEqual([
      { estado: ESTADO_CAMPO.LLENO, cantidad: 13 },
      { estado: ESTADO_CAMPO.FALTANTE, cantidad: 1 },
      { estado: ESTADO_CAMPO.REQUIERE_CONFIRMACION, cantidad: 1 },
    ]);
    expect(contadoresDe(resultado).map(({ estado }) => TEXTO_RESULTADO.contador(estado))).toEqual([
      "Llenos",
      "Faltantes",
      "Por confirmar",
    ]);
    expect(TEXTO_RESULTADO.firma(estadoDeFirma(resultado.listoParaFirma))).toBe("No listo para firma");
  });

  test("un turno sin armar_paquete deja Paquete sin armar, con contadores y sin ruta ni bloqueos", () => {
    const estado = aplicar([
      ...inicioDeTurno,
      fin("leer", LEER, true, RESUMEN_LEER, RESULTADO_LEER),
      fin("mapear", MAPEAR, true, RESUMEN_MAPEAR, RESULTADO_MAPEAR),
      fin("generar", GENERAR, true, RESUMEN_MAPEAR, RESULTADO_GENERAR),
      finDeTurno,
    ]);
    const [resultado] = resultadosPorCaso(estado.turnos);
    expect(resultado).toMatchObject({
      conteo: CONTEO_EC,
      listoParaFirma: null,
      bloqueosLegibles: null,
      carpeta: null,
    });
    expect(estadoDeFirma(resultado?.listoParaFirma ?? null)).toBe(ESTADO_FIRMA.SIN_ARMAR);
    expect(TEXTO_RESULTADO.firma(ESTADO_FIRMA.SIN_ARMAR)).toBe("Paquete sin armar");
  });

  test("un turno sin mapeo deja los contadores en —", () => {
    const estado = aplicar([...inicioDeTurno, fin("leer", LEER, true, RESUMEN_LEER, RESULTADO_LEER)]);
    const [resultado] = resultadosPorCaso(estado.turnos);
    if (resultado === undefined) throw new Error("falta el resultado del caso");
    expect(contadoresDe(resultado).map(({ cantidad }) => TEXTO_RESULTADO.cantidad(cantidad))).toEqual([
      "—",
      "—",
      "—",
    ]);
  });

  test("un tool_end fallido (resultado null) no cambia nada", () => {
    const antes = resultadosPorCaso(aplicar(turnoCompleto).turnos);
    const despues = resultadosPorCaso(
      aplicar([...turnoCompleto.slice(0, -1), fin("armar-2", ARMAR, false, RESUMEN_FALLO), finDeTurno])
        .turnos,
    );
    expect(despues).toEqual(antes);
  });

  test("un caso que solo tuvo llamadas fallidas no tiene tarjeta", () => {
    const estado = aplicar([...inicioDeTurno, fin("leer", LEER, false, RESUMEN_FALLO, null, ""), finDeTurno]);
    expect(resultadosPorCaso(estado.turnos)).toEqual([]);
    expect(resultadosDelTurno(estado.turnos, 0)).toEqual([]);
  });

  test("un paquete listo dice Listo para firma y sin bloqueos queda Sin bloqueos", () => {
    const estado = aplicar([
      ...inicioDeTurno,
      fin("armar", ARMAR, true, RESUMEN_MAPEAR, {
        ...RESULTADO_ARMAR,
        listoParaFirma: true,
        bloqueosLegibles: [],
      }),
    ]);
    const [resultado] = resultadosPorCaso(estado.turnos);
    expect(TEXTO_RESULTADO.firma(estadoDeFirma(resultado?.listoParaFirma ?? null))).toBe("Listo para firma");
    expect(resultado?.bloqueosLegibles).toEqual([]);
    expect(TEXTO_RESULTADO.sinBloqueos).toBe("Sin bloqueos");
  });

  test("el caso portal trae el aviso y el formato Portal", () => {
    const estado = aplicar([
      ...inicioDeTurno,
      fin(
        "mapear",
        MAPEAR,
        true,
        RESUMEN_MAPEAR,
        { ...RESULTADO_MAPEAR, pais: "PA", conteo: CONTEO_PA },
        OTRO_CASO,
      ),
      fin(
        "generar",
        GENERAR,
        true,
        RESUMEN_MAPEAR,
        {
          ...RESULTADO_GENERAR,
          formato: FORMATO.PORTAL,
          ruta: `out/${OTRO_CASO}/valores-portal.md`,
          aviso: "formato no soportado",
        },
        OTRO_CASO,
      ),
    ]);
    const [resultado] = resultadosPorCaso(estado.turnos);
    expect(resultado).toMatchObject({ caso: OTRO_CASO, pais: "PA", aviso: "formato no soportado" });
    expect(TEXTO_RESULTADO.formato(resultado?.formato ?? null)).toBe("Portal");
    expect(TEXTO_RESULTADO.portal).toBe(
      "Formato no soportado: se generaron los valores para cargar a mano en el portal.",
    );
  });

  test("dos casos del mismo turno dan dos tarjetas en el orden en que aparecieron", () => {
    const estado = aplicar([
      ...inicioDeTurno,
      fin("mapear-pa", MAPEAR, true, RESUMEN_MAPEAR, RESULTADO_MAPEAR, OTRO_CASO),
      fin("mapear-ec", MAPEAR, true, RESUMEN_MAPEAR, RESULTADO_MAPEAR),
      fin("mapear-pa-2", MAPEAR, true, RESUMEN_MAPEAR, RESULTADO_MAPEAR, OTRO_CASO),
    ]);
    expect(resultadosDelTurno(estado.turnos, 0).map(({ caso }) => caso)).toEqual([OTRO_CASO, CASO]);
  });

  test("un turno posterior que toca el caso muestra su último estado conocido; uno que no lo toca, ninguna tarjeta", () => {
    const estado = aplicar([
      ...turnoCompleto,
      ...inicioDeTurno,
      fin("enviar", SIMULAR, true, RESUMEN_MAPEAR, RESULTADO_ENVIO),
      finDeTurno,
      ...inicioDeTurno,
      finDeTurno,
    ]);
    expect(resultadosDelTurno(estado.turnos, 1)).toEqual(resultadosDelTurno(estado.turnos, 0));
    expect(resultadosDelTurno(estado.turnos, 1)[0]?.carpeta).toBe(`out/${CASO}/`);
    expect(resultadosDelTurno(estado.turnos, 2)).toEqual([]);
    expect(resultadosDelTurno(estado.turnos, 9)).toEqual([]);
  });

  test("una ruta fuera de out/{caso}/ no se muestra como ruta de salida", () => {
    const estado = aplicar([
      ...inicioDeTurno,
      fin("armar", ARMAR, true, RESUMEN_MAPEAR, { ...RESULTADO_ARMAR, ruta: "otra/carpeta/paquete" }),
    ]);
    expect(resultadosPorCaso(estado.turnos)[0]?.carpeta).toBeNull();
  });

  test("el formato y el país sin dato se muestran como —", () => {
    expect(TEXTO_RESULTADO.formato(null)).toBe("—");
    expect(TEXTO_RESULTADO.pais(null)).toBe("—");
    expect(TEXTO_RESULTADO.formato(FORMATO.XLSX)).toBe("XLSX");
  });
});
