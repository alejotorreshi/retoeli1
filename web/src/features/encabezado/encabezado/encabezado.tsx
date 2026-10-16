import { LogoMarca } from "@web/compartido/logo-marca/logo-marca.tsx";
import { VARIANTE_LOGO } from "@web/config/constants/marca.constants.ts";
import { TONO, TONO_DEL_MODELO } from "@web/config/constants/ui.constants.ts";
import { TEXTO_APP, TEXTO_MODELO, TEXTO_NUEVA_SESION } from "@web/config/strings.ts";
import estilos from "@web/features/encabezado/encabezado/encabezado.module.css";
import { useEncabezado } from "@web/features/encabezado/encabezado/usar-encabezado.ts";
import type { PropsEncabezado, PropsEstadoDelModelo, Tono } from "@web/types/ui.type.ts";

const CLASE_DE_TONO = {
  [TONO.EXITO]: estilos.exito,
  [TONO.ATENCION]: estilos.atencion,
  [TONO.ERROR]: estilos.error,
} as const satisfies Record<Tono, string | undefined>;

function EstadoDelModelo({ salud, clasePrefijo }: PropsEstadoDelModelo) {
  return (
    <p className={estilos.modelo}>
      <span className={`${estilos.punto} ${CLASE_DE_TONO[TONO_DEL_MODELO[salud.llm]]}`} aria-hidden="true" />
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
        <LogoMarca variante={angosto ? VARIANTE_LOGO.ENCABEZADO_ANGOSTO : VARIANTE_LOGO.ENCABEZADO} />
        <span className={estilos.divisor} aria-hidden="true" />
        <h1 className={estilos.titulo}>{TEXTO_APP.titulo}</h1>
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
