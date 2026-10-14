export const DECISION_CONFIRMACION = {
  CONFIRMA: "confirma",
  RECHAZA: "rechaza",
  FALTA_CASO: "falta_caso",
  OTRO: "otro",
} as const;

export const MAX_PALABRAS_CONFIRMACION = 12;
export const FINES_DE_ORACION = [". ", "! "] as const;

export const SI_CON_TILDE = "sí";
export const SI_SIN_TILDE = "si";

export const AFIRMACIONES: ReadonlySet<string> = new Set([
  "dale",
  "confirmo",
  "confirmado",
  "confirma",
  "procede",
  "proceda",
  "adelante",
  "hazlo",
  "autorizo",
  "autorizado",
]);

export const ACUSES: ReadonlySet<string> = new Set(["ok", "okay", "vale", "listo", "claro", "correcto"]);

export const VERBOS_ENVIO: ReadonlySet<string> = new Set([
  "envia",
  "envialo",
  "enviala",
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

export const NEGADORES: ReadonlySet<string> = new Set(["no", "nunca", "jamas", "tampoco", "ni"]);

export const PRONOMBRES_ATONOS: ReadonlySet<string> = new Set([
  "me",
  "te",
  "se",
  "lo",
  "la",
  "le",
  "nos",
  "los",
  "las",
  "les",
]);

export const VERBOS_NEGABLES: ReadonlySet<string> = new Set([
  "envies",
  "envie",
  "envien",
  "mandes",
  "mande",
  "manden",
  "despaches",
  "despache",
  "despachen",
]);

export const VERBOS_GENERICOS_NEGABLES: ReadonlySet<string> = new Set([
  "hagas",
  "haga",
  "confirmo",
  "confirmes",
  "confirme",
  "autorizo",
  "autorices",
  "autorice",
]);

export const INFINITIVOS_NEGABLES: ReadonlySet<string> = new Set([
  "enviar",
  "enviarlo",
  "enviarla",
  "enviarlos",
  "enviarlas",
  "mandar",
  "mandarlo",
  "mandarla",
  "mandarlos",
  "mandarlas",
  "despachar",
  "despacharlo",
  "despacharla",
  "confirmar",
  "confirmarlo",
  "confirmarla",
  "autorizar",
  "autorizarlo",
  "hacerlo",
]);

export const MODALES_NEGABLES: ReadonlySet<string> = new Set([
  "quiero",
  "queremos",
  "puedo",
  "podemos",
  "vayas",
  "vaya",
  "vayan",
  "ocurra",
]);

export const ENLACES_MODALES: ReadonlySet<string> = new Set(["a", "que"]);

export const NUCLEOS_DE_RECHAZO: ReadonlySet<string> = new Set([
  "no",
  "nunca",
  "jamas",
  "tampoco",
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
  "alto",
  "aguarda",
]);

export const CANCELACIONES: ReadonlySet<string> = new Set([
  "cancela",
  "cancelar",
  "cancelo",
  "cancelado",
  "deten",
  "detente",
]);

export const COMPLEMENTOS_DE_ENVIO: ReadonlySet<string> = new Set(["simulado", "confirmacion"]);

export const SIGNO_DE_MOTIVO = ":";

export const CORTES_DE_COMPLEMENTO: ReadonlySet<string> = new Set([
  "porque",
  "hasta",
  "pues",
  "sin",
  "mientras",
]);

export const VERBOS_DE_PEDIDO: ReadonlySet<string> = new Set([
  "procesa",
  "consulta",
  "lee",
  "revisa",
  "dame",
  "dime",
  "muestrame",
  "muestra",
  "genera",
  "arma",
  "mapea",
  "corrige",
  "cambia",
  "busca",
  "verifica",
  "valida",
  "explica",
  "explicame",
]);

export const RELLENO_DE_ESPERA: ReadonlySet<string> = new Set([
  "por",
  "favor",
  "porfa",
  "ya",
  "ahora",
  "gracias",
  "entonces",
  "un",
  "hoy",
]);

export const INTERROGATIVOS: ReadonlySet<string> = new Set([
  "que",
  "cual",
  "cuales",
  "cuando",
  "cuanto",
  "cuanta",
  "cuantos",
  "cuantas",
  "como",
  "donde",
  "quien",
  "quienes",
]);

export const SUFIJO_PRETERITO = "é";

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
  FALLIDO: "fallido",
} as const;
