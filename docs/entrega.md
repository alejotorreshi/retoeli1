# Entrega

Checklist de lo que se entrega y de los pasos que solo puede hacer una persona. Los pasos automáticos ya están en la CI y en las pruebas.

## Qué se entrega

- El repositorio privado `alejotorreshi/retoeli1` con su historial de commits (PRD §9.5), con los evaluadores invitados como colaboradores (D-89). Así ven el badge de la CI y el código de acceso del README sin que el código quede público.
- Sin `node_modules/`, sin `out/` y sin `.env`: los tres están en `.gitignore`. Para comprobarlo, `git ls-files | grep -cE '^(node_modules|out)/|^\.env$'` debe imprimir `0`.
- [README.md](../README.md): cómo levantar en local con un comando, las variables de entorno, la demo sin modelo, la API, el pre-flight, el link público y el código de acceso.
- [SOLUCION.md](../SOLUCION.md): las 10 secciones del PRD §9.1.
- `modulo/`: el bonus del módulo reutilizable (PRD §9.4).
- [arquitectura.md](arquitectura.md) y [convenciones.md](convenciones.md): para que otra persona o una IA retome el trabajo.
- El link público https://registro-proveedor-bfnt.onrender.com, desplegado en Render desde `main` después de que pasa la CI.
- El costo por caso ya está medido contra el modelo real, en [evidencia/costo-por-caso.json](evidencia/costo-por-caso.json) con estado `medido`. No queda ninguna corrida de costo pendiente.

## Pendientes humanos

Estos pasos se hacen en GitHub, en Render o frente al navegador, y ninguna corrida automática puede hacerlos. Van en este orden, porque los ensayos abren sesiones nuevas y un código equivocado bloquea la IP durante 15 minutos.

- [ ] Invitar a los evaluadores como colaboradores del repositorio privado en GitHub (Settings → Collaborators) (D-89).
- [ ] Comprobar en el panel de Render que `ACCESS_CODE` es exactamente el código que muestra el README (D-94). El README no puede comprobarlo solo: su prueba solo valida la forma del código.
- [ ] Comprobar que la primera corrida de la CI en GitHub Actions termina en verde y que el badge del README se ve en verde. El job principal corre en `ubuntu-24.04` sin root, como necesitan las dos pruebas de permisos.
- [ ] Comprobar en los eventos de Render que el deploy empezó después de que pasaron los checks de la CI (`autoDeployTrigger: checksPass`). Si Render no ve los checks y deja de desplegar, la vuelta atrás es `autoDeployTrigger: commit` en `render.yaml`.
- [ ] Revisar que la clave del proveedor tiene saldo. Es prepaga, y sin saldo la API responde 402 y el agente lo avisa en el chat.
- [ ] eli-qa corre el pre-flight contra Render, primero `bun run preflight` y después con `--guion`, y luego el ensayo del §11 en el navegador con Playwright sobre el link público: confirma el envío y verifica que aparece `ENVIO-SIMULADO.md`, con capturas como evidencia (D-95).
- [ ] La usuaria hace el ensayo del §11 una vez a mano en el navegador, como en la defensa (D-95).
- [ ] La usuaria revisa el texto de SOLUCION.md §9 (uso de IA) antes de entregar (D-87).
- [ ] Unos 10 minutos antes de la defensa, correr `bun run preflight -- --url https://registro-proveedor-bfnt.onrender.com` con `PREFLIGHT_ACCESS_CODE` en el `.env` local, para despertar el servicio y comprobar la salud y el acceso sin gastar tokens (D-93).
- [ ] Después de la evaluación, rotar `ACCESS_CODE` en Render (D-94, D-99). Rotarlo invalida también las cookies firmadas. Después hay que actualizar o quitar el código del README, porque queda en el historial del repositorio.
