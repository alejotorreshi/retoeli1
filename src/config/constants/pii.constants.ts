export const TIPO_MASCARA = {
  PUBLICO: "publico",
  ULTIMOS4: "ultimos4",
  INICIALES: "iniciales",
  CORREO: "correo",
  TELEFONO: "telefono",
  MONTO: "monto",
  OCULTO: "oculto",
} as const;

export const LARGO_VISIBLE = 4;

export const RUTAS_POR_MASCARA = [
  [
    TIPO_MASCARA.PUBLICO,
    [
      "razon_social",
      "tipo_sociedad",
      "ciudad",
      "departamento",
      "pais",
      "sitio_web",
      "actividad_economica",
      "ciiu_principal",
      "ciiu_secundario",
      "regimen_tributario",
      "numero_empleados",
    ],
  ],
  [
    TIPO_MASCARA.ULTIMOS4,
    [
      "nit",
      "digito_verificacion",
      "codigo_postal",
      "matricula_mercantil",
      "representante_legal.identificacion",
      "banco.numero_cuenta",
      "banco.swift",
    ],
  ],
  [
    TIPO_MASCARA.INICIALES,
    ["representante_legal.nombre", "contacto_comercial.nombre", "contacto_financiero.nombre"],
  ],
  [
    TIPO_MASCARA.CORREO,
    ["representante_legal.email", "contacto_comercial.email", "contacto_financiero.email"],
  ],
  [
    TIPO_MASCARA.TELEFONO,
    [TIPO_MASCARA.TELEFONO, "contacto_comercial.telefono", "contacto_financiero.telefono"],
  ],
  [TIPO_MASCARA.MONTO, ["ingresos_ultimo_ano.valor"]],
] as const;
