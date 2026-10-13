export const DISENO_PDF = {
  ancho: 595,
  alto: 842,
  margen: 50,
  anchoEtiqueta: 190,
  separacionColumnas: 15,
  tamanoTexto: 10,
  tamanoTitulo: 12,
  interlineado: 14,
  separacionBloques: 6,
  colores: {
    texto: [0, 0, 0],
    faltante: [0.75, 0, 0],
    por_confirmar: [0.8, 0.5, 0],
  },
} as const;

export const TEXTOS_PDF = {
  titulo: "Formulario de registro como proveedor",
  caso: "Caso: ",
  cliente: "Cliente: ",
  fecha: "Fecha de ejecución: ",
  obligatorio: " *",
  faltante: "[FALTANTE]",
  porConfirmar: "[POR CONFIRMAR]",
  notas: "Notas",
  sinNotas: "Sin observaciones.",
  motivoFaltante: "no existe en el maestro",
  motivoPorConfirmar: "confirmar con el cliente",
  motivoNoRepresentable:
    "el valor tiene caracteres que el PDF no puede mostrar y salen como ?; revisarlo contra el maestro",
  separadorNotas: ". ",
  reemplazo: "?",
} as const;
