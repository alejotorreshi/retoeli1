export type PaqueteEsperado = { readonly archivos: readonly string[]; readonly borrador: string };

export type PaqueteReal = { readonly listado: readonly string[]; readonly borrador: string | null };

export type DiferenciasPaquete = {
  readonly archivos_faltantes: readonly string[];
  readonly archivos_sobrantes: readonly string[];
  readonly archivos_desactualizados: readonly string[];
};
