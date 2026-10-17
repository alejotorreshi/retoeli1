---
phase: 03-chat-web-api-sse-y-despliegue
plan: 24
subsystem: api
tags: [hono, bun, zod, artefactos, lista-blanca, pii, descarga, vista-previa]

requires:
  - phase: 03-chat-web-api-sse-y-despliegue
    provides: "03-11: despliegue en Render con disco efímero y out/ del usuario bun; 03-20: vista de sesión y rutas GET detrás de requireAccess"
provides:
  - "GET /api/casos/:caso/archivos: lista blanca de lo que existe en disco (D-66)"
  - "GET /api/casos/:caso/archivos/:nombre y …/archivos/paquete/:nombre: el archivo real byte a byte como adjunto (D-64)"
  - "GET /api/casos/:caso/vista-previa/:nombre y …/vista-previa/paquete/:nombre: tabla enmascarada desde mapeo.json o texto plano del paquete (D-65, D-74)"
  - "Puerto LectorArtefactos y adaptador createArtifactReader"
affects: [03-27, panel-de-archivos, seguridad, despliegue]

actuals:
  tokens: 12850
  tasks: 2
  commits: 3
plan_head_before: 6bb56db2e495fb3f35ec07196bc29377132a3f5e
plan_head_after: 8235899bf72a0af594cba66566e3e1cca53619ce

tech-stack:
  added: []
  patterns:
    - "Lista blanca calculada por pedido: el nombre del cliente solo se compara por igualdad con una entrada y nunca se concatena a una ruta"
    - "Archivo servible = lstat regular (sin enlaces) + realpath contenido en el directorio real del caso o del paquete"
    - "Vista previa del formulario y del portal desde mapeo.json con un esquema zod tolerante, proyectada a cuatro campos"

key-files:
  created:
    - src/application/types/artefactos.type.ts
    - src/infra/output/artifact-reader.adapter.ts
    - src/infra/output/schemas/mapeo-guardado.schema.ts
    - src/infra/types/artifact-reader.type.ts
    - src/http/routes/artifacts.route.ts
    - tests/helpers/artefactos.helper.ts
    - tests/unit/artifact-reader.adapter.test.ts
    - tests/http/artefactos.test.ts
  modified:
    - src/config/constants/files.constants.ts
    - src/config/constants/http.constants.ts
    - src/config/strings.ts
    - src/http/types/api.type.ts
    - src/http/wiring/server.wiring.ts
    - src/infra/output/package-copy.adapter.ts
    - tests/architecture.test.ts
    - docs/estructura.md

key-decisions:
  - "Un caso conocido sin carpeta en out/ lista [] (no 404), para que el panel de 03-27 muestre el aviso de reinicio de D-67; un caso desconocido o mal formado da 404 casoNoEncontrado"
  - "El borrador se previsualiza como texto plano con el nombre y el cargo del firmante completos (D-74), sin enmascarar; la Open Question 1 de la investigación quedó superada por D-74"
  - "Las descargas llevan Cache-Control: no-store además de attachment y nosniff, porque llevan los valores reales"
  - "La descarga se nombra por el archivo (borrador-correo.md), no por la ruta paquete/borrador-correo.md"
  - "Los soportes reutilizan la regla esCopiaDeSoporte de package-copy.adapter.ts (ahora exportada), así listar y copiar aceptan los mismos nombres"

patterns-established:
  - "Rutas de artefactos: RUTA_API.ARCHIVOS, ARCHIVO, ARCHIVO_PAQUETE, VISTA_PREVIA y VISTA_PREVIA_PAQUETE, con el segmento derivado de DIRECTORIO_PAQUETE"
  - "tests/helpers/artefactos.helper.ts: generarArtefactos (demo de los cuatro casos + simular_envio de ec) y los constructores de rutas de artefactos"

requirements-completed: [API-05]

coverage:
  - id: D1
    description: "La lista de archivos de cada caso es exactamente la lista blanca que existe en disco, sin mapeo.json, log.jsonl ni copias del formulario en paquete/"
    requirement: API-05
    verification:
      - kind: unit
        ref: "tests/unit/artifact-reader.adapter.test.ts#listar: la lista blanca de lo que existe en disco (D-66)"
        status: pass
      - kind: integration
        ref: "tests/http/artefactos.test.ts#GET /api/casos/:caso/archivos (D-66)"
        status: pass
    human_judgment: false
  - id: D2
    description: "La descarga entrega el archivo real byte a byte con attachment, Content-Type por extensión, nosniff y no-store; traversal, mapeo.json, log.jsonl, enlaces simbólicos y casos desconocidos responden 404 { mensaje }"
    requirement: API-05
    verification:
      - kind: unit
        ref: "tests/unit/artifact-reader.adapter.test.ts#abrir: solo lo que está en la lista blanca, dentro del caso"
        status: pass
      - kind: integration
        ref: "tests/http/artefactos.test.ts#descarga del archivo real (D-64)"
        status: pass
    human_judgment: false
  - id: D3
    description: "Toda ruta de artefactos responde 401 sin acceso"
    requirement: API-05
    verification:
      - kind: integration
        ref: "tests/http/artefactos.test.ts#acceso a los artefactos (D-72)"
        status: pass
    human_judgment: false
  - id: D4
    description: "Ninguna vista previa de los cuatro casos trae un valor sensible del maestro, salvo el firmante en el borrador (D-74); el formulario y el portal salen de mapeo.json"
    requirement: API-05
    verification:
      - kind: integration
        ref: "tests/http/artefactos.test.ts#GET /api/casos/:caso/vista-previa/:nombre (D-64, D-65, D-74)"
        status: pass
      - kind: unit
        ref: "tests/unit/artifact-reader.adapter.test.ts#vistaPrevia del formulario y del portal: tabla desde mapeo.json (D-65, D-74)"
        status: pass
      - kind: e2e
        ref: "tests/e2e/pii.test.ts"
        status: pass
    human_judgment: false

duration: 9min
completed: 2026-10-15
status: complete
---

# Fase 03 Plan 24: Artefactos del caso (lista, descarga y vista previa) Summary

**La API sirve los archivos generados de cada caso a través de una lista blanca calculada sobre lo que existe en disco, con contención por realpath y sin enlaces simbólicos. La descarga entrega el archivo real byte a byte como adjunto. La vista previa nunca muestra un valor completo: el formulario y `valores-portal.md` salen como tabla enmascarada desde `mapeo.json`, y el borrador muestra completo solo a su firmante (D-74). Todo queda detrás del acceso.**

## Performance

- **Duration:** 9 min
- **Started:** 2026-10-15T04:24:21Z
- **Completed:** 2026-10-15T04:33:03Z
- **Tasks:** 2
- **Files modified:** 16

## Accomplishments

- `GET /api/casos/:caso/archivos` lista, en este orden y solo si existen: `formulario.xlsx`, `formulario.pdf`, `valores-portal.md`, `paquete/checklist.md`, `paquete/borrador-correo.md`, `ENVIO-SIMULADO.md` y los soportes de `paquete/`, cada uno con su `tipo` (`TIPO_ARCHIVO_CASO`) y `previsualizable`. Nunca lista `mapeo.json`, `log.jsonl`, las copias `paquete/formulario.*` ni `paquete/valores-portal.md`.
- La descarga (`…/archivos/:nombre` y `…/archivos/paquete/:nombre`) devuelve el archivo real con `Content-Disposition: attachment`, el `Content-Type` de su extensión, `X-Content-Type-Options: nosniff` y `Cache-Control: no-store`. El caso se valida con `PATRON_CASO` y contra `listCases`, el nombre se compara por igualdad con la lista blanca y la ruta real queda contenida en `out/<caso>` (o en su `paquete/`). Un `..%2F` codificado, un enlace simbólico que sale del caso, `mapeo.json`, `log.jsonl` o un caso desconocido responden 404 `{ mensaje }`.
- La vista previa (`…/vista-previa/:nombre` y `…/vista-previa/paquete/:nombre`) del formulario y del portal es la tabla de `etiqueta`, `valor_enmascarado`, `estado` y `nota` leída de `mapeo.json`, sin parsear el xlsx ni renderizar el PDF. El checklist, el borrador y `ENVIO-SIMULADO.md` salen como texto plano y los soportes no tienen vista previa.
- El escaneo de PII recorre las 13 vistas previas de los cuatro casos y no encuentra ningún valor de `sensiblesDelProyecto` fuera de la excepción de `RUTAS_BORRADOR` en el borrador. Además, un control positivo comprueba que el firmante sí aparece completo en el borrador.

## Task Commits

1. **Tarea 1 (tracer): listar y descargar por lista blanca, tras el acceso.** `2625209` (feat)
2. **Tarea 2 (TDD): vista previa sin valores completos.**
   - RED: `cb5fe6a` (test)
   - GREEN: `8235899` (feat)

**Plan metadata:** se registra en el commit de docs de este resumen.

## Tracer feedback gate (Tarea 1)

El modo es interactivo con `human_verify_mode: end-of-phase`, y la verificación de la tarea es solo automática, así que se volvió a correr de punta a punta después del commit. `bun test tests/unit/artifact-reader.adapter.test.ts tests/http/artefactos.test.ts tests/architecture.test.ts` dio 114 pass y 0 fail, y `bun run check` terminó con exit 0. Pasó, así que se siguió con la Tarea 2.

## TDD Gate Compliance (Tarea 2)

- **RED:** se agregaron pruebas de `vistaPrevia` en `tests/unit/artifact-reader.adapter.test.ts` y de las rutas de vista previa, con el escaneo de PII de los cuatro casos, en `tests/http/artefactos.test.ts`. Se corrió `bun --env-file=/dev/null test tests/unit/artifact-reader.adapter.test.ts --reporter=junit`: exit 1, 41 pruebas, 34 pass y 7 fail. El clasificador `check tdd-red-evidence` dio **RED_EVIDENCE_OK** (`target_test_failed`, formato junit, sin `report_errors`) sobre "co-industrias-delta formulario.xlsx da las filas de mapeo.json, en orden".
- **Evaluación semántica:** la prueba objetivo se ejecutó y falló en la aserción planeada (`expect(received).toEqual(expected)`). Esperaba `{ tipo: "tabla", filas }` y recibió `null`, porque `vistaPrevia` todavía devolvía null. No hubo errores de carga, de sintaxis ni fallas ajenas. Las pruebas de "sin vista previa" (soporte, `mapeo.json`, enlace) pasaron desde el principio, como corresponde a un `null` de partida. Las de HTTP fallaron porque las rutas aún no existían.
- **GREEN:** `mapeoGuardadoSchema` (tolerante, con `z.enum(ESTADO_CAMPO)` y `satisfies z.ZodType<MapeoGuardado>`). `vistaPrevia` arma la tabla de `mapeo.json` para `FORMULARIO` y `VALORES_PORTAL`, y el texto con `readOwnRegularText` para `CHECKLIST`, `BORRADOR` y `ENVIO_SIMULADO`. Se agregaron las rutas de vista previa con 404 `vistaPreviaNoDisponible`. Resultado: 75 pass en las pruebas de artefactos y en `tests/e2e/pii.test.ts`.
- **Mutante:** servir `valores-portal.md` como texto plano hace fallar 3 pruebas: la tabla del portal, la ausencia de cuenta, SWIFT, correos y teléfonos, y el escaneo HTTP de los cuatro casos. Se revirtió.
- **REFACTOR:** no hizo falta.

## Files Created/Modified

- `src/application/types/artefactos.type.ts`: `TipoArchivo`, `ArchivoCaso`, `ArchivoServible`, `FilaVistaPrevia`, `VistaPrevia` y el puerto `LectorArtefactos`.
- `src/infra/output/artifact-reader.adapter.ts`: `createArtifactReader` (lista blanca, apertura segura y vistas previas).
- `src/infra/output/schemas/mapeo-guardado.schema.ts` y `src/infra/types/artifact-reader.type.ts`: el esquema tolerante de `mapeo.json` y los tipos internos del adaptador.
- `src/infra/output/package-copy.adapter.ts`: exporta `esCopiaDeSoporte` para reutilizarla.
- `src/http/routes/artifacts.route.ts`: `registerArtifactRoutes` (lista, descarga y vista previa).
- `src/http/types/api.type.ts`: `FileListResponse` y `PreviewResponse`.
- `src/http/wiring/server.wiring.ts`: inyecta `createArtifactReader(resolveRoot(rootDirectory))` después de `requireAccess`.
- `src/config/constants/files.constants.ts`: `TIPO_ARCHIVO_CASO`, `TIPO_VISTA_PREVIA`, `PREFIJO_PAQUETE`, `SEPARADOR_EXTENSION`, `TIPO_CONTENIDO_POR_EXTENSION` y `TIPO_CONTENIDO_BINARIO`.
- `src/config/constants/http.constants.ts`: `PARAMETRO_CASO`, `PARAMETRO_ARCHIVO`, las cinco rutas de artefactos, `DISPOSICION_ADJUNTO`, `CABECERA.CONTENT_DISPOSITION` y `VALOR_CABECERA.SIN_ALMACENAR`.
- `src/config/strings.ts`: `MENSAJE_HTTP.casoNoEncontrado`, `archivoNoEncontrado` y `vistaPreviaNoDisponible`.
- `tests/architecture.test.ts`: `TIPO_ARCHIVO_CASO` y `TIPO_VISTA_PREVIA` en `FAMILIAS_DE_CODIGOS`.
- `docs/estructura.md`: nombra `artifacts` y describe el adaptador, la lista blanca y la vista previa.
- `tests/helpers/artefactos.helper.ts`, `tests/unit/artifact-reader.adapter.test.ts` y `tests/http/artefactos.test.ts`.

## Decisions Made

Están en `key-decisions`. La más relevante para 03-27 es que un caso conocido sin salida en disco responde `200 { archivos: [] }` y no 404. Así el panel distingue "el servidor se reinició" (lista vacía, D-67) de "caso inexistente" (404).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] `Cache-Control: no-store` en las descargas**
- **Found during:** Tarea 1
- **Issue:** las descargas llevan los valores reales del maestro (D-64), y sin una directiva de caché un proxy o el navegador podrían guardarlas.
- **Fix:** se agregó `Cache-Control: no-store` a la respuesta de descarga.
- **Files modified:** `src/http/routes/artifacts.route.ts`, `src/config/constants/http.constants.ts`
- **Verification:** `tests/http/artefactos.test.ts` comprueba la cabecera.
- **Committed in:** `2625209`

**2. [Rule 3 - Blocking] Helper compartido de pruebas**
- **Found during:** Tarea 1
- **Issue:** la prueba unitaria y la de HTTP necesitan la misma salida de los cuatro casos más el envío simulado de ec.
- **Fix:** se creó `tests/helpers/artefactos.helper.ts` (`generarArtefactos` y los constructores de rutas), que no estaba en `files_modified`.
- **Committed in:** `2625209`

**3. [Rule 1 - Reutilización] `esCopiaDeSoporte` exportada**
- **Found during:** Tarea 1
- **Issue:** el filtro de soportes del listado tenía que coincidir con el que acepta la copia al paquete, incluido el rechazo de `..`.
- **Fix:** se exportó la función existente de `package-copy.adapter.ts` en lugar de duplicarla.
- **Committed in:** `2625209`

---

**Total deviations:** 3 auto-fixed (1 de seguridad, 1 bloqueante y 1 de reutilización)
**Impact on plan:** ninguno cambia el alcance. Las rutas, el puerto y los tipos son los del plan.

## Issues Encountered

- `bun run check` rechazó dos tipados de prueba: un `Uint8Array<ArrayBufferLike>` frente a uno de `ArrayBuffer`, y `toEqual` con `unknown[]`. Se resolvieron leyendo los bytes con `Bun.file(...).arrayBuffer()` y tipando el valor recibido como `unknown`.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- 03-27 puede pintar el panel con `GET /api/casos/:caso/archivos`, descargar con `…/archivos/<nombre>` (el `nombre` listado ya incluye `paquete/` cuando corresponde) y mostrar `…/vista-previa/<nombre>` solo cuando `previsualizable` es true.
- En Render el disco es efímero: una lista vacía de un caso conocido es la señal del aviso de D-67.

---
*Phase: 03-chat-web-api-sse-y-despliegue*
*Completed: 2026-10-15*

## Self-Check: PASSED

Los 8 archivos creados existen y los commits `2625209`, `cb5fe6a` y `8235899` están en la historia. La suite completa dio 1984 pass, 1 skip y 0 fail, y `bun run check` terminó con exit 0.
