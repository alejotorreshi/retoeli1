import type { FORMATO } from "@/config/constants/forms.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { ConteoVisible } from "@/loop/types/resultado-visible.type.ts";

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

export type DatosPaqueteLeidos = {
  readonly bloqueos: readonly string[];
  readonly checklist: { readonly soportes: readonly SoporteArmado[] };
};

export type PaqueteArmadoLeido = {
  readonly ok: true;
  readonly data: DatosPaqueteLeidos;
};

export type PaqueteVisibleLeido = {
  readonly ok: true;
  readonly data: DatosPaqueteLeidos & { readonly ruta: string; readonly listo_para_firma: boolean };
};

export type SolicitudLeida = {
  readonly ok: true;
  readonly data: { readonly pais: string; readonly formato: ValorDe<typeof FORMATO> };
};

export type MapeoLeido = {
  readonly ok: true;
  readonly data: { readonly pais: string; readonly conteo: ConteoVisible };
};

export type FormularioLeido = {
  readonly ok: true;
  readonly data: {
    readonly ruta: string;
    readonly formato: ValorDe<typeof FORMATO>;
    readonly conteo?: ConteoVisible | undefined;
    readonly aviso?: string | null | undefined;
  };
};

export type EnvioLeido = {
  readonly ok: true;
  readonly data: { readonly ruta: string };
};
