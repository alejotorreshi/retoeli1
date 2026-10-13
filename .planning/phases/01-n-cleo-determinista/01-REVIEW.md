---
phase: 01-n-cleo-determinista
reviewed: 2026-10-13T04:22:47Z
depth: standard
files_reviewed: 21
files_reviewed_list:
  - src/application/use-cases/simular-envio.use-case.ts
  - src/config/constants/xlsx.constants.ts
  - src/config/strings.ts
  - src/domain/builders/borrador.builder.ts
  - src/domain/builders/checklist.builder.ts
  - src/domain/types/borrador.type.ts
  - src/domain/types/checklist.type.ts
  - src/infra/output/xlsx-writer.adapter.ts
  - src/knowledge/plantillas/borrador-correo.md
  - src/knowledge/plantillas/checklist.md
  - src/knowledge/plantillas/envio-simulado.md
  - tests/contract/simular-envio.test.ts
  - tests/golden/borrador-envio.test.ts
  - tests/golden/formulario-xlsx.test.ts
  - tests/golden/nombres-soporte.test.ts
  - tests/golden/paquete.test.ts
  - tests/helpers/types/xlsx-leer.type.ts
  - tests/helpers/xlsx-leer.helper.ts
  - tests/unit/borrador.builder.test.ts
  - tests/unit/checklist.builder.test.ts
  - tests/unit/xlsx-writer.adapter.test.ts
findings:
  critical: 1
  warning: 4
  info: 6
  total: 11
status: issues_found
---

# Fase 01: informe de revisión de código (planes 01-12 a 01-15)

**Revisado:** 2026-10-13T04:22:47Z
**Profundidad:** standard
**Archivos revisados:** 21
**Estado:** issues_found

## Resumen

Esta revisión cubre los cambios de los planes de cierre de brechas 01-12 a 01-15 desde `bd3642d`: el ancho de columna y el ajuste de texto del xlsx, el borrador de correo y el registro de envío que ya no dicen "firmado" con el paquete BLOQUEADO, y los nombres de soporte en español en las salidas para personas. Los datos de herramienta siguen con los ids crudos. Para revisar leí el código de cada archivo y lo crucé con `estado-paquete.service.ts`, `soportes.policy.ts`, `motor-plantillas.engine.ts`, `armar-paquete.use-case.ts` y `ejecutar-demo.runner.ts`. Además inspeccioné las salidas reales de `out/` para los cuatro casos y corrí las 8 suites del alcance (118 pruebas en verde).

El cálculo de anchos del xlsx es correcto, determinista y está bien probado. Los problemas aparecen en la veracidad de las salidas para personas, que era justo el objetivo de estos planes:

1. `ENVIO-SIMULADO.md` registra "Sin bloqueos" aunque un soporte exigido o el formulario no esté en `paquete/`, y hay una prueba que fija ese comportamiento (CR-01).
2. El borrador para el cliente mezcla datos faltantes del maestro con soportes pendientes. Promete enviarlos "por separado" y puede declarar el formulario "listo para la firma" en el mismo correo (WR-01).
3. El borrador copia al cliente las notas internas que son para la analista (WR-02).
4. El cierre de G-01-H4c ("toda salida para personas usa nombres") no se cumple en la salida de `demo.ts` (WR-03), y el guardián deja sin vigilar 2 de los 7 ids (WR-04).

## Narrative Findings (AI reviewer)

## Critical Issues

### CR-01: El registro de envío omite en silencio los archivos que faltan en `paquete/` y declara "Sin bloqueos"

**Archivo:** `src/domain/builders/borrador.builder.ts:89-110`, `src/application/use-cases/simular-envio.use-case.ts:24-32`, `tests/contract/simular-envio.test.ts:219-225`
**Problema:** `simular_envio` vuelve a evaluar los soportes contra el repositorio en el momento del envío (`evaluarEstadoPaquete`). Después cruza ese resultado con el listado real de `paquete/` (`listado.filter((archivo) => alCliente.has(archivo))`). Si un archivo que debía ir al cliente no está en el listado, desaparece del registro sin generar ningún bloqueo. Los bloqueos salen solo de `motivosDeBloqueo(checklist.soportes)`, que mira el repositorio y no el paquete. Hay tres formas de llegar a este estado:
- Alguien borra o mueve un soporte o el formulario de `paquete/` (la carpeta es para manejo humano). La prueba `un soporte borrado de paquete/ no aparece como enviado` fija exactamente ese caso: en CO, sin `rut-2026.txt`, el registro dice `Sin bloqueos.` aunque el RUT exigido no salga al cliente.
- Se renueva un soporte en el repositorio entre `armar_paquete` y `simular_envio`. La evaluación elige el archivo nuevo (presente), que no está en `paquete/`. El archivo viejo ya no figura como vencido, así que no sale en "Archivos que se envían" ni en "Soportes vencidos que no se envían", y el registro dice "Sin bloqueos".
- Aparece en el repositorio un soporte que estaba ausente. Pasa lo mismo: sin bloqueo y sin el archivo.

Además, `paquete/borrador-correo.md` se generó al armar el paquete y sigue diciendo "Adjuntamos … (archivo)". El registro que confirma la acción externa contradice entonces el correo que la acompaña. El texto de `formulario_en_portal` (`envio-simulado.md:12`) también cita `paquete/{{formulario}}` sin comprobar que el archivo exista en el listado.

Es el artefacto de auditoría de una acción confirmada por la persona, y en este estado afirma algo falso: que no hay bloqueos cuando un soporte exigido no se envía.
**Corrección:** Hay que calcular lo que falta en el paquete y tratarlo como bloqueo, o bien rechazar el envío por paquete desactualizado. Por ejemplo, en el builder:
```ts
function faltanEnPaquete(alCliente: ReadonlySet<string>, listado: readonly string[]): readonly string[] {
  const presentes = new Set(listado);
  return [...alCliente].filter((archivo) => !presentes.has(archivo));
}
// en construirDatosEnvio
const noEnPaquete = faltanEnPaquete(alCliente, listado);
bloqueos: [
  ...motivosDeBloqueo(checklist.soportes),
  ...noEnPaquete.map(TEXTO_ENVIO.noEstaEnPaquete),
].map((bloqueo) => ({ bloqueo })),
```
La otra opción es que `simularBajoCandado` devuelva `fallo(CODIGO_ERROR.PAQUETE_DESACTUALIZADO)` cuando `noEnPaquete.length > 0`, con un mensaje que pida volver a correr `proveedor_armar_paquete`. En los dos casos hay que invertir la prueba de `simular-envio.test.ts:219` para que exija un bloqueo o el error, y añadir la variante del soporte renovado entre armar y enviar.

## Warnings

### WR-01: El borrador mezcla datos faltantes del maestro con soportes pendientes, promete enviarlos y puede declararse "listo para la firma" a la vez

**Archivo:** `src/domain/builders/borrador.builder.ts:43-51,59,74-77`, `src/knowledge/plantillas/borrador-correo.md:15-23`, `tests/unit/borrador.builder.test.ts:79-88`
**Problema:** `pendientesDe` pone `checklist.faltantes` (etiquetas que no existen en el maestro) en la misma lista que los soportes ausentes y vencidos. La plantilla cierra esa lista con "Los enviaremos por separado." En `out/ec-corp-andina/paquete/borrador-correo.md` el correo le promete al cliente un "Número de contribuyente especial" que Periferia no tiene en el maestro. Eso choca con el valor central del proyecto ("nunca inventa un dato"). Además, RN3 dice que un `faltante` no bloquea `listo_para_firma`. Con `listo_para_firma = true`, faltantes y ningún campo por confirmar, el correo sale así:

> Quedan pendientes: - X. Los enviaremos por separado. El formulario queda listo para la firma de nuestro representante legal.

Es decir, un formulario con celdas vacías anunciado como listo. A la inversa, `firma_bloqueada` dice "falta completar los pendientes indicados" y atribuye el bloqueo también a los campos faltantes, que no bloquean. Las pruebas unitarias no cubren nada de esto, porque `checklist()` fija `faltantes: []` en todas las combinaciones.
**Corrección:** Separar los dos conceptos en el contexto: `soportes_pendientes` (ausentes y vencidos, que sí se envían después) y `campos_sin_dato` (faltantes), con un texto propio que no prometa un envío, como "No contamos con estos datos; les confirmaremos si aplican". Activar `firma_lista` solo si `checklist.faltantes.length === 0`, o añadir una cuarta variante "listo para firma con campos sin dato". Que el texto de `firma_bloqueada` nombre solo los soportes. Por último, agregar a `borrador.builder.test.ts` las combinaciones con `faltantes` no vacío.

### WR-02: El correo al cliente copia literalmente las notas internas que son para la analista

**Archivo:** `src/domain/builders/borrador.builder.ts:71`, `src/knowledge/plantillas/borrador-correo.md:12-14`, `src/domain/builders/checklist.builder.ts:53`
**Problema:** `por_confirmar` lleva `nota` tal cual al correo. Esas notas están redactadas para la analista y hablan del cliente en tercera persona. La salida real de EC, HN y PA dice:

> Antes de la firma necesitamos que nos confirmen estos campos: - RUC: Identificador extranjero: confirmar si el cliente acepta el NIT colombiano

Otras notas posibles son peores. El fallback `TEXTO_COMUN.porConfirmar` sale como "confirmar con el cliente", dirigido al propio cliente. `TEXTO_MAPEO.datoNoTextual` sale como "El maestro tiene este dato, pero no como texto: confirmar qué valor escribir", que le pide al cliente resolver un problema de calidad del maestro interno de Periferia y además lo expone. Si el campo es bancario, el correo termina pidiendo al cliente que confirme el dato bancario de Periferia, cosa que RN2 excluye del borrador.
**Corrección:** En el borrador no usar `nota`. Usar una pregunta para el cliente que se derive de la etiqueta y viva en `strings.ts`, por ejemplo `TEXTO_BORRADOR.preguntaCampo(etiqueta)`, o un texto por regla en `reglas.json`, como `identificador_tributario.pregunta_cliente`. Las notas internas deben quedar solo en `checklist.md` y en el formulario. Conviene también excluir del borrador los campos cuya ruta empieza por `banco.`.

### WR-03: G-01-H4c no queda cerrado: la salida de `demo.ts` sigue mostrando ids crudos

**Archivo:** `src/config/strings.ts:72-79,186-191` (usado por `src/demo/runners/ejecutar-demo.runner.ts:99-109,142-149`, fuera del alcance listado), `tests/golden/nombres-soporte.test.ts:23`
**Problema:** El plan 01-15 declara que "every human-facing output uses display names from strings.ts". Pero la salida estándar de `demo.ts`, que es un entregable que el evaluador ejecuta (PRD §6.6), arma `Soportes ausentes: …` con `textoDe(soporte, "tipo")` y `Estado: BLOQUEADO (…)` con `TEXTO_CHECKLIST.bloqueadoPor(bloqueos)` a partir de `data.bloqueos`, que trae ids crudos. Para EC imprime `certificado_cumplimiento_tributario` y `ausente: certificado_cumplimiento_tributario`. El `resumen` de herramienta que el front muestra como "resultado resumido" (PRD §6.1) también sale con ids crudos (`RESUMEN_HERRAMIENTA.paqueteBloqueado` y `envioConBloqueos`). `SALIDAS_LEGIBLES` en el guardián no incluye la salida de la demo, así que la brecha pasa sin detectarse.
**Corrección:** En el runner de la demo, resolver los nombres con `TEXTO_SOPORTE.nombre(tipo)` y armar el estado a partir de `data.checklist.soportes` con `motivosDeBloqueo`, no a partir de `data.bloqueos`. Agregar al guardián una prueba que capture la salida de `ejecutarDemo` (con el `escribir` inyectado) y compruebe que no contiene ids. Si el `resumen` debe conservar los ids por el contrato v1, documentarlo de forma explícita en `SOLUCION.md` como excepción.

### WR-04: El guardián de nombres no vigila `rut` ni `parafiscales`

**Archivo:** `tests/golden/nombres-soporte.test.ts:30,127-131`
**Problema:** `IDS_SNAKE` filtra `Object.keys(NOMBRE_SOPORTE)` por `tipo.includes("_")`, así que excluye `rut` y `parafiscales`, 2 de los 7 ids. Seguramente se hizo porque los nombres de archivo (`rut-2026.txt`, `parafiscales-2026-07.txt`) contienen esas cadenas. El efecto es que una regresión que vuelva a escribir `- ausente: rut`, `- vencido: parafiscales (…)` o `| rut |` en el borrador, el checklist o el registro de envío pasa el guardián. Lo que la prueba describe ("ningún id snake_case de soporte") no coincide con lo que de verdad comprueba.
**Corrección:** Buscar los ids en los contextos donde se renderizan nombres, no como subcadena libre. Por ejemplo, para cada `tipo` de `Object.keys(NOMBRE_SOPORTE)`:
```ts
const formas = [`ausente: ${tipo}`, `vencido: ${tipo} (`, `| ${tipo} |`, `- ${tipo}\n`, `- ${tipo} (`, `soporte ${tipo}`];
expect(formas.filter((forma) => texto.includes(forma))).toEqual([]);
```

## Info

### IN-01: `NOMBRE_SOPORTE` duplica y contradice la `descripcion` del índice de soportes

**Archivo:** `src/config/strings.ts:81-94`
**Problema:** `repositorio/soportes/index.json` ya trae una `descripcion` legible por soporte, y la tabla nueva no coincide con ella: "Certificación bancaria" frente a "Certificación de cuenta bancaria", y "Certificación de aportes parafiscales" frente a "Certificación de pago de aportes parafiscales y seguridad social (revisor fiscal)". Las claves son literales de los fixtures sin constante de origen. Un tipo nuevo en un repositorio real cae al id crudo, que termina en el correo al cliente, y la prueba de cobertura solo mira los fixtures.
**Corrección:** Documentar en `SOLUCION.md` qué fuente manda, o usar `descripcion` del índice como nombre cuando exista y dejar la tabla solo para tipos ausentes.

### IN-02: Respaldo mágico `?? ""` en el bloqueo por vencimiento

**Archivo:** `src/domain/builders/checklist.builder.ts:18`
**Problema:** `soporte.vigencia_hasta ?? ""` produciría `vencido: X ()`. Ese estado no puede ocurrir (un soporte vencido siempre tiene fecha), pero el respaldo lo esconde en lugar de hacerlo imposible.
**Corrección:** Modelar `SoporteEvaluado` como una unión discriminada en la que `estado: VENCIDO` implique `vigencia_hasta: string`, o usar `TEXTO_CHECKLIST.sinVigencia`.

### IN-03: El registro de envío deriva los bloqueos por un camino paralelo al del checklist

**Archivo:** `src/domain/builders/borrador.builder.ts:108`, `src/domain/builders/checklist.builder.ts:33-45`
**Problema:** `construirDatosEnvio` vuelve a calcular `motivosDeBloqueo(checklist.soportes)` en lugar de traducir `checklist.bloqueos`. Si `construirChecklist` llega a añadir un bloqueo que no venga de un soporte, los datos de herramienta y `listo_para_firma` lo reflejarían, pero `ENVIO-SIMULADO.md` y `checklist.md` no.
**Corrección:** Guardar en `Checklist` los bloqueos como estructura (`{ tipo, causa, vigencia }`) y renderizar ids o nombres desde esa misma fuente.

### IN-04: El aviso de emisor distinto no genera ninguna acción ni ninguna pregunta al cliente

**Archivo:** `src/knowledge/plantillas/checklist.md:24-30`, `src/knowledge/plantillas/borrador-correo.md:12-14`
**Problema:** En HN, PA y EC el checklist muestra "Emitido en CO: confirmar si el cliente lo acepta" en cada soporte, pero la sección "Acciones" no trae una casilla para eso y el borrador no le pregunta nada al cliente. La confirmación queda sin dueño.
**Corrección:** Exponer `con_aviso_emisor` en `DatosChecklist` y `DatosBorradorCorreo` y añadir la acción o la pregunta correspondiente.

### IN-05: El ancho del xlsx cuenta puntos de código y no tiene en cuenta saltos de línea ni glifos anchos

**Archivo:** `src/infra/output/xlsx-writer.adapter.ts:15-17,40`
**Problema:** `largoDeTexto` mide la cadena entera. Un valor con `\n` de menos de 58 caracteres no recibe `wrapText`, así que Excel lo muestra en una sola línea, y su ancho se calcula con la longitud total. Los emoji y los caracteres CJK ocupan dos columnas. Hoy el maestro no tiene saltos de línea, así que no hay impacto actual.
**Corrección:** Medir la línea más larga (`texto.split(SALTO_DE_LINEA)`, con la regex en `patterns.constants.ts`) y activar `wrapText` también cuando haya un salto de línea.

### IN-06: Los goldens de anchos reimplementan la fórmula de producción y el tipo de prueba no se deriva de una constante

**Archivo:** `tests/golden/formulario-xlsx.test.ts:185-188`, `tests/helpers/types/xlsx-leer.type.ts:1`
**Problema:** `anchoEsperado` copia `anchoDeColumna`, así que un error en la fórmula se replica en la expectativa (es tautológico). Solo las pruebas unitarias de límites fijan valores concretos. Además, `TipoCelda` es una unión de literales y no `ValorDe<typeof TIPO_CELDA>`, lo que contradice la regla de uniones derivadas de su constante.
**Corrección:** En el golden, fijar anchos esperados literales para las columnas de los fixtures. Declarar `TIPO_CELDA` como `as const` y derivar el tipo de ahí.

---

_Revisado: 2026-10-13T04:22:47Z_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidad: standard_
