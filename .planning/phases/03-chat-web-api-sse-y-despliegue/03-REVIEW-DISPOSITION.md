---
phase: 03-chat-web-api-sse-y-despliegue
source: 03-REVIEW.md
reviewed: 2026-10-15T05:59:52Z
critical: 0
warning: 7
info: 8
---

# Disposición de hallazgos del code review — Fase 03

Una fila por hallazgo de `03-REVIEW.md`. Todas empiezan en `open`; se actualizan cuando se corrigen (`fixed`), se aceptan (`accepted`) o se descartan con motivo (`wontfix`).

| Id | Severidad | Hallazgo | Disposición | Nota |
|---|---|---|---|---|
| WR-01 | Warning | El frame SSE de error interno no cumple el contrato y el cliente lo descarta en silencio | fixed | 8607c6d (ver 03-REVIEW-FIX.md) |
| WR-02 | Warning | El token de acceso no está ligado al código, así que rotar `ACCESS_CODE` no revoca las cookies emitidas | fixed | 6c81270 (ver 03-REVIEW-FIX.md) |
| WR-03 | Warning | El tope diario de tokens vive en memoria y se reinicia con cada reinicio o spin-down de Render | accepted | Aceptado para el demo por decisión de la usuaria; documentado en docs/limites-del-demo.md (c730d17). Debe pasar a SOLUCION.md en la Fase 4. |
| WR-04 | Warning | El limitador previo a la autenticación no tiene cota de claves y se evade rotando direcciones IPv6 | fixed | a654bfe (ver 03-REVIEW-FIX.md) |
| WR-05 | Warning | `TRUSTED_PROXY_HOPS=3` solo es correcto para un camino de entrada; por otro camino la IP del cliente se puede falsificar | fixed | cf526b7 (ver 03-REVIEW-FIX.md) |
| WR-06 | Warning | Un 404 de vista previa se confunde con "archivo borrado" y dispara un falso aviso de disco efímero | fixed | 8526c8a (ver 03-REVIEW-FIX.md) |
| WR-07 | Warning | El Dockerfile deja el código y `node_modules` escribibles por el usuario del proceso y duplica la capa | fixed | ce8f1b1 (ver 03-REVIEW-FIX.md) |
| IN-01 | Info | Los errores registrados pierden la pila | fixed | 18518df (ver 03-REVIEW-FIX.md) |
| IN-02 | Info | Textos que repiten un dato sin derivarlo de su constante, y un texto muerto | fixed | cfa0301 (ver 03-REVIEW-FIX.md) |
| IN-03 | Info | `businessCalendar()` ignora el entorno inyectado | fixed | 3d56706 (ver 03-REVIEW-FIX.md) |
| IN-04 | Info | `release()` con `Math.max(0, …)` oculta una doble liberación, e `inUse` y `trackedKeys` solo existen para las pruebas | fixed | 0c4e025 (ver 03-REVIEW-FIX.md) |
| IN-05 | Info | En las pruebas, la demora del proveedor falso empieza al armar el guion, no al recibir el pedido | fixed | e1de609 (ver 03-REVIEW-FIX.md) |
| IN-06 | Info | La etapa de build del Dockerfile depende de que los imports de `api.type.ts` sean solo de tipos | fixed | 579bffa (ver 03-REVIEW-FIX.md) |
| IN-07 | Info | Una constante de otro ámbito en el middleware HTTP | fixed | db7e710 (ver 03-REVIEW-FIX.md) |
| IN-08 | Info | Si `/api/config` falla justo después de entrar, la UI queda sin configuración y no reintenta | fixed | 99b2510 (ver 03-REVIEW-FIX.md) |
