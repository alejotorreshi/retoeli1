import type { TIPO_ARCHIVO_CASO, TIPO_VISTA_PREVIA } from "@/config/constants/files.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";
import type { EstadoCampo } from "@/domain/types/reglas.type.ts";

export type TipoArchivo = ValorDe<typeof TIPO_ARCHIVO_CASO>;

export type ArchivoCaso = {
  readonly nombre: string;
  readonly tipo: TipoArchivo;
  readonly previsualizable: boolean;
};

export type ArchivoServible = {
  readonly nombre: string;
  readonly tipoContenido: string;
  readonly cuerpo: Blob;
};

export type FilaVistaPrevia = {
  readonly etiqueta: string;
  readonly valor_enmascarado: string | null;
  readonly estado: EstadoCampo;
  readonly nota: string | null;
};

export type VistaPreviaTabla = {
  readonly tipo: typeof TIPO_VISTA_PREVIA.TABLA;
  readonly filas: readonly FilaVistaPrevia[];
};

export type VistaPreviaTexto = {
  readonly tipo: typeof TIPO_VISTA_PREVIA.TEXTO;
  readonly texto: string;
};

export type VistaPrevia = VistaPreviaTabla | VistaPreviaTexto;

export type LectorArtefactos = {
  listar(caso: string): Promise<readonly ArchivoCaso[] | null>;
  abrir(caso: string, nombre: string): Promise<ArchivoServible | null>;
  vistaPrevia(caso: string, nombre: string): Promise<VistaPrevia | null>;
};
