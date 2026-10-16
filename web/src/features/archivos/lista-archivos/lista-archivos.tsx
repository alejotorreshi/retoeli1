import { IconoDescargar, IconoOjo } from "@web/compartido/iconos/iconos.tsx";
import { ESTADO_LISTA_ARCHIVOS } from "@web/config/constants/ui.constants.ts";
import { TEXTO_ARCHIVOS } from "@web/config/strings.ts";
import estilos from "@web/features/archivos/lista-archivos/lista-archivos.module.css";
import { controlFilaArchivo } from "@web/features/archivos/lista-archivos/usar-lista-archivos.ts";
import type { PropsFilaArchivo, PropsListaArchivos } from "@web/types/ui.type.ts";

function FilaArchivo(props: PropsFilaArchivo) {
  const { archivo } = props;
  const { ruta, nombreDescarga, alPulsarVer, alPulsarDescargar } = controlFilaArchivo(props);

  return (
    <li className={estilos.fila}>
      <span className={estilos.datos}>
        <span className={estilos.nombre}>{archivo.nombre}</span>
        <span className={estilos.tipo}>{TEXTO_ARCHIVOS.tipo(archivo.tipo)}</span>
      </span>
      <span className={estilos.acciones}>
        {archivo.previsualizable ? (
          <button
            type="button"
            className={estilos.enlace}
            aria-label={TEXTO_ARCHIVOS.verArchivo(archivo.nombre)}
            onClick={alPulsarVer}
          >
            <IconoOjo />
            {TEXTO_ARCHIVOS.ver}
          </button>
        ) : null}
        <a
          className={estilos.enlace}
          href={ruta}
          download={nombreDescarga}
          aria-label={TEXTO_ARCHIVOS.descargarArchivo(archivo.nombre)}
          onClick={alPulsarDescargar}
        >
          <IconoDescargar />
          {TEXTO_ARCHIVOS.descargar}
        </a>
      </span>
    </li>
  );
}

export function ListaArchivos({ caso, control, alVer }: PropsListaArchivos) {
  const { estado } = control;
  switch (estado.tipo) {
    case ESTADO_LISTA_ARCHIVOS.CARGANDO:
      return (
        <p className={estilos.tenue} role="status">
          {TEXTO_ARCHIVOS.cargando}
        </p>
      );
    case ESTADO_LISTA_ARCHIVOS.ERROR:
      return (
        <div className={estilos.error}>
          <p className={estilos.texto}>{TEXTO_ARCHIVOS.error}</p>
          <button type="button" className={estilos.secundario} onClick={control.reintentar}>
            {TEXTO_ARCHIVOS.reintentar}
          </button>
        </div>
      );
    default:
      return control.vacia ? (
        <p className={estilos.tenue}>{TEXTO_ARCHIVOS.vacio}</p>
      ) : (
        <ul className={estilos.lista} aria-label={TEXTO_ARCHIVOS.lista(caso)}>
          {estado.archivos.map((archivo) => (
            <FilaArchivo
              key={archivo.nombre}
              caso={caso}
              archivo={archivo}
              alVer={alVer}
              alDescargar={control.descargar}
            />
          ))}
        </ul>
      );
  }
}
