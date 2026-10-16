import type { ACCION_DIALOGO_SESION, ACCION_SALUD } from "@web/config/constants/ui.constants.ts";
import type {
  AccionDeTarjeta,
  AccionUi,
  Despachar,
  EstadoConversacion,
  ResultadoApi,
  VistaSesionUi,
} from "@web/types/chat.type.ts";
import type { ReactNode } from "react";
import type { ChatBody, ConfigResponse, HealthResponse } from "@/http/types/api.type.ts";

export type Almacen<E, A> = {
  readonly leer: () => E;
  readonly suscribir: (oyente: () => void) => () => void;
  readonly despachar: (accion: A) => void;
};

export type EstadoSalud = {
  readonly salud: HealthResponse | null;
  readonly comprobando: boolean;
};

export type AccionSalud =
  | { readonly tipo: typeof ACCION_SALUD.COMPROBANDO }
  | { readonly tipo: typeof ACCION_SALUD.RECIBIDA; readonly salud: HealthResponse }
  | { readonly tipo: typeof ACCION_SALUD.TERMINADA };

export type EstadoDialogoSesion = {
  readonly abierto: boolean;
};

export type AccionDialogoSesion =
  | { readonly tipo: typeof ACCION_DIALOGO_SESION.ABRIR }
  | { readonly tipo: typeof ACCION_DIALOGO_SESION.CERRAR };

export type EstadoRaiz = {
  readonly conversacion: EstadoConversacion;
  readonly salud: EstadoSalud;
  readonly dialogoSesion: EstadoDialogoSesion;
};

export type AccionRaiz = AccionUi | AccionSalud | AccionDialogoSesion;

export type AlmacenRaiz = Almacen<EstadoRaiz, AccionRaiz>;

export type Dependencias = {
  readonly enviarTurno: (
    pedido: ChatBody,
    despachar: Despachar,
    signal: AbortSignal,
    alTerminarTurno: () => void,
  ) => Promise<void>;
  readonly obtenerConfig: (signal: AbortSignal | null) => Promise<ResultadoApi<ConfigResponse>>;
  readonly obtenerSalud: (signal: AbortSignal | null) => Promise<ResultadoApi<HealthResponse>>;
  readonly obtenerSesionAsentada: (
    sesionId: string,
    signal: AbortSignal | null,
  ) => Promise<ResultadoApi<VistaSesionUi>>;
  readonly leerSesionGuardada: () => string | null;
  readonly guardarSesionId: (sesionId: string) => void;
  readonly olvidarSesion: () => void;
};

export type CampoEnfocable = { readonly focus: () => void };

export type Acciones = {
  readonly cambiarBorrador: (borrador: string) => void;
  readonly enviar: () => void;
  readonly enviarTexto: (mensaje: string) => void;
  readonly responderConfirmacion: (accion: AccionDeTarjeta) => void;
  readonly recibirConfig: (resultado: ResultadoApi<ConfigResponse>) => void;
  readonly cargarConfig: (signal: AbortSignal) => Promise<void>;
  readonly cargarConfigTrasEntrar: (signal: AbortSignal) => Promise<void>;
  readonly reintentarConfig: (signal: AbortSignal) => Promise<void>;
  readonly cargarSesion: (sesionId: string, signal: AbortSignal) => Promise<void>;
  readonly detener: () => void;
  readonly recargar: () => void;
  readonly nuevaSesion: () => void;
  readonly volverASesionAnterior: () => void;
  readonly vencerAcceso: (aviso: string) => void;
  readonly refrescarSalud: () => void;
  readonly cancelarSalud: () => void;
  readonly abrirNuevaSesion: () => void;
  readonly cerrarNuevaSesion: () => void;
  readonly registrarCampoDelMensaje: (campo: CampoEnfocable | null) => void;
  readonly enfocarCampoDelMensaje: () => void;
};

export type InstanciaAlmacen = {
  readonly almacen: AlmacenRaiz;
  readonly acciones: Acciones;
};

export type PropsProveedorAlmacen = {
  readonly instancia: InstanciaAlmacen;
  readonly children: ReactNode;
};
