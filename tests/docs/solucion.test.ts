import { describe, expect, test } from "bun:test";
import { join } from "node:path";
import { casosEn, clavesLlm, formatoUsd, fugasDeEvidencia } from "@tests/helpers/costo.helper.ts";
import { enlacesRelativos, enlacesRotos, leerDocumento } from "@tests/helpers/documentos.helper.ts";
import { sensiblesDelProyecto } from "@tests/helpers/pii.helper.ts";
import type { CostoAcumulado, EvidenciaCosto } from "@tests/helpers/types/costo.type.ts";
import { ESTADO_EVIDENCIA_COSTO, RUTA_EVIDENCIA_COSTO } from "@/config/constants/costo.constants.ts";
import { CASOS_DIR, FIXTURES_DIR } from "@/config/constants/files.constants.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const SOLUCION = "SOLUCION.md";
const PLANTILLAS = "docs/plantillas.md";
const PREFIJO_SECCION = "## ";
const SEPARADOR_CELDA = "|";
const FILA_TOTAL = "Total";
const MARCA_TRADE_OFF = "Alternativa descartada:";
const MINIMO_TRADE_OFFS = 3;
const TEXTO_PENDIENTE = "pendiente de corrida";
const SECCION_MOVIDA = "Nombres de soporte en las salidas";
const MODELOS_RETIRADOS = ["deepseek-chat", "deepseek-reasoner"];
const ESTADOS_HISTORIA = ["hecho", "parcial", "no hecho"];
const HISTORIAS = ["HU-1", "HU-2", "HU-3", "HU-4", "HU-5"];
const TITULOS = [
  "1. Problema",
  "2. Arquitectura",
  "3. Ciclo del agente",
  "4. Elección del modelo",
  "5. Diseño del portal web",
  "6. Decisiones y trade-offs",
  "7. Supuestos",
  "8. Cobertura",
  "9. Uso de IA",
  "10. Riesgos",
];
const MENCIONES: Readonly<Record<number, readonly string[]>> = {
  2: ["```mermaid", "agent/prompt.md", "src/knowledge/", "src/tools/", "fixtures", "out/"],
  3: ["AGENT_MAX_ITERATIONS", "AGENT_SESSION_TOKEN_BUDGET", "confirmation_required", "servidor"],
  4: ["deepseek-flash", RUTA_EVIDENCIA_COSTO, "bun run costo"],
  5: ["CAPTCHA", "MFA", "credenciales", "Enviar"],
  6: ["D-09", "HttpOnly"],
  7: ["FECHA_EJECUCION", "2026-09-03", "bloqueos", "rúbrica", "demo.ts", "NOMBRE_SOPORTE"],
  9: [
    "Claude Code",
    "GSD",
    "eli-qa-sdd-gsd",
    "eli-qa-map-repos",
    "G1–G16",
    "W1–W13",
    "87/87",
    "LangChain",
    "SheetJS",
    "Tailwind",
    "react-markdown",
    "D-63.11",
  ],
  10: [
    "Redis",
    "almacenamiento de objetos",
    "alertas de gasto",
    "AR-02-06",
    "T-02-41",
    "SEG-02",
    "D-80",
    "docs/limites-del-demo.md",
  ],
};

type Seccion = { readonly titulo: string; readonly cuerpo: string };

function leer(ruta: string): string {
  return leerDocumento(RAIZ, ruta);
}

function secciones(): Seccion[] {
  const resultado: Array<{ titulo: string; lineas: string[] }> = [];
  for (const linea of leer(SOLUCION).split("\n")) {
    if (linea.startsWith(PREFIJO_SECCION)) {
      resultado.push({ titulo: linea.slice(PREFIJO_SECCION.length).trim(), lineas: [] });
    } else {
      resultado.at(-1)?.lineas.push(linea);
    }
  }
  return resultado.map((seccion) => ({ titulo: seccion.titulo, cuerpo: seccion.lineas.join("\n") }));
}

function seccion(numero: number): string {
  const prefijo = TITULOS[numero - 1] ?? "";
  return secciones().find((candidata) => candidata.titulo.startsWith(prefijo))?.cuerpo ?? "";
}

function celdas(linea: string): string[] {
  return linea
    .split(SEPARADOR_CELDA)
    .slice(1, -1)
    .map((celda) => celda.trim());
}

function filaQueEmpiezaCon(texto: string, primera: string): string[] {
  const linea = texto.split("\n").find((candidata) => celdas(candidata)[0] === primera);
  return linea === undefined ? [] : celdas(linea);
}

function celdasEsperadas(primera: string, costo: CostoAcumulado): string[] {
  return [
    primera,
    String(costo.turnos),
    String(costo.llamadas),
    String(costo.entrada),
    String(costo.cacheHit),
    String(costo.cacheMiss),
    String(costo.salida),
    formatoUsd(costo.costoPicoUsd),
    formatoUsd(costo.costoValleUsd),
  ];
}

function evidencia(): EvidenciaCosto {
  return JSON.parse(leer(RUTA_EVIDENCIA_COSTO));
}

function dependencias(): Array<[string, string]> {
  const manifiesto: {
    dependencies?: Record<string, string>;
    devDependencies?: Record<string, string>;
  } = JSON.parse(leer("package.json"));
  return [
    ...Object.entries(manifiesto.dependencies ?? {}),
    ...Object.entries(manifiesto.devDependencies ?? {}),
  ];
}

function apariciones(texto: string, buscado: string): number {
  return texto.split(buscado).length - 1;
}

describe(`${SOLUCION} (DOC-02, PRD §9.1)`, () => {
  test("tiene las 10 secciones obligatorias en el orden del PRD §9.1", () => {
    const titulos = secciones().map((candidata) => candidata.titulo);
    expect(titulos.length).toBeGreaterThanOrEqual(TITULOS.length);
    expect(TITULOS.map((prefijo, indice) => titulos[indice]?.startsWith(prefijo) ?? false)).toEqual(
      TITULOS.map(() => true),
    );
  });

  test.each(Object.keys(MENCIONES).map(Number))("la sección %i nombra lo que exige el plan", (numero) => {
    const cuerpo = seccion(numero);
    expect(cuerpo.length).toBeGreaterThan(0);
    expect((MENCIONES[numero] ?? []).filter((mencion) => !cuerpo.includes(mencion))).toEqual([]);
  });

  test("§4 copia la tabla de costo de la evidencia número a número, o dice que está pendiente", async () => {
    const cuerpo = seccion(4);
    const datos = evidencia();
    expect(cuerpo.length).toBeGreaterThan(0);
    if (datos.estado === ESTADO_EVIDENCIA_COSTO.MEDIDO) {
      expect(datos.escenarios.length).toBeGreaterThan(0);
      for (const escenario of datos.escenarios) {
        expect(filaQueEmpiezaCon(cuerpo, escenario.id)).toEqual(celdasEsperadas(escenario.id, escenario));
      }
      if (datos.total !== null) {
        expect(filaQueEmpiezaCon(cuerpo, FILA_TOTAL)).toEqual(celdasEsperadas(FILA_TOTAL, datos.total));
      }
      return;
    }
    const casos = await casosEn(join(RAIZ, FIXTURES_DIR, CASOS_DIR));
    expect(cuerpo.includes(TEXTO_PENDIENTE)).toBe(true);
    expect(casos.filter((caso) => filaQueEmpiezaCon(cuerpo, caso).length > 0)).toEqual([]);
  });

  test("§6 trae al menos 3 trade-offs con su alternativa descartada", () => {
    expect(apariciones(seccion(6), MARCA_TRADE_OFF)).toBeGreaterThanOrEqual(MINIMO_TRADE_OFFS);
  });

  test("§6 justifica cada dependencia de package.json con su versión exacta", () => {
    const lineas = seccion(6).split("\n");
    const faltantes = dependencias().filter(
      ([nombre, version]) => !lineas.some((linea) => linea.includes(nombre) && linea.includes(version)),
    );
    expect(dependencias().length).toBeGreaterThan(0);
    expect(faltantes).toEqual([]);
  });

  test("§8 da un estado hecho, parcial o no hecho a cada historia de usuario", () => {
    const cuerpo = seccion(8);
    const sinEstado = HISTORIAS.filter((historia) => {
      const fila = cuerpo.split("\n").find((linea) => celdas(linea)[0]?.startsWith(historia) ?? false);
      return fila === undefined || !celdas(fila).some((celda) => ESTADOS_HISTORIA.includes(celda));
    });
    expect(cuerpo.length).toBeGreaterThan(0);
    expect(sinEstado).toEqual([]);
  });

  test("cada enlace relativo apunta a una ruta que existe", () => {
    expect(enlacesRelativos(leer(SOLUCION)).length).toBeGreaterThan(0);
    expect(enlacesRotos(RAIZ, SOLUCION)).toEqual([]);
  });

  test("no trae modelos retirados, claves ni datos del maestro", async () => {
    const texto = leer(SOLUCION);
    const sensibles = await sensiblesDelProyecto(RAIZ);
    expect(texto.length).toBeGreaterThan(0);
    expect(MODELOS_RETIRADOS.filter((modelo) => texto.includes(modelo))).toEqual([]);
    expect(fugasDeEvidencia(texto, sensibles, clavesLlm(process.env))).toEqual([]);
  });
});

describe(`${PLANTILLAS} (IN-01)`, () => {
  test(`la nota de NOMBRE_SOPORTE se mudó a ${SOLUCION}`, () => {
    const plantillas = leer(PLANTILLAS);
    expect(plantillas.length).toBeGreaterThan(0);
    expect(plantillas.includes(SECCION_MOVIDA)).toBe(false);
    expect(enlacesRelativos(plantillas).some((destino) => destino.endsWith(SOLUCION))).toBe(true);
  });
});
