export type ArgsSimularEnvio = { readonly caso: string; readonly confirmado: boolean };

export type DatosEnvio = {
  readonly caso: string;
  readonly ruta: string;
  readonly bloqueos: readonly string[];
};
