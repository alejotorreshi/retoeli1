---
phase: 01-n-cleo-determinista
fixed_at: 2026-10-13T05:12:04Z
review_path: .planning/phases/01-n-cleo-determinista/01-REVIEW.md
iteration: 1
findings_in_scope: 11
fixed: 10
skipped: 1
status: partial
---

# Fase 01: informe de corrección de la revisión de código

**Corregido:** 2026-10-13T05:12:04Z
**Revisión de origen:** .planning/phases/01-n-cleo-determinista/01-REVIEW.md (planes 01-12 a 01-15)
**Iteración:** 1

**Resumen:**
- Hallazgos en alcance: 11 (1 crítico, 4 advertencias, 6 informativos; alcance `all`)
- Corregidos: 10
- Omitidos: 1 (WR-03, queda para la decisión humana pendiente)

**Verificación:** se corrió `bun run check` (tsc, Biome y `bun audit`) y `bun test` después de cada commit en el worktree aislado `.claude/worktrees/rf-01-21141-1791867610`, que tenía su propio `bun install --frozen-lockfile`. Después del fast-forward de `main`, se repitieron en el checkout principal: 546 pruebas en verde en 39 archivos y `check` limpio. `bun run demo.ts` se corrió dos veces seguidas y dio salidas idénticas byte a byte. Su stdout no cambió frente a la corrida anterior, que fija `tests/e2e/demo.test.ts`. El contrato v1 de datos de herramienta no cambia: `data.bloqueos`, `resumen` y `log.jsonl` siguen con ids crudos, y `armar_paquete` devuelve el mismo `checklist`. La única adición al contrato es el código de error nuevo `PAQUETE_DESACTUALIZADO`.

## Hallazgos corregidos

### CR-01: El registro de envío omite en silencio los archivos que faltan en `paquete/` y declara "Sin bloqueos"

**Archivos modificados:** `src/domain/policies/paquete-vigente.policy.ts` (nuevo), `src/application/use-cases/simular-envio.use-case.ts`, `src/config/constants/errors.constants.ts`, `src/config/strings.ts`, `tests/contract/simular-envio.test.ts`, `tests/unit/borrador.builder.test.ts`, `tests/unit/paquete-vigente.policy.test.ts` (nuevo), `docs/estructura.md`
**Commits:** 6c5aa13, 99350f1
**Corrección aplicada:** se eligió rechazar el envío por paquete desactualizado. Es la opción que encaja con el patrón existente de `PAQUETE_NO_ARMADO`, y además evita que el `borrador-correo.md` viejo siga diciendo "Adjuntamos…". La política nueva `archivosFaltantesEnPaquete` calcula los archivos que `armar_paquete` habría puesto en `paquete/` (el formulario y cada soporte evaluado con archivo) y los cruza con el listado real. Si falta alguno, `simular_envio` devuelve `PAQUETE_DESACTUALIZADO`, con `parcial.archivos_faltantes` y un mensaje que pide volver a correr `proveedor_armar_paquete`, y no escribe `ENVIO-SIMULADO.md`. Así quedan cubiertos los tres caminos de la revisión: un soporte borrado a mano, un soporte renovado entre armar y enviar, y un soporte que aparece en el repositorio. También el formulario ausente, incluido el caso del portal. Se invirtió la prueba de contrato que fijaba "un soporte borrado de paquete/ no aparece como enviado": ahora exige el error. Se añadieron la variante del formulario borrado y la del soporte renovado, que también comprueba que al volver a armar el envío registra el archivo nuevo. La prueba unitaria de `construirDatosEnvio` (~230) no fijaba "Sin bloqueos", solo que el archivo ausente no se declara enviado, así que se conservó como defensa y se renombró.
**Estado:** fixed: requires human verification (cambia la respuesta de `simular_envio` cuando el paquete está desactualizado; conviene confirmar que el prompt del agente de la fase 2 trate `PAQUETE_DESACTUALIZADO` como "vuelve a armar").

### WR-01: El borrador mezcla datos faltantes del maestro con soportes pendientes, promete enviarlos y puede declararse "listo para la firma" a la vez

**Archivos modificados:** `src/domain/builders/borrador.builder.ts`, `src/domain/types/borrador.type.ts`, `src/knowledge/plantillas/borrador-correo.md`, `tests/unit/borrador.builder.test.ts`, `tests/golden/borrador-envio.test.ts`, `tests/contract/maestro-incompleto.test.ts`, `docs/plantillas.md`
**Commits:** 48b2a07, 0bb07e2
**Corrección aplicada:** el contexto del borrador separa `campos_sin_dato` (etiquetas que no existen en el maestro) de `soportes_pendientes` (ausentes y vencidos). Solo a los soportes se les promete "Los enviaremos por separado". Los campos sin dato se le preguntan al cliente: "quedan en blanco porque no contamos con el dato; les agradecemos indicarnos si aplican". `firma_lista` exige que no haya campos por confirmar ni campos sin dato. Si los hay, sale `firma_tras_confirmar`. `firma_bloqueada` ahora dice "faltan los soportes pendientes indicados". Se respeta GC-1: el cierre depende del estado y nunca dice "firmado". Las pruebas unitarias cubren las 8 combinaciones con faltantes.
**Estado:** fixed: requires human verification (redacción del correo al cliente y regla de las banderas de firma).

### WR-02: El correo al cliente copia literalmente las notas internas que son para la analista

**Archivos modificados:** `src/domain/builders/borrador.builder.ts`, `src/domain/builders/checklist.builder.ts`, `src/domain/types/borrador.type.ts`, `src/domain/types/checklist.type.ts`, `src/config/constants/maestro.constants.ts`, `src/knowledge/plantillas/borrador-correo.md`, `tests/golden/borrador-envio.test.ts`, `tests/unit/borrador.builder.test.ts`, `tests/unit/checklist.builder.test.ts`, `tests/unit/paquete-vigente.policy.test.ts`
**Commit:** 395eb57
**Corrección aplicada:** el borrador ya no usa `nota`. La pregunta para el cliente va en el encabezado de la plantilla ("necesitamos que nos confirmen qué dato de nuestra empresa esperan en estos campos:") y cada línea lleva solo la etiqueta. `Checklist` incorpora `confirmaciones_al_cliente`, que deja fuera los campos con ruta `banco.*` (`PREFIJO_RUTA_BANCARIA`), así que el correo nunca pide confirmar datos bancarios de Periferia (RN2). Las notas internas siguen en `checklist.md` y en el formulario. `resumenChecklist` no expone el campo nuevo, así que el contrato de `armar_paquete` no cambia.
**Estado:** fixed: requires human verification (redacción del correo al cliente).

### WR-04: El guardián de nombres no vigila `rut` ni `parafiscales`

**Archivos modificados:** `tests/golden/nombres-soporte.test.ts`
**Commit:** c65a3ca
**Corrección aplicada:** además de la búsqueda libre de ids snake_case, el guardián comprueba cada id de `NOMBRE_SOPORTE` en las formas donde se renderiza un nombre: `ausente: X`, `vencido: X (`, `| X |`, `- X\n`, `- X (` y `soporte X`. Una prueba nueva demuestra que el detector reacciona a `rut` y `parafiscales` y deja pasar nombres de archivo como `rut-2026.txt`. Se comprobó con una mutación local, ya revertida, que poner ids crudos en los adjuntos del borrador hace fallar el guardián.
**Estado:** fixed

### IN-01: `NOMBRE_SOPORTE` duplica y contradice la `descripcion` del índice de soportes

**Archivos modificados:** `docs/plantillas.md`
**Commit:** e1d3f3f
**Corrección aplicada:** `SOLUCION.md` todavía no existe, así que la decisión se documentó en `docs/plantillas.md`, sección "Nombres de soporte en las salidas". Manda `NOMBRE_SOPORTE`. La `descripcion` del índice describe una versión concreta del archivo, con vigencia o año. Un tipo desconocido cae al id crudo, y un tipo nuevo necesita su nombre en la tabla. Al redactar `SOLUCION.md`, conviene trasladar este texto.
**Estado:** fixed

### IN-02: Respaldo mágico `?? ""` en el bloqueo por vencimiento

**Archivos modificados:** `src/domain/builders/checklist.builder.ts`, `tests/unit/checklist.builder.test.ts`
**Commit:** 09aed87
**Corrección aplicada:** el respaldo usa `TEXTO_CHECKLIST.sinVigencia` ("vencido: X (no aplica)") en lugar de `""`. Una prueba fija que nunca sale un paréntesis vacío. IN-03 completa el cambio con la unión discriminada `MotivoBloqueo`, en la que `vencido` siempre lleva `vigencia: string`.
**Estado:** fixed

### IN-03: El registro de envío deriva los bloqueos por un camino paralelo al del checklist

**Archivos modificados:** `src/domain/builders/checklist.builder.ts`, `src/domain/builders/borrador.builder.ts`, `src/domain/types/checklist.type.ts`, `tests/unit/checklist.builder.test.ts`, `tests/unit/borrador.builder.test.ts`, `tests/unit/paquete-vigente.policy.test.ts`
**Commit:** 75383e2
**Corrección aplicada:** `Checklist` guarda `motivos_bloqueo` como unión discriminada (`ausente`, o `vencido` con su vigencia). `construirChecklist` arma desde ella los `bloqueos` con ids crudos del contrato y `listo_para_firma`. `motivosDeBloqueo(checklist)` renderiza los nombres para `checklist.md` y `ENVIO-SIMULADO.md` desde la misma lista, sin volver a recorrer los soportes.
**Estado:** fixed

### IN-04: El aviso de emisor distinto no genera ninguna acción ni ninguna pregunta al cliente

**Archivos modificados:** `src/domain/builders/checklist.builder.ts`, `src/domain/builders/borrador.builder.ts`, `src/domain/types/checklist.type.ts`, `src/domain/types/borrador.type.ts`, `src/knowledge/plantillas/checklist.md`, `src/knowledge/plantillas/borrador-correo.md`, `tests/golden/borrador-envio.test.ts`, `tests/golden/paquete.test.ts`, `tests/unit/borrador.builder.test.ts`, `tests/unit/checklist.builder.test.ts`
**Commit:** 0e189cb
**Corrección aplicada:** `con_aviso_emisor` se expone en `DatosChecklist` y en `DatosBorradorCorreo`. El checklist añade una casilla por soporte con aviso ("Confirmar con el cliente si acepta el soporte X, emitido en CO"). El borrador le pregunta al cliente si acepta los soportes adjuntos emitidos en otro país, con la línea "X (país emisor: CO)". Esa pregunta cuenta como respuesta pendiente, así que el correo no declara el formulario listo para firma mientras siga abierta. CO no cambia. EC, HN y PA ganan la pregunta.
**Estado:** fixed: requires human verification (texto nuevo dirigido al cliente).

### IN-05: El ancho del xlsx cuenta puntos de código y no tiene en cuenta saltos de línea ni glifos anchos

**Archivos modificados:** `src/infra/output/xlsx-writer.adapter.ts`, `src/config/constants/patterns.constants.ts`, `tests/unit/xlsx-writer.adapter.test.ts`
**Commit:** 28841fd
**Corrección aplicada:** el writer parte el valor con `PATRON_SALTO_DE_LINEA`, en `patterns.constants.ts`, y mide la línea más larga. También activa `wrapText` cuando hay un salto de línea. Los glifos anchos (emoji y CJK) se siguen midiendo como un punto de código: así lo fija la prueba existente "el largo se mide en puntos de código", y la corrección propuesta en la revisión cubre solo los saltos de línea.
**Estado:** fixed

### IN-06: Los goldens de anchos reimplementan la fórmula de producción y el tipo de prueba no se deriva de una constante

**Archivos modificados:** `tests/golden/formulario-xlsx.test.ts`, `tests/helpers/types/xlsx-leer.type.ts`, `tests/helpers/xlsx-leer.helper.ts`, `tests/helpers/tipo-celda.helper.ts` (nuevo)
**Commit:** 5442afa
**Corrección aplicada:** el golden fija los anchos literales de cada columna de los fixtures CO y HN, y se eliminó `anchoEsperado`. `TIPO_CELDA` es un objeto `as const` en su propio helper, para que no haya ciclo entre el helper y el archivo de tipos, y `TipoCelda` es `ValorDe<typeof TIPO_CELDA>`.
**Estado:** fixed

## Hallazgos omitidos

### WR-03: G-01-H4c no queda cerrado: la salida de `demo.ts` sigue mostrando ids crudos

**Archivo:** `src/config/strings.ts:72-79,186-191` (usado por `src/demo/runners/ejecutar-demo.runner.ts:99-109,142-149`), `tests/golden/nombres-soporte.test.ts:23`
**Motivo:** se omitió a propósito, por estar pendiente una decisión humana. La corrección técnica del stdout de la demo es posible sin tocar el contrato: el runner podría nombrar los soportes desde `data.checklist.soportes` con `TEXTO_SOPORTE`. Pero los planes 01-14 y 01-15 fijaron como must-have que "el stdout de la demo y el `resumen` conservan los ids crudos, byte a byte (contrato v1, D-21)". Además, `01-UAT.md` (prueba 4) deja abierta para la persona la elección entre documentar la excepción o pedir un plan que muestre nombres en la demo. Cambiarlo aquí sería tomar esa decisión por ella. El `resumen` de herramienta no puede cambiar sin romper el contrato v1. `docs/plantillas.md` (IN-01) ya deja escrito el comportamiento actual.
**Problema original:** la salida estándar de `demo.ts` arma "Soportes ausentes" y "Estado: BLOQUEADO (…)" con los ids crudos de `data.bloqueos`, y el `resumen` de herramienta también los lleva, así que el cierre de G-01-H4c no alcanza la salida de la demo.

---

_Corregido: 2026-10-13T05:12:04Z_
_Corrector: Claude (gsd-code-fixer)_
_Iteración: 1_
