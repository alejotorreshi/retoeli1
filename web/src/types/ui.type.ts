import type { TAMANO_ICONO } from "@web/config/constants/ui.constants.ts";
import type { TurnoConversacion } from "@web/types/chat.type.ts";
import type { ReactNode } from "react";
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
};

export type PropsMensaje = {
  readonly texto: string;
};
