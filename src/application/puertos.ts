import type { Plantilla, Solicitud, TipoPlantilla } from "../domain/tipos.ts";

export type Lectura<T> =
  | { readonly estado: "ok"; readonly valor: T }
  | { readonly estado: "no_encontrado" }
  | { readonly estado: "invalido" };

export type FixturesCaso = {
  leerSolicitud(caso: string): Promise<Lectura<Solicitud>>;
  leerSoportesExigidos(caso: string): Promise<Lectura<readonly string[]>>;
  existePlantilla(caso: string, tipo: TipoPlantilla): Promise<boolean>;
  leerPlantilla(caso: string, tipo: TipoPlantilla): Promise<Lectura<Plantilla>>;
};

export type Entorno = {
  readonly raiz: string;
  readonly patronCaso: RegExp;
  readonly fixtures: FixturesCaso;
};
