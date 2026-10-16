# Módulo reutilizable: registro como proveedor

Este directorio empaqueta el agente para montarlo en otro host de agentes sin el servidor web (PRD §9.4). Tiene tres piezas y ninguna es una copia a mano de la aplicación.

| Pieza | Qué es | De dónde sale |
|---|---|---|
| `agent.md` | El agente de OpenCode: un frontmatter (`description`, `mode: primary`, `permission` con `edit` y `bash` en `deny`) seguido del prompt del sistema. | `bun run modulo` antepone el frontmatter a los bytes exactos de `agent/prompt.md`. |
| `skill/registro-proveedor/SKILL.md` | La skill con el conocimiento del proceso: el orden de las herramientas, los estados de cada campo, las reglas de negocio y el formato del resumen. | `bun run modulo` antepone el frontmatter (`name`, `description`) a los bytes exactos de `src/knowledge/registro-proveedor.md`. |
| `tools/proveedor.ts` | Las cinco herramientas: `leer_solicitud`, `mapear_campos`, `generar_formulario`, `armar_paquete` y `simular_envio`. | Una reexportación con nombre de `src/tools/proveedor.ts`. Son los mismos objetos que usa el servidor. |

`agent.md` y `SKILL.md` no se editan a mano: si cambia el prompt o el conocimiento, se corre `bun run modulo` y se commitea el resultado.

## Qué los mantiene iguales a la aplicación

- `tests/modulo/generador.test.ts` compara byte a byte `agent.md` y `SKILL.md` con la salida del generador. Editar el prompt o el conocimiento sin regenerar hace fallar la CI.
- `tests/modulo/herramientas.test.ts` exige que cada export de `tools/proveedor.ts` (y de `.opencode/tools/proveedor.ts`) sea la misma referencia (`===`) que la de la aplicación. También exige que ambos archivos se importen con el entorno vacío y sin servidor, y que `proveedor_simular_envio` siga rechazando una llamada sin `confirmado: true`.
- `tests/modulo/opencode.test.ts` exige que `opencode.json` declare el agente con la misma descripción, el mismo modo y los mismos permisos que el frontmatter de `agent.md`, y que cada ruta que nombra exista.
- El guardián de `tests/architecture.test.ts` solo deja que `tools/proveedor.ts` importe `@/tools/proveedor.ts`, y que `.opencode/tools/proveedor.ts` importe `@modulo/tools/proveedor.ts`.

## Cómo montarlo en OpenCode

Se abre OpenCode en la raíz del repositorio. Ahí lo encuentra todo:

- `opencode.json` registra el agente `registro-proveedor` como agente por defecto. Su prompt es `{file:./modulo/agent.md}`, y su descripción, su modo y sus permisos son los del frontmatter. También registra la carpeta de skills `./modulo/skill`.
- `.opencode/tools/proveedor.ts` reexporta `modulo/tools/proveedor.ts`. OpenCode solo carga herramientas desde `.opencode/tools/` y nombra cada export `<archivo>_<export>`, así que expone `proveedor_leer_solicitud`, `proveedor_mapear_campos`, `proveedor_generar_formulario`, `proveedor_armar_paquete` y `proveedor_simular_envio`, los mismos nombres que ve el modelo en el servidor. `modulo/` sigue siendo la única fuente y `.opencode/` solo la enlaza.
- Las herramientas resuelven los fixtures y `out/` desde `ctx.directory`, nunca con rutas absolutas, y aceptan el id de sesión como `sessionId` o como `sessionID`, que es el nombre que usa OpenCode.
- Los alias `@/` y `@modulo/` salen del `tsconfig.json` de la raíz.

## Límites conocidos

- **La pregunta de confirmación (D-80).** En el servidor, el cierre del turno escribe la pregunta de confirmación antes de cualquier envío. Fuera del servidor nadie escribe esa pregunta. La red de seguridad tiene dos partes: la skill dice que `proveedor_simular_envio` solo se usa después de una confirmación explícita de la analista, y la propia herramienta rechaza cualquier llamada sin `confirmado: true`. El rechazo viaja con la reexportación porque es el mismo objeto.
- **El frontmatter llega al prompt.** La documentación de OpenCode no dice que `{file:…}` quite el frontmatter, así que el agente recibe las líneas de `description`, `mode` y `permission` como un preámbulo corto antes del prompt. Si se prefiere un prompt limpio, el cambio es una línea: `"prompt": "{file:./agent/prompt.md}"`, que tiene los mismos bytes que el cuerpo de `agent.md`.
- **Formato verificado, no ensayado en vivo (D-83).** El formato de `opencode.json`, de las skills y de las herramientas se verificó contra la documentación de OpenCode el 2026-10-15. El módulo no se ejecutó dentro de una sesión real de OpenCode. Hay dos supuestos sin probar: que OpenCode busca `<nombre>/SKILL.md` dentro de cada carpeta de `skills`, resuelta desde el archivo de configuración, y que su cargador de herramientas resuelve los alias del `tsconfig.json` y acepta los esquemas de zod 4. Si alguno falla, falla solo dentro de OpenCode. La aplicación y la CI no se ven afectadas.
