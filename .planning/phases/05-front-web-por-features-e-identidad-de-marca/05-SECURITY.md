---
phase: "5"
slug: "front-web-por-features-e-identidad-de-marca"
status: verified
# threats_open = count of OPEN threats at or above workflow.security_block_on severity (the blocking gate)
threats_open: 0
asvs_level: 1
created: "2026-10-16"
---

# Phase 5 — Security

> Contrato de seguridad de la fase: registro de amenazas, riesgos aceptados y rastro de auditoría.

---

## Trust Boundaries

| Boundary | Description | Data Crossing |
|----------|-------------|---------------|
| Navegador → API (`/api/*`) | El front es público y no se confía en él. El servidor valida cada cuerpo con zod, exige el código de acceso y hace cumplir la confirmación (RN4). | Mensajes de chat, `accion` de confirmación y `sessionId` (sin PII del maestro) |
| Navegador → estáticos (`/`, `/marca/*`, `/fuentes/*`) | Archivos públicos de `web/dist`, servidos sin código de acceso y con CSP `'self'`. | Logo, favicon y fuentes autoalojadas, sin datos |
| Registro npm → repo (devDependencies) | Paquetes de prueba de terceros. Nunca llegan a la imagen de producción. | Código de terceros (cadena de suministro) |
| Sitio de Periferia → repo (descarga única) | El logo y el favicon se bajaron una sola vez, se verificaron y se versionaron. En tiempo de ejecución no se pide nada a terceros. | Binarios de imagen |

---

## Threat Register

| Threat ID | Category | Component | Severity | Disposition | Mitigation | Status |
|-----------|----------|-----------|----------|-------------|------------|--------|
| T-05-01 | Tampering | devDependencies (Testing Library, happy-dom) | high | mitigate | Versiones exactas de ≥7 días, sin scripts de instalación, repositorios verificados, `bun audit` limpio, `--frozen-lockfile` en CI y `--production` en el Dockerfile (`package.json:34-37`, `bun.lock`, `ci.yml:27,50`, `Dockerfile:14`) | closed |
| T-05-SC | Tampering | instalaciones npm (05-01) | high | mitigate | Compuerta de legitimidad fail-closed con evidencia en `05-01-SUMMARY.md:155-187`. Se instalaron versiones anteriores a las marcadas SUS (user-event 14.6.7, happy-dom 20.14.6). Justificación en `SOLUCION.md:159-163` | closed |
| T-05-SC | Tampering | instalaciones npm (05-02..05-09) | low | accept | Ningún otro plan instala paquetes: `package.json` y `bun.lock` solo cambian en `36727e4` | closed |
| T-05-02 | Tampering | integridad de las pruebas del backend | medium | mitigate | happy-dom se registra por archivo y se quita en `afterAll` (`tests/helpers/dom.helper.ts:18-27`), sin preload. El centinela `tests/globales-nativos.test.ts` lo vigila. Verde con `--isolate` y `--parallel=2` | closed |
| T-05-03 | Information disclosure | código de acceso durante las pruebas | low | mitigate | `tests/web/dom/app-acceso.test.tsx:15-23,86-87` | closed |
| T-05-04 | Information disclosure | estado y acciones del store | medium | mitigate | localStorage solo en `web/src/api/sesion-local.ts` (W7). `CLAVE_SESION_LOCAL` no cambió | closed |
| T-05-05 | DoS (client) | selectores con `useSyncExternalStore` | medium | mitigate | `memoizarPorReferencia` (`web/src/store/selectores.ts`), prueba de estabilidad y W21 | closed |
| T-05-06 | Tampering | eventos después de Detener | low | mitigate | `web/src/store/acciones.ts:68-69`; `acciones.test.ts:243`; `app.test.tsx:299-329` | closed |
| T-05-07 | Tampering | deriva de arquitectura (vistas que llaman a la API) | medium | mitigate | W15 y W16 con muestras negativas. La exención de mudanza se eliminó | closed |
| T-05-08 | DoS (client) | suscripción al store en la App | medium | mitigate | `montarApp` hace fallar la prueba ante cualquier `console.error` (`tests/helpers/app-dom.helper.ts`) | closed |
| T-05-09 | Information disclosure | estado de salud en el store | low | accept | `/api/health` es público por diseño y solo devuelve `ok`, `provider`, `model` y `llm` | closed |
| T-05-10 | Tampering | vistas de mensaje, herramienta y confirmación | medium | mitigate | Nodos de texto de React con `pre-wrap` y W5 | closed |
| T-05-11 | EoP | botón Confirmar | medium | mitigate | Envía `{tipo, caso}` de su propia tarjeta (`usar-tarjeta-confirmacion.ts:32-35`), con la guarda `hayTarjetaAbierta`. Decide la compuerta del servidor | closed |
| T-05-12 | DoS | turnos pagos duplicados desde chips o Enter | medium | mitigate | `acciones.ts:65` (`enCurso`, `hidratando`, `turnoActivo`) y la caracterización con el turno retenido | closed |
| T-05-13 | Tampering | texto del modelo en la línea de tiempo | medium | mitigate | Nodos de texto con `pre-wrap` y W5 | closed |
| T-05-14 | Information disclosure | descargas y vistas previas | medium | mitigate | Rutas armadas solo en `web/src/api/cliente-api.ts` con `encodeURIComponent`. Un 401 vuelve a la pantalla de acceso (`app-panel.test.tsx:142-157`) | closed |
| T-05-15 | Tampering | contenido de la vista previa | medium | mitigate | Nodos de texto con `pre-wrap` (`dialogo-vista-previa.tsx`) | closed |
| T-05-16 | Information disclosure | código de acceso | high | mitigate | Vive solo en `useState` de `usar-pantalla-acceso.ts:25` y se borra al acertar (`:39`). Nunca va al store ni al storage | closed |
| T-05-17 | Tampering | cobertura de los guardianes al cerrar la mudanza | medium | mitigate | Cada W revisa código real que no puede venir vacío, más sus muestras negativas. La muestra de W13 reporta las rutas antiguas | closed |
| T-05-18 | DoS (client) | efectos que arrancan dos veces o nunca | low | mitigate | Una sola llamada a `useSincronizacion` (`usar-columnas.ts:58`), con limpieza que aborta | closed |
| T-05-19 | Tampering | binarios descargados | medium | mitigate | Bytes mágicos en `tests/web/marca.test.ts:77-85`. Los sha256 coinciden 7/7 con `05-08-SUMMARY.md` | closed |
| T-05-20 | Information disclosure (privacy) | pedidos a terceros en tiempo de ejecución | medium | mitigate | Activos versionados en `web/public` y sin URLs absolutas (`marca.test.ts:104-107`). CSP `'self'` | closed |
| T-05-21 | EoP | lista de estáticos permitidos | low | mitigate | `static.route.ts` no cambió. `/api/*` sigue detrás de `requireAccess`. MIME probados sin cookie | closed |
| T-05-22 | Tampering | título inyectado en el build | low | mitigate | `web/vite.config.ts:21-33` escapa `&` y `<` y toma una constante de `strings.ts`. W6 | closed |
| T-05-23 | Repudiation (legal) | marca y licencias de fuentes | low | transfer | Atribución en `SOLUCION.md:137`. Las licencias OFL van junto a las fuentes y las verifica `marca.test.ts` | closed |
| T-05-24 | EoP | compuerta de confirmación desde una tarjeta | high | mitigate | La tarjeta solo envía `mensajeDemoDe(slug)`, sin `accion`. `app.test.tsx:165-167` exige que el cuerpo sea `{sessionId, message}` | closed |
| T-05-25 | DoS | turnos pagos duplicados por doble clic | medium | mitigate | Tarjeta deshabilitada, más la guarda `acciones.ts:65`. `app.test.tsx:153-176` exige un solo POST | closed |
| T-05-26 | Tampering | slug pintado en la tarjeta | low | mitigate | Texto de React con `overflow-wrap`, sin regex. `PATRON_CASO` en el servidor | closed |
| T-05-27 | Tampering | estado de negocio decidido o desviado en el navegador | medium | mitigate | W23 (sin códigos de negocio copiados), W3 y W22. `listoParaFirma` sale del servidor (`features/casos/estado/casos.ts`). El servidor valida con zod y aplica RN4 (D-124) | closed |

*Status: open · closed · open — below high threshold (non-blocking)*
*Severity: critical > high > medium > low — only open threats at or above workflow.security_block_on count toward threats_open*
*Disposition: mitigate (implementation required) · accept (documented risk) · transfer (third-party)*

---

## Accepted Risks Log

| Risk ID | Threat Ref | Rationale | Accepted By | Date |
|---------|------------|-----------|-------------|------|
| AR-05-01 | T-05-09 | `/api/health` es público por diseño y no lleva secretos (solo `ok`, `provider`, `model` y `llm`). Las pruebas SEG-01 de la Fase 3 no cambiaron | orquestador (corrida nocturna autónoma; premisa verificada por gsd-security-auditor) | 2026-10-16 |
| AR-05-02 | T-05-SC (05-02..05-09) | Estos planes no instalan paquetes: `package.json` y `bun.lock` solo cambian en `36727e4` (05-01) | orquestador (corrida nocturna autónoma; premisa verificada por gsd-security-auditor) | 2026-10-16 |

*Accepted risks do not resurface in future audit runs.*

**Observaciones no bloqueantes del auditor:**
1. `URL_ABSOLUTA` en `tests/web/marca.test.ts:22` no detecta URLs que empiezan con `//` (sin protocolo). Hoy no hay ninguna.
2. El job `auditoria` del CI corre con `continue-on-error: true`, así que un aviso futuro de `bun audit` no bloquearía el CI.
3. La CSP mantiene `imgSrc 'self' data:` desde la Fase 3.

---

## Security Audit Trail

| Audit Date | Threats Total | Closed | Open | Run By |
|------------|---------------|--------|------|--------|
| 2026-10-16 | 28 | 28 | 0 | gsd-security-auditor (ASVS L1, block_on high) |

---

## Sign-Off

- [x] All threats have a disposition (mitigate / accept / transfer)
- [x] Accepted risks documented in Accepted Risks Log
- [x] `threats_open: 0` confirmed
- [x] `status: verified` set in frontmatter

**Approval:** verified 2026-10-16
