import { crearAgente } from "@/loop/wiring/agente.wiring.ts";
import { CLAVE, check, fetchDinamico, proyecto, totales } from "./qa.helper.ts";

const T = "N04";
const raiz = await proyecto("n04");
const casos: { nombre: string; entorno: Record<string, string>; multi: boolean }[] = [
  { nombre: "(1) custom sin URL ni modelo", entorno: { LLM_PROVIDER: "custom" }, multi: true },
  {
    nombre: "(2) URL primaria y de respaldo http://example.com con respaldo activo",
    entorno: { LLM_BASE_URL: "http://example.com", LLM_FALLBACK_BASE_URL: "http://example.com", LLM_FALLBACK_ENABLED: "true" },
    multi: true,
  },
  { nombre: "(control) custom con URL y sin modelo", entorno: { LLM_PROVIDER: "custom", LLM_BASE_URL: "https://proveedor.invalid/v1" }, multi: false },
  { nombre: "(control) solo URL primaria http://example.com", entorno: { LLM_BASE_URL: "http://example.com", LLM_FALLBACK_ENABLED: "false" }, multi: false },
];
for (const c of casos) {
  const creacion = crearAgente({
    directorio: raiz,
    fetch: fetchDinamico([]).fetch,
    fuenteEntorno: { LLM_API_KEY: CLAVE, LOG_LEVEL: "silent", ...c.entorno },
  });
  if (creacion.ok) {
    check(T, `${c.nombre}: falla la creación`, false, "creacion ok");
    continue;
  }
  const m = creacion.mensaje;
  console.log(`MSG ${c.nombre} [${creacion.codigo}]: ${JSON.stringify(m)}`);
  const issues = (m.split("Detalle: ")[1] ?? "").split("; ").filter((s) => /^[A-Z_]+(\.[\w]+)*: /.test(s)).length;
  check(T, `${c.nombre}: sin '.;'`, !m.includes(".;"), m.includes(".;") ? "contiene .;" : "");
  check(T, `${c.nombre}: termina en exactamente un '.'`, m.endsWith(".") && !m.endsWith(".."), m.slice(-20));
  check(T, `${c.nombre}: ${c.multi ? "multi" : "un"}-issue (issues detectados=${issues})`, c.multi ? issues >= 2 : issues === 1, issues);
  check(T, `${c.nombre}: no repite la clave ni la URL`, !m.includes(CLAVE) && !m.includes("example.com") && !m.includes("proveedor.invalid"), "");
}
totales();
