import { TONO_DEL_MODELO } from "@web/config/constants/ui.constants.ts";
import { TEXTO_APP, TEXTO_MODELO, TEXTO_NUEVA_SESION } from "@web/config/strings.ts";
import estilos from "@web/features/encabezado/encabezado/encabezado.module.css";
import { useEncabezado } from "@web/features/encabezado/encabezado/usar-encabezado.ts";
import type { PropsEncabezado, PropsEstadoDelModelo } from "@web/types/ui.type.ts";

function EstadoDelModelo({ salud, clasePrefijo }: PropsEstadoDelModelo) {
  return (
    <p className={estilos.modelo}>
      <span className={`${estilos.punto} ${estilos[TONO_DEL_MODELO[salud.llm]]}`} aria-hidden="true" />
      <span className={estilos.texto}>
        <span className={clasePrefijo}>{TEXTO_MODELO.prefijoModelo(salud.model)}</span>
        {TEXTO_MODELO.etiqueta(salud.llm)}
      </span>
    </p>
  );
}

export function Encabezado({ angosto }: PropsEncabezado) {
  const { fechaEjecucion, salud, nuevaSesionDeshabilitada, abrirNuevaSesion, clasePrefijo } =
    useEncabezado(angosto);

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
        <p className={estilos.fecha}>
          <span className={estilos.texto}>
            <span className={clasePrefijo}>{TEXTO_APP.prefijoFecha}</span>
            {TEXTO_APP.valorFecha(fechaEjecucion)}
          </span>
        </p>
        {salud === null ? null : <EstadoDelModelo salud={salud} clasePrefijo={clasePrefijo} />}
        <button
          type="button"
          className={estilos.nuevaSesion}
          disabled={nuevaSesionDeshabilitada}
          onClick={abrirNuevaSesion}
        >
          {TEXTO_NUEVA_SESION.abrir}
        </button>
      </div>
    </header>
  );
}
