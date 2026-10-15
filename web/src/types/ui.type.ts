import type { TAMANO_ICONO, TONO } from "@web/config/constants/ui.constants.ts";
import type {
  EstadoHerramienta,
  EstadoModelo,
  LlamadaDelTurno,
  ResultadoDeCaso,
  SaludModelo,
  TurnoConversacion,
} from "@web/types/chat.type.ts";
import type { ReactNode } from "react";
import type { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type TamanoIcono = ValorDe<typeof TAMANO_ICONO>;

export type PropsIcono = {
  readonly tamano?: TamanoIcono;
};

export type PropsSvgIcono = {
  readonly tamano: TamanoIcono;
  readonly clase?: string;
  readonly children: ReactNode;
};

export type PropsAviso = {
  readonly mensaje: string;
  readonly acciones?: ReactNode;
};

export type PropsLineaDeTiempo = {
  readonly turnos: readonly TurnoConversacion[];
  readonly enCurso: boolean;
  readonly children?: ReactNode;
};

export type PropsTurno = {
  readonly turno: TurnoConversacion;
  readonly enCurso: boolean;
  readonly resultados: readonly ResultadoDeCaso[];
};

export type PropsTarjetaResultado = {
  readonly resultado: ResultadoDeCaso;
};

export type PropsBloqueosResultado = {
  readonly bloqueos: readonly string[] | null;
};

export type PropsGrupoHerramientas = {
  readonly llamadas: readonly LlamadaDelTurno[];
  readonly enCurso: boolean;
};

export type PropsTarjetaHerramienta = {
  readonly llamada: LlamadaDelTurno;
};

export type PropsIndicadorPensando = {
  readonly etiqueta: string;
  readonly marca: number;
};

export type PropsIconoDeEstado = {
  readonly estado: EstadoHerramienta;
};

export type PropsMensaje = {
  readonly texto: string;
};

export type PropsCompositor = {
  readonly valor: string;
  readonly maximo: number | null;
  readonly enCurso: boolean;
  readonly alCambiar: (valor: string) => void;
  readonly alEnviar: () => void;
};

export type PropsEncabezado = {
  readonly fechaEjecucion: string | null;
  readonly salud: SaludModelo | null;
};

export type Tono = ValorDe<typeof TONO>;

export type EstadoModeloConAviso = Exclude<EstadoModelo, typeof ESTADO_LLM.DISPONIBLE>;

export type PartesAvisoModelo = {
  readonly texto: string;
  readonly comando: string | null;
  readonly cierre: string;
};

export type PropsAvisoModelo = {
  readonly estado: EstadoModelo | null;
  readonly zona: string | null;
};

export type PropsCuerpoAvisoModelo = {
  readonly estado: EstadoModeloConAviso;
  readonly zona: string | null;
};

export type PropsEstadoDelModelo = {
  readonly salud: SaludModelo;
};

export type PropsPantallaAcceso = {
  readonly aviso: string | null;
  readonly alEntrar: () => Promise<void>;
};
