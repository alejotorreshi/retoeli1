# Fase 03 — UI Review

**Auditado:** 2026-10-15
**Línea base:** 03-UI-SPEC.md (aprobado 2026-10-14)
**Screenshots:** no capturados por este auditor (no había servidor en localhost:3000, 5173 ni 8080). Se usaron las 26 capturas del orquestador en `.playwright-mcp/` (Chromium, LLM falso), sobre todo 03-21-resultado, 03-23-dos-tarjetas, 03-26-375 y 03-27-estado.
**Interaction captures:** off (workflow.ui_interaction_capture es false). Los hallazgos de interacción salen del código y de la evidencia del orquestador.

---

## Pillar Scores

| Pillar | Score | Key Finding |
|--------|-------|-------------|
| 1. Copywriting | 2/4 | Concordancia rota ("1 faltantes", "1 llenos"), "bloqueo(s)" y ids crudos (`certificado_cumplimiento_tributario`) en textos visibles |
| 2. Visuals | 3/4 | La jerarquía y el punto focal de confirmación cumplen; nombres de archivo partidos a mitad de palabra en el panel |
| 3. Color | 4/4 | Acento solo en los 7 usos reservados y cero colores sueltos fuera de `tokens.css` |
| 4. Typography | 3/4 | Escala 16/14/20/28 exacta, pero los botones van en 600 (el contrato pide 14/400) y el título del caso en el panel va en monoespaciada |
| 5. Spacing | 3/4 | Todo por tokens; a 375 px el encabezado ocupa 3 filas más las pestañas (el contrato pide 2 líneas) |
| 6. Experience Design | 3/4 | Cobertura de estados muy completa; quedan auto-scroll perdido tras turnos largos y filas de archivo obsoletas tras el reinicio |

**Overall: 18/24**

---

## Top 3 Priority Fixes

1. **WARNING: textos con concordancia rota y ids técnicos visibles.** La analista lee "1 faltantes", "1 llenos", "Se registrará con 1 bloqueo(s)" y `certificado_c…` en la tarjeta de Armar paquete, mientras la tarjeta de resultado y la de confirmación dicen "Certificado de cumplimiento tributario". Se ve poco pulido en la defensa y obliga a traducir ids. **Arreglo:** en `src/config/strings.ts:182` y `:421-422`, usar un helper de plural (`n === 1 ? "lleno" : "llenos"`). En `web/src/config/strings.ts:361`, `conBloqueos: n => n === 1 ? "Se registrará con 1 bloqueo." : \`Se registrará con ${n} bloqueos.\``. Construir el resumen de `armar_paquete` con el mismo mapa de nombres legibles que usan las tarjetas de resultado y de confirmación.
2. **WARNING: el auto-scroll se pierde tras un turno de más de 6 llamadas** (deferred-items.md, 03-23). En la demo de 4 casos, la respuesta final queda fuera de la vista y aparece "Ir al final" aunque nadie desplazó la vista. Es justo el flujo que se muestra al evaluador. **Arreglo:** en `web/src/components/linea-de-tiempo.tsx`, guardar `pegadoAlFinal` antes de plegar el `GrupoHerramientas` y volver a hacer scroll al fondo cuando el `ResizeObserver` reporta el cambio de alto del pliegue, si antes estaba pegado. Hace falta un test con 8 tool calls.
3. **WARNING: filas de archivo obsoletas tras el aviso "El servidor se reinició…"** (03-27-reinicio). El panel ofrece "Ver" y "Descargar" sobre archivos que ya no existen: la analista recibe un 404 al hacer clic, aunque el aviso le dice que se borraron. **Arreglo:** en `web/src/hooks/usar-archivos.ts` y `lista-archivos.tsx`, vaciar la lista (o marcar las filas como no disponibles y sin enlaces) cuando se detecta el disco efímero, y dejar solo el aviso y el chip "Procesar {caso} de nuevo".

Otras recomendaciones (WARNING menores):

4. Encabezado a 375 px: hoy son tres filas (título y subtítulo, fecha, modelo con "Nueva sesión") más 40 px de pestañas. Eso son unos 200 px de 812, y el contrato pide dos líneas. Conviene acortar el chip a "2026-09-03" con `aria-label` completo en `angosto`, o poner fecha, modelo y botón en una sola fila con `flex-wrap: nowrap`.
5. Pesos de botón: en `compositor.module.css:85,99`, `tarjeta-confirmacion.module.css:141`, `pantalla-acceso.module.css:90` y `dialogo-nueva-sesion.module.css:38` usan `--etiqueta-peso-fuerte`. El contrato reserva 600 para badges, etapas activas, encabezados de tabla y etiquetas de campo, y pone los botones en Label 14/400. O se corrige el CSS o se enmienda el UI-SPEC: los botones en 600 se leen mejor y es una desviación defendible, pero hoy no está declarada.
6. Rutas de archivo en el panel: `overflow-wrap: anywhere` las parte en sílabas ("paquete/checkl ist.md", "paquete/borrad or-correo.md" en 03-27-estado). Conviene partir en `/` y `-` (`<wbr>` tras cada separador) o mostrar el nombre base en una línea con el directorio en texto tenue.
7. Bloqueos con prefijo crudo en minúscula ("ausente: Certificado…", "vencido: Certificación…") en las tarjetas de resultado y de confirmación. Se leería mejor como "Certificado de cumplimiento tributario (ausente)" o "Falta: …" / "Vencido el 2026-08-31: …".
8. El resumen de herramienta muestra "BLOQUEADO" en mayúsculas (03-21-resultado), que choca con el tono del badge "No listo para firma". Conviene unificarlo con la copia de los badges.

---

## Detailed Findings

### Pillar 1: Copywriting (2/4)

- **WARNING:** `src/config/strings.ts:182` produce "{n} llenos, {n} faltantes, {n} por confirmar" sin singular, y `:421-422` repite el patrón ("Campos: 1 llenos · 1 faltantes"). Se ve en las tarjetas de herramienta.
- **WARNING:** `web/src/config/strings.ts:361`: "Se registrará con 1 bloqueo(s)." (03-23-dos-tarjetas, dos veces en pantalla). El "(s)" viene del UI-SPEC mismo; el contrato también debería corregirse.
- **WARNING:** el resumen de Armar paquete (03-21-resultado) muestra "BLOQUEADO (ausente: certificado_c…)" con el id técnico, mientras las otras tarjetas usan el nombre legible. Es una inconsistencia entre superficies del mismo dato.
- **WARNING (menor):** los bloqueos se muestran como "ausente: …" y "vencido: …", con el código de estado como prefijo en minúscula.
- **Info (menor):** "Uso de la sesión: 0 k de 300 k tokens". El espacio en "0 k" es poco natural ("0 k" frente a "0k" o "0 mil"). Es menor.
- **Cumple:** las CTA ("Enviar mensaje", "Entrar al agente", "Confirmar envío simulado", "Cancelar envío", "Detener respuesta") coinciden con el contrato. El estado vacío "¿Qué caso procesamos?" y su cuerpo son literales (03-26-375), igual que el pie del panel, la nota de confirmación y "Ir al final" (`strings.ts:74`). No hay "Submit", "OK" ni "Click here".

### Pillar 2: Visuals (3/4)

- **Cumple:** el punto focal es correcto. `TarjetaConfirmacion` lleva borde izquierdo de 4 px, fondo de atención, ícono de alerta y título 20/600, y es lo de mayor peso en pantalla (03-23-dos-tarjetas). `TarjetaResultado` lee bien: contadores 20/600 con color semántico, badges de formato y país neutros.
- **Cumple:** los íconos siempre van con texto. Los estados del progreso usan ícono más texto más color ("✓ Leído", "◷ Confirmación", "○ Envío"), nunca solo color.
- **WARNING:** en el panel, las rutas se parten a mitad de palabra (03-27-estado), lo que rompe la lectura de la lista de archivos, que es la superficie de UI-06.
- **WARNING (menor):** el título del caso en el panel se pinta en monoespaciada 20/600 ("hn-agroexport-sula"), que pesa visualmente más que el encabezado "Casos de esta sesión" y compite con él. El contrato pide Heading en fuente base para el título del caso. `TarjetaResultado` sí lo cumple.
- **Info:** una tarjeta de herramienta con error y nombre desconocido (`proveedor_listar_casos`, 03-21) muestra solo el nombre técnico y el badge, sin caso ni resumen. Es correcto según la tabla de etiquetas, pero queda visualmente vacía.
- **Oportunidad (no defecto, SEED-261014-8dq):** la identidad de marca y un estado vacío más rico están diferidos.

### Pillar 3: Color (4/4)

- `var(--acento)` aparece en 9 reglas, todas en la lista cerrada: botones "Enviar mensaje" (`compositor.module.css:88`), "Entrar al agente" (`pantalla-acceso.module.css:93`) y "Confirmar envío simulado" (`tarjeta-confirmacion.module.css:150`); anillo de foco (`tokens.css:76`, `global.css:118`); etapa en curso (`progreso-caso.module.css:42`); ícono girando (`tarjeta-herramienta.module.css:49`); enlaces Ver y Descargar (`lista-archivos.module.css:57`); punto de cambios no vistos (`global.css:106`). Ningún uso fuera de la lista.
- Cero hex, `rgb()` o px sueltos fuera de `tokens.css` (grep sobre todos los `.css` de `web/src`; solo aparecen porcentajes estructurales como `100%` y `50%`). Tampoco hay `style=` en línea en ningún `.tsx`.
- 60/30/10 visible: chat blanco; encabezado, panel, chips y compositor en `#F3F5F7`; acento solo en los CTA primarios y los enlaces (03-27-estado). "Nueva sesión" es secundario, como pide el contrato.
- Sin hallazgo que baje el puntaje; los semánticos (éxito, atención, error) coinciden con los tokens declarados.

### Pillar 4: Typography (3/4)

- Distribución de tamaños: 47 × `--etiqueta-tamano` (14), 9 × `--titulo-tamano` (20), 7 × `--cuerpo-tamano` (16) y 1 × `--display-tamano` (28). Son exactamente los 4 tamaños declarados.
- Pesos: solo 400 y 600, sin cursivas.
- **WARNING:** 600 se usa en botones (compositor ×2, confirmación, acceso, diálogo de nueva sesión), y el contrato declara los botones en Label 14/400. Es una desviación no documentada.
- **WARNING (menor):** el título del caso en el panel va en monoespaciada (ver Visuals).
- **Cumple:** contadores en `tabular-nums` y la pila de fuentes del sistema sin descarga.

### Pillar 5: Spacing (3/4)

- Todo el espaciado sale de `--espacio-*` y las dimensiones de `tokens.css` (56 px de encabezado, 40 px de pestañas y controles, 384 px de panel, 768 px de chat, 72–200 px de compositor). No hay valores arbitrarios.
- **WARNING:** a 375 px (03-26-375) el encabezado se parte en 3 filas, más la barra de pestañas, y el contrato pide "dos líneas". Entre encabezado y pestañas se van unos 200 px de 812 antes del contenido. El orquestador midió hasta 4 filas en algunos estados.
- **Cumple:** `scrollWidth == viewport` a 1280, 800 y 375 tras 03-22. Los chips se apilan en 2 filas a < 640 px, como decidió la usuaria.
- **Info:** a 640–1023 px la grilla y las pestañas funcionan por `matchMedia` (`hooks/usar-diseno.ts`) con `data-diseno`, no por `@media` en el CSS. Es coherente, aunque un primer paint sin JS no tiene diseño responsivo (irrelevante en una SPA).

### Pillar 6: Experience Design (3/4)

- **Cumple:** la cobertura de estados es amplia y se verificó en navegador. Carga (Pensando, servidor despertando, Cargando la conversación, Verificando, Cargando archivos y Cargando la vista previa), errores (`AvisoError` con `role="alert"`, 401 que vuelve a la pantalla de acceso, stream cortado con "Recargar conversación", banners del LLM), vacíos (conversación, panel, archivos), acción destructiva con `<dialog>` ("Nueva sesión"), botones deshabilitados durante un turno, Detener, rehidratación de confirmaciones vigentes (03-25) y `prefers-reduced-motion` en 4 hojas.
- **WARNING:** el auto-scroll se pierde tras un turno de más de 6 tool calls (deferred-items.md). Afecta al chip "Procesar los 4 casos", el flujo más demostrable.
- **WARNING:** tras "El servidor se reinició y los archivos se borraron", las filas viejas con "Ver" y "Descargar" siguen visibles hasta reprocesar (03-27-reinicio). La UI contradice su propio aviso y lleva a 404s.
- **Info:** el chip "¿Qué casos hay?" depende de que el agente pueda listar casos. En 03-21 el modelo falso llamó a `proveedor_listar_casos` y obtuvo Error. Hay que confirmar con el modelo real que el chip no termina en una tarjeta de error (punto 7 del contrato de datos).
- Registry audit: no aplica (sin `components.json`, sin registros de terceros).

---

## Files Audited

- `web/src/styles/tokens.css`, `web/src/styles/global.css`
- `web/src/components/*.module.css` (compositor, encabezado, lista-archivos, progreso-caso, tarjeta-herramienta, tarjeta-confirmacion, tarjeta-resultado, pantalla-acceso, dialogo-nueva-sesion, dialogo-vista-previa, linea-de-tiempo, panel-casos, mensaje, indicador-pensando)
- `web/src/components/*.tsx` (búsqueda de estilos en línea y `dangerouslySetInnerHTML`: ninguno)
- `web/src/config/strings.ts`, `web/src/config/constants/ui.constants.ts`, `web/src/hooks/usar-diseno.ts`
- `src/config/strings.ts` (resúmenes de herramienta del servidor)
- `.planning/phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md`, `deferred-items.md`
- Capturas: `.playwright-mcp/03-21-resultado.png`, `03-23-dos-tarjetas.png`, `03-26-375.png`, `03-27-estado.png`
