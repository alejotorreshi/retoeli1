import type {
  AccionUi,
  Despachar,
  EstadoConversacion,
  ResultadoApi,
  VistaSesionUi,
} from "@web/types/chat.type.ts";
import type { ChatBody, ConfigResponse, HealthResponse } from "@/http/types/api.type.ts";

export type Almacen<E, A> = {
  readonly leer: () => E;
  readonly suscribir: (oyente: () => void) => () => void;
  readonly despachar: (accion: A) => void;
};

export type EstadoRaiz = {
  readonly conversacion: EstadoConversacion;
};

export type AccionRaiz = AccionUi;

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

export type Acciones = {
  readonly cambiarBorrador: (borrador: string) => void;
  readonly enviar: () => void;
  readonly enviarTexto: (mensaje: string) => void;
  readonly refrescarSalud: () => void;
};

export type InstanciaAlmacen = {
  readonly almacen: AlmacenRaiz;
  readonly acciones: Acciones;
};
