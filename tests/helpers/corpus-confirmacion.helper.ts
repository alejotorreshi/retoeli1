import { DECISION_CONFIRMACION } from "@/config/constants/confirmation.constants.ts";
import {
  PATRON_NO_PALABRA,
  PATRON_PREGUNTA,
  PATRON_SLUG_EN_TEXTO,
} from "@/config/constants/patterns.constants.ts";
import type { DecisionConfirmacion } from "@/domain/types/confirmacion.type.ts";
import { sinDiacriticos } from "@/domain/utils/normalizar.util.ts";

export const PALABRAS_DENTRO_DE_FRASE: readonly string[] = [
  "no",
  "para",
  "luego",
  "después",
  "mejor",
  "momento",
  "nada",
  "aún",
  "todavía",
  "ni",
];

export const CONECTORES_DE_CABEZA: readonly string[] = PALABRAS_DENTRO_DE_FRASE.filter(
  (palabra) => palabra !== "no",
);

const PREGUNTAS: readonly string[] = [
  "¿qué falta?",
  "¿qué sigue?",
  "¿cuál es el NIT?",
  "¿me das el NIT?",
  "¿me muestras el checklist?",
  "¿qué hago?",
];

const PREGUNTAS_SIN_APERTURA: readonly string[] = [
  "qué falta?",
  "qué sigue?",
  "cuál es el NIT?",
  "qué hago?",
];

const PEDIDOS_SIN_CASO: readonly string[] = [
  "dame el NIT",
  "revisa el NIT",
  "muéstrame el checklist",
  "dime qué falta",
];

const PEDIDOS_CON_CASO: readonly string[] = [
  "procesa pe-andes",
  "lee la solicitud de pe-andes",
  "consulta el NIT de co-industrias-delta",
];

const CASOS: readonly string[] = ["pe-andes", "co-industrias-delta", "ec-corp-andina"];

const NOMINALES: readonly string[] = [
  "el paquete",
  "el NIT",
  "la de ec-corp-andina",
  "el caso pe-andes",
  "el checklist",
  "el RUC",
];

const PRETERITOS: readonly string[] = ["envié", "mandé", "despaché", "confirmé", "autoricé"];

const GENERICOS: readonly string[] = ["hagas", "confirmo", "confirmes", "autorizo", "autorices"];

const OBJETOS_AJENOS: readonly string[] = [
  "el PDF",
  "el NIT",
  "que el RUC esté bien",
  "así, usa el NIT del maestro",
  "el xlsx primero",
];

const NEGADORES_DE_ENVIO: readonly string[] = ["no", "nunca", "jamás", "tampoco"];
const PRONOMBRES_DE_ENVIO: readonly string[] = ["", "lo ", "me lo ", "se lo "];
const SUBJUNTIVOS_DE_ENVIO: readonly string[] = ["envíes", "envíe", "envíen", "mandes", "mande", "despaches"];
const COLAS_DE_ENVIO: readonly string[] = [
  "",
  " todavía",
  " nada todavía",
  ", ¿qué falta?",
  " aún, ¿puedes revisar el NIT?",
  ". Procesa pe-andes.",
];
const COLAS_GENERICAS: readonly string[] = ["", " todavía", " el envío", ", ¿qué falta?"];
const MODALES: readonly string[] = [
  "no quiero",
  "no queremos",
  "no puedo",
  "no vayas a",
  "ni se te ocurra",
  "no se te ocurra",
  "no lo quiero",
];
const INFINITIVOS: readonly string[] = [
  "enviarlo",
  "enviar",
  "mandarlo",
  "confirmar",
  "confirmarlo",
  "autorizarlo",
];
const COLAS_MODALES: readonly string[] = ["", " todavía", " aún"];

const RESPUESTAS_SUELTAS: readonly string[] = [
  "no",
  "todavía no",
  "aún no",
  "ahora no",
  "por ahora no",
  "mejor no",
  "espera",
  "espera un momento",
  "un momento",
  "espera un momento por favor",
  "cancela",
  "cancela el envío",
  "cancela el envío de ec-corp-andina",
  "cancela ec-corp-andina",
  "no, gracias",
  "no, por favor",
  "Para.",
  "mejor después",
  "luego",
  "después",
  "¡No!",
  "alto",
  "detente",
  "aguarda",
  "nunca",
  "jamás",
  "aún no, espera",
  "todavía no, gracias",
];

const ESPERAS: readonly string[] = [
  "No",
  "Todavía no",
  "Aún no",
  "Espera",
  "Espera un momento",
  "Mejor no",
  "Ahora no",
  "Alto",
  "Cancela",
];

const CASO_PENDIENTE = "ec-corp-andina";
const COLAS_DEL_SERVIDOR: readonly string[] = [
  " el envío simulado",
  ` el envío simulado de ${CASO_PENDIENTE}`,
  " la confirmación",
];
const COLAS_DE_MOTIVO: readonly string[] = [
  " porque falta el certificado",
  ": falta el certificado",
  " hasta tener el certificado",
  " sin el certificado",
  " pues falta el certificado",
  " mientras falta el certificado",
];
const CANCELACIONES_DE_ENVIO: readonly string[] = ["cancela", "detén"];
const COLAS_DE_CANCELACION: readonly string[] = [
  "",
  " el envío",
  " el envío simulado",
  " la confirmación",
  ` el envío de ${CASO_PENDIENTE}`,
  " porque falta el certificado",
  ": falta el certificado",
];

const CONFIRMACIONES: readonly string[] = [
  "sí",
  "envía",
  "ok",
  "listo",
  "dale",
  "confirmo",
  "sí, envía",
  "envía ec-corp-andina",
  "si",
  "procede",
];

export const NEGACIONES_10A43AD: ReadonlySet<string> = new Set([
  "no",
  "nunca",
  "jamas",
  "tampoco",
  "ni",
  "nada",
  "todavia",
  "aun",
  "espera",
  "esperes",
  "esperemos",
  "espere",
  "cancela",
  "cancelar",
  "cancelo",
  "cancelado",
  "detente",
  "deten",
  "para",
  "alto",
  "momento",
  "luego",
  "despues",
  "mejor",
  "aguarda",
]);

function mayuscula(texto: string): string {
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

function minuscula(texto: string): string {
  return texto.charAt(0).toLowerCase() + texto.slice(1);
}

function sinApertura(pregunta: string): string {
  return pregunta.replace("¿", "");
}

export function nuncaCancelanDentro(p: string): readonly string[] {
  const P = mayuscula(p);
  return [
    ...PEDIDOS_SIN_CASO.flatMap((pedido) =>
      NOMINALES.flatMap((nominal) => [`${pedido}, ${p} ${nominal}`, `${pedido} ${p} ${nominal}`]),
    ),
    ...PEDIDOS_CON_CASO.flatMap((pedido) =>
      CASOS.flatMap((caso) => [`${pedido}, ${p} ${caso}`, `${pedido} ${p} ${caso}`]),
    ),
    ...CASOS.flatMap((caso) =>
      PREGUNTAS.flatMap((pregunta) => [
        `${P} ${caso}, ${pregunta}`,
        `${P} el caso ${caso}, ${pregunta}`,
        `${P} ${caso} ${pregunta}`,
        `Y ${p} el caso ${caso}, ${pregunta}`,
      ]),
    ),
    ...PEDIDOS_CON_CASO.flatMap((pedido) => [`${P}, ${pedido}`, `${P}. ${mayuscula(pedido)}.`]),
    ...CASOS.map((caso) => `${P}, el de ${caso}`),
    `¿${p}?`,
    `¿y ${p}?`,
    `¿${p} qué falta?`,
    `¿qué falta ${p}?`,
    `¿${p} hay nada más?`,
  ];
}

export function nuncaCancelanCabeza(c: string): readonly string[] {
  const C = mayuscula(c);
  return [
    ...PREGUNTAS.flatMap((pregunta) => [
      `${C}, ${pregunta}`,
      `${C} ${pregunta}`,
      `${C}. ${mayuscula(sinApertura(pregunta))}`,
      `Y ${c}, ${pregunta}`,
      `Bueno, ${c} ${pregunta}`,
    ]),
    ...PREGUNTAS_SIN_APERTURA.map((pregunta) => `${c} ${pregunta}`),
    ...[...PEDIDOS_SIN_CASO, ...PEDIDOS_CON_CASO].flatMap((pedido) => [
      `${C}, ${pedido}`,
      `${C} ${pedido}`,
      `${mayuscula(pedido)}, ${c}`,
    ]),
    `${C}, ¿y si envío?`,
  ];
}

export function nuncaCancelanPreguntasYAjenos(): readonly string[] {
  return [
    ...PRETERITOS.flatMap((pret) => [
      `No ${pret} el certificado, ¿lo puedo agregar?`,
      `¿por qué no ${pret} el RUT?`,
      `todavía no lo ${pret}`,
      `¿no lo ${pret} ya?`,
      `no lo ${pret} todavía`,
    ]),
    ...GENERICOS.flatMap((verbo) =>
      OBJETOS_AJENOS.flatMap((objeto) => [
        `No ${verbo} ${objeto}`,
        `procesa pe-andes pero no ${verbo} ${objeto}`,
      ]),
    ),
    "¿no confirmo yo después?",
    "no puedo confirmar el NIT",
    "no quiero enviar el RUT por correo",
    "el cliente respondió: no.",
    "¿no puedo enviarlo todavía?",
    "¿no quieres enviarlo?",
    "No sé qué falta, ¿me dices?",
    "No te preocupes, procesa pe-andes",
  ];
}

export const RELLENO_10A43AD: ReadonlySet<string> = new Set([
  "por",
  "favor",
  "porfa",
  "ya",
  "ahora",
  "el",
  "la",
  "lo",
  "los",
  "caso",
  "paquete",
  "envio",
  "de",
  "del",
  "una",
  "vez",
  "gracias",
  "entonces",
  "todo",
  "bien",
  "y",
  "con",
]);

function rechazosConRedaccionYCaso(): readonly string[] {
  const caso = CASO_PENDIENTE;
  return [
    ...["no", "nunca"].flatMap((neg) =>
      ["", "lo "].flatMap((pron) =>
        GENERICOS.flatMap((verbo) =>
          [...COLAS_DEL_SERVIDOR, ...COLAS_DE_MOTIVO].map((cola) => `${neg} ${pron}${verbo}${cola}`),
        ),
      ),
    ),
    ...MODALES.flatMap((modal) =>
      INFINITIVOS.flatMap((inf) => COLAS_DE_MOTIVO.map((cola) => `${modal} ${inf}${cola}`)),
    ),
    "no quiero confirmar el envío simulado",
    ...CANCELACIONES_DE_ENVIO.flatMap((cancela) => COLAS_DE_CANCELACION.map((cola) => `${cancela}${cola}`)),
    ...ESPERAS.flatMap((espera) => [
      `${espera}, ${caso}`,
      `${espera} ${caso}`,
      `${caso} ${minuscula(espera)}`,
      `${caso}, ${minuscula(espera)}`,
      `${espera} el paquete de ${caso}`,
      `el paquete de ${caso} ${minuscula(espera)}`,
      `${espera}, el de ${caso} tiene bloqueos`,
      `${espera}, falta el certificado de ${caso}`,
    ]),
  ];
}

export function siempreCancelan(): readonly string[] {
  return [
    ...rechazosConRedaccionYCaso(),
    ...NEGADORES_DE_ENVIO.flatMap((neg) =>
      PRONOMBRES_DE_ENVIO.flatMap((pron) =>
        SUBJUNTIVOS_DE_ENVIO.flatMap((verbo) =>
          COLAS_DE_ENVIO.map((cola) => `${neg} ${pron}${verbo}${cola}`),
        ),
      ),
    ),
    ...["no", "nunca"].flatMap((neg) =>
      ["", "lo "].flatMap((pron) =>
        GENERICOS.flatMap((verbo) => COLAS_GENERICAS.map((cola) => `${neg} ${pron}${verbo}${cola}`)),
      ),
    ),
    ...MODALES.flatMap((modal) =>
      INFINITIVOS.flatMap((inf) => COLAS_MODALES.map((cola) => `${modal} ${inf}${cola}`)),
    ),
    "no quiero que lo envíes",
    "no quiero que lo mandes todavía",
    ...RESPUESTAS_SUELTAS,
    ...ESPERAS.flatMap((espera) => [
      ...PREGUNTAS.flatMap((pregunta) => [
        `${espera}, ${pregunta}`,
        `${espera}. ${mayuscula(sinApertura(pregunta))}`,
        `${espera} ${pregunta}`,
      ]),
      ...PREGUNTAS_SIN_APERTURA.map((pregunta) => `${espera} ${pregunta}`),
      ...PEDIDOS_SIN_CASO.map((pedido) => `${espera}, ${pedido}`),
    ]),
  ];
}

export function estresMismaClausula(palabras: readonly string[]): readonly string[] {
  return CONFIRMACIONES.flatMap((conf) =>
    palabras.flatMap((w) => [`${conf} ${w}`, `${w} ${conf}`, `${conf} ${w} por favor`]),
  );
}

export function estresClausulaAparte(palabras: readonly string[]): readonly string[] {
  return CONFIRMACIONES.flatMap((conf) =>
    palabras.flatMap((w) => [`${w}, ${conf}`, `${conf}, ${w}`, `${w}. ${conf}.`]),
  );
}

export function estresDeConfirmacion(palabras: readonly string[]): readonly string[] {
  return [...estresMismaClausula(palabras), ...estresClausulaAparte(palabras)];
}

export function atajoPrevio(texto: string): DecisionConfirmacion["decision"] | null {
  const normalizado = sinDiacriticos(texto).toLowerCase().trim();
  if (normalizado === "" || PATRON_PREGUNTA.test(texto)) return DECISION_CONFIRMACION.OTRO;
  const palabras = normalizado.replace(PATRON_SLUG_EN_TEXTO, " ").split(PATRON_NO_PALABRA);
  return palabras.some((palabra) => NEGACIONES_10A43AD.has(palabra)) ? DECISION_CONFIRMACION.RECHAZA : null;
}
