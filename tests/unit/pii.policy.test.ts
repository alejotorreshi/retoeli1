import { describe, expect, test } from "bun:test";
import { VARIABLES_NOTA_PERMITIDAS } from "@/config/constants/mapping.constants.ts";
import { presentarCampo } from "@/domain/builders/campo-presentado.builder.ts";
import { construirIndiceGlosario } from "@/domain/builders/glosario.builder.ts";
import { mapearEtiquetas } from "@/domain/engines/mapeo.engine.ts";
import { enmascarar, POLITICA_PII } from "@/domain/policies/pii.policy.ts";
import type { Glosario } from "@/domain/types/glosario.type.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
import type { Reglas } from "@/domain/types/reglas.type.ts";

const FIXTURES = new URL("../../reto-01/fixtures/reto-01/", import.meta.url);

const PUBLICAS = [
  "razon_social",
  "tipo_sociedad",
  "ciudad",
  "departamento",
  "pais",
  "sitio_web",
  "actividad_economica",
  "ciiu_principal",
  "ciiu_secundario",
  "regimen_tributario",
  "numero_empleados",
];

async function leerJson<T>(url: URL): Promise<T> {
  const valor: T = JSON.parse(await Bun.file(url).text());
  return valor;
}

describe("enmascarar (D-06, D-07)", () => {
  test("números y códigos muestran solo los últimos 4", () => {
    expect(enmascarar("nit", "900123456")).toBe("•••••3456");
    expect(enmascarar("banco.numero_cuenta", "03100012345")).toBe("•••••••2345");
    expect(enmascarar("banco.swift", "COLOCOBM")).toBe("••••COBM");
    expect(enmascarar("representante_legal.identificacion", "71555123")).toBe("••••5123");
    expect(enmascarar("codigo_postal", "050021")).toBe("••0021");
    expect(enmascarar("matricula_mercantil", "21-345678-12")).toBe("••••••••8-12");
  });

  test("un valor de 4 caracteres o menos queda entero oculto", () => {
    expect(enmascarar("digito_verificacion", "7")).toBe("••••");
    expect(enmascarar("banco.swift", "ABCD")).toBe("••••");
  });

  test("los nombres de persona quedan en iniciales", () => {
    expect(enmascarar("representante_legal.nombre", "Roberto Andrade Salazar")).toBe("R. A. S.");
    expect(enmascarar("contacto_comercial.nombre", "Laura Gómez Restrepo")).toBe("L. G. R.");
    expect(enmascarar("contacto_financiero.nombre", "Camila  Ortiz Vélez")).toBe("C. O. V.");
  });

  test("los correos muestran la primera letra y el dominio", () => {
    expect(enmascarar("contacto_comercial.email", "lgomez@periferia-ficticia.com")).toBe(
      "l•••@periferia-ficticia.com",
    );
    expect(enmascarar("representante_legal.email", "gerencia@periferia-ficticia.com")).toBe(
      "g•••@periferia-ficticia.com",
    );
    expect(enmascarar("contacto_financiero.email", "sin-arroba")).toBe("[dato oculto]");
  });

  test("los teléfonos conservan el indicativo y el último grupo", () => {
    expect(enmascarar("telefono", "+57 604 555 0100")).toBe("+57 ••• ••• 0100");
    expect(enmascarar("contacto_comercial.telefono", "+57 300 555 0101")).toBe("+57 ••• ••• 0101");
    expect(enmascarar("telefono", "6045550100")).toBe("••••••0100");
  });

  test("los montos se ocultan", () => {
    expect(enmascarar("ingresos_ultimo_ano.valor", "98000000000")).toBe("[monto oculto]");
  });

  test("la lista blanca pública queda en claro", () => {
    expect(enmascarar("razon_social", "Periferia IT Group S.A.S.")).toBe("Periferia IT Group S.A.S.");
    expect(enmascarar("numero_empleados", "480")).toBe("480");
    for (const ruta of PUBLICAS) expect(POLITICA_PII.get(ruta)).toBe("publico");
  });

  test("cualquier otra ruta queda como dato oculto", () => {
    for (const ruta of [
      "direccion",
      "fecha_constitucion",
      "banco.titular",
      "banco.nombre",
      "banco.tipo_cuenta",
      "representante_legal.cargo",
      "ruta.nueva",
      "constructor",
      "__proto__",
    ]) {
      expect(enmascarar(ruta, "Calle 10 # 43A-25")).toBe("[dato oculto]");
    }
  });
});

describe("presentarCampo (MAP-05)", () => {
  const lleno: CampoMapeado = {
    etiqueta: "NIT",
    ruta: "nit",
    estado: "lleno",
    regla: "glosario_exacto",
    confianza: 1,
    valor: "900123456",
    nota: null,
    propuesta: null,
  };

  test("devuelve exactamente las claves del contrato y nunca valor", () => {
    const presentado = presentarCampo(lleno);
    expect(Object.keys(presentado).sort()).toEqual(
      ["confianza", "estado", "etiqueta", "nota", "propuesta", "regla", "ruta", "valor_enmascarado"].sort(),
    );
    expect(presentado).not.toHaveProperty("valor");
    expect(presentado.valor_enmascarado).toBe("•••••3456");
  });

  test("un faltante no tiene valor enmascarado", () => {
    const faltante: CampoMapeado = {
      ...lleno,
      etiqueta: "Referencias comerciales",
      ruta: null,
      estado: "faltante",
      regla: "sin_fuente",
      confianza: 0,
      valor: null,
    };
    expect(presentarCampo(faltante).valor_enmascarado).toBeNull();
  });

  test("en los cuatro casos reales ningún valor no público sale entero", async () => {
    const reglas = await leerJson<Reglas>(new URL("../../src/knowledge/reglas.json", import.meta.url));
    const glosario = await leerJson<Glosario>(new URL("glosario-campos.json", FIXTURES));
    const maestro = await leerJson<Maestro>(new URL("repositorio/maestro.json", FIXTURES));
    const indice = construirIndiceGlosario(glosario);
    if (!indice.ok) throw new Error(indice.error);
    const casos = [
      ["co-industrias-delta", "plantilla-celdas.json"],
      ["ec-corp-andina", "plantilla-campos.json"],
      ["hn-agroexport-sula", "plantilla-celdas.json"],
      ["pa-logistica-istmo", "plantilla-campos.json"],
    ] as const;
    let revisados = 0;
    for (const [caso, archivo] of casos) {
      const solicitud = await leerJson<{ pais: string }>(new URL(`casos/${caso}/solicitud.json`, FIXTURES));
      const plantilla = await leerJson<{ etiqueta: string }[]>(new URL(`casos/${caso}/${archivo}`, FIXTURES));
      const mapeo = mapearEtiquetas({
        etiquetas: plantilla.map((item) => item.etiqueta),
        pais: solicitud.pais,
        indice: indice.data,
        maestro,
        reglas,
      });
      if (!mapeo.ok) throw new Error(mapeo.error);
      for (const item of mapeo.data) {
        const presentado = presentarCampo(item);
        expect(JSON.stringify(presentado)).not.toContain('"valor"');
        if (item.ruta === null || item.valor === null || PUBLICAS.includes(item.ruta)) continue;
        expect(presentado.valor_enmascarado ?? "").not.toContain(item.valor);
        revisados += 1;
      }
    }
    expect(revisados).toBeGreaterThan(20);
  });
});

describe("VARIABLES_NOTA_PERMITIDAS (D-36)", () => {
  test("es la lista cerrada de variables que una nota puede usar", () => {
    expect([...VARIABLES_NOTA_PERMITIDAS]).toEqual(["moneda", "ano", "pais", "identificador", "pais_emisor"]);
  });
});
