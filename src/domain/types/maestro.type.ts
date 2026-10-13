export type ValorMaestro =
  | string
  | number
  | boolean
  | null
  | readonly ValorMaestro[]
  | { readonly [clave: string]: ValorMaestro };

export type Maestro = Readonly<Record<string, ValorMaestro>>;
