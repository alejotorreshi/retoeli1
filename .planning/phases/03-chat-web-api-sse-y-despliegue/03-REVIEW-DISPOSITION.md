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
| WR-01 | Warning | El frame SSE de error interno no cumple el contrato y el cliente lo descarta en silencio | open | |
| WR-02 | Warning | El token de acceso no está ligado al código, así que rotar `ACCESS_CODE` no revoca las cookies emitidas | open | |
| WR-03 | Warning | El tope diario de tokens vive en memoria y se reinicia con cada reinicio o spin-down de Render | open | |
| WR-04 | Warning | El limitador previo a la autenticación no tiene cota de claves y se evade rotando direcciones IPv6 | open | |
| WR-05 | Warning | `TRUSTED_PROXY_HOPS=3` solo es correcto para un camino de entrada; por otro camino la IP del cliente se puede falsificar | open | |
| WR-06 | Warning | Un 404 de vista previa se confunde con "archivo borrado" y dispara un falso aviso de disco efímero | open | |
| WR-07 | Warning | El Dockerfile deja el código y `node_modules` escribibles por el usuario del proceso y duplica la capa | open | |
| IN-01 | Info | Los errores registrados pierden la pila | open | |
| IN-02 | Info | Textos que repiten un dato sin derivarlo de su constante, y un texto muerto | open | |
| IN-03 | Info | `businessCalendar()` ignora el entorno inyectado | open | |
| IN-04 | Info | `release()` con `Math.max(0, …)` oculta una doble liberación, e `inUse` y `trackedKeys` solo existen para las pruebas | open | |
| IN-05 | Info | En las pruebas, la demora del proveedor falso empieza al armar el guion, no al recibir el pedido | open | |
| IN-06 | Info | La etapa de build del Dockerfile depende de que los imports de `api.type.ts` sean solo de tipos | open | |
| IN-07 | Info | Una constante de otro ámbito en el middleware HTTP | open | |
| IN-08 | Info | Si `/api/config` falla justo después de entrar, la UI queda sin configuración y no reintenta | open | |
