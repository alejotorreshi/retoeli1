# Plantillas de conocimiento

Las plantillas de `src/knowledge/plantillas/*.md` usan un subconjunto de mustache que implementa `src/domain/motor-plantillas.ts`:

| Sintaxis | Efecto |
|---|---|
| `{{nombre}}` | Inserta un valor escalar. Los saltos de línea se aplanan y, en las plantillas markdown, `\|` se escapa. |
| `{{#lista}}…{{/lista}}` | Repite el bloque una vez por fila de la lista. Dentro del bloque se leen los campos de la fila y, si no existen, los del contexto. |
| `{{^lista}}…{{/lista}}` | Muestra el bloque solo si la lista está vacía. |

No hay secciones anidadas ni condicionales booleanos. Una variable o sección desconocida, o una etiqueta sin cerrar, hace fallar el render con `REGLAS_INVALIDAS`. Así una plantilla mal editada nunca produce un documento a medias.

## Sección como condición

Para mostrar un bloque solo cuando se cumple una condición, el dominio pasa una lista con una fila vacía (bloque visible) o una lista vacía (bloque oculto). Esa lista la construye `seccionSi(condicion)` de `motor-plantillas.ts`, con el tipo `SeccionCondicional`. Por ejemplo, `hay_pendientes` en `borrador-correo.md`:

```
{{#hay_pendientes}}Quedan pendientes:
{{/hay_pendientes}}
```

La fila vacía no aporta campos. Dentro del bloque se siguen leyendo las variables del contexto.
