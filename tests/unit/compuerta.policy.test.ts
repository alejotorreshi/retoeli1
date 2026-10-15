import { describe, expect, test } from "bun:test";
import { ACCION, MOTIVO_FIN } from "@/config/constants/agent.constants.ts";
import {
  DECISION_CONFIRMACION,
  DESENLACE_ENVIO,
  ESTADO_COMPUERTA,
  EVENTO_COMPUERTA,
} from "@/config/constants/confirmation.constants.ts";
import { ESTADO_SOPORTE } from "@/config/constants/supports.constants.ts";
import {
  abrirTurno,
  casosPendientes,
  cerrarTurno,
  desenlacesDeEnvio,
  enviadosTrasEventos,
  estadoLibre,
  evaluarEnvio,
  paqueteConocido,
  pendientesDe,
  recuperarAutorizado,
  revocarAlArmar,
} from "@/domain/policies/compuerta.policy.ts";
import type {
  AutorizacionTurno,
  CasoPendiente,
  DesenlaceEnvio,
  EntradaCierreCompuerta,
  EntradaDesenlaces,
  EstadoCompuerta,
  EventoCompuerta,
} from "@/domain/types/compuerta.type.ts";
import type { DecisionConfirmacion } from "@/domain/types/confirmacion.type.ts";

const EC = "ec-corp-andina";
const CO = "co-industrias-delta";

const PENDIENTE_EC: CasoPendiente = {
  caso: EC,
  bloqueos: ["ausente: certificado_cumplimiento_tributario"],
  motivos: [{ tipo: "certificado_cumplimiento_tributario", causa: ESTADO_SOPORTE.AUSENTE }],
};
const PENDIENTE_CO: CasoPendiente = { caso: CO, bloqueos: [], motivos: [] };

function pendiente(...casos: readonly CasoPendiente[]): EstadoCompuerta {
  return { tipo: ESTADO_COMPUERTA.PENDIENTE, accion: ACCION.ENVIO, casos };
}

const LIBRE: EstadoCompuerta = { tipo: ESTADO_COMPUERTA.LIBRE };
const confirma = (caso: string): DecisionConfirmacion => ({ decision: DECISION_CONFIRMACION.CONFIRMA, caso });
const RECHAZA: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.RECHAZA };
const FALTA_CASO: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.FALTA_CASO };
const OTRO: DecisionConfirmacion = { decision: DECISION_CONFIRMACION.OTRO };
const cancelaCaso = (caso: string): DecisionConfirmacion => ({
  decision: DECISION_CONFIRMACION.CANCELA_CASO,
  caso,
});

const armado = (caso: CasoPendiente): EventoCompuerta => ({ tipo: EVENTO_COMPUERTA.ARMADO, pendiente: caso });
const bloqueado = (caso: string): EventoCompuerta => ({ tipo: EVENTO_COMPUERTA.BLOQUEADO, caso });
const enviado = (caso: string): EventoCompuerta => ({ tipo: EVENTO_COMPUERTA.ENVIADO, caso });
const fallido = (caso: string): EventoCompuerta => ({ tipo: EVENTO_COMPUERTA.FALLIDO, caso });
const truncado = (caso: string | null): EventoCompuerta => ({ tipo: EVENTO_COMPUERTA.TRUNCADO, caso });
const truncadoConfirmado = (caso: string): EventoCompuerta => ({
  tipo: EVENTO_COMPUERTA.TRUNCADO_CONFIRMADO,
  caso,
});

function cierre(entrada: Partial<EntradaDesenlaces>): EntradaDesenlaces {
  return {
    arrastrados: [],
    eventos: [],
    conocidos: {},
    enviados: [],
    abortado: false,
    enviosSinCaso: 0,
    ...entrada,
  };
}

describe("estado inicial y casos pendientes", () => {
  test("estadoLibre es LIBRE y no tiene casos pendientes", () => {
    expect(estadoLibre()).toEqual(LIBRE);
    expect(casosPendientes(estadoLibre())).toEqual([]);
  });

  test("casosPendientes lista los casos en su orden", () => {
    expect(casosPendientes(pendiente(PENDIENTE_EC, PENDIENTE_CO))).toEqual([EC, CO]);
  });
});

describe("abrirTurno (D-37, D-40, D-63.3, D-63.6)", () => {
  test.each([confirma(EC), RECHAZA, FALTA_CASO, OTRO, cancelaCaso(EC)])(
    "LIBRE nunca autoriza: %p",
    (decision) => {
      expect(abrirTurno(LIBRE, decision)).toEqual({ autorizado: null, siguiente: LIBRE });
    },
  );

  test("PENDIENTE más confirma de un caso pendiente autoriza solo ese caso y vuelve a LIBRE", () => {
    expect(abrirTurno(pendiente(PENDIENTE_EC), confirma(EC))).toEqual({ autorizado: EC, siguiente: LIBRE });
  });

  test("con dos casos, confirma de uno autoriza solo ese y el otro sigue pendiente (D-63.6)", () => {
    expect(abrirTurno(pendiente(PENDIENTE_EC, PENDIENTE_CO), confirma(CO))).toEqual({
      autorizado: CO,
      siguiente: pendiente(PENDIENTE_EC),
    });
  });

  test("falta_caso no autoriza y conserva los mismos casos para preguntar cuál", () => {
    const estado = pendiente(PENDIENTE_EC, PENDIENTE_CO);
    expect(abrirTurno(estado, FALTA_CASO)).toEqual({ autorizado: null, siguiente: estado });
  });

  test.each([pendiente(PENDIENTE_EC), pendiente(PENDIENTE_EC, PENDIENTE_CO)])(
    "rechaza cancela todos los casos pendientes a LIBRE: %p",
    (estado) => {
      expect(abrirTurno(estado, RECHAZA)).toEqual({ autorizado: null, siguiente: LIBRE });
    },
  );

  test.each([pendiente(PENDIENTE_EC), pendiente(PENDIENTE_EC, PENDIENTE_CO)])(
    "otro no autoriza y conserva los casos pendientes (D-63.6): %p",
    (estado) => {
      expect(abrirTurno(estado, OTRO)).toEqual({ autorizado: null, siguiente: estado });
    },
  );

  test("confirma de un caso que no está pendiente no autoriza nada y conserva los pendientes (D-63.6)", () => {
    expect(abrirTurno(pendiente(PENDIENTE_EC), confirma(CO))).toEqual({
      autorizado: null,
      siguiente: pendiente(PENDIENTE_EC),
    });
  });

  test("cancela_caso con dos casos quita solo ese caso y no autoriza nada (D-69)", () => {
    expect(abrirTurno(pendiente(PENDIENTE_EC, PENDIENTE_CO), cancelaCaso(CO))).toEqual({
      autorizado: null,
      siguiente: pendiente(PENDIENTE_EC),
    });
  });

  test("cancela_caso del único caso pendiente vuelve a LIBRE (D-69)", () => {
    expect(abrirTurno(pendiente(PENDIENTE_EC), cancelaCaso(EC))).toEqual({
      autorizado: null,
      siguiente: LIBRE,
    });
  });

  test("cancela_caso de un caso que no está pendiente conserva los pendientes (D-69)", () => {
    expect(abrirTurno(pendiente(PENDIENTE_EC), cancelaCaso(CO))).toEqual({
      autorizado: null,
      siguiente: pendiente(PENDIENTE_EC),
    });
  });
});

describe("evaluarEnvio (D-38)", () => {
  test("permite una sola vez el caso autorizado y marca la autorización como usada", () => {
    const primera = evaluarEnvio({ caso: EC, usada: false }, EC);
    expect(primera).toEqual({ permitido: true, siguiente: { caso: EC, usada: true } });
    const segunda = evaluarEnvio(primera.siguiente, EC);
    expect(segunda.permitido).toBe(false);
    expect(segunda.siguiente).toEqual({ caso: EC, usada: true });
  });

  test("niega otro caso y deja intacta la autorización", () => {
    const autorizacion = { caso: EC, usada: false };
    expect(evaluarEnvio(autorizacion, CO)).toEqual({ permitido: false, siguiente: autorizacion });
  });

  test("sin autorización niega el envío", () => {
    expect(evaluarEnvio({ caso: null, usada: false }, EC).permitido).toBe(false);
  });
});

describe("revocarAlArmar (D-42)", () => {
  test("re-armar el caso autorizado revoca la autorización", () => {
    expect(revocarAlArmar({ caso: EC, usada: false }, EC).caso).toBeNull();
  });

  test("armar otro caso no cambia la autorización", () => {
    const autorizacion = { caso: EC, usada: false };
    expect(revocarAlArmar(autorizacion, CO)).toEqual(autorizacion);
  });
});

describe("cerrarTurno (D-37, D-63.1, D-63.2)", () => {
  test("armado deja el caso pendiente", () => {
    expect(cerrarTurno(cierre({ eventos: [armado(PENDIENTE_EC)] }))).toEqual(pendiente(PENDIENTE_EC));
  });

  test("bloqueado de un caso sin paquete conocido cierra LIBRE", () => {
    expect(cerrarTurno(cierre({ eventos: [bloqueado(EC)] }))).toEqual(LIBRE);
  });

  test("bloqueado de un caso con paquete conocido lo deja pendiente con sus bloqueos conocidos", () => {
    expect(cerrarTurno(cierre({ eventos: [bloqueado(EC)], conocidos: { [EC]: PENDIENTE_EC } }))).toEqual(
      pendiente(PENDIENTE_EC),
    );
  });

  test("un truncado de un caso con paquete conocido lo deja pendiente", () => {
    expect(cerrarTurno(cierre({ eventos: [truncado(EC)], conocidos: { [EC]: PENDIENTE_EC } }))).toEqual(
      pendiente(PENDIENTE_EC),
    );
  });

  test("un truncado y luego el envío del mismo caso cierra LIBRE", () => {
    expect(
      cerrarTurno(cierre({ eventos: [truncado(EC), enviado(EC)], conocidos: { [EC]: PENDIENTE_EC } })),
    ).toEqual(LIBRE);
  });

  test("un truncado sin caso legible cierra LIBRE", () => {
    expect(cerrarTurno(cierre({ eventos: [truncado(null)], conocidos: { [EC]: PENDIENTE_EC } }))).toEqual(
      LIBRE,
    );
  });

  test("un truncado de un caso confirmado con paquete conocido lo deja pendiente (D-76.2)", () => {
    expect(
      cerrarTurno(cierre({ eventos: [truncadoConfirmado(EC)], conocidos: { [EC]: PENDIENTE_EC } })),
    ).toEqual(pendiente(PENDIENTE_EC));
  });

  test("un truncado confirmado y luego el envío del mismo caso cierra LIBRE (D-76.2)", () => {
    expect(
      cerrarTurno(
        cierre({ eventos: [truncadoConfirmado(EC), enviado(EC)], conocidos: { [EC]: PENDIENTE_EC } }),
      ),
    ).toEqual(LIBRE);
  });

  test("un turno abortado con un truncado confirmado cierra LIBRE (D-76.2)", () => {
    expect(
      cerrarTurno(
        cierre({ eventos: [truncadoConfirmado(EC)], conocidos: { [EC]: PENDIENTE_EC }, abortado: true }),
      ),
    ).toEqual(LIBRE);
  });

  test("un turno abortado con un truncado cierra LIBRE", () => {
    expect(
      cerrarTurno(cierre({ eventos: [truncado(EC)], conocidos: { [EC]: PENDIENTE_EC }, abortado: true })),
    ).toEqual(LIBRE);
  });

  test("armado y luego enviado cierra LIBRE", () => {
    expect(cerrarTurno(cierre({ eventos: [armado(PENDIENTE_EC), enviado(EC)] }))).toEqual(LIBRE);
  });

  test("enviado y luego armado deja el caso pendiente", () => {
    expect(cerrarTurno(cierre({ eventos: [enviado(EC), armado(PENDIENTE_EC)] }))).toEqual(
      pendiente(PENDIENTE_EC),
    );
  });

  test("los casos arrastrados sin eventos siguen pendientes en su orden", () => {
    expect(cerrarTurno(cierre({ arrastrados: [PENDIENTE_EC, PENDIENTE_CO] }))).toEqual(
      pendiente(PENDIENTE_EC, PENDIENTE_CO),
    );
  });

  test("re-armar un caso arrastrado conserva el primer orden y toma los bloqueos nuevos", () => {
    const reArmado: CasoPendiente = { caso: EC, bloqueos: [], motivos: [] };
    expect(
      cerrarTurno(cierre({ arrastrados: [PENDIENTE_EC, PENDIENTE_CO], eventos: [armado(reArmado)] })),
    ).toEqual(pendiente(reArmado, PENDIENTE_CO));
  });

  test("un turno abortado cierra LIBRE", () => {
    expect(cerrarTurno(cierre({ eventos: [armado(PENDIENTE_EC)], abortado: true }))).toEqual(LIBRE);
  });
});

describe("cerrarTurno con casos ya enviados (G-02-3, D-63.4)", () => {
  test("un reintento bloqueado en el mismo turno del envío no reabre el caso", () => {
    expect(
      cerrarTurno(cierre({ eventos: [enviado(EC), bloqueado(EC)], conocidos: { [EC]: PENDIENTE_EC } })),
    ).toEqual(LIBRE);
  });

  test("un reintento bloqueado en un turno posterior no reabre un caso ya enviado", () => {
    expect(
      cerrarTurno(cierre({ eventos: [bloqueado(EC)], conocidos: { [EC]: PENDIENTE_EC }, enviados: [EC] })),
    ).toEqual(LIBRE);
  });

  test("un armado nuevo y luego un bloqueado abren otro ciclo", () => {
    expect(cerrarTurno(cierre({ eventos: [armado(PENDIENTE_EC), bloqueado(EC)], enviados: [EC] }))).toEqual(
      pendiente(PENDIENTE_EC),
    );
  });

  test("un bloqueado y luego un armado nuevo abren otro ciclo", () => {
    expect(cerrarTurno(cierre({ eventos: [bloqueado(EC), armado(PENDIENTE_EC)], enviados: [EC] }))).toEqual(
      pendiente(PENDIENTE_EC),
    );
  });

  test("un caso conocido que nunca se envió sigue reabriéndose (D-63.1)", () => {
    expect(
      cerrarTurno(
        cierre({
          eventos: [bloqueado(EC), bloqueado(CO)],
          conocidos: { [EC]: PENDIENTE_EC, [CO]: PENDIENTE_CO },
          enviados: [EC],
        }),
      ),
    ).toEqual(pendiente(PENDIENTE_CO));
  });
});

describe("cerrarTurno con un envío autorizado que falla (WR-02, D-63.7)", () => {
  const CONOCIDOS = { [EC]: PENDIENTE_EC };
  const reArmado: CasoPendiente = { caso: EC, bloqueos: [], motivos: [] };
  const filas: readonly (readonly [string, Partial<EntradaCierreCompuerta>, EstadoCompuerta])[] = [
    [
      "un envío fallido de un caso con paquete conocido lo deja pendiente con sus bloqueos conocidos",
      { eventos: [fallido(EC)], conocidos: CONOCIDOS },
      pendiente(PENDIENTE_EC),
    ],
    ["un envío fallido de un caso sin paquete conocido cierra LIBRE", { eventos: [fallido(EC)] }, LIBRE],
    [
      "un envío fallido y un re-armado en el mismo turno dejan los bloqueos nuevos",
      { eventos: [fallido(EC), armado(reArmado)], conocidos: CONOCIDOS },
      pendiente(reArmado),
    ],
    [
      "un envío fallido conserva los otros casos arrastrados",
      { arrastrados: [PENDIENTE_CO], eventos: [fallido(EC)], conocidos: CONOCIDOS },
      pendiente(PENDIENTE_CO, PENDIENTE_EC),
    ],
    [
      "un aborto del llamante cierra LIBRE aunque el envío haya fallado",
      { eventos: [fallido(EC)], conocidos: CONOCIDOS, abortado: true },
      LIBRE,
    ],
    [
      "un envío fallido de un caso ya enviado no lo reabre",
      { eventos: [fallido(EC)], conocidos: CONOCIDOS, enviados: [EC] },
      LIBRE,
    ],
  ];

  for (const [nombre, entrada, esperado] of filas) {
    test(nombre, () => {
      expect(cerrarTurno(cierre(entrada))).toEqual(esperado);
    });
  }

  test("un envío fallido nunca marca el caso como enviado ni borra una marca previa", () => {
    expect(enviadosTrasEventos([], [fallido(EC)])).toEqual([]);
    expect(enviadosTrasEventos([EC], [fallido(EC)])).toEqual([EC]);
  });

  test("la autorización usada en el envío fallido no se recupera (D-38)", () => {
    expect(recuperarAutorizado(MOTIVO_FIN.ERROR, { caso: EC, usada: true }, CONOCIDOS)).toEqual([]);
  });
});

describe("enviadosTrasEventos (G-02-3, D-63.4)", () => {
  test.each([
    ["un envío registra el caso", [], [enviado(EC)], [EC]],
    ["un segundo envío del mismo caso no lo duplica", [EC], [enviado(EC)], [EC]],
    ["un armado nuevo borra la marca de enviado", [EC], [armado(PENDIENTE_EC)], []],
    ["un bloqueado no cambia los enviados", [EC], [bloqueado(EC)], [EC]],
    [
      "enviado y luego armado en el mismo turno deja el caso sin marca",
      [],
      [enviado(EC), armado(PENDIENTE_EC)],
      [],
    ],
    ["armar otro caso no toca la marca", [EC], [armado(PENDIENTE_CO)], [EC]],
    ["armar un caso solo borra la marca de ese caso", [EC, CO], [armado(PENDIENTE_EC)], [CO]],
    ["conserva el orden del primer envío", [], [enviado(CO), enviado(EC), enviado(CO)], [CO, EC]],
    ["un truncado de un caso legible no cambia los enviados", [EC], [truncado(EC)], [EC]],
    ["un truncado sin caso legible no cambia los enviados", [], [truncado(null)], []],
    [
      "un truncado confirmado no cambia los enviados",
      [EC],
      [truncadoConfirmado(EC), truncadoConfirmado(CO)],
      [EC],
    ],
  ] as const)("%s", (_nombre, enviados, eventos, esperado) => {
    expect(enviadosTrasEventos(enviados, eventos)).toEqual(esperado);
  });

  test("no muta los casos enviados que recibe", () => {
    const enviados = [EC];
    enviadosTrasEventos(enviados, [armado(PENDIENTE_EC), enviado(CO)]);
    expect(enviados).toEqual([EC]);
  });
});

describe("recuperarAutorizado (WR-02, D-63.2, D-63.6, D-38)", () => {
  const VIGENTE: AutorizacionTurno = { caso: EC, usada: false };
  const CONOCIDOS = { [EC]: PENDIENTE_EC };
  const filas: readonly (readonly [
    string,
    Parameters<typeof recuperarAutorizado>,
    readonly CasoPendiente[],
  ])[] = [
    [
      "un error del turno devuelve el caso autorizado a pendiente",
      [MOTIVO_FIN.ERROR, VIGENTE, CONOCIDOS],
      [PENDIENTE_EC],
    ],
    [
      "el tope de tokens devuelve el caso autorizado a pendiente",
      [MOTIVO_FIN.TOPE_TOKENS, VIGENTE, CONOCIDOS],
      [PENDIENTE_EC],
    ],
    [
      "el tope de iteraciones devuelve el caso autorizado a pendiente",
      [MOTIVO_FIN.TOPE_ITERACIONES, VIGENTE, CONOCIDOS],
      [PENDIENTE_EC],
    ],
    [
      "con otros paquetes conocidos devuelve solo el autorizado",
      [MOTIVO_FIN.ERROR, VIGENTE, { [CO]: PENDIENTE_CO, [EC]: PENDIENTE_EC }],
      [PENDIENTE_EC],
    ],
    [
      "un cierre final sin usar la autorización devuelve el caso a pendiente (D-63.6)",
      [MOTIVO_FIN.FINAL, VIGENTE, CONOCIDOS],
      [PENDIENTE_EC],
    ],
    [
      "un cierre final con la autorización ya usada no recupera nada",
      [MOTIVO_FIN.FINAL, { caso: EC, usada: true }, CONOCIDOS],
      [],
    ],
    [
      "un cierre final con la autorización revocada al re-armar no recupera nada (D-42)",
      [MOTIVO_FIN.FINAL, { caso: null, usada: false }, CONOCIDOS],
      [],
    ],
    ["un aborto del llamante no recupera nada", [MOTIVO_FIN.ABORTADO, VIGENTE, CONOCIDOS], []],
    [
      "una autorización revocada al re-armar no se recupera (D-42)",
      [MOTIVO_FIN.ERROR, { caso: null, usada: false }, CONOCIDOS],
      [],
    ],
    [
      "una autorización ya usada no se recupera",
      [MOTIVO_FIN.ERROR, { caso: EC, usada: true }, CONOCIDOS],
      [],
    ],
    [
      "un caso que no es un paquete conocido no se recupera",
      [MOTIVO_FIN.ERROR, VIGENTE, { [CO]: PENDIENTE_CO }],
      [],
    ],
    [
      "una clave heredada como toString no se recupera",
      [MOTIVO_FIN.ERROR, { caso: "toString", usada: false }, {}],
      [],
    ],
  ];

  for (const [nombre, argumentos, esperado] of filas) {
    test(nombre, () => {
      expect(recuperarAutorizado(...argumentos)).toEqual(esperado);
    });
  }
});

describe("lectura del estado y de los paquetes conocidos", () => {
  test("pendientesDe devuelve los casos pendientes o ninguno si la compuerta está libre", () => {
    expect(pendientesDe(pendiente(PENDIENTE_EC, PENDIENTE_CO))).toEqual([PENDIENTE_EC, PENDIENTE_CO]);
    expect(pendientesDe(estadoLibre())).toEqual([]);
  });

  test("paqueteConocido solo mira claves propias", () => {
    const conocidos = { [EC]: PENDIENTE_EC };
    expect(paqueteConocido(conocidos, EC)).toEqual(PENDIENTE_EC);
    expect(paqueteConocido(conocidos, CO)).toBeUndefined();
    expect(paqueteConocido(conocidos, "toString")).toBeUndefined();
  });
});

describe("desenlacesDeEnvio (G-03-26, D-44, D-63.4, D-63.7)", () => {
  const CONOCIDOS = { [EC]: PENDIENTE_EC };
  const desenlace = (
    tipo: Exclude<DesenlaceEnvio["tipo"], typeof DESENLACE_ENVIO.SIN_CASO>,
    caso: string,
  ): DesenlaceEnvio => ({ tipo, caso });
  const SIN_CASO: DesenlaceEnvio = { tipo: DESENLACE_ENVIO.SIN_CASO, caso: null };
  const filas: readonly (readonly [string, Partial<EntradaDesenlaces>, readonly DesenlaceEnvio[]])[] = [
    [
      "un bloqueado de un caso ya enviado en la sesión da YA_ENVIADO",
      { eventos: [bloqueado(EC)], conocidos: CONOCIDOS, enviados: [EC] },
      [desenlace(DESENLACE_ENVIO.YA_ENVIADO, EC)],
    ],
    [
      "un bloqueado tras el envío del mismo turno da YA_ENVIADO",
      { eventos: [enviado(EC), bloqueado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.YA_ENVIADO, EC)],
    ],
    [
      "un bloqueado de un caso con paquete conocido da REQUIERE_CONFIRMACION",
      { eventos: [bloqueado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC)],
    ],
    [
      "un bloqueado de un caso arrastrado da REQUIERE_CONFIRMACION",
      { arrastrados: [PENDIENTE_CO], eventos: [bloqueado(CO)] },
      [desenlace(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, CO)],
    ],
    [
      "un bloqueado tras armar en el mismo turno da REQUIERE_CONFIRMACION",
      { eventos: [armado(PENDIENTE_EC), bloqueado(EC)] },
      [desenlace(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC)],
    ],
    [
      "un bloqueado de un caso desconocido da SIN_PAQUETE",
      { eventos: [bloqueado(CO)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.SIN_PAQUETE, CO)],
    ],
    [
      "un envío fallido da FALLIDO",
      { eventos: [fallido(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.FALLIDO, EC)],
    ],
    ["un envío exitoso no da desenlace", { eventos: [enviado(EC)], conocidos: CONOCIDOS }, []],
    ["un armado no da desenlace", { eventos: [armado(PENDIENTE_EC)] }, []],
    [
      "un armado posterior a un envío del mismo caso hace que el bloqueado siguiente pida confirmación",
      { eventos: [enviado(EC), armado(PENDIENTE_EC), bloqueado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC)],
    ],
    [
      "los desenlaces salen en el orden de los eventos",
      { eventos: [bloqueado(CO), enviado(EC), bloqueado(EC), fallido(CO)], conocidos: CONOCIDOS },
      [
        desenlace(DESENLACE_ENVIO.SIN_PAQUETE, CO),
        desenlace(DESENLACE_ENVIO.YA_ENVIADO, EC),
        desenlace(DESENLACE_ENVIO.FALLIDO, CO),
      ],
    ],
    [
      "un turno abortado no da desenlaces",
      { eventos: [bloqueado(CO), fallido(EC)], conocidos: CONOCIDOS, abortado: true },
      [],
    ],
    [
      "sin envíos sin caso los desenlaces son los de los casos legibles",
      { eventos: [bloqueado(CO)], conocidos: CONOCIDOS, enviosSinCaso: 0 },
      [desenlace(DESENLACE_ENVIO.SIN_PAQUETE, CO)],
    ],
    ["un envío sin caso legible da SIN_CASO", { enviosSinCaso: 1 }, [SIN_CASO]],
    [
      "dos envíos sin caso legible dan un solo SIN_CASO, después de los casos legibles",
      { eventos: [bloqueado(CO), fallido(EC)], conocidos: CONOCIDOS, enviosSinCaso: 2 },
      [desenlace(DESENLACE_ENVIO.SIN_PAQUETE, CO), desenlace(DESENLACE_ENVIO.FALLIDO, EC), SIN_CASO],
    ],
    ["un turno abortado no da SIN_CASO", { enviosSinCaso: 2, abortado: true }, []],
    [
      "un truncado de un caso con paquete conocido da REQUIERE_CONFIRMACION",
      { eventos: [truncado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC)],
    ],
    [
      "un truncado de un caso desconocido da SIN_PAQUETE",
      { eventos: [truncado(CO)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.SIN_PAQUETE, CO)],
    ],
    [
      "un truncado de un caso ya enviado en la sesión da YA_ENVIADO",
      { eventos: [truncado(EC)], conocidos: CONOCIDOS, enviados: [EC] },
      [desenlace(DESENLACE_ENVIO.YA_ENVIADO, EC)],
    ],
    [
      "un truncado tras el envío del mismo turno da YA_ENVIADO",
      { eventos: [enviado(EC), truncado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.YA_ENVIADO, EC)],
    ],
    ["un truncado sin caso legible da SIN_CASO", { eventos: [truncado(null)] }, [SIN_CASO]],
    [
      "un truncado sin caso legible y un envío sin caso dan un solo SIN_CASO",
      { eventos: [truncado(null)], enviosSinCaso: 1 },
      [SIN_CASO],
    ],
    [
      "un reintento enviado del mismo caso manda sobre su truncado",
      { eventos: [truncado(EC), enviado(EC)], conocidos: CONOCIDOS },
      [],
    ],
    [
      "dos truncados del mismo caso dan un solo REQUIERE_CONFIRMACION, el del segundo intento",
      { eventos: [truncado(EC), truncado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC)],
    ],
    [
      "un reintento bloqueado del mismo caso da su propio desenlace y no el del truncado",
      { eventos: [truncado(EC), bloqueado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC)],
    ],
    [
      "un intento de otro caso no reemplaza el aviso del truncado",
      { eventos: [truncado(EC), enviado(CO)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC)],
    ],
    [
      "ningún intento posterior suprime el SIN_CASO de un truncado sin caso legible (D-76.1)",
      { eventos: [truncado(null), enviado(EC)], conocidos: CONOCIDOS },
      [SIN_CASO],
    ],
    [
      "el SIN_CASO de un truncado sin caso legible va después de los avisos de los casos legibles",
      { eventos: [truncado(null), bloqueado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC), SIN_CASO],
    ],
    [
      "dos truncados sin caso legible y un envío sin caso dan un solo SIN_CASO",
      { eventos: [truncado(null), truncado(null)], enviosSinCaso: 1 },
      [SIN_CASO],
    ],
    [
      "un turno abortado con truncados no da desenlaces",
      { eventos: [truncado(EC), truncado(null)], conocidos: CONOCIDOS, abortado: true },
      [],
    ],
    [
      "un truncado de un caso confirmado da TRUNCADO_CONFIRMADO (D-76.2)",
      { eventos: [truncadoConfirmado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.TRUNCADO_CONFIRMADO, EC)],
    ],
    [
      "un truncado confirmado de un caso ya enviado en la sesión da YA_ENVIADO",
      { eventos: [truncadoConfirmado(EC)], conocidos: CONOCIDOS, enviados: [EC] },
      [desenlace(DESENLACE_ENVIO.YA_ENVIADO, EC)],
    ],
    [
      "un truncado confirmado tras el envío del mismo turno da YA_ENVIADO",
      { eventos: [enviado(EC), truncadoConfirmado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.YA_ENVIADO, EC)],
    ],
    [
      "un truncado confirmado de un caso desconocido da SIN_PAQUETE",
      { eventos: [truncadoConfirmado(CO)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.SIN_PAQUETE, CO)],
    ],
    [
      "un reintento enviado del mismo caso manda sobre su truncado confirmado",
      { eventos: [truncadoConfirmado(EC), enviado(EC)], conocidos: CONOCIDOS },
      [],
    ],
    [
      "un reintento bloqueado del mismo caso da su propio desenlace y no el del truncado confirmado",
      { eventos: [truncadoConfirmado(EC), bloqueado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.REQUIERE_CONFIRMACION, EC)],
    ],
    [
      "dos truncados confirmados del mismo caso dan un solo TRUNCADO_CONFIRMADO",
      { eventos: [truncadoConfirmado(EC), truncadoConfirmado(EC)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.TRUNCADO_CONFIRMADO, EC)],
    ],
    [
      "un intento de otro caso no reemplaza el aviso del truncado confirmado",
      { eventos: [truncadoConfirmado(EC), enviado(CO)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.TRUNCADO_CONFIRMADO, EC)],
    ],
    [
      "un truncado confirmado y un truncado sin caso legible dan su aviso y después un SIN_CASO",
      { eventos: [truncadoConfirmado(EC), truncado(null)], conocidos: CONOCIDOS },
      [desenlace(DESENLACE_ENVIO.TRUNCADO_CONFIRMADO, EC), SIN_CASO],
    ],
    [
      "un turno abortado con un truncado confirmado no da desenlaces",
      { eventos: [truncadoConfirmado(EC), truncado(null)], conocidos: CONOCIDOS, abortado: true },
      [],
    ],
  ];

  for (const [nombre, entrada, esperado] of filas) {
    test(nombre, () => {
      expect(desenlacesDeEnvio(cierre(entrada))).toEqual(esperado);
    });
  }
});
