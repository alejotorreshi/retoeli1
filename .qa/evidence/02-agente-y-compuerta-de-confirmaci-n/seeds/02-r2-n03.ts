import { rm } from "node:fs/promises";
import { join } from "node:path";
import { crearAgentePrueba } from "@tests/helpers/agente-prueba.helper.ts";
import { finesDeHerramienta } from "@tests/helpers/eventos.helper.ts";
import { llamar, pasoGenerarConMapeo, respuestaHerramientas, respuestaTexto } from "@tests/helpers/llm-falso.helper.ts";
import { FECHA_DEMO } from "@/config/constants/demo.constants.ts";
import { HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import { pinExecutionDate } from "@/config/env.ts";
import {
  EC, agente, armar, casosConEnvioSimulado, check, enviar, herr, proyecto, resumen, simularDelCaso, texto, totales, ultimoParrafo,
} from "./qa.helper.ts";

pinExecutionDate(FECHA_DEMO);
const T = "N03";
const BLOQ = JSON.stringify([{ ok: false, codigo: "CONFIRMACION_REQUERIDA" }]);

const raiz = await proyecto("n03");
const a = agente(raiz, [
  ...armar(EC),
  ...enviar("simular-1", EC, "No pude registrar el envío simulado."),
  ...enviar("simular-2", EC, "Hecho."),
  herr("armar-ec-2", "ARMAR_PAQUETE", { caso: EC }),
  texto(`Volví a armar el paquete de ${EC}.`),
  ...enviar("simular-3", EC, "Hecho."),
]);
const t1 = resumen(await a.turno(`procesa el caso ${EC}`));
const pregunta = ultimoParrafo(t1.texto);
await rm(join(raiz, "out", EC, "paquete"), { recursive: true, force: true });

const t2 = resumen(await a.turno("envía"));
check(T, "t2 simular -> PAQUETE_NO_ARMADO", JSON.stringify(t2.simular) === JSON.stringify([{ ok: false, codigo: "PAQUETE_NO_ARMADO" }]), t2.simular);
check(T, "t2 needsConfirmation true + confirmation_required ec", t2.fin.needsConfirmation && t2.confs.length === 1 && t2.confs[0]?.caso === EC, { fin: t2.fin.needsConfirmation, confs: t2.confs });
check(T, "t2 cierra con la pregunta del servidor", ultimoParrafo(t2.texto) === pregunta, ultimoParrafo(t2.texto).slice(0, 120));
check(T, "t2 nada escrito", (await casosConEnvioSimulado(raiz)).length === 0);
check(T, "t2 log del caso conserva PAQUETE_NO_ARMADO", JSON.stringify(await simularDelCaso(raiz, EC)) === JSON.stringify([{ ok: false, codigo: "PAQUETE_NO_ARMADO" }]), await simularDelCaso(raiz, EC));
console.log("INFO [N03] t2 texto completo (WR-18):", JSON.stringify(t2.texto));

const t3 = resumen(await a.turno("ok"));
check(T, "t3 'ok' + simular desobediente bloqueado (grant usado no se recupera)", JSON.stringify(t3.simular) === BLOQ && (await casosConEnvioSimulado(raiz)).length === 0, t3.simular);
check(T, "t3 ec sigue pendiente", t3.fin.needsConfirmation && t3.confs.length === 1, t3.confs.map((c) => c.caso));

const t4a = resumen(await a.turno(`vuelve a armar el paquete de ${EC}`));
check(T, "t4a re-armado vuelve a preguntar", t4a.fin.needsConfirmation && t4a.confs.length === 1, t4a.confs.map((c) => c.caso));
const t4 = resumen(await a.turno("sí"));
const oks = (await simularDelCaso(raiz, EC)).filter((l) => l.ok).length;
check(T, "t4 exactamente un ENVIO-SIMULADO.md y una linea ok", JSON.stringify(t4.simular) === JSON.stringify([{ ok: true, codigo: null }]) && JSON.stringify(await casosConEnvioSimulado(raiz)) === JSON.stringify([EC]) && oks === 1, { simular: t4.simular, oks, lineas: await simularDelCaso(raiz, EC) });
check(T, "t4 needsConfirmation false", t4.fin.needsConfirmation === false, t4.fin);

const espejo = await proyecto("n03-espejo");
const p = crearAgentePrueba({
  raiz: espejo,
  guion: [
    respuestaHerramientas(llamar("mapear-ec", HERRAMIENTA.MAPEAR_CAMPOS, { caso: EC, campos: [] })),
    pasoGenerarConMapeo(EC),
    respuestaHerramientas(llamar("armar-ec", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })),
    respuestaTexto("Armé."),
    respuestaHerramientas(llamar("s1", HERRAMIENTA.SIMULAR_ENVIO, { caso: EC })),
    respuestaTexto("No pude."),
    respuestaHerramientas(llamar("s2", HERRAMIENTA.SIMULAR_ENVIO, { caso: EC })),
    respuestaTexto("Hecho."),
    respuestaHerramientas(llamar("armar-ec-2", HERRAMIENTA.ARMAR_PAQUETE, { caso: EC })),
    respuestaTexto("Volví a armar."),
    respuestaHerramientas(llamar("s3", HERRAMIENTA.SIMULAR_ENVIO, { caso: EC })),
    respuestaTexto("Hecho."),
  ],
});
await p.turno(`procesa el caso ${EC}`);
await rm(join(espejo, "out", EC, "paquete"), { recursive: true, force: true });
await p.turno("envía");
const env2 = p.sesionActual().casosEnviados;
const tt3 = await p.turno("ok");
await p.turno(`vuelve a armar el paquete de ${EC}`);
const tt4 = await p.turno("sí");
const enviados = p.sesionActual().casosEnviados;
check(T, "espejo (sesion visible): casosEnviados vacio tras fallo y = [ec] una vez al final", JSON.stringify(env2) === "[]" && JSON.stringify(enviados) === JSON.stringify([EC]) && finesDeHerramienta(tt3)[0]?.ok === false && finesDeHerramienta(tt4)[0]?.ok === true, { trasFallo: env2, final: enviados });
totales();
