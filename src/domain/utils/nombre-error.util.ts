export function nombreDeError(error: unknown): string {
  return error instanceof Error ? error.name : typeof error;
}
