import { ejecutarDemo } from "@/demo/runners/ejecutar-demo.runner.ts";

const resultado = await ejecutarDemo({ directorio: import.meta.dir, escribir: console.log });
if (resultado.fallido) process.exitCode = 1;
