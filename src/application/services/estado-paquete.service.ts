import { mapeoCanonico } from "@/application/services/mapeo-canonico.service.ts";
import type { ContextoCaso } from "@/application/types/contexto-caso.type.ts";
import type { Entorno } from "@/application/types/puertos.type.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import { ESTADO_LECTURA } from "@/config/constants/io.constants.ts";
import { construirChecklist } from "@/domain/builders/checklist.builder.ts";
import { evaluarSoportes } from "@/domain/policies/soportes.policy.ts";
import type { Checklist } from "@/domain/types/checklist.type.ts";
import type { Resultado } from "@/domain/types/resultado.type.ts";
import { exito, fallo } from "@/domain/utils/resultado.util.ts";

export async function evaluarEstadoPaquete(
  contexto: ContextoCaso,
  entorno: Entorno,
): Promise<Resultado<Checklist>> {
  const canonico = mapeoCanonico(contexto);
  if (!canonico.ok) return canonico;
  const indice = await entorno.soportes.indice();
  if (indice.estado !== ESTADO_LECTURA.OK) return fallo(CODIGO_ERROR.DATOS_INVALIDOS);
  const presentes = await entorno.soportes.presentes();
  if (presentes.estado !== ESTADO_LECTURA.OK) return fallo(CODIGO_ERROR.DATOS_INVALIDOS);
  const hoy = entorno.reloj.hoy();
  const soportes = evaluarSoportes({
    exigidos: contexto.soportesExigidos,
    indice: indice.valor,
    presentes: presentes.valor,
    hoy,
    paisCliente: contexto.solicitud.pais,
    reglas: contexto.reglas.soportes,
  });
  if (!soportes.ok) return soportes;
  return exito(construirChecklist(soportes.data, canonico.data, hoy));
}
