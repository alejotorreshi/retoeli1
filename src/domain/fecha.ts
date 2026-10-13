export function esFechaReal(texto: string): boolean {
  const milisegundos = Date.parse(`${texto}T00:00:00Z`);
  return !Number.isNaN(milisegundos) && new Date(milisegundos).toISOString().slice(0, 10) === texto;
}
