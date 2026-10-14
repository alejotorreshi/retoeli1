import { describe, expect, test } from "bun:test";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { nuncaCancelanCabeza, nuncaCancelanDentro } from "@tests/helpers/corpus-confirmacion.helper.ts";
import { CODIGO_AGENTE } from "@/config/constants/agent.constants.ts";
import { DECISION_CONFIRMACION } from "@/config/constants/confirmation.constants.ts";
import { CODIGO_ERROR } from "@/config/constants/errors.constants.ts";
import {
  ARCHIVO_CONOCIMIENTO_PROCESO,
  ARCHIVO_PROMPT,
  DIRECTORIO_AGENTE,
} from "@/config/constants/files.constants.ts";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { TEXTO_CONFIRMACION } from "@/config/strings.ts";
import { clasificarConfirmacion } from "@/domain/policies/confirmacion.policy.ts";

const RAIZ_REPO = join(import.meta.dir, "..", "..");
const RUTA_PROMPT = join(RAIZ_REPO, DIRECTORIO_AGENTE, ARCHIVO_PROMPT);
const RUTA_CONOCIMIENTO = join(RAIZ_REPO, "src", "knowledge", ARCHIVO_CONOCIMIENTO_PROCESO);
const UMBRALES_DE_REGLAS = ["0.8", "0.6", "0.95"];
const ENCABEZADOS_RESUMEN = [
  "Caso:",
  "Conteos:",
  "Faltantes:",
  "Por confirmar:",
  "Soportes por actualizar:",
  "Estado:",
];
const FILA_DE_TABLA = /^\s*\|.*\|\s*$/m;

const prompt = await readFile(RUTA_PROMPT, "utf8");
const conocimiento = await readFile(RUTA_CONOCIMIENTO, "utf8");
const herramientas = Object.values(HERRAMIENTA);

function apariciones(texto: string, fragmento: string): number {
  return texto.split(fragmento).length - 1;
}

function nombresSinPrefijo(texto: string): string[] {
  return herramientas.filter(
    (nombre) => apariciones(texto, nombre) !== apariciones(texto, NOMBRE_VISIBLE[nombre]),
  );
}

describe("contrato de contenido de agent/prompt.md y del conocimiento del proceso (AGT-02, AGT-03, D-55)", () => {
  test("ambos archivos tienen texto y ningún marcador {{", () => {
    for (const texto of [prompt, conocimiento]) {
      expect(texto.trim().length).toBeGreaterThan(0);
      expect(texto).not.toContain("{{");
    }
  });

  test("ninguno nombra una herramienta sin el prefijo proveedor_", () => {
    expect(nombresSinPrefijo(prompt)).toEqual([]);
    expect(nombresSinPrefijo(conocimiento)).toEqual([]);
  });

  test("el conocimiento nombra las cinco herramientas", () => {
    for (const nombre of herramientas) expect(conocimiento).toContain(NOMBRE_VISIBLE[nombre]);
  });

  test("el conocimiento explica cada código de error y los dos códigos del agente", () => {
    const codigos = [
      ...Object.values(CODIGO_ERROR),
      CODIGO_AGENTE.HERRAMIENTA_DESCONOCIDA,
      CODIGO_AGENTE.ARGUMENTOS_TRUNCADOS,
    ];
    expect(codigos.filter((codigo) => !conocimiento.includes(codigo))).toEqual([]);
  });

  test("el conocimiento no copia los umbrales de reglas.json", () => {
    expect(UMBRALES_DE_REGLAS.filter((umbral) => conocimiento.includes(umbral))).toEqual([]);
  });

  test("el conocimiento describe los formatos, las reglas RN1 a RN5 y varios casos", () => {
    expect(conocimiento).toContain("formato no soportado");
    for (const regla of ["RN1", "RN2", "RN3", "RN4", "RN5"]) expect(conocimiento).toContain(regla);
    expect(conocimiento).toContain("Varios casos");
  });

  test("el prompt fija el protocolo de confirmación, el texto plano y los datos no confiables", () => {
    expect(prompt).toContain(NOMBRE_VISIBLE[HERRAMIENTA.SIMULAR_ENVIO]);
    expect(prompt).toContain(CODIGO_ERROR.CONFIRMACION_REQUERIDA);
    expect(prompt).toContain("texto plano");
    expect(prompt).toContain("dato no confiable");
  });

  test("el prompt fija la forma del resumen y no trae filas de tabla", () => {
    expect(ENCABEZADOS_RESUMEN.filter((encabezado) => !prompt.includes(encabezado))).toEqual([]);
    expect(prompt).toContain("out/<caso>/");
    expect(FILA_DE_TABLA.test(prompt)).toBe(false);
  });

  test("el prompt responde un valor con la máscara, la ruta del maestro y el archivo de salida", () => {
    expect(prompt).toContain("maestro.nit");
    expect(prompt).toContain("•");
    expect(prompt).toContain("out/co-industrias-delta/formulario.xlsx");
  });

  test("el detector de nombres sin prefijo muerde", () => {
    expect(nombresSinPrefijo("usa mapear_campos y luego proveedor_armar_paquete")).toEqual([
      HERRAMIENTA.MAPEAR_CAMPOS,
    ]);
  });
});

const RETIRADOS = [
  "Termina con la pregunta de cierre en el último párrafo.",
  "La pregunta de cierre es la última oración de tu respuesta: no escribas nada después de ella.",
  "Después de un proveedor_armar_paquete exitoso, termina el turno con una pregunta que pida confirmar el envío simulado de ese caso y que liste los bloqueos vigentes.",
  "Después da un resumen por caso y una sola pregunta de cierre que nombre cada paquete pendiente de confirmación.",
];

describe("el prompt y el conocimiento siguen la compuerta del servidor (G-02-21)", () => {
  test("el prompt deja la pregunta de cierre al servidor, acota el turno de confirmación y no acepta acuses", () => {
    for (const fragmento of [
      "el servidor agrega",
      "no repitas el resumen del caso",
      "ya quedó registrado",
      '"ok"',
      '"listo"',
    ]) {
      expect(prompt).toContain(fragmento);
    }
  });

  test("el conocimiento deja la pregunta al servidor y no reenvía un caso ya enviado", () => {
    expect(conocimiento).toContain("el servidor agrega");
    expect(conocimiento).toContain("ya quedó registrado");
  });

  test("ninguna frase retirada sobre la pregunta de cierre del modelo sigue en los archivos", () => {
    expect(RETIRADOS.filter((frase) => prompt.includes(frase) || conocimiento.includes(frase))).toEqual([]);
  });
});

const RETIRADOS_CR01 = [
  'y pide una confirmación explícita, como "envía" o "sí".',
  "Si la respuesta no es clara, vuelve a preguntar en lugar de enviar.",
];

describe("la re-pregunta es del servidor (CR-01, D-63.6)", () => {
  test("el prompt deja pendiente lo que no confirma, atiende los pedidos ajenos y cancela solo con un rechazo", () => {
    for (const fragmento of [
      "el servidor vuelve a agregar su pregunta",
      "atiéndelo con normalidad",
      "ese rechazo la cancela",
    ]) {
      expect(prompt).toContain(fragmento);
    }
  });

  test("el conocimiento deja la re-pregunta al servidor y cancela solo con una negación", () => {
    expect(conocimiento).toContain("el servidor vuelve a agregar su pregunta");
    expect(conocimiento).toContain("la cancela");
  });

  test("ninguna frase que le pedía al modelo pedir la confirmación sigue en los archivos", () => {
    expect(RETIRADOS_CR01.filter((frase) => prompt.includes(frase) || conocimiento.includes(frase))).toEqual(
      [],
    );
  });
});

const RETIRADOS_G022 = [
  "Si la analista dice que no envíes nada todavía, no llames a proveedor_simular_envio en ese turno.",
  'Mientras un paquete espera confirmación, una respuesta que no confirma ni rechaza, o un pedido distinto, lo deja pendiente y el servidor vuelve a agregar su pregunta; una negación como "no envíes nada todavía" la cancela.',
];
const PENDIENTE_EC = ["ec-corp-andina"];
const RECHAZOS_DEL_PROMPT = [
  "no envíes",
  "no lo mandes",
  "no lo hagas",
  "no confirmo",
  "no",
  "todavía no",
  "espera",
  "cancela",
  "mejor no",
];
const PEDIDOS_DEL_PROMPT = ["consulta el NIT para tenerlo a mano", "dame el NIT, no el RUC"];
const RECHAZOS_DEL_CONOCIMIENTO = [
  "no envíes",
  "no lo mandes",
  "no envíes nada todavía, ¿qué falta?",
  "no",
  "todavía no",
  "espera",
  "cancela",
];

function citado(texto: string, ejemplo: string): boolean {
  return texto.includes(`"${ejemplo}"`);
}

describe("el rechazo explícito es acotado (G-02-2, D-63.8)", () => {
  test.each(RECHAZOS_DEL_PROMPT)("el prompt cita %p como rechazo y el servidor lo rechaza", (ejemplo) => {
    expect(citado(prompt, ejemplo)).toBe(true);
    expect(clasificarConfirmacion(ejemplo, PENDIENTE_EC).decision).toBe(DECISION_CONFIRMACION.RECHAZA);
  });

  test.each(PEDIDOS_DEL_PROMPT)("el prompt cita %p como pedido y el servidor no lo rechaza", (ejemplo) => {
    expect(citado(prompt, ejemplo)).toBe(true);
    expect(clasificarConfirmacion(ejemplo, PENDIENTE_EC).decision).toBe(DECISION_CONFIRMACION.OTRO);
  });

  test.each(RECHAZOS_DEL_CONOCIMIENTO)(
    "el conocimiento cita %p como rechazo y el servidor lo rechaza",
    (ejemplo) => {
      expect(citado(conocimiento, ejemplo)).toBe(true);
      expect(clasificarConfirmacion(ejemplo, PENDIENTE_EC).decision).toBe(DECISION_CONFIRMACION.RECHAZA);
    },
  );

  test("el prompt y el conocimiento definen el rechazo como el servidor", () => {
    for (const fragmento of [
      "aunque después venga una pregunta",
      "no es un rechazo",
      "no digas que la confirmación quedó cancelada",
    ]) {
      expect(prompt).toContain(fragmento);
    }
    for (const fragmento of [
      "solo un rechazo explícito la cancela",
      "aunque después venga una pregunta",
      "no es un rechazo",
    ]) {
      expect(conocimiento).toContain(fragmento);
    }
  });

  test("ninguna frase retirada sobre la negación que cancela sigue en los archivos", () => {
    expect(RETIRADOS_G022.filter((frase) => prompt.includes(frase) || conocimiento.includes(frase))).toEqual(
      [],
    );
  });
});

const RETIRADOS_G023 = [
  'Un rechazo es un "no envíes" (o "no lo mandes", "no lo hagas", "no confirmo") o una frase corta como "no", "todavía no", "espera", "cancela" o "mejor no", aunque después venga una pregunta.',
  'Ese pedido no es un rechazo aunque traiga palabras como "no", "para", "luego", "mejor" o "después", por ejemplo "consulta el NIT para tenerlo a mano" o "dame el NIT, no el RUC": no digas que la confirmación quedó cancelada.',
  'solo un rechazo explícito la cancela: un "no envíes" o "no lo mandes", aunque después venga una pregunta ("no envíes nada todavía, ¿qué falta?"), o una frase corta como "no", "todavía no", "espera" o "cancela".',
  'Un pedido que solo contiene palabras como "no", "para", "luego" o "mejor" no es un rechazo.',
];
const RETIRADOS_G024 = [
  'Un rechazo es una negación del envío, como "no envíes", "no lo mandes", "no lo confirmes", "no lo hagas", "no confirmo" o "no quiero enviarlo todavía", o una respuesta corta de espera, como "no", "todavía no", "espera", "espera un momento", "cancela" o "mejor no", sola o separada del resto por una coma o un punto, aunque después venga una pregunta o un pedido que no nombra un caso ("No, ¿qué falta?", "Espera, dime qué falta", "todavía no, ¿qué falta?").',
  'Ese pedido no es un rechazo aunque traiga palabras como "no", "para", "luego", "mejor" o "después" dentro de la frase o junto al nombre de un caso, por ejemplo "consulta el NIT para tenerlo a mano", "dame el NIT, no el RUC", "procesa co-industrias-delta, no pe-andes" o "No, el de pe-andes": no digas que la confirmación quedó cancelada.',
];
const RETIRADOS_D6311 = [
  "Ese paquete sigue pendiente y el servidor vuelve a agregar su pregunta; si quedan varios paquetes pendientes, la pregunta los nombra y la analista tiene que nombrar el caso al confirmar.",
];
const DOS_PENDIENTES = ["ec-corp-andina", "co-industrias-delta"];
const CITA_RECTA = /"([^"]*)"/g;

type OracionD639 = {
  readonly nombre: string;
  readonly archivo: "prompt" | "conocimiento";
  readonly oracion: string;
  readonly rechazos: readonly string[];
  readonly otros: readonly string[];
  readonly dentro: readonly string[];
  readonly cabeza: readonly string[];
};

const ORACIONES_D639: readonly OracionD639[] = [
  {
    nombre: "prompt S51",
    archivo: "prompt",
    oracion:
      'Un rechazo es una negación del envío, con o sin motivo, como "no envíes", "no lo mandes", "no lo confirmes", "no lo hagas", "no confirmo", "no confirmo el envío simulado", "no confirmo porque falta el certificado" o "no quiero enviarlo todavía", o una respuesta corta de espera, como "no", "todavía no", "espera", "espera un momento", "cancela", "detén el envío" o "mejor no", sola, junto al nombre del caso que espera confirmación o separada del resto por una coma o un punto, aunque después venga una pregunta o un pedido que no nombra un caso ("No, ¿qué falta?", "Espera, dime qué falta", "todavía no, ¿qué falta?", "ec-corp-andina no", "todavía no, ec-corp-andina").',
    rechazos: [
      "no envíes",
      "no lo mandes",
      "no lo confirmes",
      "no lo hagas",
      "no confirmo",
      "no confirmo el envío simulado",
      "no confirmo porque falta el certificado",
      "no quiero enviarlo todavía",
      "no",
      "todavía no",
      "espera",
      "espera un momento",
      "cancela",
      "detén el envío",
      "mejor no",
      "No, ¿qué falta?",
      "Espera, dime qué falta",
      "todavía no, ¿qué falta?",
      "ec-corp-andina no",
      "todavía no, ec-corp-andina",
    ],
    otros: [],
    dentro: [],
    cabeza: [],
  },
  {
    nombre: "prompt SCON",
    archivo: "prompt",
    oracion:
      'Palabras como "para", "luego", "después", "mejor" o "momento" no rechazan al comienzo de una pregunta o de un pedido ("Luego, ¿qué sigue?", "Para pe-andes, ¿qué falta?", "Mejor, dame el NIT"); solo rechazan cuando forman todo el mensaje ("Para.", "mejor después", "un momento").',
    rechazos: ["Para.", "mejor después", "un momento"],
    otros: ["Luego, ¿qué sigue?", "Para pe-andes, ¿qué falta?", "Mejor, dame el NIT"],
    dentro: [],
    cabeza: ["para", "luego", "después", "mejor", "momento"],
  },
  {
    nombre: "prompt S53",
    archivo: "prompt",
    oracion:
      'Ese pedido no es un rechazo aunque traiga palabras como "no", "para", "luego", "mejor" o "después" dentro de la frase o junto al nombre de otro caso, por ejemplo "consulta el NIT para tenerlo a mano", "dame el NIT, no el RUC", "procesa co-industrias-delta, no pe-andes" o "No, el de pe-andes": no digas que la confirmación quedó cancelada.',
    rechazos: [],
    otros: [
      "consulta el NIT para tenerlo a mano",
      "dame el NIT, no el RUC",
      "procesa co-industrias-delta, no pe-andes",
      "No, el de pe-andes",
    ],
    dentro: ["no", "para", "luego", "mejor", "después"],
    cabeza: [],
  },
  {
    nombre: "prompt SCASO",
    archivo: "prompt",
    oracion:
      'Si la analista empieza con una respuesta de espera ("no", "todavía no", "espera") y después pide algo que nombra el caso que espera confirmación, el servidor solo lo deja pendiente cuando el pedido empieza directamente con un verbo de pedido como consulta, procesa o revisa ("No, consulta el NIT de ec-corp-andina"); con otra palabra delante, o sin un verbo de pedido, cancela la confirmación ("No, por favor consulta el NIT de ec-corp-andina", "Todavía no, pero dame el NIT de ec-corp-andina", "No, quiero el NIT de ec-corp-andina").',
    rechazos: [
      "no",
      "todavía no",
      "espera",
      "No, por favor consulta el NIT de ec-corp-andina",
      "Todavía no, pero dame el NIT de ec-corp-andina",
      "No, quiero el NIT de ec-corp-andina",
    ],
    otros: ["No, consulta el NIT de ec-corp-andina"],
    dentro: [],
    cabeza: [],
  },
  {
    nombre: "conocimiento RN4a",
    archivo: "conocimiento",
    oracion:
      'solo un rechazo explícito la cancela: una negación del envío ("no envíes", "no lo mandes", "no quiero enviarlo todavía"), aunque después venga una pregunta ("no envíes nada todavía, ¿qué falta?"), o una respuesta corta de espera sola o separada del resto por una coma o un punto ("no", "todavía no", "espera", "espera un momento", "cancela", "No, ¿qué falta?").',
    rechazos: [
      "no envíes",
      "no lo mandes",
      "no quiero enviarlo todavía",
      "no envíes nada todavía, ¿qué falta?",
      "no",
      "todavía no",
      "espera",
      "espera un momento",
      "cancela",
      "No, ¿qué falta?",
    ],
    otros: [],
    dentro: [],
    cabeza: [],
  },
  {
    nombre: "conocimiento RN4b",
    archivo: "conocimiento",
    oracion:
      'Un pedido distinto (por ejemplo "consulta el NIT para tenerlo a mano") no es un rechazo aunque traiga palabras como "no", "para", "luego" o "mejor" dentro de la frase o junto al nombre de un caso.',
    rechazos: [],
    otros: ["consulta el NIT para tenerlo a mano"],
    dentro: ["no", "para", "luego", "mejor"],
    cabeza: [],
  },
];

function textoDe(archivo: OracionD639["archivo"]): string {
  return archivo === "prompt" ? prompt : conocimiento;
}

function citasRectas(oracion: string): string[] {
  return [...oracion.matchAll(CITA_RECTA)].map(([, cita]) => cita ?? "");
}

const CANCELAN_CON_EC: ReadonlySet<string> = new Set(["No, el de ec-corp-andina"]);

function expandidos({ dentro, cabeza }: OracionD639): readonly string[] {
  return [...dentro.flatMap(nuncaCancelanDentro), ...cabeza.flatMap(nuncaCancelanCabeza)].filter(
    (mensaje) => !CANCELAN_CON_EC.has(mensaje),
  );
}

describe("el prompt y el conocimiento describen el rechazo de D-63.9, D-63.10 y D-63.11 (G-02-2, WR-22, IN-29, CR-05, CR-06)", () => {
  test("hay seis oraciones que definen el rechazo", () => {
    expect(ORACIONES_D639).toHaveLength(6);
  });

  test.each([...ORACIONES_D639])("$nombre está entera en su archivo", ({ archivo, oracion }) => {
    expect(textoDe(archivo)).toContain(oracion);
  });

  test.each([...ORACIONES_D639])("$nombre no deja ninguna cita sin clasificar", (entrada) => {
    const clasificadas = [...entrada.rechazos, ...entrada.otros, ...entrada.dentro, ...entrada.cabeza];
    expect(citasRectas(entrada.oracion).sort()).toEqual(clasificadas.sort());
  });

  test.each([...ORACIONES_D639])(
    "cada rechazo citado en $nombre rechaza con uno o dos pendientes",
    ({ rechazos }) => {
      const fallidos = rechazos.flatMap((ejemplo) =>
        [PENDIENTE_EC, DOS_PENDIENTES]
          .filter(
            (pendientes) =>
              clasificarConfirmacion(ejemplo, pendientes).decision !== DECISION_CONFIRMACION.RECHAZA,
          )
          .map((pendientes) => [ejemplo, pendientes]),
      );
      expect(fallidos).toEqual([]);
    },
  );

  test.each([...ORACIONES_D639])("cada pedido citado en $nombre deja el caso pendiente", ({ otros }) => {
    const fallidos = otros.flatMap((ejemplo) =>
      [PENDIENTE_EC, DOS_PENDIENTES]
        .filter(
          (pendientes) => clasificarConfirmacion(ejemplo, pendientes).decision !== DECISION_CONFIRMACION.OTRO,
        )
        .map((pendientes) => [ejemplo, pendientes]),
    );
    expect(fallidos).toEqual([]);
  });

  test.each([...ORACIONES_D639])(
    "cada palabra citada en $nombre se expande en mensajes que no cancelan",
    (entrada) => {
      const fallidos = expandidos(entrada).filter(
        (mensaje) => clasificarConfirmacion(mensaje, PENDIENTE_EC).decision !== DECISION_CONFIRMACION.OTRO,
      );
      expect(fallidos).toEqual([]);
    },
  );

  test("ninguna oración retirada de 02-22 sigue en los archivos", () => {
    expect(RETIRADOS_G023.filter((frase) => prompt.includes(frase) || conocimiento.includes(frase))).toEqual(
      [],
    );
  });
});

describe("el prompt no afirma el estado de la compuerta tras un pedido sobre el caso pendiente (CR-06, WR-27, T-02-83, D-63.11)", () => {
  test("el prompt condiciona la re-pregunta y pide no afirmar el estado en ese pedido", () => {
    expect(prompt).toContain(
      "Si el paquete sigue pendiente, el servidor vuelve a agregar su pregunta al final de tu respuesta",
    );
    expect(prompt).toContain(
      "En ese pedido no digas si el paquete sigue pendiente ni si la confirmación quedó cancelada",
    );
  });

  test("ninguna frase retirada por D-63.11 sigue en los archivos", () => {
    expect(RETIRADOS_D6311.filter((frase) => prompt.includes(frase) || conocimiento.includes(frase))).toEqual(
      [],
    );
  });
});

const NEGACIONES_DE_LA_PREGUNTA = ["no confirmo", "no autorizo", "no lo confirmo"];
const MOTIVOS = [" porque falta el certificado", ": falta el certificado", " hasta tener el certificado"];
const APERTURA_DE_LA_PREGUNTA = "¿Confirmas ";
const CIERRE_DE_LA_PREGUNTA = "?";

function objetoDeLaPregunta(caso: string): string {
  const pregunta = TEXTO_CONFIRMACION.unCaso(caso, []);
  const inicio = pregunta.lastIndexOf(APERTURA_DE_LA_PREGUNTA) + APERTURA_DE_LA_PREGUNTA.length;
  return pregunta.slice(inicio, pregunta.lastIndexOf(CIERRE_DE_LA_PREGUNTA));
}

function negacionesDeLaPregunta(caso: string): readonly string[] {
  const objeto = objetoDeLaPregunta(caso);
  const sinCaso = objeto.slice(0, objeto.lastIndexOf(` de ${caso}`));
  return NEGACIONES_DE_LA_PREGUNTA.flatMap((negacion) => [
    `${negacion} ${objeto}`,
    `${negacion} ${sinCaso}`,
    ...MOTIVOS.map((motivo) => `${negacion}${motivo}`),
  ]);
}

describe("el 'no confirmo' del prompt cubre la redacción de la pregunta del servidor y un motivo (CR-05, D-63.10)", () => {
  test("el objeto de la pregunta del servidor sale de TEXTO_CONFIRMACION.unCaso", () => {
    expect(objetoDeLaPregunta("ec-corp-andina")).toBe("el envío simulado de ec-corp-andina");
  });

  test("negar la pregunta del servidor, con o sin el caso y con un motivo, rechaza con uno o dos pendientes", () => {
    const mensajes = negacionesDeLaPregunta("ec-corp-andina");
    expect(mensajes).toHaveLength(15);
    const fallidos = mensajes.flatMap((mensaje) =>
      [PENDIENTE_EC, DOS_PENDIENTES]
        .filter(
          (pendientes) =>
            clasificarConfirmacion(mensaje, pendientes).decision !== DECISION_CONFIRMACION.RECHAZA,
        )
        .map((pendientes) => [mensaje, pendientes]),
    );
    expect(fallidos).toEqual([]);
  });

  test("ninguna oración retirada de 02-23 sigue en los archivos", () => {
    expect(RETIRADOS_G024.filter((frase) => prompt.includes(frase) || conocimiento.includes(frase))).toEqual(
      [],
    );
  });
});

describe("un envío que falla vuelve a quedar pendiente (WR-02, D-63.7)", () => {
  test("el conocimiento dice que un envío que falla vuelve a quedar pendiente (WR-02, D-63.7)", () => {
    expect(conocimiento).toContain("vuelve a quedar pendiente");
    expect(conocimiento).toContain("no lo reintentes en ese turno");
  });
});
