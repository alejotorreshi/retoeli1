export type SessionStoreOptions<S> = {
  create(id: string): S;
  newId(): string;
  readonly ttlMs: number;
  readonly maxSessions: number;
  now(): number;
};
