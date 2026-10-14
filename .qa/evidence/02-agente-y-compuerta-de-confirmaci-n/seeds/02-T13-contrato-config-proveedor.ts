import { TEXTO_ENV } from "@/config/strings.ts";
import { crearAgente } from "@/loop/wiring/agente.wiring.ts";
import { CLAVE_QA, RAIZ, chequear, guionFetch, informe } from "./qa-comun.ts";

const t0 = performance.now();
const { fetch } = guionFetch([]);
const crear = (entorno: Record<string, string>) => {
  const r = crearAgente({ directorio: RAIZ, fetch, fuenteEntorno: { LOG_LEVEL: "silent", ...entorno } });
  return r.ok ? { ok: true as const, proveedor: r.agente.proveedor, modelo: r.agente.modelo } : { ok: false as const, codigo: r.codigo, mensaje: r.mensaje };
};

const inseguro = crear({ LLM_API_KEY: CLAVE_QA, LLM_BASE_URL: "http://api.example.com" });
const respaldoInseguro = crear({ LLM_API_KEY: CLAVE_QA, LLM_FALLBACK_BASE_URL: "http://api.example.com" });
chequear(
  "http no local -> ok:false CONFIGURACION_LLM_INVALIDA con el texto nuevo que lista localhost, 127.0.0.1, [::1]",
  !inseguro.ok && inseguro.codigo === "CONFIGURACION_LLM_INVALIDA" && inseguro.mensaje.includes(TEXTO_ENV.urlNoSegura) &&
    ["localhost", "127.0.0.1", "[::1]"].every((h) => inseguro.mensaje.includes(h)) && !inseguro.mensaje.includes(CLAVE_QA),
  { inseguro, respaldoInseguro },
);

const locales = ["http://localhost:1234", "http://127.0.0.1:1234", "http://[::1]:1234", "https://api.deepseek.com"].map((u) => ({
  url: u,
  ...crear({ LLM_API_KEY: CLAVE_QA, LLM_BASE_URL: u }),
}));
chequear("los tres hosts locales en http y https -> ok:true", locales.every((r) => r.ok), locales);

const sinClave = crear({});
const sinClaveVacia = crear({ LLM_API_KEY: "" });
const variantes = [
  crear({ LLM_API_KEY: CLAVE_QA, LLM_BASE_URL: "http://localhost.evil.example:1234" }),
  crear({ LLM_API_KEY: CLAVE_QA, LLM_BASE_URL: "http://127.0.0.2:1234" }),
  crear({ LLM_API_KEY: CLAVE_QA, LLM_BASE_URL: "ftp://api.deepseek.com" }),
];
const todos = JSON.stringify([inseguro, respaldoInseguro, locales, sinClave, sinClaveVacia, variantes]);
chequear(
  "sin clave -> PROVEEDOR_SIN_CLAVE con mensaje en español; ningún mensaje contiene el valor de la clave",
  !sinClave.ok && sinClave.codigo === "PROVEEDOR_SIN_CLAVE" && /clave configurada/.test(sinClave.mensaje) && !todos.includes(CLAVE_QA),
  { sinClave, sinClaveVacia },
);
informe("T13", { variantesExtra: variantes, ms: Math.round(performance.now() - t0) });
