import { describe, expect, test } from "bun:test";
import { PDFDocument, StandardFonts } from "pdf-lib";
import type { FilaFormulario } from "@/domain/types/formulario.type.ts";
import { layoutPdf } from "@/infra/output/pdf/pdf-layout.util.ts";
import { markUnrepresentable, renderPdf, sanitizeWinAnsi } from "@/infra/output/pdf/pdf-renderer.adapter.ts";
import type { PdfLayoutInput, PdfLine } from "@/infra/types/pdf-layout.type.ts";

const ACTIVIDAD = "Desarrollo de sistemas informáticos y consultoría en tecnologías de la información";
const NOTA_EXTRANJERO = "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano";
const NOTA_PAIS = "Código ISO del país";
const ANCHO_PAGINA = 595;
const ALTO_PAGINA = 842;
const MARGEN = 50;

const medir = (texto: string): number => texto.length * 5;

function fila(cambios: Partial<FilaFormulario> & Pick<FilaFormulario, "etiqueta">): FilaFormulario {
  return { obligatorio: true, estado: "lleno", valor: "valor", nota: null, ...cambios };
}

function entrada(filas: readonly FilaFormulario[]): PdfLayoutInput {
  return { caso: "ec-corp-andina", cliente: "Corporación Andina", fecha: "2026-09-03", filas };
}

const FILAS_EC: readonly FilaFormulario[] = [
  fila({ etiqueta: "Nombre de la empresa", valor: "Periferia IT Group S.A.S." }),
  fila({ etiqueta: "RUC", estado: "requiere_confirmacion", valor: "900123456", nota: NOTA_EXTRANJERO }),
  fila({ etiqueta: "Número de contribuyente especial", obligatorio: false, estado: "faltante", valor: null }),
  fila({ etiqueta: "País", valor: "CO", nota: NOTA_PAIS }),
  fila({ etiqueta: "Actividad económica", valor: ACTIVIDAD }),
  fila({ etiqueta: "Banco", obligatorio: null, valor: "Bancolombia" }),
];

function todas(paginas: readonly { readonly lineas: readonly PdfLine[] }[]): PdfLine[] {
  return paginas.flatMap((pagina) => [...pagina.lineas]);
}

function indiceDe(lineas: readonly PdfLine[], texto: string): number {
  const indice = lineas.findIndex((linea) => linea.texto === texto);
  if (indice < 0) throw new Error(`sin línea "${texto}"`);
  return indice;
}

describe("layoutPdf (FORM-02, D-03)", () => {
  test("pone las etiquetas en el orden de la plantilla, en negrita y con * si son obligatorias", () => {
    const lineas = todas(layoutPdf(entrada(FILAS_EC), medir));
    const esperadas = [
      "Nombre de la empresa *",
      "RUC *",
      "Número de contribuyente especial",
      "País *",
      "Actividad económica *",
      "Banco",
    ];
    const indices = esperadas.map((texto) => indiceDe(lineas, texto));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
    for (const indice of indices) expect(lineas[indice]?.negrita).toBe(true);
  });

  test("abre con el encabezado del caso, el cliente y la fecha de ejecución", () => {
    const textos = todas(layoutPdf(entrada(FILAS_EC), medir)).map((linea) => linea.texto);
    expect(textos.slice(0, 4)).toEqual([
      "Formulario de registro como proveedor",
      "Caso: ec-corp-andina",
      "Cliente: Corporación Andina",
      "Fecha de ejecución: 2026-09-03",
    ]);
  });

  test("un valor más largo que la columna se parte en al menos 2 líneas sin perder texto", () => {
    const lineas = todas(
      layoutPdf(entrada([fila({ etiqueta: "Actividad económica", valor: ACTIVIDAD })]), medir),
    );
    const trozos = lineas.filter(
      (linea) => !linea.negrita && linea.texto !== "" && ACTIVIDAD.includes(linea.texto),
    );
    expect(trozos.length).toBeGreaterThanOrEqual(2);
    expect(trozos.map((linea) => linea.texto).join(" ")).toBe(ACTIVIDAD);
    for (const linea of lineas)
      expect(linea.x + medir(linea.texto)).toBeLessThanOrEqual(ANCHO_PAGINA - MARGEN);
  });

  test("60 campos ocupan al menos 2 páginas y ninguna línea cruza los márgenes", () => {
    const filas = Array.from({ length: 60 }, (_, indice) => fila({ etiqueta: `Campo ${indice + 1}` }));
    const paginas = layoutPdf(entrada(filas), medir);
    expect(paginas.length).toBeGreaterThanOrEqual(2);
    for (const linea of todas(paginas)) {
      expect(linea.y).toBeGreaterThanOrEqual(MARGEN);
      expect(linea.y).toBeLessThanOrEqual(ALTO_PAGINA - MARGEN);
    }
    const lineas = todas(paginas);
    const indices = filas.map((campo) => indiceDe(lineas, `${campo.etiqueta} *`));
    expect(indices).toEqual([...indices].sort((a, b) => a - b));
  });

  test("un faltante se ve como [FALTANTE] en el color de faltante", () => {
    const lineas = todas(layoutPdf(entrada(FILAS_EC), medir));
    const etiqueta = indiceDe(lineas, "Número de contribuyente especial");
    const marca = lineas[indiceDe(lineas, "[FALTANTE]")];
    expect(marca?.color).toBe("faltante");
    expect(indiceDe(lineas, "[FALTANTE]")).toBe(etiqueta + 1);
  });

  test("un campo por confirmar muestra el valor seguido de [POR CONFIRMAR] en el color de por confirmar", () => {
    const lineas = todas(layoutPdf(entrada(FILAS_EC), medir));
    const marca = lineas[indiceDe(lineas, "900123456 [POR CONFIRMAR]")];
    expect(marca?.color).toBe("por_confirmar");
  });

  test("la última sección se titula Notas y lista etiqueta: motivo de faltantes, por confirmar y notas de contexto", () => {
    const lineas = todas(layoutPdf(entrada(FILAS_EC), medir));
    const notas = indiceDe(lineas, "Notas");
    expect(lineas[notas]?.negrita).toBe(true);
    expect(notas).toBeGreaterThan(indiceDe(lineas, "Banco"));
    const despues = lineas.slice(notas + 1).map((linea) => linea.texto);
    expect(despues).toEqual([
      `RUC: ${NOTA_EXTRANJERO}`,
      "Número de contribuyente especial: no existe en el maestro",
      `País: ${NOTA_PAIS}`,
    ]);
    for (const linea of lineas.slice(notas + 1)) expect(linea.color).toBe("texto");
  });

  test("sin faltantes, por confirmar ni notas la sección Notas lo dice", () => {
    const lineas = todas(layoutPdf(entrada([fila({ etiqueta: "Banco" })]), medir));
    const notas = indiceDe(lineas, "Notas");
    expect(lineas.slice(notas + 1).map((linea) => linea.texto)).toEqual(["Sin observaciones."]);
  });
});

describe("sanitizeWinAnsi (D-03, Pitfall 2)", () => {
  test("deja una cadena que Helvetica codifica sin lanzar y conserva el español, € y —", async () => {
    const documento = await PDFDocument.create();
    const fuente = await documento.embedFont(StandardFonts.Helvetica);
    const caracteres = new Set(fuente.getCharacterSet());
    const crudo = "Listo ✓\nlínea\tdos\r\nRaz" + "ón € — ñ Ñ ¿¡ 😀";
    expect(() => fuente.encodeText(crudo)).toThrow();
    const saneado = sanitizeWinAnsi(crudo, caracteres);
    expect(saneado).toBe("Listo ? línea dos Razón € — ñ Ñ ¿¡ ?");
    expect(() => fuente.encodeText(saneado)).not.toThrow();
  });
});

describe("markUnrepresentable (WR-01)", () => {
  const caracteres = new Set(
    Array.from("abcdefghijklmnopqrstuvwxyzó ", (letra) => letra.codePointAt(0) ?? 0),
  );
  const MOTIVO =
    "el valor tiene caracteres que el PDF no puede mostrar y salen como ?; revisarlo contra el maestro";

  test("un valor con caracteres fuera de la fuente pasa a por confirmar con el motivo en la nota", () => {
    const [llena, conNota] = markUnrepresentable(
      [fila({ etiqueta: "Ciudad", valor: "łódź" }), fila({ etiqueta: "País", valor: "ł", nota: "ISO" })],
      caracteres,
    );
    expect(llena).toMatchObject({ estado: "requiere_confirmacion", valor: "łódź", nota: MOTIVO });
    expect(conNota).toMatchObject({ estado: "requiere_confirmacion", nota: `ISO. ${MOTIVO}` });
  });

  test("los valores representables, los saltos de línea y los faltantes no cambian", () => {
    const filas = [
      fila({ etiqueta: "Ciudad", valor: "medellin" }),
      fila({ etiqueta: "Dirección", valor: "calle\ndiez" }),
      fila({ etiqueta: "Referencias", estado: "faltante", valor: null }),
    ];
    expect(markUnrepresentable(filas, caracteres)).toEqual(filas);
  });
});

describe("renderPdf (T-01-13)", () => {
  test("no lanza con texto fuera de WinAnsi en el cliente, la etiqueta, el valor y la nota", async () => {
    const hostil = "⚠ → ✓ 😀​\tfin\n";
    const bytes = await renderPdf(
      {
        caso: "zz-hostil",
        cliente: `Cliente ${hostil}`,
        filas: [
          fila({ etiqueta: `Etiqueta ${hostil}`, valor: `Valor ${hostil}`, nota: `Nota ${hostil}` }),
          fila({ etiqueta: "Otra", estado: "requiere_confirmacion", valor: hostil, nota: null }),
        ],
      },
      "2026-09-03",
    );
    expect(bytes.byteLength).toBeGreaterThan(0);
    const documento = await PDFDocument.load(bytes, { updateMetadata: false });
    expect(documento.getProducer()).toBe("registro-proveedor");
  });
});
