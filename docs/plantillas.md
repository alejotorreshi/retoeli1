# Plantillas de conocimiento

Las plantillas de `src/knowledge/plantillas/*.md` usan un subconjunto de mustache que implementa `src/domain/engines/motor-plantillas.engine.ts`:

| Sintaxis | Efecto |
|---|---|
| `{{nombre}}` | Inserta un valor escalar. Los saltos de línea se aplanan y, en las plantillas markdown, `\|` se escapa. |
| `{{#lista}}…{{/lista}}` | Repite el bloque una vez por fila de la lista. Dentro del bloque se leen los campos de la fila y, si no existen, los del contexto. |
| `{{^lista}}…{{/lista}}` | Muestra el bloque solo si la lista está vacía. |

No hay secciones anidadas ni condicionales booleanos. Una variable o sección desconocida, o una etiqueta sin cerrar, hace fallar el render con `REGLAS_INVALIDAS`. Así una plantilla mal editada nunca produce un documento a medias.

## Sección como condición

Para mostrar un bloque solo cuando se cumple una condición, el dominio pasa una lista con una fila vacía (bloque visible) o una lista vacía (bloque oculto). Esa lista la construye `seccionSi(condicion)` de `motor-plantillas.ts`, con el tipo `SeccionCondicional`. Por ejemplo, `hay_soportes_pendientes` en `borrador-correo.md`:

```
{{#hay_soportes_pendientes}}Quedan pendientes estos soportes:
{{/hay_soportes_pendientes}}
```

La fila vacía no aporta campos. Dentro del bloque se siguen leyendo las variables del contexto.

## Nombres de soporte en las salidas

Las salidas para personas (`checklist.md`, `borrador-correo.md` y `ENVIO-SIMULADO.md`) nombran cada soporte con `NOMBRE_SOPORTE` de `src/config/strings.ts`. Esa tabla es la fuente que manda. La `descripcion` de `repositorio/soportes/index.json` no se usa como nombre porque describe el archivo concreto, con detalles como la vigencia o el año ("Estados financieros auditados año 2025"), y un nombre de soporte tiene que servir para cualquier versión del archivo.

Si un tipo no está en la tabla, la salida muestra el id crudo. Así el soporte nunca desaparece de la salida, pero el id puede llegar al correo del cliente. Por eso, al agregar un tipo nuevo al repositorio de soportes hay que agregar también su nombre a `NOMBRE_SOPORTE`. La prueba de cobertura de `tests/golden/nombres-soporte.test.ts` lo exige para los tipos de los fixtures.

Los datos de las herramientas, su `resumen`, `log.jsonl` y la salida de `demo.ts` conservan el id crudo, que es la clave de máquina del contrato v1.
