import { HERRAMIENTA, HERRAMIENTA_POR_NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import { motivosDeBloqueo } from "@/domain/builders/checklist.builder.ts";
import { redactar } from "@/domain/policies/redaccion.policy.ts";
import {
  envioLeidoSchema,
  formularioLeidoSchema,
  mapeoLeidoSchema,
  paqueteVisibleSchema,
  resultadoVisibleSchema,
  solicitudLeidaSchema,
} from "@/loop/schemas/resultado-herramienta.schema.ts";
import { motivosDeSoportes } from "@/loop/services/despacho-llamada.service.ts";
import type { ResultadoVisible } from "@/loop/types/resultado-visible.type.ts";

type Proyeccion = Partial<Omit<ResultadoVisible, "herramienta">>;

type Proyectar = (respuesta: unknown) => Proyeccion | null;

const SIN_DATOS: Omit<ResultadoVisible, "herramienta"> = {
  pais: null,
  formato: null,
  conteo: null,
  listoParaFirma: null,
  bloqueosLegibles: null,
  ruta: null,
  aviso: null,
};

const proyectarSolicitud: Proyectar = (respuesta) => {
  const leida = solicitudLeidaSchema.safeParse(respuesta);
  if (!leida.success) return null;
  const { pais, formato } = leida.data.data;
  return { pais, formato };
};

const proyectarMapeo: Proyectar = (respuesta) => {
  const leido = mapeoLeidoSchema.safeParse(respuesta);
  if (!leido.success) return null;
  const { pais, conteo } = leido.data.data;
  return { pais, conteo };
};

const proyectarFormulario: Proyectar = (respuesta) => {
  const leido = formularioLeidoSchema.safeParse(respuesta);
  if (!leido.success) return null;
  const { ruta, formato, conteo, aviso } = leido.data.data;
  return { ruta, formato, conteo: conteo ?? null, aviso: aviso ?? null };
};

const proyectarPaquete: Proyectar = (respuesta) => {
  const leido = paqueteVisibleSchema.safeParse(respuesta);
  if (!leido.success) return null;
  const { ruta, listo_para_firma, checklist } = leido.data.data;
  return {
    ruta,
    listoParaFirma: listo_para_firma,
    bloqueosLegibles: motivosDeBloqueo({ motivos_bloqueo: motivosDeSoportes(checklist.soportes) }),
  };
};

const proyectarEnvio: Proyectar = (respuesta) => {
  const leido = envioLeidoSchema.safeParse(respuesta);
  return leido.success ? { ruta: leido.data.data.ruta } : null;
};

const PROYECCION_POR_HERRAMIENTA: Readonly<Record<ValorDe<typeof HERRAMIENTA>, Proyectar>> = {
  [HERRAMIENTA.LEER_SOLICITUD]: proyectarSolicitud,
  [HERRAMIENTA.MAPEAR_CAMPOS]: proyectarMapeo,
  [HERRAMIENTA.GENERAR_FORMULARIO]: proyectarFormulario,
  [HERRAMIENTA.ARMAR_PAQUETE]: proyectarPaquete,
  [HERRAMIENTA.SIMULAR_ENVIO]: proyectarEnvio,
};

export function resultadoVisible(nombreVisible: string, respuesta: unknown): ResultadoVisible | null {
  const herramienta = HERRAMIENTA_POR_NOMBRE_VISIBLE.get(nombreVisible);
  if (herramienta === undefined) return null;
  const proyeccion = PROYECCION_POR_HERRAMIENTA[herramienta](respuesta);
  return proyeccion === null ? null : { herramienta, ...SIN_DATOS, ...proyeccion };
}

export function redactarResultadoVisible(
  resultado: ResultadoVisible | null,
  secretos: readonly string[],
): ResultadoVisible | null {
  if (resultado === null) return null;
  const redactado = resultadoVisibleSchema.safeParse(redactar(resultado, secretos));
  return redactado.success ? redactado.data : null;
}
