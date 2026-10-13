import type { Entorno } from "@/application/puertos.ts";
import { construirIndiceGlosario, type IndiceGlosario, type Maestro } from "@/domain/mapeo.ts";
import type { Reglas } from "@/domain/reglas.ts";
import { exito, type Fallo, fallo, type Resultado } from "@/domain/resultado.ts";
import { elegirPlantilla } from "@/domain/solicitud.ts";
import type { Plantilla, Solicitud } from "@/domain/tipos.ts";

export type SolicitudCaso = {
  readonly caso: string;
  readonly solicitud: Solicitud;
  readonly soportesExigidos: readonly string[];
  readonly plantilla: Plantilla;
};

export type ContextoCaso = SolicitudCaso & {
  readonly maestro: Maestro;
  readonly indice: IndiceGlosario;
  readonly reglas: Reglas;
};

async function casoNoEncontrado(entorno: Entorno): Promise<Fallo> {
  const casosDisponibles = await entorno.casos.disponibles();
  return fallo("CASO_NO_ENCONTRADO", { parcial: { casos_disponibles: casosDisponibles } });
}

export async function cargarSolicitudCaso(caso: string, entorno: Entorno): Promise<Resultado<SolicitudCaso>> {
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
    solicitud: solicitud.valor,
    soportesExigidos: soportes.valor,
    plantilla: plantilla.valor,
  });
}

export async function cargarContextoCaso(caso: string, entorno: Entorno): Promise<Resultado<ContextoCaso>> {
  const cargada = await cargarSolicitudCaso(caso, entorno);
  if (!cargada.ok) return cargada;
  return completarContextoCaso(cargada.data, entorno);
}

export async function completarContextoCaso(
  cargada: SolicitudCaso,
  entorno: Entorno,
): Promise<Resultado<ContextoCaso>> {
  const reglas = await entorno.reglas();
  if (!reglas.ok) return reglas;

  const maestro = await entorno.maestro();
  if (maestro.estado !== "ok") return fallo("DATOS_INVALIDOS");

  const glosario = await entorno.glosario();
  if (glosario.estado !== "ok") return fallo("DATOS_INVALIDOS");

  const indice = construirIndiceGlosario(glosario.valor);
  if (!indice.ok) return indice;

  return exito({ ...cargada, maestro: maestro.valor, indice: indice.data, reglas: reglas.data });
}
