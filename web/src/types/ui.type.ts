import type {
  DISENO,
  PESTANA,
  SENAL_SEGUIMIENTO,
  TAMANO_ICONO,
  TONO,
} from "@web/config/constants/ui.constants.ts";
import type {
  AccionDeAviso,
  AccionDeTarjeta,
  ArchivoUi,
  AvisoDeSesion,
  ControlArchivos,
  ErrorVisible,
  EstadoEtapa,
  EstadoFilaVistaPrevia,
  EstadoHerramienta,
  EstadoModelo,
  LlamadaDelTurno,
  ProgresoDeCaso,
  ResultadoDeCaso,
  SaludModelo,
  TarjetaDeConfirmacion,
  TurnoConversacion,
  UsoDeSesion,
  VistaPreviaUi,
} from "@web/types/chat.type.ts";
import type { InstanciaAlmacen } from "@web/types/store.type.ts";
import type { ReactNode, RefObject } from "react";
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
  readonly cargando: boolean;
  readonly aviso: AvisoDeSesion | null;
  readonly enCurso: boolean;
  readonly pausada: boolean;
  readonly tarjetasConfirmacion: readonly TarjetaDeConfirmacion[];
  readonly alResponderConfirmacion: (accion: AccionDeTarjeta) => void;
  readonly alAccionDeAviso: (accion: AccionDeAviso) => void;
  readonly acciones: ReactNode;
  readonly children?: ReactNode;
};

export type EstadoSeguimiento = {
  readonly pegado: boolean;
  readonly contenidoNuevo: boolean;
  readonly posicion: number | null;
  readonly distancia: number | null;
};

export type SenalSeguimiento =
  | { readonly tipo: typeof SENAL_SEGUIMIENTO.AJUSTE_PROPIO; readonly posicion: number }
  | {
      readonly tipo: typeof SENAL_SEGUIMIENTO.DESPLAZAMIENTO;
      readonly posicion: number;
      readonly distancia: number;
    }
  | { readonly tipo: typeof SENAL_SEGUIMIENTO.CRECIMIENTO; readonly distancia: number }
  | { readonly tipo: typeof SENAL_SEGUIMIENTO.ENVIO }
  | { readonly tipo: typeof SENAL_SEGUIMIENTO.IR_AL_FINAL };

export type PropsAvisoInicial = {
  readonly aviso: AvisoDeSesion;
};

export type PropsCuerpoLinea = {
  readonly turnos: readonly TurnoConversacion[];
  readonly cargando: boolean;
  readonly enCurso: boolean;
  readonly pausada: boolean;
  readonly tarjetasConfirmacion: readonly TarjetaDeConfirmacion[];
  readonly alResponderConfirmacion: (accion: AccionDeTarjeta) => void;
  readonly alAccionDeAviso: (accion: AccionDeAviso) => void;
  readonly acciones: ReactNode;
};

export type PropsEstadoVacio = {
  readonly acciones: ReactNode;
};

export type PropsAccionesRapidas = {
  readonly casos: readonly string[];
  readonly deshabilitadas: boolean;
  readonly compactas: boolean;
  readonly angosto: boolean;
  readonly alEnviar: (mensaje: string) => void;
};

export type PropsTurno = {
  readonly turno: TurnoConversacion;
  readonly enCurso: boolean;
  readonly resultados: readonly ResultadoDeCaso[];
  readonly confirmaciones: ReactNode;
  readonly alAccionDeAviso: (accion: AccionDeAviso) => void;
};

export type PropsErrorDelTurno = {
  readonly error: ErrorVisible;
  readonly alAccionDeAviso: (accion: AccionDeAviso) => void;
};

export type PropsPilaConfirmaciones = {
  readonly tarjetas: readonly TarjetaDeConfirmacion[];
  readonly turnos: readonly TurnoConversacion[];
  readonly ocupada: boolean;
  readonly pausada: boolean;
  readonly alResponder: (accion: AccionDeTarjeta) => void;
};

export type PropsTarjetaConfirmacion = {
  readonly tarjeta: TarjetaDeConfirmacion;
  readonly listoParaFirma: boolean | null;
  readonly ocupada: boolean;
  readonly pausada: boolean;
  readonly alResponder: (accion: AccionDeTarjeta) => void;
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
  readonly bloqueado: boolean;
  readonly pausado: boolean;
  readonly uso: UsoDeSesion | null;
  readonly alCambiar: (valor: string) => void;
  readonly alEnviar: () => void;
  readonly alDetener: () => void;
};

export type PropsEncabezado = {
  readonly angosto: boolean;
};

export type ControlEncabezado = {
  readonly fechaEjecucion: string | null;
  readonly salud: SaludModelo | null;
  readonly nuevaSesionDeshabilitada: boolean;
  readonly abrirNuevaSesion: () => void;
  readonly clasePrefijo: string | undefined;
};

export type ControlDialogoNuevaSesion = {
  readonly dialogo: RefObject<HTMLDialogElement | null>;
  readonly seguir: RefObject<HTMLButtonElement | null>;
  readonly idTitulo: string;
  readonly idCuerpo: string;
  readonly alCerrarDialogo: () => void;
  readonly cerrar: () => void;
  readonly confirmar: () => void;
};

export type Tono = ValorDe<typeof TONO>;

export type EstadoModeloConAviso = Exclude<EstadoModelo, typeof ESTADO_LLM.DISPONIBLE>;

export type PartesAvisoModelo = {
  readonly titulo: string;
  readonly detalle: string;
};

export type ControlAvisoModelo = {
  readonly estado: EstadoModeloConAviso | null;
  readonly zona: string | null;
  readonly comprobando: boolean;
  readonly alComprobar: () => void;
};

export type PropsCuerpoAvisoModelo = {
  readonly estado: EstadoModeloConAviso;
  readonly zona: string | null;
  readonly comprobando: boolean;
  readonly alComprobar: () => void;
};

export type PropsEstadoDelModelo = {
  readonly salud: SaludModelo;
  readonly clasePrefijo: string | undefined;
};

export type PropsPantallaAcceso = {
  readonly aviso: string | null;
  readonly alEntrar: () => Promise<void>;
};

export type PropsProgresoCaso = {
  readonly progreso: ProgresoDeCaso;
};

export type PropsIconoDeEtapa = {
  readonly estado: EstadoEtapa;
};

export type PropsPanelCasos = {
  readonly progresos: readonly ProgresoDeCaso[];
  readonly marcas: ReadonlyMap<string, number>;
  readonly envioDeshabilitado: boolean;
  readonly alEnviar: (mensaje: string) => void;
  readonly alVencerAcceso: (aviso: string) => void;
};

export type PropsBloqueCaso = {
  readonly progreso: ProgresoDeCaso;
  readonly reciente: boolean;
  readonly marca: number;
  readonly envioDeshabilitado: boolean;
  readonly alEnviar: (mensaje: string) => void;
  readonly alVencerAcceso: (aviso: string) => void;
};

export type AlVerArchivo = (archivo: ArchivoUi, disparador: HTMLElement) => void;

export type PropsListaArchivos = {
  readonly caso: string;
  readonly control: ControlArchivos;
  readonly alVer: AlVerArchivo;
};

export type PropsFilaArchivo = {
  readonly caso: string;
  readonly archivo: ArchivoUi;
  readonly alVer: AlVerArchivo;
  readonly alDescargar: (archivo: ArchivoUi) => void;
};

export type Diseno = ValorDe<typeof DISENO>;

export type Pestana = ValorDe<typeof PESTANA>;

export type ControlPestanas = {
  readonly pestana: Pestana;
  readonly elegir: (pestana: Pestana) => void;
  readonly cambiosSinVer: boolean;
};

export type IdsDePestanas = {
  readonly pestana: (pestana: Pestana) => string;
  readonly vista: (pestana: Pestana) => string;
};

export type PropsBarraDePestanas = {
  readonly control: ControlPestanas;
  readonly ids: IdsDePestanas;
};

export type VistaPreviaAbierta = {
  readonly archivo: ArchivoUi;
  readonly disparador: HTMLElement;
};

export type PropsDialogoVistaPrevia = {
  readonly caso: string;
  readonly abierta: VistaPreviaAbierta | null;
  readonly alCerrar: () => void;
  readonly alDescargar: (archivo: ArchivoUi) => void;
  readonly alNoEncontrado: () => void;
  readonly alVencerAcceso: (aviso: string) => void;
};

export type PropsCuerpoVistaPrevia = {
  readonly vista: VistaPreviaUi;
};

export type PropsBadgeDeFila = {
  readonly estado: EstadoFilaVistaPrevia;
};

export type PropsAvisoDiscoEfimero = {
  readonly caso: string;
  readonly deshabilitado: boolean;
  readonly alProcesar: (mensaje: string) => void;
};

export type PropsApp = {
  readonly instancia: InstanciaAlmacen;
};
