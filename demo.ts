import { ejecutarDemo } from "./src/demo/ejecutar-demo.ts";

const resultado = await ejecutarDemo({ directorio: import.meta.dir, escribir: console.log });
if (resultado.fallido) process.exitCode = 1;
