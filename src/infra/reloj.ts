import type { Reloj } from "@/application/puertos.ts";
import { PATRON_FECHA } from "@/config/constants/patterns.constants.ts";
import { LOCALE_INTL } from "@/config/constants/runtime.constants.ts";
import { TEXTO_INFRA } from "@/config/strings.ts";
import type { FechaISO } from "@/domain/types/fecha.type.ts";

function esFechaISO(texto: string): texto is FechaISO {
  return PATRON_FECHA.test(texto);
}

function comoFechaISO(texto: string): FechaISO {
  if (esFechaISO(texto)) return texto;
  throw new RangeError(TEXTO_INFRA.fechaSinFormato);
}

function instanteReal(): string {
  return new Date().toISOString();
}

function parte(partes: readonly Intl.DateTimeFormatPart[], tipo: Intl.DateTimeFormatPartTypes): string {
  return partes.find((candidata) => candidata.type === tipo)?.value ?? "";
}

export function relojSistema(zona: string): Reloj {
  const formato = new Intl.DateTimeFormat(LOCALE_INTL, {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const hoy = (): FechaISO => {
    const partes = formato.formatToParts(new Date());
    return comoFechaISO(`${parte(partes, "year")}-${parte(partes, "month")}-${parte(partes, "day")}`);
  };
  return { hoy, instanteReal };
}

export function relojFijo(fecha: string): Reloj {
  const hoy = comoFechaISO(fecha);
  return { hoy: () => hoy, instanteReal };
}
