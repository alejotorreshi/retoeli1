import type { InstanciaAlmacen } from "@web/types/store.type.ts";
import { createContext } from "react";

export const ContextoAlmacen = createContext<InstanciaAlmacen | null>(null);
