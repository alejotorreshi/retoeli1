import { cargarSolicitudCaso } from "@/application/contexto-caso.ts";
import type { Entorno } from "@/application/puertos.ts";
import { exito } from "@/domain/resultado.ts";
import { camposSolicitados, detectarAmbiguos } from "@/domain/solicitud.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import type { CampoAmbiguo, CampoSolicitado, Formato } from "@/domain/types/solicitud.type.ts";

export type ArgsLeerSolicitud = { readonly caso: string };

export type DatosSolicitud = {
  readonly caso: string;
  readonly pais: string;
  readonly cliente: string;
  readonly formato: Formato;
  readonly plantilla: string;
  readonly campos: readonly CampoSolicitado[];
  readonly ambiguos: readonly CampoAmbiguo[];
  readonly soportes: readonly string[];
};

export async function leerSolicitud(
  args: ArgsLeerSolicitud,
  entorno: Entorno,
): Promise<Resultado<DatosSolicitud>> {
  const cargada = await cargarSolicitudCaso(args.caso, entorno);
  if (!cargada.ok) return cargada;
  const reglas = await entorno.reglas();
  if (!reglas.ok) return reglas;
  const { caso, solicitud, soportesExigidos, plantilla } = cargada.data;
  const campos = camposSolicitados(plantilla);
  return exito({
    caso,
    pais: solicitud.pais,
    cliente: solicitud.cliente,
    formato: solicitud.formato,
    plantilla: plantilla.archivo,
    campos,
    ambiguos: detectarAmbiguos(campos, reglas.data, solicitud.pais),
    soportes: soportesExigidos,
  });
}
