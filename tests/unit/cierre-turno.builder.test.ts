import { describe, expect, test } from "bun:test";
import { PATRON_PREGUNTA } from "@/config/constants/patterns.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import { SALTO_DE_LINEA, SEPARADOR_PARRAFOS } from "@/config/constants/text.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { TEXTO_CHECKLIST, TEXTO_CIERRE } from "@/config/strings.ts";
import { cierreConPregunta, cierreDeterminista } from "@/domain/builders/cierre-turno.builder.ts";
import type { LlamadaResumida } from "@/domain/types/cierre-turno.type.ts";
import type { CasoPendiente } from "@/domain/types/compuerta.type.ts";

const EC = "ec-corp-andina";
const CO = "co-industrias-delta";

const PENDIENTE_EC: CasoPendiente = {
  caso: EC,
  bloqueos: ["ausente: certificado_cumplimiento_tributario"],
  motivos: [{ tipo: "certificado_cumplimiento_tributario", causa: ESTADO_SOPORTE.AUSENTE }],
};
const PENDIENTE_CO: CasoPendiente = { caso: CO, bloqueos: [], motivos: [] };

function sinMarkdown(texto: string): void {
  expect(texto).not.toContain("**");
  expect(texto).not.toContain("#");
  expect(texto).not.toContain("|");
}

describe("pregunta de confirmación: cierreConPregunta sin texto previo (ENV-03, D-41, D-44)", () => {
  test("un caso bloqueado nombra el caso y sus bloqueos legibles y termina en pregunta", () => {
    const texto = cierreConPregunta("", [PENDIENTE_EC]);
    expect(texto.endsWith("?")).toBe(true);
    expect(texto).toContain(EC);
    expect(texto).toContain(TEXTO_CHECKLIST.estado.bloqueado);
    expect(texto).toContain("Certificado de cumplimiento tributario");
    expect(texto).not.toContain("certificado_cumplimiento_tributario");
    sinMarkdown(texto);
  });

  test("un caso listo dice LISTO y termina en pregunta", () => {
    const texto = cierreConPregunta("", [PENDIENTE_CO]);
    expect(texto.endsWith("?")).toBe(true);
    expect(texto).toContain(CO);
    expect(texto).toContain(TEXTO_CHECKLIST.estado.listo);
    expect(texto).not.toContain(TEXTO_CHECKLIST.estado.bloqueado);
  });

  test("varios casos los lista todos, pide nombrar uno y termina en pregunta (D-40)", () => {
    const texto = cierreConPregunta("", [PENDIENTE_EC, PENDIENTE_CO]);
    expect(texto.endsWith("?")).toBe(true);
    expect(texto).toContain(EC);
    expect(texto).toContain(CO);
    expect(texto).toContain(TEXTO_CHECKLIST.estado.bloqueado);
    expect(texto).toContain(TEXTO_CHECKLIST.estado.listo);
    expect(texto).toContain("Certificado de cumplimiento tributario");
    expect(texto).not.toContain("certificado_cumplimiento_tributario");
    expect(texto).toContain("envía <caso>");
    sinMarkdown(texto);
  });
});

function llamada(herramienta: LlamadaResumida["herramienta"], caso: string, ok: boolean): LlamadaResumida {
  return { herramienta, caso, ok, resumen: ok ? `${caso}: resumen de ${herramienta}` : null };
}

describe("cierreDeterminista (D-53)", () => {
  test("lista lo completado y el siguiente paso canónico del caso", () => {
    const llamadas = [
      llamada(HERRAMIENTA.LEER_SOLICITUD, CO, true),
      llamada(HERRAMIENTA.MAPEAR_CAMPOS, CO, true),
      llamada(HERRAMIENTA.GENERAR_FORMULARIO, CO, true),
    ];
    const texto = cierreDeterminista(llamadas);
    for (const { resumen } of llamadas) expect(texto).toContain(resumen ?? "");
    expect(texto).toContain(NOMBRE_VISIBLE[HERRAMIENTA.ARMAR_PAQUETE]);
    expect(texto).toContain(CO);
    expect(texto.indexOf("Completé")).toBeLessThan(texto.indexOf("Falta"));
    sinMarkdown(texto);
  });

  test("tras armar el paquete el paso que falta es confirmar el envío", () => {
    const texto = cierreDeterminista([
      llamada(HERRAMIENTA.GENERAR_FORMULARIO, EC, true),
      llamada(HERRAMIENTA.ARMAR_PAQUETE, EC, true),
    ]);
    expect(texto).toContain(TEXTO_CIERRE.siguientePaso[HERRAMIENTA.SIMULAR_ENVIO](EC));
  });

  test("una llamada fallida no cuenta como completada ni avanza el paso", () => {
    const texto = cierreDeterminista([
      llamada(HERRAMIENTA.LEER_SOLICITUD, CO, true),
      llamada(HERRAMIENTA.MAPEAR_CAMPOS, CO, false),
    ]);
    expect(texto).toContain(TEXTO_CIERRE.siguientePaso[HERRAMIENTA.MAPEAR_CAMPOS](CO));
  });

  test("un caso con el envío registrado no deja pasos pendientes", () => {
    const texto = cierreDeterminista([llamada(HERRAMIENTA.SIMULAR_ENVIO, EC, true)]);
    expect(texto).not.toContain("Falta");
  });

  test("sin llamadas devuelve el texto sin pasos", () => {
    expect(cierreDeterminista([])).toBe(TEXTO_CIERRE.sinPasos);
  });
});

const FILAS_CIERRE: readonly (readonly [string, string, string])[] = [
  ["texto sin pregunta", "Armé el paquete.", "Armé el paquete."],
  ["párrafo final de pregunta", `Armé el paquete.\n\n¿Confirmas el envío de ${EC}?`, "Armé el paquete."],
  [
    "línea final de pregunta dentro del párrafo",
    "Armé el paquete.\nQueda BLOQUEADO.\n¿Lo envío?",
    "Armé el paquete.\nQueda BLOQUEADO.",
  ],
  ["corte en fin de oración", "Estado: BLOQUEADO. ¿Confirmas el envío?", "Estado: BLOQUEADO."],
  [
    "corte con texto tras la pregunta",
    "Estado: BLOQUEADO. ¿Confirmas el envío? Avísame.",
    "Estado: BLOQUEADO.",
  ],
  ["pregunta sin signo de apertura", "Estado: BLOQUEADO. Confirmas el envío?", "Estado: BLOQUEADO."],
  ["cláusula antes de la pregunta", "Listo. Si te parece, ¿lo envío?", "Listo."],
  [
    "pregunta entre paréntesis",
    "Generé el formulario.\nRevisa el RUC (¿es el correcto?).",
    "Generé el formulario.",
  ],
  [
    "pregunta a mitad de oración",
    "Generé el formulario.\nSi te parece bien, ¿lo envío?",
    "Generé el formulario.",
  ],
  [
    "número decimal no es fin de oración",
    "Generé el formulario.\nRevisa la versión 2.1, ¿la envío?",
    "Generé el formulario.",
  ],
  [
    "punto pegado al signo no es fin de oración",
    "Generé el formulario.\nEstado: BLOQUEADO.¿Lo envío?",
    "Generé el formulario.",
  ],
  [
    "dos líneas finales de pregunta",
    "Generé el formulario.\n¿Lo reviso?\n¿Lo envío?",
    "Generé el formulario.",
  ],
  [
    "línea de pregunta sin signo de apertura",
    "Generé el formulario.\nConfirmas el envío?",
    "Generé el formulario.",
  ],
  ["corte en exclamación", "¡Listo! ¿Lo envío?", "¡Listo!"],
  ["líneas en blanco al final", "Armé el paquete.\n\n¿Lo envío?\n\n", "Armé el paquete."],
  ["solo una pregunta", "¿Confirmas el envío?", ""],
  ["texto vacío", "", ""],
  ["texto con solo espacios", "   \n  ", ""],
  [
    "pregunta en una línea anterior seguida de una afirmación",
    "¿Revisaste el RUC?\nArmé el paquete.",
    "¿Revisaste el RUC?\nArmé el paquete.",
  ],
];

function cierreEsperado(previo: string, pregunta: string): string {
  return previo === "" ? pregunta : `${previo}${SEPARADOR_PARRAFOS}${pregunta}`;
}

function textoPrevio(resultado: string, pregunta: string): string {
  return resultado.slice(0, Math.max(0, resultado.length - pregunta.length)).trimEnd();
}

describe("cierreConPregunta (D-44, CR-02)", () => {
  test.each(FILAS_CIERRE)("sin casos pendientes deja el texto intacto: %s", (_nombre, texto) => {
    expect(cierreConPregunta(texto, [])).toBe(texto);
  });

  test.each(FILAS_CIERRE)(
    "con un caso pendiente quita la pregunta final del modelo: %s",
    (_nombre, texto, previo) => {
      const pregunta = cierreConPregunta("", [PENDIENTE_EC]);
      expect(cierreConPregunta(texto, [PENDIENTE_EC])).toBe(cierreEsperado(previo, pregunta));
    },
  );

  test("la pregunta entre paréntesis y la de mitad de oración nunca dejan fragmentos", () => {
    const parentesis = cierreConPregunta("Generé el formulario.\nRevisa el RUC (¿es el correcto?).", [
      PENDIENTE_EC,
    ]);
    const mitad = cierreConPregunta("Generé el formulario.\nSi te parece bien, ¿lo envío?", [PENDIENTE_EC]);
    expect(parentesis).not.toContain("Revisa el RUC (");
    expect(mitad).not.toContain("Si te parece bien,");
  });

  test.each([
    ["un caso", [PENDIENTE_EC]],
    ["varios casos", [PENDIENTE_EC, PENDIENTE_CO]],
  ] as const)("el último párrafo es exactamente la pregunta del servidor con %s", (_nombre, pendientes) => {
    const pregunta = cierreConPregunta("", pendientes);
    for (const [, texto] of FILAS_CIERRE) {
      expect(cierreConPregunta(texto, pendientes).split(SEPARADOR_PARRAFOS).at(-1)).toBe(pregunta);
    }
  });

  test.each(FILAS_CIERRE)(
    "el texto que queda antes de la pregunta no está mutilado: %s",
    (_nombre, texto) => {
      const pregunta = cierreConPregunta("", [PENDIENTE_EC]);
      const previo = textoPrevio(cierreConPregunta(texto, [PENDIENTE_EC]), pregunta);
      if (previo === "") return;
      const ultima = previo.split(SALTO_DE_LINEA).at(-1) ?? "";
      expect(ultima).not.toMatch(PATRON_PREGUNTA);
      const intacta = texto.split(SALTO_DE_LINEA).includes(ultima);
      expect(intacta || ultima.endsWith(".") || ultima.endsWith("!")).toBe(true);
    },
  );
});
