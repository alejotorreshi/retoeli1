import { Columnas } from "@web/features/disposicion/columnas/columnas.tsx";
import { ProveedorAlmacen } from "@web/store/proveedor-almacen.tsx";
import type { PropsApp } from "@web/types/ui.type.ts";

export function App({ instancia }: PropsApp) {
  return (
    <ProveedorAlmacen instancia={instancia}>
      <Columnas />
    </ProveedorAlmacen>
  );
}
