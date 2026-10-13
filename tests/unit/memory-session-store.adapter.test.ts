import { describe, expect, test } from "bun:test";
import type { AlmacenSesiones } from "@/application/types/puertos-agente.type.ts";
import { createMemorySessionStore } from "@/infra/sessions/memory-session-store.adapter.ts";

type SesionPrueba = { readonly id: string; readonly turnos: number };

const TTL_MS = 1_000;

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
    almacen.guardar({ ...sesion, turnos: 3 });
    avanzar(TTL_MS + 1);
    const abierta = almacen.abrir(sesion.id);
    expect(abierta.sesion.id).not.toBe(sesion.id);
    expect(abierta).toMatchObject({ nueva: true, expirada: true });
    expect(abierta.sesion.turnos).toBe(0);
    expect(almacen.ocupar(sesion.id)).toBe(false);
  });

  test("guardar conserva la sesión y renueva su actividad", () => {
    const { almacen, avanzar } = crearBanco();
    const { sesion } = almacen.abrir(null);
    avanzar(TTL_MS - 1);
    almacen.guardar({ ...sesion, turnos: 1 });
    avanzar(TTL_MS - 1);
    const reabierta = almacen.abrir(sesion.id);
    expect(reabierta).toMatchObject({ nueva: false, sesion: { id: sesion.id, turnos: 1 } });
  });

  test("al pasar el máximo se desaloja la menos usada y nunca una ocupada", () => {
    const { almacen } = crearBanco(2);
    const primera = almacen.abrir(null).sesion;
    const segunda = almacen.abrir(null).sesion;
    expect(almacen.ocupar(primera.id)).toBe(true);
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

  test("ocupar da true una vez y false hasta liberar; un id desconocido no se ocupa", () => {
    const { almacen } = crearBanco();
    const { sesion } = almacen.abrir(null);
    expect(almacen.ocupar(sesion.id)).toBe(true);
    expect(almacen.ocupar(sesion.id)).toBe(false);
    almacen.liberar(sesion.id);
    expect(almacen.ocupar(sesion.id)).toBe(true);
    expect(almacen.ocupar("desconocida")).toBe(false);
    almacen.liberar("desconocida");
  });

  test("guardar una sesión ocupada no la libera", () => {
    const { almacen } = crearBanco();
    const { sesion } = almacen.abrir(null);
    almacen.ocupar(sesion.id);
    almacen.guardar({ ...sesion, turnos: 1 });
    expect(almacen.ocupar(sesion.id)).toBe(false);
  });

  test("abrir y guardar barren las expiradas sin temporizadores", () => {
    const { almacen, avanzar } = crearBanco();
    const vieja = almacen.abrir(null).sesion;
    const otraVieja = almacen.abrir(null).sesion;
    avanzar(TTL_MS + 1);
    const nueva = almacen.abrir(null).sesion;
    expect(almacen.ocupar(vieja.id)).toBe(false);
    expect(almacen.ocupar(otraVieja.id)).toBe(false);
    avanzar(TTL_MS + 1);
    almacen.guardar({ id: "sesion-99", turnos: 0 });
    expect(almacen.ocupar(nueva.id)).toBe(false);
    expect(almacen.ocupar("sesion-99")).toBe(true);
  });

  test("cada almacén es independiente", () => {
    const a = crearBanco();
    const b = crearBanco();
    const { sesion } = a.almacen.abrir(null);
    expect(b.almacen.ocupar(sesion.id)).toBe(false);
    expect(b.almacen.abrir(sesion.id)).toMatchObject({ nueva: true });
  });
});
