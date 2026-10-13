import { cargarSolicitudCaso } from "@/application/services/contexto-caso.service.ts";
import type { ArgsLeerSolicitud, DatosSolicitud } from "@/application/types/leer-solicitud.type.ts";
import type { Entorno } from "@/application/types/puertos.type.ts";
import { camposSolicitados, detectarAmbiguos } from "@/domain/selectors/solicitud.selector.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { exito } from "@/domain/utils/resultado.util.ts";

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
