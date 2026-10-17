---
phase: 05-front-web-por-features-e-identidad-de-marca
fixed_at: 2026-10-16T21:48:55Z
review_path: .planning/milestones/v1-phases/05-front-web-por-features-e-identidad-de-marca/05-REVIEW.md
iteration: 3
findings_in_scope: 5
fixed: 5
skipped: 0
status: all_fixed
---

# Fase 5: informe de corrección de la revisión de código (iteración 3)

**Corregido el:** 2026-10-16T21:48:55Z
**Revisión de origen:** `.planning/milestones/v1-phases/05-front-web-por-features-e-identidad-de-marca/05-REVIEW.md`
**Iteración:** 3. Las iteraciones 1 y 2 están en `05-REVIEW-FIX.iter1.md` y `05-REVIEW-FIX.iter2.md`. No se deshizo nada de ellas, salvo la corrección IN-08 de la iteración 2, que IN-01 rehace a propósito.

**Resumen:**
- Hallazgos en alcance: 5 (los 5 son informativos, con `fix_scope: all`)
- Corregidos: 5
- Omitidos: 0

Cada hallazgo tiene su propio commit atómico en `main` local. Los commits usan rutas explícitas y la identidad `elianatorres5772 <elianatorres5772@gmail.com>`. No se hizo push y no se tocó `reto-01/`.

## Dónde corrió la verificación

Todo corrió **en el checkout principal** (`/Users/alejo/Developer/Alejo/reto-eli-1`, rama `main`), no en un worktree aislado. Así lo pidió el orquestador, y además un worktree no trae `node_modules`. Por eso los números de abajo se reproducen desde el árbol actual.

| Puerta | Resultado |
|---|---|
| `bun run check` (tsc ×3 + Biome) | OK: `Checked 519 files … No fixes applied.`, exit 0 |
| `bun test` | 2652 pass · 2 skip · 0 fail (2654 pruebas en 131 archivos, 10602 `expect`) |
| `bun test --isolate` | 2652 pass · 2 skip · 0 fail (mismos totales) |
| `bun run build:web` | OK, exit 0. `web/dist/index.html` lleva `<title>Registro como proveedor · Periferia IT Group</title>` |
| `bun run demo.ts` | OK, exit 0. Los 4 casos dan los mismos resultados que en las iteraciones 1 y 2: co LISTO 17/0/0, ec BLOQUEADO 13/1/1, hn BLOQUEADO 9/1/1 y pa LISTO 8/0/1 |

## Fixed Issues

### IN-01: The IN-08 fix opens a second channel for the 401 message and marks a code the server just accepted as invalid

**Archivos modificados:** `web/src/store/acciones.ts`, `web/src/types/store.type.ts`, `web/src/features/acceso/pantalla-acceso/usar-pantalla-acceso.ts`, `tests/web/store/acciones.test.ts`, `tests/web/dom/app-acceso.test.tsx`
**Commit:** f0b08da
**Estado:** corregido, **requiere verificación humana** (cambia dónde y cómo se ve el mensaje en un camino de error)
**Corrección aplicada:**
- `cargarConfig` vuelve a devolver `Promise<void>`. Con eso se revierte el cambio de firma de la iteración 2.
- Se agregó la acción `cargarConfigTrasEntrar(signal)`. Si `/api/config` responde `ACCESO_VENCIDO`, llama a `vencerAcceso(resultado.mensaje)`, que ahora es una función con nombre dentro de `crearAcciones`. Si responde otra cosa, despacha igual que `recibirConfig`. Con un abort no despacha nada.
- Así, el 401 que llega justo después de un código aceptado usa el canal que ya existía: `ACCESO_PEDIDO.aviso` → `AvisoSistema` (`role="status"`). Es el mismo canal de la vista previa y de la hidratación.
- `usePantallaAcceso` ya no tiene `avisoTrasEntrar` ni el import de `ConfigResponse`. Tampoco escribe el error del campo ni devuelve el foco en este caso. El código aceptado ya no queda marcado con `aria-invalid`.
- El 401 de la primera visita sigue en silencio, porque `accionDeConfig` no se tocó.
- Pruebas:
  - La prueba DOM con `cookieDescartada` ahora exige que el texto `MENSAJE_HTTP.accesoVencido` aparezca en el `role="status"` y que el campo no lleve `aria-invalid="true"`.
  - En `acciones.test.ts` hay tres pruebas nuevas de `cargarConfigTrasEntrar`: 401 con el aviso, OK que concede el acceso, y abort sin despacho.
  - La prueba de `cargarConfig` dejó de leer el valor de retorno.

### IN-02: The composer re-derives the "can send" rule instead of reading `seleccionarEnvioDeshabilitado`

**Archivos modificados:** `web/src/store/selectores.ts`, `web/src/features/chat/compositor/usar-compositor.ts`, `tests/web/store/selectores.test.ts`
**Commit:** ba7bd1f
**Corrección aplicada:**
- Se agregó `seleccionarCampoBloqueado`, igual a `hidratando || envioEnPausa`. `seleccionarEnvioDeshabilitado` ahora se define como `enCurso || seleccionarCampoBloqueado(estado)`, así que la regla vive en un solo lugar y la división entre las dos queda a la vista.
- El compositor lee los dos selectores:
  - `deshabilitado` (el textarea y el botón de enviar) sale de `seleccionarCampoBloqueado`.
  - `alPresionarTecla` usa `if (!envioDeshabilitado) …requestSubmit()`.
- Desaparecieron `bloqueado` y la combinación armada a mano.
- Una prueba de selector nueva fija la relación:
  - una sesión guardada (hidratando) bloquea el campo;
  - una sesión nueva no lo bloquea;
  - un turno en curso no bloquea el campo, pero sí deshabilita el envío.

### IN-03: W20 still lets a feature read the store context through React 19 `use(ContextoAlmacen)`

**Archivos modificados:** `tests/arquitectura-web.test.ts`, `web/src/store/contexto-almacen.ts` (nuevo), `web/src/store/usar-almacen.ts`, `web/src/store/proveedor-almacen.tsx`, `docs/convenciones.md`, `docs/estructura.md`, `.claude/CLAUDE.md`
**Commit:** 32566ed
**Corrección aplicada:** Se aplicaron las dos variantes que propone la revisión.
1. **Guardián (RED primero):** se agregaron tres muestras negativas y la prueba "muerde" de W20 falló antes del cambio. Las muestras son:
   - `import { use } from "react"` + `use(ContextoAlmacen)`;
   - `<ContextoAlmacen.Consumer>`;
   - `React.use(Contexto)` desde `import * as React`.

   Después del cambio:
   - `PRIMITIVAS_DEL_ALMACEN` incluye `use`. Como la regex usa `\b`, `useState` y los demás hooks no caen.
   - Una cláusula nueva reporta `ContextoAlmacen solo se usa en web/src/store` cada vez que el identificador aparece fuera del almacén, en el código sin cadenas.
   - La misma muestra no da violaciones dentro de `web/src/store/`.
2. **El contexto ya no sale del almacén:** `createContext` pasó a `web/src/store/contexto-almacen.ts`, y solo lo importan `usar-almacen.ts` y `proveedor-almacen.tsx`. `usar-almacen.ts`, el módulo que importan las features, ya no exporta `ContextoAlmacen`.

El código real sigue en verde. La fila W20 de `docs/convenciones.md`, `docs/estructura.md` (el archivo nuevo del almacén) y `.claude/CLAUDE.md` describen la regla ampliada.

### IN-04: W4 is still a denylist, and it misses the impurities that matter most for pure reducers

**Archivos modificados:** `tests/arquitectura-web.test.ts`, `docs/convenciones.md`, `.claude/CLAUDE.md`
**Commit:** 40518d5
**Corrección aplicada:**
- **RED primero:** se agregó a la muestra "muerde" de W4 una línea por cada nombre nuevo: `Date.now`, `new Date`, `Math.random`, `crypto`, `performance`, `location`, `history`, `XMLHttpRequest`, `WebSocket`, `EventSource` y `queueMicrotask`. También se agregaron dos líneas que deben seguir permitidas: `Math.floor`, que `conversacion.ts` usa de verdad, y `Date.parse`. Las dos pruebas de W4 fallaron antes del cambio.
- `API_DEL_NAVEGADOR` pasó a llamarse `API_IMPURA` y suma esos nombres.
- El motivo ahora dice "el estado toca el navegador, el reloj o el azar". El anterior ya no describía bien `Math.random` ni `Date.now`.
- Los nombres de las pruebas de W4 se ajustaron a la regla nueva.
- El código real de `features/*/estado` y del núcleo del almacén ya cumplía y sigue en verde.
- La fila W4 de `docs/convenciones.md` y la línea de `estado/` en `.claude/CLAUDE.md` nombran el reloj y el azar. La razón documentada ahora dice que los reductores son "puros y deterministas", y que reciben de afuera una hora o un valor al azar, igual que el dominio recibe un reloj inyectado.

### IN-05: The "en curso" icon and its reduced-motion CSS are duplicated between two features

**Archivos modificados:** `web/src/compartido/icono-en-curso/icono-en-curso.tsx` (nuevo), `web/src/compartido/icono-en-curso/icono-en-curso.module.css` (nuevo), `web/src/features/casos/progreso-caso/progreso-caso.tsx`, `web/src/features/casos/progreso-caso/progreso-caso.module.css`, `web/src/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.tsx`, `web/src/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.module.css`, `docs/estructura.md`, `.claude/CLAUDE.md`
**Commit:** be0f58a
**Corrección aplicada:**
- `IconoEnCurso` vive en su propia carpeta de componente, `compartido/icono-en-curso/`. Cumple W14 (vista con el nombre de la carpeta) y W17 (solo su vista importa el `.module.css`).
- Su módulo CSS es dueño de `.giro`, de `.quieto` y del bloque `prefers-reduced-motion`. Tiene la misma conducta que antes: el giro es visible y el reloj está oculto, y con movimiento reducido se invierten.
- Los dos `ICONO_DE_ESTADO[...EN_CURSO]` apuntan a `IconoEnCurso`.
- Se borraron `IconoEtapaEnCurso`, `IconoHerramientaEnCurso`, sus imports de `IconoGirando`/`IconoReloj` que ya no se usan (`progreso-caso` conserva `IconoReloj` para `ESPERANDO`) y las reglas `.giro`/`.quieto` duplicadas de los dos módulos.
- W26 sigue en verde, así que no quedó ninguna clase sin definir.
- `docs/estructura.md` y `.claude/CLAUDE.md` agregan `icono-en-curso` a la lista de `compartido/`.

## Notas para quien revise

- **Requiere verificación humana:** IN-01. El mensaje después del login, cuando la cookie no queda guardada, ahora es un aviso del sistema arriba del campo, no un error del campo. Conviene confirmarlo con Playwright y con una cookie bloqueada.
- Los guardianes del front siguen siendo W1–W27. Solo se ampliaron W4 y W20.
- `.planning/config.json` ya estaba modificado antes de esta corrida y no se tocó.

---

_Corregido: 2026-10-16T21:48:55Z_
_Corrector: Claude (gsd-code-fixer)_
_Iteración: 3_
