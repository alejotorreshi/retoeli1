import { type CampoMapeado, type ConteoEstados, contarEstados, mapearCampos } from "../domain/mapeo.ts";
import { type CampoPresentado, presentarCampo } from "../domain/pii.ts";
import type { EstadoCampo } from "../domain/reglas.ts";
import { exito, type Resultado } from "../domain/resultado.ts";
import { cargarContextoCaso } from "./contexto-caso.ts";
import type { Entorno } from "./puertos.ts";

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

function conEstado(campos: readonly CampoMapeado[], estado: EstadoCampo): readonly CampoPresentado[] {
  return campos.filter((campo) => campo.estado === estado).map(presentarCampo);
}

export async function mapearCamposCaso(
  args: ArgsMapearCampos,
  entorno: Entorno,
): Promise<Resultado<DatosMapeo>> {
  const contexto = await cargarContextoCaso(args.caso, entorno);
  if (!contexto.ok) return contexto;
  const { caso, solicitud, plantilla, maestro, indice, reglas } = contexto.data;

  const mapeo = mapearCampos({
    etiquetas: plantilla.campos.map((campo) => campo.etiqueta),
    pais: solicitud.pais,
    indice,
    maestro,
    reglas,
    variablesNota: {},
  });
  if (!mapeo.ok) return mapeo;

  return exito({
    caso,
    pais: solicitud.pais,
    conteo: contarEstados(mapeo.data),
    llenos: conEstado(mapeo.data, "lleno"),
    faltantes: conEstado(mapeo.data, "faltante"),
    requiere_confirmacion: conEstado(mapeo.data, "requiere_confirmacion"),
    mapeo: entorno.salida.ruta(caso, "mapeo"),
  });
}
