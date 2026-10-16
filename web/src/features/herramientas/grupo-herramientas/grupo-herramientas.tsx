import { IconoChevron } from "@web/compartido/iconos/iconos.tsx";
import estilos from "@web/features/herramientas/grupo-herramientas/grupo-herramientas.module.css";
import { useGrupoHerramientas } from "@web/features/herramientas/grupo-herramientas/usar-grupo-herramientas.ts";
import { TarjetaHerramienta } from "@web/features/herramientas/tarjeta-herramienta/tarjeta-herramienta.tsx";
import type { PropsGrupoHerramientas } from "@web/types/ui.type.ts";

export function GrupoHerramientas({ llamadas, enCurso }: PropsGrupoHerramientas) {
  const { abierto, resumen, alAlternar } = useGrupoHerramientas(llamadas, enCurso);

  return (
    <li>
      <details className={estilos.grupo} open={abierto} onToggle={alAlternar}>
        <summary className={estilos.resumen}>
          <span className={estilos.chevron}>
            <IconoChevron />
          </span>
          {resumen}
        </summary>
        <ul className={estilos.lista}>
          {llamadas.map((llamada) => (
            <TarjetaHerramienta key={llamada.llamadaId} llamada={llamada} />
          ))}
        </ul>
      </details>
    </li>
  );
}
