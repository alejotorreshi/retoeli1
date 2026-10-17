---
milestone: v1
audited: 2026-10-17T00:20:00Z
status: tech_debt
scores:
  requirements: 79/79
  phases: 5/5
  integration: 7/7
  flows: 6/6
gaps:
  requirements: []
  integration: []
  flows: []
tech_debt:
  - phase: 01-n-cleo-determinista
    items:
      - "SEG-02 bookkeeping estaba atrasado (Partial / [ ] en REQUIREMENTS.md aunque redactar() ya cubría API y SSE desde la Fase 3); corregido en esta auditoría"
  - phase: 03-chat-web-api-sse-y-despliegue
    items:
      - "Override aceptado: D-77 / D-77.1, desalojo del limitador de acceso bajo saturación de 10 000 IP (aceptado para el demo)"
      - "Override aceptado: D-77 / D-73.2 / D-77.2, cota K × L intentos por ventana con conexiones retenidas más de 15 min"
      - "Override aceptado: D-76.2, texto del truncado tras un envío confirmado que falló"
      - "Diferido (deferred-items 03-23): el auto-scroll a veces deja de seguir el final tras un turno largo en chrome-headless-shell; mitigado por quick-261015-t5l y por 05-10"
      - "Sin prueba PII a nivel del cable SSE: tests/http/chat.test.ts solo busca la clave en los frames; la cobertura PII está a nivel del bucle (tests/loop/pii-modelo.test.ts)"
      - "Las rutas de archivos /api/casos/:caso/archivos* no se atan a la sesión; las protege solo el código de acceso (diseño de una sola usuaria)"
  - phase: 04-m-dulo-documentaci-n-y-defensa
    items:
      - "Humano: la usuaria revisa SOLUCION.md sección 9 (Uso de IA) y hace una vez a mano el ensayo de la sección 11 en el navegador la víspera"
      - "Humano: el día de la defensa, mirar el panel 'Archivos de ec-corp-andina' antes del turno 1"
      - "Opcional: cargar el módulo en una sesión real de OpenCode (UAT T11, diferido por D-83)"
  - phase: 05-front-web-por-features-e-identidad-de-marca
    items:
      - "Diferido: tests/e2e/demo.test.ts y tests/e2e/determinismo.test.ts dependen del orden con bun test --randomize (pasan con bun test, --isolate y --parallel=2; la CI usa bun test)"
      - "Pendiente antes de la defensa: abrir el link público tras más de 15 min inactivo y mirar la primera carga en frío real de Render"
      - "Opcional: una prueba que exija la atribución de marca de SOLUCION.md:137"
nyquist:
  compliant_phases: []
  partial_phases: []
  not_validated_phases: []
  missing_phases: []
  overall: "skipped (validate-phase capability inactive)"
---

# Auditoría del milestone v1

**Estado:** tech_debt. Los 79 requisitos están satisfechos y no hay bloqueos. Queda deuda acumulada y diferida, casi toda de verificación humana para la defensa.

## Fases

| Fase | VERIFICATION | Puntaje | Notas |
|------|--------------|---------|-------|
| 01 Núcleo determinista | passed | 111/111 | SEG-02 quedó parcial en la fase; se cerró en las Fases 2 y 3 |
| 02 Agente y compuerta de confirmación | passed | 56/56 | — |
| 03 Chat web, API SSE y despliegue | passed | 22/24 (3 overrides) | Overrides aceptados por la usuaria: limitador bajo saturación, cota por ventana y texto del truncado |
| 04 Módulo, documentación y defensa | passed | 13/15 | El criterio 4 en remoto y la truth operativa de G-04-2 esperan a una persona; la CI verde y el ensayo remoto los confirmó después la QA de la Fase 5 |
| 05 Front web por features e identidad de marca | passed | 29/29 | Una vuelta de cierre de brechas (05-10, 05-11); UAT 15/15 |

## Requisitos: cruce de tres fuentes

Fuentes: la tabla de trazabilidad de REQUIREMENTS.md, las tablas de requisitos de cada VERIFICATION.md y el `requirements-completed` del frontmatter de cada SUMMARY.

| Resultado | Cantidad | Detalle |
|-----------|----------|---------|
| satisfied | 79 | 63 citados por ID en una VERIFICATION. 15 citados por rango ("HERR-01..05", "MAP-01..07", "FORM-01..04", "CAL-01..04", "LLM-01 a LLM-04"), que el conteo automático por ID no reconocía. SEG-02, confirmado por el verificador de integración |
| partial | 0 | — |
| unsatisfied | 0 | — |
| orphaned | 0 | Todo ID de la trazabilidad aparece en alguna VERIFICATION o lo cubre un rango |

**SEG-02.** Una sola `redactar()` (`src/domain/policies/redaccion.policy.ts:62`) se aplica en estos puntos:

- el logger (`src/infra/logging/logger.adapter.ts:16`);
- cada frame SSE (`src/http/services/sse.service.ts:6`);
- el fallback JSON (`src/http/routes/chat.route.ts:153`);
- los argumentos y resultados de las tool calls (`src/loop/services/paso-herramientas.service.ts:71,101`);
- la vista de sesión (`src/loop/services/vista-sesion.service.ts:67,104`).

Las pruebas PII toman cada valor sensible del maestro y buscan en las salidas de las herramientas, stdout, logs, mapeo, checklist, borrador, ENVIO-SIMULADO, los mensajes al modelo, la vista de sesión y las vistas previas. La casilla y la fila de trazabilidad estaban atrasadas y se corrigieron en esta auditoría.

## Integración entre fases

| Requisito | Ruta | Estado |
|-----------|------|--------|
| SEG-02 | `redactar` del dominio → logger de infra, servicios del bucle, SSE, JSON y sesiones de http | conectado |
| Compuerta ENV/AGT | política de compuerta del dominio → despacho del bucle → evento SSE → tarjeta de confirmación → `simular_envio` | conectado |
| HERR / MOD | `src/tools/proveedor.ts` → `modulo/` → `.opencode/` | conectado |
| API / UI | `RUTA_API` → rutas de Hono → `web/src/api/cliente-api.ts`; las 10 rutas tienen consumidor | conectado |
| DEMO / CAL | `demo.ts` → herramientas → `out/` → pruebas golden y PII | conectado |
| DEP | Dockerfile / `render.yaml` → fixtures, tsconfig, 0.0.0.0:PORT | conectado |
| DOC / FE | autocontenido; pasan los guardianes G1–G16 y W1–W27 | conectado |

No hay exports huérfanos ni rutas sin consumidor.

## Flujos E2E

| # | Flujo | Estado | Evidencia |
|---|-------|--------|-----------|
| 1 | Demo por CLI | completo | `tests/e2e/demo.test.ts:62-95`, ec-corp-andina 13/1/1 BLOQUEADO |
| 2 | Turno de chat | completo | `tests/http/chat.test.ts:70`, `tests/loop/pii-modelo.test.ts` |
| 3 | Compuerta de confirmación | completo | `despacho-llamada.service.ts:66-87`: el servidor decide y rearma los argumentos como `{caso, confirmado:true}` |
| 4 | Recarga de sesión y vista previa | completo | `tests/http/sesiones.test.ts:146`, `tests/http/artefactos.test.ts:172` |
| 5 | modulo / .opencode / preflight | completo | los mismos 5 nombres de herramienta; preflight importa solo tipos |
| 6 | Deploy | completo | Dockerfile con tsconfig y fixtures, health check en `render.yaml`; el link público sirve el bundle de HEAD (`index-BsZ58Qrt.js`) |

Compuertas que corrieron en esta auditoría: `bun test` (2668 pass, 2 skip en vivo, 0 fail en 132 archivos) y `bun run check` (limpio, 520 archivos).

## Deuda técnica

| Fase | Ítem | Tipo |
|------|------|------|
| 03 | Desalojo del limitador bajo saturación (D-77.1) | override aceptado |
| 03 | Cota K × L con conexiones retenidas (D-73.2 / D-77.2) | override aceptado |
| 03 | Texto del truncado tras un envío confirmado que falló (D-76.2) | override aceptado |
| 03 | Sin prueba PII a nivel del cable SSE (la cobertura está a nivel del bucle) | aviso |
| 03 | Rutas de archivos no atadas a la sesión (solo las protege el código de acceso) | info, por diseño |
| 03 | Auto-scroll tras un turno largo en headless (deferred 03-23) | diferido, mitigado |
| 04 | Revisión de SOLUCION.md sección 9 y ensayo manual de la sección 11 la víspera | humano |
| 04 | Panel de archivos de ec-corp-andina antes del turno 1 el día de la defensa | humano |
| 04 | Módulo en una sesión real de OpenCode (D-83) | opcional |
| 05 | Pruebas e2e dependientes del orden con `--randomize` | diferido |
| 05 | Arranque en frío real de Render antes de la defensa | humano |
| 05 | Prueba para la atribución de marca de SOLUCION.md:137 | opcional |

**Total:** 12 ítems en 4 fases. Ninguno bloquea el milestone.

## Nyquist

Se omitió: la capacidad validate-phase no está activa en este proyecto y ninguna fase tiene VALIDATION.md.
