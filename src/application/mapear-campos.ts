import { type ContextoCaso, cargarContextoCaso } from "@/application/contexto-caso.ts";
import type { Entorno } from "@/application/puertos.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { type CampoMapeado, type ConteoEstados, contarEstados, mapearCampos } from "@/domain/mapeo.ts";
import { normalizarEtiqueta } from "@/domain/normalizar.ts";
import { type CampoPresentado, presentarCampo } from "@/domain/pii.ts";
import type { EstadoCampo } from "@/domain/reglas.ts";
import { exito, fallo, type Resultado } from "@/domain/resultado.ts";

export type ArgsMapearCampos = { readonly caso: string; readonly campos: readonly string[] };

export type DatosMapeo = {
  readonly caso: string;
  readonly pais: string;
  readonly conteo: ConteoEstados;
  readonly llenos: readonly CampoPresentado[];
  readonly faltantes: readonly CampoPresentado[];
  readonly requiere_confirmacion: readonly CampoPresentado[];
  readonly mapeo: string;
};

export type DocumentoMapeo = {
  readonly caso: string;
  readonly pais: string;
  readonly fecha_ejecucion: string;
  readonly campos: readonly CampoPresentado[];
};

const SANGRIA_JSON = 2;

function conEstado(campos: readonly CampoPresentado[], estado: EstadoCampo): readonly CampoPresentado[] {
  return campos.filter((campo) => campo.estado === estado);
}

function seleccionar(
  canonicos: readonly CampoMapeado[],
  pedidas: readonly string[],
): Resultado<readonly CampoMapeado[]> {
  if (pedidas.length === 0) return exito(canonicos);
  const disponibles = new Set(canonicos.map((campo) => normalizarEtiqueta(campo.etiqueta)));
  const normalizadas = pedidas.map(normalizarEtiqueta);
  const fuera = normalizadas.flatMap((etiqueta, indice) => (disponibles.has(etiqueta) ? [] : [indice]));
  if (fuera.length > 0) {
    return fallo(CODIGO_ERROR.CAMPOS_FUERA_DE_PLANTILLA, {
      parcial: {
        etiquetas_esperadas: canonicos.map((campo) => campo.etiqueta),
        indices_fuera_de_plantilla: fuera,
      },
    });
  }
  const elegidas = new Set(normalizadas);
  return exito(canonicos.filter((campo) => elegidas.has(normalizarEtiqueta(campo.etiqueta))));
}

function serializar(documento: DocumentoMapeo): string {
  return `${JSON.stringify(documento, null, SANGRIA_JSON)}\n`;
}

export function mapeoCanonico(contexto: ContextoCaso): Resultado<readonly CampoMapeado[]> {
  const { solicitud, plantilla, maestro, indice, reglas } = contexto;
  return mapearCampos({
    etiquetas: plantilla.campos.map((campo) => campo.etiqueta),
    pais: solicitud.pais,
    indice,
    maestro,
    reglas,
  });
}

export function escribirMapeo(
  contexto: ContextoCaso,
  canonico: readonly CampoMapeado[],
  entorno: Entorno,
): Promise<string> {
  return entorno.salida.escribir(
    contexto.caso,
    "mapeo",
    serializar({
      caso: contexto.caso,
      pais: contexto.solicitud.pais,
      fecha_ejecucion: entorno.reloj.hoy(),
      campos: canonico.map(presentarCampo),
    }),
  );
}

async function mapearBajoCandado(args: ArgsMapearCampos, entorno: Entorno): Promise<Resultado<DatosMapeo>> {
  const contexto = await cargarContextoCaso(args.caso, entorno);
  if (!contexto.ok) return contexto;
  const { caso, solicitud } = contexto.data;

  const canonico = mapeoCanonico(contexto.data);
  if (!canonico.ok) return canonico;

  const seleccion = seleccionar(canonico.data, args.campos);
  if (!seleccion.ok) return seleccion;

  const mapeo = await escribirMapeo(contexto.data, canonico.data, entorno);

  const presentados = seleccion.data.map(presentarCampo);
  return exito({
    caso,
    pais: solicitud.pais,
    conteo: contarEstados(seleccion.data),
    llenos: conEstado(presentados, "lleno"),
    faltantes: conEstado(presentados, "faltante"),
    requiere_confirmacion: conEstado(presentados, "requiere_confirmacion"),
    mapeo,
  });
}

export function mapearCamposCaso(args: ArgsMapearCampos, entorno: Entorno): Promise<Resultado<DatosMapeo>> {
  return entorno.candado(args.caso, () => mapearBajoCandado(args, entorno));
}
