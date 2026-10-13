import type { ContextoCaso, SolicitudCaso } from "@/application/types/contexto-caso.type.ts";
import type { Entorno } from "@/application/types/puertos.type.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { TIPO_PLANTILLA } from "@/config/constants/forms.constants.ts";
import { ESTADO_LECTURA } from "@/config/constants/io.constants.ts";
import { PATRON_CASO } from "@/config/constants/patterns.constants.ts";
import { construirIndiceGlosario } from "@/domain/glosario.ts";
import { exito, fallo } from "@/domain/resultado.ts";
import { elegirPlantilla } from "@/domain/solicitud.ts";
import type { Fallo, Resultado } from "@/domain/types/resultado.type.ts";

async function casoNoEncontrado(entorno: Entorno): Promise<Fallo> {
  const casosDisponibles = await entorno.casos.disponibles();
  return fallo(CODIGO_ERROR.CASO_NO_ENCONTRADO, { parcial: { casos_disponibles: casosDisponibles } });
}

export async function cargarSolicitudCaso(caso: string, entorno: Entorno): Promise<Resultado<SolicitudCaso>> {
  if (caso === "") return casoNoEncontrado(entorno);
  if (!PATRON_CASO.test(caso)) return fallo(CODIGO_ERROR.CASO_INVALIDO);

  const resolucion = await entorno.casos.resolver(caso);
  if (resolucion.estado === ESTADO_LECTURA.INVALIDO) return fallo(CODIGO_ERROR.CASO_INVALIDO);
  if (resolucion.estado === ESTADO_LECTURA.NO_ENCONTRADO) return casoNoEncontrado(entorno);
  const directorio = resolucion.directorio;

  const solicitud = await entorno.fixtures.leerSolicitud(directorio);
  if (solicitud.estado === ESTADO_LECTURA.NO_ENCONTRADO) return casoNoEncontrado(entorno);
  if (solicitud.estado === ESTADO_LECTURA.INVALIDO) return fallo(CODIGO_ERROR.DATOS_INVALIDOS);

  const soportes = await entorno.fixtures.leerSoportesExigidos(directorio);
  if (soportes.estado !== ESTADO_LECTURA.OK) return fallo(CODIGO_ERROR.DATOS_INVALIDOS);

  const { pais, cliente, formato } = solicitud.valor;
  const parcial = { pais, cliente, formato, soportes: soportes.valor };

  const presentes = {
    [TIPO_PLANTILLA.CELDAS]: await entorno.fixtures.existePlantillaCaso(directorio, TIPO_PLANTILLA.CELDAS),
    [TIPO_PLANTILLA.CAMPOS]: await entorno.fixtures.existePlantillaCaso(directorio, TIPO_PLANTILLA.CAMPOS),
  };
  const tipo = elegirPlantilla(formato, presentes);
  if (tipo === null) return fallo(CODIGO_ERROR.PLANTILLA_INVALIDA, { parcial });

  const plantilla = await entorno.fixtures.leerPlantillaCaso(directorio, tipo);
  if (plantilla.estado !== ESTADO_LECTURA.OK) return fallo(CODIGO_ERROR.PLANTILLA_INVALIDA, { parcial });

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
  if (maestro.estado !== ESTADO_LECTURA.OK) return fallo(CODIGO_ERROR.DATOS_INVALIDOS);

  const glosario = await entorno.glosario();
  if (glosario.estado !== ESTADO_LECTURA.OK) return fallo(CODIGO_ERROR.DATOS_INVALIDOS);

  const indice = construirIndiceGlosario(glosario.valor);
  if (!indice.ok) return indice;

  return exito({ ...cargada, maestro: maestro.valor, indice: indice.data, reglas: reglas.data });
}
