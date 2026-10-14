import { join } from "node:path";
import { startServer } from "@/http/wiring/server.wiring.ts";

const result = startServer(join(import.meta.dir, ".."));
if (!result.ok) {
  console.error(result.mensaje);
  process.exitCode = 1;
}
