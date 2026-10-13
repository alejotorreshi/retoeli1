import type { Reloj } from "../application/puertos.ts";
import { PATRON_FECHA } from "../config/constantes.ts";
import type { FechaISO } from "../domain/tipos.ts";

function esFechaISO(texto: string): texto is FechaISO {
  return PATRON_FECHA.test(texto);
}

function comoFechaISO(texto: string): FechaISO {
  if (esFechaISO(texto)) return texto;
  throw new RangeError("La fecha no tiene el formato YYYY-MM-DD.");
}

function instanteReal(): string {
  return new Date().toISOString();
}

export function relojSistema(zona: string): Reloj {
  const formato = new Intl.DateTimeFormat("en-CA", {
    timeZone: zona,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return { hoy: () => comoFechaISO(formato.format(new Date())), instanteReal };
}

export function relojFijo(fecha: string): Reloj {
  const hoy = comoFechaISO(fecha);
  return { hoy: () => hoy, instanteReal };
}
