## Deferred Items

- Las pruebas de `tests/e2e/demo.test.ts` y `tests/e2e/determinismo.test.ts` dependen del orden dentro de cada archivo
  status: open
  **Qué:** con `bun test --randomize` fallan entre 1 y 10 pruebas de esos dos archivos, aun corridos solos y sin ningún archivo DOM (semillas 3587237123, 98597067, 357047350). Con `bun test`, `--isolate` y `--parallel=2` pasan.
  **Dónde se vio:** plan 05-01, tarea 3, durante un chequeo extra de inestabilidad que no forma parte de la verificación del plan.
  **Por qué se difiere:** es previo a la fase 5 y ajeno al front; corregirlo toca las pruebas e2e del agente.
