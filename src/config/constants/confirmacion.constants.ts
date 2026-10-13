export const DECISION_CONFIRMACION = {
  CONFIRMA: "confirma",
  RECHAZA: "rechaza",
  FALTA_CASO: "falta_caso",
  OTRO: "otro",
} as const;

export const MAX_PALABRAS_CONFIRMACION = 12;
export const FINES_DE_ORACION = [". ", "! "] as const;

export const AFIRMACIONES: ReadonlySet<string> = new Set([
  "si",
  "ok",
  "okay",
  "vale",
  "dale",
  "confirmo",
  "confirmado",
  "confirma",
  "procede",
  "proceda",
  "adelante",
  "listo",
  "claro",
  "correcto",
  "hazlo",
  "autorizo",
  "autorizado",
]);

export const VERBOS_ENVIO: ReadonlySet<string> = new Set([
  "envia",
  "envialo",
  "enviala",
  "envie",
  "envio",
  "enviar",
  "manda",
  "mandalo",
  "despacha",
]);

export const RELLENO: ReadonlySet<string> = new Set([
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

export const NEGACIONES: ReadonlySet<string> = new Set([
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

export const CONDICIONALES: ReadonlySet<string> = new Set([
  "pero",
  "aunque",
  "excepto",
  "salvo",
  "sino",
  "cambia",
  "corrige",
  "revisa",
  "antes",
  "cuando",
  "primero",
]);

export const ESTADO_COMPUERTA = {
  LIBRE: "libre",
  PENDIENTE: "pendiente",
} as const;

export const EVENTO_COMPUERTA = {
  ARMADO: "armado",
  BLOQUEADO: "bloqueado",
  ENVIADO: "enviado",
} as const;
