---
phase: 01-n-cleo-determinista
verified: 2026-10-13T04:40:00Z
status: human_needed
score: 111/111 must-haves verified
covered_files: [".bun-version",".dockerignore",".gitignore",".planning/phases/01-n-cleo-determinista/01-01-PLAN.md",".planning/phases/01-n-cleo-determinista/01-01-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-02-PLAN.md",".planning/phases/01-n-cleo-determinista/01-02-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-03-PLAN.md",".planning/phases/01-n-cleo-determinista/01-03-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-04-PLAN.md",".planning/phases/01-n-cleo-determinista/01-04-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-05-PLAN.md",".planning/phases/01-n-cleo-determinista/01-05-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-06-PLAN.md",".planning/phases/01-n-cleo-determinista/01-06-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-07-PLAN.md",".planning/phases/01-n-cleo-determinista/01-07-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-08-PLAN.md",".planning/phases/01-n-cleo-determinista/01-08-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-09-PLAN.md",".planning/phases/01-n-cleo-determinista/01-09-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-10-PLAN.md",".planning/phases/01-n-cleo-determinista/01-10-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-11-PLAN.md",".planning/phases/01-n-cleo-determinista/01-11-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-12-PLAN.md",".planning/phases/01-n-cleo-determinista/01-12-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-13-PLAN.md",".planning/phases/01-n-cleo-determinista/01-13-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-14-PLAN.md",".planning/phases/01-n-cleo-determinista/01-14-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-15-PLAN.md",".planning/phases/01-n-cleo-determinista/01-15-SUMMARY.md","biome.json","bun.lock","demo.ts","package.json","src/application/services/contexto-caso.service.ts","src/application/services/estado-paquete.service.ts","src/application/services/mapeo-canonico.service.ts","src/application/types/armar-paquete.type.ts","src/application/types/contexto-caso.type.ts","src/application/types/generar-formulario.type.ts","src/application/types/leer-solicitud.type.ts","src/application/types/mapear-campos.type.ts","src/application/types/mapeo-canonico.type.ts","src/application/types/puertos.type.ts","src/application/types/simular-envio.type.ts","src/application/use-cases/armar-paquete.use-case.ts","src/application/use-cases/generar-formulario.use-case.ts","src/application/use-cases/leer-solicitud.use-case.ts","src/application/use-cases/mapear-campos.use-case.ts","src/application/use-cases/simular-envio.use-case.ts","src/config/constants/demo.constants.ts","src/config/constants/errors.constants.ts","src/config/constants/files.constants.ts","src/config/constants/forms.constants.ts","src/config/constants/io.constants.ts","src/config/constants/knowledge.constants.ts","src/config/constants/limits.constants.ts","src/config/constants/maestro.constants.ts","src/config/constants/mapping.constants.ts","src/config/constants/patterns.constants.ts","src/config/constants/pdf.constants.ts","src/config/constants/pii.constants.ts","src/config/constants/runtime.constants.ts","src/config/constants/supports.constants.ts","src/config/constants/tools.constants.ts","src/config/constants/xlsx.constants.ts","src/config/env.ts","src/config/strings.ts","src/config/types/valor-de.type.ts","src/demo/runners/ejecutar-demo.runner.ts","src/demo/types/demo.type.ts","src/domain/builders/borrador.builder.ts","src/domain/builders/campo-presentado.builder.ts","src/domain/builders/checklist.builder.ts","src/domain/builders/formulario.builder.ts","src/domain/builders/glosario.builder.ts","src/domain/builders/portal.builder.ts","src/domain/engines/mapeo.engine.ts","src/domain/engines/motor-plantillas.engine.ts","src/domain/policies/comparar-mapeo.policy.ts","src/domain/policies/identificador-tributario.policy.ts","src/domain/policies/pii.policy.ts","src/domain/policies/plantilla-caso.policy.ts","src/domain/policies/soportes.policy.ts","src/domain/policies/validar-reglas.policy.ts","src/domain/policies/vigencias.policy.ts","src/domain/selectors/maestro.selector.ts","src/domain/selectors/solicitud.selector.ts","src/domain/types/borrador.type.ts","src/domain/types/checklist.type.ts","src/domain/types/comparar-mapeo.type.ts","src/domain/types/errores.type.ts","src/domain/types/fecha.type.ts","src/domain/types/formulario.type.ts","src/domain/types/glosario.type.ts","src/domain/types/maestro.type.ts","src/domain/types/mapeo.type.ts","src/domain/types/motor-plantillas.type.ts","src/domain/types/pii.type.ts","src/domain/types/plantilla-caso.type.ts","src/domain/types/portal.type.ts","src/domain/types/reglas.type.ts","src/domain/types/resultado.type.ts","src/domain/types/solicitud.type.ts","src/domain/types/soportes.type.ts","src/domain/types/validacion.type.ts","src/domain/types/vigencias.type.ts","src/domain/utils/fecha.util.ts","src/domain/utils/formatear-issues.util.ts","src/domain/utils/nombre-error.util.ts","src/domain/utils/normalizar.util.ts","src/domain/utils/resultado.util.ts","src/infra/clock/clock.adapter.ts","src/infra/fixtures/case-resolver.adapter.ts","src/infra/fixtures/fixtures-reader.adapter.ts","src/infra/fixtures/schemas/fixtures.schema.ts","src/infra/fs/fs.util.ts","src/infra/fs/safe-paths.util.ts","src/infra/knowledge/rules-loader.adapter.ts","src/infra/knowledge/schemas/rules.schema.ts","src/infra/knowledge/template-loader.adapter.ts","src/infra/logging/audit-log.adapter.ts","src/infra/output/case-lock.adapter.ts","src/infra/output/output-files.adapter.ts","src/infra/output/package-copy.adapter.ts","src/infra/output/pdf/pdf-layout.util.ts","src/infra/output/pdf/pdf-renderer.adapter.ts","src/infra/output/xlsx-writer.adapter.ts","src/infra/types/fs.type.ts","src/infra/types/pdf-layout.type.ts","src/knowledge/plantillas/borrador-correo.md","src/knowledge/plantillas/checklist.md","src/knowledge/plantillas/envio-simulado.md","src/knowledge/plantillas/valores-portal.md","src/knowledge/reglas.json","src/tools/factories/definir-herramienta.factory.ts","src/tools/factories/herramientas.factory.ts","src/tools/proveedor.ts","src/tools/schemas/argumentos.schema.ts","src/tools/types/entorno.type.ts","src/tools/types/herramienta.type.ts","src/tools/wiring/entorno.wiring.ts","tests/architecture.test.ts","tests/contract/generar-formulario.test.ts","tests/contract/maestro-incompleto.test.ts","tests/contract/reglas.test.ts","tests/contract/simular-envio.test.ts","tests/contract/sinteticos.test.ts","tests/e2e/demo.test.ts","tests/e2e/determinismo.test.ts","tests/e2e/pii.test.ts","tests/e2e/trazador.test.ts","tests/fixtures/casos/zz-generica-co/plantilla-campos.json","tests/fixtures/casos/zz-generica-co/solicitud.json","tests/fixtures/casos/zz-generica-co/soportes-exigidos.json","tests/fixtures/casos/zz-generica-ec/plantilla-campos.json","tests/fixtures/casos/zz-generica-ec/solicitud.json","tests/fixtures/casos/zz-generica-ec/soportes-exigidos.json","tests/fixtures/casos/zz-plantilla-corrupta/plantilla-celdas.json","tests/fixtures/casos/zz-plantilla-corrupta/solicitud.json","tests/fixtures/casos/zz-plantilla-corrupta/soportes-exigidos.json","tests/golden/borrador-envio.test.ts","tests/golden/formulario-pdf.test.ts","tests/golden/formulario-portal.test.ts","tests/golden/formulario-xlsx.test.ts","tests/golden/mapear-campos.test.ts","tests/golden/nombres-soporte.test.ts","tests/golden/paquete.test.ts","tests/helpers/correr-demo.helper.ts","tests/helpers/flujo.helper.ts","tests/helpers/instantanea.helper.ts","tests/helpers/pdf-texto.helper.ts","tests/helpers/proyecto-temporal.helper.ts","tests/helpers/types/correr-demo.type.ts","tests/helpers/types/flujo.type.ts","tests/helpers/types/instantanea.type.ts","tests/helpers/types/pdf-texto.type.ts","tests/helpers/types/proyecto-temporal.type.ts","tests/helpers/types/xlsx-leer.type.ts","tests/helpers/xlsx-leer.helper.ts","tests/sin-comentarios.test.ts","tests/unit/borrador.builder.test.ts","tests/unit/checklist.builder.test.ts","tests/unit/clock.adapter.test.ts","tests/unit/comparar-mapeo.policy.test.ts","tests/unit/fixtures-reader.adapter.test.ts","tests/unit/fixtures.schema.test.ts","tests/unit/identificador-tributario.policy.test.ts","tests/unit/mapeo.engine.test.ts","tests/unit/motor-plantillas.engine.test.ts","tests/unit/normalizar.util.test.ts","tests/unit/output-files.adapter.test.ts","tests/unit/package-copy.adapter.test.ts","tests/unit/pdf-layout.util.test.ts","tests/unit/pii.policy.test.ts","tests/unit/plantilla-caso.policy.test.ts","tests/unit/solicitud.selector.test.ts","tests/unit/soportes.policy.test.ts","tests/unit/validar-reglas.policy.test.ts","tests/unit/vigencias.policy.test.ts","tests/unit/xlsx-writer.adapter.test.ts","tsconfig.json"]
covered_digest: "v3:sha256:a6101c5f578c83788629393193cf92a51becdd13f18bdd69f0e92878ff910742"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 90/91
  gaps_closed:
    - "Un campo cuyo dato no existe en el maestro termina como `faltante` y aparece en el reporte de faltantes del checklist (valor en blanco o solo espacios en el maestro)"
    - "G-01-H1: las columnas del xlsx tienen ancho suficiente para leer cada etiqueta y valor"
    - "G-01-H4a: ENVIO-SIMULADO lista solo los archivos que van al cliente"
    - "G-01-H4b: el borrador nunca afirma que el formulario está firmado"
    - "G-01-H4c: el borrador (y el checklist y los bloqueos de ENVIO-SIMULADO) muestran nombres legibles de soporte"
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "SEG-02: una única función `redactar()`, basada en una política de rutas sensibles, se aplica a los logs, la API, el SSE y los resúmenes de tool calls"
    addressed_in: "Phase 2 / Phase 3"
    evidence: "Fase 2 SC5: 'Los logs JSON llevan IDs de sesión, turno y tool call, sin clave ni PII'. Fase 3 SC2: 'cada tool call como tarjeta colapsable (nombre, args redactados…)'. Fase 3 SC3: 'el historial vuelve desde GET /api/sessions/:id con la PII redactada'. En la Fase 1 existen la política por rutas (POLITICA_PII y enmascarar en src/domain/policies/pii.policy.ts) y el grep de PII amplio con control positivo (tests/e2e/pii.test.ts). No existe ninguna función `redactar()` en src/; la API y el SSE todavía no existen."
human_verification:
  - test: "Abrir out/co-industrias-delta/formulario.xlsx (hojas Datos Proveedor y Datos Bancarios) y out/hn-agroexport-sula/formulario.xlsx en Excel o LibreOffice después de `bun run demo.ts` (repetición de la prueba 17 de la UAT)"
    expected: "Cada etiqueta y valor se lee completo, sin columnas recortadas. El valor largo de 'Actividad económica' (Datos Proveedor!C13) se ajusta en varias líneas dentro de una columna de ancho 60. Se mantienen las etiquetas en negrita y los rellenos y notas de faltante y por confirmar."
    why_human: "Los anchos se verificaron por lectura (co B=32, C=60 con wrap en C13; Datos Bancarios B=22, C=27; hn A=25, B=32), pero el recorte visual depende del visor y fue la persona quien reportó G-01-H1."
  - test: "Leer out/<caso>/paquete/borrador-correo.md de los 4 casos y un ENVIO-SIMULADO.md confirmado (repetición de la prueba 20 de la UAT), con atención a los hallazgos WR-01 y WR-02 de la revisión"
    expected: "El tono es profesional para el cliente. Además hay que decidir explícitamente: (a) WR-01, en ec el correo dice 'Quedan pendientes: - Número de contribuyente especial … Los enviaremos por separado.', lo que promete al cliente un dato que no existe en el maestro; (b) WR-02, el correo copia la nota interna 'RUC: Identificador extranjero: confirmar si el cliente acepta el NIT colombiano', que se dirige al cliente en tercera persona. Ambos textos siguen la decisión vinculante GC-1 del plan 01-13, pero la persona debe confirmar si la redacción resultante es aceptable."
    why_human: "Es una cuestión de redacción y producto. El código hace lo que especificaron los planes 01-10 y 01-13, y la persona fue quien reportó H4."
  - test: "Decidir el hallazgo crítico CR-01 de la revisión: un registro de envío que dice 'Sin bloqueos' cuando un soporte exigido no está en paquete/"
    expected: "Hay que elegir entre corregirlo (convertir un archivo para el cliente que falta en paquete/ en un bloqueo, o devolver un error del tipo PAQUETE_DESACTUALIZADO que pida volver a armar el paquete) y aceptarlo con un override documentado. El verificador lo reprodujo así: (A) en co, después de borrar paquete/rut-2026.txt, simular_envio confirmado devuelve bloqueos [] y escribe 'Sin bloqueos.' sin el RUT; (B) en hn, al renovar parafiscales en el repositorio entre armar_paquete y simular_envio, el registro dice 'Sin bloqueos.', no envía parafiscales y deja sin mencionar parafiscales-2026-07.txt, que sigue en paquete/."
    why_human: "El comportamiento es intencional según el plan 01-13 ('only when they exist in paquete/'), y las pruebas tests/contract/simular-envio.test.ts:219 y tests/unit/borrador.builder.test.ts:230 lo fijan. ENV-01 se cumple literalmente, porque los bloqueos que define PAQ-03 sí quedan registrados. Aun así, el artefacto de auditoría de una acción confirmada puede quedar incompleto en un flujo realista de la Fase 2: la analista renueva un soporte durante el turno de confirmación. Es una decisión de producto que no se puede resolver con grep."
  - test: "Decidir el hallazgo WR-03 de la revisión: la salida estándar de `bun run demo.ts` imprime ids crudos de soporte ('Soportes ausentes: certificado_cumplimiento_tributario', 'Estado: BLOQUEADO (ausente: certificado_cumplimiento_tributario)', 'Vencidos: parafiscales')"
    expected: "La persona confirma que la salida de la demo y el `resumen` de herramienta conservan los ids crudos por el contrato v1, y que esto se documenta en SOLUCION.md, o pide un plan que use nombres en la demo."
    why_human: "Los planes 01-14 y 01-15 exigen explícitamente que el stdout de la demo quede byte a byte igual, con ids crudos (contrato v1, D-21). La brecha G-01-H4c, tal como se registró, solo hablaba del borrador, así que está cerrada. Lo que queda abierto es si el stdout de la demo cuenta como salida 'para personas'."
---

# Fase 1: Núcleo determinista. Informe de verificación

**Objetivo de la fase:** Cualquiera puede correr `bun run demo.ts` sin clave LLM y obtener, para los 4 casos, formularios, paquetes para firma y logs correctos y reproducibles. Cada valor sale de una herramienta tipada que lo lee del maestro, y ninguna inventa un dato.
**Verificado:** 2026-10-13T04:40:00Z
**Estado:** human_needed
**Re-verificación:** Sí. Viene después de cerrar la brecha CR-01 (valor en blanco) y de los planes de cierre de la UAT 01-12 a 01-15.

## Logro del objetivo

El verificador ejecutó en su propio proceso todo lo que sigue. Los SUMMARY solo sirvieron para ubicar el código.

- `bun run check` terminó con código 0: tsc estricto, Biome sobre 167 archivos y `bun audit` sin vulnerabilidades en 207 paquetes.
- `bun test` pasó una sola vez completo: 519 pruebas, 0 fallos, 38 archivos, 2875 aserciones. No hay `.skip`, `.todo` ni `.only` en tests/.
- `bun run demo.ts` se ejecutó dos veces sin `DEEPSEEK_API_KEY` ni `FECHA_EJECUCION`. Las dos salieron con código 0 y un stdout idéntico byte a byte. Los 43 archivos de `out/` coinciden en nombre. Todos son idénticos byte a byte (incluidos los xlsx y el pdf), salvo los 5 `log.jsonl`, que solo difieren en `ts`.
- Una sonda independiente (scratchpad/probe.ts) recorrió el flujo completo de los 4 casos, con `simular_envio` confirmado en un proyecto temporal, reprodujo los dos escenarios de CR-01 y volvió a probar la brecha anterior del valor en blanco.
- Una sonda del contrato (scratchpad/sc4.ts) cubrió args inválidos, una llave extra, path traversal, un caso inexistente, una plantilla corrupta, un mapeo con `valor`, envíos sin confirmar o con `"true"` y un ctx nulo.

El objetivo de la fase se cumple. La brecha que quedaba de la verificación anterior está cerrada, y las 4 brechas de la UAT están cerradas en el código y en la salida real. Quedan decisiones humanas: repetir dos pruebas visuales y de tono de la UAT, y resolver los hallazgos abiertos CR-01 y WR-03 de la revisión. Ninguno de ellos rompe un must-have tal como está escrito.

### Verdades observables

**Criterios de éxito del roadmap y verdades del objetivo y del Core Value**

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | SC1: la demo sin clave LLM limpia `out/`, imprime 2026-09-03 y la tabla de verdad, con el mismo resultado en dos ejecuciones salvo timestamps | ✓ VERIFIED | Salida observada: co xlsx 17/0/0 LISTO, ec pdf 13/1/1 BLOQUEADO (ausente), hn xlsx 9/1/1 BLOQUEADO (vencido: parafiscales 2026-08-31), pa portal 8/0/1 LISTO "formato no soportado". El stdout es idéntico. Los archivos son idénticos salvo `ts` en los logs |
| 2 | SC2: el xlsx de co tiene etiquetas y valores en las celdas de la plantilla (ambas hojas, con ceros a la izquierda), el PDF de ec sigue el orden de la plantilla con marcas, y pa tiene `valores-portal.md` con el aviso | ✓ VERIFIED | Lectura con exceljs: hojas Datos Proveedor y Datos Bancarios, valores con numFmt `@` y etiquetas en negrita. Los goldens de formulario-xlsx, formulario-pdf y formulario-portal pasan en la suite. `out/pa-logistica-istmo/valores-portal.md` existe y la tool respondió `aviso: "formato no soportado"` |
| 3 | SC3: el paquete tiene formulario, copias, checklist y borrador (a `solicitud.de`, "RE: <asunto>", sin datos bancarios), `mapeo.json` traza ruta, regla y confianza, y el grep de PII da 0 | ✓ VERIFIED | Los 4 `paquete/` se inspeccionaron. Los borradores van a `solicitud.de` con "RE: …". `71555123\|03100012345\|COLOCOBM` dio 0 coincidencias en respuestas, logs, mapeo, checklist, borrador y ENVIO. Un escaneo amplio de todas las hojas del maestro de 5 o más caracteres solo encontró campos públicos D-05 (razón social, ciudad, sitio web, actividad, régimen) en `mapeo.json` y la firma aceptada en la UAT T15 |
| 4 | SC4: las 5 tools se importan sin servidor y nunca lanzan, los errores son estables y en español, el envío sin confirmación da "requiere confirmación explícita" y todo queda registrado | ✓ VERIFIED | Sonda sc4: ARGS_INVALIDOS (tipo, llave extra, `valor`, `"true"`), CASO_INVALIDO, CASO_NO_ENCONTRADO, PLANTILLA_INVALIDA, CONFIRMACION_REQUERIDA con el texto exacto y CONFIGURACION_INVALIDA. Ninguna lanzó. Hubo 8 líneas de log para 8 llamadas con directorio |
| 5 | SC5: check y test pasan con goldens, sintéticos y arquitectura, sin comentarios y con la config centralizada | ✓ VERIFIED | Check con código 0. 519/0. `architecture.test.ts` y `sin-comentarios.test.ts` están en verde. No hay marcadores de deuda ni comentarios en los 21 archivos que tocaron los planes 12 a 15 |
| 6 | Objetivo: cada valor del formulario sale de una herramienta tipada que lo lee del maestro | ✓ VERIFIED | `generar-formulario.use-case.ts` recalcula `mapeoCanonico` y llama a `compararMapeo` antes de escribir. Un mapeo con `valor` se rechaza |
| 7 | Objetivo: ninguna herramienta inventa un dato | ✓ VERIFIED | Los faltantes de ec y hn quedan vacíos y marcados. No se escribe ningún valor de relleno |
| 8 | Core Value / MAP-01: un dato inexistente o en blanco termina `faltante` y aparece en el checklist (brecha anterior) | ✓ VERIFIED (cerrada) | Sonda con `maestro.ciudad = "   "` y `ciiu_principal = ""`: co da 15/2/0, Ciudad y Código CIIU quedan `faltante` con `valor_enmascarado: null` y se listan en "Campos faltantes". `tests/contract/maestro-incompleto.test.ts` la cubre |
| 9 | Core Value: ninguna acción externa ocurre sin confirmación explícita (a nivel de herramienta) | ✓ VERIFIED | `confirmado` ausente o false da CONFIRMACION_REQUERIDA. La demo no escribe ENVIO-SIMULADO |

**Must-haves de los planes de cierre (01-12 a 01-15)**

| Plan | Verdades | Estado | Evidencia clave |
|------|----------|--------|-----------------|
| 01-12 (G-01-H1) | 5/5 | ✓ VERIFIED | `aplicarAnchos` deriva los anchos de las celdas que se escriben de verdad (`celda.fullAddress.col`), sin letras fijas. Se aplica la fórmula clamp(largo+2, 10, 60) y wrap cuando largo+2 > 60. Salida real: co B=32, C=60 (C13 de 82 caracteres con wrap), Bancarios B=22, C=27; hn A=25, B=32. Las columnas no usadas no tienen ancho. El contenido, los rellenos y las notas no cambiaron (goldens). Las corridas dan xlsx idénticos byte a byte |
| 01-13 (G-01-H4a/H4b) | 6/6 | ✓ VERIFIED | ENVIO confirmado en los 4 casos: "Archivos que se envían" solo lista el formulario y los soportes presentes, nunca `checklist.md` ni `borrador-correo.md`. hn deja `parafiscales-2026-07.txt` en "Soportes vencidos que no se envían". pa explica que `valores-portal.md` es la guía de la analista y no lo lista. Borradores: co dice "listo para la firma", pa "Con su confirmación pasaremos…", ec y hn "todavía no está listo". Ninguno contiene "firmad". Las preguntas por confirmar salen como `- <etiqueta>: <nota>`. Los datos de la herramienta no cambiaron (`s.bloqueos` crudos). La prohibición de nivel test está cableada: `borrador.builder.test.ts:156` ("el contexto tiene exactamente las claves permitidas y ningún dato bancario") |
| 01-14 (G-01-H4c, borrador y checklist) | 4/4 | ✓ VERIFIED | El borrador y el checklist de los 4 casos usan los nombres de `NOMBRE_SOPORTE`. La sonda no encontró ids snake_case ni las formas `ausente: rut`, `\| rut \|` o `vencido: parafiscales`. `nombreDeSoporte` usa `Object.hasOwn`, así que un id desconocido o de prototipo queda crudo (pruebas unitarias). `motivosDeBloqueo` está exportado. Los datos de herramienta, los logs y el stdout de la demo conservan los ids crudos |
| 01-15 (G-01-H4c, ENVIO y guardián) | 5/5 | ✓ VERIFIED | Los bloqueos de ENVIO están nombrados: "ausente: Certificado de cumplimiento tributario" y "vencido: Certificación de aportes parafiscales (2026-08-31)". `simular_envio.data.bloqueos` queda crudo. El guardián `nombres-soporte.test.ts` está en verde y cubre los tipos de los fixtures. Ver WR-04: el guardián no vigila `rut` ni `parafiscales`, pero la verdad dice "snake_case id" y esos dos no lo son |

**Must-haves de los planes 01-01 a 01-11 (82 verdades, comprobación de regresión)**

| Plan | Verdades | Estado | Nota |
|------|----------|--------|------|
| 01-01 a 01-11 | 82/82 | ✓ VERIFIED (regresión) | Se verificaron completas en la ronda anterior. Ahora vuelven a quedar cubiertas por la suite en verde, la demo determinista y las sondas. `verify.artifacts` reporta archivos "no encontrados" en 01-02 a 01-11 porque el refactor de carpetas por rol (WR-12 y WR-21, registrado como corregido en 01-REVIEW-FIX.md) los renombró. El verificador comprobó a mano que existen los 33 sucesores, que son sustantivos y que están cableados: por ejemplo `domain/mapeo.ts` pasó a `domain/engines/mapeo.engine.ts`, `infra/salida/xlsx.ts` a `infra/output/xlsx-writer.adapter.ts` y `tools/wiring.ts` a `tools/wiring/entorno.wiring.ts`. El enlace "observar" de 01-11 existe en `demo.type.ts`, `ejecutar-demo.runner.ts:211` y `correr-demo.helper.ts:12` |

**Puntuación:** 111/111 verdades verificadas (0 presentes con comportamiento sin verificar).

### Elementos diferidos

| # | Elemento | Se atiende en | Evidencia |
|---|----------|---------------|-----------|
| 1 | SEG-02: una función única `redactar()` aplicada a logs, API, SSE y resúmenes de tool calls | Fase 2 (SC5) y Fase 3 (SC2, SC3) | En `src/` no existe `redactar`. La parte de la Fase 1 sí está: la política por rutas `POLITICA_PII` y `enmascarar` sobre las respuestas, logs y resúmenes construidos sin valores, y el grep amplio con control positivo en `tests/e2e/pii.test.ts`. **Nota sobre el plan 01-13:** marcó SEG-02 como completo, pero solo añadió pruebas de que el borrador no lleva datos bancarios. Eso es RN2/PAQ-04, no SEG-02. REQUIREMENTS.md debería mostrar SEG-02 como parcial (Fase 1) en lugar de `[x] Complete` |

### Artefactos requeridos

`verify.artifacts` da 4/4, 4/4, 3/3 y 2/2 para los planes 01-12 a 01-15, y 4/4 para 01-01. Para 01-02 a 01-11 hay deriva de rutas por el refactor, y los sucesores se verificaron a mano (tabla de arriba). Todos los artefactos son sustantivos (por ejemplo `xlsx-writer.adapter.ts` tiene 86 líneas, `borrador.builder.ts` 110 y `checklist.builder.ts` 92) y la demo y las sondas los ejecutan.

### Verificación de enlaces clave

`verify.key-links` da 2/2 en cada plan de 01-12 a 01-15: `ANCHO_COLUMNA_XLSX`, `getColumn(`, `construirDatosEnvio(`, `requiere_confirmacion`, `TEXTO_SOPORTE.nombre` (×2), `motivosDeBloqueo(` y `NOMBRE_SOPORTE`. Los enlaces de los planes anteriores apuntan a rutas renombradas. Su cableado real está en `entorno.wiring.ts` (líneas 13 a 47) y en `generar-formulario.use-case.ts` (`mapeoCanonico`, `compararMapeo`, `construirDatosPortal`).

### Traza del flujo de datos (nivel 4)

| Artefacto | Dato | Fuente | Datos reales | Estado |
|-----------|------|--------|--------------|--------|
| `formulario.xlsx` (anchos) | ancho por columna | largo del texto escrito en cada celda de la plantilla | Sí: co B=32 corresponde a la etiqueta más larga | ✓ FLOWING |
| `borrador-correo.md` | nombres, banderas de firma, preguntas | `Checklist` (soportes evaluados, `listo_para_firma`, `requiere_confirmacion`) más `NOMBRE_SOPORTE` | Sí: varía según el caso | ✓ FLOWING |
| `ENVIO-SIMULADO.md` | enviados, retenidos y bloqueos | reevaluación de soportes más listado de `paquete/` | Sí, con la salvedad de CR-01 cuando el paquete está desactualizado | ✓ FLOWING |
| stdout de la demo | conteos y estados | respuestas de las herramientas | Sí | ✓ FLOWING |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Tipos, lint y auditoría | `bun run check` | código 0; 0 vulnerabilidades | ✓ PASS |
| Suite completa (una sola vez) | `bun test` | 519 pasan, 0 fallan | ✓ PASS |
| Demo sin clave y determinista | `bun run demo.ts` ×2 | stdout idéntico; archivos idénticos salvo `ts` | ✓ PASS |
| Envío confirmado en los 4 casos | sonda probe.ts | sin archivos internos entre los enviados; bloqueos nombrados; sin "firmad" en los borradores | ✓ PASS |
| Valor en blanco en el maestro | sonda probe.ts | 15/2/0 y ambos listados como faltantes | ✓ PASS |
| Anchos y wrap del xlsx | sonda anchos.ts | co C13 con wrap a 60; columnas sin usar sin ancho | ✓ PASS |
| Contrato de errores | sonda sc4.ts | 9/9 códigos esperados, 0 excepciones | ✓ PASS |
| CR-01 escenario A y B | sonda probe.ts | "Sin bloqueos." con un soporte exigido ausente del envío | ⚠️ reproducido (decisión humana) |

### Ejecución de sondas

La fase no declara sondas `scripts/*/tests/probe-*.sh`. Paso 7c: no aplica.

### Cobertura de requisitos

| Requisito | Plan fuente | Estado | Evidencia |
|-----------|-------------|--------|-----------|
| HERR-01..05 | 01-02/03/05/10 | ✓ SATISFIED | 5 exports con una frase de descripción, zod con `.describe()`, nunca lanzan, CASO_INVALIDO, se importan sin entorno, `sessionID` aceptado |
| SOLI-01, SOLI-02 | 01-02/06 | ✓ SATISFIED | Suite (sinteticos, plantilla-caso) |
| MAP-01..07 | 01-04/05/06 | ✓ SATISFIED | MAP-01 se reabrió en la ronda anterior por el valor en blanco y queda cerrado (verdad 8) |
| FORM-01 | 01-07/12 | ✓ SATISFIED | Celdas exactas y además anchos legibles (G-01-H1) |
| FORM-02..04 | 01-07/08 | ✓ SATISFIED | Goldens de PDF y portal; rechazo del mapeo con `valor` |
| PAQ-01, PAQ-03, PAQ-05 | 01-09 | ✓ SATISFIED | Tabla de verdad de los bloqueos; reloj inyectable |
| PAQ-02 | 01-09/14 | ✓ SATISFIED | El checklist muestra fecha, estado, tabla con nombres, "vence en 27 días", faltantes y por confirmar |
| PAQ-04 | 01-10/13/14 | ✓ SATISFIED | Va a `solicitud.de`, "RE: …", sin datos bancarios, con lista blanca. **Nota:** el texto del requisito ("lista el formulario firmado") queda reemplazado por la decisión GC-1 (el borrador nunca afirma una firma). Conviene actualizar la redacción en REQUIREMENTS.md |
| ENV-01 | 01-10/13/15 | ✓ SATISFIED | Sin confirmación responde "requiere confirmación explícita". Con confirmación escribe solo ENVIO-SIMULADO.md con los bloqueos vigentes (definición de PAQ-03) y no exige `listo_para_firma`. Ver CR-01 (decisión humana) |
| SEG-02 | 01-11/13 | ◐ PARCIAL, resto diferido | Ver "Elementos diferidos". La parte de la Fase 1 está satisfecha; la función única `redactar()` para API y SSE no existe |
| SEG-04 | 01-03 | ✓ SATISFIED | Una línea por llamada en ambos logs, `{ts, herramienta, ok, resumen}`, sin PII |
| DEMO-01, DEMO-02 | 01-03/11 | ✓ SATISFIED | Demo determinista y goldens |
| DEMO-04 | 01-06 | ✓ SATISFIED | `zz-generica-co`, `zz-generica-ec`, `zz-plantilla-corrupta` y CASO_NO_ENCONTRADO |
| CAL-01, CAL-02, CAL-04 | 01-01/11 | ✓ SATISFIED | Check en verde; guardianes de arquitectura y de ausencia de comentarios |
| CAL-03 | 01-02..06/12/14/15 | ✓ SATISFIED | `ANCHO_COLUMNA_XLSX` en `xlsx.constants.ts`; `NOMBRE_SOPORTE` en `strings.ts` |

Los 33 IDs de la fase están reclamados por algún plan, así que no hay requisitos huérfanos. La tabla de trazabilidad de REQUIREMENTS.md todavía muestra "Gaps Found" en muchos IDs, y conviene actualizarla tras esta verificación (SEG-02 como parcial).

### Hallazgos de la revisión (01-REVIEW.md), ponderados contra los must-haves

| Hallazgo | Severidad en la revisión | Severidad para la verificación | Motivo |
|----------|--------------------------|--------------------------------|--------|
| CR-01: "Sin bloqueos" con un soporte exigido fuera de `paquete/` | critical | ⚠️ WARNING, decisión humana | Reproducido en los dos escenarios. No rompe ningún must-have tal como está escrito: el plan 01-13 especifica "only when they exist in paquete/", dos pruebas fijan el comportamiento, y ENV-01 registra los bloqueos de PAQ-03. Solo se llega a este estado si `paquete/` o el repositorio cambian entre dos llamadas, y no afecta a la demo ni a los 4 casos. Aun así, deja incompleto el registro de auditoría de una acción confirmada, en un flujo plausible de la Fase 2. **Recomendación:** corregirlo antes de planear la compuerta de confirmación de la Fase 2 |
| WR-01: el borrador promete enviar "por separado" datos que no existen en el maestro | warning | ⚠️ WARNING, va a la repetición de UAT 20 | No inventa ningún valor (el formulario queda vacío y marcado). El plan 01-10 especificó que los faltantes van en los pendientes. Es una afirmación dudosa ante el cliente y merece una decisión de redacción |
| WR-02: el correo copia la nota interna para la analista | warning | ⚠️ WARNING, va a la repetición de UAT 20 | Lo exige la decisión vinculante GC-1 ("each as '- <etiqueta>: <nota>'"). Las notas vienen de reglas.json, sin PII ni datos bancarios |
| WR-03: el stdout de la demo imprime ids crudos | warning | ℹ️ INFO, decisión humana | Los planes 01-14 y 01-15 exigen que el stdout de la demo quede byte a byte igual. La brecha G-01-H4c, tal como se registró ("The borrador shows human-readable support names"), está cerrada |
| WR-04: el guardián no vigila `rut` ni `parafiscales` | warning | ⚠️ WARNING (solo riesgo de regresión) | La sonda del verificador buscó `ausente: rut`, `\| rut \|`, `vencido: parafiscales`, `- rut` y `- parafiscales` en el borrador, el checklist y el ENVIO de los 4 casos: 0 coincidencias. La salida actual es correcta; el guardián es más débil de lo que describe |
| IN-01..IN-06 | info | ℹ️ INFO | No afectan a los must-haves |

### Antipatrones encontrados

| Archivo | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| `src/domain/builders/borrador.builder.ts` | 106-108 | `listado.filter(alCliente.has)` omite en silencio los archivos para el cliente que faltan en `paquete/`, y los bloqueos solo salen del repositorio (CR-01) | ⚠️ Warning | Registro de envío "Sin bloqueos" con un paquete desactualizado (reproducido) |
| `tests/contract/simular-envio.test.ts` / `tests/unit/borrador.builder.test.ts` | 219-225 / 230 | Las pruebas fijan el comportamiento de CR-01 | ⚠️ Warning | Habría que invertirlas si se decide corregirlo |
| `src/domain/builders/borrador.builder.ts` | 43-51 | `pendientesDe` mezcla faltantes del maestro con soportes, bajo "Los enviaremos por separado" (WR-01) | ⚠️ Warning | Redacción ante el cliente |
| `tests/golden/nombres-soporte.test.ts` | 30 | `IDS_SNAKE` excluye `rut` y `parafiscales` (WR-04) | ⚠️ Warning | Riesgo de regresión |
| `src/demo/runners/ejecutar-demo.runner.ts` | 99-109 | stdout con ids crudos (WR-03) | ℹ️ Info | Intencional según el contrato v1 |

No hay marcadores TBD, FIXME, XXX, TODO, HACK ni placeholder, ni comentarios, en los 21 archivos modificados por los planes 01-12 a 01-15. `reto-01/` no tiene cambios: solo lo toca el commit e13a7b5.

### Verificación humana requerida

#### 1. Aspecto del xlsx (repetición de la UAT 17)

**Prueba:** Abrir `out/co-industrias-delta/formulario.xlsx` y `out/hn-agroexport-sula/formulario.xlsx` en Excel o LibreOffice.
**Esperado:** Las etiquetas y los valores se leen completos. "Actividad económica" se ajusta en varias líneas dentro de la columna C (ancho 60). Se conservan la negrita, los rellenos y las notas.
**Por qué humana:** El recorte depende del visor, y quien reportó G-01-H1 fue la persona.

#### 2. Tono del borrador y del registro de envío (repetición de la UAT 20, WR-01 y WR-02)

**Prueba:** Leer `paquete/borrador-correo.md` de los 4 casos y un `ENVIO-SIMULADO.md` confirmado.
**Esperado:** Tono profesional. Hay que decidir si es aceptable que el correo de ec prometa "Número de contribuyente especial… Los enviaremos por separado" y que las preguntas usen la nota interna ("confirmar si el cliente acepta el NIT colombiano").
**Por qué humana:** Es redacción y producto. La persona reportó H4, y la redacción actual sigue la decisión GC-1.

#### 3. Decisión sobre CR-01

**Prueba:** Revisar la reproducción (escenarios A y B, en el frontmatter).
**Esperado:** Corregirlo (convertir lo que falta en un bloqueo o devolver PAQUETE_DESACTUALIZADO) o aceptarlo con un override.
**Por qué humana:** El plan especificó este comportamiento y las pruebas lo fijan. Que el registro de auditoría deba detectar un paquete desactualizado es una decisión de producto.

#### 4. Decisión sobre WR-03

**Prueba:** Revisar el stdout de `bun run demo.ts` para ec y hn.
**Esperado:** Confirmar que se conservan los ids crudos por el contrato v1 y documentarlo en SOLUCION.md, o pedir un plan para usar nombres.
**Por qué humana:** Es el alcance de "salida para personas". Los planes lo dejaron fuera a propósito.

**Si alguna decisión resulta en "corregir":** basta con un plan pequeño de cierre de brechas (`/gsd-plan-phase 01 --gaps`). Ese plan invierte las dos pruebas que fijan CR-01, extiende el guardián a `rut` y `parafiscales` (WR-04) y, si se decide, separa "campos sin dato" de "soportes pendientes" en el borrador (WR-01).

**Si se acepta CR-01 tal como está**, añadir al frontmatter:

```yaml
overrides:
  - must_have: "ENVIO-SIMULADO deja registrados los bloqueos vigentes al confirmar"
    reason: "Los bloqueos son los de PAQ-03 (soporte ausente o vencido en el repositorio). Un paquete/ modificado o desactualizado entre armar y enviar queda fuera de alcance en la Fase 1."
    accepted_by: "{nombre}"
    accepted_at: "{ISO timestamp}"
```

### Resumen de brechas

No hay brechas que bloqueen. La brecha anterior (valor en blanco del maestro tratado como `lleno`) está cerrada y cubierta por `tests/contract/maestro-incompleto.test.ts`. Las cuatro brechas de la UAT (H1, H4a, H4b y H4c) están cerradas en el código y en la salida que produce de verdad la herramienta. El estado es `human_needed` porque hay que repetir las dos pruebas que reportó la persona (UAT 17 y 20) y decidir sobre dos hallazgos abiertos de la revisión: CR-01, una cuestión de producto con un comportamiento fijado por el plan, y WR-03, una cuestión de alcance. SEG-02 sigue parcial en la Fase 1 y el resto queda diferido a las Fases 2 y 3, igual que en la ronda anterior. Su marca `[x] Complete` en REQUIREMENTS.md exagera lo que hay.

---

_Verificado: 2026-10-13T04:40:00Z_
_Verificador: Claude (gsd-verifier)_
