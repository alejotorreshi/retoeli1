import { obtenerVistaPrevia } from "@web/api/cliente-api.ts";
import estilos from "@web/components/dialogo-vista-previa.module.css";
import { ESTADO_VISTA_PREVIA, RESULTADO_API } from "@web/config/constants/ui.constants.ts";
import { TEXTO_VISTA_PREVIA } from "@web/config/strings.ts";
import { estadoDeVistaPreviaFallida } from "@web/features/archivos/estado/vista-previa.ts";
import { esArchivoNoEncontrado } from "@web/features/casos/estado/casos.ts";
import type { EstadoFilaVistaPrevia, EstadoVistaPrevia } from "@web/types/chat.type.ts";
import type {
  PropsBadgeDeFila,
  PropsCuerpoVistaPrevia,
  PropsDialogoVistaPrevia,
} from "@web/types/ui.type.ts";
import { useEffect, useId, useRef, useState } from "react";
import { TIPO_VISTA_PREVIA } from "@/config/constants/files.constants.ts";
import { ESTADO_CAMPO } from "@/config/constants/mapping.constants.ts";

const CLASE_DE_ESTADO = {
  [ESTADO_CAMPO.LLENO]: estilos.lleno,
  [ESTADO_CAMPO.FALTANTE]: estilos.faltante,
  [ESTADO_CAMPO.REQUIERE_CONFIRMACION]: estilos.porConfirmar,
} as const satisfies Record<EstadoFilaVistaPrevia, string | undefined>;

const VISTA_CARGANDO: EstadoVistaPrevia = { tipo: ESTADO_VISTA_PREVIA.CARGANDO };

function BadgeDeFila({ estado }: PropsBadgeDeFila) {
  return (
    <span className={`${estilos.badge} ${CLASE_DE_ESTADO[estado]}`}>{TEXTO_VISTA_PREVIA.estado(estado)}</span>
  );
}

function CuerpoVistaPrevia({ vista }: PropsCuerpoVistaPrevia) {
  if (vista.tipo === TIPO_VISTA_PREVIA.TEXTO) {
    return <pre className={estilos.texto}>{vista.texto}</pre>;
  }
  return (
    <>
      <p className={estilos.nota}>{TEXTO_VISTA_PREVIA.nota}</p>
      <div className={estilos.tablaDesplazable}>
        <table className={estilos.tabla}>
          <thead>
            <tr>
              {TEXTO_VISTA_PREVIA.columnas.map((columna) => (
                <th key={columna} scope="col" className={estilos.encabezado}>
                  {columna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {vista.filas.map((fila) => (
              <tr key={fila.etiqueta}>
                <td className={estilos.celda}>{fila.etiqueta}</td>
                <td className={`${estilos.celda} ${estilos.valor}`}>
                  {TEXTO_VISTA_PREVIA.valor(fila.valor_enmascarado)}
                </td>
                <td className={estilos.celda}>
                  <BadgeDeFila estado={fila.estado} />
                </td>
                <td className={estilos.celda}>{TEXTO_VISTA_PREVIA.valor(fila.nota)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

export function DialogoVistaPrevia({
  caso,
  abierta,
  alCerrar,
  alDescargar,
  alNoEncontrado,
  alVencerAcceso,
}: PropsDialogoVistaPrevia) {
  const dialogo = useRef<HTMLDialogElement>(null);
  const cerrarBoton = useRef<HTMLButtonElement>(null);
  const [estado, setEstado] = useState<EstadoVistaPrevia>(VISTA_CARGANDO);
  const idTitulo = useId();

  useEffect(() => {
    const elemento = dialogo.current;
    if (elemento === null) return;
    if (abierta !== null && !elemento.open) {
      elemento.showModal();
      cerrarBoton.current?.focus();
    }
    if (abierta === null && elemento.open) elemento.close();
  }, [abierta]);

  useEffect(() => {
    if (abierta === null) return;
    setEstado(VISTA_CARGANDO);
    const controlador = new AbortController();
    void obtenerVistaPrevia(caso, abierta.archivo.nombre, controlador.signal).then((resultado) => {
      if (controlador.signal.aborted) return;
      if (resultado.tipo === RESULTADO_API.OK) {
        setEstado({ tipo: ESTADO_VISTA_PREVIA.LISTA, vista: resultado.valor });
        return;
      }
      if (resultado.tipo === RESULTADO_API.ACCESO_VENCIDO) alVencerAcceso(resultado.mensaje);
      if (esArchivoNoEncontrado(resultado)) alNoEncontrado();
      setEstado(estadoDeVistaPreviaFallida(resultado));
    });
    return () => controlador.abort();
  }, [caso, abierta, alNoEncontrado, alVencerAcceso]);

  function cerrar(): void {
    dialogo.current?.close();
  }

  return (
    <dialog ref={dialogo} className={estilos.dialogo} aria-labelledby={idTitulo} onClose={alCerrar}>
      <h2 id={idTitulo} className={estilos.titulo}>
        {abierta?.archivo.nombre}
      </h2>
      <div className={estilos.cuerpo}>
        {estado.tipo === ESTADO_VISTA_PREVIA.CARGANDO ? (
          <p className={estilos.estado} role="status">
            {TEXTO_VISTA_PREVIA.cargando}
          </p>
        ) : null}
        {estado.tipo === ESTADO_VISTA_PREVIA.ERROR ? (
          <p className={estilos.error} role="alert">
            {estado.texto}
          </p>
        ) : null}
        {estado.tipo === ESTADO_VISTA_PREVIA.LISTA ? <CuerpoVistaPrevia vista={estado.vista} /> : null}
      </div>
      <div className={estilos.acciones}>
        <button
          type="button"
          className={estilos.secundario}
          disabled={abierta === null}
          onClick={() => {
            if (abierta !== null) alDescargar(abierta.archivo);
          }}
        >
          {TEXTO_VISTA_PREVIA.descargar}
        </button>
        <button ref={cerrarBoton} type="button" className={estilos.secundario} onClick={cerrar}>
          {TEXTO_VISTA_PREVIA.cerrar}
        </button>
      </div>
    </dialog>
  );
}
