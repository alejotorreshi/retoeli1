export const DIRECTORIO_MODULO = "modulo";
export const ARCHIVO_AGENTE_MODULO = "agent.md";
export const DIRECTORIO_SKILLS_MODULO = "skill";
export const NOMBRE_SKILL = "registro-proveedor";
export const ARCHIVO_SKILL = "SKILL.md";

export const SUFIJO_TEMPORAL_MODULO = ".tmp";

export const SALTOS_HASTA_LA_RAIZ_DESDE_RUNNERS = ["..", "..", ".."] as const;

export const DELIMITADOR_FRONTMATTER = "---";
export const SANGRIA_YAML = "  ";

export const CLAVE_FRONTMATTER = {
  DESCRIPCION: "description",
  MODO: "mode",
  PERMISO: "permission",
  EDICION: "edit",
  SHELL: "bash",
  NOMBRE: "name",
} as const;

export const MODO_AGENTE_MODULO = "primary";

export const PERMISO_MODULO = {
  DENEGADO: "deny",
} as const;

export const MOTIVO_FUENTE_MODULO = {
  AUSENTE: "ausente",
  VACIA: "vacia",
} as const;
