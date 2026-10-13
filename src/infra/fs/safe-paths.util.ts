import { join, relative, sep } from "node:path";
import { OUT_DIR } from "@/config/constants/files.constants.ts";

export function rutaRelativa(raiz: string, absoluta: string): string {
  return relative(raiz, absoluta).split(sep).join("/");
}

export function directorioSalidaCaso(raiz: string, caso: string): string {
  return join(raiz, OUT_DIR, caso);
}
