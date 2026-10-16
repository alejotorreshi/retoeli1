import { describe, expect, test } from "bun:test";
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { TEXTO_ACCIONES } from "@web/config/strings.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const PRD = readFileSync(join(RAIZ, "reto-01", "PRD.md"), "utf8");
const CARPETA_COMPONENTE = join(RAIZ, "web", "src", "features", "chat", "acciones-rapidas");
const ARCHIVOS_COMPONENTE = ["acciones-rapidas.tsx", "usar-acciones-rapidas.ts"] as const;
const CASOS_FIXTURE = readdirSync(join(RAIZ, "reto-01", "fixtures", "reto-01", "casos"), {
  withFileTypes: true,
})
  .filter((entrada) => entrada.isDirectory())
  .map((entrada) => entrada.name)
  .sort();
const INICIO_PROMPT_PRD = 'Procesa el caso "ec-corp-andina".';
const CIERRE_PROMPT_PRD = "No envíes nada todavía.";

function promptDelPrd(): string {
  const inicio = PRD.indexOf(INICIO_PROMPT_PRD);
  const fin = PRD.indexOf(CIERRE_PROMPT_PRD, inicio) + CIERRE_PROMPT_PRD.length;
  return PRD.slice(inicio, fin).split(/\s+/).join(" ");
}

describe("acciones rápidas (UI-07)", () => {
  test("el chip de la demo manda el prompt literal del PRD §11 en un solo párrafo", () => {
    expect(TEXTO_ACCIONES.demo).toBe("Demo §11: ec-corp-andina");
    expect(promptDelPrd()).toBe(TEXTO_ACCIONES.mensajeDemo);
  });

  test("el chip de los casos arma la lista con los casos del servidor", () => {
    expect(TEXTO_ACCIONES.todos(CASOS_FIXTURE.length)).toBe("Procesar los 4 casos");
    expect(TEXTO_ACCIONES.mensajeTodos(CASOS_FIXTURE)).toBe(
      "Procesa estos casos: co-industrias-delta, ec-corp-andina, hn-agroexport-sula, pa-logistica-istmo. Dime el estado de cada uno. No envíes nada todavía.",
    );
    expect(TEXTO_ACCIONES.todos(0)).toBe("Procesar los casos");
  });

  test("el chip del listado pregunta qué casos hay", () => {
    expect(TEXTO_ACCIONES.listar).toBe("¿Qué casos hay?");
    expect(TEXTO_ACCIONES.mensajeListar).toBe("¿Qué casos hay disponibles?");
  });

  test("las etiquetas cortas de la franja angosta salen de su nombre completo", () => {
    expect(TEXTO_ACCIONES.demoCorto).toBe("Demo §11");
    expect(TEXTO_ACCIONES.todosCorto(CASOS_FIXTURE.length)).toBe("Los 4 casos");
    expect(TEXTO_ACCIONES.todosCorto(0)).toBe("Los casos");
    expect(TEXTO_ACCIONES.demo.toLowerCase()).toContain(TEXTO_ACCIONES.demoCorto.toLowerCase());
    for (const cantidad of [0, 1, CASOS_FIXTURE.length]) {
      expect(TEXTO_ACCIONES.todos(cantidad).toLowerCase()).toContain(
        TEXTO_ACCIONES.todosCorto(cantidad).toLowerCase(),
      );
    }
  });

  test("el componente no escribe ningún id de caso", () => {
    expect(CASOS_FIXTURE).toHaveLength(4);
    for (const archivo of ARCHIVOS_COMPONENTE) {
      const fuente = readFileSync(join(CARPETA_COMPONENTE, archivo), "utf8");
      expect(CASOS_FIXTURE.filter((caso) => fuente.includes(caso))).toEqual([]);
    }
  });
});
