import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { VARIABLES_NOTA_DEL_MAESTRO } from "@/config/constants/maestro.constants.ts";
import {
  APLICA_NOTA,
  CLAVES_PROHIBIDAS,
  ESTADO_CAMPO,
  NOMBRE_TEXTO_REGLA,
  REGLA_MAPEO,
  REGLAS_SIEMPRE_POR_CONFIRMAR,
  TIPO_HOJA_MAESTRO,
  VARIABLE_NOTA,
} from "@/config/constants/mapping.constants.ts";
import {
  PATRON_ESPACIO,
  PATRON_SEGMENTO_RUTA,
  PATRON_TEXTO_NO_VACIO,
} from "@/config/constants/patterns.constants.ts";
import { TEXTO_COMUN, TEXTO_MAPEO } from "@/config/strings.ts";
import { aTexto, normalizarEtiqueta } from "@/domain/normalizar.ts";
import { renderizarTextoPlano } from "@/domain/plantillas.ts";
import { exito, fallo } from "@/domain/resultado.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type {
  CampoMapeado,
  ConteoEstados,
  EntradaMapeo,
  Glosario,
  HojaMaestro,
  IndiceGlosario,
} from "@/domain/types/mapeo.type.ts";
import type {
  EscalaConfianza,
  EstadoCampo,
  ReglaMapeo,
  Reglas,
  VariableNota,
} from "@/domain/types/reglas.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";

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

const AUSENTE: HojaMaestro = { tipo: TIPO_HOJA_MAESTRO.AUSENTE };
const NO_TEXTUAL: HojaMaestro = { tipo: TIPO_HOJA_MAESTRO.NO_TEXTUAL };

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
    if (!sinColision) return fallo(CODIGO_ERROR.DATOS_INVALIDOS);
  }
  return exito({ exacto, normalizado });
}

function segmentoValido(segmento: string): boolean {
  return PATRON_SEGMENTO_RUTA.test(segmento) && !CLAVES_PROHIBIDAS.has(segmento);
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
  if (typeof valor === "number") return { tipo: TIPO_HOJA_MAESTRO.TEXTO, valor: aTexto(valor) };
  if (typeof valor === "string")
    return PATRON_TEXTO_NO_VACIO.test(valor) ? { tipo: TIPO_HOJA_MAESTRO.TEXTO, valor } : AUSENTE;
  if (typeof valor === "boolean") return NO_TEXTUAL;
  if (typeof valor === "object" && valor !== null && Object.keys(valor).length > 0) return NO_TEXTUAL;
  return AUSENTE;
}

export function leerHoja(maestro: Maestro, ruta: string): HojaMaestro {
  return hojaDe(valorEnRuta(maestro, ruta));
}

export function leerRuta(maestro: Maestro, ruta: string): string | null {
  const hoja = leerHoja(maestro, ruta);
  return hoja.tipo === TIPO_HOJA_MAESTRO.TEXTO ? hoja.valor : null;
}

function rutaCandidata(etiqueta: string, indice: IndiceGlosario): Fuente | null {
  const exacta = indice.exacto.get(etiqueta.normalize("NFC"));
  if (exacta !== undefined) return { ruta: exacta, regla: REGLA_MAPEO.GLOSARIO_EXACTO };
  const normalizada = normalizarEtiqueta(etiqueta);
  const porNormalizacion = indice.normalizado.get(normalizada);
  if (porNormalizacion !== undefined)
    return { ruta: porNormalizacion, regla: REGLA_MAPEO.GLOSARIO_NORMALIZADO };
  const claveDirecta = normalizada.replace(PATRON_ESPACIO, "_");
  return segmentoValido(claveDirecta) ? { ruta: claveDirecta, regla: REGLA_MAPEO.CLAVE_DIRECTA } : null;
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
  fijar(VARIABLE_NOTA.PAIS, entrada.pais);
  fijar(VARIABLE_NOTA.IDENTIFICADOR, identificador);
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
    ? [[tributario.nota_extranjero, NOMBRE_TEXTO_REGLA.NOTA_EXTRANJERO]]
    : [];
  if (contexto.genericas.has(normalizarEtiqueta(etiqueta))) {
    const notas = renderizarNotas(
      [[tributario.nota_generica, NOMBRE_TEXTO_REGLA.NOTA_GENERICA], ...extranjero],
      contexto.variables,
    );
    if (!notas.ok) return notas;
    return exito({
      regla: REGLA_MAPEO.ETIQUETA_GENERICA,
      notas: notas.data,
      propuesta: contexto.identificador,
    });
  }
  if (fuente.ruta === tributario.ruta && contexto.extranjero) {
    const notas = renderizarNotas(extranjero, contexto.variables);
    if (!notas.ok) return notas;
    return exito({ regla: REGLA_MAPEO.REGLA_PAIS, notas: notas.data, propuesta: null });
  }
  return exito({ regla: fuente.regla, notas: [], propuesta: null });
}

function notasDeContexto(ruta: string, contexto: ContextoMapeo): Resultado<readonly string[]> {
  const aplicables = contexto.entrada.reglas.notas_contexto.flatMap((nota, indice) => {
    const aplica =
      nota.aplica === APLICA_NOTA.SIEMPRE || (nota.aplica === APLICA_NOTA.EXTRANJERO && contexto.extranjero);
    return nota.ruta === ruta && aplica
      ? [[nota.texto, `${NOMBRE_TEXTO_REGLA.NOTAS_CONTEXTO}[${indice}]`] as const]
      : [];
  });
  return renderizarNotas(aplicables, contexto.variables);
}

function campoFaltante(etiqueta: string, reglas: Reglas): CampoMapeado {
  return {
    etiqueta,
    ruta: null,
    estado: ESTADO_CAMPO.FALTANTE,
    regla: REGLA_MAPEO.SIN_FUENTE,
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
    estado: ESTADO_CAMPO.REQUIERE_CONFIRMACION,
    regla: fuente.regla,
    confianza: reglas.confianza[fuente.regla],
    valor: null,
    nota: TEXTO_MAPEO.datoNoTextual,
    propuesta: null,
  };
}

function estadoDeValor(regla: ReglaMapeo, escala: EscalaConfianza): EstadoCampo {
  const porConfirmar = REGLAS_SIEMPRE_POR_CONFIRMAR.has(regla) || escala[regla] < escala.umbral;
  return porConfirmar ? ESTADO_CAMPO.REQUIERE_CONFIRMACION : ESTADO_CAMPO.LLENO;
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
    nota: notas.length === 0 ? null : notas.join(TEXTO_COMUN.separadorNotas),
    propuesta: ajuste.data.propuesta,
  });
}

function fuenteDe(etiqueta: string, contexto: ContextoMapeo): Fuente | null {
  if (contexto.genericas.has(normalizarEtiqueta(etiqueta))) {
    return {
      ruta: contexto.entrada.reglas.identificador_tributario.ruta,
      regla: REGLA_MAPEO.ETIQUETA_GENERICA,
    };
  }
  return rutaCandidata(etiqueta, contexto.entrada.indice);
}

function mapearEtiqueta(etiqueta: string, contexto: ContextoMapeo): Resultado<CampoMapeado> {
  const { maestro, reglas } = contexto.entrada;
  const fuente = fuenteDe(etiqueta, contexto);
  if (fuente === null) return exito(campoFaltante(etiqueta, reglas));
  const hoja = leerHoja(maestro, fuente.ruta);
  if (hoja.tipo === TIPO_HOJA_MAESTRO.AUSENTE) return exito(campoFaltante(etiqueta, reglas));
  if (hoja.tipo === TIPO_HOJA_MAESTRO.NO_TEXTUAL) return exito(campoNoTextual(etiqueta, fuente, reglas));
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
  const conteo: Record<EstadoCampo, number> = {
    [ESTADO_CAMPO.LLENO]: 0,
    [ESTADO_CAMPO.FALTANTE]: 0,
    [ESTADO_CAMPO.REQUIERE_CONFIRMACION]: 0,
  };
  for (const campo of campos) conteo[campo.estado] += 1;
  return conteo;
}
