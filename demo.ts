import { ejecutarDemo } from "./src/demo/ejecutar-demo.ts";

const resultado = await ejecutarDemo({ directorio: import.meta.dir, escribir: console.log });
if (resultado.hayFallos) process.exitCode = 1;
