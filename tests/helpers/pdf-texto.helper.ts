import { inflateSync } from "node:zlib";
import type { Trazo } from "@tests/helpers/types/pdf-texto.type.ts";
import { PDFArray, PDFDocument, PDFName, type PDFObject, PDFRawStream, PDFRef } from "pdf-lib";

function flujos(doc: PDFDocument, contenido: PDFObject | undefined): PDFRawStream[] {
  const items = contenido instanceof PDFArray ? contenido.asArray() : contenido ? [contenido] : [];
  return items
    .map((it) => (it instanceof PDFRef ? doc.context.lookup(it) : it))
    .filter((o): o is PDFRawStream => o instanceof PDFRawStream);
}

export async function extraerTrazos(bytes: Uint8Array): Promise<Trazo[]> {
  const doc = await PDFDocument.load(bytes, { updateMetadata: false });
  const win1252 = new TextDecoder("windows-1252");
  const trazos: Trazo[] = [];
  for (const page of doc.getPages()) {
    for (const flujo of flujos(doc, page.node.Contents())) {
      const raw = flujo.dict.get(PDFName.of("Filter")) ? inflateSync(flujo.contents) : flujo.contents;
      const ops = new TextDecoder("latin1").decode(raw);
      for (const m of ops.matchAll(/([\d.]+ [\d.]+ [\d.]+) rg[\s\S]*?<([0-9A-Fa-f]*)> Tj/g)) {
        const b = Uint8Array.from((m[2] ?? "").match(/../g) ?? [], (h) => Number.parseInt(h, 16));
        trazos.push({ texto: win1252.decode(b), color: m[1] ?? "" });
      }
    }
  }
  return trazos;
}
