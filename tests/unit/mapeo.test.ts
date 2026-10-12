import { describe, expect, test } from "bun:test";
import {
  type CampoMapeado,
  construirIndiceGlosario,
  contarEstados,
  type EntradaMapeo,
  type Glosario,
  type IndiceGlosario,
  leerRuta,
  type Maestro,
  mapearCampos,
} from "../../src/domain/mapeo.ts";
import type { Reglas } from "../../src/domain/reglas.ts";

const FIXTURES = new URL("../../reto-01/fixtures/reto-01/", import.meta.url);
const RUTA_REGLAS = new URL("../../src/knowledge/reglas.json", import.meta.url);

const NOTA_EXTRANJERO = "Identificador extranjero: confirmar si el cliente acepta el NIT colombiano";
const NOTA_PAIS = "Código ISO del país de constitución de Periferia";

type CasoReal = { readonly caso: string; readonly plantilla: string };

const CASOS: readonly CasoReal[] = [
  { caso: "co-industrias-delta", plantilla: "plantilla-celdas.json" },
  { caso: "ec-corp-andina", plantilla: "plantilla-campos.json" },
  { caso: "hn-agroexport-sula", plantilla: "plantilla-celdas.json" },
  { caso: "pa-logistica-istmo", plantilla: "plantilla-campos.json" },
];

async function leerJson<T>(url: URL): Promise<T> {
  const valor: T = JSON.parse(await Bun.file(url).text());
  return valor;
}

const reglas = await leerJson<Reglas>(RUTA_REGLAS);
const glosario = await leerJson<Glosario>(new URL("glosario-campos.json", FIXTURES));
const maestro = await leerJson<Maestro>(new URL("repositorio/maestro.json", FIXTURES));

function indiceReal(): IndiceGlosario {
  const indice = construirIndiceGlosario(glosario);
  if (!indice.ok) throw new Error(indice.error);
  return indice.data;
}

function entrada(
  etiquetas: readonly string[],
  pais: string,
  cambios: Partial<EntradaMapeo> = {},
): EntradaMapeo {
  return { etiquetas, pais, indice: indiceReal(), maestro, reglas, variablesNota: {}, ...cambios };
}

function mapear(datos: EntradaMapeo): readonly CampoMapeado[] {
  const resultado = mapearCampos(datos);
  if (!resultado.ok) throw new Error(resultado.error);
  return resultado.data;
}

function campo(campos: readonly CampoMapeado[], etiqueta: string): CampoMapeado {
  const encontrado = campos.find((candidato) => candidato.etiqueta === etiqueta);
  if (encontrado === undefined) throw new Error(`sin campo ${etiqueta}`);
  return encontrado;
}

async function mapearCaso(caso: string): Promise<readonly CampoMapeado[]> {
  const real = CASOS.find((candidato) => candidato.caso === caso);
  if (real === undefined) throw new Error(`sin caso ${caso}`);
  const solicitud = await leerJson<{ pais: string }>(new URL(`casos/${caso}/solicitud.json`, FIXTURES));
  const plantilla = await leerJson<{ etiqueta: string }[]>(
    new URL(`casos/${caso}/${real.plantilla}`, FIXTURES),
  );
  return mapear(
    entrada(
      plantilla.map((item) => item.etiqueta),
      solicitud.pais,
    ),
  );
}

describe("leerRuta", () => {
  test("lee rutas anidadas y hojas escalares", () => {
    expect(leerRuta(maestro, "representante_legal.nombre")).toBe("Roberto Andrade Salazar");
    expect(leerRuta(maestro, "banco.numero_cuenta")).toBe("03100012345");
    expect(leerRuta(maestro, "ingresos_ultimo_ano.valor")).toBe("98000000000");
    expect(leerRuta(maestro, "numero_empleados")).toBe("480");
    expect(leerRuta(maestro, "codigo_postal")).toBe("050021");
  });

  test("objetos, listas, booleanos y rutas inexistentes no tienen fuente", () => {
    for (const ruta of ["banco", "gran_contribuyente", "certificaciones", "no.existe", "nit.extra", ""]) {
      expect(leerRuta(maestro, ruta)).toBeNull();
    }
  });

  test("las claves del prototipo no tienen fuente", () => {
    for (const ruta of ["constructor", "__proto__", "toString", "banco.constructor", "hasOwnProperty"]) {
      expect(leerRuta(maestro, ruta)).toBeNull();
    }
    const conProto: Maestro = JSON.parse('{"__proto__": {"x": "y"}}');
    expect(leerRuta(conProto, "__proto__.x")).toBeNull();
  });

  test("los segmentos fuera de ^[a-z_]+$ no tienen fuente", () => {
    for (const ruta of ["NIT", "banco..swift", "banco.swift.", "banco[0]", "razon-social"]) {
      expect(leerRuta(maestro, ruta)).toBeNull();
    }
  });
});

describe("construirIndiceGlosario", () => {
  test("indexa el glosario real sin colisiones", () => {
    const indice = indiceReal();
    expect(indice.exacto.get("NIT")).toBe("nit");
    expect(indice.normalizado.get("razon social")).toBe("razon_social");
  });

  test("dos claves que normalizan igual hacia rutas distintas son DATOS_INVALIDOS", () => {
    const resultado = construirIndiceGlosario({ "Razón social": "razon_social", "RAZON SOCIAL": "nit" });
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.codigo).toBe("DATOS_INVALIDOS");
  });

  test("dos claves que normalizan igual hacia la misma ruta se aceptan", () => {
    expect(
      construirIndiceGlosario({ "Razón social": "razon_social", "razon social": "razon_social" }).ok,
    ).toBe(true);
  });
});

describe("tabla de verdad de los cuatro casos reales (D-21)", () => {
  test("co-industrias-delta da 17/0/0 y todo por glosario exacto", async () => {
    const campos = await mapearCaso("co-industrias-delta");
    expect(contarEstados(campos)).toEqual({ lleno: 17, faltante: 0, requiere_confirmacion: 0 });
    expect(campos.map((item) => item.ruta)).toEqual([
      "razon_social",
      "nit",
      "digito_verificacion",
      "direccion",
      "ciudad",
      "codigo_postal",
      "telefono",
      "contacto_comercial.email",
      "representante_legal.nombre",
      "representante_legal.identificacion",
      "actividad_economica",
      "ciiu_principal",
      "regimen_tributario",
      "banco.nombre",
      "banco.tipo_cuenta",
      "banco.numero_cuenta",
      "banco.titular",
    ]);
    for (const item of campos) {
      expect(item.regla).toBe("glosario_exacto");
      expect(item.confianza).toBe(1);
    }
    expect(campo(campos, "NIT")).toEqual({
      etiqueta: "NIT",
      ruta: "nit",
      estado: "lleno",
      regla: "glosario_exacto",
      confianza: 1,
      valor: "900123456",
      nota: null,
      propuesta: null,
    });
    expect(campo(campos, "Código postal").valor).toBe("050021");
  });

  test("ec-corp-andina da 13/1/1 con RUC por regla de país", async () => {
    const campos = await mapearCaso("ec-corp-andina");
    expect(contarEstados(campos)).toEqual({ lleno: 13, faltante: 1, requiere_confirmacion: 1 });
    expect(campo(campos, "RUC")).toEqual({
      etiqueta: "RUC",
      ruta: "nit",
      estado: "requiere_confirmacion",
      regla: "regla_pais",
      confianza: 0.6,
      valor: "900123456",
      nota: NOTA_EXTRANJERO,
      propuesta: null,
    });
    expect(campo(campos, "Número de contribuyente especial")).toEqual({
      etiqueta: "Número de contribuyente especial",
      ruta: null,
      estado: "faltante",
      regla: "sin_fuente",
      confianza: 0,
      valor: null,
      nota: null,
      propuesta: null,
    });
    expect(campo(campos, "País")).toMatchObject({
      ruta: "pais",
      estado: "lleno",
      valor: "CO",
      nota: NOTA_PAIS,
    });
    expect(campo(campos, "Página web").ruta).toBe("sitio_web");
    expect(campo(campos, "Cargo del representante legal").ruta).toBe("representante_legal.cargo");
    expect(campo(campos, "SWIFT").ruta).toBe("banco.swift");
    for (const item of campos.filter((candidato) => candidato.estado === "lleno")) {
      expect(item.regla).toBe("glosario_exacto");
      expect(item.confianza).toBe(1);
    }
  });

  test("hn-agroexport-sula da 9/1/1 con RTN por regla de país y notas de contexto", async () => {
    const campos = await mapearCaso("hn-agroexport-sula");
    expect(contarEstados(campos)).toEqual({ lleno: 9, faltante: 1, requiere_confirmacion: 1 });
    expect(campo(campos, "RTN")).toMatchObject({
      ruta: "nit",
      regla: "regla_pais",
      confianza: 0.6,
      estado: "requiere_confirmacion",
      nota: NOTA_EXTRANJERO,
    });
    expect(campo(campos, "Referencias comerciales")).toMatchObject({
      ruta: null,
      estado: "faltante",
      regla: "sin_fuente",
      confianza: 0,
      valor: null,
    });
    expect(campo(campos, "Ingresos anuales")).toMatchObject({
      ruta: "ingresos_ultimo_ano.valor",
      estado: "lleno",
      valor: "98000000000",
      nota: "COP, año 2025",
    });
    expect(campo(campos, "Número de empleados")).toMatchObject({ valor: "480", estado: "lleno" });
    expect(campo(campos, "País").nota).toBe(NOTA_PAIS);
    expect(campo(campos, "Fecha de constitución").ruta).toBe("fecha_constitucion");
  });

  test("pa-logistica-istmo da 8/0/1 con RUC por regla de país", async () => {
    const campos = await mapearCaso("pa-logistica-istmo");
    expect(contarEstados(campos)).toEqual({ lleno: 8, faltante: 0, requiere_confirmacion: 1 });
    expect(campo(campos, "RUC")).toMatchObject({ ruta: "nit", regla: "regla_pais", nota: NOTA_EXTRANJERO });
    expect(campo(campos, "Nombre o razón social del proveedor").ruta).toBe("razon_social");
  });

  test("los campos salen en el orden de la plantilla", async () => {
    const campos = await mapearCaso("hn-agroexport-sula");
    expect(campos.map((item) => item.etiqueta)).toEqual([
      "Razón social",
      "RTN",
      "País",
      "Dirección",
      "Teléfono",
      "Correo electrónico",
      "Representante legal",
      "Fecha de constitución",
      "Número de empleados",
      "Ingresos anuales",
      "Referencias comerciales",
    ]);
  });
});

describe("reglas sobre etiquetas sintéticas", () => {
  const sinteticas = [
    "Identificación tributaria",
    "RAZON SOCIAL:",
    "Teléfono *",
    "Sitio web",
    "Gran contribuyente",
    "constructor",
    "toString",
    "__proto__",
  ];

  test("una etiqueta genérica en CO pide confirmación y propone NIT", () => {
    const campos = mapear(entrada(sinteticas, "CO"));
    expect(campo(campos, "Identificación tributaria")).toEqual({
      etiqueta: "Identificación tributaria",
      ruta: "nit",
      estado: "requiere_confirmacion",
      regla: "etiqueta_generica",
      confianza: 0.5,
      valor: "900123456",
      nota: "Etiqueta genérica: el equivalente en CO es NIT; confirmar con el cliente",
      propuesta: "NIT",
    });
  });

  test("una etiqueta genérica en EC propone RUC y suma la nota de identificador extranjero", () => {
    const campos = mapear(entrada(["Número de identificación fiscal"], "EC"));
    const generica = campo(campos, "Número de identificación fiscal");
    expect(generica).toMatchObject({
      regla: "etiqueta_generica",
      confianza: 0.5,
      estado: "requiere_confirmacion",
      propuesta: "RUC",
    });
    expect(generica.nota).toContain("Identificador extranjero");
    expect(generica.nota).toContain("el equivalente en EC es RUC");
  });

  test("normalización, clave directa y etiquetas sin fuente", () => {
    const campos = mapear(entrada(sinteticas, "CO"));
    expect(campo(campos, "RAZON SOCIAL:")).toMatchObject({
      ruta: "razon_social",
      regla: "glosario_normalizado",
      confianza: 0.95,
      estado: "lleno",
    });
    expect(campo(campos, "Teléfono *")).toMatchObject({ ruta: "telefono", regla: "glosario_normalizado" });
    expect(campo(campos, "Sitio web")).toMatchObject({
      ruta: "sitio_web",
      regla: "clave_directa",
      confianza: 0.85,
      estado: "lleno",
      valor: "https://www.periferia-ficticia.com",
    });
    for (const etiqueta of ["Gran contribuyente", "constructor", "toString", "__proto__"]) {
      expect(campo(campos, etiqueta)).toMatchObject({ ruta: null, estado: "faltante", valor: null });
    }
    expect(contarEstados(campos)).toEqual({ lleno: 3, faltante: 4, requiere_confirmacion: 1 });
  });

  test("una etiqueta escrita en NFD resuelve igual que en NFC", () => {
    const campos = mapear(entrada(["Razón social".normalize("NFD")], "CO"));
    expect(campos[0]).toMatchObject({ ruta: "razon_social", regla: "glosario_exacto", confianza: 1 });
  });

  test("el NIT de un cliente CO queda lleno y sin nota", () => {
    expect(mapear(entrada(["NIT"], "CO"))[0]).toMatchObject({ estado: "lleno", regla: "glosario_exacto" });
  });

  test("Ingresos anuales en CO no lleva nota de moneda", () => {
    expect(mapear(entrada(["Ingresos anuales"], "CO"))[0]).toMatchObject({
      nota: null,
      valor: "98000000000",
    });
  });
});

describe("umbral de confianza (D-19)", () => {
  function conUmbral(umbral: number): Reglas {
    return { ...reglas, confianza: { ...reglas.confianza, umbral } };
  }

  test("con umbral 0.85 la clave directa sigue llena y con 0.86 pide confirmación", () => {
    expect(mapear(entrada(["Sitio web"], "CO", { reglas: conUmbral(0.85) }))[0]?.estado).toBe("lleno");
    expect(mapear(entrada(["Sitio web"], "CO", { reglas: conUmbral(0.86) }))[0]?.estado).toBe(
      "requiere_confirmacion",
    );
  });

  test("con el umbral publicado, 1, 0.95 y 0.85 llenan y 0.6 y 0.5 piden confirmación", () => {
    const campos = mapear(entrada(["NIT", "RAZON SOCIAL:", "Sitio web", "Identificación tributaria"], "EC"));
    expect(campos.map((item) => [item.confianza, item.estado])).toEqual([
      [0.6, "requiere_confirmacion"],
      [0.95, "lleno"],
      [0.85, "lleno"],
      [0.5, "requiere_confirmacion"],
    ]);
  });
});

describe("notas de contexto como datos (D-36)", () => {
  test("una nota con una variable fuera de la lista permitida es REGLAS_INVALIDAS", () => {
    const rotas: Reglas = {
      ...reglas,
      notas_contexto: [{ ruta: "pais", aplica: "siempre", texto: "NIT {{nit}}" }],
    };
    const resultado = mapearCampos(entrada(["País"], "EC", { reglas: rotas }));
    expect(resultado.ok).toBe(false);
    if (resultado.ok) return;
    expect(resultado.codigo).toBe("REGLAS_INVALIDAS");
    expect(resultado.error).toContain("notas_contexto");
  });

  test("pais_emisor solo existe si el llamador lo entrega", () => {
    const conEmisor: Reglas = {
      ...reglas,
      notas_contexto: [{ ruta: "pais", aplica: "siempre", texto: "Emitido en {{pais_emisor}}" }],
    };
    expect(mapearCampos(entrada(["País"], "EC", { reglas: conEmisor })).ok).toBe(false);
    const campos = mapear(
      entrada(["País"], "EC", { reglas: conEmisor, variablesNota: { pais_emisor: "CO" } }),
    );
    expect(campos[0]?.nota).toBe("Emitido en CO");
  });

  test("las variables calculadas no se pueden suplantar desde variablesNota", () => {
    const campos = mapear(
      entrada(["Ingresos anuales"], "HN", { variablesNota: { moneda: "USD", ano: "1999", pais: "XX" } }),
    );
    expect(campos[0]?.nota).toBe("COP, año 2025");
  });
});
