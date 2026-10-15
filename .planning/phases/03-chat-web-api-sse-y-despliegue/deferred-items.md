# Fase 03: hallazgos fuera de alcance

## 03-23

- **El auto-scroll a veces deja de seguir el final después de un turno largo.** Se vio en chrome-headless-shell, por CDP y con el LLM falso de `scratchpad/fake-llm-03-23.ts`, en el turno "Procesa estos casos: ec-corp-andina, hn-agroexport-sula", que trae 8 llamadas, así que el grupo de herramientas se pliega al terminar el turno. Al cerrar ese turno, la línea de tiempo quedó arriba con el botón "Ir al final" visible, aunque nadie la había desplazado. En los turnos de 4 llamadas o menos siguió pegada al final. No se confirmó de dónde viene. Puede ser el pliegue del grupo de más de 6 tarjetas, que es de 03-19, combinado con el `ResizeObserver` de `linea-de-tiempo.tsx`. No se tocó en 03-23 porque no forma parte de las tarjetas de confirmación. Para reproducirlo: corre `bun --env-file=/dev/null scratchpad/cdp-23.ts` y mira `shot-23-1280-dos.png`.
