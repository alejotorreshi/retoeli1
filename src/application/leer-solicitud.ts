import { exito, type Fallo, fallo, type Resultado } from "../domain/resultado.ts";
import { camposSolicitados, elegirPlantilla } from "../domain/solicitud.ts";
import type { CampoSolicitado, Formato } from "../domain/tipos.ts";
import type { Entorno } from "./puertos.ts";

export type ArgsLeerSolicitud = { readonly caso: string };

export type DatosSolicitud = {
  readonly caso: string;
  readonly pais: string;
  readonly cliente: string;
  readonly formato: Formato;
  readonly plantilla: string;
  readonly campos: readonly CampoSolicitado[];
  readonly soportes: readonly string[];
};

async function casoNoEncontrado(entorno: Entorno): Promise<Fallo> {
  const casosDisponibles = await entorno.casos.disponibles();
  return fallo("CASO_NO_ENCONTRADO", { parcial: { casos_disponibles: casosDisponibles } });
}

export async function leerSolicitud(
  args: ArgsLeerSolicitud,
  entorno: Entorno,
): Promise<Resultado<DatosSolicitud>> {
  const { caso } = args;
  if (caso === "") return casoNoEncontrado(entorno);
  if (!entorno.patronCaso.test(caso)) return fallo("CASO_INVALIDO");

  const resolucion = await entorno.casos.resolver(caso);
  if (resolucion.estado === "invalido") return fallo("CASO_INVALIDO");
  if (resolucion.estado === "no_encontrado") return casoNoEncontrado(entorno);
  const directorio = resolucion.directorio;

  const solicitud = await entorno.fixtures.leerSolicitud(directorio);
  if (solicitud.estado === "no_encontrado") return casoNoEncontrado(entorno);
  if (solicitud.estado === "invalido") return fallo("DATOS_INVALIDOS");

  const soportes = await entorno.fixtures.leerSoportesExigidos(directorio);
  if (soportes.estado !== "ok") return fallo("DATOS_INVALIDOS");

  const { pais, cliente, formato } = solicitud.valor;
  const parcial = { pais, cliente, formato, soportes: soportes.valor };

  const presentes = {
    celdas: await entorno.fixtures.existePlantilla(directorio, "celdas"),
    campos: await entorno.fixtures.existePlantilla(directorio, "campos"),
  };
  const tipo = elegirPlantilla(formato, presentes);
  if (tipo === null) return fallo("PLANTILLA_INVALIDA", { parcial });

  const plantilla = await entorno.fixtures.leerPlantilla(directorio, tipo);
  if (plantilla.estado !== "ok") return fallo("PLANTILLA_INVALIDA", { parcial });

  return exito({
    caso,
    pais,
    cliente,
    formato,
    plantilla: plantilla.valor.archivo,
    campos: camposSolicitados(plantilla.valor),
    soportes: soportes.valor,
  });
}
