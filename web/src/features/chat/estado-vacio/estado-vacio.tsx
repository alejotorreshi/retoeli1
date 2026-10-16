import { TEXTO_CHAT, TEXTO_ESTADO_VACIO } from "@web/config/strings.ts";
import { AccionesRapidas } from "@web/features/chat/acciones-rapidas/acciones-rapidas.tsx";
import estilos from "@web/features/chat/estado-vacio/estado-vacio.module.css";
import { useEstadoVacio } from "@web/features/chat/estado-vacio/usar-estado-vacio.ts";
import { TarjetaCaso } from "@web/features/chat/tarjeta-caso/tarjeta-caso.tsx";

export function EstadoVacio() {
  const { contenedor, idCasos, idAcciones, casos, mostrarCasos, casosNoDisponibles } = useEstadoVacio();
  return (
    <div ref={contenedor} className={estilos.vacio}>
      <h2 className={estilos.titulo}>{TEXTO_CHAT.vacioTitulo}</h2>
      <p className={estilos.cuerpo}>{TEXTO_CHAT.vacioCuerpo}</p>
      {mostrarCasos ? (
        <section aria-labelledby={idCasos} className={estilos.seccion}>
          <h3 id={idCasos} className={estilos.rotulo}>
            {TEXTO_ESTADO_VACIO.casos}
          </h3>
          {casosNoDisponibles ? (
            <p role="status" className={estilos.noDisponibles}>
              {TEXTO_ESTADO_VACIO.casosNoDisponibles}
            </p>
          ) : (
            <ul className={estilos.grilla}>
              {casos.map((slug) => (
                <li key={slug} className={estilos.celda}>
                  <TarjetaCaso slug={slug} />
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : null}
      <section aria-labelledby={idAcciones} className={estilos.seccion}>
        <h3 id={idAcciones} className={estilos.rotulo}>
          {TEXTO_ESTADO_VACIO.acciones}
        </h3>
        <AccionesRapidas compactas={false} angosto={false} />
      </section>
    </div>
  );
}
