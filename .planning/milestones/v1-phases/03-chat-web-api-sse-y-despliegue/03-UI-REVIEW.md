# Fase 03 — Revisión de UI (re-auditoría tras 03-28..03-39)

**Auditado:** 2026-10-15
**Línea base:** 03-UI-SPEC.md (aprobada, actualizada por 03-39)
**Capturas:** no capturadas (no había servidor en localhost:3000, 5173 ni 8080; auditoría solo de código)
**Capturas de interacción:** off (workflow.ui_interaction_capture es false)

> Todo hallazgo visual o de interacción de esta revisión sale del código y de los SUMMARY. No se observó ningún estado en navegador. Las verificaciones a 375 px (encabezado en dos líneas, chips en una fila, "Ir al final" solo con ícono) quedan **sin confirmar visualmente**.

---

## Puntajes por pilar

| Pilar | Puntaje | Hallazgo clave |
|-------|---------|----------------|
| 1. Copywriting | 2/4 | Copia nueva de 03-33/34/38 fiel al contrato, pero siguen sin corregir los plurales fijos ("1 llenos", "1 bloqueo(s)") y los prefijos técnicos "ausente:" y "vencido:" |
| 2. Visuals | 3/4 | Banner con título, detalle y botón secundario, y botón "Ir al final" accesible; el título del caso en el panel sigue en monoespaciada 20/600 |
| 3. Color | 4/4 | Cero hex, `rgb()` o px sueltos en los `*.module.css`; los componentes nuevos usan solo tokens y el acento sigue en la lista cerrada |
| 4. Typography | 3/4 | Los cuatro tamaños declarados, pero los botones siguen en 600 contra Label 400, y 03-33 suma otro botón ("Comprobar de nuevo") en 600 |
| 5. Spacing | 3/4 | El encabezado angosto ahora fuerza dos filas por CSS, pero no hay medición en navegador después de 03-37 |
| 6. Experience Design | 3/4 | Pausa coherente del envío, botón "Volver a la sesión anterior" y error de vista previa por causa; el seguimiento del final (03-36) no se re-verificó en un turno largo real |

**Total: 18/24**

---

## Las 3 correcciones prioritarias

1. **Plurales fijos en copia visible** (WARNING). Se leen "Se registrará con 1 bloqueo(s)." (`web/src/config/strings.ts:402`), "1 llenos, 1 faltantes" (`src/config/strings.ts:184`) y "Campos: 1 llenos · …" (`src/config/strings.ts:440`) en la tarjeta de confirmación y en las tarjetas de herramienta, que es lo que se ve en la defensa. La solución es una función `plural(n, singular, plural)` en ambos `strings.ts`, y corregir también la fila "Confirmación con bloqueos" del UI-SPEC (línea 365), que hoy legitima el "(s)".
2. **Botones en 600 contra el contrato Label 14/400** (WARNING). El problema está en `aviso-modelo.module.css:57` (nuevo en 03-33), `encabezado.module.css:108`, `linea-de-tiempo.module.css` (`.accionAviso`), `compositor.module.css:77/85/99`, `pantalla-acceso.module.css:90` y `tarjeta-confirmacion.module.css:141`. Hay dos salidas: cambiar a `var(--etiqueta-peso)` o agregar "botones" a la lista de excepciones de 600 en la fila Label del UI-SPEC (línea 133). Hoy contrato y código no coinciden.
3. **Verificar en navegador los cambios de 03-36 y 03-37** (WARNING, riesgo de demo). Faltan el seguimiento del final en el turno de 8 llamadas que reproducía el defecto de `deferred-items.md`, la fila meta del encabezado en nowrap con "Sin clave válida" y "Nueva sesión" a 375 px, y los chips "Demo §11 / Los 4 casos / ¿Qué casos hay?" en una fila. La prueba es con el LLM falso de la fase y Playwright a 375×812 y 1440×900. Las pruebas unitarias cubren el reductor y la copia, no el layout.

---

## Hallazgos detallados

### Pilar 1: Copywriting (2/4)

- **Cumple (03-33):** `AVISO_DEL_MODELO` arma `{ titulo, detalle }` por estado. Todo detalle empieza con la constante compartida `MIENTRAS_TANTO`, y ya no aparecen comandos ni `<code>`. El botón dice "Comprobar de nuevo" o "Comprobando…" (`web/src/config/strings.ts:135`), como en la fila "Banner: botón" del contrato.
- **Cumple (03-34):** `TEXTO_CHAT.enPausa` (`strings.ts:86`) y `TEXTO_CONFIRMACION.enPausa` (`:408`, "Podrás confirmar o cancelar cuando el modelo vuelva a estar disponible.") explican la pausa en lugar de deshabilitar en silencio.
- **Cumple (03-37):** "Demo §11" y "Los {n} casos" se derivan de `DEMO_CORTO` y `losCasos` (`strings.ts:272-284`). La etiqueta corta queda contenida en el `aria-label` completo (`acciones-rapidas.tsx:19,28`), lo que respeta label-in-name.
- **Cumple (03-38, 03-31):** "Volver a la sesión anterior" (`strings.ts:103`) y `errorSinConexion` coinciden con el contrato.
- **WARNING (sin corregir desde la auditoría anterior):** quedan los plurales fijos de la corrección 1 de arriba.
- **WARNING (sin corregir):** los bloqueos salen como `ausente: {tipo}` y `vencido: {tipo} ({vigencia})` (`src/config/strings.ts:88-89`), con el código de estado en minúscula como prefijo, mientras el UI-SPEC (línea 261) pide "motivos legibles".
- **Menor (sin corregir):** "Uso de la sesión: 0 k de 300 k tokens" (`web/src/config/strings.ts:91`), donde el espacio en "0 k" se lee raro.

### Pilar 2: Visuals (3/4)

- **Cumple:** `AvisoModelo` (`aviso-modelo.tsx`) tiene jerarquía clara: ícono de alerta grande, título en 600, detalle en 400 y botón secundario alineado al inicio. El tono (error o atención) sale de `TONO_DEL_MODELO`.
- **Cumple (03-36):** "Ir al final" lleva siempre `aria-label` (`linea-de-tiempo.tsx:231`) y chevron rotado. En angosto queda cuadrado de `--alto-control` y oculta el texto (`linea-de-tiempo.module.css:83-91`), como pide el contrato.
- **WARNING (sin corregir):** `.caso` en `panel-casos.module.css:68-77` sigue con `font-family: var(--fuente-mono)` a 20/600. Compite con el encabezado del panel y contradice el Heading en fuente base del contrato. `TarjetaResultado` sí lo cumple.
- **Info:** el `role="status"` del banner contiene un botón. Funciona, pero cada cambio de texto ("Comprobando…") se anuncia dentro de la región viva. Conviene verificarlo con lector de pantalla.

### Pilar 3: Color (4/4)

- `grep` de hex, `rgb()` y `\d+px` sobre `web/src/components/*.css` da 0 resultados. No hay `style=` en línea en los `.tsx`.
- Los componentes nuevos o tocados (`aviso-modelo`, `.irAlFinal`, `.accionAviso`, `.comprobar`) usan `--dominante`, `--borde`, `--texto` y `--texto-tenue`, sin acento. El acento sigue limitado a los tres CTA primarios, el foco y los enlaces de la lista cerrada (UI-SPEC líneas 177-179). Se mantiene el 60/30/10.
- El hallazgo que justifica el puntaje es que no hay ninguno de color. Los estados deshabilitados en pausa usan `--texto-tenue`, coherente con el resto.

### Pilar 4: Typography (3/4)

- Los tamaños siguen siendo solo los cuatro tokens (`--etiqueta`, `--cuerpo`, `--titulo` y `--display`), y los pesos solo 400 y 600 a través de variables.
- **WARNING:** 600 en botones, ahora en 7 o más reglas (ver la corrección 2). 03-33 repitió el patrón en `.comprobar` en lugar de resolver la discrepancia.
- **WARNING:** el título del caso en monoespaciada (ver Visuals).
- **Cumple (03-37):** en angosto `.texto` del encabezado lleva elipsis y los prefijos pasan a sr-only, así que no se pierde el nombre accesible.

### Pilar 5: Spacing (3/4)

- **Cumple en código (03-37):** en angosto, `.marca` y `.meta` toman `flex-basis: 100%`, `.meta` va en `nowrap` y `.meta > *` lleva `min-width: 0` (`encabezado.module.css:118-135`). Eso fuerza exactamente dos filas, que corrige el hallazgo anterior de 3 o 4 filas a 375 px. **No se midió:** con tres controles de `padding-inline: var(--espacio-md)` más el punto de estado, la elipsis podría dejar la fecha o el modelo casi vacíos a 375 px.
- **Cumple en código (03-37):** chips con `padding-inline: var(--espacio-sm)` en angosto y sin `overflow-x`. Faltan pruebas de que caben en una fila con "Los 4 casos".
- **WARNING:** sin captura no se confirma el criterio del UI-SPEC (línea 468) para la franja compacta, ni el `scrollWidth == viewport` a 375 después de los cambios de 03-36 y 03-37.
- Todo el espaciado sigue saliendo de `--espacio-*`, sin valores arbitrarios.

### Pilar 6: Experience Design (3/4)

- **Cumple (03-34):** un único predicado, `envioEnPausa`, deshabilita el compositor (campo, botón y Enter), los chips, el chip de reproceso y las tarjetas de confirmación, cada uno con ayuda visible. "Nueva sesión", "Detener", ver, descargar y "Reintentar" siguen disponibles. Es una pausa deliberada y explicada, no un bloqueo silencioso.
- **Cumple (03-33):** "Comprobar de nuevo" solo relee `/api/health`, se deshabilita con cualquier pedido en vuelo y no toca el chat (tiene prueba).
- **Cumple (03-38):** el 429 del primer mensaje ofrece volver a la sesión anterior sin mandar nada, y `nuevaSesion()` ya no olvida el id guardado.
- **Cumple (03-31):** el error de vista previa depende de la causa. Solo el 404 sugiere el reinicio y marca el disco efímero.
- **Cumple (03-28):** `casoDelPanel` filtra del panel y de las marcas los casos refutados o vacíos. El listado ya no crea un bloque fantasma.
- **WARNING:** 03-36 reescribió el seguimiento con un ref síncrono y ventana de intención de 600 ms (`VENTANA_INTENCION_USUARIA_MS`). Tiene 10 pruebas de reductor, pero el defecto original de `deferred-items.md` (turno de 8 llamadas, pliegue de más de 6 tarjetas) no tiene re-verificación en navegador registrada en esta auditoría. Sigue siendo el flujo más demostrable ("Procesar los 4 casos").
- **WARNING (riesgo aceptado, 03-33):** un 401 transitorio deja la UI en `sin_clave` con el envío en pausa (03-34). Si `/api/health` sigue publicando `sin_clave`, "Comprobar de nuevo" no puede sacarla de ahí, y la única salida es un reinicio del servidor. Hay que documentarlo en SOLUCION.md o en el runbook de la defensa.
- **Info (sin re-verificar):** el hallazgo anterior de filas viejas con "Ver" y "Descargar" visibles después de "El servidor se reinició y los archivos se borraron" no aparece entre los planes 03-28..03-39 revisados.
- Auditoría de registro: no aplica (sin `components.json` ni registros de terceros).

---

## Archivos auditados

- `web/src/config/strings.ts`, `src/config/strings.ts`
- `web/src/components/aviso-modelo.tsx` y `.module.css`, `encabezado.module.css`, `linea-de-tiempo.tsx` y `.module.css`, `acciones-rapidas.tsx`, `tarjeta-confirmacion.tsx`, `panel-casos.module.css`, `lista-archivos.module.css`, `progreso-caso.module.css`
- `web/src/components/*.module.css` (grep de pesos, hex, `rgb()` y px)
- `.planning/milestones/v1-phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md`, `03-28/31/33/34/36/37/38-SUMMARY.md`, `deferred-items.md` y la `03-UI-REVIEW.md` anterior
