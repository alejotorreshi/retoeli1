import type { BoundFunctions, queries } from "@testing-library/dom";
import type { act, render, waitFor } from "@testing-library/react";
import type { UserEvent } from "@testing-library/user-event";
import type { RedWeb, RespuestasNativas } from "@tests/helpers/types/red-web.type.ts";
import type { InstanciaAlmacen } from "@web/types/store.type.ts";

export type OpcionesDom = {
  readonly ancho: number;
};

export type ConsultasDom = BoundFunctions<typeof queries>;

export type HerramientasDom = {
  readonly render: typeof render;
  readonly act: typeof act;
  readonly esperar: typeof waitFor;
  readonly pantalla: () => ConsultasDom;
  readonly dentroDe: (elemento: HTMLElement) => ConsultasDom;
  readonly usuario: () => UserEvent;
  readonly nativos: RespuestasNativas;
};

export type AppMontada = {
  readonly pantalla: ConsultasDom;
  readonly usuario: UserEvent;
  readonly red: RedWeb;
  readonly instancia: InstanciaAlmacen;
};
