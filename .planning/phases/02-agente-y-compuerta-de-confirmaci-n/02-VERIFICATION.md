---
phase: 02-agente-y-compuerta-de-confirmaci-n
verified: 2026-10-14T03:40:00Z
status: human_needed
score: 31/35 must-haves verified
covered_files: [".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-01-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-02-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-03-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-04-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-05-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-06-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-07-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-08-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-09-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-10-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-11-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-12-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-13-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-14-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-15-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-16-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-17-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-18-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-19-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-19-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-20-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-20-SUMMARY.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-21-PLAN.md",".planning/phases/02-agente-y-compuerta-de-confirmaci-n/02-21-SUMMARY.md","agent/prompt.md","src/config/constants/confirmation.constants.ts","src/config/constants/text.constants.ts","src/config/strings.ts","src/domain/policies/compuerta.policy.ts","src/domain/policies/confirmacion.policy.ts","src/domain/types/compuerta.type.ts","src/domain/utils/formatear-issues.util.ts","src/knowledge/registro-proveedor.md","src/loop/services/cierre-turno.service.ts","src/loop/services/despacho-llamada.service.ts","src/loop/services/ejecutar-turno.service.ts","src/loop/services/guardado-turno.service.ts","tests/contract/env-agente.test.ts","tests/contract/instrucciones-agente.test.ts","tests/live/agente-en-vivo.test.ts","tests/loop/compuerta-casos.test.ts","tests/loop/compuerta.test.ts","tests/unit/compuerta.policy.test.ts","tests/unit/formatear-issues.util.test.ts"]
covered_digest: "v3:sha256:626984c589df2704cedca87cdf8828b647838b050f86a36216a62d45ba921cc0"
behavior_unverified: 0
overrides_applied: 0
re_verification:
  previous_status: gaps_found
  previous_score: 25/28
  gaps_closed:
    - "Verdad 27 / CR-01: tras un 'ok', 'listo', 'si por favor', 'si gracias' o 'si ec-corp-andina' sin herramientas, el turno cierra con needsConfirmation=true, un confirmation_required y la pregunta del servidor; el 'sí' siguiente escribe ENVIO-SIMULADO.md una vez (02-19, D-63.6)"
    - "Prohibición de 02-18 (el prompt no le pide al modelo escribir su pregunta ni su pedido de confirmación): prompt.md:50,53,54 reescritos y fijados por instrucciones-agente.test.ts (RETIRADOS_CR01)"
    - "WR-01: los mensajes de arranque con varios issues terminan en un solo punto y sin '.;' (02-20)"
    - "WR-02: un envío autorizado que falla deja el caso pendiente con la pregunta del servidor; la autorización usada no se recupera (02-20, D-63.7)"
    - "Nota 1 de SECURITY: la prueba en vivo revisa la clave también en los cuerpos de los pedidos, con aserciones de no vacuidad (02-21, T-02-63)"
  gaps_remaining: []
  regressions:
    - "(warning, ninguna verdad falla) WR-15: 'No envíes nada todavía, ¿qué falta?' da 'otro'. Antes de D-63.6 eso cancelaba; ahora el servidor agrega '¿Confirmas el envío simulado…?' justo después de la negación, y el 'sí' siguiente envía. Reproducido por el verificador"
    - "(warning, ninguna verdad falla) WR-03 agravado: con el presupuesto de la sesión agotado, cualquier mensaje que no sea una negación ('sí', 'envía', 'hola') vuelve a recibir la pregunta de confirmación, que ya no se puede cumplir. Reproducido por el verificador"
human_verification:
  - test: "Lee las cinco respuestas de la corrida en vivo de 02-21 (A1, A2 'ok', A3 'sí', B1 §11, B2 'envía'), registradas en 02-21-SUMMARY.md con la línea 'VIVO PASS modelo=deepseek-flash llamadas=15 tokens=113249'. Confirma también que diste el 'correr' y que solo se gastó una corrida"
    expected: "A2 es breve y su única pregunta o pedido de confirmación es el del servidor (último párrafo). A3 y B2 informan solo el envío simulado registrado. B1 tiene caso, out/ec-corp-andina/, 13/1/1, RUC por confirmar con su nota, Certificado de cumplimiento tributario y BLOQUEADO. Ningún valor sin máscara ni ninguna afirmación de lleno, enviado o firmado sin un resultado ok (CA2)"
    why_human: "Es una prohibición de nivel judgment y la lectura la hizo el ejecutor (un LLM). El propio ejecutor anotó que A2 incumple en parte: el modelo escribió su propio pedido de confirmación ('dime de forma explícita algo como \"sí, envía co-industrias-delta\"') sin '¿', y ninguna aserción lo detecta. Hay que decidir si se acepta como varianza del modelo (T-02-41) o si se ajusta el prompt con una segunda corrida autorizada"
  - test: "Decide sobre WR-16 (y WR-15): con un caso pendiente, un pedido ajeno que contiene una palabra de NEGACIONES ('para', 'no', 'luego', 'mejor', 'después', 'aún', 'momento', 'nada', 'ni') se clasifica como 'rechaza' y cancela el caso, aunque prompt.md:53 y RN4 digan que sigue pendiente; y una negación seguida de una pregunta da 'otro' y deja el caso pendiente"
    expected: "Una de dos: (a) aceptar la clase amplia de negaciones como límite conocido, con un override en este archivo que lo justifique (falla del lado seguro; IN-01 sigue abierto), o (b) abrir un plan de cierre que acote NEGACIONES y ponga la negación antes que la pregunta, con pruebas de bucle de 'procesa el caso Y para…' y 'No envíes nada todavía, ¿qué falta?'"
    why_human: "La verdad 10 y la prohibición 4 de 02-19 se cumplen a la letra, porque definen el rechazo explícito como la decisión 'rechaza' del clasificador, y el plan dejó esto marcado como [ENV-02, unresolved] fuera de alcance (02-19-PLAN.md:405). Pero el síntoma reproducido es el mismo que la ronda anterior trató como bloqueante en CR-01: el modelo dice que el caso sigue pendiente, el servidor ya lo canceló y el 'sí' de la analista se bloquea con CONFIRMACION_REQUERIDA. Elegir entre aceptarlo y corregirlo es una decisión de producto, y ninguna de las dos opciones permite un envío sin confirmación"
---

# Fase 2: Agente y compuerta de confirmación. Informe de verificación

**Objetivo de la fase:** Un mensaje de chat como "procesa el caso X" recorre el ciclo propio prompt → DeepSeek → herramientas → respuesta, con topes de costo, resiliencia ante fallas del proveedor y una compuerta de confirmación que el servidor hace cumplir. El modelo nunca ve ni afirma valores reales.
**Verificado:** 2026-10-14T03:40:00Z
**Estado:** human_needed
**Re-verificación:** Sí. Viene después de los planes de cierre 02-19, 02-20 y 02-21, que atacaron CR-01, WR-01, WR-02 y la nota 1 de SECURITY.

## Logro del objetivo

Lo verifiqué en el código, con pruebas nombradas y con sondas propias en el scratchpad. No me fié de los SUMMARY.

- **CR-01 (verdad 27): cerrado.**
  - `abrirTurno` (`compuerta.policy.ts:46-57`) solo pasa a LIBRE con `rechaza`.
  - `crearTurno` arrastra `pendientesDe(apertura.siguiente)` (`ejecutar-turno.service.ts:80`).
  - `recuperarAutorizado` devuelve el caso a pendiente en todo cierre salvo el aborto (`compuerta.policy.ts:133-142`, conectado en `guardado-turno.service.ts:25`).
  - El describe "CR-01 (D-63.6)" de `tests/loop/compuerta.test.ts:222-285` sigue el guion que pide el prompt: §11 turno 1, luego cada una de las cinco frases sin herramientas y luego "sí". Comprueba `needsConfirmation=true`, un `confirmation_required` con `bloqueos [BLOQUEO_EC]`, el texto exacto `TEXTO + SEPARADOR + cierreConPregunta("", [PENDIENTE_EC])` y una sola línea ok en `out/log.jsonl`. Lo corrí: `-t "D-63.6"` da 13 pass.
- **Prompt:** `prompt.md:50,53,54` ya no le piden al modelo que pregunte ("no escribas tú ninguna pregunta ni pedido de confirmación"). Lo fija el contrato (`instrucciones-agente.test.ts`, 17 pass).
- **WR-02 / D-63.7: cerrado.**
  - `despacharEnvio` emite `FALLIDO` cuando el resultado es `ok:false` (`despacho-llamada.service.ts:78`).
  - El pliegue reabre el caso por `reabrirConocido` (`compuerta.policy.ts:76-104`).
  - Lo cubren 4 pruebas de bucle y 8 de unidad, y pasan.
- **WR-01: cerrado.** `formatearIssues` quita el punto final de cada issue salvo el último.
  - `env-agente -t WR-01` da 2 pass y `formatear-issues.util.test.ts` da 9 pass.
  - Sonda propia: 50 llamadas concurrentes a `crearAgente` dan un solo mensaje, igual al literal exacto (verdad de nivel backstop).
- **Nota 1 de SECURITY: cerrada.** `agente-en-vivo.test.ts:255-259` arma `salidas` con eventos, logs y `...cuerpos`, y comprueba antes `cuerpos.length > 0` y `claves.length > 0`. El diff no quita ni relaja ninguna aserción: las líneas borradas son renombres de `respuestaA` a `respuestaA1` y la expectativa de B2, que pasó a `[CO, EC]` con 2 líneas, como pedía el plan.
- **Barreras:**
  - `bun run check` sale con exit 0: tsc, Biome (281 archivos) y `bun audit` sin vulnerabilidades.
  - `bun test` (una sola vez) da 1199 pass, 1 skip (la prueba en vivo opcional) y 0 fail en 72 archivos.

Los cinco criterios del ROADMAP se siguen cumpliendo. Ninguna de las advertencias nuevas (WR-15 a WR-18) permite un envío sin una confirmación explícita en el mensaje inmediatamente siguiente a una pregunta del servidor. Lo comprobé en el código: la única fuente de autorización es `abrirTurno` con `confirma` de un caso pendiente, que `evaluarEnvio` consume una sola vez. También lo comprobé con sondas.

Queda **una decisión que necesita a una persona (WR-16)**. Se trata del mismo síntoma que CR-01, en otra familia de frases. Lo explico abajo.

### Verdades observables

| # | Verdad | Estado | Evidencia |
|---|--------|--------|-----------|
| 1 | **ROADMAP C1**: ciclo propio, `deepseek-flash` con thinking desactivado y solo rutas y valores enmascarados hacia el modelo | ✓ VERIFIED | Regresión: suite verde (`trazador-agente`, `pii-modelo`, `inyeccion`). La conducta con el modelo real va al punto humano 1 |
| 2 | **ROADMAP C2**: "No envíes nada todavía" nunca autoriza; en el guion §11 la confirmación explícita siguiente escribe `ENVIO-SIMULADO.md` una vez y solo para ese caso; el `confirmado: true` del modelo no basta | ✓ VERIFIED | `compuerta.test.ts:129-220` pasa. Sonda: "No envíes nada todavía" y "No envíes nada todavía." dan `rechaza`. Con WR-15, la frase con pregunta tampoco autoriza en ese turno (ver advertencias) |
| 3 | **ROADMAP C3**: reintentos, respaldo, mensajes en español (402) y CA5 | ✓ VERIFIED | Regresión: `resiliencia` y `fallback` dentro de la suite verde |
| 4 | **ROADMAP C4**: topes de iteraciones y de tokens con respuesta clara; la inyección no cambia la conducta | ✓ VERIFIED | Regresión verde. Sonda WR-03: el tope de tokens sigue respondiendo "Esta sesión agotó su presupuesto de tokens. Abre una sesión nueva para continuar.", que es claro y no es un error (ver WR-03 agravado) |
| 5 | **ROADMAP C5**: prompt y conocimiento editables en caliente; logs JSON correlacionados sin clave ni PII; `bun test` cubre el ciclo con un LLM falso | ✓ VERIFIED | 02-19 y 02-20 cambiaron la conducta del modelo solo con texto (`d585b53`, `de1d0ab`). `instrucciones-agente` da 17 pass y la suite está verde |
| 6–20, 22 | Verdades de los planes 02-01 a 02-14 | ✓ VERIFIED | Regresión: suite completa en verde. Los fallos de `verify.artifacts` y `verify.key-links` en 02-01, 02-02, 02-03, 02-05, 02-10, 02-11, 02-13 y 02-14 son los mismos renombres y divisiones de REVIEW-FIX de la ronda anterior. Volví a comprobar los símbolos en su sitio nuevo: `llm.enviar(` en `tope-iteraciones.service.ts:18`, `createMemorySessionStore<Sesion>(` en `agente.wiring.ts:109`, `ARGUMENTOS_VACIOS` en `paso-herramientas.service.ts:32`, `recuperarAutorizado(` en `guardado-turno.service.ts:25` y `cierreConPregunta` en `cierre-turno.builder.ts:48` |
| 21 | 02-13: `test:vivo` pasa contra el proveedor real | ? UNCERTAIN | La reemplaza la corrida de 02-21 (verdad 35). No la reproduje, para no gastar la clave personal. Va al punto humano 1 |
| 23 | **02-15 / G-02-3**: un caso enviado no se reabre | ✓ VERIFIED | Regresión: `compuerta-casos` en verde. `reabrirConocido` ignora los casos de `enviados` (`compuerta.policy.ts:82`), también ante `FALLIDO` |
| 24 | **02-16 / G-02-18**: tabla del clasificador | ✓ VERIFIED | `confirmacion.policy.ts` no cambió en esta ronda y su prueba unitaria está en verde |
| 25 | **02-17 / G-02-19**: un solo punto final, sin "sesión abierta" | ✓ VERIFIED | El aviso WR-01 de la ronda anterior queda cerrado por 02-20 (verdad 33) |
| 26 | **02-18 / G-02-21**: pregunta de cierre del servidor y turno de confirmación breve | ✓ VERIFIED | `prompt.md:30,33,48,55`. El contrato da 17 pass |
| 27 | **Flujo de re-pregunta (CR-01)**: ante un "ok" el servidor vuelve a preguntar con `needsConfirmation` y los bloqueos, y la confirmación explícita siguiente escribe `ENVIO-SIMULADO.md` una vez | ✓ VERIFIED | `compuerta.test.ts:222-257` sigue el guion exacto del prompt (el modelo no llama herramientas en el turno 2) para "ok", "listo", "si por favor", "si gracias" y "si ec-corp-andina": T2 da `FINAL`, `needsConfirmation=true`, un `confirmation_required` y el texto exacto; T3 "sí" da ok y `[EC]` con una línea ok. Las dos no confirmaciones seguidas (`:259-285`) también pasan |
| 28 | **02-18 verdad 6**: lectura de la corrida en vivo | ? UNCERTAIN | La reemplaza la verdad 35. Va al punto humano 1 |
| 29 | **02-19 (verdades 3, 5-9, 11 y 12)**: `abrirTurno` según D-63.6; dos no confirmaciones vuelven a preguntar; un aborto durante un "ok" cierra LIBRE; "no envíes nada" con el modelo obediente cancela; un `simular_envio` desobediente tras una frase dudosa queda bloqueado y vuelve a preguntar; un turno de confirmación sin envío reabre el caso sin recuperar la autorización; D-38, D-63.4 y la regla del aborto no cambian | ✓ VERIFIED | `compuerta.policy.test.ts` da 63 pass. `compuerta.test.ts -t D-63.6` da 13 pass. `compuerta-casos.test.ts -t D-63` da 17 pass, entre ellas `:613` (el turno de confirmación sin envío, luego "ok" y luego "sí") y `:705` (el aborto durante un "ok"). Lo confirma el código de `abrirTurno` y `recuperarAutorizado` |
| 30 | **02-19 verdad 4**: un pedido ajeno se atiende y no secuestra la confirmación ("procesa el caso co-industrias-delta" deja los dos casos pendientes) | ✓ VERIFIED (⚠️ WR-16) | `compuerta-casos.test.ts:664-703` da 5 turnos en verde. Sonda: "procesa el caso co-industrias-delta" da `otro`. Con otra redacción la verdad deja de cumplirse (verdad 31) |
| 31 | **02-19 verdad 10 y prohibición 4**: fuera del envío, un caso pendiente sale de la compuerta solo por un rechazo explícito, un aborto o el fin de la sesión, y por ningún otro camino | ? UNCERTAIN (se escala a la usuaria) | A la letra se cumple, porque el plan define el rechazo explícito como "rechaza, or the button". Sonda propia de punta a punta: con ec pendiente, T2 "Consulta el valor del NIT de co-industrias-delta para tenerlo a mano" da `rechaza` por "para"; el turno cierra con `needsConfirmation=false` y 0 `confirmation_required`, mientras el modelo, siguiendo `prompt.md:53`, dice que ec sigue pendiente; T3 "sí" da `CONFIRMACION_REQUERIDA`, `enviados=[]`, y el servidor recién entonces vuelve a preguntar. Es el síntoma de CR-01 en otra familia de frases. El plan lo dejó marcado como `[ENV-02, unresolved]` y fuera de alcance (`02-19-PLAN.md:405`). Ver el punto humano 2 |
| 32 | **02-20 / D-63.7 (verdades 1-6 y 10)**: un envío autorizado que falla (PAQUETE_NO_ARMADO, PAQUETE_DESACTUALIZADO con re-armado, ERROR_INTERNO más un error del proveedor, dos fallos seguidos) deja el caso pendiente con la pregunta del servidor, sin escribir nada y con `casosEnviados=[]`; un aborto cierra LIBRE; un FALLIDO nunca reabre un caso enviado; el conocimiento dice que no se reintenta | ✓ VERIFIED | `compuerta-casos.test.ts:768-880` da 4 pass, y las 8 filas unitarias de `FALLIDO` están en verde. `registro-proveedor.md` (ERROR_INTERNO) está fijado por el contrato. Artefactos 8/8 y enlaces 3/3 |
| 33 | **02-20 / WR-01 (verdades 7-9)**: los literales exactos con varios issues tienen un solo punto final y ningún punto antes de "; "; los literales de un solo issue no cambian; con el mismo entorno, llamadas concurrentes dan el mismo mensaje | ✓ VERIFIED | `env-agente -t WR-01` da 2 pass y `formatear-issues` da 9 pass. Para la verdad de nivel backstop observé la conducta directamente: 50 llamadas concurrentes a `crearAgente` dan un solo mensaje, igual al literal de la verdad 7 |
| 34 | **02-21 verdades 1, 3 y 4**: la prueba en vivo revisa la clave en cuerpos, eventos y logs sin poder pasar en vacío; la sesión B espera `[CO, EC]` y 2 líneas; sin `LLM_EN_VIVO` queda omitida | ✓ VERIFIED | `agente-en-vivo.test.ts:141-144,222-223,255-259`. `bun test tests/live/agente-en-vivo.test.ts` da 0 pass, 1 skip y 0 fail |
| 35 | **02-21 verdades 2, 5 y 6**: corrida en vivo autorizada ("correr") con A2 "ok", que sigue pendiente con la pregunta del servidor, y A3 "sí", que envía una vez; una línea VIVO PASS nueva; lectura humana de las cinco respuestas | ? UNCERTAIN | 02-21-SUMMARY registra `VIVO PASS modelo=deepseek-flash llamadas=15 tokens=113249`. No la reproduje (costo). Las aserciones del lado del servidor de A2 y A3 están en el código (`:178-201`). El ejecutor anota que A2 trae un pedido de confirmación escrito por el modelo. Va al punto humano 1 |

**Puntaje:** 31 de 35 verdades verificadas. 4 son inciertas y van a la persona: las verdades 21, 28 y 35, que forman una sola lectura en vivo, y la verdad 31, que es la decisión sobre WR-16. No hay verdades presentes con comportamiento sin verificar.

### Elementos diferidos

Ninguno. Revisé la Fase 3: su criterio 3 pide la tarjeta con Confirmar y Cancelar, pero no define el rechazo por caso (WR-17) ni toca el clasificador (WR-15 y WR-16). No hay evidencia específica para diferir nada.

### Advisory (alcance nuevo, sin evidencia)

Ninguno. Los hallazgos nuevos que reproduje (WR-15, WR-16, WR-03 agravado e IN-23) tienen evidencia determinista, porque mis sondas son reproducibles. Los clasifiqué como advertencias, no como bloqueantes, porque ninguno contradice un criterio del ROADMAP ni una verdad tal como está escrita. La única verdad en tensión (la 31) se escala como decisión humana.

### Artefactos requeridos (planes 02-19 a 02-21)

| Artefacto | Esperado | Estado | Detalles |
|-----------|----------|--------|----------|
| `src/domain/policies/compuerta.policy.ts` | `abrirTurno` D-63.6, `recuperarAutorizado` con la guarda del aborto y `reabrirConocido` para BLOQUEADO y FALLIDO | ✓ VERIFIED | Conectado desde `ejecutar-turno.service.ts:71,80` y `guardado-turno.service.ts:25,48` |
| `src/loop/services/ejecutar-turno.service.ts` | `arrastrados: pendientesDe(apertura.siguiente)` | ✓ VERIFIED | Línea 80. `arrastradosDe` ya no existe |
| `src/domain/types/compuerta.type.ts` | `AperturaTurno {autorizado, siguiente}` y un `EventoCompuerta` con FALLIDO | ✓ VERIFIED | |
| `src/config/constants/confirmation.constants.ts` | `EVENTO_COMPUERTA.FALLIDO` | ✓ VERIFIED | `NEGACIONES` (líneas 63-89) es la raíz de WR-16 |
| `src/loop/services/despacho-llamada.service.ts` | ENVIADO o FALLIDO según `resultado.ok` | ✓ VERIFIED | Línea 78 |
| `src/domain/utils/formatear-issues.util.ts` y `src/config/constants/text.constants.ts` | Unión que conoce el punto final; `FIN_DE_ORACION` y `SEPARADOR_ISSUES` compartidos | ✓ VERIFIED | `strings.ts` importa `FIN_DE_ORACION` |
| `agent/prompt.md` | Re-pregunta del servidor; el modelo nunca pide la confirmación | ✓ VERIFIED (⚠️ WR-16) | Líneas 50, 53 y 54. La línea 53 promete "sigue pendiente", y el servidor no lo cumple cuando el pedido trae una palabra de `NEGACIONES` |
| `src/knowledge/registro-proveedor.md` | RN4, "Varios casos" y la línea de ERROR_INTERNO para un envío que falla | ✓ VERIFIED (⚠️ WR-15, WR-18) | RN4 dice que la negación cancela, pero la negación con pregunta no cancela. Las líneas de PAQUETE_NO_ARMADO y PAQUETE_DESACTUALIZADO dicen "La confirmación anterior ya no vale" y el servidor vuelve a ofrecer el envío del paquete viejo |
| Pruebas: `compuerta`, `compuerta-casos`, `compuerta.policy`, `formatear-issues`, `env-agente`, `instrucciones-agente` y `agente-en-vivo` | Fijan las verdades | ✓ VERIFIED | Ninguna prueba cubre un pedido ajeno con "para", "no" o "luego", ni una negación con pregunta |

`verify.artifacts` da 7/7 para 02-19, 8/8 para 02-20 y 1/1 para 02-21.

### Verificación de enlaces clave

| De | A | Vía | Estado | Detalles |
|----|---|-----|--------|----------|
| ejecutar-turno.service | compuerta.policy | `pendientesDe(` | WIRED | |
| cierre-turno.service | cierre-turno.builder | `cierreConPregunta(` | WIRED | Ahora también después de un turno `otro` |
| instructions-loader | agent/prompt.md | `ARCHIVO_PROMPT` | WIRED | |
| despacho-llamada.service | compuerta.policy | `EVENTO_COMPUERTA.FALLIDO` | WIRED | |
| agente.wiring | formatear-issues.util | `formatearIssues(` | WIRED | |
| strings | text.constants | `FIN_DE_ORACION` | WIRED | |
| agente-en-vivo.test | agente.wiring | `fetchGrabador` | WIRED | |
| agente-en-vivo.test | cierre-turno.builder | `cierreConPregunta(` | WIRED | |

`verify.key-links` da 3/3 para 02-19, 3/3 para 02-20 y 2/2 para 02-21.

### Traza de datos (nivel 4)

| Artefacto | Dato | Fuente | Datos reales | Estado |
|-----------|------|--------|--------------|--------|
| `needsConfirmation` y `confirmation_required` tras un "otro" | Estado de la compuerta | `abrirTurno` → `siguiente` → `arrastrados` → `cerrarTurno` → `pendientesDe` | Sí | ✓ FLOWING (CR-01 cerrado) |
| Caso reabierto tras un FALLIDO | `CasoPendiente` | `paquetesConocidos` de la sesión (último armado ok) | Sí, pero puede estar desactualizado después de PAQUETE_NO_ARMADO o DESACTUALIZADO | ⚠️ WR-18 |
| Mensaje de arranque con varios issues | `TEXTO_AGENTE.conDetalle(…, formatearIssues(...))` | Issues de zod | Sí | ✓ FLOWING |

### Comprobaciones de comportamiento

| Comportamiento | Comando | Resultado | Estado |
|----------------|---------|-----------|--------|
| Tipos, lint y auditoría | `bun run check` | exit 0; Biome revisó 281 archivos; 0 vulnerabilidades | ✓ PASS |
| Suite completa (una sola vez) | `bun test` | 1199 pass, 1 skip, 0 fail, 5372 expect, 72 archivos | ✓ PASS |
| CR-01 / D-63.6 en el bucle | `bun test tests/loop/compuerta.test.ts -t "D-63.6"` | 13 pass | ✓ PASS |
| D-63.6 y D-63.7 con varios casos | `bun test tests/loop/compuerta-casos.test.ts -t "D-63"` | 17 pass | ✓ PASS |
| Política de la compuerta | `bun test tests/unit/compuerta.policy.test.ts` | 63 pass | ✓ PASS |
| WR-01 | `bun test tests/contract/env-agente.test.ts -t "WR-01"` y `tests/unit/formatear-issues.util.test.ts` | 2 pass y 9 pass | ✓ PASS |
| Contrato del prompt y del conocimiento | `bun test tests/contract/instrucciones-agente.test.ts` | 17 pass | ✓ PASS |
| Prueba en vivo sin la bandera | `bun test tests/live/agente-en-vivo.test.ts` | 1 skip, 0 fail | ✓ PASS |
| Sonda de concurrencia de WR-01 (scratchpad) | 50 llamadas a `crearAgente` con `Promise.all` y el mismo entorno | Un solo mensaje, igual al literal | ✓ PASS |
| Sonda del clasificador (scratchpad) | `clasificarConfirmacion` con ec pendiente | "procesa el caso co-industrias-delta" da `otro`; "…para tenerlo listo", "…luego vemos el otro", "dame el NIT…, no el RUC", "mejor procesa pe-andes" y "envía el paquete de ec-corp-andina para firma" dan `rechaza`; "No envíes nada todavía, ¿qué falta?" da `otro` | ⚠️ WR-15 y WR-16 reproducidos |
| Sonda WR-16 de punta a punta (scratchpad) | §11 T1, luego "Consulta el valor del NIT de co-industrias-delta para tenerlo a mano", luego "sí" | T2 da `needsConfirmation=false` y 0 confirmaciones; T3 da `CONFIRMACION_REQUERIDA` y `enviados=[]`, y vuelve a preguntar | ⚠️ (punto humano 2) |
| Sonda WR-15 de punta a punta (scratchpad) | §11 T1, luego "No envíes nada todavía, ¿qué falta?" (el modelo dice "queda cancelada"), luego "sí" | T2 da `needsConfirmation=true` con la pregunta del servidor después de "queda cancelada"; T3 envía ec una vez | ⚠️ Warning |
| Sonda IN-23 (scratchpad) | §11 T1, luego "No envíes nada todavía" con un modelo que llama `simular_envio` | Bloqueado, `CONFIRMACION_REQUERIDA`, 0 envíos; el caso se reabre y el servidor vuelve a preguntar | ℹ️ Info (nunca envía) |
| Sonda WR-03 (scratchpad) | Presupuesto de 1000 agotado al armar ec; luego "sí", "envía" y "hola" | Cada uno da `tope_tokens`, `needsConfirmation=true` y la pregunta de confirmación, con `enviados=[]` | ⚠️ Warning (agravado) |
| Sonda WR-17 (scratchpad) | `abrirTurno` con dos pendientes y `RECHAZA` | `{autorizado:null, siguiente: LIBRE}` | ⚠️ Warning (coincide con 02-19 verdad 3) |

Las sondas viven solo en el scratchpad. `git status` no muestra cambios fuera de `.planning/`.

### Ejecución de probes

No aplica: la fase no declara probes `scripts/*/tests/probe-*.sh` y el repositorio no tiene ninguno.

### Cobertura de requisitos

| Requisito | Planes | Descripción (resumen) | Estado | Evidencia |
|-----------|--------|----------------------|--------|-----------|
| SOLI-03 | 02-06 | El cuerpo no llega al modelo; fixture inyectado | ✓ SATISFIED | `inyeccion.test.ts` en verde. REQUIREMENTS.md:22,185 lo sigue marcando "Pending" (ℹ️ trazabilidad) |
| ENV-02 | 02-03, 02-06, 02-10, 02-13 a 02-16, 02-18 a 02-21 | El servidor hace cumplir la compuerta; una vez, ese caso y el mensaje siguiente; clasificador con negaciones | ✓ SATISFIED (⚠️ WR-15, WR-16) | Verdades 2, 27, 29 y 32. El clasificador reconoce las negaciones de más (WR-16) y, si el mensaje trae una pregunta, deja pasar la negación (WR-15). Las dos cosas fallan del lado seguro |
| ENV-03 | 02-03, 02-06, 02-10, 02-13 a 02-16, 02-18 a 02-21 | Si una acción requiere confirmación, el turno termina con una pregunta que lista los bloqueos; el servidor calcula `needsConfirmation` | ✓ SATISFIED | Verdad 27: el bloqueo de la ronda anterior quedó cerrado |
| AGT-01 | 02-01, 02-07 | Ciclo propio y tope de 25 | ✓ SATISFIED | Regresión |
| AGT-02 | 02-01, 02-02, 02-09, 02-18, 02-19 | Prompt y conocimiento separados y editables | ✓ SATISFIED | Verdades 5 y 26 |
| AGT-03 | 02-09, 02-18, 02-19, 02-21 | El prompt prohíbe afirmar sin herramienta | ✓ SATISFIED (la conducta va al punto humano 1) | `prompt.md:13-17,58` |
| AGT-04 | 02-02, 02-06, 02-08, 02-11 a 02-13, 02-15, 02-19, 02-20 | Sesiones; historial íntegro; CA5 | ✓ SATISFIED | `historialSano` en cada prueba de bucle nueva |
| AGT-05 | 02-04, 02-08, 02-17, 02-20 | Errores en español desde un catálogo | ✓ SATISFIED | Verdad 33 |
| LLM-01 | 02-01, 02-02, 02-09 | Puerto propio y adaptador genérico | ✓ SATISFIED | Regresión |
| LLM-02 | 02-01, 02-04, 02-09, 02-17, 02-20 | fetch directo, preset DeepSeek y thinking desactivado | ✓ SATISFIED | Regresión y verdad 33 |
| LLM-03 | 02-04, 02-08 | Timeout, backoff y 402 | ✓ SATISFIED | Regresión |
| LLM-04 | 02-01, 02-04, 02-08, 02-09 | Respaldo | ✓ SATISFIED | Regresión |
| LLM-05 | 02-07 | Topes configurables con mensaje claro | ✓ SATISFIED (⚠️ WR-03) | El mensaje es claro, pero la pregunta de confirmación se repite en una sesión agotada |
| SEG-03 | 02-05, 02-08, 02-15, 02-21 | Logs JSON sin clave ni PII | ✓ SATISFIED | Verdad 34 y regresión |
| DEMO-03 | todos | Tests con un LLM falso | ✓ SATISFIED | Ya existe la prueba del guion que pide el prompt ("ok" sin herramientas y luego "sí") |

Requisitos huérfanos: ninguno. Los 15 IDs de la fase en REQUIREMENTS.md coinciden con la unión de los `requirements:` de los 21 planes. REQUIREMENTS.md:203-236 todavía dice "Gaps Found". Lo actualiza el orquestador.

### Antipatrones y hallazgos

| Archivo | Línea | Patrón | Severidad | Impacto |
|---------|-------|--------|-----------|---------|
| `src/config/constants/confirmation.constants.ts`, `src/domain/policies/confirmacion.policy.ts`, `agent/prompt.md` | 63-89 / 86 / 53 | **WR-16**: un pedido ajeno con "para", "no", "luego", "mejor", "después", "aún" o "momento" da `rechaza` y cancela el caso pendiente; el prompt le hace decir al modelo que sigue pendiente | ⚠️ Warning, se escala (punto humano 2) | Reproducido de punta a punta. La analista tiene que confirmar dos veces, igual que en CR-01. Nunca hay envío sin confirmación. El plan 02-19 lo dejó marcado como no resuelto (IN-01) |
| `src/domain/policies/confirmacion.policy.ts` | 84-86 | **WR-15**: la pregunta se evalúa antes que la negación, así que "No envíes nada todavía, ¿qué falta?" da `otro` y el servidor pide confirmar justo después de la negación | ⚠️ Warning (regresión de conducta con D-63.6) | Reproducido. El "sí" siguiente envía, pero responde a una pregunta explícita del servidor, así que el criterio 2 se cumple. Contradice RN4 del conocimiento. Entra en la misma decisión que WR-16 |
| `src/loop/services/conversacion-turno.service.ts` (tope de tokens) y `compuerta.policy.ts` | — | **WR-03 agravado**: con la sesión agotada, todo mensaje que no sea una negación vuelve a recibir "¿Confirmas…?" y un "sí" no puede enviar | ⚠️ Warning | Reproducido. El primer párrafo dice "Abre una sesión nueva para continuar.", así que el criterio 4 se cumple. La pregunta promete algo que no se puede cumplir |
| `src/loop/services/ejecutar-turno.service.ts` | 57-59 | **WR-17**: el botón con `aprobada:false` y un caso cancela todos los pendientes | ⚠️ Warning | Coincide con la verdad 3 de 02-19, que lo especifica así. Importa para la tarjeta de la Fase 3 |
| `src/loop/services/despacho-llamada.service.ts`, `src/config/strings.ts` | 78 / 226-229 | **WR-18**: después de PAQUETE_NO_ARMADO o DESACTUALIZADO el servidor vuelve a ofrecer el paquete viejo ("queda BLOQUEADO/LISTO…") | ⚠️ Warning | Lo decidió la usuaria en D-63.7, que enumera esos dos códigos. `simularEnvio` vuelve a validar el paquete, así que nada viejo se envía. Es un texto de estado desactualizado y un posible bucle |
| `src/domain/policies/compuerta.policy.ts` | 76-104 | IN-23: un `simular_envio` desobediente en el turno de un rechazo reabre el caso | ℹ️ Info | Reproducido. Nunca envía |
| `src/loop/services/despacho-llamada.service.ts` | 78 | IN-27: un fallo después de escribir `ENVIO-SIMULADO.md` emitiría FALLIDO y permitiría un segundo envío con otra confirmación | ℹ️ Info | Ventana estrecha. No lo reproduje porque exige inyectar fallas. Siempre hace falta una confirmación explícita |
| `tests/contract/instrucciones-agente.test.ts`, `tests/loop/compuerta-casos.test.ts` | — | IN-25 e IN-26: aserciones débiles (fragmentos cortos; prueba de PAQUETE_DESACTUALIZADO sin bloqueos distintos) | ℹ️ Info | No afectan al producto |
| `.planning/REQUIREMENTS.md` | 22, 185 | SOLI-03 sigue "Pending" | ℹ️ Info | Trazabilidad |

No hay marcadores TBD, FIXME, XXX, TODO, HACK ni PLACEHOLDER en `src/`, `agent/` ni `tests/` (el único resultado, `METODO_POST`, es un falso positivo). `tests/sin-comentarios.test.ts` pasa y `reto-01/` no tiene diferencias.

**¿Alguna advertencia nueva anula un criterio del objetivo?** Las juzgué contra la frase "ninguna acción externa sin confirmación explícita" y contra los must-haves escritos:

- **Seguridad.** WR-15, WR-16, WR-17, WR-18, WR-03, IN-23 e IN-27 fallan todas del lado seguro. La autorización nace solo de `confirma` sobre un caso pendiente en el mensaje siguiente a la pregunta del servidor, y se consume una vez. Ninguna rompe los criterios 2 o 4 del ROADMAP.
- **Must-haves.**
  - WR-17 y WR-18 coinciden con lo que especificaron 02-19 (verdad 3) y D-63.7. Son propuestas de diseño, no incumplimientos.
  - WR-15 contradice el espíritu de RN4 y de la verdad 7 de 02-19, pero no su letra ("no envíes nada" cancela).
  - WR-16 es el caso límite. Reproduce el mismo costo que hizo bloqueante a CR-01: la analista confirma dos veces y el modelo afirma un estado que el servidor no tiene. A la letra, la verdad 31 se cumple por la definición del plan, y el plan lo marcó como no resuelto.
- **Escalada.** Por eso no lo marco FAILED, pero tampoco lo absorbo en un `passed`. Queda como decisión de producto (punto humano 2). Si la usuaria no acepta el límite, se convierte en brecha y hay que abrir un plan de cierre que acote el clasificador.

### Prohibiciones

| Prohibición | Plan | Nivel | Disposición |
|-------------|------|-------|-------------|
| No dejar que una respuesta que ni confirma ni rechaza autorice un envío, ni que una confirmación a secas envíe un caso arrastrado cuando la pregunta nombra varios | 02-19 | test | Cumplida: la red de seguridad (`compuerta.test.ts:287-319`) y `compuerta-casos.test.ts:159` (falta_caso) |
| No indicarle al modelo que escriba su propia pregunta o pedido de confirmación | 02-19 | test | Cumplida: `prompt.md:50,53,54` y `instrucciones-agente` (RETIRADOS_CR01). Que el modelo lo haga por su cuenta (A2 en vivo) va al punto humano 1 |
| No bloquear ni secuestrar el trabajo que pide la analista con un caso pendiente | 02-19 | test | Cumplida: `compuerta-casos.test.ts:664-703` |
| No dejar que un caso pendiente salga de la compuerta sin envío salvo por un rechazo explícito, un aborto o el fin de la sesión | 02-19 | test | **Marcada.** La letra se cumple con las pruebas actuales. Hay un contraejemplo semántico reproducido (WR-16): un pedido ajeno con "para" lo saca. Va al punto humano 2 |
| No volver a otorgar ni reutilizar una autorización después de un envío autorizado que falla | 02-20 | test | Cumplida: las pruebas D-63.7, "dos envíos que fallan seguidos" y el `evaluacion.siguiente` usado |
| No sacar en silencio de la compuerta un caso cuyo envío autorizado falló; solo el aborto lo cierra LIBRE | 02-20 | test | Cumplida: las 4 pruebas de bucle y las filas de `cerrarTurno` con aborto |
| No relajar aserciones para obtener VIVO PASS, no gastar la corrida sin el visto bueno y no hacer una segunda corrida sin un visto bueno nuevo | 02-21 | judgment | **unverified-prohibition: se recomienda revisión humana.** Veredicto no autoritativo: el diff de `agente-en-vivo.test.ts` no quita ninguna aserción (solo renombres y la expectativa de B2 que pidió el plan), y 02-21-SUMMARY registra una sola corrida |
| No imprimir la clave, no nombrar el archivo de secretos en un comando y no guardar la salida de la corrida en el repo | 02-21 | judgment | **unverified-prohibition: se recomienda revisión humana.** Veredicto no autoritativo: `git status` limpio fuera de `.planning/`, y ninguna cadena con forma de clave en los artefactos de la fase, salvo el ejemplo sintético de 02-05-PLAN |
| No presentar valores como llenos, enviados o firmados sin una herramienta | 02-09 | judgment | **unverified-prohibition: se recomienda revisión humana** (punto humano 1) |

### Verificación humana requerida

1. **Lectura de las cinco respuestas de la corrida en vivo de 02-21 (verdades 21, 28 y 35, CA2).**
   - **Prueba:** lee A1, A2 ("ok"), A3 ("sí"), B1 (§11) y B2 ("envía") en 02-21-SUMMARY.md (`VIVO PASS modelo=deepseek-flash llamadas=15 tokens=113249`). Confirma también que diste el "correr" y que solo se hizo una corrida.
   - **Esperado:**
     - A2 es breve, y su única pregunta o pedido de confirmación es el del servidor.
     - A3 y B2 informan solo el envío simulado.
     - B1 trae caso, ruta, 13/1/1, la nota del RUC, el soporte ausente y BLOQUEADO.
     - Ningún valor aparece sin máscara, y nada se da por hecho sin una herramienta que lo respalde.
   - **Por qué humana:** es una prohibición de nivel judgment leída por un LLM. El ejecutor ya observó que A2 escribió su propio pedido de confirmación ("dime de forma explícita algo como …") sin "¿". Hay que decidir si se acepta como varianza del modelo (T-02-41) o si se ajusta el prompt con una segunda corrida autorizada.
2. **Decisión de producto sobre WR-16 (y WR-15): precisión del clasificador bajo D-63.6.**
   - **Prueba:** revisa la sonda de este informe. Con ec pendiente, "Consulta el valor del NIT de co-industrias-delta para tenerlo a mano" cancela ec, el modelo dice que sigue pendiente y el "sí" siguiente da `CONFIRMACION_REQUERIDA`. Además, "No envíes nada todavía, ¿qué falta?" deja ec pendiente y el servidor pide confirmar.
   - **Esperado:** elegir una de dos.
     - **(a) Aceptarlo como límite conocido.** Se agrega este override al frontmatter y se vuelve a verificar:
       ```yaml
       overrides:
         - must_have: "Besides a send, a pending case leaves the gate only through an explicit rejection, a caller abort or the end of the session"
           reason: "La clase amplia de NEGACIONES (IN-01/WR-16) puede cancelar un caso con un pedido ajeno; falla del lado seguro, nunca envía sin confirmación y se corrige en una fase posterior"
           accepted_by: "{tu nombre}"
           accepted_at: "{ISO timestamp}"
       ```
     - **(b) Corregirlo ahora.** Se abre un plan de cierre que acote `NEGACIONES` (que una negación cancele solo junto a un verbo de envío o a "nada/todavía/espera/cancela") y que evalúe la negación antes que la pregunta. Lleva pruebas de bucle para los dos guiones y se registra en D-63.5 y D-63.6.
   - **Por qué humana:** la verdad 31 se cumple a la letra pero no en su intención. El plan lo dejó fuera de alcance, y en la ronda anterior este mismo síntoma se trató como bloqueante (CR-01). Es una decisión de producto con reversibilidad "costly" sobre D-37, D-39 y D-63.6.

### Resumen de brechas

No quedan brechas bloqueantes:

- **CR-01:** la verdad 27, el único bloqueante de la ronda anterior, está cerrada con una prueba que sigue el guion exacto que pide el prompt.
- **WR-01 y WR-02:** cerradas, con pruebas de unidad y de bucle.
- **Nota 1 de SECURITY:** cerrada, sin aserciones relajadas.
- **Regresiones:** no hay regresiones en lo verificado antes, y las barreras pasan (`bun run check` en verde; 1199 pass, 1 skip y 0 fail).

El estado es `human_needed` por dos motivos:

1. La evidencia en vivo y la lectura de las respuestas (CA2) son de nivel judgment. La hizo el ejecutor, y él mismo dejó una observación abierta sobre A2.
2. WR-16 reproduce el costo de CR-01 en otra familia de frases. El plan lo dejó conscientemente fuera de alcance, así que hay que aceptarlo con un override o corregirlo con un plan de cierre.

Las demás advertencias de la revisión (WR-15, WR-17, WR-18 y WR-03 agravado) fallan del lado seguro y no anulan ningún criterio del objetivo. Conviene resolver WR-15 junto con WR-16, porque las dos están en el mismo clasificador y se arreglan en pocas líneas.

---

_Verificado: 2026-10-14T03:40:00Z_
_Verificador: Claude (gsd-verifier)_
