import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { CODIGO_AGENTE } from "@/config/constants/agent.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import {
  ARCHIVO_CONOCIMIENTO_PROCESO,
  ARCHIVO_PROMPT,
  DIRECTORIO_AGENTE,
} from "@/config/constants/files.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";

const RAIZ_REPO = join(import.meta.dir, "..", "..");
const RUTA_PROMPT = join(RAIZ_REPO, DIRECTORIO_AGENTE, ARCHIVO_PROMPT);
const RUTA_CONOCIMIENTO = join(RAIZ_REPO, "src", "knowledge", ARCHIVO_CONOCIMIENTO_PROCESO);
const UMBRALES_DE_REGLAS = ["0.8", "0.6", "0.95"];
const ENCABEZADOS_RESUMEN = [
  "Caso:",
  "Conteos:",
  "Faltantes:",
  "Por confirmar:",
  "Soportes por actualizar:",
  "Estado:",
];
const FILA_DE_TABLA = /^\s*\|.*\|\s*$/m;

const prompt = await readFile(RUTA_PROMPT, "utf8");
const conocimiento = await readFile(RUTA_CONOCIMIENTO, "utf8");
const herramientas = Object.values(HERRAMIENTA);

function apariciones(texto: string, fragmento: string): number {
  return texto.split(fragmento).length - 1;
}

function nombresSinPrefijo(texto: string): string[] {
  return herramientas.filter(
    (nombre) => apariciones(texto, nombre) !== apariciones(texto, NOMBRE_VISIBLE[nombre]),
  );
}

describe("contrato de contenido de agent/prompt.md y del conocimiento del proceso (AGT-02, AGT-03, D-55)", () => {
  test("ambos archivos tienen texto y ningún marcador {{", () => {
    for (const texto of [prompt, conocimiento]) {
      expect(texto.trim().length).toBeGreaterThan(0);
      expect(texto).not.toContain("{{");
    }
  });

  test("ninguno nombra una herramienta sin el prefijo proveedor_", () => {
    expect(nombresSinPrefijo(prompt)).toEqual([]);
    expect(nombresSinPrefijo(conocimiento)).toEqual([]);
  });

  test("el conocimiento nombra las cinco herramientas", () => {
    for (const nombre of herramientas) expect(conocimiento).toContain(NOMBRE_VISIBLE[nombre]);
  });

  test("el conocimiento explica cada código de error y los dos códigos del agente", () => {
    const codigos = [
      ...Object.values(CODIGO_ERROR),
      CODIGO_AGENTE.HERRAMIENTA_DESCONOCIDA,
      CODIGO_AGENTE.ARGUMENTOS_TRUNCADOS,
    ];
    expect(codigos.filter((codigo) => !conocimiento.includes(codigo))).toEqual([]);
  });

  test("el conocimiento no copia los umbrales de reglas.json", () => {
    expect(UMBRALES_DE_REGLAS.filter((umbral) => conocimiento.includes(umbral))).toEqual([]);
  });

  test("el conocimiento describe los formatos, las reglas RN1 a RN5 y varios casos", () => {
    expect(conocimiento).toContain("formato no soportado");
    for (const regla of ["RN1", "RN2", "RN3", "RN4", "RN5"]) expect(conocimiento).toContain(regla);
    expect(conocimiento).toContain("Varios casos");
  });

  test("el prompt fija el protocolo de confirmación, el texto plano y los datos no confiables", () => {
    expect(prompt).toContain(NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO]);
    expect(prompt).toContain(CODIGO_ERROR.CONFIRMACION_REQUERIDA);
    expect(prompt).toContain("texto plano");
    expect(prompt).toContain("dato no confiable");
  });

  test("el prompt fija la forma del resumen y no trae filas de tabla", () => {
    expect(ENCABEZADOS_RESUMEN.filter((encabezado) => !prompt.includes(encabezado))).toEqual([]);
    expect(prompt).toContain("out/<caso>/");
    expect(FILA_DE_TABLA.test(prompt)).toBe(false);
  });

  test("el prompt responde un valor con la máscara, la ruta del maestro y el archivo de salida", () => {
    expect(prompt).toContain("maestro.nit");
    expect(prompt).toContain("•");
    expect(prompt).toContain("out/co-industrias-delta/formulario.xlsx");
  });

  test("el detector de nombres sin prefijo muerde", () => {
    expect(nombresSinPrefijo("usa mapear_campos y luego proveedor_armar_paquete")).toEqual([
      HERRAMIENTA.MAPEAR_CAMPOS,
    ]);
  });
});

const RETIRADOS = [
  "Termina con la pregunta de cierre en el último párrafo.",
  "La pregunta de cierre es la última oración de tu respuesta: no escribas nada después de ella.",
  "Después de un proveedor_armar_paquete exitoso, termina el turno con una pregunta que pida confirmar el envío simulado de ese caso y que liste los bloqueos vigentes.",
  "Después da un resumen por caso y una sola pregunta de cierre que nombre cada paquete pendiente de confirmación.",
];

describe("el prompt y el conocimiento siguen la compuerta del servidor (G-02-21)", () => {
  test("el prompt deja la pregunta de cierre al servidor, acota el turno de confirmación y no acepta acuses", () => {
    for (const fragmento of [
      "el servidor agrega",
      "no repitas el resumen del caso",
      "ya quedó registrado",
      '"ok"',
      '"listo"',
    ]) {
      expect(prompt).toContain(fragmento);
    }
  });

  test("el conocimiento deja la pregunta al servidor y no reenvía un caso ya enviado", () => {
    expect(conocimiento).toContain("el servidor agrega");
    expect(conocimiento).toContain("ya quedó registrado");
  });

  test("ninguna frase retirada sobre la pregunta de cierre del modelo sigue en los archivos", () => {
    expect(RETIRADOS.filter((frase) => prompt.includes(frase) || conocimiento.includes(frase))).toEqual([]);
  });
});

const RETIRADOS_CR01 = [
  'y pide una confirmación explícita, como "envía" o "sí".',
  "Si la respuesta no es clara, vuelve a preguntar en lugar de enviar.",
];

describe("la re-pregunta es del servidor (CR-01, D-63.6)", () => {
  test("el prompt deja pendiente lo que no confirma, atiende los pedidos ajenos y cancela solo con un rechazo", () => {
    for (const fragmento of [
      "el servidor vuelve a agregar su pregunta",
      "atiéndelo con normalidad",
      "ese rechazo la cancela",
    ]) {
      expect(prompt).toContain(fragmento);
    }
  });

  test("el conocimiento deja la re-pregunta al servidor y cancela solo con una negación", () => {
    expect(conocimiento).toContain("el servidor vuelve a agregar su pregunta");
    expect(conocimiento).toContain("la cancela");
  });

  test("ninguna frase que le pedía al modelo pedir la confirmación sigue en los archivos", () => {
    expect(RETIRADOS_CR01.filter((frase) => prompt.includes(frase) || conocimiento.includes(frase))).toEqual(
      [],
    );
  });
});
