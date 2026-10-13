---
phase: 01-n-cleo-determinista
verified: 2026-10-13T16:20:00Z
status: passed
score: 111/111 must-haves verified
covered_files: [".bun-version",".dockerignore",".gitignore",".planning/phases/01-n-cleo-determinista/01-01-PLAN.md",".planning/phases/01-n-cleo-determinista/01-01-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-02-PLAN.md",".planning/phases/01-n-cleo-determinista/01-02-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-03-PLAN.md",".planning/phases/01-n-cleo-determinista/01-03-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-04-PLAN.md",".planning/phases/01-n-cleo-determinista/01-04-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-05-PLAN.md",".planning/phases/01-n-cleo-determinista/01-05-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-06-PLAN.md",".planning/phases/01-n-cleo-determinista/01-06-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-07-PLAN.md",".planning/phases/01-n-cleo-determinista/01-07-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-08-PLAN.md",".planning/phases/01-n-cleo-determinista/01-08-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-09-PLAN.md",".planning/phases/01-n-cleo-determinista/01-09-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-10-PLAN.md",".planning/phases/01-n-cleo-determinista/01-10-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-11-PLAN.md",".planning/phases/01-n-cleo-determinista/01-11-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-12-PLAN.md",".planning/phases/01-n-cleo-determinista/01-12-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-13-PLAN.md",".planning/phases/01-n-cleo-determinista/01-13-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-14-PLAN.md",".planning/phases/01-n-cleo-determinista/01-14-SUMMARY.md",".planning/phases/01-n-cleo-determinista/01-15-PLAN.md",".planning/phases/01-n-cleo-determinista/01-15-SUMMARY.md","biome.json","bun.lock","demo.ts","docs/estructura.md","docs/plantillas.md","package.json","src/application/services/contenido-paquete.service.ts","src/application/services/contexto-caso.service.ts","src/application/services/estado-paquete.service.ts","src/application/services/mapeo-canonico.service.ts","src/application/types/armar-paquete.type.ts","src/application/types/contexto-caso.type.ts","src/application/types/generar-formulario.type.ts","src/application/types/leer-solicitud.type.ts","src/application/types/mapear-campos.type.ts","src/application/types/mapeo-canonico.type.ts","src/application/types/puertos.type.ts","src/application/types/simular-envio.type.ts","src/application/use-cases/armar-paquete.use-case.ts","src/application/use-cases/generar-formulario.use-case.ts","src/application/use-cases/leer-solicitud.use-case.ts","src/application/use-cases/mapear-campos.use-case.ts","src/application/use-cases/simular-envio.use-case.ts","src/config/constants/demo.constants.ts","src/config/constants/errors.constants.ts","src/config/constants/files.constants.ts","src/config/constants/forms.constants.ts","src/config/constants/io.constants.ts","src/config/constants/knowledge.constants.ts","src/config/constants/limits.constants.ts","src/config/constants/maestro.constants.ts","src/config/constants/mapping.constants.ts","src/config/constants/patterns.constants.ts","src/config/constants/pdf.constants.ts","src/config/constants/pii.constants.ts","src/config/constants/runtime.constants.ts","src/config/constants/supports.constants.ts","src/config/constants/tools.constants.ts","src/config/constants/xlsx.constants.ts","src/config/env.ts","src/config/strings.ts","src/config/types/valor-de.type.ts","src/demo/runners/ejecutar-demo.runner.ts","src/demo/types/demo.type.ts","src/domain/builders/borrador.builder.ts","src/domain/builders/campo-presentado.builder.ts","src/domain/builders/checklist.builder.ts","src/domain/builders/formulario.builder.ts","src/domain/builders/glosario.builder.ts","src/domain/builders/portal.builder.ts","src/domain/engines/mapeo.engine.ts","src/domain/engines/motor-plantillas.engine.ts","src/domain/policies/comparar-mapeo.policy.ts","src/domain/policies/identificador-tributario.policy.ts","src/domain/policies/paquete-vigente.policy.ts","src/domain/policies/pii.policy.ts","src/domain/policies/plantilla-caso.policy.ts","src/domain/policies/soportes.policy.ts","src/domain/policies/validar-reglas.policy.ts","src/domain/policies/vigencias.policy.ts","src/domain/selectors/maestro.selector.ts","src/domain/selectors/solicitud.selector.ts","src/domain/types/borrador.type.ts","src/domain/types/checklist.type.ts","src/domain/types/comparar-mapeo.type.ts","src/domain/types/errores.type.ts","src/domain/types/fecha.type.ts","src/domain/types/formulario.type.ts","src/domain/types/glosario.type.ts","src/domain/types/maestro.type.ts","src/domain/types/mapeo.type.ts","src/domain/types/motor-plantillas.type.ts","src/domain/types/paquete.type.ts","src/domain/types/pii.type.ts","src/domain/types/plantilla-caso.type.ts","src/domain/types/portal.type.ts","src/domain/types/reglas.type.ts","src/domain/types/resultado.type.ts","src/domain/types/solicitud.type.ts","src/domain/types/soportes.type.ts","src/domain/types/validacion.type.ts","src/domain/types/vigencias.type.ts","src/domain/utils/fecha.util.ts","src/domain/utils/formatear-issues.util.ts","src/domain/utils/nombre-error.util.ts","src/domain/utils/normalizar.util.ts","src/domain/utils/resultado.util.ts","src/infra/clock/clock.adapter.ts","src/infra/fixtures/case-resolver.adapter.ts","src/infra/fixtures/fixtures-reader.adapter.ts","src/infra/fixtures/schemas/fixtures.schema.ts","src/infra/fs/fs.util.ts","src/infra/fs/safe-paths.util.ts","src/infra/knowledge/rules-loader.adapter.ts","src/infra/knowledge/schemas/rules.schema.ts","src/infra/knowledge/template-loader.adapter.ts","src/infra/logging/audit-log.adapter.ts","src/infra/output/case-lock.adapter.ts","src/infra/output/output-files.adapter.ts","src/infra/output/package-copy.adapter.ts","src/infra/output/pdf/pdf-layout.util.ts","src/infra/output/pdf/pdf-renderer.adapter.ts","src/infra/output/xlsx-writer.adapter.ts","src/infra/types/fs.type.ts","src/infra/types/pdf-layout.type.ts","src/knowledge/plantillas/borrador-correo.md","src/knowledge/plantillas/checklist.md","src/knowledge/plantillas/envio-simulado.md","src/knowledge/plantillas/valores-portal.md","src/knowledge/reglas.json","src/tools/factories/definir-herramienta.factory.ts","src/tools/factories/herramientas.factory.ts","src/tools/proveedor.ts","src/tools/schemas/argumentos.schema.ts","src/tools/types/entorno.type.ts","src/tools/types/herramienta.type.ts","src/tools/wiring/entorno.wiring.ts","tests/architecture.test.ts","tests/contract/generar-formulario.test.ts","tests/contract/maestro-incompleto.test.ts","tests/contract/reglas.test.ts","tests/contract/simular-envio.test.ts","tests/contract/sinteticos.test.ts","tests/e2e/demo.test.ts","tests/e2e/determinismo.test.ts","tests/e2e/pii.test.ts","tests/e2e/trazador.test.ts","tests/fixtures/casos/zz-generica-co/plantilla-campos.json","tests/fixtures/casos/zz-generica-co/solicitud.json","tests/fixtures/casos/zz-generica-co/soportes-exigidos.json","tests/fixtures/casos/zz-generica-ec/plantilla-campos.json","tests/fixtures/casos/zz-generica-ec/solicitud.json","tests/fixtures/casos/zz-generica-ec/soportes-exigidos.json","tests/fixtures/casos/zz-plantilla-corrupta/plantilla-celdas.json","tests/fixtures/casos/zz-plantilla-corrupta/solicitud.json","tests/fixtures/casos/zz-plantilla-corrupta/soportes-exigidos.json","tests/golden/borrador-envio.test.ts","tests/golden/formulario-pdf.test.ts","tests/golden/formulario-portal.test.ts","tests/golden/formulario-xlsx.test.ts","tests/golden/mapear-campos.test.ts","tests/golden/nombres-soporte.test.ts","tests/golden/paquete.test.ts","tests/helpers/correr-demo.helper.ts","tests/helpers/flujo.helper.ts","tests/helpers/instantanea.helper.ts","tests/helpers/pdf-texto.helper.ts","tests/helpers/proyecto-temporal.helper.ts","tests/helpers/tipo-celda.helper.ts","tests/helpers/types/correr-demo.type.ts","tests/helpers/types/flujo.type.ts","tests/helpers/types/instantanea.type.ts","tests/helpers/types/pdf-texto.type.ts","tests/helpers/types/proyecto-temporal.type.ts","tests/helpers/types/xlsx-leer.type.ts","tests/helpers/xlsx-leer.helper.ts","tests/sin-comentarios.test.ts","tests/unit/borrador.builder.test.ts","tests/unit/checklist.builder.test.ts","tests/unit/clock.adapter.test.ts","tests/unit/comparar-mapeo.policy.test.ts","tests/unit/fixtures-reader.adapter.test.ts","tests/unit/fixtures.schema.test.ts","tests/unit/identificador-tributario.policy.test.ts","tests/unit/mapeo.engine.test.ts","tests/unit/motor-plantillas.engine.test.ts","tests/unit/normalizar.util.test.ts","tests/unit/output-files.adapter.test.ts","tests/unit/package-copy.adapter.test.ts","tests/unit/paquete-vigente.policy.test.ts","tests/unit/pdf-layout.util.test.ts","tests/unit/pii.policy.test.ts","tests/unit/plantilla-caso.policy.test.ts","tests/unit/solicitud.selector.test.ts","tests/unit/soportes.policy.test.ts","tests/unit/validar-reglas.policy.test.ts","tests/unit/vigencias.policy.test.ts","tests/unit/xlsx-writer.adapter.test.ts","tsconfig.json"]
covered_digest: "v3:sha256:cecd9fb5d1775785ae802c7b874a0c39d8983bfdce19b260ef4d4d0ff7f9ad22"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: human_needed
  previous_score: 111/111
  gaps_closed: []
  gaps_remaining: []
  regressions: []
deferred:
  - truth: "SEG-02: una única función `redactar()`, basada en una política de rutas sensibles, se aplica a los logs, la API, el SSE y los resúmenes de tool calls"
    addressed_in: "Phase 2 / Phase 3"
    evidence: "Fase 2 SC5: 'Los logs JSON llevan IDs de sesión, turno y tool call, sin clave ni PII'. Fase 3 SC2: 'cada tool call como tarjeta colapsable (nombre, args redactados…)'. Fase 3 SC3: 'el historial vuelve desde GET /api/sessions/:id con la PII redactada'. En la Fase 1 existen la política por rutas (POLITICA_PII y enmascarar en src/domain/policies/pii.policy.ts) y el grep de PII con control positivo (tests/e2e/pii.test.ts). `grep -rn redactar src tests demo.ts` no devuelve nada; la API y el SSE todavía no existen."
---

# Fase 1: Núcleo determinista. Informe de verificación

**Objetivo de la fase:** Cualquiera puede correr `bun run demo.ts` sin clave LLM y obtener, para los 4 casos, formularios, paquetes para firma y logs correctos y reproducibles. Cada valor sale de una herramienta tipada que lo lee del maestro, y ninguna inventa un dato.
**Verificado:** 2026-10-13T16:20:00Z
**Estado:** passed
**Re-verificación:** Sí. La verificación anterior (04:40Z, `human_needed`) quedó obsoleta por dos ciclos de corrección de la revisión (19 commits `fix(01)`) y el commit bdc4ba4 (archivos basura del SO). No tenía sección `gaps:`, así que se re-verificó todo el alcance, con foco completo en lo que cambió.

## Logro del objetivo

Todo lo que sigue lo ejecutó el verificador en su propio proceso. Los SUMMARY, 01-REVIEW-FIX.md y 01-UAT.md solo sirvieron para ubicar el código y las decisiones.

- `bun run check` terminó con código 0: tsc estricto, Biome sobre 172 archivos y `bun audit` sin vulnerabilidades (207 paquetes).
- `bun test` se ejecutó una sola vez completo: **561 pass, 0 fail**, 39 archivos, 3044 aserciones. No hay `.skip`, `.todo` ni `.only` en `tests/`. Esta máquina tiene `reto-01/fixtures/reto-01/casos/.DS_Store`, así que el fallo WR-03 de la revisión ya no se reproduce.
- `bun run demo.ts` se ejecutó dos veces sin `DEEPSEEK_API_KEY` ni `FECHA_EJECUCION`. Las dos salieron con código 0 y el stdout es idéntico byte a byte. De los 38 archivos de `out/`, todos son idénticos byte a byte (incluidos los xlsx y el pdf) salvo los 5 `log.jsonl`, que solo difieren en `ts`.
- La sonda independiente `scratchpad/sonda-ciclo2.ts` ejerció el ciclo 2 a través de las herramientas exportadas en proyectos temporales: **28/28 PASS**. Primero dio 2 FAIL, pero eran errores de la sonda: leía `r.listo_para_firma` en lugar de `r.data.listo_para_firma`. La salida cruda ya mostraba el comportamiento correcto, y tras corregir la sonda quedó en 28/28.
- La sonda `scratchpad/sonda-maestro.ts` documenta un límite del diseño (ver Antipatrones, ℹ️ Info).

### Verdades observables

**Criterios de éxito del roadmap y verdades del objetivo y del Core Value**

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | SC1: la demo sin clave LLM limpia `out/`, imprime 2026-09-03 y la tabla de verdad, y dos ejecuciones dan lo mismo salvo timestamps | ✓ VERIFIED | Salida observada: co xlsx 17/0/0 LISTO, ec pdf 13/1/1 BLOQUEADO (ausente: certificado_cumplimiento_tributario), hn xlsx 9/1/1 BLOQUEADO (vencido: parafiscales (2026-08-31)), pa portal 8/0/1 LISTO "formato no soportado". El stdout es idéntico byte a byte entre corridas, y los logs son iguales una vez quitado `ts` |
| 2 | SC2: el xlsx de co tiene etiquetas y valores en las celdas de la plantilla (las dos hojas, ceros a la izquierda), el PDF de ec sigue el orden de la plantilla con marcas, y pa tiene `valores-portal.md` con el aviso | ✓ VERIFIED | Los goldens `formulario-xlsx`, `formulario-pdf` y `formulario-portal` están en verde dentro de la suite. La UAT 1 (humana) abrió los xlsx en Excel sin recortes |
| 3 | SC3: el paquete tiene formulario, copias, checklist y borrador (a `solicitud.de`, "RE: <asunto>", sin datos bancarios), `mapeo.json` traza ruta, regla y confianza, y el grep de PII da 0 | ✓ VERIFIED | Los 4 `paquete/` se inspeccionaron. Los 4 borradores van a `solicitud.de` con "RE: …". `grep -rlE "71555123\|03100012345\|COLOCOBM\|900123456"` sobre `*.jsonl`, `*.json`, `checklist.md`, `borrador-correo.md` y `ENVIO-SIMULADO.md` de `out/` sale con código 1, es decir, sin coincidencias. `tests/e2e/pii.test.ts` (con control positivo) está en verde |
| 4 | SC4: las 5 tools se importan sin servidor, nunca lanzan, tienen errores estables en español, el envío sin confirmación da "requiere confirmación explícita" y todo queda registrado | ✓ VERIFIED | Las suites de contrato están en verde. La sonda (J) confirma que, aun con un paquete desactualizado, `confirmado:false` responde primero CONFIRMACION_REQUERIDA con el literal exacto |
| 5 | SC5: check y test pasan con goldens, sintéticos y arquitectura, sin comentarios y con la config centralizada | ✓ VERIFIED | Check con código 0 y 561/0. `architecture.test.ts` (G1 a G14) y `sin-comentarios.test.ts` están en verde. `ARCHIVOS_SISTEMA_IGNORADOS`, `PREFIJO_RUTA_BANCARIA` y `PAQUETE_DESACTUALIZADO` viven en `config/constants` |
| 6 | Objetivo: cada valor del formulario sale de una herramienta tipada que lo lee del maestro | ✓ VERIFIED | `generar-formulario.use-case.ts` recalcula el mapeo canónico y llama a `compararMapeo` antes de escribir. Un mapeo con `valor` se rechaza. El ciclo 2 no tocó este camino |
| 7 | Objetivo: ninguna herramienta inventa un dato | ✓ VERIFIED | Los faltantes de ec y hn quedan vacíos y marcados. El borrador de ec dice "quedan en blanco porque no contamos con el dato", sin prometer enviarlos |
| 8 | Core Value / MAP-01: un dato inexistente o en blanco termina `faltante` y aparece en el checklist | ✓ VERIFIED | `tests/contract/maestro-incompleto.test.ts` está en verde (se tocó en el ciclo 1 y sigue pasando) |
| 9 | Core Value: ninguna acción externa ocurre sin confirmación explícita, y lo que se confirma coincide con lo que se registra | ✓ VERIFIED | Ver la tabla del ciclo 2. Ahora el registro de envío solo se escribe si `paquete/` coincide con lo que `armar_paquete` produciría hoy |

**Comportamiento nuevo del ciclo 2 (CR-01 por estado, WR-01, WR-02 y archivos basura), contrastado con las verdades de 01-10, 01-13 y 01-15**

| Escenario (sonda `sonda-ciclo2.ts`, herramientas exportadas) | Resultado | Estado |
|---|---|---|
| A. Paquete recién armado, confirmado dos veces | ok las dos veces | ✓ |
| B. Un soporte vence entre armar (09-03) y enviar (10-05) | PAQUETE_DESACTUALIZADO con `archivos_desactualizados: [borrador-correo.md]`; el mensaje apunta a `proveedor_armar_paquete`. Tras re-armar: `listo_para_firma:false`, el borrador ya no adjunta la cámara ni dice "listo", y ENVIO pone la cámara en "Soportes vencidos que no se envían" con el bloqueo por nombre | ✓ |
| C. `rut` sale del índice después de armar | PAQUETE_DESACTUALIZADO: `rut-2026.txt` como sobrante y el borrador como desactualizado. Tras re-armar: `data.bloqueos` crudo `ausente: rut`, ENVIO dice "ausente: Registro Único Tributario" y el archivo ya no está en `paquete/` | ✓ |
| D. `borrador-correo.md` borrado | PAQUETE_DESACTUALIZADO, faltante | ✓ |
| E. Archivo ajeno `notas.txt` en `paquete/` | PAQUETE_DESACTUALIZADO, sobrante, y no escribe ENVIO | ✓ |
| F. `.DS_Store`, `Thumbs.db` y `desktop.ini` en `paquete/` | ok, y no aparecen en ENVIO (decisión humana) | ✓ |
| G. Borrador editado a mano | PAQUETE_DESACTUALIZADO (decisión humana: hay que volver a correr armar_paquete) | ✓ |
| H. Soporte o formulario borrado | PAQUETE_DESACTUALIZADO, faltante | ✓ |
| I. `checklist.md` editado | ok: el checklist no se compara porque lleva la fecha (decisión humana) | ✓ |
| HN con parafiscales renovado entre armar y enviar | PAQUETE_DESACTUALIZADO con el renovado como faltante. Tras re-armar: LISTO, sin bloqueos, envía `parafiscales-2026-09.txt` y no el viejo | ✓ |
| WR-02: preguntas por el emisor | En HN, ni el checklist ni el borrador preguntan por el emisor del vencido. Tras renovarlo, el número de preguntas del checklist y del borrador coincide (3 = 3) | ✓ |
| WR-01: solo un campo bancario por confirmar | La prueba nombrada `bun test tests/unit/borrador.builder.test.ts -t "WR-01\|bancario\|exactamente una"` da 8/8: `firma_tras_validar` activa, `firma_lista` vacía, sin nombrar el campo bancario, y exactamente una bandera de firma en las 16 combinaciones | ✓ |
| PII en ENVIO tras re-armar | Ninguno de los 4 valores sensibles aparece | ✓ |

Estos escenarios refuerzan las verdades de los planes. No contradicen ninguna:
- 01-10 ("con confirmación escribe ONLY ENVIO-SIMULADO.md con los bloqueos vigentes y no exige listo_para_firma") se mantiene con un paquete al día. Con un paquete desactualizado el envío se rechaza, y ese enfoque lo aprobó la persona en la UAT 3.
- 01-13 ("only when they exist in paquete/") queda reforzado: ahora un archivo para el cliente que falta en `paquete/` rechaza el envío y ya no se omite en silencio.

**Must-haves de los planes de cierre (01-12 a 01-15)**

| Plan | Verdades | Estado | Evidencia clave |
|------|----------|--------|-----------------|
| 01-12 (G-01-H1) | 5/5 | ✓ VERIFIED | `verify.artifacts` 4/4 y `verify.key-links` 2/2. Los goldens de anchos con literales (IN-06) están en verde. La UAT 1 humana pasó. El xlsx sale idéntico byte a byte en dos corridas |
| 01-13 (G-01-H4a/H4b) | 6/6 | ✓ VERIFIED | artifacts 4/4 y links 2/2. Los 4 borradores observados no dicen "firmad". ENVIO solo lista el formulario y los soportes presentes. pa explica el portal. La prohibición de nivel test está cableada en `borrador.builder.test.ts:273` ("el contexto tiene exactamente las claves permitidas y ningún dato bancario") |
| 01-14 (G-01-H4c) | 4/4 | ✓ VERIFIED | artifacts 3/3 y links 2/2. El borrador y el checklist muestran nombres en español. `data.bloqueos`, `resumen`, los logs y el stdout de la demo conservan los ids crudos (stdout observado) |
| 01-15 (G-01-H4c) | 5/5 | ✓ VERIFIED | artifacts 2/2 y links 2/2. ENVIO dice "ausente: Registro Único Tributario" y "vencido: Certificado de existencia y representación legal (2026-09-30)" (sonda). `nombres-soporte.test.ts` vigila `rut` y `parafiscales` (WR-04 del ciclo 1, líneas 143-144) y solo recorre directorios (WR-03) |

**Must-haves de los planes 01-01 a 01-11 (82 verdades, comprobación de regresión)**

| Plan | Verdades | Estado | Nota |
|------|----------|--------|------|
| 01-01 | 5/5 | ✓ VERIFIED | artifacts 4/4 y links 2/2. `reto-01/` sin cambios: `git status --porcelain -- reto-01` vacío, y el único commit que lo toca es e13a7b5 |
| 01-02 a 01-11 | 77/77 | ✓ VERIFIED (regresión) | Se verificaron completas en las rondas anteriores, y ahora las cubren la suite en verde, la demo determinista y las sondas. La deriva de rutas por el refactor de carpetas por rol ya estaba documentada (por ejemplo, `evaluarEstadoPaquete` vive ahora en `application/services/estado-paquete.service.ts`). El ciclo 2 movió `renderizarBorrador` y `renderizarChecklist` a `application/services/contenido-paquete.service.ts`. El enlace 01-10 `armar-paquete → construirDatosBorrador` ahora pasa por ese servicio, y está cableado: `contenido-paquete.service.ts:33` |
| 01-10 backstop (CAL-04/concurrencia) | 1/1 | ✓ VERIFIED (evidencia explícita) | Hay pruebas en verde: "dos armar_paquete concurrentes sobre co…" (`paquete.test.ts:267`), "dos mapear_campos simultáneos…" (`sinteticos.test.ts:218`) y "reglas.json se lee en cada ejecución, sin caché" (`reglas.test.ts:131`). El único estado mutable de módulo es `const colas = new Map` en `src/infra/output/case-lock.adapter.ts:1`, que es el mapa del candado por caso que permite la verdad |

**Puntuación:** 111/111 verdades verificadas (0 presentes con comportamiento sin verificar).

### Elementos diferidos

| # | Elemento | Se atiende en | Evidencia |
|---|----------|---------------|-----------|
| 1 | SEG-02: una función única `redactar()` aplicada a logs, API, SSE y resúmenes de tool calls | Fase 2 (SC5) y Fase 3 (SC2, SC3) | `redactar` no existe en `src/`. La parte de la Fase 1 sí está cumplida: la política por rutas `POLITICA_PII` y `enmascarar`, respuestas y logs construidos sin valores, y el grep de PII con control positivo |

### Advertencias (nuevo alcance, sin evidencia)

Ninguna. No hubo bloqueos nuevos que necesitaran degradarse. Los dos hallazgos nuevos de esta ronda (ver Antipatrones) tienen reproducción y se clasifican como ℹ️ Info, no como bloqueos.

### Artefactos requeridos

`verify.artifacts`: 01-01 4/4, 01-12 4/4, 01-13 4/4, 01-14 3/3 y 01-15 2/2. Para 01-02 a 01-11 hay deriva de rutas conocida, y sus sucesores existen, son sustantivos y están cableados (verificado en rondas anteriores y ejercido por la suite y la demo). Los artefactos nuevos del ciclo 2 son sustantivos y están cableados:

| Artefacto | Rol | Estado |
|---|---|---|
| `src/domain/policies/paquete-vigente.policy.ts` | `soportesDelPaquete`, `archivosDelPaquete`, `diferenciasDelPaquete` y `paqueteAlDia` | ✓ Lo importan `armar-paquete.use-case.ts`, `contenido-paquete.service.ts` y `simular-envio.use-case.ts` |
| `src/application/services/contenido-paquete.service.ts` | Un solo renderizado de checklist y borrador para armar y para enviar, más `paqueteEsperado` | ✓ Lo importan los dos use cases |
| `src/domain/types/paquete.type.ts` | `PaqueteEsperado`, `PaqueteReal` y `DiferenciasPaquete` | ✓ |
| `src/infra/output/output-files.adapter.ts` `readPackageFile` | Lectura con lista blanca y realpath dentro del caso | ✓ Cableado en `entorno.wiring.ts:110` (`leerDePaquete`) |

### Verificación de enlaces clave

`verify.key-links` da 2/2 en 01-01 y en cada plan de 01-12 a 01-15. Los enlaces nuevos del ciclo 2 se comprobaron a mano:

- `simular-envio.use-case.ts` → `paqueteEsperado` → `renderizarBorrador` → `construirDatosBorrador`.
- `diferenciasDelPaquete` recibe `listarPaquete` y `leerDePaquete`.
- `armar-paquete.use-case.ts` → `soportesDelPaquete` usa la misma fuente que `archivosDelPaquete` (IN-01).

### Traza del flujo de datos (nivel 4)

| Artefacto | Dato | Fuente | Datos reales | Estado |
|-----------|------|--------|--------------|--------|
| `PAQUETE_DESACTUALIZADO.parcial` | faltantes, sobrantes y desactualizados | listado real de `paquete/` + borrador releído, contra lo esperado recalculado desde repositorio, índice y reloj actuales | Sí: cambia con cada escenario de la sonda | ✓ FLOWING |
| `borrador-correo.md` | banderas de firma y preguntas | `Checklist` (`confirmaciones_al_cliente`, `confirmaciones_internas`, `avisos_emisor_al_cliente`) | Sí: co, ec, hn y pa difieren según su estado | ✓ FLOWING |
| `ENVIO-SIMULADO.md` | enviados, retenidos y bloqueos | reevaluación de soportes + listado de `paquete/` ya validado | Sí | ✓ FLOWING |
| stdout de la demo | conteos y estados | respuestas de las herramientas | Sí | ✓ FLOWING |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Tipos, lint y auditoría | `bun run check` | código 0; 0 vulnerabilidades | ✓ PASS |
| Suite completa (una sola vez) | `bun test` | 561 pass, 0 fail | ✓ PASS |
| Demo sin clave y determinista | `env -u DEEPSEEK_API_KEY -u FECHA_EJECUCION bun run demo.ts` ×2 | stdout idéntico; archivos idénticos salvo `ts` en los logs | ✓ PASS |
| Paquete desactualizado por estado (CR-01, ciclo 2) | `bun run scratchpad/sonda-ciclo2.ts` | 28/28 PASS | ✓ PASS |
| WR-01, solo un campo bancario por confirmar | `bun test tests/unit/borrador.builder.test.ts -t "WR-01\|bancario\|exactamente una"` | 8 pass | ✓ PASS |
| Contrato de simular_envio | `bun test tests/contract/simular-envio.test.ts` | 26 pass | ✓ PASS |
| Concurrencia y recarga de reglas (backstop) | `bun test tests/golden/paquete.test.ts -t concurrentes`; `bun test tests/contract/reglas.test.ts` | 1 pass; 8 pass | ✓ PASS |
| PII en las salidas | `grep -rlE "71555123\|03100012345\|COLOCOBM\|900123456" out …` | sin coincidencias | ✓ PASS |

### Ejecución de sondas

La fase no declara sondas `scripts/*/tests/probe-*.sh`, así que el paso 7c no aplica. Las sondas ad hoc del verificador están en la tabla anterior.

### Cobertura de requisitos

Los 33 IDs de la fase aparecen en el `requirements:` de algún plan, así que no hay huérfanos.

| Requisito | Plan fuente | Estado | Evidencia |
|-----------|-------------|--------|-----------|
| HERR-01..05 | 01-01/02/03/05/10 | ✓ SATISFIED | 5 exports, zod con `.describe()`, nunca lanzan, CASO_INVALIDO, se importan sin entorno, `sessionID` aceptado |
| SOLI-01, SOLI-02 | 01-02/06 | ✓ SATISFIED | Suites `sinteticos` y `plantilla-caso` en verde |
| MAP-01..07 | 01-04/05/06/07/08 | ✓ SATISFIED | Tabla de verdad en la demo; `maestro-incompleto` en verde |
| FORM-01..04 | 01-07/08/12 | ✓ SATISFIED | Goldens y UAT 1 |
| PAQ-01, PAQ-03, PAQ-05 | 01-03/09/10 | ✓ SATISFIED | Tabla de verdad de los bloqueos; reloj inyectable (la sonda cambia `FECHA_EJECUCION` y el estado cambia) |
| PAQ-02 | 01-09/14 | ✓ SATISFIED | Fecha, estado, tabla con nombres, "vence en 27 días", faltantes y por confirmar. Acciones separadas entre cliente e interno (WR-01) |
| PAQ-04 | 01-10/13/14 | ✓ SATISFIED (la redacción del requisito está desactualizada, ver abajo) | Va a `solicitud.de`, "RE: …", sin datos bancarios, con lista blanca. Nunca afirma una firma (GC-1) |
| ENV-01 | 01-10/13/15 | ✓ SATISFIED (la redacción del requisito está incompleta, ver abajo) | Sin confirmación responde "requiere confirmación explícita". Con confirmación y el paquete al día escribe solo ENVIO-SIMULADO.md con los bloqueos vigentes y no exige `listo_para_firma`. Con un paquete desactualizado responde PAQUETE_DESACTUALIZADO (aprobado en la UAT 3) |
| SEG-02 | 01-05/11/13 | ◐ PARCIAL en la Fase 1, el resto diferido | Ver "Elementos diferidos" |
| SEG-04 | 01-03/09/10 | ✓ SATISFIED | Contrato `simular-envio.test.ts:392`; 21 líneas en `out/log.jsonl` tras la demo |
| DEMO-01, DEMO-02, DEMO-04 | 01-03/06/11 | ✓ SATISFIED | Demo determinista, goldens, sintéticos |
| CAL-01..04 | 01-01..15 | ✓ SATISFIED | Check en verde; G1 a G14 y sin comentarios en verde; constantes nuevas centralizadas |

**Inexactitudes que siguen en `.planning/REQUIREMENTS.md`** (el verificador no lo edita):

1. **SEG-02 (línea 95 y trazabilidad, línea 231)** está marcado `[x]` y "Complete", pero el texto exige "una única función `redactar()`… a los logs, la API, el SSE y los resúmenes de tool calls". En `src/` no existe `redactar`. Debería figurar como parcial en la Fase 1, con el resto en las Fases 2 y 3, o sin marcar hasta la Fase 3.
2. **PAQ-04 (línea 46)** sigue diciendo "y lista el formulario firmado y los soportes". Eso contradice GC-1 (el borrador nunca afirma una firma) y el caso del portal, donde el formulario no se adjunta. Una redacción coherente sería: "adjunta el formulario (salvo portal) y los soportes presentes, y su cierre refleja el estado de firma sin afirmar que está firmado".
3. **ENV-01 (línea 51)**: dice "Con confirmación, escribe solo `ENVIO-SIMULADO.md`…" y no menciona la precondición aprobada, que con `paquete/` desactualizado (faltantes, sobrantes que no son basura del SO, o un borrador distinto del que se armaría hoy) responde `PAQUETE_DESACTUALIZADO` y no escribe nada. No es incorrecto, pero está incompleto.
4. **Casillas y trazabilidad de la Fase 1**: 27 de los 33 IDs siguen con `[ ]` y "Gaps Found" (por ejemplo HERR-01..05, MAP-01..07, FORM-02..04, PAQ-01, PAQ-03, PAQ-05, SEG-04, DEMO-01/02/04, CAL-01/02/04), aunque todos están satisfechos. Solo FORM-01, PAQ-02, PAQ-04, ENV-01, SEG-02 y CAL-03 figuran `[x]`/"Complete", y SEG-02 es justamente el que no debería.
5. **Pie del documento (línea 259)**: "Last updated: 2026-10-12 after roadmap creation" está desactualizado.

### Compuerta de cobertura de decisiones

`check.decision-coverage-verify`: 36/36 decisiones de CONTEXT.md cumplidas en los artefactos entregados. Ninguna sin cumplir.

### Auditoría de calidad de las pruebas

| Archivo de prueba | Requisito | Activas | Omitidas | Circular | Nivel de aserción | Veredicto |
|---|---|---|---|---|---|---|
| `tests/contract/simular-envio.test.ts` | ENV-01, CR-01 | 26 | 0 | No (estado real recalculado desde los fixtures) | Conductual (flujo de varias herramientas) | ✓ |
| `tests/unit/paquete-vigente.policy.test.ts` | CR-01, IN-01, IN-04 | todas | 0 | No: el fixture se construye con `construirChecklist` | Valor | ✓ |
| `tests/unit/borrador.builder.test.ts` | PAQ-04, WR-01, WR-02 | 25 | 0 | No | Valor y conductual (16 combinaciones de banderas) | ✓ |
| `tests/golden/nombres-soporte.test.ts` | GC-2 | todas | 0 | No: los ids prohibidos salen de `NOMBRE_SOPORTE` | Valor | ✓ |
| `tests/e2e/pii.test.ts` | SEG-02 (Fase 1) | todas | 0 | No: control positivo leído de los formularios | Valor | ✓ |

**Pruebas deshabilitadas en requisitos:** 0. **Patrones circulares:** 0. **Aserciones insuficientes:** 0.

### Antipatrones encontrados

En los 37 archivos de `src/`, `tests/` y `docs/` modificados desde la verificación anterior no hay TBD, FIXME, XXX, TODO, HACK ni placeholder. `TODOS_LOS_IDS` en `nombres-soporte.test.ts` es un identificador en español, no un marcador. Tampoco hay comentarios (G-guards en verde) ni `any`.

| Archivo | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| `src/config/constants/files.constants.ts` | 43-47 | `ARCHIVOS_SISTEMA_IGNORADOS` cubre `.DS_Store`, `Thumbs.db` y `desktop.ini`, pero no los AppleDouble `._*` que macOS crea al copiar a volúmenes no HFS | ℹ️ Info | Reproducido: `._formulario.xlsx` en `paquete/` da PAQUETE_DESACTUALIZADO con `archivos_sobrantes: ["._formulario.xlsx"]`. Es la conducta segura (rechaza, no omite) y la lista exacta la decidió la persona. Si se quiere, se añade `._*` como patrón |
| `src/application/use-cases/simular-envio.use-case.ts` | 26-33 | Al enviar se comparan el listado y el borrador, pero no el contenido de `formulario.*` ni de las copias de soportes en `paquete/` | ℹ️ Info | Reproducido (`sonda-maestro.ts`): si se cambia un valor `lleno` del maestro después de armar, el envío confirmado se acepta con el formulario generado antes. No inventa ningún dato (el valor salió del maestro al generar), y `generar_formulario` vuelve a limpiar `paquete/` (D-12). Conviene que el prompt de la Fase 2 vuelva a generar el formulario si la analista dice que cambió el maestro |

Ninguno es un bloqueo. Los dos tienen reproducción y quedan fuera de los must-haves y de los requisitos de la Fase 1.

### Verificación humana requerida

Ninguna pendiente. Todas las decisiones de producto que afectan a esta fase ya las tomó la persona:

- **UAT 01-UAT.md (complete, 20/20):** anchos del xlsx en Excel (T1), tono del borrador y del registro (T2), enfoque PAQUETE_DESACTUALIZADO en lugar de un bloqueo (T3) e ids crudos en el stdout de la demo, a documentar en SOLUCION.md (T4).
- **Decisiones posteriores a la UAT sobre el ciclo 2**, comunicadas por el orquestador como aprobadas por la persona: la frase nueva "Validaremos internamente algunos datos del formulario antes de pasarlo a la firma de nuestro representante legal."; ignorar archivos basura del SO en `paquete/` (el commit bdc4ba4 dice "Decision recorded during the phase 01 QA run"); comparar el borrador pero no `checklist.md` al enviar, porque el checklist lleva la fecha; y que un borrador editado a mano obligue a volver a correr `armar_paquete`. **Recomendación:** dejar estas cuatro decisiones escritas en 01-UAT.md (o en 01-REVIEW-FIX.md). Hoy solo constan en el mensaje del orquestador y, para los archivos basura, en el commit.

Con eso, el código posterior a la UAT no necesita nuevas pruebas humanas:
- La sonda confirma que el comportamiento observable coincide exactamente con esas decisiones (escenarios F, G e I).
- El cambio de WR-02, que quita del checklist de HN la casilla sobre el emisor del vencido, es interno de la analista y deja el checklist alineado con el borrador ya aprobado.
- IN-02 e IN-04 no cambian ninguna salida.

### Resumen

El objetivo de la fase se cumple en el código, y la re-verificación no encontró brechas:
- La demo corre sin clave LLM, es determinista y reproduce la tabla de verdad.
- Los formularios, los paquetes y los logs son correctos.
- Todos los valores salen del maestro a través de herramientas tipadas.
- El ciclo 2 cierra de verdad el hallazgo CR-01: el envío simulado detecta un paquete desactualizado por estado (vencimientos, soportes que salen del índice, renovaciones, borrador editado o borrado, archivos ajenos) y nunca registra un envío que contradiga el borrador confirmado.

Lo único pendiente es documental. REQUIREMENTS.md tiene cinco inexactitudes (SEG-02 marcado como completo, la redacción de PAQ-04, la precondición de ENV-01, 27 casillas sin actualizar y el pie). Además, las decisiones humanas posteriores a la UAT deberían quedar por escrito.

---

_Verificado: 2026-10-13T16:20:00Z_
_Verificador: Claude (gsd-verifier)_
