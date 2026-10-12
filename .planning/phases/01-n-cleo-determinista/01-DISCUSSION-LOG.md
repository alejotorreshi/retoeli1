# Phase 1: Núcleo determinista - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-10-12
**Phase:** 01-Núcleo determinista
**Areas discussed:** Cómo se ven los pendientes, Qué ve el LLM (enmascarado), Encadenamiento de herramientas, Textos de salida, Otras decisiones clave / librerías / vulnerabilidades, Forma del error y continuación, Confianza y etiquetas ambiguas, Soportes de otro país, Entrada de mapear_campos

---

## Cómo se ven los pendientes

| Option | Description | Selected |
|--------|-------------|----------|
| Vacía + color + comentario | Celda en blanco, relleno rojo, comentario "Faltante" | ✓ |
| Texto '[FALTANTE]' | Marcador literal en la celda | |
| Vacía, sin marca | Solo en checklist y mapeo.json | |

| Option | Description | Selected |
|--------|-------------|----------|
| Valor + amarillo + comentario | Valor del maestro, relleno amarillo, nota en comentario | ✓ |
| Valor + sufijo en el texto | "900123456 (por confirmar)" | |
| Vacía hasta confirmar | No escribe hasta confirmar | |

| Option | Description | Selected |
|--------|-------------|----------|
| Etiqueta textual + color + notas al pie | [FALTANTE]/[POR CONFIRMAR] + sección Notas, solo WinAnsi | ✓ |
| Solo color | Resaltado sin texto | |
| Tú decides | Claude elige | |

| Option | Description | Selected |
|--------|-------------|----------|
| Crudo + nota de contexto | Valor exacto del maestro + nota (moneda/año, país) | ✓ |
| Formato legible compuesto | "Colombia", "COP 98.000.000.000 (2025)" | |
| Crudo, sin notas | Solo el valor | |

**User's choice:** Todas las opciones recomendadas.

---

## Qué ve el LLM (enmascarado)

| Option | Description | Selected |
|--------|-------------|----------|
| Lista blanca pública, el resto oculto | Datos corporativos públicos en claro; nuevo = oculto | ✓ |
| Todo enmascarado | Ni la razón social en claro | |
| Sin valores | Quitar valor_enmascarado | |

| Option | Description | Selected |
|--------|-------------|----------|
| NIT enmascarado | "•••••3456" | ✓ |
| NIT en claro | Dato público en CO | |

| Option | Description | Selected |
|--------|-------------|----------|
| Por tipo de dato | Últimos 4, iniciales, email/teléfono parcial, [monto oculto] | ✓ |
| Uniforme '[oculto]' | Un solo reemplazo | |
| Solo últimos 4 para todo | Un patrón | |

**User's choice:** Recomendadas.
**Notes:** La usuaria preguntó "¿para qué usamos un LLM?". Respuesta: el PRD lo exige (§0, §6.1). El LLM orquesta las herramientas y conversa, nunca aporta valores, y el núcleo determinista hace el trabajo de datos. Se documenta como trade-off en SOLUCION.md.

---

## Encadenamiento de herramientas

| Option | Description | Selected |
|--------|-------------|----------|
| Error guía | FORMULARIO_NO_GENERADO | ✓ |
| Lo genera solo | armar_paquete encadena internamente | |

| Option | Description | Selected |
|--------|-------------|----------|
| Validar contra el canónico | Recalcula; difiere → MAPEO_INCONSISTENTE | ✓ |
| Mapeo opcional | Nullable, usa mapeo.json | |
| Se recibe y se ignora | Siempre canónico | |

| Option | Description | Selected |
|--------|-------------|----------|
| Sobrescribe e invalida lo posterior | Borra paquete/ y ENVIO-SIMULADO.md; logs append | ✓ |
| Sobrescribe solo lo que toca | Cada herramienta su archivo | |
| Carpetas versionadas | out/<caso>/<timestamp>/ | |

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, exige paquete | PAQUETE_NO_ARMADO | ✓ |
| No, solo confirmación | Basta confirmado:true | |

**User's choice:** Recomendadas.

---

## Textos de salida

| Option | Description | Selected |
|--------|-------------|----------|
| Bloque por caso + tabla final | Fecha efectiva, bloque por caso, tabla resumen | ✓ |
| Solo tabla | Compacta | |
| JSON | Por caso | |

| Option | Description | Selected |
|--------|-------------|----------|
| Área genérica | "Área Administrativa — Periferia IT Group S.A.S." | |
| Contacto financiero / analista desde el maestro | contacto_financiero.nombre/cargo | ✓ |
| Placeholder para completar | "[Nombre y cargo]" | |

| Option | Description | Selected |
|--------|-------------|----------|
| Adjuntos + nota de pendientes | Párrafo breve de pendientes | ✓ |
| Solo adjuntos | Pendientes internos | |

| Option | Description | Selected |
|--------|-------------|----------|
| Estado + tablas + casillas | Encabezado, tabla de soportes, listas, acciones - [ ] | ✓ |
| Solo casillas | Lista plana | |
| Tú decides | Claude elige | |

**User's choice:** Recomendadas. Sobre la firma, primero preguntó "¿qué nos dicen los requisitos del reto?".
**Notes:** El PRD no define quién firma el correo. La firma que exige es la del representante legal sobre el formulario, y quien responde el correo es la analista (§4), que en el maestro es `contacto_financiero`. La usuaria eligió la analista desde el maestro y agregó que las reglas de negocio y demás deben poder cambiar sin desplegar código del servidor (de ahí sale D-28).

---

## Otras decisiones clave, librerías y vulnerabilidades

| Option | Description | Selected |
|--------|-------------|----------|
| Archivos de reglas leídos en cada ejecución | reglas.json (zod) + plantillas .md, sin caché | ✓ |
| Lo anterior + carpeta externa por env | REGLAS_DIR | |
| Constantes TS centralizadas | Requiere tocar código | |

Contenido editable como dato (multiSelect): RN1 país→identificador ✓, umbrales y plazos ✓, plantillas de textos ✓, política de PII ✗ (queda en código).

| Option | Description | Selected |
|--------|-------------|----------|
| En el error de caso inexistente | CASO_NO_ENCONTRADO + casos_disponibles | ✓ |
| Sexta herramienta listar_casos | Rompe "exactamente 5" | |
| Lista en el prompt | Mezcla datos y comportamiento | |

| Option | Description | Selected |
|--------|-------------|----------|
| Confirmar zod/exceljs/pdf-lib | 3 deps runtime | ✓ (con condición) |
| SheetJS 0.20.3 | CDN, sin estilos | |
| pdfkit 0.20 | Tipos atrasados | |

**Notes:** La usuaria confirmó con una condición: "validar versiones y vulnerabilidades para usar lo recomendado y reciente; no confiamos en el usuario, las validaciones de backend de todo son clave, sin descuidar las de front donde se requiera". Se verificó en vivo: `npm view` mostró que todas son la última versión publicada, y `bun audit` encontró 1 moderate (uuid vía exceljs) que queda en 0 con el override `uuid ^11.1.1`. La escritura y relectura con exceljs funcionan. La máquina local tiene Bun 1.3.10.

| Option | Description | Selected |
|--------|-------------|----------|
| Pin exacto + lock + audit que falla | frozen-lockfile, override uuid, audit desde moderate | ✓ |
| Audit solo informativo | No rompe build | |

| Option | Description | Selected |
|--------|-------------|----------|
| Bun 1.4.3 fijo | .bun-version, engines, imagen; requiere bun upgrade | ✓ |
| Compatible 1.3.10+ | Sin actualizar | |

| Option | Description | Selected |
|--------|-------------|----------|
| Zod en cada frontera | Args strict, regex caso, realpath, fixtures/reglas validados, lista blanca de escritura, límite de tamaño, celdas texto | ✓ |
| Solo args de herramientas | Confía en fixtures | |

| Option | Description | Selected |
|--------|-------------|----------|
| Front valida para UX, backend decide | Esquemas compartidos en src/contracts/, sin HTML del modelo | ✓ |
| Solo backend | Front sin validación | |

---

## Forma del error y continuación

| Option | Description | Selected |
|--------|-------------|----------|
| error string + codigo hermano | `{ ok:false, error:"…", codigo:"…" }` | ✓ |
| error como objeto | `{ ok:false, error:{codigo,mensaje} }` | |

| Option | Description | Selected |
|--------|-------------|----------|
| ok:false + parcial | PLANTILLA_INVALIDA + parcial {pais, cliente, formato, soportes} | ✓ |
| ok:true + advertencias | Plantilla rota con ok:true | |
| ok:false sin parcial | Solo error | |

---

## Confianza y etiquetas ambiguas

| Option | Description | Selected |
|--------|-------------|----------|
| Escala fija en reglas.json | 1.0 / 0.95 / 0.85 / 0.6 / 0.5 / 0 | ✓ |
| Binaria | 1 o 0 | |
| Tú decides | Claude | |

| Option | Description | Selected |
|--------|-------------|----------|
| Sí, siempre | Genérica = requiere_confirmacion también en CO | ✓ |
| Solo fuera de CO | En CO queda lleno | |

---

## Soportes de otro país

| Option | Description | Selected |
|--------|-------------|----------|
| Aviso no bloqueante | Presente + aviso "Emitido en CO" | ✓ |
| Bloquea | Rompe tabla de verdad (pa) | |
| Ignorar | No compara | |

| Option | Description | Selected |
|--------|-------------|----------|
| 30 días | Cámara de comercio: "vence en 27 días" | ✓ |
| 15 días | Menos ruido | |
| 60 días | Más anticipación | |

---

## Entrada de mapear_campos

| Option | Description | Selected |
|--------|-------------|----------|
| Subconjunto de la plantilla | Normalizado; fuera → CAMPOS_FUERA_DE_PLANTILLA; mapeo.json siempre completo | ✓ |
| Exactamente la plantilla | Set completo obligatorio | |
| Cualquier etiqueta | Mapea lo que llegue | |

---

## Claude's Discretion

- El layout del PDF, los colores exactos, el contenido de `ENVIO-SIMULADO.md` y de `valores-portal.md`, la estructura interna de `src/`, el `resumen` de los logs y el registro de los errores previos a conocer un caso.

## Deferred Ideas

- Confirmación campo a campo desde el chat (capacidad nueva, va al backlog).
- `REGLAS_DIR` externo por env (se reevalúa si cambia el hosting).
- La implementación de las validaciones de front (Fase 3; el principio queda fijado en D-34).
