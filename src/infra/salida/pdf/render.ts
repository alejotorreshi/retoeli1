import { PDFDocument, type PDFFont, type PDFPage, rgb, StandardFonts } from "pdf-lib";
import type { EntradaFormularioPdf } from "@/application/puertos.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";
import { PATRON_SEPARADORES_DE_LINEA } from "@/config/constants/patterns.constants.ts";
import { DISENO_PDF } from "@/config/constants/pdf.constants.ts";
import { AUTOR_DOCUMENTOS } from "@/config/constants/runtime.constants.ts";
import { TEXTO_COMUN, TEXTO_PDF } from "@/config/strings.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { FilaFormulario } from "@/domain/types/formulario.type.ts";
import { componerPdf, type LineaPdf, type Medir } from "@/infra/salida/pdf/layout.ts";

type FuenteSaneada = { readonly fuente: PDFFont; readonly caracteres: ReadonlySet<number> };

type Fuentes = { readonly normal: FuenteSaneada; readonly negrita: FuenteSaneada };

function caracteresVisibles(texto: string): string[] {
  return Array.from(texto.normalize("NFC").replace(PATRON_SEPARADORES_DE_LINEA, " "));
}

function esRepresentable(caracter: string, caracteres: ReadonlySet<number>): boolean {
  return caracteres.has(caracter.codePointAt(0) ?? -1);
}

export function sanearWinAnsi(texto: string, caracteres: ReadonlySet<number>): string {
  return caracteresVisibles(texto)
    .map((caracter) => (esRepresentable(caracter, caracteres) ? caracter : TEXTO_PDF.reemplazo))
    .join("");
}

function valorRepresentable(fila: FilaFormulario, caracteres: ReadonlySet<number>): boolean {
  if (fila.estado === ESTADO_CAMPO.FALTANTE || fila.valor === null) return true;
  return caracteresVisibles(fila.valor).every((caracter) => esRepresentable(caracter, caracteres));
}

function conMotivoNoRepresentable(fila: FilaFormulario): FilaFormulario {
  const motivo = TEXTO_PDF.motivoNoRepresentable;
  return {
    ...fila,
    estado: ESTADO_CAMPO.REQUIERE_CONFIRMACION,
    nota: fila.nota === null ? motivo : `${fila.nota}${TEXTO_COMUN.separadorNotas}${motivo}`,
  };
}

export function marcarNoRepresentables(
  filas: readonly FilaFormulario[],
  caracteres: ReadonlySet<number>,
): readonly FilaFormulario[] {
  return filas.map((fila) => (valorRepresentable(fila, caracteres) ? fila : conMotivoNoRepresentable(fila)));
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
  const filas = marcarNoRepresentables(entrada.filas, fuentes.normal.caracteres);
  for (const { lineas } of componerPdf({ ...entrada, filas, fecha }, medidorCon(fuentes))) {
    const pagina = documento.addPage([DISENO_PDF.ancho, DISENO_PDF.alto]);
    for (const linea of lineas) dibujar(pagina, linea, fuentes);
  }
  fijarMetadatos(documento, fecha);
  return documento.save();
}
