import type { Plantilla, Solicitud, TipoPlantilla } from "../domain/tipos.ts";

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

export type Entorno = {
  readonly raiz: string;
  readonly patronCaso: RegExp;
  readonly casos: CasosDisponibles;
  readonly fixtures: FixturesCaso;
};
