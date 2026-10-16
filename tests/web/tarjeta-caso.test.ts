import { describe, expect, test } from "bun:test";
import { readdirSync } from "node:fs";
import { join } from "node:path";
import { PAIS } from "@web/config/constants/pais.constants.ts";
import { TEXTO_ACCIONES, TEXTO_PAIS, TEXTO_TARJETA_CASO } from "@web/config/strings.ts";
import { datosDeTarjetaCaso, esPaisConocido } from "@web/features/chat/estado/tarjeta-caso.ts";
import { CASO_GUION_PRD } from "@/config/constants/preflight.constants.ts";

const RAIZ = join(import.meta.dir, "..", "..");
const CASOS_FIXTURE = readdirSync(join(RAIZ, "reto-01", "fixtures", "reto-01", "casos"), {
  withFileTypes: true,
})
  .filter((entrada) => entrada.isDirectory())
  .map((entrada) => entrada.name)
  .sort();

describe("datos de la tarjeta de caso derivados del slug (D-113)", () => {
  test("los cuatro casos de los fixtures dan país, código y cliente sin tildes agregadas", () => {
    expect(CASOS_FIXTURE).toEqual([
      "co-industrias-delta",
      "ec-corp-andina",
      "hn-agroexport-sula",
      "pa-logistica-istmo",
    ]);
    expect(CASOS_FIXTURE.map(datosDeTarjetaCaso)).toEqual([
      {
        slug: "co-industrias-delta",
        pais: PAIS.CO,
        codigo: "CO",
        nombrePais: "Colombia",
        cliente: "Industrias Delta",
      },
      { slug: "ec-corp-andina", pais: PAIS.EC, codigo: "EC", nombrePais: "Ecuador", cliente: "Corp Andina" },
      {
        slug: "hn-agroexport-sula",
        pais: PAIS.HN,
        codigo: "HN",
        nombrePais: "Honduras",
        cliente: "Agroexport Sula",
      },
      {
        slug: "pa-logistica-istmo",
        pais: PAIS.PA,
        codigo: "PA",
        nombrePais: "Panamá",
        cliente: "Logistica Istmo",
      },
    ]);
  });

  test("un prefijo desconocido o un slug sin guion dejan solo el slug", () => {
    for (const slug of ["xx-algo", "solo"]) {
      expect(datosDeTarjetaCaso(slug)).toEqual({
        slug,
        pais: null,
        codigo: null,
        nombrePais: null,
        cliente: slug,
      });
    }
  });

  test("un prefijo conocido sin cliente después del guion también deja solo el slug", () => {
    expect(datosDeTarjetaCaso("co-")).toEqual({
      slug: "co-",
      pais: null,
      codigo: null,
      nombrePais: null,
      cliente: "co-",
    });
  });

  test("solo los valores de PAIS son países conocidos y cada uno tiene su nombre visible", () => {
    for (const pais of Object.values(PAIS)) {
      expect(esPaisConocido(pais)).toBe(true);
      expect(TEXTO_PAIS[pais].length).toBeGreaterThan(0);
    }
    expect(Object.keys(TEXTO_PAIS).sort()).toEqual(Object.values(PAIS).sort());
    expect(esPaisConocido("xx")).toBe(false);
    expect(esPaisConocido("CO")).toBe(false);
  });
});

describe("mensaje y nombre accesible de la tarjeta (D-112)", () => {
  test("la plantilla de la demo aplicada al caso del PRD es mensajeDemo, que sigue siendo un string", () => {
    expect(typeof TEXTO_ACCIONES.mensajeDemo).toBe("string");
    expect(TEXTO_ACCIONES.mensajeDemoDe(CASO_GUION_PRD)).toBe(TEXTO_ACCIONES.mensajeDemo);
    expect(TEXTO_ACCIONES.mensajeDemoDe("co-industrias-delta")).toBe(
      'Procesa el caso "co-industrias-delta". Dime qué campos quedaron llenos, cuáles faltan, si el paquete está listo para firma y qué soportes debo actualizar. No envíes nada todavía.',
    );
  });

  test("el nombre accesible contiene el texto visible de la tarjeta", () => {
    expect(TEXTO_TARJETA_CASO.etiqueta("Corp Andina", "Ecuador", "ec-corp-andina")).toBe(
      "Procesar caso Corp Andina, Ecuador (ec-corp-andina)",
    );
    expect(TEXTO_TARJETA_CASO.etiquetaSoloSlug("solo")).toBe("Procesar caso solo");
    expect(TEXTO_TARJETA_CASO.etiquetaSoloSlug("solo")).toContain(TEXTO_TARJETA_CASO.procesar);
  });
});
