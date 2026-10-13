export type LecturaResultadoHerramienta = {
  readonly ok: boolean;
  readonly codigo?: string | undefined;
  readonly resumen?: string | undefined;
};

export type ArgumentosConCaso = { readonly caso: string };

export type SoporteArmado = {
  readonly tipo: string;
  readonly estado: string;
  readonly vigencia_hasta: string | null;
};

export type PaqueteArmadoLeido = {
  readonly ok: true;
  readonly data: {
    readonly bloqueos: readonly string[];
    readonly checklist: { readonly soportes: readonly SoporteArmado[] };
  };
};
