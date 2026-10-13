import { describe, expect, test } from "bun:test";
import { FORMATO } from "@/config/constants/forms.constants.ts";
import { ESTADO_CAMPO, REGLA_MAPEO } from "@/config/constants/mapping.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { TEXTO_BORRADOR } from "@/config/strings.ts";
import { construirDatosBorrador, construirDatosEnvio } from "@/domain/builders/borrador.builder.ts";
import { construirChecklist } from "@/domain/builders/checklist.builder.ts";
import type { CampoPorConfirmar, Checklist } from "@/domain/types/checklist.type.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { CampoMapeado } from "@/domain/types/mapeo.type.ts";
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
const FALTANTES = ["Dato ficticio sin fuente"];
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
  "con_aviso_emisor",
  "hay_aviso_emisor",
  "campos_sin_dato",
  "hay_campos_sin_dato",
  "soportes_pendientes",
  "hay_soportes_pendientes",
  "firma_lista",
  "firma_tras_confirmar",
  "firma_tras_validar",
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

function checklist(
  listo: boolean,
  porConfirmar: readonly CampoPorConfirmar[],
  faltantes: readonly string[] = [],
  internas: readonly string[] = [],
): Checklist {
  return {
    fecha_ejecucion: "2026-09-03",
    listo_para_firma: listo,
    bloqueos: listo ? [] : ["vencido: parafiscales (2026-08-31)"],
    motivos_bloqueo: listo
      ? []
      : [{ tipo: "parafiscales", causa: ESTADO_SOPORTE.VENCIDO, vigencia: "2026-08-31" }],
    soportes: SOPORTES,
    faltantes,
    requiere_confirmacion: porConfirmar,
    confirmaciones_al_cliente: porConfirmar.map((campo) => campo.etiqueta),
    confirmaciones_internas: internas,
  };
}

function borrador(
  listo: boolean,
  porConfirmar: readonly CampoPorConfirmar[],
  formato: Formato = FORMATO.XLSX,
  faltantes: readonly string[] = [],
  internas: readonly string[] = [],
) {
  return construirDatosBorrador(
    solicitud(formato),
    MAESTRO,
    checklist(listo, porConfirmar, faltantes, internas),
    FORMULARIO_XLSX,
  );
}

function banderasActivas(datos: ReturnType<typeof borrador>) {
  return [
    datos.firma_lista,
    datos.firma_tras_confirmar,
    datos.firma_tras_validar,
    datos.firma_bloqueada,
  ].filter((bandera) => bandera.length > 0);
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
      { etiqueta: "Identificador ficticio" },
      { etiqueta: "Otro campo ficticio" },
    ]);
  });

  test("las notas internas para la analista nunca llegan al contexto del borrador (WR-02)", () => {
    const serializado = JSON.stringify(borrador(true, POR_CONFIRMAR));
    expect(serializado).not.toContain("Nota ficticia uno");
    expect(serializado).not.toContain("Nota ficticia dos");
  });

  test("un campo bancario por confirmar no se le pregunta al cliente (WR-02, RN2)", () => {
    const bancario = { etiqueta: "Cuenta ficticia", nota: "Nota bancaria ficticia" };
    const base = checklist(true, [...POR_CONFIRMAR, bancario]);
    const datos = construirDatosBorrador(
      solicitud(FORMATO.XLSX),
      MAESTRO,
      {
        ...base,
        confirmaciones_al_cliente: POR_CONFIRMAR.map((campo) => campo.etiqueta),
        confirmaciones_internas: [bancario.etiqueta],
      },
      FORMULARIO_XLSX,
    );
    expect(datos.por_confirmar.map((campo) => campo.etiqueta)).not.toContain("Cuenta ficticia");
    expect(JSON.stringify(datos)).not.toContain("Nota bancaria ficticia");
    expect(datos.firma_tras_confirmar).toEqual([{}]);
    expect(datos.firma_tras_validar).toEqual([]);
  });

  test("si el único campo por confirmar es bancario no declara el formulario listo para la firma (WR-01)", () => {
    const campo: CampoMapeado = {
      etiqueta: "Número de cuenta",
      ruta: "banco.numero_cuenta",
      estado: ESTADO_CAMPO.REQUIERE_CONFIRMACION,
      regla: REGLA_MAPEO.CLAVE_DIRECTA,
      confianza: 0.5,
      valor: null,
      nota: "Nota bancaria ficticia",
      propuesta: null,
    };
    const listo = construirChecklist(
      [soporte("rut", ESTADO_SOPORTE.PRESENTE, "rut-ficticio.txt")],
      [campo],
      "2026-09-03",
    );
    const datos = construirDatosBorrador(solicitud(FORMATO.XLSX), MAESTRO, listo, FORMULARIO_XLSX);
    expect(listo.listo_para_firma).toBe(true);
    expect(datos.firma_lista).toEqual([]);
    expect(datos.firma_tras_confirmar).toEqual([]);
    expect(datos.firma_tras_validar).toEqual([{}]);
    expect(datos.hay_por_confirmar).toEqual([]);
    expect(JSON.stringify(datos)).not.toContain("Número de cuenta");
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

  test("en las dieciséis combinaciones hay exactamente una bandera de firma activa", () => {
    for (const listo of [true, false]) {
      for (const porConfirmar of [[], POR_CONFIRMAR]) {
        for (const faltantes of [[], FALTANTES]) {
          for (const internas of [[], ["Cuenta ficticia"]]) {
            const datos = borrador(listo, porConfirmar, FORMATO.XLSX, faltantes, internas);
            expect(banderasActivas(datos)).toHaveLength(1);
            if (internas.length > 0) expect(datos.firma_lista).toEqual([]);
          }
        }
      }
    }
  });
});

describe("construirDatosBorrador: campos sin dato separados de los soportes pendientes (WR-01)", () => {
  test("listo con campos faltantes no declara el formulario listo y pide confirmar antes de la firma", () => {
    const datos = borrador(true, [], FORMATO.XLSX, FALTANTES);
    expect(datos.firma_lista).toEqual([]);
    expect(datos.firma_tras_confirmar).toEqual([{}]);
    expect(datos.firma_bloqueada).toEqual([]);
    expect(datos.hay_campos_sin_dato).toEqual([{}]);
    expect(datos.campos_sin_dato).toEqual([{ etiqueta: "Dato ficticio sin fuente" }]);
  });

  test("los campos faltantes nunca entran en los soportes pendientes", () => {
    for (const listo of [true, false]) {
      const datos = borrador(listo, POR_CONFIRMAR, FORMATO.XLSX, FALTANTES);
      const textos = datos.soportes_pendientes.map((pendiente) => pendiente.texto);
      expect(textos).not.toContain("Dato ficticio sin fuente");
      expect(datos.campos_sin_dato).toEqual([{ etiqueta: "Dato ficticio sin fuente" }]);
    }
  });

  test("sin campos faltantes la sección de campos sin dato queda apagada", () => {
    const datos = borrador(false, []);
    expect(datos.hay_campos_sin_dato).toEqual([]);
    expect(datos.campos_sin_dato).toEqual([]);
    expect(datos.hay_soportes_pendientes).toEqual([{}]);
  });

  test("bloqueado con campos faltantes activa solo firma_bloqueada", () => {
    const datos = borrador(false, [], FORMATO.XLSX, FALTANTES);
    expect(datos.firma_lista).toEqual([]);
    expect(datos.firma_tras_confirmar).toEqual([]);
    expect(datos.firma_bloqueada).toEqual([{}]);
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

  test("como defensa, un archivo del cliente que no está en el listado nunca se declara enviado", () => {
    const datos = construirDatosEnvio(CASO, solicitud(FORMATO.XLSX), checklist(true, []), FORMULARIO_XLSX, [
      FORMULARIO_XLSX,
    ]);
    expect(datos.archivos).toEqual([{ archivo: FORMULARIO_XLSX }]);
  });
});

describe("nombres de soporte con tipos desconocidos (GC-2, G-01-H4c)", () => {
  const DESCONOCIDOS = ["zz_desconocido", "constructor", "__proto__"];

  function checklistCon(soportes: readonly SoporteEvaluado[]): Checklist {
    return construirChecklist(soportes, [], "2026-09-03");
  }

  function vencido(tipo: string): SoporteEvaluado {
    return { ...soporte(tipo, ESTADO_SOPORTE.VENCIDO, `${tipo}-ficticio.txt`), vigencia_hasta: "2026-08-31" };
  }

  test("construirDatosEnvio deja el id crudo en el bloqueo de un tipo desconocido", () => {
    for (const tipo of DESCONOCIDOS) {
      const datos = construirDatosEnvio(
        CASO,
        solicitud(FORMATO.XLSX),
        checklistCon([soporte(tipo, ESTADO_SOPORTE.AUSENTE, null), vencido(tipo)]),
        FORMULARIO_XLSX,
        [],
      );
      expect(datos.bloqueos).toEqual([
        { bloqueo: `ausente: ${tipo}` },
        { bloqueo: `vencido: ${tipo} (2026-08-31)` },
      ]);
    }
  });

  test("construirDatosEnvio nombra en español los bloqueos de tipos conocidos", () => {
    const datos = construirDatosEnvio(
      CASO,
      solicitud(FORMATO.XLSX),
      checklistCon([
        soporte("certificado_cumplimiento_tributario", ESTADO_SOPORTE.AUSENTE, null),
        vencido("parafiscales"),
      ]),
      FORMULARIO_XLSX,
      [],
    );
    expect(datos.bloqueos).toEqual([
      { bloqueo: "ausente: Certificado de cumplimiento tributario" },
      { bloqueo: "vencido: Certificación de aportes parafiscales (2026-08-31)" },
    ]);
  });

  test("construirDatosBorrador deja el id crudo en adjuntos y pendientes de un tipo desconocido", () => {
    for (const tipo of DESCONOCIDOS) {
      const datos = construirDatosBorrador(
        solicitud(FORMATO.XLSX),
        MAESTRO,
        checklistCon([
          soporte(tipo, ESTADO_SOPORTE.PRESENTE, "adjunto-ficticio.txt"),
          soporte(tipo, ESTADO_SOPORTE.AUSENTE, null),
          vencido(tipo),
        ]),
        FORMULARIO_XLSX,
      );
      expect(datos.soportes_adjuntos).toEqual([{ nombre: tipo, archivo: "adjunto-ficticio.txt" }]);
      expect(datos.soportes_pendientes).toEqual([
        { texto: tipo },
        { texto: TEXTO_BORRADOR.pendienteVencido(tipo) },
      ]);
    }
  });

  test("construirDatosBorrador nombra en español adjuntos y pendientes de tipos conocidos", () => {
    const datos = construirDatosBorrador(
      solicitud(FORMATO.XLSX),
      MAESTRO,
      checklistCon([
        soporte("rut", ESTADO_SOPORTE.PRESENTE, "rut-ficticio.txt"),
        soporte("certificado_cumplimiento_tributario", ESTADO_SOPORTE.AUSENTE, null),
        vencido("parafiscales"),
      ]),
      FORMULARIO_XLSX,
    );
    expect(datos.soportes_adjuntos).toEqual([
      { nombre: "Registro Único Tributario", archivo: "rut-ficticio.txt" },
    ]);
    expect(datos.soportes_pendientes).toEqual([
      { texto: "Certificado de cumplimiento tributario" },
      { texto: TEXTO_BORRADOR.pendienteVencido("Certificación de aportes parafiscales") },
    ]);
  });
});

describe("construirDatosBorrador: soportes emitidos en otro país (IN-04)", () => {
  function conEmisor(
    tipo: string,
    estado: SoporteEvaluado["estado"],
    archivo: string | null,
    aviso: string | null,
  ): SoporteEvaluado {
    return { ...soporte(tipo, estado, archivo), pais_emisor: "CO", aviso_emisor: aviso };
  }

  test("pregunta al cliente solo por los adjuntos con aviso de emisor y no declara el formulario listo", () => {
    const soportes = [
      conEmisor("rut", ESTADO_SOPORTE.PRESENTE, "rut-ficticio.txt", "Aviso ficticio"),
      conEmisor("camara_comercio", ESTADO_SOPORTE.PRESENTE, "camara-ficticia.txt", null),
      conEmisor("parafiscales", ESTADO_SOPORTE.VENCIDO, "parafiscales-ficticio.txt", "Aviso ficticio"),
    ];
    const datos = construirDatosBorrador(
      solicitud(FORMATO.XLSX),
      MAESTRO,
      { ...checklist(true, []), soportes },
      FORMULARIO_XLSX,
    );
    expect(datos.con_aviso_emisor).toEqual([{ nombre: "Registro Único Tributario", pais_emisor: "CO" }]);
    expect(datos.hay_aviso_emisor).toEqual([{}]);
    expect(datos.firma_lista).toEqual([]);
    expect(datos.firma_tras_confirmar).toEqual([{}]);
  });

  test("sin avisos de emisor la sección queda apagada", () => {
    const datos = borrador(true, []);
    expect(datos.con_aviso_emisor).toEqual([]);
    expect(datos.hay_aviso_emisor).toEqual([]);
    expect(datos.firma_lista).toEqual([{}]);
  });
});
