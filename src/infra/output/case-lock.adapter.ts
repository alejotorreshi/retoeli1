const colas = new Map<string, Promise<void>>();

function ignorar(): undefined {
  return undefined;
}

export async function withCaseLock<T>(clave: string, seccion: () => Promise<T>): Promise<T> {
  const previa = colas.get(clave) ?? Promise.resolve();
  const ejecucion = previa.then(seccion);
  const cola = ejecucion.then(ignorar, ignorar);
  colas.set(clave, cola);
  try {
    return await ejecucion;
  } finally {
    if (colas.get(clave) === cola) colas.delete(clave);
  }
}
