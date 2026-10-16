---
title: Llevar a SOLUCION.md los límites del demo (estado en memoria y disco efímero)
created: 2026-10-15
area: docs
resolves_phase: 4
source: 03-REVIEW.md WR-03 (aceptado para el demo por decisión de la usuaria)
completed: 2026-10-16
status: completed
---

## Qué

Cuando se escriba `SOLUCION.md` en la Fase 4, hay que agregar una sección basada en `docs/limites-del-demo.md`. Debe explicar tres cosas:

- **Qué se pierde.** Al reiniciar, al hacer redeploy o cuando Render free duerme el servicio, se pierden: el tope diario de tokens, los limitadores por IP, los cupos de turno, el límite de sesiones nuevas, las sesiones y los archivos de `out/`.
- **Por qué se acepta en el reto.** Es una sola instancia gratuita, la clave es personal y prepaga, la ventana de la defensa es corta y hay una compuerta de código de acceso.
- **Qué haría un despliegue real.** Un almacén compartido y persistente, como Redis o una base de datos, para los contadores y las sesiones; límites y alertas de gasto en la clave del proveedor; una instancia paga siempre activa, o varias instancias con estado compartido; y almacenamiento de objetos persistente para `out/`.

## Por qué

La usuaria decidió no arreglar WR-03 a fondo porque es un demo. Pidió que quede explicado en la solución, con el porqué y lo que cambiaría en un despliegue más real.
