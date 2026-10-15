---
phase: "3"
slug: "chat-web-api-sse-y-despliegue"
status: approved
reviewed_at: "2026-10-14"
shadcn_initialized: false
preset: none
created: "2026-10-14"
---

# Phase 3 — UI Design Contract

> Contrato visual y de interacción del chat web (`web/`). Lo generó gsd-ui-researcher y lo verifica gsd-ui-checker.
> Fuentes: 03-CONTEXT.md (D-64..D-73 bloqueadas; el diseño visual es discreción de esta fase), REQUIREMENTS.md (UI-01..UI-09, API-01..API-05, LLM-06 según D-70 reescrita), PRD §6.1, §6.3, §6.4 y §11, STACK.md y FEATURES.md (DF-04, DF-05, DF-11, DF-14).
> Los valores marcados **[default]** los fijó esta fase sin pregunta a la usuaria, porque CONTEXT.md delega todo el diseño visual a `/gsd-ui-phase 3`.

---

## Design System

| Property | Value |
|----------|-------|
| Tool | none (sin shadcn, por decisión de stack: "Tailwind / component kits (MUI, shadcn): no" en STACK.md y en las restricciones de la fase) |
| Preset | not applicable |
| Component library | none: componentes propios con elementos HTML nativos (`<dialog>`, `<details>/<summary>`, `<button>`, `<a download>`, `<textarea>`) |
| Styling | CSS Modules de Vite (sin dependencias) más una sola hoja global `web/src/styles/tokens.css` con las variables CSS de este contrato. Prohibidos los valores sueltos de color, tamaño o espaciado fuera de `tokens.css`. |
| Icon library | none: un único módulo de íconos SVG en línea (`web/src/components/icons/`), 16 px y 20 px, `stroke: currentColor`, `aria-hidden="true"`. Set cerrado: `check`, `x`, `alerta`, `chevron`, `descargar`, `ojo`, `reloj`, `girando`, `info`. |
| Font | Pila del sistema, sin descargar fuentes (arranque rápido en Render): `system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Monoespaciada (nombres de herramienta, args, rutas, vista previa de `.md`): `ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`. |
| Tema | Solo claro **[default]**. Sin modo oscuro en esta fase. |
| Markdown | No se renderiza markdown. Todo texto del agente y toda vista previa de `.md` va como texto plano con `white-space: pre-wrap` (D-46, D-60). Prohibido `dangerouslySetInnerHTML`. |
| Textos | Todo texto propio del front vive en un único `web/src/config/strings.ts` (espejo de la regla de `src/config/strings.ts`). Los mensajes que produce el servidor (errores del agente, D-73, aviso de sesión expirada) se muestran tal como llegan y **no** se duplican en el front. El front solo tiene copia propia para lo que detecta él mismo (red caída, stream cortado, validación local de largo). |
| Códigos | Tipos de evento, estados de campo, estados del LLM, etapas y nombres de herramienta son objetos `as const` (nunca `enum`). Recomendación al planner: importarlos de la config pura del backend (`src/config/constants/**`) para no duplicarlos, si los guardianes G1–G16 lo permiten para `web/`. Si no, se copian en `web/src/config/constants/` con un test de igualdad. |

---

## Componentes propios (contrato de esta fase)

Could not enumerate: no hay sistema de diseño instalado (Tool: none, CSS propio por decisión de stack); la tabla lista los componentes que esta fase construye, no los exports de un paquete. Es un conjunto de partida, no una lista cerrada: el executor puede agregar un componente que respete los tokens y el contrato sin bloquearse.

| Componente | Elemento base | Responsabilidad |
|------------|---------------|-----------------|
| `PantallaAcceso` | `<main>` + `<form>` | Pide el código una vez (D-72). Es la única pantalla antes del acceso. |
| `Encabezado` | `<header>` | Título, fecha de ejecución efectiva (UI-09), estado del modelo y botón "Nueva sesión". |
| `AvisoModelo` | `<div role="status">` | Banner del estado del LLM (D-70, D-71): título y detalle por estado más el botón secundario "Comprobar de nuevo". Se oculta cuando el estado es `disponible`. |
| `LineaDeTiempo` | `<section aria-label>` + `<ol>` | Historial del chat: mensajes, grupos de herramientas, tarjetas de confirmación, tarjetas de resultado y avisos. |
| `MensajeUsuaria` / `MensajeAgente` | `<li>` | Burbujas de texto plano `pre-wrap`. |
| `GrupoHerramientas` | `<details>` | Agrupa las tool calls de un turno. |
| `TarjetaHerramienta` | `<details>/<summary>` | Una tool call colapsable (UI-02). |
| `IndicadorPensando` | `<div role="status">` | "Pensando…" y la herramienta en curso (UI-01). |
| `TarjetaConfirmacion` | `<article>` | Un caso pendiente con Confirmar y Cancelar (UI-03, D-68, D-69). |
| `TarjetaResultado` | `<article>` | Resultado estructurado de un caso (UI-05, DF-04). |
| `AvisoError` / `AvisoSistema` | `<div role="alert">` / `<div role="status">` | Errores en lenguaje claro (UI-04, D-73) y avisos (sesión expirada). |
| `AccionesRapidas` | `<div role="group">` de `<button>` | Chips (UI-07, DF-11). |
| `Compositor` | `<form>` + `<textarea>` | Entrada, contador y botones "Enviar mensaje" / "Detener respuesta". |
| `PanelCasos` | `<aside>` | Un bloque por caso: `ProgresoCaso` y `ListaArchivos`. |
| `ProgresoCaso` | `<ol>` | Las seis etapas (UI-08). |
| `ListaArchivos` | `<ul>` | Archivos del caso con "Ver" y "Descargar" (UI-06, D-64..D-67). |
| `DialogoVistaPrevia` | `<dialog>` modal | Vista previa enmascarada (D-65). |
| `DialogoNuevaSesion` | `<dialog>` modal | Confirmación de la acción destructiva "Nueva sesión". |

Estado del front: un `useReducer` alimentado por los eventos SSE (`turn_start`, `tool_start`, `tool_end`, `text`, `confirmation_required`, `usage`, `error`, `turn_end`) y por la hidratación desde `GET /api/sessions/:id`. Cada componente pinta solo desde ese estado; ninguna decisión de negocio (cerrar una tarjeta de confirmación, marcar una etapa) se toma en la UI sin un evento del servidor (D-69).

---

## Layout

### Pantalla principal (≥ 1024 px)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ Encabezado (alto 56 px, fondo secundario)                                │
│ Registro como proveedor · Periferia IT Group   [Fecha de ejecución 2026-09-03] [● deepseek-flash · Disponible] [Nueva sesión] │
├──────────────────────────────────────────────────────────────────────────┤
│ AvisoModelo (solo si llm ≠ disponible, ancho completo)                   │
├────────────────────────────────────────────────┬─────────────────────────┤
│ Columna de chat (flexible, fondo dominante)    │ PanelCasos (384 px,     │
│   LineaDeTiempo (scroll propio,                │ fondo secundario,       │
│   contenido centrado, ancho máx. 768 px)       │ scroll propio)          │
│                                                │  Casos de esta sesión   │
│                                                │  ┌ ec-corp-andina ────┐ │
│                                                │  │ ProgresoCaso        │ │
│                                                │  │ ListaArchivos       │ │
│                                                │  └─────────────────────┘ │
│   AccionesRapidas                              │                         │
│   Compositor (fijo abajo)                      │                         │
└────────────────────────────────────────────────┴─────────────────────────┘
```

- **Punto focal (ancla visual primaria):** la columna de chat. Dentro de ella, cuando existe, la `TarjetaConfirmacion` abierta es el elemento de mayor peso visual de la pantalla (borde izquierdo de 4 px y fondo de atención). Sin confirmación abierta, el ancla es la última respuesta del agente seguida de su `TarjetaResultado`.
- **Jerarquía (orden en que se lee):** 1) tarjeta de confirmación abierta; 2) banner del modelo si hay problema; 3) última respuesta y tarjeta de resultado; 4) compositor; 5) panel de casos; 6) encabezado.
- La columna de chat y el panel tienen scroll independiente; el encabezado y el compositor quedan fijos.
- Alto total `100dvh`; sin scroll del `body`.

### Pantallas angostas

| Ancho | Comportamiento |
|-------|----------------|
| ≥ 1024 px | Dos columnas como arriba. |
| 640–1023 px | El panel de casos sale de la grilla. Bajo el encabezado aparece una barra de pestañas de 40 px con "Chat" y "Casos y archivos" (`role="tablist"`). Un punto de 8 px de acento en la pestaña "Casos y archivos" indica cambios no vistos. |
| < 640 px | Igual que arriba, con menos cromo fijo. El encabezado va en dos líneas: título arriba; fecha, estado del modelo y "Nueva sesión" abajo, en una sola fila sin partir (elipsis si no cabe). La fecha muestra solo el valor ("2026-09-03") y el estado del modelo solo su etiqueta ("Sin clave válida"): los prefijos "Fecha de ejecución " y "{modelo} · " quedan ocultos a la vista pero presentes para lectores de pantalla, que leen el texto completo. Las burbujas ocupan el 100 % del ancho. Los chips usan `flex-wrap` y **no** hacen scroll horizontal (decisión de la usuaria, 2026-10-14); en la franja compacta sobre el compositor (con historial) llevan las etiquetas cortas "Demo §11" y "Los {n} casos", con `aria-label` igual a la etiqueta completa y el mismo mensaje. "Ir al final" queda solo con ícono (ver LineaDeTiempo). |

### Pantalla de acceso

Tarjeta centrada de 400 px de ancho máximo sobre el fondo dominante, con 32 px de padding: título display, texto de ayuda, campo, botón primario a ancho completo y línea de error debajo del campo. Punto focal: el campo del código, que recibe el foco al cargar.

---

## Spacing Scale

Declared values (must be multiples of 4):

| Token | Value | Usage |
|-------|-------|-------|
| xs | 4px | Gap entre ícono y texto, gap entre punto de estado y etiqueta, padding vertical de badges |
| sm | 8px | Gap entre tarjetas de herramienta, padding horizontal de badges, padding vertical de chips y de filas de archivo, gap entre etapas del progreso |
| md | 16px | Padding interno de burbujas y tarjetas, padding horizontal de botones y chips, gap entre elementos de la línea de tiempo, padding horizontal del encabezado |
| lg | 24px | Padding del panel de casos y del compositor, separación entre bloques de caso, padding de los diálogos |
| xl | 32px | Padding de la tarjeta de acceso, separación entre turnos de la conversación |
| 2xl | 48px | Margen superior del estado vacío de la conversación |
| 3xl | 64px | Margen superior de la tarjeta de acceso en pantallas ≥ 640 px |

Dimensiones fijas (tamaños de caja, no espaciado; todas múltiplos de 4): encabezado 56 px; barra de pestañas 40 px; alto mínimo de botones, chips, campo de código y filas clicables 40 px; panel de casos 384 px; ancho máximo del contenido del chat 768 px; tarjeta de acceso 400 px; `textarea` del compositor de 72 px (3 líneas) hasta 200 px, con scroll interno después; bloques `<pre>` de args y vistas previas con alto máximo de 240 px (en el diálogo, 60 vh) y scroll; diálogo de vista previa de hasta 960 px de ancho y 80 vh de alto; radio de borde 8 px en tarjetas, burbujas y diálogos y 4 px en badges y botones; borde de 1 px; borde de atención de 4 px.

Exceptions: el anillo de foco usa 2 px de grosor y 2 px de offset, que no es espaciado de layout sino un trazo de accesibilidad. No hay otros valores de espaciado.

---

## Typography

| Role | Size | Weight | Line Height |
|------|------|--------|-------------|
| Body | 16px | 400 | 1.5 (24px) |
| Label | 14px | 400 (600 en badges, nombres de etapa activos, encabezados de tabla y etiquetas de campo) | 1.43 (20px) |
| Heading | 20px | 600 | 1.2 (24px) |
| Display | 28px | 600 | 1.2 (≈34px) |

Uso por rol:
- **Body 16/400:** mensajes de la usuaria y del agente, texto del compositor, cuerpo de los avisos y del banner.
- **Label 14:** metadatos (hora, estado), nombres de herramienta y args (monoespaciada, 14/400), resumen de herramienta, chips, badges, filas de archivo, etapas del progreso, celdas de la vista previa, contador de caracteres y botones.
- **Heading 20/600:** título de la app en el encabezado, título del caso en `TarjetaResultado` y en el panel, título de `TarjetaConfirmacion`, títulos de los diálogos, título del estado vacío y números de los contadores (lleno, faltante, por confirmar).
- **Display 28/600:** solo el título de la pantalla de acceso.

Solo dos pesos: 400 y 600. Sin cursivas para dar énfasis: el énfasis va en 600. Los números de los contadores usan `font-variant-numeric: tabular-nums`. El texto largo se ajusta con `overflow-wrap: anywhere` (ids de caso, rutas, args).

---

## Color

| Role | Value | Usage |
|------|-------|-------|
| Dominant (60%) | `#FFFFFF` | Fondo de la columna de chat, de la pantalla de acceso, de burbujas del agente, de tarjetas y de diálogos |
| Secondary (30%) | `#F3F5F7` | Encabezado, panel de casos, barra de pestañas, fondo del compositor, cuerpo expandido de las tarjetas de herramienta, chips, encabezado de tabla de la vista previa |
| Accent (10%) | `#1F5FBF` | Solo los elementos de la lista "Accent reserved for" |
| Destructive | `#B42318` | Botón "Empezar sesión nueva" dentro de `DialogoNuevaSesion` y nada más como acción |

Colores neutros de soporte:

| Token | Value | Uso |
|-------|-------|-----|
| `--texto` | `#1B1F24` | Texto principal (contraste 16:1 sobre blanco) |
| `--texto-tenue` | `#57606A` | Metadatos, ayudas, placeholders, etapas pendientes (6.4:1 sobre blanco, 5.9:1 sobre `#F3F5F7`) |
| `--borde` | `#D0D7DE` | Bordes de tarjetas, campos, divisores |
| `--acento-suave` | `#EAF1FB` | Fondo de las burbujas de la usuaria (tinte del acento; no cuenta como uso del acento) |

Colores semánticos (estado, no decoración; cada uno con su texto, fondo y borde y siempre acompañado de texto o ícono, nunca solo color):

| Semántica | Texto / ícono | Fondo | Borde | Se usa en |
|-----------|---------------|-------|-------|-----------|
| Éxito | `#1A6B41` | `#EAF6EF` | `#1A6B41` | Estado `lleno`, badge "Listo para firma", herramienta "Correcta", etapa hecha, modelo "Disponible" |
| Atención | `#8A4B08` | `#FFF8EB` | `#B45309` | Estado `requiere_confirmacion` ("Por confirmar"), `TarjetaConfirmacion` (borde izquierdo de 4 px), etapa "Esperando confirmación", banner `no_disponible` y `tope_diario`, aviso de disco efímero |
| Error | `#B42318` | `#FDECEA` | `#B42318` | Estado `faltante`, badge "No listo para firma", bloqueos, herramienta "Error", etapa con error, `AvisoError`, banner `sin_clave` y `saldo_agotado`, error del campo de código |
| Información | `#57606A` | `#F3F5F7` | `#D0D7DE` | `AvisoSistema` (sesión expirada), etapa cancelada |

Contraste: todo par texto/fondo de esta sección cumple WCAG AA (≥ 4.5:1). El blanco sobre el acento (`#1F5FBF`) da 6.3:1 y sobre el destructivo (`#B42318`) 6.2:1.

Accent reserved for (lista cerrada):
1. El fondo del botón primario "Enviar mensaje" del compositor.
2. El fondo del botón primario "Entrar al agente" de la pantalla de acceso.
3. El fondo del botón "Confirmar envío simulado" de `TarjetaConfirmacion`.
4. El anillo de foco visible de todo elemento interactivo (`outline: 2px solid #1F5FBF; outline-offset: 2px`).
5. La etapa "en curso" de `ProgresoCaso` y el ícono girando de la `TarjetaHerramienta` en curso.
6. Los enlaces de texto "Ver" y "Descargar" de `ListaArchivos`.
7. El punto de 8 px de "cambios no vistos" en la pestaña "Casos y archivos" (pantallas angostas).

Ningún otro elemento usa el acento. Los botones secundarios ("Cancelar envío", "Nueva sesión", "Detener respuesta", "Seguir en esta sesión", "Cerrar vista previa") son blancos con borde `--borde` y texto `--texto`. Los chips usan el fondo secundario con borde `--borde`.

---

## Contrato de interacción por componente

### PantallaAcceso (D-72, UI-09)
- Se muestra si no hay acceso (sin cookie válida) o si cualquier endpoint protegido responde 401.
- El campo es `type="password"` con `autocomplete="current-password"` y un botón de texto "Mostrar código" / "Ocultar código" (40 px de alto, accesible por teclado).
- Al enviar: `POST /api/acceso`. El botón muestra "Verificando…" y queda deshabilitado mientras la petición está en curso. El código **nunca** se guarda en `localStorage` ni en `sessionStorage`, ni en el estado después de la respuesta (el campo se vacía al tener éxito).
- Error: el campo queda con borde de error, `aria-invalid="true"`, y el mensaje se asocia con `aria-describedby`. El foco vuelve al campo.

### Encabezado (UI-09, UI-08)
- Fecha: chip neutro "Fecha de ejecución 2026-09-03" (formato ISO, el mismo de los artefactos). El valor sale del servidor, **nunca** del reloj del navegador. Si no llegó, se muestra "Fecha de ejecución —".
- Estado del modelo: punto de 8 px de color semántico más el texto "{modelo} · {estado}" (ver Copywriting). Nunca solo color.
- "Nueva sesión" abre `DialogoNuevaSesion`. Está deshabilitado mientras corre un turno.

### AvisoModelo (D-70 reescrita, D-71, D-71.1)
- Origen: `GET /api/health` (campo `llm`). Se consulta al cargar la app, al volver el foco a la pestaña (`visibilitychange`), al terminar cada pedido de chat (turno correcto, error, rechazo HTTP, red caída, stream cortado o "Detener respuesta") y con el botón "Comprobar de nuevo". **Sin sondeo por intervalo** (no despertar Render ni gastar nada). Health nunca llama al modelo.
- Contenido: ancho completo bajo el encabezado, ícono, un título (600) que dice qué pasa y un detalle que dice qué sigue funcionando, qué hacer y cuándo vuelve (copia por estado en Copywriting). Todo detalle empieza con "Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos.". Sin botón de cerrar (refleja el estado del servidor). Para `disponible` no se pinta nada.
- Botón secundario "Comprobar de nuevo" (fondo dominante, borde `--borde`, alto `--alto-control`, anillo de foco global): solo relee `GET /api/health`. Mientras hay un pedido de health en vuelo, sea del botón o de un refresco automático, dice "Comprobando…" y queda deshabilitado. No toca el chat.
- Pausa del envío **solo en `sin_clave` y `tope_diario`**: el compositor (campo, "Enviar mensaje" y Enter), los chips de `AccionesRapidas`, el chip de reproceso del panel y los botones de las tarjetas de confirmación quedan deshabilitados. El compositor muestra su ayuda de pausa y las tarjetas la suya (ver Copywriting).
- En `saldo_agotado` y `no_disponible` la entrada **sigue habilitada**, porque solo una llamada correcta limpia esos estados. Con health sin respuesta (todavía `null`) también sigue habilitada. La pausa es solo UX: el servidor sigue siendo la compuerta (503 sin clave, 429 por tope diario).
- La UI nunca menciona comandos ni scripts.

### LineaDeTiempo
- Orden por turno: mensaje de la usuaria → `GrupoHerramientas` → `MensajeAgente` (eventos `text`) → `TarjetaResultado` (una por caso con herramientas en ese turno) → `TarjetaConfirmacion` (una por caso pendiente) → `AvisoError` si hubo `error`.
- Auto-scroll **por intención de la usuaria** (G-03-04, G-03-20): la línea de tiempo sigue el final mientras está pegada. Solo un desplazamiento que la usuaria inicia (rueda, toque, puntero o las teclas PageUp, PageDown, flechas arriba y abajo, Home, End y Espacio), medido dentro de una ventana corta tras esa intención, la despega o la vuelve a pegar (a ≤ 96 px del fondo). El scroll que hace la propia bajada al final y el del anclaje del navegador no apagan el seguimiento.
- Re-anclaje al enviar: cada mensaje nuevo de la usuaria (y la hidratación) vuelve a pegar la vista al final.
- Mientras sigue el final, el contenedor lleva `overflow-anchor: none`, para que el navegador no la mueva al insertar contenido arriba de lo visible.
- Si la usuaria subió y llega contenido nuevo, aparece el botón flotante "Ir al final" (secundario, abajo a la derecha de la columna), con el ícono de chevron hacia abajo y el texto. En < 640 px queda solo con el ícono, de `--alto-control` × `--alto-control`, con `aria-label="Ir al final"`. Pulsarlo baja y vuelve a pegar la vista.
- Región viva: un único `<div aria-live="polite" class="sr-only">` anuncia solo los cambios de estado ("Ejecutando Mapear campos de ec-corp-andina", "Respuesta lista", "Confirmación requerida para ec-corp-andina"), nunca cada fragmento de texto.

### IndicadorPensando (UI-01)
- Aparece desde que se manda el mensaje hasta `turn_end`, al final de la línea de tiempo.
- Sin herramienta en curso: "Pensando…". Con `tool_start` abierto: "{Etiqueta de herramienta} · {caso}…" (por ejemplo "Mapeando campos · ec-corp-andina…").
- Si a los 10 s no llegó ningún evento, agrega una segunda línea tenue: "El servidor puede estar despertando; la primera respuesta tarda hasta un minuto." (Render free duerme).
- Con `prefers-reduced-motion: reduce`, el ícono girando se reemplaza por el ícono de reloj estático.

### GrupoHerramientas y TarjetaHerramienta (UI-02, CA4)
- Grupo: `<details>` abierto mientras corre el turno. Resumen: "{n} llamadas a herramientas · {k} correctas · {e} con error" (singular "1 llamada a herramienta"). Al terminar el turno se cierra solo si tiene más de 6 tarjetas; si no, queda abierto.
- Tarjeta colapsada (fila de 40 px): ícono de estado, etiqueta humana en 14/600 ("Mapear campos"), caso en monoespaciada, badge de estado ("En curso" / "Correcta" / "Error") y una línea de resumen truncada con elipsis.
- Tarjeta expandida (fondo secundario, padding 16 px):
  - "Herramienta": nombre técnico exacto en monoespaciada (`proveedor_mapear_campos`), porque el evaluador debe verlo (PRD §6.1).
  - "Argumentos": JSON redactado del servidor, con sangría de 2 espacios, en `<pre>` de alto máximo 240 px con scroll. Nunca muestra un valor del maestro (D-47).
  - "Resultado": el `resumen` completo, `pre-wrap`.
  - Si `ok: false`: "Código: {codigo}" en monoespaciada, con color de error.
- Teclado: `<summary>` nativo (Enter y Espacio expanden y colapsan); el foco visible usa el anillo de acento.

Etiquetas humanas de herramienta (en `web/src/config/strings.ts`):

| Herramienta | Etiqueta | Gerundio para el indicador |
|-------------|----------|----------------------------|
| `proveedor_leer_solicitud` | Leer solicitud | Leyendo la solicitud |
| `proveedor_mapear_campos` | Mapear campos | Mapeando campos |
| `proveedor_generar_formulario` | Generar formulario | Generando el formulario |
| `proveedor_armar_paquete` | Armar paquete | Armando el paquete |
| `proveedor_simular_envio` | Simular envío | Registrando el envío simulado |
| otra (desconocida) | el nombre técnico tal cual | Ejecutando {nombre} |

### TarjetaConfirmacion (UI-03, CA3, D-68, D-69)
- Una tarjeta por caso pendiente (`confirmation_required`), con fondo de atención, borde de 1 px y borde izquierdo de 4 px de atención, más el ícono de alerta.
- Contenido: título; "Caso: {caso}" (monoespaciada); "Acción: Envío simulado"; estado del paquete (badge "Listo para firma" o "No listo para firma"); si hay bloqueos, la lista "Bloqueos" (uno por línea, color de error) y la advertencia "Se registrará con {n} bloqueo(s)."; nota tenue fija.
- Botones: "Confirmar envío simulado" (primario, acento) y "Cancelar envío" (secundario). Cada botón manda a `POST /api/chat` el texto visible **y** `accion: { tipo, caso }` (D-68). El texto visible queda como mensaje de la usuaria en la línea de tiempo.
- Al hacer clic, los dos botones de **esa** tarjeta se deshabilitan y muestran "Enviando…" en el que se pulsó, hasta `turn_end`. La tarjeta **no** se cierra por la UI: se cierra o sigue abierta según los eventos del turno siguiente (D-69).
- Mientras corre cualquier turno, los botones de todas las tarjetas abiertas están deshabilitados (`aria-disabled`, con el texto de ayuda "Espera a que termine la respuesta actual.").
- Con el envío en pausa (`sin_clave` o `tope_diario`, ver AvisoModelo), Confirmar y Cancelar de todas las tarjetas abiertas quedan deshabilitados con la ayuda "Podrás confirmar o cancelar cuando el modelo vuelva a estar disponible.". Si además corre un turno, la ayuda es la de turno en curso. La pausa no cambia el estado de ninguna tarjeta (D-69).
- Estados terminales (sin botones; la tarjeta se queda en el historial con opacidad normal y un badge): "Envío registrado" (éxito), "Envío cancelado" (información), "Reemplazada por una confirmación nueva" (información, cuando un turno posterior la vuelve a pedir).
- Al recargar, las tarjetas de `pendientes` vigentes de `GET /api/sessions/:id` se vuelven a pintar con botones; las de turnos resueltos, sin botones (D-69).
- El compositor sigue activo con tarjetas abiertas (D-69), salvo con el envío en pausa.

### TarjetaResultado (UI-05, DF-04)
- Se construye **solo** con datos de las herramientas (del evento `tool_end` o de la hidratación), nunca con el texto del modelo.
- Encabezado: "{caso}" (Heading 20/600, fuente base) más dos badges neutros: formato ("XLSX", "PDF" o "Portal") y país ("EC").
- Contadores: tres celdas en fila (número 20/600 y etiqueta 14/400 debajo): "Llenos" (éxito), "Faltantes" (error) y "Por confirmar" (atención). Con 0, el número va en `--texto-tenue`.
- Badge de firma: "Listo para firma" (éxito) o "No listo para firma" (error). Si todavía no se armó el paquete: "Paquete sin armar" (información).
- "Bloqueos": lista con los motivos legibles; si no hay, "Sin bloqueos".
- "Ruta de salida": `out/{caso}/` en monoespaciada.
- Para el caso portal, una línea de atención: "Formato no soportado: se generaron los valores para cargar a mano en el portal."
- Si en el turno solo corrieron algunas herramientas, la tarjeta muestra lo que hay y deja "—" en lo que falta (ver UI Considerations, partial).

### ProgresoCaso (UI-08)
Seis etapas en una lista horizontal en el panel (cada una con ícono de 16 px y etiqueta de 14 px; con menos de 384 px disponibles pasa a vertical):

| Etapa | Etiqueta | Se marca hecha con |
|-------|----------|-------------------|
| 1 | Leído | `tool_end` ok de `leer_solicitud` |
| 2 | Mapeado | `tool_end` ok de `mapear_campos` |
| 3 | Generado | `tool_end` ok de `generar_formulario` |
| 4 | Paquete | `tool_end` ok de `armar_paquete` |
| 5 | Confirmación | `confirmation_required` del caso → "Esperando confirmación" (atención); envío autorizado → hecha; cancelación → "Cancelada" (información) |
| 6 | Envío | `tool_end` ok de `simular_envio` |

Estados de etapa: pendiente (círculo hueco, `--texto-tenue`), en curso (acento, ícono girando), hecha (check, éxito), error (x, error; con `tool_end` ok: false), esperando (reloj, atención), cancelada (x, información). Cada etapa lleva `aria-label` completo, por ejemplo "Mapeado: hecho". Un `armar_paquete` nuevo reinicia las etapas 5 y 6 a pendiente (D-63.4).

### PanelCasos y ListaArchivos (UI-06, D-64..D-67)
- El panel lista los casos con alguna herramienta en la sesión, en orden de primera aparición. El caso con actividad más reciente queda primero y expandido; los demás, colapsados (`<details>`).
- Solo entran **casos reales** (D-75): caso que cumple el patrón de caso, que está entre los casos de `/api/config` (si la config ya cargó) y cuya llamada no fue refutada por `CASO_NO_ENCONTRADO` o `CASO_INVALIDO`. El listado de casos ("¿Qué casos hay?") llega con caso `null` y no agrega bloque ni pide archivos. Un caso real con otro fallo sigue en el panel con su etapa en error. El mismo predicado decide las marcas de archivos, las tarjetas de resultado y el caso que nombran el indicador y la región viva.
- El chip de reproceso del aviso de disco efímero se deshabilita durante un turno y con el envío en pausa.
- Por caso: `ProgresoCaso` y `ListaArchivos`. La lista se pide al servidor al terminar cada turno que tocó el caso y al expandir el bloque, y refleja **lo que existe en disco en ese momento** (D-67).
- Fila de archivo (40 px): nombre en monoespaciada (`formulario.xlsx`, `paquete/checklist.md`…), tipo en texto tenue ("Formulario", "Checklist", "Borrador de correo", "Envío simulado", "Valores para portal", "Soporte") y dos enlaces de acento: "Ver" (abre `DialogoVistaPrevia`) y "Descargar" (`<a href download>`, entrega el archivo real, D-64). Cada enlace lleva un nombre accesible con el archivo: `aria-label="Ver formulario.xlsx"` y `aria-label="Descargar formulario.xlsx"`. Los soportes copiados solo tienen "Descargar".
- Nunca aparecen `mapeo.json` ni `log.jsonl` (D-66).
- Si falta un archivo esperado según el progreso (por ejemplo, la etapa "Generado" está hecha pero no hay formulario), se muestra el aviso de disco efímero (atención) con el chip "Procesar {caso} de nuevo", que manda "procesa el caso {caso}" (D-67). No se regenera nada al vuelo.
- Pie fijo del panel, en texto tenue: "Los archivos viven en el disco temporal del servidor y se borran si se reinicia."

### DialogoVistaPrevia (D-64, D-65)
- `<dialog>` modal (`showModal()`, trampa de foco nativa, Esc cierra, el foco vuelve al enlace "Ver" al cerrar).
- Título: el nombre del archivo. Botones en el pie: "Descargar archivo" (secundario) y "Cerrar vista previa" (secundario).
- Formulario (xlsx, pdf o valores de portal): tabla con encabezado fijo y columnas "Etiqueta", "Valor (enmascarado)", "Estado" y "Nota". El estado va como badge semántico ("Lleno", "Faltante", "Por confirmar"). Un valor nulo se muestra "—". Encima de la tabla, la línea tenue "Los valores se muestran enmascarados. La descarga trae el archivo completo."
- Archivo `.md`: texto plano en monoespaciada 14 px, `pre-wrap`, con scroll.
- Estados: "Cargando la vista previa…" mientras llega; error con el texto **según la causa** (G-03-10), pintado como nodo de texto con `pre-wrap`:
  - 404 (archivo inexistente): la copia de error con la pista de reinicio, y además el aviso de disco efímero del caso. Solo el 404 lleva la pista y el aviso.
  - 422 (sin vista previa) y cualquier otro rechazo del servidor (500, 503…): el `mensaje` del servidor tal como llega.
  - Red caída: la copia de error sin conexión.
  - Acceso vencido (401): el mensaje del acceso, y la UI vuelve a `PantallaAcceso`.

### Compositor y AccionesRapidas (UI-01, UI-07, D-73)
- `textarea` con `aria-label="Mensaje para el agente"`, `maxlength` 2000. Enter manda; Shift+Enter hace salto de línea. Línea de ayuda tenue debajo: "Enter para enviar · Shift+Enter para nueva línea".
- Contador "{n}/2000" visible desde 1800 caracteres; en 2000, color de error.
- Línea de uso, en texto tenue a la derecha de la ayuda: "Uso de la sesión: {k} k de 300 k tokens" (del evento `usage`, `totalSesion`). El tope sale del servidor, no está escrito en el front.
- Durante un turno: el botón primario "Enviar mensaje" se reemplaza por el secundario "Detener respuesta", que aborta el `fetch` (el servidor cierra el turno con `abortado`). El `textarea` sigue editable, pero Enter no manda.
- Con el envío en pausa (`sin_clave` o `tope_diario`, ver AvisoModelo): el `textarea`, "Enviar mensaje" y el envío con Enter quedan deshabilitados, y la línea de ayuda (referenciada por `aria-describedby`) dice "El envío está en pausa mientras el modelo no esté disponible; el aviso de arriba explica qué hacer.". En los demás estados del modelo el compositor sigue habilitado. "Nueva sesión", "Detener respuesta", ver y descargar archivos y "Reintentar" de la lista no dependen de la pausa.
- Chips (fila sobre el compositor, siempre visibles en sesión vacía; con historial, en una fila compacta sobre el compositor):
  - "Demo §11: ec-corp-andina" → manda el prompt literal del PRD §11. En la franja compacta en < 640 px: "Demo §11".
  - "Procesar los 4 casos" → manda "Procesa estos casos: {lista}. Dime el estado de cada uno. No envíes nada todavía.", con `{lista}` desde los casos conocidos del servidor (sin ids escritos a mano en el front). En la franja compacta en < 640 px: "Los 4 casos".
  - "¿Qué casos hay?" → manda "¿Qué casos hay disponibles?". No tiene etiqueta corta.
  - Las etiquetas cortas llevan `aria-label` igual a la etiqueta completa y mandan el mismo mensaje.
  - Los chips están deshabilitados durante un turno y con el envío en pausa.

### DialogoNuevaSesion (UI-08, destructiva)
- `<dialog>` modal. Botones: "Seguir en esta sesión" (secundario, con el foco inicial) y "Empezar sesión nueva" (destructivo). Al confirmar, la línea de tiempo y el panel se vacían y aparece el estado vacío.
- Al confirmar, la SPA **olvida el `sessionId` guardado en el navegador** (`localStorage`), como promete el diálogo ("las confirmaciones pendientes se descartan"). El `sessionId` anterior queda **solo en memoria** hasta el `turn_start` del primer mensaje de la sesión nueva, para ofrecer "Volver a la sesión anterior" ante un 429 (D-73.5.1, D-73.5.2). Recargar después de "Empezar sesión nueva" empieza sin sesión y la anterior ya no se ofrece: es la consecuencia aceptada en D-73.5.2 y coincide con el diálogo. Pulsar "Empezar sesión nueva" dos veces seguidas sin mandar nada conserva en memoria la misma sesión a la que volver.
- Si el primer mensaje de la sesión nueva recibe un 429, el `AvisoError` muestra el mensaje del servidor (con los minutos de espera) y el botón "Volver a la sesión anterior", que vuelve a guardar esa sesión en el navegador y la recarga desde `GET /api/sessions/:id` sin mandar nada al chat; si después se recarga la página, vuelve esa sesión (D-73.5.2). Sin sesión anterior, o con 413, 503 o red caída, el aviso no lleva ese botón.

### Persistencia y recarga (UI-08, DF-14, D-58)
- El `sessionId` vive en `localStorage` (es un identificador, no un secreto) desde el `turn_start` que lo crea hasta que "Empezar sesión nueva" lo olvida (D-73.5.2) o el servidor responde que ya no existe. El código de acceso **no**.
- Al cargar: si hay `sessionId`, se llama `GET /api/sessions/:id` y se muestra "Cargando la conversación…" en la línea de tiempo. El historial llega con la PII redactada y reconstruye mensajes, grupos de herramientas, tarjetas de resultado, progreso y tarjetas de confirmación vigentes.
- Si la sesión ya no existe (TTL o reinicio de Render) o `turn_start` llega con `sesionExpirada: true`: `AvisoSistema` con el texto del servidor (`TEXTO_SESION.expirada`) al inicio de la línea de tiempo y se sigue en la sesión nueva.

---

## Copywriting Contract

Todo en español. Copia propia del front en `web/src/config/strings.ts`. Las filas marcadas **(servidor)** las produce el backend desde `src/config/strings.ts` y el front las muestra tal cual. Aquí se fija su texto para que el planner las agregue allí.

| Element | Copy |
|---------|------|
| Primary CTA | "Enviar mensaje" (botón del compositor) |
| CTA de acceso | "Entrar al agente"; en curso, "Verificando…" |
| CTA de confirmación | "Confirmar envío simulado" / "Cancelar envío" |
| Texto que manda Confirmar | "Sí, envía {caso}" (más `accion: { tipo: "confirmar", caso }`) |
| Texto que manda Cancelar | "Cancela el envío de {caso}" (más `accion: { tipo: "cancelar", caso }`) |
| Detener | "Detener respuesta" |
| Título de la app | "Registro como proveedor" · subtítulo "Periferia IT Group" |
| Fecha | "Fecha de ejecución {AAAA-MM-DD}" |
| Acceso: título | "Acceso al agente" |
| Acceso: ayuda | "Escribe el código de acceso que está en el README. Lo pedimos una vez; el acceso dura 12 horas en este navegador." |
| Acceso: etiqueta del campo | "Código de acceso" |
| Acceso: código incorrecto (servidor) | "El código no es válido. Revísalo y vuelve a intentarlo." |
| Acceso: demasiados intentos (servidor, 429) | "Demasiados intentos fallidos. Espera 15 minutos y vuelve a intentarlo." |
| Acceso vencido (401 en cualquier endpoint) | "Tu acceso venció. Escribe el código de nuevo para seguir." |
| Empty state heading | "¿Qué caso procesamos?" |
| Empty state body | "Pide un caso por su nombre, por ejemplo \"procesa el caso co-industrias-delta\", o usa una acción rápida. El agente lee la solicitud, mapea cada campo contra el maestro, genera el formulario y arma el paquete para firma. No registra ningún envío sin tu confirmación." |
| Placeholder del compositor | "Escribe una instrucción, por ejemplo: procesa el caso ec-corp-andina" |
| Pensando | "Pensando…" / "{Gerundio} · {caso}…" |
| Servidor despertando | "El servidor puede estar despertando; la primera respuesta tarda hasta un minuto." |
| Cargando historial | "Cargando la conversación…" |
| Panel vacío: título | "Casos de esta sesión" |
| Panel vacío: cuerpo | "Todavía no se procesó ningún caso. Aquí verás el avance de cada caso y sus archivos." |
| Archivos: cargando | "Cargando archivos…" |
| Archivos: error al listar | "No pudimos traer los archivos de este caso." · botón "Reintentar" |
| Archivos vacíos | "Todavía no hay archivos de este caso. Aparecen cuando el agente genera el formulario o arma el paquete." |
| Disco efímero (D-67) | "El servidor se reinició y los archivos se borraron; vuelve a procesar el caso." · chip "Procesar {caso} de nuevo" |
| Pie del panel | "Los archivos viven en el disco temporal del servidor y se borran si se reinicia." |
| Vista previa: nota | "Los valores se muestran enmascarados. La descarga trae el archivo completo." |
| Vista previa: error 404 (archivo inexistente) | "No se pudo cargar la vista previa. Si el servidor se reinició, vuelve a procesar el caso; si no, inténtalo de nuevo." (más el aviso de disco efímero del caso) |
| Vista previa: error 422 (servidor, sin vista previa) | El `mensaje` del servidor tal cual: "Este archivo no tiene vista previa. Puedes descargarlo para revisarlo." Sin pista de reinicio. Cualquier otro rechazo (500, 503…) muestra también su `mensaje`. |
| Vista previa: sin conexión (front) | "No se pudo cargar la vista previa por un problema de conexión. Inténtalo de nuevo." |
| Confirmación: título | "Confirmación requerida · Envío simulado" |
| Confirmación: nota | "Confirmar registra solo ENVIO-SIMULADO.md. No se envía ningún correo real." |
| Confirmación con bloqueos | "Se registrará con {n} bloqueo(s)." |
| Confirmación ocupada | "Espera a que termine la respuesta actual." |
| Confirmación resuelta | "Envío registrado" · "Envío cancelado" · "Reemplazada por una confirmación nueva" |
| Grupo de herramientas | "{n} llamadas a herramientas · {k} correctas · {e} con error" (singular: "1 llamada a herramienta") |
| Estados de herramienta | "En curso" · "Correcta" · "Error" |
| Resultado: badges | "Listo para firma" · "No listo para firma" · "Paquete sin armar" |
| Resultado: sin bloqueos | "Sin bloqueos" |
| Resultado: portal | "Formato no soportado: se generaron los valores para cargar a mano en el portal." |
| Modelo: estado en el encabezado | "{modelo} · Disponible" · "{modelo} · Sin clave válida" · "{modelo} · Sin saldo" · "{modelo} · No disponible" · "{modelo} · Tope diario" |
| Banner: frase común del detalle | "Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos." (abre el detalle de los cuatro estados) |
| Banner `sin_clave` | Título: "El chat no puede procesar mensajes: el servidor no tiene una clave válida del proveedor del modelo." · detalle: "Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos. Avisa a quien administra el servicio para que la configure. Vuelve cuando el servicio se reinicie con una clave válida; usa \"Comprobar de nuevo\" para verlo." |
| Banner `saldo_agotado` | Título: "El proveedor del modelo se quedó sin saldo: los mensajes van a fallar hasta que se recargue la cuenta." · detalle: "Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos. Avisa a quien administra el servicio para que la recargue. Cuando se recargue la cuenta, vuelve a enviar tu mensaje; la sesión sigue abierta." |
| Banner `no_disponible` | Título: "El proveedor del modelo no respondió en el último intento." · detalle: "Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos. Espera unos minutos y vuelve a enviar tu mensaje; si sigue fallando, avisa a quien administra el servicio. Suele volver solo; la sesión sigue abierta." |
| Banner `tope_diario` | Título: "Se alcanzó el tope diario de uso del modelo: el chat no puede procesar más mensajes hoy." · detalle: "Mientras tanto, puedes ver y descargar los archivos ya generados en el panel de casos. No hace falta que hagas nada: el tope protege el costo del servicio. El chat vuelve a estar disponible después de la medianoche ({zona})." |
| Banner: botón | "Comprobar de nuevo"; mientras corre el pedido de health, "Comprobando…" (deshabilitado) |
| Compositor en pausa (`sin_clave`, `tope_diario`) | "El envío está en pausa mientras el modelo no esté disponible; el aviso de arriba explica qué hacer." (reemplaza la línea de ayuda, referenciada por `aria-describedby`) |
| Confirmación en pausa (`sin_clave`, `tope_diario`) | "Podrás confirmar o cancelar cuando el modelo vuelva a estar disponible." (si además corre un turno, manda la ayuda "Espera a que termine la respuesta actual.") |
| Error: saldo agotado (servidor, `MENSAJE_AGENTE`, 402) | "Saldo agotado en el proveedor del modelo: hay que recargar la cuenta antes de seguir. La sesión sigue abierta; cuando se recargue la cuenta, vuelve a enviar tu mensaje." (coincide con el banner `saldo_agotado`) |
| Error: clave rechazada (servidor, `MENSAJE_AGENTE`, 401/403) | "La clave del proveedor del modelo no es válida o no tiene permiso: hay que corregirla en el servidor antes de seguir. La sesión sigue abierta." (health pasa a `sin_clave`, D-71.1) |
| Error state (stream cortado, front) | "Se perdió la conexión con el servidor durante la respuesta. Recarga la conversación para ver lo que alcanzó a hacer, o vuelve a enviar el mensaje." · botón "Recargar conversación" |
| Error: sin red (front) | "No hay conexión con el servidor. Revisa tu red y vuelve a intentarlo." |
| Error: mensaje largo (front y servidor, 413) | "El mensaje supera los 2000 caracteres. Acórtalo y vuelve a enviarlo." |
| Error: rate limit del chat (servidor, 429) | "Enviaste muchos mensajes seguidos. Espera un minuto y vuelve a intentarlo." |
| Error: turno activo (servidor, `SESION_OCUPADA`) | "Esta sesión todavía está procesando el mensaje anterior. Espera la respuesta y vuelve a escribir." (ya existe en `MENSAJE_AGENTE`) |
| Error: servidor lleno (servidor, 3 turnos simultáneos) | "El servidor está atendiendo otras conversaciones. Vuelve a intentarlo en unos segundos." |
| Error: sesiones por hora (servidor, 429) | "Abriste demasiadas sesiones nuevas en la última hora. Podrás abrir otra en {m}.", donde {m} es "un minuto" o "{n} minutos" (techo, mínimo uno) · el `AvisoError` agrega el botón "Volver a la sesión anterior" cuando hay una sesión a la que volver |
| Aviso de envío no registrado (servidor, D-76) | Va en el texto del agente, después de la prosa del modelo y antes de la pregunta del servidor: requiere confirmación "No se registró el envío simulado de {caso}: falta tu confirmación explícita." · sin paquete "No se registró el envío simulado de {caso}: su paquete no está armado en esta sesión; primero hay que armarlo y después confirmar el envío." · ya enviado "No se registró otro envío simulado de {caso}: ya tiene uno registrado en esta sesión (ENVIO-SIMULADO.md); para registrar otro hay que volver a armar el paquete." · fallido "No se registró el envío simulado de {caso}: la herramienta no pudo registrarlo." · sin caso "No se registró ningún envío simulado: el pedido no indicó un caso válido." |
| Chips cortos (franja compacta, < 640 px) | "Demo §11" · "Los {n} casos" ("Los casos" si todavía no llegaron) · `aria-label` con la etiqueta completa |
| Error: tope diario (servidor) | "Se alcanzó el tope diario de uso del modelo. Vuelve a intentarlo después de la medianoche ({zona})." |
| Error: presupuesto de sesión (servidor, `PRESUPUESTO_AGOTADO`) | "Esta sesión agotó su presupuesto de tokens. Abre una sesión nueva para continuar." (ya existe) · el `AvisoError` agrega el botón "Empezar sesión nueva" |
| Errores del agente (servidor, `MENSAJE_AGENTE`) | Se muestran tal cual en `AvisoError`: ya traen el problema y el paso siguiente ("La sesión sigue abierta; puedes volver a intentarlo."). |
| Sesión expirada (servidor, `TEXTO_SESION.expirada`) | "La sesión anterior expiró; empezamos de cero." |
| Ir al final | "Ir al final" (en < 640 px solo el ícono, con `aria-label="Ir al final"`) |
| Destructive confirmation | Nueva sesión: título "¿Empezar una sesión nueva?" · cuerpo "La conversación actual sale de esta pantalla y las confirmaciones pendientes se descartan. Los archivos generados siguen en el servidor mientras no se reinicie." · botones "Empezar sesión nueva" (destructivo) y "Seguir en esta sesión" |

Confirmar o cancelar el envío simulado **no** es una acción destructiva con diálogo propio: la tarjeta ya es la confirmación explícita que exige CA3, y el servidor es la compuerta (D-68). No se agrega un segundo diálogo.

---

## Accesibilidad (contrato)

- Contraste AA en todos los pares declarados (ver Color). Estados siempre con texto o ícono más color.
- Foco visible en todo elemento interactivo con el anillo de acento; prohibido `outline: none` sin reemplazo.
- Orden de tabulación: encabezado → banner (si tiene enlaces) → línea de tiempo (tarjetas, botones de confirmación) → chips → compositor → panel de casos.
- Íconos siempre `aria-hidden="true"` y acompañados de texto visible. Si un botón queda solo con ícono ("Ir al final" en pantallas angostas), lleva `aria-label` con la misma copia.
- Diálogos con `<dialog>` modal, título en `aria-labelledby`, Esc cierra y el foco vuelve al disparador.
- Una sola región `aria-live="polite"` para cambios de estado; los errores usan `role="alert"`.
- `prefers-reduced-motion: reduce` apaga las rotaciones y transiciones (solo cambios instantáneos). Fuera de eso, las transiciones duran 150 ms y solo animan `opacity` y `transform`.
- Objetivos de clic de al menos 40 × 40 px.
- `<html lang="es">`.

---

## Contrato de datos que la UI necesita (para el planner)

La UI no inventa datos; necesita estos campos del servidor. La forma exacta la decide el planner (discreción de CONTEXT.md):

1. `tool_end` (o un evento derivado) debe traer el `caso` y un resumen **estructurado y redactado** del resultado: contadores por estado, formato, país, `listo_para_firma`, bloqueos legibles y ruta. Hoy el evento solo trae `resumen` (texto), que no basta para `TarjetaResultado` sin parsear texto. Prohibido derivarlo del texto del modelo.
2. `tool_start` debe permitir saber el `caso` (desde los args redactados o un campo propio) para el indicador y el progreso.
3. La fecha de ejecución efectiva y la lista de casos conocidos deben llegar desde un endpoint (para el chip "Procesar los 4 casos" y el encabezado).
4. `GET /api/sessions/:id` devuelve historial redactado más `pendientes` vigentes (`{ caso, bloqueos }[]`, D-69), con lo necesario para rehidratar el progreso y las tarjetas.
5. Un endpoint lista los archivos existentes de un caso (lista blanca, D-66) y otro sirve la vista previa enmascarada desde `mapeo.json` (D-65).
6. Toda respuesta de error HTTP (401, 413, 429, 503…) trae un `mensaje` en español listo para mostrar.
7. El chip "¿Qué casos hay?" exige que el agente pueda responder la lista. No existe `proveedor_listar_casos`: el modelo llama `proveedor_leer_solicitud` con caso vacío, que responde con los casos disponibles (D-14). El servidor publica esa llamada con **caso `null`** en `tool_start`, `tool_end` y la vista de sesión, porque el caso vacío no cumple el patrón de caso (D-75), así que el listado no agrega un bloque al panel.

---

## UI Considerations

Applicable state considerations resolved: 27 covered, 4 backstop, 0 unresolved (el error de `DialogoVistaPrevia` se separó por causa en el cierre de brechas, 2026-10-15)

Sonda `ui-consideration-probe` (2026-10-14): 11 superficies y 67 categorías propuestas. Las que no figuran en la tabla se descartaron por no aplicar, por ejemplo "loading" en `DialogoNuevaSesion` (acción local, sin red) o "zero-one-many" en `PantallaAcceso`. `AvisoModelo` quedó sin clasificar y se revisó a mano: sus cinco estados están en la fila "Estado del LLM".

| Category | Element(s) | Status | Resolution / Reason |
|----------|------------|--------|---------------------|
| empty | LineaDeTiempo (sesión nueva) | ✅ covered | Una sesión sin mensajes muestra el título y el cuerpo del estado vacío de Copywriting y los tres chips, con 48 px de margen superior |
| empty | PanelCasos | ✅ covered | Sin casos procesados, el panel muestra "Casos de esta sesión" y el cuerpo de panel vacío de Copywriting |
| empty | ListaArchivos | ✅ covered | Un caso sin archivos en disco muestra la copia "Todavía no hay archivos de este caso…" |
| empty | PantallaAcceso (campo vacío) | ✅ covered | Con el campo vacío, "Entrar al agente" está deshabilitado |
| loading | LineaDeTiempo (hidratación) | ✅ covered | Mientras responde `GET /api/sessions/:id` se muestra "Cargando la conversación…" y el compositor está deshabilitado |
| loading | Turno en curso | ✅ covered | `IndicadorPensando` muestra "Pensando…" o la herramienta en curso; a los 10 s sin eventos agrega la línea de servidor despertando |
| loading | TarjetaHerramienta | ✅ covered | Entre `tool_start` y `tool_end` la tarjeta muestra el badge "En curso" con el ícono girando (o el reloj con movimiento reducido) |
| loading | DialogoVistaPrevia | ✅ covered | Mientras llega la vista previa, el cuerpo dice "Cargando la vista previa…" |
| loading | PantallaAcceso | ✅ covered | Durante `POST /api/acceso` el botón dice "Verificando…" y está deshabilitado |
| error | Turno (evento `error`) | ✅ covered | El `mensaje` del servidor se muestra en `AvisoError` con `role="alert"`, la sesión sigue usable y el compositor queda habilitado (CA5), salvo con el envío en pausa (`sin_clave` o `tope_diario`, D-70 reescrita). Al terminar el pedido se vuelve a pedir `/api/health` |
| error | Stream cortado sin `turn_end` | ✅ covered | Se muestra la copia de stream cortado con el botón "Recargar conversación", que rehidrata desde `GET /api/sessions/:id` |
| error | Respuestas HTTP 401 | ✅ covered | Cualquier 401 lleva a `PantallaAcceso` con la copia "Tu acceso venció…" y conserva el `sessionId` |
| error | Respuestas HTTP 413 / 429 / 503 | ✅ covered | El `mensaje` del servidor aparece en `AvisoError` bajo el mensaje de la usuaria; el texto escrito no se pierde del compositor. Un 429 con una sesión anterior en memoria agrega "Volver a la sesión anterior" (D-73.5.1, D-73.5.2) |
| error | DialogoVistaPrevia y Descargar (404) | ✅ covered | Un 404 de archivo muestra la copia de error de vista previa con la pista de reinicio y dispara el aviso de disco efímero del caso |
| error | DialogoVistaPrevia (422 y otros rechazos) | ✅ covered | Un 422 muestra el `mensaje` del servidor ("Este archivo no tiene vista previa. Puedes descargarlo para revisarlo."), sin pista de reinicio y sin aviso de disco efímero; 500 y 503 muestran también su `mensaje` (G-03-10) |
| error | DialogoVistaPrevia (red caída) | ✅ covered | Sin conexión muestra "No se pudo cargar la vista previa por un problema de conexión. Inténtalo de nuevo.", sin pista de reinicio |
| error | Estado del LLM | ✅ covered | `llm ≠ disponible` pinta el banner de su estado con título, detalle y "Comprobar de nuevo" (Copywriting). Health se pide al cargar, en `visibilitychange`, al terminar cada pedido de chat y con el botón, nunca por intervalo. En `sin_clave` y `tope_diario` el envío queda en pausa; en `saldo_agotado` y `no_disponible` sigue habilitado |
| populated | LineaDeTiempo (demo §11) | ✅ covered | Turno con 4 tool calls: mensaje → grupo abierto con 4 tarjetas → texto del agente → `TarjetaResultado` de ec-corp-andina → `TarjetaConfirmacion` |
| populated | PanelCasos | ✅ covered | Cada caso procesado muestra `ProgresoCaso` con sus etapas y `ListaArchivos` con Ver y Descargar |
| partial | TarjetaResultado | ✅ covered | Si el turno no llegó a armar el paquete, los contadores se muestran si hubo mapeo, el badge dice "Paquete sin armar" y la ruta y los bloqueos muestran "—" |
| partial | ProgresoCaso | ✅ covered | Un turno cortado deja hechas solo las etapas con `tool_end` ok; la etapa con `ok: false` queda en error y las siguientes, pendientes |
| partial | ListaArchivos (disco efímero) | ✅ covered | Un archivo esperado por el progreso pero ausente en disco muestra el aviso D-67 con el chip "Procesar {caso} de nuevo" |
| zero-one-many | GrupoHerramientas | ✅ covered | Copia en singular y plural; con más de 6 tarjetas el grupo se cierra al terminar el turno y deja el resumen visible |
| zero-one-many | TarjetaConfirmacion | ✅ covered | Una tarjeta por caso pendiente (0 = ninguna; varios casos = varias tarjetas apiladas con 8 px de separación, cada una con sus botones) |
| overflow | LineaDeTiempo, PanelCasos, DialogoVistaPrevia | 🧪 backstop | Cada contenedor hace scroll propio; encabezado y compositor quedan fijos; la tabla de vista previa fija su encabezado. La línea de tiempo sigue el final por intención de la usuaria, se re-ancla al enviar y lleva `overflow-anchor: none` mientras sigue el final, así que con más de 6 llamadas a 375 × 667 no queda un mensaje viejo a la vista; "Ir al final" es solo ícono en < 640 px y no tapa texto (G-03-04, G-03-20). Verificar con la demo de 4 casos a 1280 × 720 y a 375 × 667 |
| overflow | `<pre>` de argumentos y vista previa `.md` | 🧪 backstop | Alto máximo 240 px (60 vh en el diálogo) con scroll vertical y horizontal; sin desborde del ancho de la tarjeta |
| long-text | Texto del agente, ids de caso, rutas, bloqueos | 🧪 backstop | `pre-wrap` más `overflow-wrap: anywhere`; ningún texto rompe el ancho de 768 px ni el panel de 384 px |
| long-text | Resumen en la tarjeta colapsada | 🧪 backstop | Una línea con elipsis (`text-overflow: ellipsis`); el texto completo solo en el cuerpo expandido |
| overflow | AccionesRapidas en < 640 px | ✅ covered | `flex-wrap: wrap`, con 8 px entre chips: se apilan en varias filas (2 como máximo con 3 chips) y no hay scroll horizontal (decisión de la usuaria, 2026-10-14). En la franja compacta sobre el compositor las etiquetas son cortas ("Demo §11", "Los {n} casos"), con `aria-label` completo, para reducir el cromo fijo a 375 px |
| loading | ListaArchivos | ✅ covered | Mientras llega la lista se muestra "Cargando archivos…" en texto tenue; la lista se vuelve a pedir al terminar cada turno |
| error | ListaArchivos (fallo al listar) | ✅ covered | "No pudimos traer los archivos de este caso." con el botón secundario "Reintentar"; no se confunde con el 404 de un archivo (D-67) |

---

## Registry Safety

| Registry | Blocks Used | Safety Gate |
|----------|-------------|-------------|
| none | none: no se usa shadcn ni ningún registro de componentes (Tool: none; sistema de diseño manual en `tokens.css`) | not applicable |

Dependencias de front permitidas por STACK.md: `react`, `react-dom`, `eventsource-parser` (y `vite` y `@vitejs/plugin-react` como dev). Ninguna dependencia visual adicional entra en esta fase sin justificarla en SOLUCION.md.

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: PASS
- [x] Dimension 2 Visuals: PASS
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS
- [x] Dimension 7 Inventory Provenance: PASS

**Approval:** approved 2026-10-14 (FLAGs de Copywriting e Inventory Provenance aplicados)
