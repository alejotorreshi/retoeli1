import { LONGITUD_MAXIMA_CASO, LONGITUD_MAXIMA_SESION } from "@/config/constants/limits.constants.ts";

export const PATRON_CASO: RegExp = new RegExp(`^[a-z0-9-]{1,${LONGITUD_MAXIMA_CASO}}$`);
export const PATRON_SESION: RegExp = new RegExp(`^[A-Za-z0-9_-]{1,${LONGITUD_MAXIMA_SESION}}$`);
export const PATRON_PLANTILLA_CONOCIMIENTO: RegExp = /^plantillas\/[a-z-]+\.md$/;
export const PATRON_TEXTO_NO_VACIO: RegExp = /\S/;
export const PATRON_ARCHIVO_SOPORTE: RegExp = /^[a-z0-9][a-z0-9._-]{0,100}$/;
export const PATRON_RUTA_MAESTRO: RegExp = /^[a-z_]+(\.[a-z_]+)*$/;
export const PATRON_PAIS: RegExp = /^[A-Z]{2}$/;
export const PATRON_FECHA: RegExp = /^\d{4}-\d{2}-\d{2}$/;
export const PATRON_CELDA: RegExp = /^([A-Z]{1,3})([1-9][0-9]{0,6})$/;
export const PATRON_NOMBRE_HOJA: RegExp = /^[^*?:\\/[\]']([^*?:\\/[\]]*[^*?:\\/[\]'])?$/;
export const PATRON_TIPO_SOPORTE: RegExp = /^[a-z0-9_]{1,64}$/;
export const PATRON_SEGMENTO_RUTA: RegExp = /^[a-z_]+$/;
export const PATRON_ESPACIO: RegExp = / /g;
