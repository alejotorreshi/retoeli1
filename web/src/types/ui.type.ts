import type { VARIANTE_LOGO } from "@web/config/constants/marca.constants.ts";
import type { PAIS } from "@web/config/constants/pais.constants.ts";
import type {
  DISENO,
  PESTANA,
  SENAL_SEGUIMIENTO,
  TAMANO_ICONO,
  TIPO_CAMPO_CODIGO,
  TONO,
  TONO_CONTADOR,
  TONO_DEL_MODELO,
} from "@web/config/constants/ui.constants.ts";
import type {
  AccionDeAviso,
  AccionDeTarjeta,
  ArchivoUi,
  AvisoDeSesion,
  ContadorDeCaso,
  EstadoAcceso,
  EstadoCampoUi,
  EstadoEtapa,
  EstadoFilaVistaPrevia,
  EstadoFirma,
  EstadoHerramienta,
  EstadoListaArchivos,
  EstadoModelo,
  EstadoVistaPrevia,
  LlamadaDelTurno,
  ProgresoDeCaso,
  ResultadoDeCaso,
  SaludModelo,
  TarjetaDeConfirmacion,
  TurnoConversacion,
  VistaPreviaUi,
} from "@web/types/chat.type.ts";
import type { InstanciaAlmacen } from "@web/types/store.type.ts";
import type {
  ChangeEvent,
  FormEvent,
  HTMLAttributes,
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  RefObject,
  SyntheticEvent,
} from "react";
import type { ESTADO_LLM } from "@/config/constants/llm.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type TamanoIcono = ValorDe<typeof TAMANO_ICONO>;

export type PropsIcono = {
  readonly tamano?: TamanoIcono;
};

export type ComponenteIcono = (props: PropsIcono) => ReactNode;

export type PropsSvgIcono = {
  readonly tamano: TamanoIcono;
  readonly clase?: string;
  readonly children: ReactNode;
};

export type PropsAviso = {
  readonly mensaje: string;
  readonly acciones?: ReactNode;
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
  | {
      readonly tipo: typeof SENAL_SEGUIMIENTO.CRECIMIENTO;
      readonly distancia: number;
      readonly turnos: number;
    }
  | { readonly tipo: typeof SENAL_SEGUIMIENTO.ENVIO }
  | { readonly tipo: typeof SENAL_SEGUIMIENTO.IR_AL_FINAL }
  | { readonly tipo: typeof SENAL_SEGUIMIENTO.VACIO };

export type PropsAvisoInicial = {
  readonly aviso: AvisoDeSesion;
};

export type PropsCuerpoLinea = {
  readonly turnos: readonly TurnoEnLinea[];
  readonly cargando: boolean;
};

export type PropsAccionesRapidas = {
  readonly compactas: boolean;
  readonly angosto: boolean;
};

export type TextosDeChip = {
  readonly texto: string;
  readonly etiqueta: string | undefined;
};

export type ControlAccionesRapidas = {
  readonly deshabilitadas: boolean;
  readonly todosDeshabilitado: boolean;
  readonly demo: TextosDeChip;
  readonly todos: TextosDeChip;
  readonly alPedirDemo: () => void;
  readonly alPedirTodos: () => void;
  readonly alPedirListado: () => void;
};

export type AccionDelError = {
  readonly accion: AccionDeAviso;
  readonly alPulsar: () => void;
};

export type TurnoEnLinea = {
  readonly turno: TurnoConversacion;
  readonly enCurso: boolean;
  readonly resultados: readonly ResultadoDeCaso[];
  readonly confirmaciones: PropsPilaConfirmaciones;
  readonly accionDelError: AccionDelError | null;
};

export type PropsTurno = {
  readonly entrada: TurnoEnLinea;
};

export type ControlLineaDeTiempo = {
  readonly zona: RefObject<HTMLElement | null>;
  readonly contenido: RefObject<HTMLDivElement | null>;
  readonly siguiendo: boolean;
  readonly contenidoNuevo: boolean;
  readonly alDesplazar: (evento: SyntheticEvent<HTMLElement>) => void;
  readonly irAlFinal: () => void;
  readonly aviso: AvisoDeSesion | null;
  readonly cargando: boolean;
  readonly turnos: readonly TurnoEnLinea[];
  readonly indicador: PropsIndicadorPensando | null;
  readonly anuncio: string;
};

export type PropsErrorDelTurno = {
  readonly mensaje: string;
  readonly accion: AccionDelError | null;
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

export type TarjetaEnPila = {
  readonly tarjeta: TarjetaDeConfirmacion;
  readonly listoParaFirma: boolean | null;
};

export type ControlTarjetaConfirmacion = {
  readonly idTitulo: string;
  readonly idAyuda: string;
  readonly firma: EstadoFirma;
  readonly abierta: boolean;
  readonly bloqueada: boolean;
  readonly cantidadBloqueos: number;
  readonly ayuda: string;
  readonly textoConfirmar: string;
  readonly textoCancelar: string;
  readonly alConfirmar: () => void;
  readonly alCancelar: () => void;
};

export type PropsTarjetaResultado = {
  readonly resultado: ResultadoDeCaso;
};

export type TonoContador = EstadoCampoUi | ValorDe<typeof TONO_CONTADOR>;

export type ContadorConTono = ContadorDeCaso & {
  readonly tono: TonoContador;
};

export type ControlTarjetaResultado = {
  readonly idTitulo: string;
  readonly firma: EstadoFirma;
  readonly bloqueosVisibles: readonly string[] | null;
  readonly contadores: readonly ContadorConTono[];
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

export type ControlGrupoHerramientas = {
  readonly abierto: boolean;
  readonly resumen: string;
  readonly alAlternar: (evento: SyntheticEvent<HTMLDetailsElement>) => void;
};

export type ControlTarjetaHerramienta = {
  readonly argumentos: string;
  readonly resumen: string;
  readonly resultado: string;
  readonly codigoVisible: string | null;
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

export type ContadorCompositor = {
  readonly texto: string;
  readonly enElLimite: boolean;
};

export type ControlCompositor = {
  readonly registrarCampo: (campo: HTMLTextAreaElement | null) => void;
  readonly idAyuda: string;
  readonly idContador: string;
  readonly descritoPor: string;
  readonly valor: string;
  readonly maximo: number | undefined;
  readonly enCurso: boolean;
  readonly deshabilitado: boolean;
  readonly ayuda: string;
  readonly contador: ContadorCompositor | null;
  readonly uso: string | null;
  readonly alCambiar: (evento: ChangeEvent<HTMLTextAreaElement>) => void;
  readonly alEnviarFormulario: (evento: FormEvent<HTMLFormElement>) => void;
  readonly alPresionarTecla: (evento: KeyboardEvent<HTMLTextAreaElement>) => void;
  readonly alDetener: () => void;
};

export type VarianteLogo = ValorDe<typeof VARIANTE_LOGO>;

export type PropsLogoMarca = {
  readonly variante: VarianteLogo;
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
  readonly varianteLogo: VarianteLogo;
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

export type TonoDelAvisoModelo = (typeof TONO_DEL_MODELO)[EstadoModeloConAviso];

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
};

export type TipoCampoCodigo = ValorDe<typeof TIPO_CAMPO_CODIGO>;

export type ControlPantallaAcceso = {
  readonly idCampo: string;
  readonly idError: string;
  readonly campo: RefObject<HTMLInputElement | null>;
  readonly codigo: string;
  readonly visible: boolean;
  readonly tipoCampo: TipoCampoCodigo;
  readonly pendiente: boolean;
  readonly error: string | null;
  readonly envioDeshabilitado: boolean;
  readonly alCambiarCodigo: (evento: ChangeEvent<HTMLInputElement>) => void;
  readonly alAlternarVisible: () => void;
  readonly alEnviarFormulario: (evento: FormEvent<HTMLFormElement>) => void;
};

export type PropsProgresoCaso = {
  readonly progreso: ProgresoDeCaso;
};

export type PropsIconoDeEtapa = {
  readonly estado: EstadoEtapa;
};

export type OpcionesBloqueCaso = {
  readonly progreso: ProgresoDeCaso;
  readonly reciente: boolean;
  readonly marca: number;
};

export type PropsBloqueCaso = OpcionesBloqueCaso & {
  readonly envioDeshabilitado: boolean;
};

export type ControlPanelCasos = {
  readonly idTitulo: string;
  readonly bloques: readonly PropsBloqueCaso[];
};

export type AlVerArchivo = (archivo: ArchivoUi, disparador: HTMLElement) => void;

export type OpcionesArchivos = {
  readonly caso: string;
  readonly activo: boolean;
  readonly marca: number;
  readonly alVencerAcceso: (aviso: string) => void;
};

export type ControlArchivos = {
  readonly estado: EstadoListaArchivos;
  readonly vacia: boolean;
  readonly borrados: boolean;
  readonly reintentar: () => void;
  readonly descargar: (archivo: ArchivoUi) => void;
  readonly marcarBorrados: () => void;
};

export type ControlBloqueCaso = {
  readonly abierto: boolean;
  readonly alAlternar: (evento: SyntheticEvent<HTMLDetailsElement>) => void;
  readonly archivos: ControlArchivos;
  readonly vistaPrevia: VistaPreviaAbierta | null;
  readonly alVer: AlVerArchivo;
  readonly alCerrarVistaPrevia: () => void;
  readonly discoBorrado: boolean;
  readonly enviarTexto: (mensaje: string) => void;
};

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

export type ControlFilaArchivo = {
  readonly ruta: string;
  readonly nombreDescarga: string;
  readonly alPulsarVer: (evento: MouseEvent<HTMLButtonElement>) => void;
  readonly alPulsarDescargar: (evento: MouseEvent<HTMLAnchorElement>) => void;
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

export type PropsBarraPestanas = {
  readonly control: ControlPestanas;
  readonly ids: IdsDePestanas;
};

export type RegistroDeBoton = (boton: HTMLButtonElement | null) => void;

export type PestanaEnBarra = {
  readonly pestana: Pestana;
  readonly id: string;
  readonly idVista: string;
  readonly elegida: boolean;
  readonly conPunto: boolean;
  readonly registrar: RegistroDeBoton;
  readonly alElegir: () => void;
};

export type ControlBarraPestanas = {
  readonly pestanas: readonly PestanaEnBarra[];
  readonly alTeclear: (evento: KeyboardEvent<HTMLDivElement>) => void;
};

export type ControlColumnas = {
  readonly acceso: EstadoAcceso;
  readonly diseno: Diseno;
  readonly angosto: boolean;
  readonly conPestanas: boolean;
  readonly conHistorial: boolean;
  readonly pestanas: ControlPestanas;
  readonly ids: IdsDePestanas;
  readonly vistaChat: HTMLAttributes<HTMLDivElement>;
  readonly vistaCasos: HTMLAttributes<HTMLDivElement>;
};

export type VistaPreviaAbierta = {
  readonly archivo: ArchivoUi;
  readonly disparador: HTMLElement;
};

export type VistaPreviaDeApertura = {
  readonly abierta: VistaPreviaAbierta;
  readonly estado: EstadoVistaPrevia;
};

export type OpcionesDialogoVistaPrevia = {
  readonly caso: string;
  readonly abierta: VistaPreviaAbierta | null;
  readonly alDescargar: (archivo: ArchivoUi) => void;
  readonly alNoEncontrado: () => void;
};

export type PropsDialogoVistaPrevia = OpcionesDialogoVistaPrevia & {
  readonly alCerrar: () => void;
};

export type ControlDialogoVistaPrevia = {
  readonly dialogo: RefObject<HTMLDialogElement | null>;
  readonly cerrarBoton: RefObject<HTMLButtonElement | null>;
  readonly idTitulo: string;
  readonly estado: EstadoVistaPrevia;
  readonly cerrar: () => void;
  readonly descargar: () => void;
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

export type ControlAvisoDiscoEfimero = {
  readonly alProcesarDeNuevo: () => void;
};

export type PropsApp = {
  readonly instancia: InstanciaAlmacen;
};

export type Pais = ValorDe<typeof PAIS>;

export type PaisDeTarjeta = {
  readonly codigo: string;
  readonly nombre: string;
};

export type DatosTarjetaCaso = {
  readonly cliente: string;
  readonly pais: PaisDeTarjeta | null;
};

export type PropsTarjetaCaso = {
  readonly slug: string;
};

export type ControlTarjetaCaso = {
  readonly cliente: string;
  readonly pais: PaisDeTarjeta | null;
  readonly etiqueta: string;
  readonly deshabilitada: boolean;
  readonly alProcesar: () => void;
};

export type ControlEstadoVacio = {
  readonly contenedor: RefObject<HTMLDivElement | null>;
  readonly idCasos: string;
  readonly idAcciones: string;
  readonly casos: readonly string[];
  readonly mostrarCasos: boolean;
  readonly casosNoDisponibles: boolean;
};
