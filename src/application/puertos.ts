import type { CodigoError } from "../domain/errores.ts";
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

export type Entorno = {
  readonly raiz: string;
  readonly patronCaso: RegExp;
  readonly reloj: Reloj;
  readonly casos: CasosDisponibles;
  readonly fixtures: FixturesCaso;
};
