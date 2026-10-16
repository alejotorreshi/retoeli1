import { describe, expect, test } from "bun:test";
import { montarApp } from "@tests/helpers/app-dom.helper.ts";
import { prepararDom } from "@tests/helpers/dom.helper.ts";
import {
  crearRedWeb,
  eventoFin,
  eventoInicio,
  eventosDeHerramienta,
  eventoTexto,
} from "@tests/helpers/red-web.helper.ts";
import type { RespuestaFalsa } from "@tests/helpers/types/red-web.type.ts";
import { ESTADO_ETAPA, ETAPA, ORDEN_ETAPAS } from "@web/config/constants/ui.constants.ts";
import {
  TEXTO_ACCESO,
  TEXTO_ACCIONES,
  TEXTO_ARCHIVOS,
  TEXTO_DISCO,
  TEXTO_PANEL,
  TEXTO_PROGRESO,
  TEXTO_VISTA_PREVIA,
} from "@web/config/strings.ts";
import { ARCHIVOS_SALIDA, TIPO_ARCHIVO_CASO, TIPO_VISTA_PREVIA } from "@/config/constants/files.constants.ts";
import {
  METODO_POST,
  PARAMETRO_ARCHIVO,
  PARAMETRO_CASO,
  RESPUESTA_HTTP,
  RUTA_API,
} from "@/config/constants/http.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { MENSAJE_HTTP } from "@/config/strings.ts";
import type { FileListResponse, PreviewResponse } from "@/http/types/api.type.ts";
import type { ResultadoVisible } from "@/loop/types/resultado-visible.type.ts";

const ANCHO_ESCRITORIO = 1280;
const CASO = "co-industrias-delta";
const SESION = "sesion-del-panel";
const RESPUESTA = "El paquete de co-industrias-delta quedó armado.";
const TEXTO_FORMULARIO = "Razón social: Periferia IT Group";

const RESULTADO_PAQUETE: ResultadoVisible = {
  herramienta: HERRAMIENTA.ARMAR_PAQUETE,
  pais: "CO",
  formato: null,
  conteo: null,
  listoParaFirma: true,
  bloqueosLegibles: [],
  ruta: `out/${CASO}/paquete`,
  aviso: null,
};

const ARCHIVO = {
  nombre: ARCHIVOS_SALIDA.FORMULARIO_PDF,
  tipo: TIPO_ARCHIVO_CASO.FORMULARIO,
  previsualizable: true,
} as const;

const RUTA_ARCHIVOS = RUTA_API.ARCHIVOS.replace(`:${PARAMETRO_CASO}`, CASO);
const RUTA_VISTA_PREVIA = RUTA_API.VISTA_PREVIA.replace(`:${PARAMETRO_CASO}`, CASO).replace(
  `:${PARAMETRO_ARCHIVO}`,
  ARCHIVO.nombre,
);
const LISTA: FileListResponse = { archivos: [ARCHIVO] };
const VISTA: PreviewResponse = { tipo: TIPO_VISTA_PREVIA.TEXTO, texto: TEXTO_FORMULARIO };

const dom = await prepararDom({ ancho: ANCHO_ESCRITORIO });

const ACCESO_VENCIDO: RespuestaFalsa = {
  estado: RESPUESTA_HTTP.NO_AUTORIZADO,
  cuerpo: { mensaje: MENSAJE_HTTP.accesoVencido },
};

function redConVistaPrevia(vistaPrevia: RespuestaFalsa, lista: RespuestaFalsa) {
  return crearRedWeb({
    nativos: dom.nativos,
    guiones: [
      {
        eventos: [
          eventoInicio(SESION),
          ...eventosDeHerramienta(NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE], CASO, RESULTADO_PAQUETE),
          eventoTexto(RESPUESTA),
          eventoFin(),
        ],
      },
    ],
    rutas: {
      [RUTA_ARCHIVOS]: lista,
      [RUTA_VISTA_PREVIA]: vistaPrevia,
    },
  });
}

async function pedirElListado(vistaPrevia: RespuestaFalsa, lista: RespuestaFalsa) {
  const red = redConVistaPrevia(vistaPrevia, lista);
  const app = await montarApp(dom, red);
  const listar = await app.pantalla.findByRole("button", { name: TEXTO_ACCIONES.listar });
  await dom.esperar(() => expect(listar.hasAttribute("disabled")).toBe(false));
  await app.usuario.click(listar);
  return app;
}

async function procesarCaso(vistaPrevia: RespuestaFalsa) {
  const app = await pedirElListado(vistaPrevia, { estado: RESPUESTA_HTTP.OK, cuerpo: LISTA });
  await app.pantalla.findByText(RESPUESTA);
  return app;
}

describe("App en escritorio: panel de casos y archivos", () => {
  test("tras armar el paquete el panel lista el caso, trae sus archivos y Ver abre la vista previa", async () => {
    const { pantalla, usuario, red } = await procesarCaso({ estado: RESPUESTA_HTTP.OK, cuerpo: VISTA });

    const panel = await pantalla.findByRole("complementary", { name: TEXTO_PANEL.titulo });
    expect(await dom.dentroDe(panel).findByRole("heading", { name: CASO })).toBeDefined();
    await dom.esperar(() => expect(red.pedidosA(RUTA_ARCHIVOS).length).toBeGreaterThan(0));
    const ver = await pantalla.findByRole("button", { name: TEXTO_ARCHIVOS.verArchivo(ARCHIVO.nombre) });

    await usuario.click(ver);

    const dialogo = await pantalla.findByRole("dialog", { name: ARCHIVO.nombre });
    expect(dialogo.hasAttribute("open")).toBe(true);
    expect(await pantalla.findByText(TEXTO_FORMULARIO)).toBeDefined();

    await usuario.click(pantalla.getByRole("button", { name: TEXTO_VISTA_PREVIA.cerrar }));

    expect(dialogo.hasAttribute("open")).toBe(false);
    expect(document.activeElement).toBe(ver);
  });

  test("un 404 al pedir la vista previa muestra la pista de reinicio del servidor", async () => {
    const { pantalla, usuario } = await procesarCaso({
      estado: RESPUESTA_HTTP.NO_ENCONTRADO,
      cuerpo: { mensaje: MENSAJE_HTTP.archivoNoEncontrado },
    });
    const ver = await pantalla.findByRole("button", { name: TEXTO_ARCHIVOS.verArchivo(ARCHIVO.nombre) });

    await usuario.click(ver);

    const alerta = await pantalla.findByRole("alert");
    expect(alerta.textContent).toBe(TEXTO_VISTA_PREVIA.error);
  });

  test("un 401 al listar los archivos devuelve a la pantalla de acceso con el aviso del servidor", async () => {
    const { pantalla } = await pedirElListado({ estado: RESPUESTA_HTTP.OK, cuerpo: VISTA }, ACCESO_VENCIDO);

    expect(await pantalla.findByRole("heading", { name: TEXTO_ACCESO.titulo })).toBeDefined();
    expect(await pantalla.findByText(MENSAJE_HTTP.accesoVencido)).toBeDefined();
  });

  test("un caso hecho sin sus archivos en disco muestra el aviso de reinicio y su chip lo vuelve a procesar", async () => {
    const red = crearRedWeb({
      nativos: dom.nativos,
      guiones: [
        {
          eventos: [
            eventoInicio(SESION),
            ...eventosDeHerramienta(NOMBRE_VISIBLE[HERRAMIENTA.GENERAR_FORMULARIO], CASO, null),
            ...eventosDeHerramienta(NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE], CASO, RESULTADO_PAQUETE),
            eventoTexto(RESPUESTA),
            eventoFin(),
          ],
        },
        { eventos: [eventoInicio(SESION)], retenidos: [eventoTexto(RESPUESTA), eventoFin()] },
      ],
      rutas: { [RUTA_ARCHIVOS]: { estado: RESPUESTA_HTTP.OK, cuerpo: { archivos: [] } } },
    });
    const { pantalla, usuario } = await montarApp(dom, red);
    const listar = await pantalla.findByRole("button", { name: TEXTO_ACCIONES.listar });
    await dom.esperar(() => expect(listar.hasAttribute("disabled")).toBe(false));
    await usuario.click(listar);
    await pantalla.findByText(RESPUESTA);

    const etapas = pantalla.getByRole("list", { name: TEXTO_PROGRESO.lista(CASO) });
    const hechas: ReadonlySet<string> = new Set([ETAPA.GENERADO, ETAPA.PAQUETE]);
    expect(
      dom
        .dentroDe(etapas)
        .getAllByRole("listitem")
        .map((etapa) => etapa.getAttribute("aria-label")),
    ).toEqual(
      ORDEN_ETAPAS.map((etapa) =>
        TEXTO_PROGRESO.aria(etapa, hechas.has(etapa) ? ESTADO_ETAPA.HECHA : ESTADO_ETAPA.PENDIENTE),
      ),
    );
    expect(await pantalla.findByText(TEXTO_DISCO.aviso)).toBeDefined();
    const chip = pantalla.getByRole("button", { name: TEXTO_DISCO.chip(CASO) });

    await usuario.click(chip);

    await dom.esperar(() => expect(chip.hasAttribute("disabled")).toBe(true));
    const reprocesos = red
      .pedidosA(RUTA_API.CHAT, METODO_POST)
      .filter((pedido) => JSON.stringify(pedido.cuerpo).includes(TEXTO_DISCO.mensaje(CASO)));
    expect(reprocesos.map((pedido) => pedido.cuerpo)).toEqual([
      { sessionId: SESION, message: TEXTO_DISCO.mensaje(CASO) },
    ]);

    red.soltar();
    await dom.esperar(() => expect(pantalla.getAllByText(RESPUESTA)).toHaveLength(2));
  });
});
