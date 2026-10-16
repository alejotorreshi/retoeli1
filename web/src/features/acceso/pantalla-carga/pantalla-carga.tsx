import { CLASE_GLOBAL } from "@web/config/constants/ui.constants.ts";
import { TEXTO_APP } from "@web/config/strings.ts";
import estilos from "@web/features/acceso/pantalla-carga/pantalla-carga.module.css";

export function PantallaCarga() {
  return (
    <main className={estilos.pantalla} aria-busy="true">
      <p role="status" className={CLASE_GLOBAL.OCULTO}>
        {TEXTO_APP.cargando}
      </p>
    </main>
  );
}
