---
phase: 02-agente-y-compuerta-de-confirmaci-n
reviewed: 2026-10-13T22:48:38Z
depth: standard
review_kind: conventions-and-clean-code
supersedes: "02-REVIEW.md anterior (re-revisión de bugs, preservada en git en 4c30e81 y en 02-REVIEW-DISPOSITION.md)"
diff_base: f8806fc27797016113b3cbba4bf9be66e0bd9971
files_reviewed: 110
files_reviewed_list:
  - .claude/CLAUDE.md
  - .env.example
  - agent/prompt.md
  - docs/estructura.md
  - package.json
  - src/application/types/puertos-agente.type.ts
  - src/config/constants/agent.constants.ts
  - src/config/constants/confirmacion.constants.ts
  - src/config/constants/files.constants.ts
  - src/config/constants/llm.constants.ts
  - src/config/constants/logging.constants.ts
  - src/config/constants/patterns.constants.ts
  - src/config/constants/redaccion.constants.ts
  - src/config/constants/tools.constants.ts
  - src/config/env.ts
  - src/config/strings.ts
  - src/domain/builders/cierre-turno.builder.ts
  - src/domain/policies/compuerta.policy.ts
  - src/domain/policies/confirmacion.policy.ts
  - src/domain/policies/redaccion.policy.ts
  - src/domain/types/cierre-turno.type.ts
  - src/domain/types/compuerta.type.ts
  - src/domain/types/confirmacion.type.ts
  - src/domain/utils/texto-plano.util.ts
  - src/infra/clock/clock.adapter.ts
  - src/infra/clock/sleep.util.ts
  - src/infra/knowledge/instructions-loader.adapter.ts
  - src/infra/logging/logger.adapter.ts
  - src/infra/sessions/memory-session-store.adapter.ts
  - src/infra/types/logger.type.ts
  - src/infra/types/session-store.type.ts
  - src/knowledge/registro-proveedor.md
  - src/llm/adapters/openai-compatible.adapter.ts
  - src/llm/decorators/fallback.decorator.ts
  - src/llm/decorators/observacion.decorator.ts
  - src/llm/decorators/retry.decorator.ts
  - src/llm/decorators/timeout.decorator.ts
  - src/llm/mappers/provider-error.mapper.ts
  - src/llm/mappers/wire-messages.mapper.ts
  - src/llm/schemas/chat-completion.schema.ts
  - src/llm/types/llm.type.ts
  - src/llm/types/provider.type.ts
  - src/llm/types/resiliencia.type.ts
  - src/loop/schemas/resultado-herramienta.schema.ts
  - src/loop/services/bitacora-turno.service.ts
  - src/loop/services/cierre-turno.service.ts
  - src/loop/services/despacho-llamada.service.ts
  - src/loop/services/ejecutar-turno.service.ts
  - src/loop/services/presupuesto.service.ts
  - src/loop/services/registro-herramientas.service.ts
  - src/loop/services/respuesta-turno.service.ts
  - src/loop/services/tope-iteraciones.service.ts
  - src/loop/types/agente.type.ts
  - src/loop/types/evento.type.ts
  - src/loop/types/turno.type.ts
  - src/loop/wiring/agente.wiring.ts
  - src/tools/wiring/entorno.wiring.ts
  - tests/architecture.test.ts
  - tests/contract/env-agente.test.ts
  - tests/contract/instrucciones-agente.test.ts
  - tests/e2e/pii.test.ts
  - tests/fixtures/casos/zz-inyeccion/plantilla-campos.json
  - tests/fixtures/casos/zz-inyeccion/solicitud.json
  - tests/fixtures/casos/zz-inyeccion/soportes-exigidos.json
  - tests/helpers/adaptador-guion.helper.ts
  - tests/helpers/agente-fetch.helper.ts
  - tests/helpers/agente-prueba.helper.ts
  - tests/helpers/bitacora.helper.ts
  - tests/helpers/eventos.helper.ts
  - tests/helpers/fetch-falso.helper.ts
  - tests/helpers/historial.helper.ts
  - tests/helpers/llm-falso.helper.ts
  - tests/helpers/pii.helper.ts
  - tests/helpers/types/adaptador-guion.type.ts
  - tests/helpers/types/agente-fetch.type.ts
  - tests/helpers/types/agente-prueba.type.ts
  - tests/helpers/types/bitacora.type.ts
  - tests/helpers/types/eventos.type.ts
  - tests/helpers/types/fetch-falso.type.ts
  - tests/helpers/types/llm-falso.type.ts
  - tests/helpers/types/pii.type.ts
  - tests/live/agente-en-vivo.test.ts
  - tests/loop/bitacora.test.ts
  - tests/loop/compuerta-casos.test.ts
  - tests/loop/compuerta.test.ts
  - tests/loop/fallback.test.ts
  - tests/loop/instrucciones.test.ts
  - tests/loop/inyeccion.test.ts
  - tests/loop/pii-modelo.test.ts
  - tests/loop/presupuesto.test.ts
  - tests/loop/resiliencia.test.ts
  - tests/loop/sesion.test.ts
  - tests/loop/tope.test.ts
  - tests/loop/trazador-agente.test.ts
  - tests/unit/cierre-turno.builder.test.ts
  - tests/unit/clock.adapter.test.ts
  - tests/unit/compuerta.policy.test.ts
  - tests/unit/confirmacion.policy.test.ts
  - tests/unit/fallback.decorator.test.ts
  - tests/unit/logger.adapter.test.ts
  - tests/unit/memory-session-store.adapter.test.ts
  - tests/unit/observacion.decorator.test.ts
  - tests/unit/openai-compatible.adapter.test.ts
  - tests/unit/provider-error.mapper.test.ts
  - tests/unit/redaccion.policy.test.ts
  - tests/unit/retry.decorator.test.ts
  - tests/unit/sleep.util.test.ts
  - tests/unit/texto-plano.util.test.ts
  - tests/unit/timeout.decorator.test.ts
  - tests/unit/wire-messages.mapper.test.ts
findings:
  critical: 0
  warning: 8
  info: 14
  total: 22
status: issues_found
---

# Phase 02: Code Review Report (convenciones y código limpio)

**Reviewed:** 2026-10-13T22:48:38Z
**Depth:** standard
**Files Reviewed:** 110
**Status:** issues_found

## Summary

Esta revisión no busca bugs: audita si la fase 02 reintrodujo las malas prácticas que la fase 1 limpió (nombres, carpetas, funciones, valores fijos, duplicación y comentarios). Leí completos todos los archivos de `src/` del alcance, los helpers de prueba y sus tipos, y hojeé las pruebas de `tests/loop`, `tests/live`, `tests/contract` y `tests/e2e`. Como referencia usé la revisión de convenciones de la fase 1 (`888878f`, WR-10..WR-20 e IN-13..IN-19), la de carpetas por rol (`bd3642d`, WR-21..), `01-REVIEW-FIX.md` y los commits `refactor(01)`.

**Lo que está bien.** Los guardianes pasan (`tests/architecture.test.ts` y `tests/sin-comentarios.test.ts` dan 64 pass, 0 fail). No hay comentarios, `TODO`, `biome-ignore` ni imports relativos. Cada archivo nuevo está en su carpeta de rol con su sufijo, y los tipos exportados viven en `types/*.type.ts`. Los textos para personas o para el modelo están en `strings.ts`, las regex en `patterns.constants.ts` y las comparaciones usan los objetos `as const`. Las capas `llm` y `loop` respetan la dirección de dependencias.

**Lo que regresó.** Hay ocho advertencias y catorce informativos. Todos son de forma, no de comportamiento, salvo WR-13, cuyo texto de error ya difiere del dato que repite. Se agrupan en cuatro temas:

- **Duplicación.** La fase 1 dejó una sola casa para varias reglas (`e56143b`, `cd8d459`, `37c2023`), y la fase 02 volvió a copiarlas:
  - el nombre visible `proveedor_<export>` (WR-07);
  - el sobre de fallo de una herramienta (WR-08);
  - la lectura del estado de la compuerta (WR-09);
  - los tipos de capacidades del proveedor (WR-12);
  - los helpers de JSON (IN-10).
- **Idioma por capa.** La capa `llm` mezcla español e inglés dentro de un mismo archivo, que es justo lo que WR-20 corrigió en la fase 1 (WR-11).
- **Forma de las funciones.** `ejecutar-turno.service.ts` creció a 472 líneas con cinco responsabilidades (WR-10). Además vuelven dos cosas que la fase 1 había quitado: el nombre `Desenlace` (IN-14) y un export que solo usan las pruebas (IN-13).
- **Guardianes con puntos ciegos.** CLAUDE.md dice que cada regla tiene su guardián, pero dos reglas no lo tienen, y por ese hueco ya pasaron violaciones (WR-14).

**Superposición con la bitácora de disposición.** No repito tres hallazgos que ya están abiertos en `02-REVIEW-DISPOSITION.md`, aunque también rompen convenciones:

- **R1-IN-01:** `LONGITUD_MAXIMA_NOMBRE_HERRAMIENTA` es una constante muerta.
- **R1-IN-02:** el bucle vuelve a parsear la salida de `armar_paquete` con un esquema local sin `satisfies` y duplica `motivoDe` de `checklist.builder.ts:17-23` en `despacho-llamada.service.ts:96-103`.
- **R1-IN-05:** el reloj del agente vuelve a leer el entorno en cada llamada.

Al corregir R1-IN-02 conviene cerrar también la parte de convención de WR-14.

## Warnings

### WR-07: El nombre visible `proveedor_<export>` se deriva a mano en cuatro módulos de `src/` y en unas quince pruebas

**File:** `src/config/strings.ts:9-13`, `src/loop/services/despacho-llamada.service.ts:15-16`, `src/loop/services/ejecutar-turno.service.ts:168-170`, `src/loop/services/registro-herramientas.service.ts:24`

**Issue:** La regla dice que "las herramientas se nombran siempre `proveedor_<export>`". La fase 1 la centralizó en el objeto `HERRAMIENTA` (`74f975b`, WR-11) y el guardián G12 (WR-18), pero la concatenación `${PREFIJO_HERRAMIENTA}${...}` volvió a escribirse en cuatro lugares de producción:

- `strings.ts` tiene su propio `nombreVisible`, que es privado.
- `despacho-llamada.service.ts` define `SIMULAR_ENVIO` y `ARMAR_PAQUETE`.
- `ejecutar-turno.service.ts` hace la búsqueda inversa en `herramientaDe`.
- `registro-herramientas.service.ts` arma el nombre al registrar.

La quinta copia es de la fase 1, en `tools/factories/definir-herramienta.factory.ts:167`. En las pruebas, la misma plantilla aparece en `eventos.helper.ts:18`, `llm-falso.helper.ts:37,82`, `bitacora.test.ts:27-28`, `fallback.test.ts:19`, `resiliencia.test.ts:47-48`, `tope.test.ts:30` y `sesion.test.ts:97,345`, entre otros. Si cambia el prefijo o la forma de armar el nombre, hay que tocar todas estas copias.

**Fix:** Derivar una sola vez, como dato puro, en `tools.constants.ts`. Usarlo en `strings.ts`, en el bucle y en las pruebas:
```ts
export const NOMBRE_VISIBLE = {
  [HERRAMIENTA.LEER_SOLICITUD]: `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.LEER_SOLICITUD}`,
  [HERRAMIENTA.MAPEAR_CAMPOS]: `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.MAPEAR_CAMPOS}`,
  [HERRAMIENTA.GENERAR_FORMULARIO]: `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.GENERAR_FORMULARIO}`,
  [HERRAMIENTA.ARMAR_PAQUETE]: `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.ARMAR_PAQUETE}`,
  [HERRAMIENTA.SIMULAR_ENVIO]: `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.SIMULAR_ENVIO}`,
} as const satisfies Record<ValorDe<typeof HERRAMIENTA>, string>;

export const HERRAMIENTA_POR_NOMBRE_VISIBLE: ReadonlyMap<string, ValorDe<typeof HERRAMIENTA>> = new Map(
  Object.values(HERRAMIENTA).map((herramienta) => [NOMBRE_VISIBLE[herramienta], herramienta]),
);
```
Con esto, `herramientaDe` pasa a ser `HERRAMIENTA_POR_NOMBRE_VISIBLE.get(nombre)`, y `despacho-llamada.service.ts` compara con `NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO]`.

### WR-08: El bucle arma a mano tres sobres de fallo de herramienta, con formas distintas a la del factory

**File:** `src/loop/services/despacho-llamada.service.ts:34-48`, `src/loop/services/registro-herramientas.service.ts:67-80`, `src/loop/services/ejecutar-turno.service.ts:200-210`

**Issue:** La fase 1 hizo que el fallo serializado se construyera una sola vez (`cd8d459`, "build failures once", IN-13). El modelo lo recibe de `responderFallo` (`src/tools/factories/definir-herramienta.factory.ts:62-68`) con la forma `{ ok, error, codigo, resumen }`. La fase 02 agregó tres constructores paralelos:

- `rechazoSinConfirmacion` copia esa forma, incluido el `resumen`.
- `herramientaDesconocida` devuelve `{ ok, codigo, error }`, sin `resumen` y con otro orden de claves.
- `pasoTruncado` devuelve `{ ok, codigo, error }` a mano.

Además, `rechazoSinConfirmacion` y `herramientaDesconocida` repiten el mismo patrón para construir el `ResultadoLlamada` (`contenido: JSON.stringify(respuesta)`, `ok`, `codigo`, `resumen`, `respuesta`). El resultado es que el modelo ve tres contratos de error distintos según quién falló.

**Fix:** Mover la forma del sobre a una función de dominio que puedan importar tanto `tools` como `loop`. Por ejemplo, en `src/domain/utils/respuesta-herramienta.util.ts`:
```ts
export function cuerpoDeFallo(fallo: { codigo: string; error: string; resumen: string | null }) {
  return { ok: false, error: fallo.error, codigo: fallo.codigo, ...(fallo.resumen === null ? {} : { resumen: fallo.resumen }) } as const;
}
```
Después:
- `responderFallo` y los tres sitios del bucle la reutilizan.
- Un solo `resultadoDeFallo(cuerpo)` en `registro-herramientas.service.ts` construye el `ResultadoLlamada`.

### WR-09: La lectura del estado de la compuerta está duplicada entre la política y el servicio de cierre

**File:** `src/domain/policies/compuerta.policy.ts:28-30`, `src/loop/services/cierre-turno.service.ts:10-12,32`

**Issue:** `pendientesDe(estado)` está escrita dos veces, idéntica: una privada en la política y otra en el servicio. A eso se suma que `cierre-turno.service.ts:32` recalcula `needsConfirmation` como `casosPendientes(estado).length > 0`, cuando ya tiene `pendientes` en la línea 26. La pregunta "¿este caso ya está armado?" (`Object.hasOwn(conocidos, caso)`) aparece cuatro veces:

- `compuerta.policy.ts:66`
- `compuerta.policy.ts:101`
- `bitacora-turno.service.ts:47`
- `despacho-llamada.service.ts:52`

Es la misma clase de duplicación que la fase 1 marcó como advertencia en WR-19: una invariante de seguridad, en este caso "solo se envía lo pendiente", copiada a mano en varios módulos.

**Fix:**
- Exportar desde `compuerta.policy.ts` una sola `pendientesDe(estado)` y una `paqueteConocido(conocidos, caso): CasoPendiente | undefined`.
- Borrar la copia del servicio.
- Usar `needsConfirmation: pendientes.length > 0`.
- Hacer que `casoConocido`, `casosDeBitacora`, `conocido` y `recuperarAutorizado` llamen a `paqueteConocido`.

### WR-10: `ejecutar-turno.service.ts` creció a 472 líneas con cinco responsabilidades

**File:** `src/loop/services/ejecutar-turno.service.ts:1-472`

**Issue:** La fase 1 partió `mapeo.ts` (302 líneas, cuatro responsabilidades) por tema en `8a35a4f` (IN-17). Este servicio es más grande y mezcla cinco:

- Apertura y decisión de confirmación, en las líneas 100-123.
- Cierres y errores (`Cierre`, `fallar`, `cortar`, `fallarEnvio`, `interrumpido`), en las líneas 66-72 y 125-166.
- Ejecución de pasos de herramienta (`herramientaDe`, `resumida`, `pasoTruncado`, `ejecutarPaso`, `darPaso`), en las líneas 168-256.
- Conversación con el modelo y tope (`conversar`, `cerrarAlTope`, `resolverTurno`), en las líneas 258-316.
- Persistencia y bitácora del fin (`cerrarCompuerta`, `textoGuardado`, `guardarSesion`, `guardarInterrumpido`, `anotarFin`, `emitirCierre`), en las líneas 318-384.

Además, `ejecutarTurno` (líneas 422-472) arma en línea un objeto `Turno` de 19 campos mientras abre la sesión, registra el inicio, toma el candado, compone señales y abre la compuerta. Este es el módulo que más se va a explicar en la defensa, y hoy obliga a leerlo entero para seguir cualquier camino.

**Fix:** Separarlo en servicios del mismo rol. Los tipos locales `Turno`, `Cierre`, `FinAnotado` y `Desenlace` pasan a `loop/types/turno.type.ts`:

| Archivo | Contenido |
|---|---|
| `loop/services/paso-herramientas.service.ts` | `ejecutarPaso`, `darPaso`, `pasoTruncado`, `asistenteDelPaso`, `resumida` |
| `loop/services/cierre-error.service.ts` | `fallar`, `cortar`, `fallarEnvio`, `interrumpido`, `cerrarSinError` |
| `loop/services/guardado-turno.service.ts` | `cerrarCompuerta`, `textoGuardado`, `guardarSesion`, `guardarInterrumpido`, `anotarFin` |

Además, extraer `crearTurno(entrada, deps, apertura, candado)` para que `ejecutarTurno` solo orqueste.

### WR-11: La capa `llm` mezcla español e inglés en nombres de archivos, funciones y tipos

**File:**
- `src/llm/decorators/observacion.decorator.ts:3`
- `src/llm/decorators/retry.decorator.ts:14-48`
- `src/llm/mappers/provider-error.mapper.ts:12-51`
- `src/llm/mappers/wire-messages.mapper.ts:28-122`
- `src/llm/types/provider.type.ts:10-14`
- `src/llm/types/resiliencia.type.ts`

**Issue:** WR-20 de la fase 1 pidió "elegir una regla y aplicarla en todas partes, y que la regla y el código coincidan". Aquí la regla no existe, porque CLAUDE.md y `docs/estructura.md` no dicen en qué idioma va `llm`, y el código mezcla los dos dentro de cada archivo:

- **Archivos:** `fallback`, `retry` y `timeout.decorator.ts` están en inglés, junto a `observacion.decorator.ts` en español. `llm.type.ts` y `provider.type.ts` (inglés) conviven con `resiliencia.type.ts` (español).
- **Funciones exportadas:** `withFallback`, `withRetry` y `withTimeout`, junto a `withObservacion`, que es un nombre híbrido.
- **Mismo archivo, dos idiomas:**
  - `provider-error.mapper.ts`: `errorFromStatus`, `errorFromException` e `invalidResponseError`, junto a `errorDeTipo`, `tipoPorEstado` y `esperaDe`.
  - `wire-messages.mapper.ts`: `toWireMessages` y `fromChatCompletion`, junto a `esObjetoJson`, `usoDe`, `finDe` y `textoDe`.
  - `retry.decorator.ts`: `withRetry`, junto a `enviarConReintentos`, `esperaPara` y `esperoSinAbortar`.
  - `provider.type.ts`: `ProviderSlot` y `ProviderCapabilities`, junto a `ModoThinking` y `ParametroMaxTokens`.

**Fix:** Primero, fijar la regla en CLAUDE.md y en `docs/estructura.md`. Lo coherente con el resto del proyecto es esto:

- El puerto neutral (`llm/types/llm.type.ts`, `AdaptadorLlm`, `enviar`, `Mensaje`) va en español, porque lo consume el bucle, que está en español.
- El protocolo del proveedor (`provider.type.ts`, `adapters/`, `mappers/`, `schemas/`) va en inglés, como infra, porque traduce un formato externo.
- Los decoradores van en un solo idioma. Hoy son tres de cuatro en inglés, así que `observacion.decorator.ts` pasa a `observation.decorator.ts` y `withObservacion` a `withObservation`.

Después, renombrar los identificadores internos de cada archivo para que coincidan con su idioma, en un commit propio de solo renombres, como se hizo en `c4a5fb2`.

### WR-12: Las capacidades y el slot del proveedor están definidos dos veces, con nombres distintos

**File:** `src/config/env.ts:84-103`, `src/llm/types/provider.type.ts:10-31`, `src/loop/wiring/agente.wiring.ts:64`

**Issue:**
- `CapabilitySettings` (`env.ts:88-94`) y `ProviderCapabilities` (`provider.type.ts:16-22`) tienen los mismos cinco campos, escritos dos veces.
- `MaxTokensParam`/`ThinkingMode` (`env.ts:84,86`) y `ParametroMaxTokens`/`ModoThinking` (`provider.type.ts:10,12`) son el mismo `ValorDe<...>` con nombres en dos idiomas.
- `ProviderSettings` (`env.ts:96-103`) y `ProviderSlot` (`provider.type.ts:24-31`) solo difieren en que `apiKey` admite `null`. El wiring los une con un spread (`{ ...slot, apiKey }`), que compila solo porque TypeScript es estructural.

Si se agrega una capacidad en un lado y no en el otro, el error aparece lejos del cambio. La fase 1 ya había decidido que cada tipo tiene una sola casa (WR-10, `a4dd1be`).

**Fix:** Mover las capacidades a la config pura, que es lo único que pueden importar tanto `config/env.ts` como `llm`. Crear `src/config/types/capacidades-proveedor.type.ts` con `CapacidadesProveedor`, `ModoThinking` y `ParametroMaxTokens`, derivados con `ValorDe`. Después:

- `env.ts` las importa con `import type` y declara `ProviderSettings = { ...; readonly capabilities: CapacidadesProveedor }`.
- `provider.type.ts` las reexporta o las usa directamente.
- `ProviderSlot` se declara como `Omit<…, "apiKey"> & { readonly apiKey: string }` sobre un tipo base común, también en `config/types`.
- Se borran `CapabilitySettings`, `MaxTokensParam` y `ThinkingMode`.

### WR-13: `TEXTO_ENV.urlNoSegura` repite a mano el protocolo y los hosts permitidos, y ya no coincide con ellos

**File:** `src/config/strings.ts:315`, `src/config/constants/llm.constants.ts:112-114`, `src/config/env.ts:135-141`

**Issue:** La regla es que "un texto que repite un dato se deriva de su constante". La fase 1 corrigió exactamente este caso: el "64 caracteres" fijo de `CASO_INVALIDO` pasó a construirse con `LONGITUD_MAXIMA_CASO` (WR-14). El mensaje nuevo dice "debe usar https, salvo en localhost", pero `isAllowedProtocol` acepta `HOSTS_LOOPBACK = {"localhost", "127.0.0.1", "[::1]"}` con `PROTOCOLO_LOOPBACK`. El texto ya divergió del dato: a quien configura `http://127.0.0.1:…` y recibe otro error, el mensaje le dice algo incompleto.

**Fix:** Derivar el texto de las constantes:
```ts
urlNoSegura: `La URL del proveedor debe usar ${PROTOCOLO_SEGURO.replace(":", "")}, salvo en ${[...HOSTS_LOOPBACK].join(", ")}.`,
```
Lo más limpio es tener `PROTOCOLO_SEGURO_NOMBRE = "https"` y derivar `PROTOCOLO_SEGURO = \`${...}:\``, para no hacer un `replace` dentro de `strings.ts`.

### WR-14: Dos reglas de CLAUDE.md no tienen guardián, y por ese hueco ya pasaron violaciones

**File:** `tests/architecture.test.ts` (no hay chequeo), `src/config/env.ts:156`, `src/loop/schemas/resultado-herramienta.schema.ts:3-27`, `src/loop/services/despacho-llamada.service.ts:20`

**Issue:** CLAUDE.md afirma que "cada una de estas reglas tiene su guardián en `tests/architecture.test.ts` (G1–G14)". Dos reglas no tienen ninguno:

1. **"Los `z.enum` se construyen desde [la constante]".** `env.ts:156` enumera a mano `z.enum([MODO_THINKING.HABILITADO, MODO_THINKING.DESHABILITADO, VALOR_OMITIR])`. Si `MODO_THINKING` gana un miembro, el esquema no lo acepta, y nada falla.
2. **"Los esquemas zod se comprueban contra el tipo con `satisfies z.ZodType<T>`".** Los tres esquemas de `resultado-herramienta.schema.ts` no lo usan. Además, `despacho-llamada.service.ts:20` invierte la dirección: deriva el tipo del esquema (`z.output<typeof armarPaqueteSchema>`), justo lo que el juicio de WR-10 de la fase 1 descartó ("el tipo de dominio escrito a mano es la fuente de verdad"). La duplicación de fondo ya está registrada como R1-IN-02; este hallazgo trata el hueco del guardián.

**Fix:**
- Corregir `env.ts:156` con `z.enum([...Object.values(MODO_THINKING), VALOR_OMITIR])`.
- Agregar a la arquitectura dos guardianes con su prueba de mordida:
  - **G15:** en `src/**`, ningún `z.enum([` cuyo arreglo contenga `X.Y` de una familia de `FAMILIAS_DE_CODIGOS` (se exige `z.enum(X)` o `Object.values(X)`).
  - **G16:** cada `export const …Schema` de `**/schemas/*.schema.ts` lleva `satisfies z.ZodType<`. Si el esquema no tiene tipo, se exige un allowlist explícito con su motivo en `docs/`.
- Si se decide no guardar alguna regla, corregir la frase de CLAUDE.md para que no prometa lo que no existe.

## Info

### IN-09: `strings.ts` duplica una constante y un formateador, y arma igual cosas que nombra distinto

**File:** `src/config/strings.ts:35,197,224-226,236-247,330`

**Issue:**
- `const SALTO_DE_LINEA = "\n"` (línea 197) es una copia local de `SALTO_DE_LINEA`, que ya exporta `agent.constants.ts:79`. `strings.ts` ya importa de `agent.constants.ts` en la línea 1.
- `TEXTO_AGENTE.conDetalle` (línea 330) es `TEXTO_ERROR.conDetalle` (línea 35) con un punto final. Son dos formateadores de "mensaje + Detalle", y la fase 1 los había unificado (WR-14, "copias de la misma oración").
- `SIGUIENTE_PASO` usa `PROVEEDOR_MAPEAR_CAMPOS` en una entrada y `nombreVisible(...)` en las otras cuatro.
- Las dos ramas de `TEXTO_CONFIRMACION.unCaso` repiten la cola `; ${SIN_CONFIRMACION_NO_ENVIA} nada. ¿Confirmas el envío simulado de ${caso}?`.

**Fix:**
- Importar `SALTO_DE_LINEA` de `agent.constants.ts`.
- Dejar un solo `conDetalle` y decidir el punto final en un único lugar.
- Usar `NOMBRE_VISIBLE[...]` de WR-07 en todo `SIGUIENTE_PASO`.
- Extraer `const cierrePregunta = (caso: string) => \`...\`` para la cola común de `unCaso`.

### IN-10: Hay cinco `JSON.parse` envueltos en try/catch, dos de ellos en el mismo archivo

**File:** `src/loop/services/registro-herramientas.service.ts:38-52`, `src/llm/mappers/wire-messages.mapper.ts:28-35`, `src/llm/adapters/openai-compatible.adapter.ts:82-88`, `src/infra/logging/logger.adapter.ts:8-10`

**Issue:** La fase 1 dejó un solo `parseJson` en `src/infra/fs/fs.util.ts:18-24` (IN-14, `e56143b`). La fase 02 agregó cuatro variantes más:

- `argumentosDeLlamada` y `jsonDe`, en el mismo archivo y casi idénticas: solo cambia lo que devuelven si falla.
- `esObjetoJson` en el mapper.
- El try/catch inline de `parseCompletion`.

El predicado "objeto plano" (`typeof x === "object" && x !== null && !Array.isArray(x)`) también aparece tres veces: `logger.adapter.ts:9`, `wire-messages.mapper.ts:31` y `src/demo/runners/ejecutar-demo.runner.ts:43`.

**Fix:**
- Mover `parseJson` y `esRegistro` a `src/domain/utils/json.util.ts`. Es puro, y infra, tools y loop lo pueden importar.
- Infra reexporta o importa desde ahí.
- En `registro-herramientas.service.ts` dejar una sola función: `const json = parseJson(texto); return json.ok ? json.valor : alternativa`.
- En `llm`, que no puede importar dominio, dejar un único helper en `llm/mappers/` que usen el adaptador y el mapper.

### IN-11: `timeout.decorator.ts` construye a mano un `ErrorLlm` que el mapper ya sabe construir

**File:** `src/llm/decorators/timeout.decorator.ts:4-12`, `src/llm/mappers/provider-error.mapper.ts:12-18`

**Issue:** `FALLA_POR_TIEMPO` copia la regla `reintentable: TIPOS_ERROR_LLM_REINTENTABLES.has(tipo)` que `errorDeTipo` encapsula (es privada). `retry.decorator.ts:12` sí usa el mapper (`errorFromException(true)`). El helper de prueba `adaptador-guion.helper.ts:25-30` repite la misma construcción.

**Fix:** Exportar `timeoutError()` desde `provider-error.mapper.ts`, al lado de `invalidResponseError()`, y usarlo en el decorador y en el helper.

### IN-12: `confirmacion.policy.ts` reimplementa la normalización de `normalizar.util.ts`

**File:** `src/domain/policies/confirmacion.policy.ts:25-27`, `src/domain/utils/normalizar.util.ts:6-15`

**Issue:** `normalizar` hace `normalize("NFD")`, quita los diacríticos con `PATRON_DIACRITICOS`, pasa a minúsculas y aplica `trim()`, que son los primeros pasos de `normalizarEtiqueta`. Son dos implementaciones de "comparar texto sin tildes ni mayúsculas" en el dominio, y la fase 1 las había dejado en un solo `normalizar.util.ts`.

**Fix:** Extraer `sinDiacriticos(texto)` en `normalizar.util.ts`, usarlo en `normalizarEtiqueta` y en el clasificador, y borrar la `normalizar` privada.

### IN-13: `preguntaConfirmacion` se exporta solo para que las pruebas armen el valor esperado

**File:** `src/domain/builders/cierre-turno.builder.ts:10`

**Issue:** En `src/` la usa solo `cierreConPregunta`, dentro del mismo archivo. La importan `tests/unit/cierre-turno.builder.test.ts`, `tests/loop/compuerta-casos.test.ts` y `tests/live/agente-en-vivo.test.ts`. La fase 1 quitó los exports que solo servían a las pruebas: `textoVence` en `d44d616`, que desde entonces se prueba a través de la función pública.

**Fix:** Dejar de exportarla. Las pruebas pueden obtener el mismo texto por la API pública con `cierreConPregunta("", pendientes)`, que devuelve exactamente la pregunta cuando no hay texto previo (`cierre-turno.builder.ts:48-52`).

### IN-14: Vuelve el nombre `Desenlace`, que la fase 1 había renombrado

**File:** `src/loop/services/ejecutar-turno.service.ts:403,405,464`

**Issue:** En `cd8d459` (IN-17), la fase 1 renombró `Desenlace`/`desenlazar` a `ResultadoEjecucion`/`ejecutarConCaso` porque el nombre no revelaba el rol. El bucle reintroduce `type Desenlace = { motivo; needsConfirmation }` y `let desenlace`.

**Fix:** Renombrar a `FinDeTurno` (es el contenido del evento `FIN_TURNO`) o a `ResultadoTurno`, y llevar el tipo a `loop/types/turno.type.ts` si se aplica WR-10.

### IN-15: `MENSAJE_AGENTE` se indexa por la clave literal en lugar de por el código

**File:** `src/loop/services/ejecutar-turno.service.ts:311`, `src/loop/services/presupuesto.service.ts:17`

**Issue:** En el resto del bucle se usa `MENSAJE_AGENTE[codigo]` o `MENSAJE_AGENTE[CODIGO_AGENTE.X]` (líneas 135, 147 y 394). Estas dos líneas usan en cambio `MENSAJE_AGENTE.PRESUPUESTO_AGOTADO`. Esto funciona solo porque la clave y el valor de `CODIGO_AGENTE.PRESUPUESTO_AGOTADO` coinciden. La regla pide pasar siempre por el objeto de códigos.

**Fix:** Usar `MENSAJE_AGENTE[CODIGO_AGENTE.PRESUPUESTO_AGOTADO]`.

### IN-16: Los tipos de la compuerta se reescriben en lugar de componerse

**File:** `src/loop/types/turno.type.ts:25,90-97`, `src/domain/types/compuerta.type.ts:34-39`, `src/domain/policies/compuerta.policy.ts:63,72,96`

**Issue:**
- `EntradaCierreTurno` (loop) repite campo por campo los cuatro de `EntradaCierreCompuerta` (dominio): `arrastrados`, `eventos`, `conocidos` y `abortado`. Solo agrega `turnoId` y `texto`.
- El mapa de paquetes conocidos se escribe de tres formas:
  - `PaquetesConocidos` en el loop;
  - `EntradaCierreCompuerta["conocidos"]` en `compuerta.policy.ts:63,72`;
  - el literal `Readonly<Record<string, CasoPendiente>>` en `compuerta.policy.ts:96`, en el mismo archivo.

**Fix:**
- Declarar `PaquetesConocidos` en `domain/types/compuerta.type.ts` y usarlo en los tres sitios.
- Declarar `EntradaCierreTurno = EntradaCierreCompuerta & { readonly turnoId: string; readonly texto: string }`.

### IN-17: El destino de logs `{ write(linea): void }` está escrito cuatro veces, y el tipo de infra se exporta sin uso

**File:** `src/loop/types/agente.type.ts:13`, `src/infra/types/logger.type.ts:4`, `tests/helpers/types/agente-fetch.type.ts:9`, `tests/helpers/types/bitacora.type.ts:4`

**Issue:** Fuera de su archivo, nadie importa `LogDestination`, y el loop declara su propia forma anónima. Como `loop` no puede importar infra, la forma compartida tiene que vivir en un puerto. Pasa algo parecido con `OpcionesAgente.fuenteEntorno` (`agente.type.ts:9`), que repite a mano `EnvSource` de `env.ts:65`.

**Fix:** Declarar `DestinoBitacora` en `src/application/types/puertos-agente.type.ts`, junto a `BitacoraEstructurada`, e importarlo desde `infra/types/logger.type.ts`, `loop/types/agente.type.ts` y los tipos de los helpers. Con eso se borra `LogDestination`.

### IN-18: Hay constantes nuevas en el ámbito o el idioma equivocados

**File:** `src/config/constants/confirmacion.constants.ts`, `src/config/constants/redaccion.constants.ts`, `src/config/constants/agent.constants.ts:78-83`, `src/config/constants/llm.constants.ts:52`

**Issue:**
- Los ámbitos de constantes de la fase 1 se nombraron en inglés (`errors`, `files`, `forms`, `mapping`, `supports`…, WR-13), y la propia fase 02 agregó `agent`, `llm` y `logging`. Sin embargo, `confirmacion.constants.ts` y `redaccion.constants.ts` quedaron en español.
- Las unidades de tiempo están repartidas en tres ámbitos y con dos estilos de nombre:
  - `MS_POR_MINUTO` en `agent.constants.ts:83`;
  - `MS_POR_SEGUNDO` en `llm.constants.ts:52`;
  - `MILISEGUNDOS_POR_DIA` en `supports.constants.ts:14`.

  La fase 1 unificó un caso igual con `LOCALE_INTL`.
- Los separadores de texto (`SEPARADOR_PARRAFOS`, `SALTO_DE_LINEA`, `SEPARADOR_CELDA_MD` y `SEPARADOR_CELDA_PLANO`, en `agent.constants.ts:78-81`) los consumen `domain/utils/texto-plano.util.ts` y `domain/builders/cierre-turno.builder.ts`, no solo el agente.

**Fix:**
- Renombrar los ámbitos a `confirmation.constants.ts` y `redaction.constants.ts`.
- Mover las unidades de tiempo a `runtime.constants.ts` con un solo estilo (`MS_POR_SEGUNDO`, `MS_POR_MINUTO`, `MS_POR_DIA`).
- Mover los separadores a un ámbito de texto (`text.constants.ts`).

### IN-19: Hay dos listas de claves secretas mantenidas a mano

**File:** `src/config/constants/logging.constants.ts:13-21`, `src/config/constants/redaccion.constants.ts:1-13`

**Issue:** `RUTAS_REDACCION_LOG` (rutas de pino) repite en otra sintaxis las claves de `CLAVES_SENSIBLES`: `apiKey`, `authorization` y `api_key`. Como `logger.adapter.ts:16` pasa todos los campos por `redactar` antes de pino, la lista de pino es una segunda copia que puede divergir: por ejemplo, hoy no incluye `token`, `secret` ni `password`.

**Fix:** Derivar las rutas de pino de la lista única:
```ts
export const RUTAS_REDACCION_LOG = [...CLAVES_SENSIBLES].flatMap((clave) => [clave, `*.${clave}`, `headers.${clave}`, `*.headers.${clave}`]);
```
También se puede documentar en `docs/` que la redacción de pino cubre solo las cabeceras.

### IN-20: Hay funciones con cinco parámetros posicionales y booleanos posicionales

**File:** `src/loop/services/bitacora-turno.service.ts:50-56`, `src/llm/decorators/retry.decorator.ts:32-38`, `src/llm/adapters/openai-compatible.adapter.ts:33-37,44-49`, `src/domain/policies/compuerta.policy.ts:36`

**Issue:**
- `anotarHerramienta(bitacora, llamada, despacho, conocidos, duracionMs)` y `enviarConReintentos(base, reintento, mensajes, herramientas, opciones)` reciben cinco argumentos posicionales.
- `toolPart(slot, definiciones, desactivadas)`, `buildRequest(…, desactivadas)` y `sinAutorizacion(siguiente, preguntarCual)` reciben banderas booleanas posicionales.

La fase 1 resolvió lo mismo con objetos de parámetros (`05c7b1b`, IN-17).

**Fix:**
- Pasar `{ llamada, despacho, conocidos, duracionMs }` como entrada de `anotarHerramienta`.
- En `retry.decorator.ts`, cerrar `base` y `reintento` en el decorador y dejar `enviarConReintentos(mensajes, herramientas, opciones)`.
- Pasar `opciones` completas (`OpcionesEnvio`) en lugar de `desactivadas`.

### IN-21: `docs/estructura.md` no refleja los módulos que agregó la fase 02

**File:** `docs/estructura.md:10,11,13,36,40`

**Issue:** Las tablas de roles enumeran el contenido de cada carpeta, pero omiten lo nuevo:

- `builders/` no menciona `cierre-turno`.
- `policies/` no menciona `compuerta`, `confirmacion` ni `redaccion`.
- `utils/` no menciona `texto-plano`.
- `llm/decorators/` dice "timeout, reintentos y respaldo" y omite `observacion`, que además no es un envoltorio de resiliencia.
- `loop/services/` describe solo `ejecutarTurno` y el registro de herramientas, cuando hay ocho servicios.

La fase 1 trató como hallazgo un documento que citaba mal un archivo (IN-03 de la última revisión de la fase 1).

**Fix:** Actualizar las cinco filas. Para que no vuelva a pasar, conviene describir el rol sin enumerar archivos, o agregar una prueba que compare la enumeración con el contenido de la carpeta.

### IN-22: Las pruebas duplican helpers que ya existen y comparan con literales de familia

**File:** `tests/helpers/agente-prueba.helper.ts:28-38`, `tests/helpers/agente-fetch.helper.ts:10-20`, `tests/loop/sesion.test.ts:64-78`, `tests/loop/trazador-agente.test.ts:124-150`, `tests/live/agente-en-vivo.test.ts:67`, `tests/loop/bitacora.test.ts:28`, `tests/helpers/pii.helper.ts:22`, `tests/helpers/adaptador-guion.helper.ts`, `tests/helpers/llm-falso.helper.ts`

**Issue:**
- `recoger` (que junta los eventos) está copiada cinco veces y `sesionDe` cuatro. Las copias incluyen el texto `"falta turn_start"`, que repite `TIPO_EVENTO.INICIO_TURNO`.
- `bitacora.test.ts:28` redefine `SIMULAR`, que ya exporta `eventos.helper.ts:18`.
- Hay dos LLM falsos con guion, con formas distintas (`crearAdaptadorGuion` y `crearLlmFalso`), y cada uno tiene sus propias constantes de proveedor y modelo.
- `pii.helper.ts:22` compara `POLITICA_PII.get(ruta) === "publico"` en lugar de `TIPO_MASCARA.PUBLICO`. Es lógica del helper, no una aserción de golden, así que la exclusión de G6 para `tests/` no la justifica.

**Fix:**
- Llevar `recoger` y `sesionDe` a `tests/helpers/eventos.helper.ts` e importarlos desde las cinco ubicaciones.
- Importar `SIMULAR` en lugar de redefinirlo.
- Evaluar si `crearAdaptadorGuion` puede construirse sobre `crearLlmFalso`, o documentar por qué los dos existen.
- Usar `TIPO_MASCARA.PUBLICO`.

## Hallazgos abiertos de la revisión anterior (4c30e81)

Siguen abiertos según `02-REVIEW-DISPOSITION.md`. No se cuentan en el frontmatter ni se vuelven a analizar aquí:

- **WR-01:** Un acuse suelto ("ok", "listo", "claro", "correcto", "vale") sigue autorizando el envío.
- **WR-02:** `sinPreguntaFinal` borra texto que no es pregunta, incluidas advertencias de campos `requiere_confirmacion`.
- **WR-03:** Con el presupuesto agotado, la recuperación de WR-02 deja la sesión pidiendo para siempre una confirmación que nunca se cumplirá.
- **WR-04:** Un cierre `FINAL` con la autorización sin usar descarta en silencio la confirmación de la analista.
- **IN-01:** Si el envío autorizado se ejecuta y falla, el caso desaparece de los pendientes.
- **IN-02:** Cuando `guardar` es rechazado, el turno igual anuncia texto y `confirmation_required` como si el estado se hubiera guardado.
- **IN-03:** El cercado depende de que el deadline (temporizador monotónico) venza antes que el lease (reloj de pared), y el cercado solo protege `guardar`.
- **IN-04:** "si" sin tilde se clasifica siempre como afirmación, aunque pueda ser el condicional "si".
- **IN-05:** La instrucción de siguiente paso dice "envía" o "sí" aunque haya varios casos pendientes.

---

_Reviewed: 2026-10-13T22:48:38Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
