# Phase 5: Front web por features e identidad de marca - Context

**Gathered:** 2026-10-16
**Status:** Ready for planning

<domain>
## Phase Boundary

Refactor de `web/src` a una organización por features y por componente (vista, hook de lógica y estilos), con estado en un store propio, cero valores hardcodeados, guardianes W ampliados e identidad de marca de Periferia IT Group (logo, colores, tipografía, forma y estado vacío con las tarjetas de los 4 casos). La conducta no cambia: el contrato de la API, la conducta del agente y los flujos de la UI quedan iguales (FE-06). No se agregan capacidades nuevas al producto.

Requisitos: FE-01, FE-02, FE-03, FE-04, FE-05 y FE-06 (`.planning/REQUIREMENTS.md`).

</domain>

<decisions>
## Implementation Decisions

### Decisiones previas de la usuaria (bloqueadas, de `.planning/todos/pending/2026-10-16-decisiones-fase-5-front.md`)
- **D-01:** `web/src` se organiza en carpetas por feature (carpeta padre) y, dentro de cada una, una carpeta por componente con la vista `.tsx` (solo presentación), el hook `usar-<componente>.ts` (lógica) y el `.module.css`. Lo compartido va en una carpeta común. Cita de la usuaria: "carpeta por componente más carpeta padre con feature, así lo dejamos más limpio". — **Reversibility:** costly — mueve los ~25 componentes, los 6 hooks y sus imports, y reescribe los guardianes W.
- **D-02:** El estado vive en un store propio sin dependencias de runtime, con `useSyncExternalStore`, Context y selectores por slice, sobre los reductores puros existentes. Se descartaron Zustand (dependencia nueva que habría que justificar según PRD §8) y `useReducer` + Context solo.
- **D-03:** Nada hardcodeado en los componentes. Los textos van en `strings.ts`, los valores en `config/constants` y los colores, tamaños y espacios en tokens CSS. Las vistas no llevan lógica de negocio ni de red, y los guardianes W lo exigen. El criterio rector es "las mejores prácticas, lo mejor de la industria".
- **D-04:** La semilla SEED-261014-8dq entra en el alcance. Sigue chat-first y sin modo oscuro.
- **D-05:** Corrida **encadenada nocturna de corrido**, igual que la Fase 4: UI-SPEC → plan → ejecución → eli-qa con Playwright MCP → loop de brechas con tope de 3 rondas. La usuaria eligió **no** detenerse para revisar el UI-SPEC antes de planear.

### Dirección de marca (identidad de Periferia IT Group)
La usuaria pidió adoptar la identidad corporativa de https://periferiaitgroup.com/. Estos valores se extrajeron de su HTML y de `assets/css/style.css` el 2026-10-16:

| Token de su sitio | Valor | Uso |
|---|---|---|
| `--teal` / `theme-color` | `#063635` | Superficie de marca oscura (encabezado) |
| `--bright` | `#6dfd8c` | Neón, **solo sobre superficies oscuras** o como detalle no textual |
| `--dark` | `#15601d` | Acento interactivo sobre fondo claro |
| `--light` / `--muted` | `#ccffd6` / `#bfe8c0` | Tintes de acento suave |
| tintes | `#ecfff0`, `#f5fef7`, `#dceadd` | Fondos suaves |
| Títulos | Outfit 400–800 | |
| Cuerpo y botones | Montserrat 400–700 (botón: 700 de 14 px) | |
| Botones | `border-radius: 999px` (píldora) | |

Contraste medido: neón sobre blanco 1.31:1 (**prohibido para texto o controles sobre claro**), neón sobre teal 10.13:1, `#15601d` sobre blanco 7.71:1 (AAA) y teal sobre blanco 13.23:1.

- **D-06:** El nombre se mantiene: "Registro como proveedor" con el subtítulo "Periferia IT Group". La marca la ponen el logo, el color y la tipografía. Se llena el `<title>` real de `web/index.html` (hoy vacío), derivado de `TEXTO_APP.tituloDocumento`.
- **D-07:** **Encabezado teal `#063635`** con el logo blanco oficial y detalles en neón, como en su sitio. El cuerpo de la app sigue claro. Los botones primarios, los controles, el foco y los enlaces usan `#15601d` sobre claro. El neón solo va sobre el teal o en detalles no textuales.
- **D-08:** Tipografía **Outfit (títulos) + Montserrat (cuerpo y controles)**, **autoalojadas** como `.woff2` (subconjunto latino, con los pesos realmente usados) servidas desde `web/public`, con `@font-face` y `font-display: swap`. No se agrega ningún paquete npm y no hay petición a Google en tiempo de ejecución. Se incluye la licencia OFL de cada familia junto a los archivos. Con un respaldo de pila del sistema en los tokens `--fuente-*`.
- **D-09:** **Logo oficial** de Periferia: `https://periferiaitgroup.com/assets/img/periferia-it-group-1.webp` (blanco, para fondo oscuro) en el encabezado teal y en la pantalla de acceso. **Favicon oficial**: `https://periferiaitgroup.com/assets/img/favicon-3.jpg` (isotipo de arco neón con 5 puntos, 512×512), en lugar del `data:,` actual. Los archivos se **copian al repo** (`web/public/`) y nunca se cargan desde su dominio en tiempo de ejecución. El README o SOLUCION.md cita que el logo es marca de Periferia IT Group, usada porque la herramienta es interna para ellos. — **Reversibility:** reversible — se cambia el asset y un token.
- **D-10:** **Forma píldora** (`999px`) en botones y chips. Tarjetas, diálogos, compositor y avisos mantienen el radio de 8 px. Es un token nuevo, por ejemplo `--radio-pildora`.
- **D-11:** Los colores de estado (éxito, atención, error e info) se reajustan **a criterio de Claude en el UI-SPEC**. El verde de éxito actual `#1a6b41` casi coincide con la marca `#15601d`, así que "listo" no puede confundirse con "botón". Los estados se distinguen siempre por ícono y texto, nunca solo por color, y todos pasan AA.

### Estado vacío con los 4 casos
- **D-12:** Una sesión sin turnos muestra **las tarjetas de los casos arriba** y **los 3 chips de acción rápida debajo** (el prompt de la demo, procesar todos y listar, como exige UI-07). Después del primer turno el estado vacío desaparece y quedan los chips compactos, igual que hoy.
- **D-13:** **Clic en la tarjeta = envío directo** del pedido de la demo del PRD (sección 11) aplicado a ese caso: `Procesa el caso "<slug>". Dime qué campos quedaron llenos, cuáles faltan, si el paquete está listo para firma y qué soportes debo actualizar. No envíes nada todavía.` La plantilla vive en `web/src/config/strings.ts` y se deriva del mismo texto que `TEXTO_ACCIONES.mensajeDemo`, porque no se duplica el texto. La usuaria pidió explícitamente "sin salirnos de los requerimientos del reto". El clic no es una acción externa, así que RN4 y CA3 no cambian. Se deshabilita en las mismas condiciones que los chips (`envioDeshabilitado`).
- **D-14:** El contenido de la tarjeta **se deriva del slug, sin tocar la API**: `/api/config` sigue devolviendo `casos: string[]` (FE-06). Muestra el código de país del prefijo (`co`, `ec`, `pe`, `pa`, `hn`), el nombre del país desde una constante del front y el cliente humanizado del resto del slug (`industrias-delta` → "Industrias Delta"). El mapa de países va en `web/src/config/constants`, y si el prefijo no se conoce, la tarjeta muestra solo el slug.
- **D-15:** El país se muestra como **código en una píldora** ("CO", "EC", "HN", "PA") con el tinte verde de la marca. Sin emoji de bandera.

### Pruebas del front
- **D-16:** Se agregan **Testing Library (`@testing-library/react`, y `@testing-library/user-event` si hace falta) + `happy-dom`** como **devDependencies** para probar los componentes con interacción. **Esto modifica el criterio de éxito 2 del ROADMAP** ("no hay dependencias nuevas en `package.json`"), que pasa a decir: no hay dependencias de **runtime** nuevas, y las únicas devDeps nuevas son las de prueba del front, con versión exacta fijada y justificadas en `SOLUCION.md`. El store sigue sin dependencias (FE-02 intacto). Las pruebas puras de los reductores en `tests/web/` se conservan. — **Reversibility:** reversible — son devDeps de prueba.
- **D-17:** La regresión de FE-06 la **garantiza eli-qa de punta a punta**, con todo completo: la regresión técnica (`bun run check`, `bun test`, `demo.ts`, `build:web` y CI) más la QA de navegador de todos los flujos (acceso, estado vacío y tarjetas, turno con herramientas, confirmación, panel de casos, archivos y vista previa, nueva sesión, errores y avisos, y layouts ancho y angosto) en local y en el link público, con el ensayo del pedido de la demo. La conducta se compara antes y después del refactor.
- **D-18:** La QA de navegador sigue con **Playwright MCP en eli-qa**, como en las fases 3 y 4, con la evidencia en `.planning`. No se agrega `@playwright/test` al repo.

### Símbolo "§"
- **D-19:** **No se usa el símbolo "§" en ningún texto visible del front web ni de la CLI.** Hoy aparece en `web/src/config/strings.ts:272` (`DEMO_CORTO = "Demo §11"`) y en `src/config/strings.ts:509` (`turnoOk`: "…del guion del PRD §11 OK."). Se reescriben con palabras, por ejemplo "Pedido de la demo" o "sección 11 del PRD", y un guardián lo vigila en `web/src/config/strings.ts` y en los textos de la CLI. La documentación (README, SOLUCION y docs) queda como está.

### Mapa de features
- **D-20:** Estructura aprobada:
  ```
  web/src/
    features/
      acceso/        pantalla-acceso
      encabezado/    encabezado, aviso-modelo (usar-salud)
      chat/          linea-de-tiempo, mensaje, indicador-pensando, compositor,
                     acciones-rapidas, estado-vacio (nuevo), tarjeta-caso (nuevo)
      herramientas/  grupo-herramientas, tarjeta-herramienta
      confirmacion/  tarjeta-confirmacion (pila)
      casos/         panel-casos, progreso-caso, tarjeta-resultado
      archivos/      lista-archivos, dialogo-vista-previa, aviso-disco-efimero (usar-archivos)
      sesion/        dialogo-nueva-sesion
      disposicion/   barra-pestanas (extraída de app.tsx), columnas (usar-diseno, usar-pestanas)
    compartido/      aviso, iconos
    store/  api/  config/  styles/  types/
    app.tsx          solo providers + disposicion
    main.tsx
  ```
  Dentro de cada feature va una carpeta por componente: `features/<feature>/<componente>/{<componente>.tsx, usar-<componente>.ts, <componente>.module.css}`. — **Reversibility:** costly — es la base sobre la que se reescriben los guardianes W.
- **D-21:** **Cada reductor puro va junto a su feature** (por ejemplo `features/confirmacion/estado/confirmaciones.ts`) y `web/src/store/` arma el store único, el Context y los selectores combinando los slices. Los reductores siguen sin React ni DOM (la regla actual de `state/` se traslada a la nueva ubicación). `usar-chat.ts` se absorbe en el store y en los hooks por feature.
- **D-22:** Los textos siguen en un **único `web/src/config/strings.ts`** (regla vigente de CLAUDE.md y W).
- **D-23:** **`web/src/api/` es transversal**. Solo la importan los hooks `usar-*.ts` y el store, nunca una vista `.tsx`, y un guardián W lo exige. `sesion-local.ts` sigue siendo el único lugar con `localStorage`.

### Claude's Discretion
- El tono exacto de los colores de estado (D-11), los tamaños de la escala tipográfica y la jerarquía, siempre que pasen AA y respeten la paleta de Periferia.
- El aspecto de las tarjetas de caso (disposición en grilla, hover y foco) y de la pantalla de acceso con la marca.
- Si los tipos se colocan por feature (`features/<f>/types/*.type.ts`) o siguen en `web/src/types/`, manteniendo la invariante de "solo `type` en `*.type.ts`" y ajustando W en consecuencia.
- La organización de `tests/web/` (espejo por feature o no) y qué componentes llevan prueba con Testing Library, priorizando los de interacción (compositor, tarjeta de confirmación, tarjetas de caso, diálogos y pestañas).
- La nomenclatura de los guardianes nuevos (W14 en adelante) y cómo se reescriben W1–W13 para las nuevas rutas.
- Los micro-movimientos (transiciones), siempre con tokens de duración y respetando `prefers-reduced-motion`.

### Folded Todos
- **Decisiones de la usuaria para la Fase 5** (`.planning/todos/pending/2026-10-16-decisiones-fase-5-front.md`): las decisiones previas de estructura, estado, calidad, alcance y modo de corrida quedan en D-01 a D-05. Las 4 áreas grises que dejaba abiertas se resolvieron en esta discusión (D-06 a D-23).

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Requisitos y alcance
- `.planning/ROADMAP.md`: Phase 5, objetivo y criterios de éxito. **El criterio 2 queda modificado por D-16.**
- `.planning/REQUIREMENTS.md`: FE-01 a FE-06, y UI-01 a UI-09 (los flujos que no pueden cambiar).
- `.planning/todos/pending/2026-10-16-decisiones-fase-5-front.md`: decisiones previas de la usuaria (incorporadas).
- `.planning/seeds/SEED-261014-8dq-identidad-de-marca-chat-web.md`: la semilla de identidad de marca.
- `reto-01/PRD.md`: §6.1 (componentes obligatorios del front: historial, entrada, "pensando", tool calls visibles y confirmación resaltada), §3 ("procesa la solicitud X"), §8 (dependencias y seguridad) y §11 (el pedido de la demo que usan las tarjetas). **No se modifica.**

### Contrato visual y de interacción vigente
- `.planning/phases/03-chat-web-api-sse-y-despliegue/03-UI-SPEC.md`: el sistema de diseño, el layout, el contrato de interacción por componente, el copy y la accesibilidad. El UI-SPEC de la Fase 5 lo **extiende**, no lo reemplaza: los contratos de interacción siguen vigentes.
- `.planning/phases/03-chat-web-api-sse-y-despliegue/03-CONTEXT.md`: las decisiones D-5x/D-6x/D-7x del front que siguen en pie.

### Identidad de marca (fuente externa)
- https://periferiaitgroup.com/ y https://periferiaitgroup.com/assets/css/style.css: los tokens de color y las tipografías (resumidos en la tabla de D-06…D-11).
- https://periferiaitgroup.com/assets/img/periferia-it-group-1.webp: el logo blanco oficial.
- https://periferiaitgroup.com/assets/img/favicon-3.jpg: el favicon o isotipo oficial.
- Outfit y Montserrat: Google Fonts (licencia OFL), autoalojadas.

### Reglas de código y guardianes
- `.claude/CLAUDE.md`: las reglas del front web (`web/`) y del proyecto (sin comentarios, sin `enum`, textos en `strings.ts`, alias `@web/`, tokens CSS y los paquetes permitidos en `web/src`).
- `tests/arquitectura-web.test.ts`: W1–W13 actuales, que se reescriben y amplían.
- `tests/sin-comentarios.test.ts`: también cubre `web/**/*.{ts,tsx,css}` e `index.html`.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `web/src/state/*.ts` (casos, confirmaciones, conversacion, hidratacion, modelo, seguimiento y vista-previa): reductores y selectores puros, ya probados en `tests/web/`. Son los slices del store nuevo.
- `web/src/api/` (`cliente-api.ts`, `flujo-chat.ts` con SSE por `eventsource-parser`, `sesion-local.ts` y `descarga-local.ts`): quedan transversales (D-23).
- `web/src/components/acciones-rapidas.tsx`: los chips y `TEXTO_ACCIONES.mensajeDemo`, que es la base de la plantilla de la tarjeta de caso (D-13).
- `web/src/components/linea-de-tiempo.tsx` → `EstadoVacio`: el punto de inserción de las tarjetas (D-12).
- `web/src/components/icons/iconos.tsx` → `compartido/iconos`.
- `web/src/styles/tokens.css`: ya centraliza espacios, tipografía, colores, radios y tamaños. Aquí entran los tokens de Periferia, `--radio-pildora` y las fuentes.

### Established Patterns
- Las vistas reciben props tipadas desde `web/src/types/ui.type.ts`, y `app.tsx` orquesta con `useChat` (≈250 líneas, incluida `BarraDePestanas`, que se extrae a `disposicion/`).
- Las pruebas del front hoy son sin DOM: leen el código fuente o prueban los reductores (`tests/web/*.test.ts`, 11 archivos).
- Los mensajes del servidor se muestran como texto con `white-space: pre-wrap`, nunca como HTML ni markdown (regla W).
- `/api/config` devuelve `{ casos: string[], fechaEjecucion, zona, mensajeMaximo, … }` (`src/http/types/api.type.ts`), y el front no debe exigir más campos.

### Integration Points
- `web/index.html`: hoy tiene `<title></title>` y el favicon `data:,`, así que hay que llenar el título y el favicon (D-06, D-09).
- `web/public/`: los assets de marca y las fuentes, que el Dockerfile y `build:web` deben incluir. Hay que verificar que `web/dist` los lleve en Render.
- `package.json`: las devDeps de prueba nuevas (D-16), con versión exacta, más un preload de happy-dom para `bun test` (por ejemplo en `bunfig.toml`) que no afecte las pruebas del backend.
- `src/config/strings.ts:509`: el texto de la CLI con "§" (D-19).

</code_context>

<specifics>
## Specific Ideas

- "Valida la marca corporativa de ellos, para mantener esa identidad gráfica" (periferiaitgroup.com): el chat debe sentirse de Periferia.
- Su sitio usa botones píldora neón con texto negro sobre fondos teal. Aquí el neón se reserva para la superficie teal del encabezado, porque sobre blanco no pasa contraste.
- La solución de referencia de otro participante (https://registro-proveedor-cvqp.onrender.com/) es solo inspiración visual y no un modelo: allá el chat va en un botón flotante y aquí es chat-first.
- La usuaria no quiere el símbolo "§" en la interfaz: le parece "raro".

</specifics>

<deferred>
## Deferred Ideas

- Quitar el "§" también de README, SOLUCION.md y `docs/`: la usuaria lo limitó a la web y la CLI. Si se quiere después, es una tarea rápida de docs.
- Una suite e2e versionada con `@playwright/test` en CI: se descartó por ahora (D-18).
- Enriquecer `/api/config` con cliente, país y formato por caso: se descartó para no cambiar el contrato (D-14).
- Modo oscuro: sigue fuera de alcance (REQUIREMENTS.md).

</deferred>

---

*Phase: 05-front-web-por-features-e-identidad-de-marca*
*Context gathered: 2026-10-16*
