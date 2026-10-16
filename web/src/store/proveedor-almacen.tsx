import { ContextoAlmacen } from "@web/store/contexto-almacen.ts";
import type { PropsProveedorAlmacen } from "@web/types/store.type.ts";

export function ProveedorAlmacen({ instancia, children }: PropsProveedorAlmacen) {
  return <ContextoAlmacen.Provider value={instancia}>{children}</ContextoAlmacen.Provider>;
}
