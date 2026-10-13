import type { AlmacenSesiones, SesionAbierta } from "@/application/types/puertos-agente.type.ts";
import { PATRON_SESION } from "@/config/constants/patterns.constants.ts";
import type { SessionStoreOptions } from "@/infra/types/session-store.type.ts";

type Entry<S> = { session: S; lastActivity: number; locked: boolean };

export function createMemorySessionStore<S extends { readonly id: string }>(
  options: SessionStoreOptions<S>,
): AlmacenSesiones<S> {
  const entries = new Map<string, Entry<S>>();

  function isExpired(entry: Entry<S>, now: number): boolean {
    return !entry.locked && now - entry.lastActivity > options.ttlMs;
  }

  function sweep(now: number): void {
    for (const [id, entry] of entries) {
      if (isExpired(entry, now)) entries.delete(id);
    }
  }

  function evictBeyondCapacity(keep: string): void {
    for (const [id, entry] of entries) {
      if (entries.size <= options.maxSessions) return;
      if (id !== keep && !entry.locked) entries.delete(id);
    }
  }

  function store(session: S, now: number, locked: boolean): void {
    entries.delete(session.id);
    entries.set(session.id, { session, lastActivity: now, locked });
    evictBeyondCapacity(session.id);
  }

  function openNew(now: number, expirada: boolean): SesionAbierta<S> {
    const session = options.create(options.newId());
    store(session, now, false);
    return { sesion: session, nueva: true, expirada };
  }

  return {
    abrir(id) {
      const now = options.now();
      sweep(now);
      if (id === null) return openNew(now, false);
      const entry = PATRON_SESION.test(id) ? entries.get(id) : undefined;
      if (entry === undefined) return openNew(now, true);
      store(entry.session, now, entry.locked);
      return { sesion: entry.session, nueva: false, expirada: false };
    },
    guardar(session) {
      const now = options.now();
      sweep(now);
      store(session, now, entries.get(session.id)?.locked ?? false);
    },
    ocupar(id) {
      const entry = entries.get(id);
      if (entry === undefined || entry.locked) return false;
      entry.locked = true;
      return true;
    },
    liberar(id) {
      const entry = entries.get(id);
      if (entry !== undefined) entry.locked = false;
    },
  };
}
