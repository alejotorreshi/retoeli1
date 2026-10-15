import type { AlmacenSesiones, SesionAbierta } from "@/application/types/puertos-agente.type.ts";
import { PATRON_SESION } from "@/config/constants/patterns.constants.ts";
import type { SessionStoreOptions } from "@/infra/types/session-store.type.ts";

type Lock = { readonly token: string; readonly since: number; readonly leaseMs: number };

type Entry<S> = { session: S; lastActivity: number; lock: Lock | null };

export function createMemorySessionStore<S extends { readonly id: string }>(
  options: SessionStoreOptions<S>,
): AlmacenSesiones<S> {
  const entries = new Map<string, Entry<S>>();

  function isHeld(entry: Entry<S>, now: number): boolean {
    return entry.lock !== null && now - entry.lock.since <= entry.lock.leaseMs;
  }

  function isExpired(entry: Entry<S>, now: number): boolean {
    return !isHeld(entry, now) && now - entry.lastActivity > options.ttlMs;
  }

  function sweep(now: number): void {
    for (const [id, entry] of entries) {
      if (isExpired(entry, now)) entries.delete(id);
    }
  }

  function evictBeyondCapacity(keep: string, now: number): void {
    for (const [id, entry] of entries) {
      if (entries.size <= options.maxSessions) return;
      if (id !== keep && !isHeld(entry, now)) entries.delete(id);
    }
  }

  function store(session: S, now: number, lock: Lock | null): void {
    entries.delete(session.id);
    entries.set(session.id, { session, lastActivity: now, lock });
    evictBeyondCapacity(session.id, now);
  }

  function openNew(now: number, expirada: boolean): SesionAbierta<S> {
    const session = options.create(options.newId());
    store(session, now, null);
    return { sesion: session, nueva: true, expirada };
  }

  return {
    abrir(id) {
      const now = options.now();
      sweep(now);
      if (id === null) return openNew(now, false);
      const entry = PATRON_SESION.test(id) ? entries.get(id) : undefined;
      if (entry === undefined) return openNew(now, true);
      store(entry.session, now, entry.lock);
      return { sesion: entry.session, nueva: false, expirada: false };
    },
    leer(id) {
      const now = options.now();
      sweep(now);
      const entry = PATRON_SESION.test(id) ? entries.get(id) : undefined;
      if (entry === undefined) return null;
      return { sesion: entry.session, ocupada: isHeld(entry, now) };
    },
    ocupar(id, plazoMs) {
      const now = options.now();
      const entry = entries.get(id);
      if (entry === undefined || isHeld(entry, now)) return null;
      const token = options.newId();
      entry.lock = { token, since: now, leaseMs: plazoMs };
      return token;
    },
    liberar(id, candado) {
      const entry = entries.get(id);
      if (entry?.lock?.token === candado) entry.lock = null;
    },
    guardar(session, candado) {
      const now = options.now();
      sweep(now);
      const lock = entries.get(session.id)?.lock ?? null;
      if (lock?.token !== candado) return false;
      store(session, now, lock);
      return true;
    },
  };
}
