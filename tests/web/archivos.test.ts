import { afterEach, describe, expect, spyOn, test } from "bun:test";
import {
  descargarArchivo,
  listarArchivos,
  obtenerVistaPrevia,
  rutaDeArchivos,
  rutaDeDescarga,
  rutaDeVistaPrevia,
} from "@web/api/cliente-api.ts";
import {
  ESTADO_ETAPA,
  ESTADO_HERRAMIENTA,
  ESTADO_LISTA_ARCHIVOS,
  ETAPA,
  ORDEN_ETAPAS,
  RESULTADO_API,
} from "@web/config/constants/ui.constants.ts";
import { TEXTO_ARCHIVOS, TEXTO_DISCO, TEXTO_VISTA_PREVIA } from "@web/config/strings.ts";
import {
  archivosFaltantes,
  discoBorrado,
  esArchivoNoEncontrado,
  marcasDeArchivos,
} from "@web/state/casos.ts";
import type {
  ArchivoUi,
  EstadoEtapa,
  EstadoListaArchivos,
  Etapa,
  LlamadaDelTurno,
  ProgresoDeCaso,
  TurnoConversacion,
} from "@web/types/chat.type.ts";
import {
  ARCHIVOS_PAQUETE,
  ARCHIVOS_SALIDA,
  PREFIJO_PAQUETE,
  TIPO_ARCHIVO_CASO,
  TIPO_VISTA_PREVIA,
} from "@/config/constants/files.constants.ts";
import {
  PARAMETRO_ARCHIVO,
  PARAMETRO_CASO,
  RESPUESTA_HTTP,
  RUTA_API,
} from "@/config/constants/http.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import type { FileListResponse, PreviewResponse } from "@/http/types/api.type.ts";

const EC = "ec-corp-andina";
const PA = "pa-logistica-istmo";
const CHECKLIST = `${PREFIJO_PAQUETE}${ARCHIVOS_PAQUETE.CHECKLIST}`;
const BORRADOR = `${PREFIJO_PAQUETE}${ARCHIVOS_PAQUETE.BORRADOR_CORREO}`;
const SOPORTE = `${PREFIJO_PAQUETE}rut-vigente.pdf`;

const FORMULARIO: ArchivoUi = {
  nombre: ARCHIVOS_SALIDA.FORMULARIO_PDF,
  tipo: TIPO_ARCHIVO_CASO.FORMULARIO,
  previsualizable: true,
};
const PORTAL: ArchivoUi = {
  nombre: ARCHIVOS_SALIDA.VALORES_PORTAL,
  tipo: TIPO_ARCHIVO_CASO.VALORES_PORTAL,
  previsualizable: true,
};
const LISTA_DE_CHEQUEO: ArchivoUi = {
  nombre: CHECKLIST,
  tipo: TIPO_ARCHIVO_CASO.CHECKLIST,
  previsualizable: true,
};
const CORREO: ArchivoUi = { nombre: BORRADOR, tipo: TIPO_ARCHIVO_CASO.BORRADOR, previsualizable: true };
const ENVIO: ArchivoUi = {
  nombre: ARCHIVOS_SALIDA.ENVIO_SIMULADO,
  tipo: TIPO_ARCHIVO_CASO.ENVIO_SIMULADO,
  previsualizable: true,
};
const COPIA_DE_SOPORTE: ArchivoUi = {
  nombre: SOPORTE,
  tipo: TIPO_ARCHIVO_CASO.SOPORTE,
  previsualizable: false,
};

function progreso(hechas: readonly Etapa[], caso = EC): ProgresoDeCaso {
  return {
    caso,
    etapas: ORDEN_ETAPAS.map((etapa) => ({
      etapa,
      estado: hechas.includes(etapa) ? ESTADO_ETAPA.HECHA : ESTADO_ETAPA.PENDIENTE,
    })),
  };
}

function conEstado(base: ProgresoDeCaso, etapa: Etapa, estado: EstadoEtapa): ProgresoDeCaso {
  return {
    caso: base.caso,
    etapas: base.etapas.map((actual) => (actual.etapa === etapa ? { etapa, estado } : actual)),
  };
}

function lista(archivos: readonly ArchivoUi[]): EstadoListaArchivos {
  return { tipo: ESTADO_LISTA_ARCHIVOS.LISTA, archivos };
}

const HASTA_GENERADO = [ETAPA.LEIDO, ETAPA.MAPEADO, ETAPA.GENERADO] as const;
const HASTA_PAQUETE = [...HASTA_GENERADO, ETAPA.PAQUETE] as const;
const HASTA_ENVIO = [...HASTA_PAQUETE, ETAPA.CONFIRMACION, ETAPA.ENVIO] as const;

describe("archivosFaltantes: lo que el progreso espera en disco (D-67)", () => {
  test("Generado hecho sin formulario ni valores-portal.md marca el caso como borrado", () => {
    expect(archivosFaltantes(progreso(HASTA_GENERADO), [])).toEqual([ETAPA.GENERADO]);
    expect(archivosFaltantes(progreso(HASTA_GENERADO), [COPIA_DE_SOPORTE])).toEqual([ETAPA.GENERADO]);
  });

  test("Paquete hecho sin paquete/checklist.md marca el caso como borrado", () => {
    expect(archivosFaltantes(progreso(HASTA_PAQUETE), [FORMULARIO, CORREO])).toEqual([ETAPA.PAQUETE]);
  });

  test("Envío hecho sin ENVIO-SIMULADO.md marca el caso como borrado", () => {
    expect(archivosFaltantes(progreso(HASTA_ENVIO), [FORMULARIO, LISTA_DE_CHEQUEO, CORREO])).toEqual([
      ETAPA.ENVIO,
    ]);
  });

  test("con todo lo esperado en disco no falta nada", () => {
    expect(archivosFaltantes(progreso(HASTA_ENVIO), [FORMULARIO, LISTA_DE_CHEQUEO, CORREO, ENVIO])).toEqual(
      [],
    );
    expect(archivosFaltantes(progreso(HASTA_PAQUETE, PA), [PORTAL, LISTA_DE_CHEQUEO, CORREO])).toEqual([]);
  });

  test("un disco vacío sin etapas hechas no es un disco borrado", () => {
    expect(archivosFaltantes(progreso([ETAPA.LEIDO, ETAPA.MAPEADO]), [])).toEqual([]);
  });

  test("solo cuentan las etapas hechas: en curso, con error o pendiente no esperan archivos", () => {
    const base = progreso([ETAPA.LEIDO, ETAPA.MAPEADO]);
    expect(archivosFaltantes(conEstado(base, ETAPA.GENERADO, ESTADO_ETAPA.EN_CURSO), [])).toEqual([]);
    expect(archivosFaltantes(conEstado(base, ETAPA.GENERADO, ESTADO_ETAPA.ERROR), [])).toEqual([]);
  });

  test("un servidor reiniciado con todo hecho reporta cada etapa sin su archivo", () => {
    expect(archivosFaltantes(progreso(HASTA_ENVIO), [])).toEqual([
      ETAPA.GENERADO,
      ETAPA.PAQUETE,
      ETAPA.ENVIO,
    ]);
  });
});

describe("discoBorrado: cuándo el caso muestra el aviso de reinicio (D-67)", () => {
  test("una lista sin el archivo que el progreso espera muestra el aviso", () => {
    expect(discoBorrado(progreso(HASTA_GENERADO), lista([]), false)).toBe(true);
  });

  test("un 404 al ver o al descargar muestra el aviso aunque la lista parezca completa", () => {
    expect(discoBorrado(progreso(HASTA_GENERADO), lista([FORMULARIO]), true)).toBe(true);
    expect(discoBorrado(progreso([]), { tipo: ESTADO_LISTA_ARCHIVOS.CARGANDO }, true)).toBe(true);
  });

  test("sin 404 y con todo lo esperado en disco no hay aviso", () => {
    expect(discoBorrado(progreso(HASTA_GENERADO), lista([FORMULARIO]), false)).toBe(false);
  });

  test("mientras carga o si falló el listado no se acusa un reinicio", () => {
    expect(discoBorrado(progreso(HASTA_ENVIO), { tipo: ESTADO_LISTA_ARCHIVOS.CARGANDO }, false)).toBe(false);
    expect(discoBorrado(progreso(HASTA_ENVIO), { tipo: ESTADO_LISTA_ARCHIVOS.ERROR }, false)).toBe(false);
  });
});

describe("esArchivoNoEncontrado", () => {
  test("solo un rechazo 404 cuenta como archivo borrado", () => {
    expect(
      esArchivoNoEncontrado({
        tipo: RESULTADO_API.RECHAZO,
        status: RESPUESTA_HTTP.NO_ENCONTRADO,
        mensaje: "x",
      }),
    ).toBe(true);
    expect(
      esArchivoNoEncontrado({
        tipo: RESULTADO_API.RECHAZO,
        status: RESPUESTA_HTTP.DEMASIADOS_PEDIDOS,
        mensaje: "x",
      }),
    ).toBe(false);
    expect(
      esArchivoNoEncontrado({
        tipo: RESULTADO_API.RECHAZO,
        status: RESPUESTA_HTTP.NO_PROCESABLE,
        mensaje: "x",
      }),
    ).toBe(false);
    expect(esArchivoNoEncontrado({ tipo: RESULTADO_API.SIN_RED })).toBe(false);
    expect(esArchivoNoEncontrado({ tipo: RESULTADO_API.OK, valor: null })).toBe(false);
  });
});

function llamada(caso: string | null): LlamadaDelTurno {
  return {
    llamadaId: `llamada-${caso ?? "sin-caso"}`,
    herramienta: NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD],
    caso,
    argumentos: {},
    estado: ESTADO_HERRAMIENTA.CORRECTA,
    resumen: null,
    codigo: null,
    resultado: null,
  };
}

function turnoCon(clave: number, casos: readonly (string | null)[]): TurnoConversacion {
  return {
    clave,
    mensaje: "procesa",
    llamadas: casos.map(llamada),
    eventos: 0,
    textos: [],
    confirmaciones: [],
    error: null,
  };
}

describe("marcasDeArchivos: la lista se vuelve a pedir después de cada turno que tocó el caso", () => {
  test("cuenta los turnos terminados que llamaron herramientas de cada caso", () => {
    const turnos = [turnoCon(1, [EC, EC]), turnoCon(2, [PA]), turnoCon(3, [EC, null])];
    expect(marcasDeArchivos({ turnos, enCurso: false })).toEqual(
      new Map([
        [EC, 2],
        [PA, 1],
      ]),
    );
  });

  test("el turno en curso no cuenta hasta que termina", () => {
    const turnos = [turnoCon(1, [EC]), turnoCon(2, [EC])];
    expect(marcasDeArchivos({ turnos, enCurso: true }).get(EC)).toBe(1);
  });
});

let restaurarFetch: (() => void) | null = null;

function simularFetch(responder: () => Promise<Response>) {
  const espia = spyOn(globalThis, "fetch").mockImplementation(
    Object.assign(responder, { preconnect: () => undefined }),
  );
  restaurarFetch = () => espia.mockRestore();
  return espia;
}

afterEach(() => {
  restaurarFetch?.();
  restaurarFetch = null;
});

function conParametros(patron: string, caso: string, nombre: string): string {
  return patron.replace(`:${PARAMETRO_CASO}`, caso).replace(`:${PARAMETRO_ARCHIVO}`, nombre);
}

describe("rutas de archivos del cliente", () => {
  test("arman las rutas de la API, con paquete/ en su propia ruta", () => {
    expect(rutaDeArchivos(EC)).toBe(RUTA_API.ARCHIVOS.replace(`:${PARAMETRO_CASO}`, EC));
    expect(rutaDeDescarga(EC, ARCHIVOS_SALIDA.FORMULARIO_PDF)).toBe(
      conParametros(RUTA_API.ARCHIVO, EC, ARCHIVOS_SALIDA.FORMULARIO_PDF),
    );
    expect(rutaDeDescarga(EC, CHECKLIST)).toBe(
      conParametros(RUTA_API.ARCHIVO_PAQUETE, EC, ARCHIVOS_PAQUETE.CHECKLIST),
    );
    expect(rutaDeVistaPrevia(EC, BORRADOR)).toBe(
      conParametros(RUTA_API.VISTA_PREVIA_PAQUETE, EC, ARCHIVOS_PAQUETE.BORRADOR_CORREO),
    );
    expect(rutaDeVistaPrevia(PA, ARCHIVOS_SALIDA.VALORES_PORTAL)).toBe(
      conParametros(RUTA_API.VISTA_PREVIA, PA, ARCHIVOS_SALIDA.VALORES_PORTAL),
    );
  });

  test("codifican el nombre para que no pueda salir de su segmento", () => {
    expect(rutaDeDescarga(EC, "../x.md")).toBe(conParametros(RUTA_API.ARCHIVO, EC, "..%2Fx.md"));
  });
});

describe("listarArchivos", () => {
  test("devuelve la lista blanca del servidor", async () => {
    const cuerpo: FileListResponse = { archivos: [FORMULARIO, LISTA_DE_CHEQUEO, COPIA_DE_SOPORTE] };
    const espia = simularFetch(async () => Response.json(cuerpo));
    expect(await listarArchivos(EC)).toEqual({ tipo: RESULTADO_API.OK, valor: cuerpo.archivos });
    expect(espia.mock.calls[0]?.[0]).toBe(rutaDeArchivos(EC));
  });

  test("una lista con un tipo desconocido no se usa", async () => {
    simularFetch(async () =>
      Response.json({ archivos: [{ nombre: "x", tipo: "interno", previsualizable: true }] }),
    );
    expect(await listarArchivos(EC)).toEqual({ tipo: RESULTADO_API.SIN_RED });
  });
});

describe("descargarArchivo", () => {
  test("guarda el archivo real con su nombre, sin la carpeta", async () => {
    const guardados: string[] = [];
    simularFetch(async () => new Response("contenido", { status: RESPUESTA_HTTP.OK }));
    const resultado = await descargarArchivo(EC, CHECKLIST, (cuerpo, nombre) => {
      guardados.push(nombre);
      expect(cuerpo.size).toBeGreaterThan(0);
    });
    expect(resultado).toEqual({ tipo: RESULTADO_API.OK, valor: null });
    expect(guardados).toEqual([ARCHIVOS_PAQUETE.CHECKLIST]);
  });

  test("un 404 no guarda nada y queda como archivo borrado", async () => {
    const guardados: string[] = [];
    simularFetch(async () =>
      Response.json({ mensaje: "No encontramos ese archivo." }, { status: RESPUESTA_HTTP.NO_ENCONTRADO }),
    );
    const resultado = await descargarArchivo(EC, ARCHIVOS_SALIDA.FORMULARIO_PDF, (_cuerpo, nombre) => {
      guardados.push(nombre);
    });
    expect(esArchivoNoEncontrado(resultado)).toBe(true);
    expect(guardados).toEqual([]);
  });
});

describe("obtenerVistaPrevia", () => {
  test("la tabla enmascarada llega tal como la manda el servidor", async () => {
    const vista: PreviewResponse = {
      tipo: TIPO_VISTA_PREVIA.TABLA,
      filas: [
        { etiqueta: "RUC", valor_enmascarado: "•••••3456", estado: ESTADO_CAMPO.LLENO, nota: null },
        { etiqueta: "Código CIIU", valor_enmascarado: null, estado: ESTADO_CAMPO.FALTANTE, nota: "Sin dato" },
      ],
    };
    const espia = simularFetch(async () => Response.json(vista));
    expect(await obtenerVistaPrevia(EC, ARCHIVOS_SALIDA.FORMULARIO_PDF)).toEqual({
      tipo: RESULTADO_API.OK,
      valor: vista,
    });
    expect(espia.mock.calls[0]?.[0]).toBe(rutaDeVistaPrevia(EC, ARCHIVOS_SALIDA.FORMULARIO_PDF));
  });

  test("el texto de un .md llega como texto", async () => {
    const vista: PreviewResponse = { tipo: TIPO_VISTA_PREVIA.TEXTO, texto: "# Checklist\n- [ ] RUT" };
    simularFetch(async () => Response.json(vista));
    expect(await obtenerVistaPrevia(EC, CHECKLIST)).toEqual({ tipo: RESULTADO_API.OK, valor: vista });
  });

  test("una fila con un estado desconocido no se muestra", async () => {
    simularFetch(async () =>
      Response.json({
        tipo: TIPO_VISTA_PREVIA.TABLA,
        filas: [{ etiqueta: "RUC", valor_enmascarado: "x", estado: "inventado", nota: null }],
      }),
    );
    expect(await obtenerVistaPrevia(EC, ARCHIVOS_SALIDA.FORMULARIO_PDF)).toEqual({
      tipo: RESULTADO_API.SIN_RED,
    });
  });

  test("un 404 de vista previa queda como archivo borrado", async () => {
    simularFetch(async () =>
      Response.json({ mensaje: "No hay vista previa." }, { status: RESPUESTA_HTTP.NO_ENCONTRADO }),
    );
    expect(esArchivoNoEncontrado(await obtenerVistaPrevia(EC, ARCHIVOS_SALIDA.FORMULARIO_PDF))).toBe(true);
  });
});

describe("textos de archivos, vista previa y disco efímero (UI-SPEC)", () => {
  test("filas, estados de la lista y nombres accesibles", () => {
    expect(TEXTO_ARCHIVOS.cargando).toBe("Cargando archivos…");
    expect(TEXTO_ARCHIVOS.error).toBe("No pudimos traer los archivos de este caso.");
    expect(TEXTO_ARCHIVOS.reintentar).toBe("Reintentar");
    expect(TEXTO_ARCHIVOS.verArchivo("formulario.xlsx")).toBe("Ver formulario.xlsx");
    expect(TEXTO_ARCHIVOS.descargarArchivo("formulario.xlsx")).toBe("Descargar formulario.xlsx");
    expect(Object.values(TIPO_ARCHIVO_CASO).map(TEXTO_ARCHIVOS.tipo)).toEqual([
      "Formulario",
      "Valores para portal",
      "Checklist",
      "Borrador de correo",
      "Envío simulado",
      "Soporte",
    ]);
  });

  test("aviso de disco efímero con el chip que vuelve a procesar el caso", () => {
    expect(TEXTO_DISCO.aviso).toBe(
      "El servidor se reinició y los archivos se borraron; vuelve a procesar el caso.",
    );
    expect(TEXTO_DISCO.chip(EC)).toBe(`Procesar ${EC} de nuevo`);
    expect(TEXTO_DISCO.mensaje(EC)).toBe(`procesa el caso ${EC}`);
  });

  test("vista previa: columnas, estados, nulos, nota, carga, error y botones", () => {
    expect(TEXTO_VISTA_PREVIA.columnas).toEqual(["Etiqueta", "Valor (enmascarado)", "Estado", "Nota"]);
    expect(
      [ESTADO_CAMPO.LLENO, ESTADO_CAMPO.FALTANTE, ESTADO_CAMPO.REQUIERE_CONFIRMACION].map(
        TEXTO_VISTA_PREVIA.estado,
      ),
    ).toEqual(["Lleno", "Faltante", "Por confirmar"]);
    expect(TEXTO_VISTA_PREVIA.valor(null)).toBe("—");
    expect(TEXTO_VISTA_PREVIA.nota).toBe(
      "Los valores se muestran enmascarados. La descarga trae el archivo completo.",
    );
    expect(TEXTO_VISTA_PREVIA.cargando).toBe("Cargando la vista previa…");
    expect(TEXTO_VISTA_PREVIA.error).toBe(
      "No se pudo cargar la vista previa. Si el servidor se reinició, vuelve a procesar el caso; si no, inténtalo de nuevo.",
    );
    expect(TEXTO_VISTA_PREVIA.descargar).toBe("Descargar archivo");
    expect(TEXTO_VISTA_PREVIA.cerrar).toBe("Cerrar vista previa");
  });
});
