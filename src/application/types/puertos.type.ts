import type {
  ARCHIVO_FORMULARIO,
  ARCHIVOS_PAQUETE,
  ARCHIVOS_SALIDA,
} from "@/config/constants/files.constants.ts";
import type { ESTADO_LECTURA, ORIGEN_COPIA } from "@/config/constants/io.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { CodigoError } from "@/domain/types/errores.type.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";
import type { FilaCelda, FilaFormulario } from "@/domain/types/formulario.type.ts";
import type { Glosario } from "@/domain/types/glosario.type.ts";
import type { Maestro } from "@/domain/types/maestro.type.ts";
import type { PlantillaCaso, TipoPlantilla } from "@/domain/types/plantilla-caso.type.ts";
import type { ClavePlantilla, Reglas } from "@/domain/types/reglas.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import type { Solicitud } from "@/domain/types/solicitud.type.ts";
import type { SoporteIndice } from "@/domain/types/soportes.type.ts";

export type LecturaFallida =
  | { readonly estado: typeof ESTADO_LECTURA.NO_ENCONTRADO }
  | { readonly estado: typeof ESTADO_LECTURA.INVALIDO };

export type Lectura<T> = { readonly estado: typeof ESTADO_LECTURA.OK; readonly valor: T } | LecturaFallida;

export type ResolucionCaso =
  | { readonly estado: typeof ESTADO_LECTURA.OK; readonly directorio: string }
  | LecturaFallida;

export type CasosDisponibles = {
  resolver(caso: string): Promise<ResolucionCaso>;
  disponibles(): Promise<readonly string[]>;
};

export type FixturesCaso = {
  leerSolicitud(directorioCaso: string): Promise<Lectura<Solicitud>>;
  leerSoportesExigidos(directorioCaso: string): Promise<Lectura<readonly string[]>>;
  existePlantillaCaso(directorioCaso: string, tipo: TipoPlantilla): Promise<boolean>;
  leerPlantillaCaso(directorioCaso: string, tipo: TipoPlantilla): Promise<Lectura<PlantillaCaso>>;
};

export type Reloj = {
  hoy(): FechaISO;
  instanteReal(): string;
};

export type EntradaBitacora = {
  readonly herramienta: string;
  readonly ok: boolean;
  readonly resumen: string;
  readonly sesion: string;
  readonly caso?: string;
  readonly casoResuelto?: string;
  readonly codigo?: CodigoError;
};

export type Registrar = (entrada: EntradaBitacora) => Promise<void>;

export type ArchivoTexto =
  | typeof ARCHIVOS_SALIDA.MAPEO
  | typeof ARCHIVOS_SALIDA.VALORES_PORTAL
  | typeof ARCHIVOS_SALIDA.ENVIO_SIMULADO;

export type ArchivoBinario = typeof ARCHIVOS_SALIDA.FORMULARIO_XLSX | typeof ARCHIVOS_SALIDA.FORMULARIO_PDF;

export type ArchivoFormulario = ValorDe<typeof ARCHIVO_FORMULARIO>;

export type ArchivoPaquete = ValorDe<typeof ARCHIVOS_PAQUETE>;

export type OrigenCopia =
  | { readonly tipo: typeof ORIGEN_COPIA.FORMULARIO; readonly archivo: ArchivoFormulario }
  | { readonly tipo: typeof ORIGEN_COPIA.SOPORTE; readonly archivo: string };

export type SalidaCaso = {
  escribir(caso: string, archivo: ArchivoTexto, contenido: string): Promise<string>;
  escribirEnPaquete(caso: string, archivo: ArchivoPaquete, contenido: string): Promise<string>;
  binario(caso: string, archivo: ArchivoBinario, bytes: Uint8Array): Promise<string>;
  limpiarPrevios(caso: string): Promise<void>;
  existe(caso: string, archivo: ArchivoFormulario): Promise<boolean>;
  existeEnPaquete(caso: string, archivo: ArchivoPaquete): Promise<boolean>;
  reiniciarPaquete(caso: string): Promise<string>;
  listarPaquete(caso: string): Promise<readonly string[]>;
  leerDePaquete(caso: string, archivo: ArchivoPaquete): Promise<string | null>;
  copiar(caso: string, origen: OrigenCopia): Promise<string>;
};

export type SoportesRepositorio = {
  indice(): Promise<Lectura<readonly SoporteIndice[]>>;
  presentes(): Promise<Lectura<ReadonlySet<string>>>;
};

export type EntradaFormularioPdf = {
  readonly caso: string;
  readonly cliente: string;
  readonly filas: readonly FilaFormulario[];
};

export type GeneradoresFormulario = {
  xlsx(filas: readonly FilaCelda[], fecha: FechaISO): Promise<Uint8Array>;
  pdf(entrada: EntradaFormularioPdf, fecha: FechaISO): Promise<Uint8Array>;
};

export type PlantillasConocimiento = {
  cargar(reglas: Reglas, clave: ClavePlantilla): Promise<Resultado<string>>;
};

export type Candado = <T>(caso: string, seccion: () => Promise<T>) => Promise<T>;

export type Entorno = {
  readonly reloj: Reloj;
  readonly casos: CasosDisponibles;
  readonly fixtures: FixturesCaso;
  readonly salida: SalidaCaso;
  readonly soportes: SoportesRepositorio;
  readonly formularios: GeneradoresFormulario;
  readonly conocimiento: PlantillasConocimiento;
  readonly candado: Candado;
  reglas(): Promise<Resultado<Reglas>>;
  maestro(): Promise<Lectura<Maestro>>;
  glosario(): Promise<Lectura<Glosario>>;
};
