---
phase: 01-n-cleo-determinista
reviewed: 2026-10-13T15:16:31Z
depth: standard
files_reviewed: 28
files_reviewed_list:
  - docs/estructura.md
  - docs/plantillas.md
  - src/application/use-cases/simular-envio.use-case.ts
  - src/config/constants/errors.constants.ts
  - src/config/constants/maestro.constants.ts
  - src/config/constants/patterns.constants.ts
  - src/config/strings.ts
  - src/domain/builders/borrador.builder.ts
  - src/domain/builders/checklist.builder.ts
  - src/domain/policies/paquete-vigente.policy.ts
  - src/domain/types/borrador.type.ts
  - src/domain/types/checklist.type.ts
  - src/infra/output/xlsx-writer.adapter.ts
  - src/knowledge/plantillas/borrador-correo.md
  - src/knowledge/plantillas/checklist.md
  - tests/contract/maestro-incompleto.test.ts
  - tests/contract/simular-envio.test.ts
  - tests/golden/borrador-envio.test.ts
  - tests/golden/formulario-xlsx.test.ts
  - tests/golden/nombres-soporte.test.ts
  - tests/golden/paquete.test.ts
  - tests/helpers/tipo-celda.helper.ts
  - tests/helpers/types/xlsx-leer.type.ts
  - tests/helpers/xlsx-leer.helper.ts
  - tests/unit/borrador.builder.test.ts
  - tests/unit/checklist.builder.test.ts
  - tests/unit/paquete-vigente.policy.test.ts
  - tests/unit/xlsx-writer.adapter.test.ts
findings:
  critical: 1
  warning: 3
  info: 4
  total: 8
status: issues_found
---

# Fase 01: informe de revisión de código

**Revisado:** 2026-10-13T15:16:31Z
**Profundidad:** standard
**Archivos revisados:** 28
**Estado:** issues_found

## Resumen

Revisé solo los cambios desde `2fb3986`, es decir, los 12 commits `fix(01): …` que respondieron a la revisión anterior (CR-01, WR-01, WR-02, WR-04 e IN-01 a IN-06). Leí el diff y los archivos completos, y seguí las llamadas a `evaluarEstadoPaquete`, `armar-paquete.use-case.ts`, `listPackage`, `soportes.policy.ts` y `mapeo.engine.ts`. Tres hallazgos los comprobé ejecutando código: dos sondas de contrato y una unitaria, corridas desde el scratchpad sin tocar el repositorio, más la suite completa.

Cómo quedó cada corrección:

- **IN-03, IN-05 e IN-06** quedaron bien. `motivos_bloqueo` es ahora la única fuente de los bloqueos. El writer xlsx mide la línea más larga y ajusta el texto cuando hay saltos. Los anchos del golden quedaron como literales.
- **CR-01** quedó a medias. La política nueva solo detecta archivos *faltantes* en `paquete/`. No detecta un paquete cuyo estado cambió con los mismos nombres de archivo: un soporte que vence entre armar y enviar, o uno que sale del repositorio. En esos dos casos el envío se acepta mientras `paquete/borrador-correo.md` sigue diciendo "Adjuntamos…" y "listo para la firma". Además, en el segundo caso el archivo queda en `paquete/` sin aparecer en el registro de envío. Las dos cosas las comprobé ejecutando el código.
- **WR-02** introdujo una regresión. Cuando los únicos campos por confirmar son bancarios, el borrador vuelve a declarar el formulario "listo para la firma", mientras el checklist interno manda confirmar ese campo con el cliente.
- **IN-04** filtra de forma distinta en el checklist y en el borrador.
- **Suite de pruebas:** `bun run check` pasa, pero `bun test` da 545/546 en esta máquina. La prueba de cobertura de `nombres-soporte.test.ts` recorre `casos/` sin filtrar directorios y falla con el `.DS_Store` que creó Finder.

No repito WR-03 (ids crudos en la demo), porque quedó como decisión humana, ni la redacción del correo ya aprobada en UAT.

## Problemas críticos

### CR-01: `PAQUETE_DESACTUALIZADO` solo detecta archivos faltantes; un paquete con el estado cambiado pasa el envío y el borrador viejo promete adjuntos que no salen

**Archivo:** `src/domain/policies/paquete-vigente.policy.ts:3-17`, `src/application/use-cases/simular-envio.use-case.ts:29-33`

**Problema:** `archivosFaltantesEnPaquete` arma el conjunto esperado con el formulario más cada `soporte.archivo` no nulo y lo cruza con el listado. Por eso no ve dos cambios de estado que también vuelven obsoleto el paquete. El mensaje del error mismo promete detectarlos ("ya no coincide con los soportes vigentes"). Lo comprobé con el flujo real de herramientas en un proyecto temporal:

1. **Un soporte vence entre armar y enviar.** Se arma CO con `FECHA_EJECUCION=2026-09-03`. Después se envía con `2026-10-05`, cuando `camara_comercio` ya venció el 2026-09-30. `simular_envio` responde `ok: true`, y `ENVIO-SIMULADO.md` pone la cámara en "Soportes vencidos que no se envían" con el bloqueo. Pero `paquete/borrador-correo.md`, que es el correo que la persona revisó para confirmar, sigue diciendo `- Certificado de existencia y representación legal (camara-comercio-2026-08.txt)` como adjunto y "El formulario queda listo para la firma de nuestro representante legal." El archivo sigue en `paquete/` con el mismo nombre, así que nada falta en el listado. Pasa también en producción: la cámara de comercio vale 30 días, y basta armar un día y enviar al siguiente.
2. **Un soporte sale del repositorio después de armar.** Se arma CO y luego se quita `rut` del índice. `simular_envio` responde `ok: true` con `bloqueos: ["ausente: rut"]`. `paquete/rut-2026.txt` sigue en el paquete, pero no aparece ni en "Archivos que se envían" ni en "Soportes vencidos que no se envían". Es exactamente la omisión silenciosa que atacaba el CR-01 original. El borrador sigue anunciando "Registro Único Tributario (rut-2026.txt)" y "listo para la firma".

Tampoco se exige `borrador-correo.md`. Si se borra a mano, el envío se registra igual, aunque el correo que supuestamente se envía ya no existe. `archivosEsperados` no incluye `ARCHIVOS_PAQUETE.BORRADOR_CORREO`.

En los dos casos la confirmación humana explícita se dio sobre un borrador que contradice lo que el registro declara enviado. Esto va contra el valor central del proyecto, y el informe de corrección asegura justamente lo contrario ("evita que el `borrador-correo.md` viejo siga diciendo 'Adjuntamos…'").

**Corrección:** comparar el *contenido* que `armar_paquete` produciría hoy, no solo los nombres de archivo. La salida más directa es volver a renderizar el borrador con el checklist actual y compararlo con el que está en `paquete/`. El borrador no lleva la fecha, así que el resultado es estable mientras el estado no cambie. A eso se suman los archivos sobrantes:

```ts
export function paqueteDesactualizado(
  esperado: { readonly archivos: readonly string[]; readonly borrador: string },
  real: { readonly listado: readonly string[]; readonly borrador: string | null },
): readonly string[] {
  const presentes = new Set(real.listado);
  const permitidos = new Set([...esperado.archivos, ...Object.values(ARCHIVOS_PAQUETE)]);
  const faltantes = esperado.archivos.filter((archivo) => !presentes.has(archivo));
  const sobrantes = real.listado.filter((archivo) => !permitidos.has(archivo));
  const borradorDistinto = real.borrador !== esperado.borrador ? [ARCHIVOS_PAQUETE.BORRADOR_CORREO] : [];
  return [...faltantes, ...sobrantes, ...borradorDistinto];
}
```

Para eso hace falta un puerto `salida.leerDePaquete(caso, nombre)` y reutilizar `renderizarBorrador` desde `simular-envio.use-case.ts`. Conviene moverlo a un servicio de aplicación compartido con `armar-paquete.use-case.ts`. Hay que añadir pruebas de contrato para los dos escenarios de arriba: cambiar `FECHA_EJECUCION` entre armar y enviar, y quitar un tipo del índice.

## Advertencias

### WR-01: Regresión de WR-02: si los únicos campos por confirmar son bancarios, el borrador declara el formulario "listo para la firma" y el checklist pide confirmarlos con el cliente

**Archivo:** `src/domain/builders/borrador.builder.ts:59,64,83-84`, `src/domain/builders/checklist.builder.ts:68-70`, `src/knowledge/plantillas/checklist.md:29`

**Problema:** antes del commit 395eb57, `firma_lista` exigía `requiere_confirmacion.length === 0`. Ahora `hayPorConfirmar` sale de `confirmaciones_al_cliente`, que excluye las rutas `banco.*`. Un caso listo cuyo único campo por confirmar es bancario da `firma_lista: [{}]` y `firma_tras_confirmar: []`, y el correo dice "El formulario queda listo para la firma de nuestro representante legal." con un valor bancario sin confirmar en el formulario. Lo comprobé con una sonda sobre `construirChecklist` y `construirDatosBorrador` usando `banco.numero_cuenta` en `requiere_confirmacion`.

Al mismo tiempo, `checklist.md` sigue renderizando todo `por_confirmar` como "Confirmar con el cliente el campo "Número de cuenta"". La analista recibe la instrucción de preguntarle al cliente justo lo que el correo omite a propósito. Con los fixtures actuales no ocurre, porque todos los campos bancarios salen `lleno`. Basta que el maestro traiga un campo bancario no textual (por ejemplo, `numero_cuenta` como número, lo que dispara `campoNoTextual`) o que se suba `confianza.umbral` por encima de 0.85. Ninguna prueba fija la bandera de firma en ese caso: la prueba unitaria de WR-02 usa un caso con otro campo no bancario por confirmar.

**Corrección:** separar "hay algo sin confirmar" de "qué se le pregunta al cliente".

```ts
const hayConfirmacionInterna = checklist.requiere_confirmacion.length > checklist.confirmaciones_al_cliente.length;
const hayPreguntas = hayPorConfirmar || hayCamposSinDato || conAvisoEmisor.length > 0;
firma_lista: seccionSi(checklist.listo_para_firma && !hayPreguntas && !hayConfirmacionInterna),
firma_tras_confirmar: seccionSi(checklist.listo_para_firma && (hayPreguntas || hayConfirmacionInterna)),
```

En `checklist.md`, la casilla de los campos bancarios debería decir "Confirmar internamente el campo …" y no "con el cliente". Por ejemplo, se puede exponer `por_confirmar_internos` desde `construirDatosChecklist`. Hay que añadir una prueba unitaria con solo un campo `banco.*` por confirmar.

### WR-02: El checklist pide confirmar con el cliente el emisor de un soporte vencido que el borrador no pregunta

**Archivo:** `src/domain/builders/checklist.builder.ts:118`, `src/domain/builders/borrador.builder.ts:61-63`

**Problema:** `construirDatosChecklist` calcula `con_aviso_emisor` sobre *todos* los soportes, mientras `construirDatosBorrador` filtra primero los `PRESENTE`. En HN, el `checklist.md` generado tiene la casilla "Confirmar con el cliente si acepta el soporte Certificación de aportes parafiscales, emitido en CO", pero el borrador que la analista va a enviar solo pregunta por la cámara de comercio y el RUT. La casilla no tiene a dónde ir, y la analista puede creer que el correo ya hace la pregunta. Las dos salidas aplican la misma regla de IN-04 con filtros distintos, y ninguna prueba compara las dos listas.

**Corrección:** decidir una sola regla y calcularla una vez en `construirChecklist`, por ejemplo `checklist.avisos_emisor_al_cliente`, para que las dos salidas la lean de ahí. Si el vencido se renueva, la pregunta se hace con la versión nueva, así que lo coherente es filtrar `PRESENTE` en ambos lados:

```ts
con_aviso_emisor: soportesConAvisoEmisor(soportes.filter((s) => s.estado === ESTADO_SOPORTE.PRESENTE)),
```

### WR-03: La prueba de cobertura de nombres falla con cualquier archivo suelto en `casos/` (hoy, `.DS_Store`)

**Archivo:** `tests/golden/nombres-soporte.test.ts:92-96`

**Problema:** `tiposDeFixtures` hace `readdir(join(fixtures, CASOS_DIR))` y trata cada entrada como un directorio de caso. En esta máquina, Finder creó `reto-01/fixtures/reto-01/casos/.DS_Store`, que `.gitignore` ignora pero `crearProyectoTemporal` copia igual, y la prueba falla con `ENOTDIR`. `bun test` da **545 pass / 1 fail**, así que el "546 en verde" del informe de corrección no se reproduce en macOS. Los adaptadores de producción (`case-resolver.adapter.ts`) usan `withFileTypes`. La prueba no.

**Corrección:** filtrar solo directorios, sin tocar `reto-01/`.

```ts
const entradas = await readdir(join(fixtures, CASOS_DIR), { withFileTypes: true });
for (const caso of entradas.filter((entrada) => entrada.isDirectory()).map((entrada) => entrada.name)) {
```

## Informativos

### IN-01: `archivosEsperados` duplica la regla de qué copia `armar_paquete` a `paquete/`

**Archivo:** `src/domain/policies/paquete-vigente.policy.ts:3-8` y `src/application/use-cases/armar-paquete.use-case.ts:52-64`

**Problema:** el conjunto "formulario más cada `soporte.archivo` no nulo" está escrito dos veces, en `copiarContenido` y en la política. Si mañana `armar_paquete` deja de copiar los vencidos, o empieza a copiar otro archivo, la política queda desalineada. En ese caso o rechaza todos los envíos o deja pasar paquetes incompletos, y ninguna prueba une las dos definiciones.

**Corrección:** exportar una sola función de dominio, por ejemplo `archivosDelPaquete(checklist, formulario)`, y usarla tanto en `copiarContenido` como en la política.

### IN-02: El respaldo `sinVigencia` produce un texto que se contradice y está en un camino inalcanzable

**Archivo:** `src/domain/builders/checklist.builder.ts:24`, `tests/unit/checklist.builder.test.ts:48-53`

**Problema:** `soportes.policy.ts` solo marca `VENCIDO` cuando hay `vigencia_hasta`, porque `null` se trata como sin vencimiento. Aun así, el builder conserva un respaldo que daría "vencido: parafiscales (no aplica)", y la prueba de IN-02 fija ese texto como contrato del campo `bloqueos`. El texto dice que el soporte está vencido y a la vez que la vigencia no aplica.

**Corrección:** que el tipo lo haga imposible. Se puede convertir `SoporteEvaluado` en una unión discriminada en la que `VENCIDO` lleva `vigencia_hasta: FechaISO`, y así desaparece el `??`. También se puede devolver `ERROR_INTERNO` si llega un vencido sin fecha.

### IN-03: `docs/plantillas.md` cita un archivo que no existe

**Archivo:** `docs/plantillas.md:15`

**Problema:** la sección editada en WR-01 dice "`seccionSi(condicion)` de `motor-plantillas.ts`", pero el archivo es `src/domain/engines/motor-plantillas.engine.ts`, como dice el párrafo de arriba en el mismo documento.

**Corrección:** cambiar la cita a `motor-plantillas.engine.ts`.

### IN-04: El fixture de la prueba unitaria de la política se contradice a sí mismo

**Archivo:** `tests/unit/paquete-vigente.policy.test.ts:13-26`

**Problema:** `CHECKLIST` tiene `listo_para_firma: false` con `motivos_bloqueo: []` y `bloqueos: []`, aunque trae un soporte vencido y uno ausente. Hoy la política no lee esos campos. Pero si se adopta la corrección de CR-01, que compara estado, o si se reutiliza el fixture, las aserciones partirían de un `Checklist` que `construirChecklist` nunca produciría.

**Corrección:** construir el fixture con `construirChecklist(soportes, [], HOY)` en lugar de escribirlo a mano.

---

_Revisado: 2026-10-13T15:16:31Z_
_Revisor: Claude (gsd-code-reviewer)_
_Profundidad: standard_
