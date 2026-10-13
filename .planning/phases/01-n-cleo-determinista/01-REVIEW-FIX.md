---
phase: 01-n-cleo-determinista
fixed_at: 2026-10-13T15:51:52Z
review_path: .planning/phases/01-n-cleo-determinista/01-REVIEW.md
iteration: 1
findings_in_scope: 8
fixed: 8
skipped: 0
status: all_fixed
---

# Fase 01: informe de corrección de la revisión de código

**Corregido:** 2026-10-13T15:51:52Z
**Revisión de origen:** .planning/phases/01-n-cleo-determinista/01-REVIEW.md (revisión de los commits `fix(01)` posteriores a `2fb3986`)
**Iteración:** 1

**Resumen:**
- Hallazgos en alcance: 8 (1 crítico, 3 advertencias, 4 informativos; alcance `all`)
- Corregidos: 8
- Omitidos: 0

**Verificación:** después de cada commit se corrieron `bun run check` (tsc, Biome y `bun audit`) y `bun test` en el worktree aislado `.claude/worktrees/rf-01-55412-1791906186`, que tenía su propio `bun install --frozen-lockfile`. Tras el fast-forward de `main` se repitieron en el checkout principal, donde sí existe `reto-01/fixtures/reto-01/casos/.DS_Store`: `check` quedó limpio y pasaron las 559 pruebas de 39 archivos, sin fallos. Ese resultado confirma WR-03 en macOS. El stdout de `bun run demo.ts` es idéntico byte a byte al de antes de las correcciones, tanto en el worktree como en el checkout principal. Los archivos de texto de `out/` también son idénticos, salvo un cambio buscado: el `checklist.md` de HN pierde la casilla que pedía confirmar el emisor de la certificación de parafiscales vencida (WR-02). Los `.xlsx` solo difieren en las marcas de tiempo del zip, que ya estaban documentadas como volátiles. El contrato v1 de datos no cambia: `data.bloqueos`, `resumen` y `log.jsonl` siguen con ids crudos, y `armar_paquete` devuelve el mismo `checklist`. El único cambio visible para el modelo está en `parcial` de `PAQUETE_DESACTUALIZADO`, que ahora trae siempre tres listas: `archivos_faltantes`, `archivos_sobrantes` y `archivos_desactualizados`.

## Fixed Issues

### CR-01: `PAQUETE_DESACTUALIZADO` solo detecta archivos faltantes; un paquete con el estado cambiado pasa el envío y el borrador viejo promete adjuntos que no salen

**Archivos modificados:** `src/domain/policies/paquete-vigente.policy.ts`, `src/domain/types/paquete.type.ts` (nuevo), `src/application/services/contenido-paquete.service.ts` (nuevo), `src/application/use-cases/armar-paquete.use-case.ts`, `src/application/use-cases/simular-envio.use-case.ts`, `src/application/types/puertos.type.ts`, `src/infra/output/output-files.adapter.ts`, `src/tools/wiring/entorno.wiring.ts`, `src/config/strings.ts`, `tests/contract/simular-envio.test.ts`, `tests/unit/paquete-vigente.policy.test.ts`
**Commit:** f147af0
**Corrección aplicada:** al momento de enviar, `simular_envio` vuelve a derivar desde el repositorio actual lo que `armar_paquete` pondría hoy en `paquete/`, y lo compara con lo que hay. Las piezas son tres:

- La política `diferenciasDelPaquete` cruza el conjunto esperado con el listado real. El conjunto esperado es `archivosDelPaquete`: formulario, soportes con archivo, `checklist.md` y `borrador-correo.md`. El cruce da los faltantes y los sobrantes.
- La misma política vuelve a renderizar el borrador con el checklist vigente y lo compara con `paquete/borrador-correo.md`, que se lee con el puerto nuevo `salida.leerDePaquete`. Este puerto está implementado en `readPackageFile`, con lista blanca y `realpath` dentro del caso.
- Si hay cualquier diferencia, `simular_envio` responde con el código existente `PAQUETE_DESACTUALIZADO`, cuyo mensaje sigue apuntando a `proveedor_armar_paquete`, y no escribe `ENVIO-SIMULADO.md`.

`renderizarChecklist` y `renderizarBorrador` pasaron al servicio compartido `contenido-paquete.service.ts`, así que `armar_paquete` y `simular_envio` usan el mismo renderizado.

El contenido de `checklist.md` no se compara a propósito. Lleva la fecha de ejecución y avisos que dependen del día ("vence en N días"), así que compararlo rechazaría un paquete intacto armado el día anterior. El borrador no lleva fecha y refleja todo el estado que importa al cliente: adjuntos, pendientes, preguntas y cierre de firma.

Las pruebas de contrato nuevas cubren cinco casos:

- un soporte que vence entre armar y enviar (CO armado el 2026-09-03 y enviado el 2026-10-05): sale el borrador desactualizado, y después de volver a armar la cámara de comercio va a "Soportes vencidos que no se envían";
- `rut` quitado del índice: `rut-2026.txt` sale como sobrante, el borrador como desactualizado, y después de volver a armar el envío registra `ausente: rut` y el archivo ya no queda en `paquete/`;
- un archivo ajeno dejado en `paquete/`;
- `borrador-correo.md` borrado, que sale como faltante;
- un paquete recién armado sin cambios, que se envía bien dos veces seguidas.

Se mantuvieron las pruebas anteriores (soporte borrado, formulario borrado, soporte renovado), con el `parcial` ampliado. En el renovado de HN, la copia vieja `parafiscales-2026-07.txt` ahora aparece además como sobrante.

**Estado:** fixed: requires human verification. Cambia la lógica de aceptación del envío. Hay un efecto que conviene decidir: si la analista edita a mano `paquete/borrador-correo.md`, el envío ahora se rechaza como desactualizado hasta que vuelva a armar el paquete. Tampoco se ignoran archivos ocultos dentro de `paquete/`: un `.DS_Store` que deje Finder también cuenta como sobrante.

### IN-01: `archivosEsperados` duplica la regla de qué copia `armar_paquete` a `paquete/`

**Archivos modificados:** `src/domain/policies/paquete-vigente.policy.ts`, `src/application/use-cases/armar-paquete.use-case.ts`, `tests/unit/paquete-vigente.policy.test.ts`
**Commit:** f147af0 (el mismo de CR-01, porque la fuente única es parte del diseño de esa corrección)
**Corrección aplicada:** `soportesDelPaquete(soportes)` es ahora la única definición de qué soportes se copian. `copiarContenido` de `armar_paquete` la usa para copiar, y `archivosDelPaquete(checklist, formulario)` la usa para el conjunto esperado al enviar. Desapareció `archivosEsperados`.
**Estado:** fixed

### WR-01: Regresión de WR-02: si los únicos campos por confirmar son bancarios, el borrador declara el formulario "listo para la firma" y el checklist pide confirmarlos con el cliente

**Archivos modificados:** `src/domain/builders/checklist.builder.ts`, `src/domain/builders/borrador.builder.ts`, `src/domain/types/checklist.type.ts`, `src/domain/types/borrador.type.ts`, `src/knowledge/plantillas/checklist.md`, `src/knowledge/plantillas/borrador-correo.md`, `tests/unit/borrador.builder.test.ts`, `tests/unit/checklist.builder.test.ts`, `tests/unit/paquete-vigente.policy.test.ts`
**Commit:** 57c415a
**Corrección aplicada:** `Checklist` ahora separa `confirmaciones_internas` (rutas `banco.*`) de `confirmaciones_al_cliente`.

- **Checklist.** `checklist.md` sigue listando todos los campos en "Campos por confirmar", con su nota. En "Acciones", los no bancarios conservan "Confirmar con el cliente el campo …" y los bancarios pasan a "Confirmar internamente el campo …". Para eso hay dos listas nuevas en `DatosChecklist`: `confirmar_con_cliente` y `confirmar_internamente`.
- **Borrador.** `firma_lista` exige que no haya ni preguntas al cliente ni confirmaciones internas. Si las únicas pendientes son internas, se activa la bandera nueva `firma_tras_validar`, con el texto "Validaremos internamente algunos datos del formulario antes de pasarlo a la firma de nuestro representante legal.".
- **Por qué no `firma_tras_confirmar`.** Se descartó usar ese cierre, como proponía la revisión, porque diría "Con su confirmación…" sin haberle preguntado nada al cliente.
- **Lo que no cambia.** El correo sigue sin nombrar el campo bancario, así que se mantiene RN2. GC-1 se respeta: el cierre depende del estado, nunca dice "firmado" y siempre hay exactamente una bandera activa (la prueba ahora recorre 16 combinaciones). Con los fixtures actuales no hay campos bancarios por confirmar, así que ninguna salida aprobada en UAT cambia.

Se añadieron pruebas unitarias: el caso con solo `banco.numero_cuenta` por confirmar, construido con `construirChecklist`, y las casillas internas y de cliente del checklist.
**Estado:** fixed: requires human verification (frase nueva dirigida al cliente y nueva regla de banderas de firma).

### WR-02: El checklist pide confirmar con el cliente el emisor de un soporte vencido que el borrador no pregunta

**Archivos modificados:** `src/domain/builders/checklist.builder.ts`, `src/domain/builders/borrador.builder.ts`, `src/domain/types/checklist.type.ts`, `tests/golden/paquete.test.ts`, `tests/unit/borrador.builder.test.ts`, `tests/unit/checklist.builder.test.ts`, `tests/unit/paquete-vigente.policy.test.ts`
**Commit:** 6d5b765
**Corrección aplicada:** `construirChecklist` calcula una sola vez `avisos_emisor_al_cliente`, que reúne solo los soportes `PRESENTE` con aviso de emisor. `construirDatosChecklist` y `construirDatosBorrador` leen esa lista, y la función auxiliar deja de exportarse. En HN, `checklist.md` ya no tiene la casilla sobre la certificación de parafiscales vencida. La acción "Renovar el soporte …" se conserva, y la columna "Aviso de emisor" de la tabla no cambia. Hay pruebas nuevas en tres niveles: unitaria del checklist (un vencido con aviso no genera pregunta), unitaria del borrador (las dos salidas dan la misma lista) y golden de HN.
**Estado:** fixed

### WR-03: La prueba de cobertura de nombres falla con cualquier archivo suelto en `casos/` (hoy, `.DS_Store`)

**Archivos modificados:** `tests/golden/nombres-soporte.test.ts`
**Commit:** 36fc339
**Corrección aplicada:** `tiposDeFixtures` lee `casos/` con `withFileTypes` y solo recorre directorios. No se tocó `reto-01/`, y el `.DS_Store` sigue ahí. Se verificó en el checkout principal, donde ese archivo existe: 559 pruebas en verde.
**Estado:** fixed

### IN-02: El respaldo `sinVigencia` produce un texto que se contradice y está en un camino inalcanzable

**Archivos modificados:** `src/domain/types/soportes.type.ts`, `src/domain/policies/soportes.policy.ts`, `src/domain/builders/checklist.builder.ts`, `tests/unit/checklist.builder.test.ts`, `tests/unit/borrador.builder.test.ts`, `tests/unit/paquete-vigente.policy.test.ts`
**Commit:** 3232b21
**Corrección aplicada:** `SoporteEvaluado` es ahora una unión discriminada. Con estado `VENCIDO`, `vigencia_hasta` es siempre `string`. `evaluarSoporte` solo construye un vencido cuando hay fecha, como ya decidía `evaluarVigencia`, y conserva el orden de las claves del contrato. `motivoDe` usa la fecha directamente, sin el `??`. "no aplica" queda solo para la vigencia visible de un soporte sin vencimiento. Se reemplazó la prueba que fijaba "vencido: parafiscales (no aplica)" por otra que exige la fecha en el bloqueo y "no aplica" solo en la fila del soporte sin vencimiento. Los helpers de prueba se ajustaron al tipo nuevo.
**Estado:** fixed

### IN-03: `docs/plantillas.md` cita un archivo que no existe

**Archivos modificados:** `docs/plantillas.md`
**Commit:** dc33d1b
**Corrección aplicada:** la cita ahora dice `motor-plantillas.engine.ts`.
**Estado:** fixed

### IN-04: El fixture de la prueba unitaria de la política se contradice a sí mismo

**Archivos modificados:** `tests/unit/paquete-vigente.policy.test.ts`
**Commit:** 0913bed
**Corrección aplicada:** `CHECKLIST` y las variantes (renovado, sin RUT) se construyen ahora con `construirChecklist(soportes, [], HOY)`. Una prueba fija que el fixture trae `listo_para_firma: false` y los bloqueos del vencido y del ausente.
**Estado:** fixed

---

_Corregido: 2026-10-13T15:51:52Z_
_Corrector: Claude (gsd-code-fixer)_
_Iteración: 1_
