import { describe, expect, test } from "bun:test";
import type { AlmacenSesiones } from "@/application/types/puertos-agente.type.ts";
import { createMemorySessionStore } from "@/infra/sessions/memory-session-store.adapter.ts";

type SesionPrueba = { readonly id: string; readonly turnos: number };

const TTL_MS = 1_000;
const PLAZO_MS = 500;
const PLAZO_LARGO_MS = 3 * TTL_MS;
const CANDADO_AJENO = "candado-ajeno";

type Banco = {
  readonly almacen: AlmacenSesiones<SesionPrueba>;
  avanzar(ms: number): void;
};

function crearBanco(maxSessions = 10): Banco {
  let ahora = 0;
  let contador = 0;
  const almacen = createMemorySessionStore<SesionPrueba>({
    create: (id) => ({ id, turnos: 0 }),
    newId: () => {
      contador += 1;
      return `sesion-${contador}`;
    },
    ttlMs: TTL_MS,
    maxSessions,
    now: () => ahora,
  });
  return {
    almacen,
    avanzar: (ms) => {
      ahora += ms;
    },
  };
}

function tomar(almacen: AlmacenSesiones<SesionPrueba>, id: string, plazoMs = PLAZO_MS): string {
  const candado = almacen.ocupar(id, plazoMs);
  if (typeof candado !== "string" || candado === "") throw new Error("se esperaba un candado");
  return candado;
}

describe("almacén de sesiones en memoria (D-58)", () => {
  test("abrir(null) crea una sesión nueva que no está expirada", () => {
    const { almacen } = crearBanco();
    const abierta = almacen.abrir(null);
    expect(abierta).toEqual({ sesion: { id: "sesion-1", turnos: 0 }, nueva: true, expirada: false });
  });

  test("abrir un id vivo devuelve la misma sesión y renueva su actividad", () => {
    const { almacen, avanzar } = crearBanco();
    const { sesion } = almacen.abrir(null);
    avanzar(TTL_MS - 1);
    const reabierta = almacen.abrir(sesion.id);
    expect(reabierta.sesion).toBe(sesion);
    expect(reabierta).toMatchObject({ nueva: false, expirada: false });
    avanzar(TTL_MS - 1);
    expect(almacen.abrir(sesion.id)).toMatchObject({ nueva: false, expirada: false });
  });

  test("un id desconocido da una sesión nueva con otro id y expirada true", () => {
    const { almacen } = crearBanco();
    const abierta = almacen.abrir("desconocida");
    expect(abierta.sesion.id).not.toBe("desconocida");
    expect(abierta).toMatchObject({ nueva: true, expirada: true });
  });

  test("un id mal formado nunca se adopta", () => {
    const { almacen } = crearBanco();
    for (const malo of ["", "con espacio", "../salir", "x".repeat(500), "sesion-1;drop"]) {
      const abierta = almacen.abrir(malo);
      expect(abierta.sesion.id).not.toBe(malo);
      expect(abierta).toMatchObject({ nueva: true, expirada: true });
    }
  });

  test("un id inactivo más que el TTL expira, se borra y da una sesión nueva", () => {
    const { almacen, avanzar } = crearBanco();
    const { sesion } = almacen.abrir(null);
    const candado = tomar(almacen, sesion.id);
    expect(almacen.guardar({ ...sesion, turnos: 3 }, candado)).toBe(true);
    almacen.liberar(sesion.id, candado);
    avanzar(TTL_MS + 1);
    const abierta = almacen.abrir(sesion.id);
    expect(abierta.sesion.id).not.toBe(sesion.id);
    expect(abierta).toMatchObject({ nueva: true, expirada: true });
    expect(abierta.sesion.turnos).toBe(0);
    expect(almacen.ocupar(sesion.id, PLAZO_MS)).toBeNull();
  });

  test("guardar con el candado conserva la sesión y renueva su actividad", () => {
    const { almacen, avanzar } = crearBanco();
    const { sesion } = almacen.abrir(null);
    const candado = tomar(almacen, sesion.id);
    avanzar(TTL_MS - 1);
    expect(almacen.guardar({ ...sesion, turnos: 1 }, candado)).toBe(true);
    almacen.liberar(sesion.id, candado);
    avanzar(TTL_MS - 1);
    const reabierta = almacen.abrir(sesion.id);
    expect(reabierta).toMatchObject({ nueva: false, sesion: { id: sesion.id, turnos: 1 } });
  });

  test("al pasar el máximo se desaloja la menos usada y nunca una ocupada", () => {
    const { almacen } = crearBanco(2);
    const primera = almacen.abrir(null).sesion;
    const segunda = almacen.abrir(null).sesion;
    tomar(almacen, primera.id);
    const tercera = almacen.abrir(null).sesion;
    expect(almacen.abrir(primera.id)).toMatchObject({ nueva: false });
    expect(almacen.abrir(segunda.id)).toMatchObject({ nueva: true, expirada: true });
    expect(almacen.abrir(tercera.id).nueva).toBe(true);
  });

  test("el uso reciente decide quién se desaloja", () => {
    const { almacen } = crearBanco(2);
    const primera = almacen.abrir(null).sesion;
    const segunda = almacen.abrir(null).sesion;
    almacen.abrir(primera.id);
    almacen.abrir(null);
    expect(almacen.abrir(primera.id)).toMatchObject({ nueva: false });
    expect(almacen.abrir(segunda.id)).toMatchObject({ nueva: true });
  });

  test("ocupar da un candado una vez y null hasta liberar; un id desconocido no se ocupa", () => {
    const { almacen } = crearBanco();
    const { sesion } = almacen.abrir(null);
    const candado = tomar(almacen, sesion.id);
    expect(almacen.ocupar(sesion.id, PLAZO_MS)).toBeNull();
    almacen.liberar(sesion.id, candado);
    expect(tomar(almacen, sesion.id)).not.toBe(candado);
    expect(almacen.ocupar("desconocida", PLAZO_MS)).toBeNull();
    almacen.liberar("desconocida", candado);
  });

  test("liberar con otro candado no suelta la sesión", () => {
    const { almacen } = crearBanco();
    const { sesion } = almacen.abrir(null);
    tomar(almacen, sesion.id);
    almacen.liberar(sesion.id, CANDADO_AJENO);
    expect(almacen.ocupar(sesion.id, PLAZO_MS)).toBeNull();
  });

  test("guardar una sesión ocupada no la libera", () => {
    const { almacen } = crearBanco();
    const { sesion } = almacen.abrir(null);
    const candado = tomar(almacen, sesion.id);
    expect(almacen.guardar({ ...sesion, turnos: 1 }, candado)).toBe(true);
    expect(almacen.ocupar(sesion.id, PLAZO_MS)).toBeNull();
  });

  test("guardar sin candado vigente devuelve false y no guarda nada", () => {
    const { almacen } = crearBanco();
    const { sesion } = almacen.abrir(null);
    expect(almacen.guardar({ ...sesion, turnos: 1 }, CANDADO_AJENO)).toBe(false);
    expect(almacen.guardar({ id: "sesion-99", turnos: 1 }, CANDADO_AJENO)).toBe(false);
    expect(almacen.abrir(sesion.id).sesion).toBe(sesion);
    expect(almacen.ocupar("sesion-99", PLAZO_MS)).toBeNull();
  });

  test("abrir y guardar barren las expiradas sin temporizadores", () => {
    const { almacen, avanzar } = crearBanco();
    const vieja = almacen.abrir(null).sesion;
    const otraVieja = almacen.abrir(null).sesion;
    avanzar(TTL_MS + 1);
    const nueva = almacen.abrir(null).sesion;
    expect(almacen.ocupar(vieja.id, PLAZO_MS)).toBeNull();
    expect(almacen.ocupar(otraVieja.id, PLAZO_MS)).toBeNull();
    const activa = almacen.abrir(null).sesion;
    const candado = tomar(almacen, activa.id, PLAZO_LARGO_MS);
    avanzar(TTL_MS + 1);
    expect(almacen.guardar({ ...activa, turnos: 1 }, candado)).toBe(true);
    expect(almacen.ocupar(nueva.id, PLAZO_MS)).toBeNull();
    expect(almacen.abrir(activa.id)).toMatchObject({ nueva: false, sesion: { turnos: 1 } });
  });

  test("cada almacén es independiente", () => {
    const a = crearBanco();
    const b = crearBanco();
    const { sesion } = a.almacen.abrir(null);
    expect(b.almacen.ocupar(sesion.id, PLAZO_MS)).toBeNull();
    expect(b.almacen.abrir(sesion.id)).toMatchObject({ nueva: true });
  });
});

describe("el candado de sesión es un plazo con ficha (AGT-04, WR-03)", () => {
  test("un candado vence al pasar su plazo y se retoma con otra ficha", () => {
    const { almacen, avanzar } = crearBanco();
    const { sesion } = almacen.abrir(null);
    const viejo = tomar(almacen, sesion.id);
    avanzar(PLAZO_MS);
    expect(almacen.ocupar(sesion.id, PLAZO_MS)).toBeNull();
    avanzar(1);
    expect(almacen.abrir(sesion.id)).toMatchObject({ nueva: false, expirada: false });
    const nuevo = tomar(almacen, sesion.id);
    expect(nuevo).not.toBe(viejo);
  });

  test("el titular vencido no puede liberar el candado del nuevo titular", () => {
    const { almacen, avanzar } = crearBanco();
    const { sesion } = almacen.abrir(null);
    const viejo = tomar(almacen, sesion.id);
    avanzar(PLAZO_MS + 1);
    tomar(almacen, sesion.id);
    almacen.liberar(sesion.id, viejo);
    expect(almacen.ocupar(sesion.id, PLAZO_MS)).toBeNull();
  });

  test("el titular vencido no puede pisar la sesión; el nuevo titular sí guarda", () => {
    const { almacen, avanzar } = crearBanco();
    const { sesion } = almacen.abrir(null);
    const viejo = tomar(almacen, sesion.id);
    avanzar(PLAZO_MS + 1);
    const nuevo = tomar(almacen, sesion.id);
    expect(almacen.guardar({ ...sesion, turnos: 7 }, viejo)).toBe(false);
    expect(almacen.abrir(sesion.id).sesion).toBe(sesion);
    expect(almacen.guardar({ ...sesion, turnos: 2 }, nuevo)).toBe(true);
    expect(almacen.abrir(sesion.id).sesion.turnos).toBe(2);
    almacen.liberar(sesion.id, nuevo);
    expect(tomar(almacen, sesion.id)).not.toBe(nuevo);
  });

  test("un candado vigente no se barre por TTL; uno vencido ya no protege la sesión", () => {
    const { almacen, avanzar } = crearBanco();
    const { sesion } = almacen.abrir(null);
    tomar(almacen, sesion.id, PLAZO_LARGO_MS);
    avanzar(TTL_MS + 1);
    almacen.abrir(null);
    expect(almacen.abrir(sesion.id)).toMatchObject({ nueva: false, expirada: false });
    avanzar(PLAZO_LARGO_MS);
    expect(almacen.abrir(sesion.id)).toMatchObject({ nueva: true, expirada: true });
  });

  test("un candado vencido ya no impide el desalojo por capacidad", () => {
    const { almacen, avanzar } = crearBanco(2);
    const primera = almacen.abrir(null).sesion;
    tomar(almacen, primera.id);
    const segunda = almacen.abrir(null).sesion;
    avanzar(PLAZO_MS + 1);
    almacen.abrir(null);
    expect(almacen.ocupar(primera.id, PLAZO_MS)).toBeNull();
    expect(almacen.abrir(segunda.id)).toMatchObject({ nueva: false });
    expect(almacen.abrir(primera.id)).toMatchObject({ nueva: true, expirada: true });
  });
});
