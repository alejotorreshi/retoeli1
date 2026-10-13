import { aTexto, normalizarEtiqueta } from "./normalizar.ts";
import { VARIABLES_NOTA_DEL_MAESTRO, type VariableNota } from "./pii.ts";
import { renderizarTextoPlano } from "./plantillas.ts";
import {
  type EscalaConfianza,
  type EstadoCampo,
  REGLAS_SIEMPRE_POR_CONFIRMAR,
  type ReglaMapeo,
  type Reglas,
} from "./reglas.ts";
import { exito, fallo, type Resultado } from "./resultado.ts";

export type Maestro = Readonly<Record<string, unknown>>;

export type Glosario = Readonly<Record<string, string>>;

export type IndiceGlosario = {
  readonly exacto: ReadonlyMap<string, string>;
  readonly normalizado: ReadonlyMap<string, string>;
};

export type EntradaMapeo = {
  readonly etiquetas: readonly string[];
  readonly pais: string;
  readonly indice: IndiceGlosario;
  readonly maestro: Maestro;
  readonly reglas: Reglas;
};

export type CampoMapeado = {
  readonly etiqueta: string;
  readonly ruta: string | null;
  readonly estado: EstadoCampo;
  readonly regla: ReglaMapeo;
  readonly confianza: number;
  readonly valor: string | null;
  readonly nota: string | null;
  readonly propuesta: string | null;
};

export type ConteoEstados = Readonly<Record<EstadoCampo, number>>;

export type HojaMaestro =
  | { readonly tipo: "texto"; readonly valor: string }
  | { readonly tipo: "no_textual" }
  | { readonly tipo: "ausente" };

export const NOTA_DATO_NO_TEXTUAL =
  "El maestro tiene este dato, pero no como texto: confirmar qué valor escribir";

type Fuente = { readonly ruta: string; readonly regla: ReglaMapeo };

type Ajuste = {
  readonly regla: ReglaMapeo;
  readonly notas: readonly string[];
  readonly propuesta: string | null;
};

type ContextoMapeo = {
  readonly entrada: EntradaMapeo;
  readonly variables: Readonly<Record<string, string>>;
  readonly genericas: ReadonlySet<string>;
  readonly extranjero: boolean;
  readonly identificador: string | null;
};

const SEGMENTO_RUTA = /^[a-z_]+$/;
const CLAVES_PROHIBIDAS: ReadonlySet<string> = new Set(["__proto__", "constructor", "prototype"]);
const ESPACIO = / /g;
const TEXTO_CON_CONTENIDO = /\S/;
const SEPARADOR_NOTAS = ". ";
const AUSENTE: HojaMaestro = { tipo: "ausente" };
const NO_TEXTUAL: HojaMaestro = { tipo: "no_textual" };

function agregarSinColision(mapa: Map<string, string>, clave: string, ruta: string): boolean {
  const previa = mapa.get(clave);
  if (previa !== undefined && previa !== ruta) return false;
  mapa.set(clave, ruta);
  return true;
}

export function construirIndiceGlosario(glosario: Glosario): Resultado<IndiceGlosario> {
  const exacto = new Map<string, string>();
  const normalizado = new Map<string, string>();
  for (const [etiqueta, ruta] of Object.entries(glosario)) {
    const sinColision =
      agregarSinColision(exacto, etiqueta.normalize("NFC"), ruta) &&
      agregarSinColision(normalizado, normalizarEtiqueta(etiqueta), ruta);
    if (!sinColision) return fallo("DATOS_INVALIDOS");
  }
  return exito({ exacto, normalizado });
}

function segmentoValido(segmento: string): boolean {
  return SEGMENTO_RUTA.test(segmento) && !CLAVES_PROHIBIDAS.has(segmento);
}

function valorEnRuta(maestro: Maestro, ruta: string): unknown {
  let actual: unknown = maestro;
  for (const segmento of ruta.split(".")) {
    if (!segmentoValido(segmento)) return undefined;
    if (typeof actual !== "object" || actual === null || Array.isArray(actual)) return undefined;
    const descriptor = Object.getOwnPropertyDescriptor(actual, segmento);
    if (descriptor === undefined || !("value" in descriptor)) return undefined;
    actual = descriptor.value;
  }
  return actual;
}

function hojaDe(valor: unknown): HojaMaestro {
  if (typeof valor === "number") return { tipo: "texto", valor: aTexto(valor) };
  if (typeof valor === "string") return TEXTO_CON_CONTENIDO.test(valor) ? { tipo: "texto", valor } : AUSENTE;
  if (typeof valor === "boolean") return NO_TEXTUAL;
  if (typeof valor === "object" && valor !== null && Object.keys(valor).length > 0) return NO_TEXTUAL;
  return AUSENTE;
}

export function leerHoja(maestro: Maestro, ruta: string): HojaMaestro {
  return hojaDe(valorEnRuta(maestro, ruta));
}

export function leerRuta(maestro: Maestro, ruta: string): string | null {
  const hoja = leerHoja(maestro, ruta);
  return hoja.tipo === "texto" ? hoja.valor : null;
}

function rutaCandidata(etiqueta: string, indice: IndiceGlosario): Fuente | null {
  const exacta = indice.exacto.get(etiqueta.normalize("NFC"));
  if (exacta !== undefined) return { ruta: exacta, regla: "glosario_exacto" };
  const normalizada = normalizarEtiqueta(etiqueta);
  const porNormalizacion = indice.normalizado.get(normalizada);
  if (porNormalizacion !== undefined) return { ruta: porNormalizacion, regla: "glosario_normalizado" };
  const claveDirecta = normalizada.replace(ESPACIO, "_");
  return segmentoValido(claveDirecta) ? { ruta: claveDirecta, regla: "clave_directa" } : null;
}

function propia(registro: Readonly<Record<string, string>>, clave: string): string | null {
  return Object.hasOwn(registro, clave) ? (registro[clave] ?? null) : null;
}

function variablesDeNota(
  entrada: EntradaMapeo,
  identificador: string | null,
): Readonly<Record<string, string>> {
  const variables = new Map<string, string>();
  const fijar = (nombre: VariableNota, valor: string | null): void => {
    if (valor !== null) variables.set(nombre, valor);
  };
  for (const [nombre, ruta] of VARIABLES_NOTA_DEL_MAESTRO) fijar(nombre, leerRuta(entrada.maestro, ruta));
  fijar("pais", entrada.pais);
  fijar("identificador", identificador);
  return Object.fromEntries(variables);
}

function renderizarNotas(
  plantillas: readonly (readonly [string, string])[],
  variables: Readonly<Record<string, string>>,
): Resultado<readonly string[]> {
  const notas: string[] = [];
  for (const [texto, nombre] of plantillas) {
    const nota = renderizarTextoPlano(texto, variables, nombre);
    if (!nota.ok) return nota;
    notas.push(nota.data);
  }
  return exito(notas);
}

function ajustarPorIdentificador(
  etiqueta: string,
  fuente: Fuente,
  contexto: ContextoMapeo,
): Resultado<Ajuste> {
  const tributario = contexto.entrada.reglas.identificador_tributario;
  const extranjero: readonly (readonly [string, string])[] = contexto.extranjero
    ? [[tributario.nota_extranjero, "identificador_tributario.nota_extranjero"]]
    : [];
  if (contexto.genericas.has(normalizarEtiqueta(etiqueta))) {
    const notas = renderizarNotas(
      [[tributario.nota_generica, "identificador_tributario.nota_generica"], ...extranjero],
      contexto.variables,
    );
    if (!notas.ok) return notas;
    return exito({ regla: "etiqueta_generica", notas: notas.data, propuesta: contexto.identificador });
  }
  if (fuente.ruta === tributario.ruta && contexto.extranjero) {
    const notas = renderizarNotas(extranjero, contexto.variables);
    if (!notas.ok) return notas;
    return exito({ regla: "regla_pais", notas: notas.data, propuesta: null });
  }
  return exito({ regla: fuente.regla, notas: [], propuesta: null });
}

function notasDeContexto(ruta: string, contexto: ContextoMapeo): Resultado<readonly string[]> {
  const aplicables = contexto.entrada.reglas.notas_contexto.flatMap((nota, indice) => {
    const aplica = nota.aplica === "siempre" || (nota.aplica === "extranjero" && contexto.extranjero);
    return nota.ruta === ruta && aplica ? [[nota.texto, `notas_contexto[${indice}]`] as const] : [];
  });
  return renderizarNotas(aplicables, contexto.variables);
}

function campoFaltante(etiqueta: string, reglas: Reglas): CampoMapeado {
  return {
    etiqueta,
    ruta: null,
    estado: "faltante",
    regla: "sin_fuente",
    confianza: reglas.confianza.sin_fuente,
    valor: null,
    nota: null,
    propuesta: null,
  };
}

function campoNoTextual(etiqueta: string, fuente: Fuente, reglas: Reglas): CampoMapeado {
  return {
    etiqueta,
    ruta: fuente.ruta,
    estado: "requiere_confirmacion",
    regla: fuente.regla,
    confianza: reglas.confianza[fuente.regla],
    valor: null,
    nota: NOTA_DATO_NO_TEXTUAL,
    propuesta: null,
  };
}

function estadoDeValor(regla: ReglaMapeo, escala: EscalaConfianza): EstadoCampo {
  const porConfirmar = REGLAS_SIEMPRE_POR_CONFIRMAR.has(regla) || escala[regla] < escala.umbral;
  return porConfirmar ? "requiere_confirmacion" : "lleno";
}

function mapearValor(
  etiqueta: string,
  fuente: Fuente,
  valor: string,
  contexto: ContextoMapeo,
): Resultado<CampoMapeado> {
  const { reglas } = contexto.entrada;
  const ajuste = ajustarPorIdentificador(etiqueta, fuente, contexto);
  if (!ajuste.ok) return ajuste;
  const contextuales = notasDeContexto(fuente.ruta, contexto);
  if (!contextuales.ok) return contextuales;
  const notas = [...ajuste.data.notas, ...contextuales.data];
  const { regla } = ajuste.data;
  return exito({
    etiqueta,
    ruta: fuente.ruta,
    estado: estadoDeValor(regla, reglas.confianza),
    regla,
    confianza: reglas.confianza[regla],
    valor,
    nota: notas.length === 0 ? null : notas.join(SEPARADOR_NOTAS),
    propuesta: ajuste.data.propuesta,
  });
}

function fuenteDe(etiqueta: string, contexto: ContextoMapeo): Fuente | null {
  if (contexto.genericas.has(normalizarEtiqueta(etiqueta))) {
    return { ruta: contexto.entrada.reglas.identificador_tributario.ruta, regla: "etiqueta_generica" };
  }
  return rutaCandidata(etiqueta, contexto.entrada.indice);
}

function mapearEtiqueta(etiqueta: string, contexto: ContextoMapeo): Resultado<CampoMapeado> {
  const { maestro, reglas } = contexto.entrada;
  const fuente = fuenteDe(etiqueta, contexto);
  if (fuente === null) return exito(campoFaltante(etiqueta, reglas));
  const hoja = leerHoja(maestro, fuente.ruta);
  if (hoja.tipo === "ausente") return exito(campoFaltante(etiqueta, reglas));
  if (hoja.tipo === "no_textual") return exito(campoNoTextual(etiqueta, fuente, reglas));
  return mapearValor(etiqueta, fuente, hoja.valor, contexto);
}

function contextoDeMapeo(entrada: EntradaMapeo): ContextoMapeo {
  const tributario = entrada.reglas.identificador_tributario;
  const identificador = propia(tributario.por_pais, entrada.pais);
  return {
    entrada,
    variables: variablesDeNota(entrada, identificador),
    genericas: new Set(entrada.reglas.etiquetas_genericas.map(normalizarEtiqueta)),
    extranjero: entrada.pais !== tributario.pais_origen,
    identificador,
  };
}

export function mapearCampos(entrada: EntradaMapeo): Resultado<readonly CampoMapeado[]> {
  const contexto = contextoDeMapeo(entrada);
  const campos: CampoMapeado[] = [];
  for (const etiqueta of entrada.etiquetas) {
    const campo = mapearEtiqueta(etiqueta, contexto);
    if (!campo.ok) return campo;
    campos.push(campo.data);
  }
  return exito(campos);
}

export function contarEstados(campos: readonly CampoMapeado[]): ConteoEstados {
  const conteo = { lleno: 0, faltante: 0, requiere_confirmacion: 0 };
  for (const campo of campos) conteo[campo.estado] += 1;
  return conteo;
}
