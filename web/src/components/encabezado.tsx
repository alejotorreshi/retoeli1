import estilos from "@web/components/encabezado.module.css";
import { TONO_DEL_MODELO } from "@web/config/constants/ui.constants.ts";
import { TEXTO_APP, TEXTO_MODELO, TEXTO_NUEVA_SESION } from "@web/config/strings.ts";
import type { PropsEncabezado, PropsEstadoDelModelo } from "@web/types/ui.type.ts";

function EstadoDelModelo({ salud }: PropsEstadoDelModelo) {
  return (
    <p className={estilos.modelo}>
      <span className={`${estilos.punto} ${estilos[TONO_DEL_MODELO[salud.llm]]}`} aria-hidden="true" />
      {TEXTO_MODELO.estado(salud.model, salud.llm)}
    </p>
  );
}

export function Encabezado({
  fechaEjecucion,
  salud,
  nuevaSesionDeshabilitada,
  alNuevaSesion,
}: PropsEncabezado) {
  return (
    <header className={estilos.encabezado}>
      <div className={estilos.marca}>
        <h1 className={estilos.titulo}>{TEXTO_APP.titulo}</h1>
        <span className={estilos.separador} aria-hidden="true">
          {TEXTO_APP.separador}
        </span>
        <p className={estilos.subtitulo}>{TEXTO_APP.subtitulo}</p>
      </div>
      <div className={estilos.meta}>
        <p className={estilos.fecha}>{TEXTO_APP.fechaEjecucion(fechaEjecucion)}</p>
        {salud === null ? null : <EstadoDelModelo salud={salud} />}
        <button
          type="button"
          className={estilos.nuevaSesion}
          disabled={nuevaSesionDeshabilitada}
          onClick={alNuevaSesion}
        >
          {TEXTO_NUEVA_SESION.abrir}
        </button>
      </div>
    </header>
  );
}
