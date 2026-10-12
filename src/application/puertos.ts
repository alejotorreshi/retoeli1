import type { CodigoError } from "../domain/errores.ts";
import type { FilaCelda, FilaFormulario } from "../domain/formulario.ts";
import type { Glosario, Maestro } from "../domain/mapeo.ts";
import type { ClavePlantilla, Reglas } from "../domain/reglas.ts";
import type { Resultado } from "../domain/resultado.ts";
import type { FechaISO, Plantilla, Solicitud, TipoPlantilla } from "../domain/tipos.ts";

export type Lectura<T> =
  | { readonly estado: "ok"; readonly valor: T }
  | { readonly estado: "no_encontrado" }
  | { readonly estado: "invalido" };

export type ResolucionCaso =
  | { readonly estado: "ok"; readonly directorio: string }
  | { readonly estado: "no_encontrado" }
  | { readonly estado: "invalido" };

export type CasosDisponibles = {
  resolver(caso: string): Promise<ResolucionCaso>;
  disponibles(): Promise<readonly string[]>;
};

export type FixturesCaso = {
  leerSolicitud(directorioCaso: string): Promise<Lectura<Solicitud>>;
  leerSoportesExigidos(directorioCaso: string): Promise<Lectura<readonly string[]>>;
  existePlantilla(directorioCaso: string, tipo: TipoPlantilla): Promise<boolean>;
  leerPlantilla(directorioCaso: string, tipo: TipoPlantilla): Promise<Lectura<Plantilla>>;
};

export type Reloj = {
  hoy(): FechaISO;
  ahora(): string;
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

export type ArchivoSalida = "mapeo" | "valoresPortal";

export type ArchivoBinario = "formularioXlsx" | "formularioPdf";

export type SalidaCaso = {
  escribir(caso: string, archivo: ArchivoSalida, contenido: string): Promise<string>;
  binario(caso: string, archivo: ArchivoBinario, bytes: Uint8Array): Promise<string>;
  limpiarPrevios(caso: string): Promise<void>;
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
  readonly raiz: string;
  readonly patronCaso: RegExp;
  readonly reloj: Reloj;
  readonly casos: CasosDisponibles;
  readonly fixtures: FixturesCaso;
  readonly salida: SalidaCaso;
  readonly formularios: GeneradoresFormulario;
  readonly plantillas: PlantillasConocimiento;
  readonly candado: Candado;
  reglas(): Promise<Resultado<Reglas>>;
  maestro(): Promise<Lectura<Maestro>>;
  glosario(): Promise<Lectura<Glosario>>;
};
