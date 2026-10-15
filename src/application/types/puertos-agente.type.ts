export type Instrucciones = { readonly prompt: string; readonly conocimiento: string };

export type LecturaInstrucciones =
  | { readonly ok: true; readonly instrucciones: Instrucciones }
  | { readonly ok: false; readonly archivo: string };

export type CargarInstrucciones = () => Promise<LecturaInstrucciones>;

export type SesionAbierta<S> = { readonly sesion: S; readonly nueva: boolean; readonly expirada: boolean };

export type SesionLeida<S> = { readonly sesion: S; readonly ocupada: boolean };

export type AlmacenSesiones<S extends { readonly id: string }> = {
  abrir(id: string | null): SesionAbierta<S>;
  leer(id: string): SesionLeida<S> | null;
  ocupar(id: string, plazoMs: number): string | null;
  liberar(id: string, candado: string): void;
  guardar(sesion: S, candado: string): boolean;
};

export type DestinoBitacora = { write(linea: string): void };

export type CamposBitacora = Readonly<Record<string, unknown>>;

export type BitacoraEstructurada = {
  depurar(evento: string, campos?: CamposBitacora): void;
  info(evento: string, campos?: CamposBitacora): void;
  advertir(evento: string, campos?: CamposBitacora): void;
  error(evento: string, campos?: CamposBitacora): void;
  hijo(campos: CamposBitacora): BitacoraEstructurada;
};
