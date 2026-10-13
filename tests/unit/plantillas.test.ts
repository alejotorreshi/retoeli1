import { describe, expect, test } from "bun:test";
import { renderizarPlantilla, renderizarTextoPlano } from "../../src/domain/plantillas.ts";
import type { Reglas } from "../../src/domain/reglas.ts";

const RUTA_REGLAS = new URL("../../src/knowledge/reglas.json", import.meta.url);

async function leerReglas(): Promise<Reglas> {
  const reglas: Reglas = JSON.parse(await Bun.file(RUTA_REGLAS).text());
  return reglas;
}

function textoDe(resultado: ReturnType<typeof renderizarPlantilla>): string {
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.data;
}

describe("variables", () => {
  test("reemplaza variables conocidas y escapa la barra vertical", () => {
    expect(textoDe(renderizarPlantilla("Hola {{nombre}}", { nombre: "A|B" }, "saludo"))).toBe("Hola A\\|B");
  });

  test("el texto plano no escapa la barra vertical pero sí une las líneas (IN-02)", () => {
    expect(textoDe(renderizarTextoPlano("Hola {{nombre}}", { nombre: "A|B\nC" }, "correo"))).toBe(
      "Hola A|B C",
    );
    const fila = renderizarTextoPlano("{{#filas}}{{v}};{{/filas}}", { filas: [{ v: "x|y" }] }, "lista");
    expect(textoDe(fila)).toBe("x|y;");
    expect(renderizarTextoPlano("{{falta}}", {}, "correo").ok).toBe(false);
  });

  test("los saltos de línea dentro de un valor se vuelven espacios", () => {
    expect(textoDe(renderizarPlantilla("[{{v}}]", { v: "a\r\nb\nc\rd" }, "linea"))).toBe("[a b c d]");
  });

  test("los números se escriben con String", () => {
    expect(
      textoDe(renderizarPlantilla("{{moneda}}, año {{ano}}", { moneda: "COP", ano: 2025 }, "nota")),
    ).toBe("COP, año 2025");
  });

  test("una variable desconocida es REGLAS_INVALIDAS y nombra la plantilla", () => {
    const resultado = renderizarPlantilla(
      "Cuenta {{banco.numero_cuenta}}",
      { pais: "CO" },
      "borrador_correo",
    );
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.codigo).toBe("REGLAS_INVALIDAS");
    expect(resultado.error).toContain("borrador_correo");
  });

  test("una clave del prototipo no cuenta como variable conocida", () => {
    const resultado = renderizarPlantilla("{{constructor}}{{toString}}", {}, "prototipo");
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.codigo).toBe("REGLAS_INVALIDAS");
  });

  test("una lista usada como variable es REGLAS_INVALIDAS", () => {
    const resultado = renderizarPlantilla("{{items}}", { items: [] }, "lista");
    expect(resultado.ok).toBe(false);
  });

  test("una etiqueta sin cerrar es REGLAS_INVALIDAS", () => {
    const resultado = renderizarPlantilla("Hola {{nombre", { nombre: "A" }, "sin_cerrar");
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.error).toContain("sin_cerrar");
  });

  test("un valor con llaves no se vuelve a interpretar", () => {
    expect(textoDe(renderizarPlantilla("{{a}}", { a: "{{b}}", b: "secreto" }, "inyeccion"))).toBe("{{b}}");
  });
});

describe("secciones", () => {
  const filas = [
    { tipo: "rut", estado: "presente" },
    { tipo: "camara|comercio", estado: "vence\nen 27 días" },
  ];

  test("una sección # se repite por cada elemento", () => {
    const texto = "{{#soportes}}- {{tipo}}: {{estado}}\n{{/soportes}}";
    expect(textoDe(renderizarPlantilla(texto, { soportes: filas }, "checklist"))).toBe(
      "- rut: presente\n- camara\\|comercio: vence en 27 días\n",
    );
  });

  test("dentro de una sección se puede leer una variable del contexto exterior", () => {
    const texto = "{{#soportes}}{{caso}}/{{tipo}} {{/soportes}}";
    expect(textoDe(renderizarPlantilla(texto, { caso: "co", soportes: filas }, "checklist"))).toBe(
      "co/rut co/camara\\|comercio ",
    );
  });

  test("una sección ^ solo se muestra cuando la lista está vacía", () => {
    const texto = "{{#faltantes}}- {{etiqueta}}\n{{/faltantes}}{{^faltantes}}Sin faltantes.{{/faltantes}}";
    expect(textoDe(renderizarPlantilla(texto, { faltantes: [] }, "checklist"))).toBe("Sin faltantes.");
    expect(textoDe(renderizarPlantilla(texto, { faltantes: [{ etiqueta: "RUC" }] }, "checklist"))).toBe(
      "- RUC\n",
    );
  });

  test("una sección desconocida es REGLAS_INVALIDAS y nombra la plantilla", () => {
    const resultado = renderizarPlantilla("{{#banco}}x{{/banco}}", { soportes: [] }, "checklist");
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.codigo).toBe("REGLAS_INVALIDAS");
    expect(resultado.error).toContain("checklist");
  });

  test("una sección sobre un valor escalar es REGLAS_INVALIDAS", () => {
    expect(renderizarPlantilla("{{#caso}}x{{/caso}}", { caso: "co" }, "checklist").ok).toBe(false);
  });

  test("una variable desconocida dentro de una sección es REGLAS_INVALIDAS", () => {
    const resultado = renderizarPlantilla(
      "{{#soportes}}{{numero_cuenta}}{{/soportes}}",
      { soportes: filas },
      "x",
    );
    expect(resultado.ok).toBe(false);
  });

  test("las secciones anidadas no se admiten", () => {
    const texto = "{{#a}}{{#b}}{{x}}{{/b}}{{/a}}";
    expect(renderizarPlantilla(texto, { a: [{ x: "1" }], b: [{ x: "2" }] }, "anidada").ok).toBe(false);
  });

  test("una sección sin cierre es REGLAS_INVALIDAS", () => {
    expect(renderizarPlantilla("{{#soportes}}x", { soportes: filas }, "abierta").ok).toBe(false);
  });
});

describe("src/knowledge/reglas.json", () => {
  test("se parsea con JSON.parse y trae la escala, el umbral y el plazo de aviso", async () => {
    const texto = await Bun.file(RUTA_REGLAS).text();
    expect(texto).toContain('"umbral": 0.8');
    expect(texto).toContain('"dias_aviso_vencimiento": 30');
    const reglas = await leerReglas();
    expect(reglas.version).toBe(1);
    expect(reglas.confianza).toEqual({
      umbral: 0.8,
      glosario_exacto: 1,
      glosario_normalizado: 0.95,
      clave_directa: 0.85,
      regla_pais: 0.6,
      etiqueta_generica: 0.5,
      sin_fuente: 0,
    });
    expect(reglas.identificador_tributario.por_pais).toEqual({
      CO: "NIT",
      EC: "RUC",
      PE: "RUC",
      PA: "RUC",
      HN: "RTN",
    });
    expect(reglas.etiquetas_genericas).toEqual([
      "Identificación tributaria",
      "Número de identificación fiscal",
    ]);
  });

  test("no trae la política de PII", async () => {
    const texto = await Bun.file(RUTA_REGLAS).text();
    expect(texto).not.toMatch(/pii|enmascar|publico|oculto/i);
  });

  test("sus textos se renderizan con las variables de nota permitidas", async () => {
    const reglas = await leerReglas();
    const id = reglas.identificador_tributario;
    expect(
      textoDe(renderizarPlantilla(id.nota_generica, { pais: "EC", identificador: "RUC" }, "nota_generica")),
    ).toBe("Etiqueta genérica: el equivalente en EC es RUC; confirmar con el cliente");
    expect(textoDe(renderizarPlantilla(id.nota_extranjero, {}, "nota_extranjero"))).toBe(
      "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano",
    );
    expect(
      textoDe(
        renderizarPlantilla(reglas.soportes.aviso_emisor_distinto, { pais_emisor: "CO" }, "aviso_emisor"),
      ),
    ).toBe("Emitido en CO: confirmar si el cliente lo acepta");
    const ingresos = reglas.notas_contexto.find((nota) => nota.ruta === "ingresos_ultimo_ano.valor");
    expect(ingresos?.aplica).toBe("extranjero");
    expect(
      textoDe(renderizarPlantilla(ingresos?.texto ?? "", { moneda: "COP", ano: 2025 }, "ingresos")),
    ).toBe("COP, año 2025");
    const pais = reglas.notas_contexto.find((nota) => nota.ruta === "pais");
    expect(pais).toEqual({
      ruta: "pais",
      aplica: "siempre",
      texto: "Código ISO del país de constitución de Periferia",
    });
  });

  test("las rutas de plantillas no salen de plantillas/", async () => {
    const reglas = await leerReglas();
    for (const ruta of Object.values(reglas.plantillas)) {
      expect(ruta).toMatch(/^plantillas\/[a-z-]+\.md$/);
    }
  });
});
