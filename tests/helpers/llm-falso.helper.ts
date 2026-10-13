import { proyectarMapeo } from "@tests/helpers/flujo.helper.ts";
import type { LlmFalso, PasoLlmFalso, PedidoLlmFalso } from "@tests/helpers/types/llm-falso.type.ts";
import { FIN_LLM, ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { HERRAMIENTA, PREFIJO_HERRAMIENTA } from "@/config/constants/tools.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { LlamadaHerramienta, Mensaje, RespuestaLlm } from "@/llm/types/llm.type.ts";

export const PROVEEDOR_FALSO = "falso";
export const MODELO_FALSO = "modelo-falso";

const USO_FALSO = { entrada: 10, salida: 5, cacheHit: 0 };

export function crearLlmFalso(guion: readonly PasoLlmFalso[]): LlmFalso {
  const pedidos: PedidoLlmFalso[] = [];
  return {
    proveedor: PROVEEDOR_FALSO,
    modelo: MODELO_FALSO,
    pedidos,
    async enviar(mensajes, _herramientas, opciones) {
      const paso = guion[pedidos.length];
      pedidos.push({
        mensajes: structuredClone(mensajes),
        herramientasDesactivadas: opciones.herramientasDesactivadas,
      });
      if (paso === undefined) throw new Error("guion agotado");
      if (typeof paso === "function") return { ok: true, respuesta: paso(mensajes) };
      return "tipo" in paso ? { ok: false, error: paso } : { ok: true, respuesta: paso };
    },
  };
}

export function llamar(
  id: string,
  herramienta: ValorDe<typeof HERRAMIENTA>,
  args: unknown,
): LlamadaHerramienta {
  return { id, nombre: `${PREFIJO_HERRAMIENTA}${herramienta}`, argumentos: JSON.stringify(args) };
}

export function respuestaHerramientas(...llamadas: readonly LlamadaHerramienta[]): RespuestaLlm {
  return {
    texto: null,
    llamadas,
    uso: USO_FALSO,
    razonamiento: null,
    fin: FIN_LLM.HERRAMIENTAS,
    proveedor: PROVEEDOR_FALSO,
    modelo: MODELO_FALSO,
  };
}

export function respuestaTexto(texto: string): RespuestaLlm {
  return {
    texto,
    llamadas: [],
    uso: USO_FALSO,
    razonamiento: null,
    fin: FIN_LLM.TEXTO,
    proveedor: PROVEEDOR_FALSO,
    modelo: MODELO_FALSO,
  };
}

function ultimoResultadoDe(mensajes: readonly Mensaje[], nombre: string): string {
  const ids = new Set(
    mensajes.flatMap((mensaje) =>
      mensaje.rol === ROL_MENSAJE.ASISTENTE
        ? mensaje.llamadas.filter((llamada) => llamada.nombre === nombre).map((llamada) => llamada.id)
        : [],
    ),
  );
  const resultado = mensajes
    .filter((mensaje) => mensaje.rol === ROL_MENSAJE.HERRAMIENTA && ids.has(mensaje.llamadaId))
    .at(-1);
  if (resultado === undefined) throw new Error(`no hay resultado de ${nombre}`);
  return resultado.contenido;
}

export function pasoGenerarConMapeo(caso: string, id = `generar-${caso}`): PasoLlmFalso {
  return (mensajes) => {
    const contenido = ultimoResultadoDe(mensajes, `${PREFIJO_HERRAMIENTA}${HERRAMIENTA.MAPEAR_CAMPOS}`);
    const mapeo = proyectarMapeo(JSON.parse(contenido));
    return respuestaHerramientas(llamar(id, HERRAMIENTA.GENERAR_FORMULARIO, { caso, mapeo }));
  };
}
