export type ValorEscalar = string | number;

export type FilaPlantilla = Readonly<Record<string, ValorEscalar>>;

export type ValorPlantilla = ValorEscalar | readonly FilaPlantilla[];

export type ContextoPlantilla = Readonly<Record<string, ValorPlantilla>>;
