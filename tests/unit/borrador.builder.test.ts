import { describe, expect, test } from "bun:test";
import { FORMATO } from "@/config/constants/forms.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { construirDatosBorrador, construirDatosEnvio } from "@/domain/builders/borrador.builder.ts";
import type { CampoPorConfirmar, Checklist } from "@/domain/types/checklist.type.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { Formato, Solicitud } from "@/domain/types/solicitud.type.ts";
import type { SoporteEvaluado } from "@/domain/types/soportes.type.ts";

const CASO = "zz-caso-ficticio";
const FORMULARIO_XLSX = "formulario.xlsx";
const FORMULARIO_PORTAL = "valores-portal.md";
const INTERNOS = ["checklist.md", "borrador-correo.md"];
const POR_CONFIRMAR: readonly CampoPorConfirmar[] = [
  { etiqueta: "Identificador ficticio", nota: "Nota ficticia uno" },
  { etiqueta: "Otro campo ficticio", nota: "Nota ficticia dos" },
];
const CLAVES_BORRADOR = [
  "para",
  "asunto",
  "cliente",
  "razon_social",
  "firmante_nombre",
  "firmante_cargo",
  "formulario",
  "adjunta_formulario",
  "soportes_adjuntos",
  "por_confirmar",
  "hay_por_confirmar",
  "pendientes",
  "hay_pendientes",
  "firma_lista",
  "firma_tras_confirmar",
  "firma_bloqueada",
].sort();

const MAESTRO: Maestro = {
  razon_social: "Empresa Ficticia S.A.S.",
  nit: "000000000",
  contacto_financiero: { nombre: "Persona Ficticia", cargo: "Cargo Ficticio" },
  banco: { nombre: "Banco Ficticio", numero_cuenta: "0000000000" },
};

function soporte(tipo: string, estado: SoporteEvaluado["estado"], archivo: string | null): SoporteEvaluado {
  return {
    tipo,
    estado,
    vigencia_hasta: null,
    archivo,
    aviso: null,
    pais_emisor: null,
    aviso_emisor: null,
  };
}

const SOPORTES: readonly SoporteEvaluado[] = [
  soporte("rut", ESTADO_SOPORTE.PRESENTE, "rut-ficticio.txt"),
  soporte("camara_comercio", ESTADO_SOPORTE.PRESENTE, "camara-ficticia.txt"),
  soporte("parafiscales", ESTADO_SOPORTE.VENCIDO, "parafiscales-ficticio.txt"),
  soporte("certificado_tributario", ESTADO_SOPORTE.AUSENTE, null),
];

function solicitud(formato: Formato): Solicitud {
  return {
    id: "SOL-FICTICIA",
    de: "compras@cliente-ficticio.example",
    para: "proveedores@ficticio.example",
    asunto: "Solicitud ficticia",
    fecha: "2026-09-01",
    pais: "CO",
    cliente: "Cliente Ficticio",
    formato,
    cuerpo: "Cuerpo ficticio",
    adjuntos: [],
  };
}

function checklist(listo: boolean, porConfirmar: readonly CampoPorConfirmar[]): Checklist {
  return {
    fecha_ejecucion: "2026-09-03",
    listo_para_firma: listo,
    bloqueos: listo ? [] : ["vencido: parafiscales"],
    soportes: SOPORTES,
    faltantes: [],
    requiere_confirmacion: porConfirmar,
  };
}

function borrador(
  listo: boolean,
  porConfirmar: readonly CampoPorConfirmar[],
  formato: Formato = FORMATO.XLSX,
) {
  return construirDatosBorrador(solicitud(formato), MAESTRO, checklist(listo, porConfirmar), FORMULARIO_XLSX);
}

describe("construirDatosBorrador: estado de firma (GC-1, G-01-H4b)", () => {
  test("listo y sin campos por confirmar solo activa firma_lista", () => {
    const datos = borrador(true, []);
    expect(datos.firma_lista).toEqual([{}]);
    expect(datos.firma_tras_confirmar).toEqual([]);
    expect(datos.firma_bloqueada).toEqual([]);
    expect(datos.hay_por_confirmar).toEqual([]);
    expect(datos.por_confirmar).toEqual([]);
  });

  test("listo con campos por confirmar solo activa firma_tras_confirmar y lista las preguntas en orden", () => {
    const datos = borrador(true, POR_CONFIRMAR);
    expect(datos.firma_lista).toEqual([]);
    expect(datos.firma_tras_confirmar).toEqual([{}]);
    expect(datos.firma_bloqueada).toEqual([]);
    expect(datos.hay_por_confirmar).toEqual([{}]);
    expect(datos.por_confirmar).toEqual([
      { etiqueta: "Identificador ficticio", nota: "Nota ficticia uno" },
      { etiqueta: "Otro campo ficticio", nota: "Nota ficticia dos" },
    ]);
  });

  test("bloqueado sin campos por confirmar solo activa firma_bloqueada", () => {
    const datos = borrador(false, []);
    expect(datos.firma_lista).toEqual([]);
    expect(datos.firma_tras_confirmar).toEqual([]);
    expect(datos.firma_bloqueada).toEqual([{}]);
  });

  test("bloqueado con campos por confirmar solo activa firma_bloqueada y conserva las preguntas", () => {
    const datos = borrador(false, POR_CONFIRMAR);
    expect(datos.firma_lista).toEqual([]);
    expect(datos.firma_tras_confirmar).toEqual([]);
    expect(datos.firma_bloqueada).toEqual([{}]);
    expect(datos.hay_por_confirmar).toEqual([{}]);
    expect(datos.por_confirmar).toHaveLength(POR_CONFIRMAR.length);
  });

  test("en las cuatro combinaciones hay exactamente una bandera de firma activa", () => {
    for (const listo of [true, false]) {
      for (const porConfirmar of [[], POR_CONFIRMAR]) {
        const datos = borrador(listo, porConfirmar);
        const activas = [datos.firma_lista, datos.firma_tras_confirmar, datos.firma_bloqueada].filter(
          (bandera) => bandera.length > 0,
        );
        expect(activas).toHaveLength(1);
      }
    }
  });
});

describe("construirDatosBorrador: formulario adjunto y lista blanca (GC-1, RN2, D-25)", () => {
  test("xlsx y pdf adjuntan el formulario y portal no", () => {
    expect(borrador(true, [], FORMATO.XLSX).adjunta_formulario).toEqual([{}]);
    expect(borrador(true, [], FORMATO.PDF).adjunta_formulario).toEqual([{}]);
    expect(borrador(true, [], FORMATO.PORTAL).adjunta_formulario).toEqual([]);
  });

  test("el contexto tiene exactamente las claves permitidas y ningún dato bancario", () => {
    const datos = borrador(true, POR_CONFIRMAR);
    expect(Object.keys(datos).sort()).toEqual(CLAVES_BORRADOR);
    const serializado = JSON.stringify(datos);
    expect(serializado).not.toContain("Banco Ficticio");
    expect(serializado).not.toContain("0000000000");
    expect(serializado).not.toContain("000000000");
  });
});

describe("construirDatosEnvio: archivos que van al cliente (GC-3, G-01-H4a)", () => {
  const LISTADO = [
    "borrador-correo.md",
    "camara-ficticia.txt",
    "checklist.md",
    FORMULARIO_XLSX,
    "parafiscales-ficticio.txt",
    "rut-ficticio.txt",
    FORMULARIO_PORTAL,
  ];

  test("xlsx envía el formulario y los soportes presentes en el orden del listado", () => {
    const datos = construirDatosEnvio(
      CASO,
      solicitud(FORMATO.XLSX),
      checklist(true, []),
      FORMULARIO_XLSX,
      LISTADO,
    );
    expect(datos.archivos).toEqual([
      { archivo: "camara-ficticia.txt" },
      { archivo: FORMULARIO_XLSX },
      { archivo: "rut-ficticio.txt" },
    ]);
    expect(datos.formulario_en_portal).toEqual([]);
  });

  test("los archivos internos del listado nunca salen como enviados", () => {
    const datos = construirDatosEnvio(
      CASO,
      solicitud(FORMATO.XLSX),
      checklist(true, []),
      FORMULARIO_XLSX,
      LISTADO,
    );
    const enviados = datos.archivos.map((fila) => fila.archivo);
    for (const interno of INTERNOS) expect(enviados).not.toContain(interno);
  });

  test("portal no envía el archivo de valores y activa formulario_en_portal", () => {
    const datos = construirDatosEnvio(
      CASO,
      solicitud(FORMATO.PORTAL),
      checklist(true, []),
      FORMULARIO_PORTAL,
      LISTADO,
    );
    expect(datos.archivos).toEqual([{ archivo: "camara-ficticia.txt" }, { archivo: "rut-ficticio.txt" }]);
    expect(datos.formulario).toBe(FORMULARIO_PORTAL);
    expect(datos.formulario_en_portal).toEqual([{}]);
  });

  test("un soporte vencido va solo a retenidos", () => {
    const datos = construirDatosEnvio(
      CASO,
      solicitud(FORMATO.XLSX),
      checklist(false, []),
      FORMULARIO_XLSX,
      LISTADO,
    );
    expect(datos.retenidos).toEqual([{ archivo: "parafiscales-ficticio.txt" }]);
    expect(datos.archivos.map((fila) => fila.archivo)).not.toContain("parafiscales-ficticio.txt");
  });

  test("un archivo del cliente que no está en el listado no se declara enviado", () => {
    const datos = construirDatosEnvio(CASO, solicitud(FORMATO.XLSX), checklist(true, []), FORMULARIO_XLSX, [
      FORMULARIO_XLSX,
    ]);
    expect(datos.archivos).toEqual([{ archivo: FORMULARIO_XLSX }]);
  });
});
