import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from "pdf-lib";
import type { EntradaFormularioPdf } from "../../../application/puertos.ts";
import { AUTOR_DOCUMENTOS, DISENO_PDF, TEXTOS_PDF } from "../../../config/constantes.ts";
import type { FechaISO } from "../../../domain/tipos.ts";
import { componerPdf, type LineaPdf, type Medir } from "./layout.ts";

type FuenteSaneada = { readonly fuente: PDFFont; readonly caracteres: ReadonlySet<number> };

type Fuentes = { readonly normal: FuenteSaneada; readonly negrita: FuenteSaneada };

const SEPARADORES_DE_LINEA = /[\t\r\n]+/g;

export function sanearWinAnsi(texto: string, caracteres: ReadonlySet<number>): string {
  return Array.from(texto.normalize("NFC").replace(SEPARADORES_DE_LINEA, " "))
    .map((caracter) => (caracteres.has(caracter.codePointAt(0) ?? -1) ? caracter : TEXTOS_PDF.reemplazo))
    .join("");
}

async function incrustar(documento: PDFDocument, nombre: StandardFonts): Promise<FuenteSaneada> {
  const fuente = await documento.embedFont(nombre);
  return { fuente, caracteres: new Set(fuente.getCharacterSet()) };
}

function fuenteDe(fuentes: Fuentes, negrita: boolean): FuenteSaneada {
  return negrita ? fuentes.negrita : fuentes.normal;
}

function medidorCon(fuentes: Fuentes): Medir {
  return (texto, tamano, negrita) => {
    const { fuente, caracteres } = fuenteDe(fuentes, negrita);
    return fuente.widthOfTextAtSize(sanearWinAnsi(texto, caracteres), tamano);
  };
}

function dibujar(pagina: PDFPage, linea: LineaPdf, fuentes: Fuentes): void {
  const { fuente, caracteres } = fuenteDe(fuentes, linea.negrita);
  const texto = sanearWinAnsi(linea.texto, caracteres);
  if (texto === "") return;
  const [rojo, verde, azul] = DISENO_PDF.colores[linea.color];
  pagina.drawText(texto, {
    x: linea.x,
    y: linea.y,
    size: linea.tamano,
    font: fuente,
    color: rgb(rojo, verde, azul),
  });
}

function fijarMetadatos(documento: PDFDocument, fecha: FechaISO): void {
  const instante = new Date(`${fecha}T00:00:00Z`);
  documento.setTitle(AUTOR_DOCUMENTOS);
  documento.setAuthor(AUTOR_DOCUMENTOS);
  documento.setCreator(AUTOR_DOCUMENTOS);
  documento.setProducer(AUTOR_DOCUMENTOS);
  documento.setCreationDate(instante);
  documento.setModificationDate(instante);
}

export async function renderizarPdf(entrada: EntradaFormularioPdf, fecha: FechaISO): Promise<Uint8Array> {
  const documento = await PDFDocument.create();
  const fuentes: Fuentes = {
    normal: await incrustar(documento, StandardFonts.Helvetica),
    negrita: await incrustar(documento, StandardFonts.HelveticaBold),
  };
  for (const { lineas } of componerPdf({ ...entrada, fecha }, medidorCon(fuentes))) {
    const pagina = documento.addPage([DISENO_PDF.ancho, DISENO_PDF.alto]);
    for (const linea of lineas) dibujar(pagina, linea, fuentes);
  }
  fijarMetadatos(documento, fecha);
  return documento.save();
}
