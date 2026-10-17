---
phase: 02-agente-y-compuerta-de-confirmaci-n
fixed_at: 2026-10-13T23:23:38Z
review_path: .planning/milestones/v1-phases/02-agente-y-compuerta-de-confirmaci-n/02-REVIEW.md
iteration: 1
findings_in_scope: 22
fixed: 22
skipped: 0
status: all_fixed
---

# Fase 02: informe de correcciones de la revisión de código

**Corregido el:** 2026-10-13T23:23:38Z
**Revisión de origen:** `.planning/milestones/v1-phases/02-agente-y-compuerta-de-confirmaci-n/02-REVIEW.md` (convenciones y código limpio)
**Iteración:** 1

**Resumen:**
- Hallazgos en alcance: 22 (WR-07..WR-14 e IN-09..IN-22, `fix_scope: all`)
- Corregidos: 22
- Omitidos: 0

Queda fuera de alcance la sección "Hallazgos abiertos de la revisión anterior (4c30e81)": WR-01..WR-04 e IN-01..IN-05 no se tocaron. WR-01 sigue pendiente de una decisión de producto de la usuaria.

Todos los cambios son refactors que conservan el comportamiento. La única excepción es WR-13, que corrige un texto equivocado. No cambian los nombres `proveedor_<export>`, las `description` de las herramientas ni la semántica de la compuerta. Los textos que ven el modelo y la analista solo cambian en WR-13, y para IN-09 se comprobó que los textos son idénticos byte a byte contra la versión anterior.

## Verificación

- **Dónde se ejecutaron los gates:** en el worktree aislado `.claude/worktrees/rf-02-*`, sobre la rama temporal `gsd-reviewfix/02-*`, con dependencias instaladas por `bun install --frozen-lockfile` desde `bun.lock`. Después se hizo fast-forward de `main` y se borró el worktree, así que los números se reproducen en el checkout principal con el mismo lockfile.
- Antes de cada commit pasaron `bun run check` (tsc + Biome + `bun audit`) y `bun test`. El estado final da 1097 pass, 1 skip (la prueba en vivo opcional) y 0 fail, frente a 1079 pass al empezar. La prueba en vivo no se ejecutó.
- `biome check .` termina sin advertencias. En IN-22 se quitaron cuatro imports sin uso que Biome solo reporta como advertencia.

## Tabla de hallazgos

| ID | Estado | Commit | Nota |
|---|---|---|---|
| WR-07 | corregido | `f2e7d7c` | `NOMBRE_VISIBLE` y `HERRAMIENTA_POR_NOMBRE_VISIBLE` en `tools.constants.ts` |
| WR-08 | corregido | `f4c6f14` | `cuerpoDeFallo` en `domain/utils/respuesta-herramienta.util.ts` |
| WR-09 | corregido | `3187ddd` | `pendientesDe` y `paqueteConocido` exportados desde la política |
| WR-10 | corregido | `4469cc9` | Cuatro servicios nuevos y `crearTurno`; cuerpos de función sin cambios |
| WR-11 | corregido | `e3ce4de` | Regla de idioma en CLAUDE.md y `docs/estructura.md`; solo renombres |
| WR-12 | corregido | `a5c299f` | `config/types/provider-capabilities.type.ts` |
| WR-13 | corregido: requiere verificación humana | `f0f952d` | El texto que ve quien configura cambió; revisar la redacción |
| WR-14 | corregido | `30c33cd` | Guardianes G15 y G16 con prueba de mordida; violaciones corregidas |
| IN-09 | corregido | `bcfe78a` | Textos idénticos byte a byte (comprobado contra la versión anterior) |
| IN-10 | corregido | `802c2f5` | La copia de la demo se queda por la regla de capas |
| IN-11 | corregido | `9359adb` | `timeoutError()` en el mapper |
| IN-12 | corregido | `b9595a0` | `sinDiacriticos` en `normalizar.util.ts` |
| IN-13 | corregido | `78a212d` | Las pruebas usan `cierreConPregunta("", pendientes)` |
| IN-14 | corregido | `33f83f5` | `Desenlace` pasa a `FinDeTurno` |
| IN-15 | corregido | `987ecec` | `MENSAJE_AGENTE[CODIGO_AGENTE.PRESUPUESTO_AGOTADO]` |
| IN-16 | corregido | `e8f8792` | `PaquetesConocidos` en el dominio; `EntradaCierreTurno` compuesta |
| IN-17 | corregido | `0825cd5` | `DestinoBitacora` en `puertos-agente.type.ts` |
| IN-18 | corregido | `5f9dd44` | Ámbitos `confirmation` y `redaction`, más `runtime` y `text` |
| IN-19 | corregido | `24ffdf5` | Rutas de pino derivadas de `CLAVES_SENSIBLES` |
| IN-20 | corregido | `e942a25` | Objetos de parámetros y fin de las banderas posicionales |
| IN-21 | corregido | `84b7c5c` | Filas actualizadas y prueba que impide que la tabla se desactualice |
| IN-22 | corregido | `10455ff` | Helpers de eventos compartidos y los dos LLM falsos documentados |

## Hallazgos corregidos

### WR-07: el nombre visible `proveedor_<export>` se derivaba a mano en varios módulos

**Archivos modificados:** `src/config/constants/tools.constants.ts`, `src/config/strings.ts`, `src/loop/services/despacho-llamada.service.ts`, `src/loop/services/ejecutar-turno.service.ts`, `src/loop/services/registro-herramientas.service.ts`, `tests/helpers/eventos.helper.ts`, `tests/helpers/llm-falso.helper.ts` y 11 pruebas más
**Commit:** `f2e7d7c`
**Cambio aplicado:**
- `NOMBRE_VISIBLE` (con `satisfies Record<…>`) y `HERRAMIENTA_POR_NOMBRE_VISIBLE` se derivan una sola vez en `tools.constants.ts`.
- `strings.ts` pierde su `nombreVisible` privado y el alias `PROVEEDOR_MAPEAR_CAMPOS`. Con eso `SIGUIENTE_PASO` queda uniforme, que también era la tercera viñeta de IN-09.
- `herramientaDe` pasa a ser `HERRAMIENTA_POR_NOMBRE_VISIBLE.get`.
- El registro tipa el módulo por `HERRAMIENTA` y toma el nombre de `NOMBRE_VISIBLE`, manteniendo el orden de `Object.entries`. Una exportación ajena al contrato ya no se registraría, pero el guardián de `proveedor.ts` hace imposible ese caso.
- `tools/factories/definir-herramienta.factory.ts`, de la fase 1, conserva la plantilla porque `EspecHerramienta.nombre` admite nombres arbitrarios: las pruebas e2e del trazador definen `muchos` y `rota`.

### WR-08: tres sobres de fallo armados a mano con formas distintas

**Archivos modificados:** `src/domain/utils/respuesta-herramienta.util.ts` (nuevo), `src/domain/types/respuesta-herramienta.type.ts` (nuevo), `src/tools/factories/definir-herramienta.factory.ts`, `src/loop/services/registro-herramientas.service.ts`, `src/loop/services/despacho-llamada.service.ts`, `src/loop/services/ejecutar-turno.service.ts`, `tests/unit/respuesta-herramienta.util.test.ts` (nuevo)
**Commit:** `f4c6f14`
**Cambio aplicado:**
- `cuerpoDeFallo(fallo, resumen)` arma `{ ok, error, codigo, parcial?, resumen? }` en el orden del factory.
- Lo usan `responderFallo`, el rechazo sin confirmación, la herramienta desconocida y el paso truncado.
- `resultadoDeFallo` construye el `ResultadoLlamada` una sola vez.
- La herramienta desconocida y el paso truncado ahora emiten `error` antes que `codigo`. Solo cambia el orden de las claves; el contenido es el mismo.

### WR-09: la lectura del estado de la compuerta estaba duplicada

**Archivos modificados:** `src/domain/policies/compuerta.policy.ts`, `src/loop/services/cierre-turno.service.ts`, `src/loop/services/bitacora-turno.service.ts`, `src/loop/services/despacho-llamada.service.ts`, `tests/unit/compuerta.policy.test.ts`
**Commit:** `3187ddd`
**Cambio aplicado:**
- La política exporta `pendientesDe` y `paqueteConocido`, y se borró la copia del servicio.
- `needsConfirmation` se calcula como `pendientes.length > 0`.
- `casoConocido`, `casosDeBitacora`, `conocido` y `recuperarAutorizado` pasan por `paqueteConocido`.
- Se agregaron pruebas unitarias de las dos funciones.

### WR-10: `ejecutar-turno.service.ts` tenía 472 líneas y cinco responsabilidades

**Archivos modificados:** `src/loop/services/ejecutar-turno.service.ts`, `src/loop/services/cierre-error.service.ts` (nuevo), `src/loop/services/paso-herramientas.service.ts` (nuevo), `src/loop/services/conversacion-turno.service.ts` (nuevo), `src/loop/services/guardado-turno.service.ts` (nuevo), `src/loop/types/turno.type.ts`
**Commit:** `4469cc9`
**Cambio aplicado:**
- Las responsabilidades quedan así: cierres y errores en `cierre-error`, pasos de herramientas en `paso-herramientas`, conversación y tope en `conversacion-turno`, y persistencia más la bitácora del fin en `guardado-turno`.
- `Turno`, `Cierre`, `FinAnotado`, `Desenlace` y `Ejecucion` pasan a `loop/types/turno.type.ts`.
- `crearTurno` arma el turno, así que `ejecutarTurno` solo orquesta. El archivo bajó a 151 líneas.
- Un script comprobó que los 29 cuerpos de función se movieron sin cambios. Solo `ejecutarTurno` cambió, por la extracción de `crearTurno`.

### WR-11: la capa `llm` mezclaba español e inglés

**Archivos modificados:** `.claude/CLAUDE.md`, `docs/estructura.md`, `src/llm/decorators/observation.decorator.ts` (antes `observacion.decorator.ts`), `src/llm/types/resilience.type.ts` (antes `resiliencia.type.ts`), `src/llm/decorators/{fallback,retry,timeout}.decorator.ts`, `src/llm/mappers/{provider-error,wire-messages}.mapper.ts`, `src/llm/adapters/openai-compatible.adapter.ts`, `src/llm/types/provider.type.ts`, `src/loop/types/agente.type.ts`, `src/loop/wiring/agente.wiring.ts`, `tests/unit/observation.decorator.test.ts` (antes `observacion.decorator.test.ts`), `tests/unit/{fallback,retry}.decorator.test.ts`
**Commit:** `e3ce4de`
**Cambio aplicado:**
- La regla quedó escrita en "Reglas de código del proyecto" y en `docs/estructura.md`. `loop` va en español. En `llm`, el puerto neutral (`llm.type.ts`) va en español, y el protocolo del proveedor (`provider.type.ts`, `adapters/`, `mappers/`, `schemas/`) y los decoradores (`decorators/` y `resilience.type.ts`) van en inglés, aunque usen los miembros en español del puerto.
- Renombres:
  - `withObservacion` a `withObservation`;
  - `OpcionesReintento { maxReintentos, topeMs, esperar, azar }` a `RetryOptions { maxRetries, capMs, wait, random }`;
  - `AlCambiarProveedor` a `OnProviderSwitch`;
  - `ModoThinking` y `ParametroMaxTokens` a `ThinkingMode` y `MaxTokensParam`;
  - los identificadores internos de decoradores, mappers y adaptador.
- `OpcionesAgente.esperar` sigue en español porque pertenece a `loop`.
- El commit contiene solo renombres.

### WR-12: capacidades y slot del proveedor definidos dos veces

**Archivos modificados:** `src/config/types/provider-capabilities.type.ts` (nuevo), `src/config/env.ts`, `src/llm/types/provider.type.ts`, `tests/unit/openai-compatible.adapter.test.ts`
**Commit:** `a5c299f`
**Cambio aplicado:**
- `ThinkingMode`, `MaxTokensParam`, `ProviderCapabilities` y la base común `ProviderEndpoint` viven en la config pura.
- `ProviderSettings` se declara como `ProviderEndpoint & { apiKey: string | null }`, y `ProviderSlot` como `ProviderEndpoint & { apiKey: string }`.
- Se borraron `CapabilitySettings` y los alias duplicados.
- Los nombres van en inglés, igual que sus dos consumidores (`env.ts` y el protocolo del proveedor), por coherencia con WR-11.

### WR-13: `TEXTO_ENV.urlNoSegura` ya no coincidía con los hosts permitidos

**Archivos modificados:** `src/config/constants/llm.constants.ts`, `src/config/strings.ts`, `tests/contract/env-agente.test.ts`
**Commit:** `f0f952d`
**Cambio aplicado:**
- `ESQUEMA_SEGURO` y `ESQUEMA_LOOPBACK` quedan como constantes propias, y de ellas se derivan `PROTOCOLO_SEGURO` y `PROTOCOLO_LOOPBACK`.
- El mensaje se construye con esas constantes y con `HOSTS_LOOPBACK`. Ahora dice: "La URL del proveedor debe usar https; solo estos hosts locales admiten también http: localhost, 127.0.0.1, [::1]."
- Una prueba de contrato exige que el mensaje nombre ambos protocolos y cada host.
- **Requiere verificación humana:** el texto visible cambió a propósito, así que conviene confirmar la redacción.

### WR-14: dos reglas de CLAUDE.md no tenían guardián

**Archivos modificados:** `tests/architecture.test.ts`, `src/config/env.ts`, `src/loop/schemas/resultado-herramienta.schema.ts`, `src/loop/types/resultado-herramienta.type.ts` (nuevo), `src/loop/services/despacho-llamada.service.ts`, `src/infra/fixtures/schemas/fixtures.schema.ts`, `.claude/CLAUDE.md`, `docs/estructura.md`
**Commit:** `30c33cd`
**Cambio aplicado:**
- **G15** reporta un `z.enum([...])` que enumera a mano miembros `CONSTANTE.MIEMBRO`.
- **G16** exige `satisfies z.ZodType<` en cada `export const …Schema` de `src/**/schemas/*.schema.ts`.
- Cada guardián tiene su prueba de mordida. Además se verificó que ambos fallan sobre el código anterior.
- Violaciones corregidas:
  - `env.ts` construye el enum con `[...Object.values(MODO_THINKING), VALOR_OMITIR]`.
  - Los tres esquemas del bucle cumplen tipos escritos a mano, y `despacho` ya no deriva `SoporteArmado` del esquema.
  - Tres esquemas de fixtures de la fase 1 (`cellTemplateSchema`, `fieldTemplateSchema` y `requiredSupportsSchema`) ahora cumplen sus tipos de dominio.
- CLAUDE.md ya no promete guardianes que no existen. Ahora lista G1–G16 y nombra las reglas que se revisan a mano.

### IN-09: `strings.ts` duplicaba una constante y un formateador

**Archivos modificados:** `src/config/strings.ts`
**Commit:** `bcfe78a`
**Cambio aplicado:**
- `SALTO_DE_LINEA` se importa de la constante en lugar de redeclararse.
- Los dos "Detalle:" salen de un único `conDetalle`. La variante del agente solo agrega el punto final, en un solo lugar.
- La cola común de `unCaso` sale de `cierrePregunta`.
- Los textos se compararon byte a byte contra la versión anterior y son idénticos.
- El uso de `NOMBRE_VISIBLE` en `SIGUIENTE_PASO` quedó resuelto en WR-07.

### IN-10: cinco `JSON.parse` envueltos en try/catch

**Archivos modificados:** `src/domain/utils/json.util.ts` (nuevo), `src/domain/types/json.type.ts` (nuevo), `src/infra/fs/fs.util.ts`, `src/infra/types/fs.type.ts` (borrado), `src/infra/fixtures/fixtures-reader.adapter.ts`, `src/infra/knowledge/rules-loader.adapter.ts`, `src/infra/logging/logger.adapter.ts`, `src/llm/mappers/wire-messages.mapper.ts`, `src/llm/adapters/openai-compatible.adapter.ts`, `src/llm/types/provider.type.ts`, `src/loop/services/registro-herramientas.service.ts`, `tests/unit/json.util.test.ts` (nuevo)
**Commit:** `802c2f5`
**Cambio aplicado:**
- `parsearJson` y `esRegistro` viven en el dominio y los usan infra y el registro del bucle. El registro deja una sola función, `jsonO(texto, alternativa)`.
- En `llm`, que no puede importar el dominio, queda un único `parseJson` en `wire-messages.mapper.ts`, que comparten el adaptador e `isJsonObject`.
- `demo/runners/ejecutar-demo.runner.ts` conserva su `esRegistro` porque la capa demo no puede importar el dominio.

### IN-11: `timeout.decorator.ts` construía el `ErrorLlm` a mano

**Archivos modificados:** `src/llm/mappers/provider-error.mapper.ts`, `src/llm/decorators/timeout.decorator.ts`, `tests/unit/provider-error.mapper.test.ts`
**Commit:** `9359adb`
**Cambio aplicado:**
- `timeoutError()` queda exportado junto a `invalidResponseError()`, y el decorador lo usa.
- El helper `falla(tipo, …)` de `adaptador-guion.helper.ts` no se tocó. Fabrica errores de cualquier tipo para las pruebas, y exportar el constructor genérico solo para ellas repetiría el antipatrón de IN-13.

### IN-12: `confirmacion.policy.ts` reimplementaba la normalización

**Archivos modificados:** `src/domain/utils/normalizar.util.ts`, `src/domain/policies/confirmacion.policy.ts`, `tests/unit/normalizar.util.test.ts`
**Commit:** `b9595a0`
**Cambio aplicado:**
- `sinDiacriticos` hace NFD y quita las marcas.
- `normalizarEtiqueta` se apoya en `sinDiacriticos`, y el clasificador también, con `.toLowerCase().trim()`. El orden de las operaciones no cambió.

### IN-13: `preguntaConfirmacion` se exportaba solo para las pruebas

**Archivos modificados:** `src/domain/builders/cierre-turno.builder.ts`, `tests/unit/cierre-turno.builder.test.ts`, `tests/loop/compuerta.test.ts`, `tests/loop/compuerta-casos.test.ts`, `tests/live/agente-en-vivo.test.ts`
**Commit:** `78a212d`
**Cambio aplicado:**
- La función pasa a ser privada.
- Las pruebas obtienen el mismo texto con `cierreConPregunta("", pendientes)`. Todos los usos tienen al menos un caso pendiente, así que el texto es idéntico.

### IN-14: volvía el nombre `Desenlace`

**Archivos modificados:** `src/loop/types/turno.type.ts`, `src/loop/services/ejecutar-turno.service.ts`
**Commit:** `33f83f5`
**Cambio aplicado:** el tipo pasa a llamarse `FinDeTurno`, que es el contenido del evento `FIN_TURNO`, y `let desenlace` pasa a `let fin`.

### IN-15: `MENSAJE_AGENTE` se indexaba por la clave literal

**Archivos modificados:** `src/loop/services/presupuesto.service.ts`, `src/loop/services/conversacion-turno.service.ts`
**Commit:** `987ecec`
**Cambio aplicado:** las dos lecturas pasan a `MENSAJE_AGENTE[CODIGO_AGENTE.PRESUPUESTO_AGOTADO]`.

### IN-16: los tipos de la compuerta se reescribían en vez de componerse

**Archivos modificados:** `src/domain/types/compuerta.type.ts`, `src/domain/policies/compuerta.policy.ts`, `src/loop/types/turno.type.ts`, `src/loop/services/bitacora-turno.service.ts`
**Commit:** `e8f8792`
**Cambio aplicado:**
- `PaquetesConocidos` se declara en el dominio y se usa en `EntradaCierreCompuerta`, en todas las firmas de la política, en la sesión y en la bitácora.
- `EntradaCierreTurno` pasa a ser `EntradaCierreCompuerta & { turnoId; texto }`.

### IN-17: el destino de logs estaba escrito cuatro veces

**Archivos modificados:** `src/application/types/puertos-agente.type.ts`, `src/infra/types/logger.type.ts`, `src/loop/types/agente.type.ts`, `tests/helpers/types/agente-fetch.type.ts`, `tests/helpers/types/bitacora.type.ts`
**Commit:** `0825cd5`
**Cambio aplicado:**
- `DestinoBitacora` vive en el puerto, junto a `BitacoraEstructurada`, y se borró `LogDestination`.
- `OpcionesAgente.fuenteEntorno` conserva su forma en línea, porque `loop` no puede importar `config/env.ts` y CLAUDE.md fija ahí `EnvSource`. Moverlo cambiaría esa excepción, que decidió la usuaria.

### IN-18: constantes en el ámbito o el idioma equivocados

**Archivos modificados:** `src/config/constants/confirmation.constants.ts` (antes `confirmacion`), `src/config/constants/redaction.constants.ts` (antes `redaccion`), `src/config/constants/text.constants.ts` (nuevo), `src/config/constants/{runtime,agent,llm,supports}.constants.ts` y 31 importadores en `src/` y `tests/`
**Commit:** `5f9dd44`
**Cambio aplicado:**
- Los ámbitos pasan a inglés.
- `MS_POR_SEGUNDO`, `MS_POR_MINUTO` y `MS_POR_DIA` quedan juntos en `runtime.constants.ts`. `MS_POR_DIA` reemplaza a `MILISEGUNDOS_POR_DIA`.
- Los separadores de texto van a `text.constants.ts`.

### IN-19: dos listas de claves secretas mantenidas a mano

**Archivos modificados:** `src/config/constants/logging.constants.ts`, `tests/unit/logger.adapter.test.ts`
**Commit:** `24ffdf5`
**Cambio aplicado:**
- `RUTAS_REDACCION_LOG` se deriva de `CLAVES_SENSIBLES`, en la raíz, un nivel abajo y en las cabeceras.
- La salida de los logs no cambia: `redactar` enmascara las mismas claves, sin importar mayúsculas, con el mismo texto (`TEXTO_MASCARA.oculto`) antes de que actúe pino.

### IN-20: funciones con cinco parámetros o con booleanos posicionales

**Archivos modificados:** `src/loop/services/bitacora-turno.service.ts`, `src/loop/services/paso-herramientas.service.ts`, `src/loop/types/turno.type.ts`, `src/llm/decorators/retry.decorator.ts`, `src/llm/adapters/openai-compatible.adapter.ts`, `src/domain/policies/compuerta.policy.ts`
**Commit:** `e942a25`
**Cambio aplicado:**
- `anotarHerramienta(bitacora, HerramientaAnotada)`.
- `withRetry` encierra `base` y `retry`, y `sendWithRetries` recibe solo los argumentos del puerto.
- `toolPart` y `buildRequest` reciben `OpcionesEnvio`.
- La política usa `sinAutorizacion()` y `preguntarCual(estado)` en lugar de una bandera.

### IN-21: `docs/estructura.md` no reflejaba la fase 02

**Archivos modificados:** `docs/estructura.md`, `tests/architecture.test.ts`
**Commit:** `84b7c5c`
**Cambio aplicado:**
- Se actualizaron las filas de builders, policies, utils, decorators, `loop/types` y `loop/services`, con cada módulo nombrado por su rol.
- Una prueba nueva de la arquitectura, con su prueba de mordida, falla si un módulo de esas carpetas no aparece en el documento.

### IN-22: las pruebas duplicaban helpers y comparaban con literales

**Archivos modificados:** `tests/helpers/eventos.helper.ts`, `tests/helpers/agente-fetch.helper.ts`, `tests/helpers/agente-prueba.helper.ts`, `tests/helpers/pii.helper.ts`, `tests/loop/sesion.test.ts`, `tests/loop/trazador-agente.test.ts`, `tests/loop/bitacora.test.ts`, `tests/live/agente-en-vivo.test.ts`, `docs/estructura.md`
**Commit:** `10455ff`
**Cambio aplicado:**
- `recoger`, `inicioDe` y `sesionDe` viven en `eventos.helper.ts`. Sus errores derivan el nombre del evento de `TIPO_EVENTO`.
- `bitacora.test.ts` importa `SIMULAR` en vez de redefinirlo.
- `pii.helper.ts` compara con `TIPO_MASCARA.PUBLICO`.
- Los dos LLM falsos se mantienen. Unificarlos mezclaría dos contratos distintos: los decoradores necesitan pasos en función de `OpcionesEnvio` y un par primario/respaldo, y el bucle necesita respuestas construidas con los mensajes previos. `docs/estructura.md` documenta por qué existen los dos.

---

_Corregido: 2026-10-13T23:23:38Z_
_Corrector: Claude (gsd-code-fixer)_
_Iteración: 1_
