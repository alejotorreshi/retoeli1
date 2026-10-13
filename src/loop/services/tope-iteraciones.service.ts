import { ROL_MENSAJE } from "@/config/constants/llm.constants.ts";
import { TEXTO_CIERRE } from "@/config/strings.ts";
import { cierreDeterminista } from "@/domain/builders/cierre-turno.builder.ts";
import type { AdaptadorLlm, Mensaje, RespuestaLlm } from "@/llm/types/llm.type.ts";
import type { ContextoTope, ResultadoTope } from "@/loop/types/turno.type.ts";

const INSTRUCCION_TOPE: Mensaje = { rol: ROL_MENSAJE.SISTEMA, contenido: TEXTO_CIERRE.instruccionTope };

function resumenDelModelo(respuesta: RespuestaLlm): string | null {
  if (respuesta.llamadas.length > 0) return null;
  const texto = respuesta.texto ?? "";
  return texto.trim() === "" ? null : texto;
}

export async function cerrarPorTope(llm: AdaptadorLlm, contexto: ContextoTope): Promise<ResultadoTope> {
  const determinista = cierreDeterminista(contexto.llamadas);
  if (!contexto.cabePresupuesto) return { texto: determinista, respuesta: null };
  const resultado = await llm.enviar([...contexto.mensajes, INSTRUCCION_TOPE], contexto.definiciones, {
    signal: contexto.signal,
    herramientasDesactivadas: true,
    observador: contexto.observador,
  });
  if (!resultado.ok) return { texto: determinista, respuesta: null };
  const { respuesta } = resultado;
  return { texto: resumenDelModelo(respuesta) ?? determinista, respuesta };
}
