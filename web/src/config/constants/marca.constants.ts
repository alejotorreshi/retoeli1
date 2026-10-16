export const RUTA_LOGO = "/marca/periferia-it-group.webp";

export const RUTA_FAVICON = "/marca/favicon.jpg";

export const ANCHO_LOGO = 248;

export const ALTO_LOGO = 62;

export const VARIANTE_LOGO = {
  ENCABEZADO: "encabezado",
  ENCABEZADO_ANGOSTO: "encabezado_angosto",
  ACCESO: "acceso",
} as const;

export const FUENTES_AUTOALOJADAS = {
  OUTFIT_600: "/fuentes/outfit-latin-600.woff2",
  MONTSERRAT_400: "/fuentes/montserrat-latin-400.woff2",
  MONTSERRAT_600: "/fuentes/montserrat-latin-600.woff2",
} as const;

export const LICENCIAS_DE_FUENTES = {
  OUTFIT: "/fuentes/OFL-Outfit.txt",
  MONTSERRAT: "/fuentes/OFL-Montserrat.txt",
} as const;

export const MARCADOR_TITULO = "%TITULO_DOCUMENTO%";

export const NOMBRE_PLUGIN_TITULO = "titulo-del-documento";

export const ENTIDADES_HTML = {
  AMPERSAND: { caracter: "&", entidad: "&amp;" },
  MENOR_QUE: { caracter: "<", entidad: "&lt;" },
} as const;
