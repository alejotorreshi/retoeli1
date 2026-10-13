export type Glosario = Readonly<Record<string, string>>;

export type IndiceGlosario = {
  readonly exacto: ReadonlyMap<string, string>;
  readonly normalizado: ReadonlyMap<string, string>;
};
