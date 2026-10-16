import { LogoMarca } from "@web/compartido/logo-marca/logo-marca.tsx";
import { VARIANTE_LOGO } from "@web/config/constants/marca.constants.ts";
import { TEXTO_APP } from "@web/config/strings.ts";
import estilos from "@web/features/acceso/pantalla-carga/pantalla-carga.module.css";

export function PantallaCarga() {
  return (
    <main className={estilos.pantalla} aria-busy="true">
      <LogoMarca variante={VARIANTE_LOGO.ACCESO} />
      <p role="status" className={estilos.estado}>
        {TEXTO_APP.cargando}
      </p>
    </main>
  );
}
