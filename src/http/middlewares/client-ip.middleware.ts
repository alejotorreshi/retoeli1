import type { MiddlewareHandler } from "hono";
import { CABECERA, EVENTO_HTTP } from "@/config/constants/http.constants.ts";
import { clientIpFrom, forwardedEntries } from "@/http/services/client-ip.service.ts";
import type { ClientIpSettings, HttpEnv } from "@/http/types/server.type.ts";

export function resolveClientIp(settings: ClientIpSettings): MiddlewareHandler<HttpEnv> {
  return async (c, next) => {
    const forwardedFor = c.req.header(CABECERA.X_FORWARDED_FOR);
    settings.logger.depurar(EVENTO_HTTP.IP_CLIENTE_RESUELTA, {
      entradasXff: forwardedEntries(forwardedFor).length,
      saltosConfiables: settings.trustedHops,
    });
    const socketAddress = c.env.requestIP(c.req.raw)?.address;
    c.set("clientIp", clientIpFrom({ forwardedFor, socketAddress, trustedHops: settings.trustedHops }));
    return next();
  };
}
