# Estructura de `src/`

Cada archivo vive en la carpeta de su rol y lleva el sufijo de ese rol. `tests/architecture.test.ts` lo exige con G5 (tabla de sufijos por carpeta), G13 (ningún archivo suelto en `src/` ni en la raíz de una capa) y G14 (cada prueba unitaria es espejo de un módulo).

## Roles del dominio

| Carpeta | Sufijo | Rol |
|---|---|---|
| `domain/engines/` | `.engine.ts` | Algoritmo central que conduce un flujo: el mapeo de etiquetas (`mapeo`) y el motor de plantillas (`motor-plantillas`). |
| `domain/builders/` | `.builder.ts` | Arma una estructura de salida con datos ya decididos: formulario, checklist, borrador, portal, índice del glosario y campo presentado. |
| `domain/policies/` | `.policy.ts` | Decide o valida según una regla de negocio: soportes, vigencias, PII, identificador tributario, plantilla del caso, comparación de mapeos y textos de reglas. |
| `domain/selectors/` | `.selector.ts` | Lee o proyecta datos de una entrada sin decidir nada: maestro y solicitud. |
| `domain/utils/` | `.util.ts` | Función genérica sin regla de negocio: fecha, normalización, resultado, formato de issues y nombre de error. |
| `domain/types/` | `.type.ts` | Solo tipos, en una carpeta plana en la raíz de la capa. |

`motor-plantillas.engine.ts` se mantiene entero: `plantillaInvalida` es el `Fallo` que emite el motor y `seccionSi` codifica el protocolo de secciones `[{}]`/`[]` que solo este motor interpreta.

`formatear-issues.util.ts` y `nombre-error.util.ts` solo los importan infra y tools. Viven en el dominio porque es la única capa a la que ambas pueden llegar sin romper la dirección de las dependencias.

## Herramientas, demo y config

- `tools/proveedor.ts` queda en la raíz de `tools/` porque el PRD (6.2) fija su nombre.
- `tools/factories/*.factory.ts` construye las herramientas, y `tools/wiring/entorno.wiring.ts` es el único composition root que importa infra. El guardián de capas lo reconoce por su ruta exacta; cualquier otro archivo de `tools/` sigue sin poder importar infra.
- `demo/runners/ejecutar-demo.runner.ts` ejecuta la demo que lanza `demo.ts`.
- `config/env.ts` y `config/strings.ts` son las otras dos excepciones permitidas en la raíz de una capa. `env.ts` es la única frontera con el entorno (esquema, lector y `pinExecutionDate`), así que ningún sufijo de rol lo describe. La usuaria fijó `strings.ts` como fuente única de textos.

## Pruebas unitarias

`tests/unit/` es plana y cada archivo se llama `<módulo>.<rol>.test.ts`, espejo de un `src/**/<módulo>.<rol>.ts`. La carpeta no se anida porque varias pruebas resuelven fixtures con `new URL("../../…", import.meta.url)`. Las pruebas de contrato, golden y e2e se nombran por escenario.
