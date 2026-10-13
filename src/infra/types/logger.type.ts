import type { NIVELES_LOG } from "@/config/constants/logging.constants.ts";
import type { ValorDe } from "@/config/types/valor-de.type.ts";

export type LogDestination = { write(line: string): void };

export type LoggerOptions = {
  readonly level: ValorDe<typeof NIVELES_LOG>;
  readonly destination?: LogDestination;
  readonly secrets: readonly string[];
};
