import { describe, expect, test } from "bun:test";
import { clientIpFrom, rateLimitKeyOf } from "@/http/services/client-ip.service.ts";

const SOCKET = "10.0.0.1";
const CLIENTE = "198.51.100.7";
const FALSIFICADA = "203.0.113.9";

describe("clientIpFrom", () => {
  test("con un salto toma la entrada de más a la derecha", () => {
    expect(
      clientIpFrom({ forwardedFor: `${FALSIFICADA}, ${CLIENTE}`, socketAddress: SOCKET, trustedHops: 1 }),
    ).toBe(CLIENTE);
  });

  test("las entradas falsificadas a la izquierda no cambian el resultado", () => {
    expect(
      clientIpFrom({ forwardedFor: `1.2.3.4, 5.6.7.8, ${CLIENTE}`, socketAddress: SOCKET, trustedHops: 1 }),
    ).toBe(CLIENTE);
  });

  test("con dos saltos toma la segunda desde la derecha", () => {
    expect(
      clientIpFrom({ forwardedFor: `${FALSIFICADA}, ${CLIENTE}`, socketAddress: SOCKET, trustedHops: 2 }),
    ).toBe(FALSIFICADA);
  });

  test("sin el header usa la dirección del socket", () => {
    expect(clientIpFrom({ forwardedFor: undefined, socketAddress: SOCKET, trustedHops: 1 })).toBe(SOCKET);
  });

  test("con menos entradas que saltos usa la dirección del socket", () => {
    expect(clientIpFrom({ forwardedFor: CLIENTE, socketAddress: SOCKET, trustedHops: 2 })).toBe(SOCKET);
  });

  test("con cero saltos usa la dirección del socket aunque llegue el header", () => {
    expect(
      clientIpFrom({ forwardedFor: `${FALSIFICADA}, ${CLIENTE}`, socketAddress: SOCKET, trustedHops: 0 }),
    ).toBe(SOCKET);
  });

  test("recorta los espacios de cada entrada", () => {
    expect(
      clientIpFrom({
        forwardedFor: `  ${FALSIFICADA} ,   ${CLIENTE}  `,
        socketAddress: SOCKET,
        trustedHops: 1,
      }),
    ).toBe(CLIENTE);
  });

  test("ignora las entradas vacías al contar desde la derecha", () => {
    expect(
      clientIpFrom({ forwardedFor: `${FALSIFICADA}, ${CLIENTE}, ,`, socketAddress: SOCKET, trustedHops: 1 }),
    ).toBe(CLIENTE);
  });

  test("un header solo con separadores y espacios usa la dirección del socket", () => {
    expect(clientIpFrom({ forwardedFor: " , ,", socketAddress: SOCKET, trustedHops: 1 })).toBe(SOCKET);
  });

  test("sin dirección de socket ni entradas devuelve una clave estable, nunca vacía", () => {
    const sinSocket = clientIpFrom({ forwardedFor: undefined, socketAddress: undefined, trustedHops: 1 });
    expect(sinSocket).not.toBe("");
    expect(clientIpFrom({ forwardedFor: undefined, socketAddress: undefined, trustedHops: 1 })).toBe(
      sinSocket,
    );
  });
});

describe("rateLimitKeyOf", () => {
  test("una IPv4 queda igual", () => {
    expect(rateLimitKeyOf(CLIENTE)).toBe(CLIENTE);
  });

  test("las IPv6 de un mismo /64 comparten la clave, escritas completas o comprimidas", () => {
    const clave = rateLimitKeyOf("2001:db8:1:2::1");
    expect(clave).toBe("2001:db8:1:2::/64");
    expect(rateLimitKeyOf("2001:0DB8:0001:0002:ffff:ffff:ffff:ffff")).toBe(clave);
    expect(rateLimitKeyOf("2001:db8:1:3::1")).not.toBe(clave);
  });

  test("normaliza la compresión al principio y al final", () => {
    expect(rateLimitKeyOf("::1")).toBe("0:0:0:0::/64");
    expect(rateLimitKeyOf("fe80::")).toBe("fe80:0:0:0::/64");
  });

  test("una IPv4 mapeada en IPv6 usa la IPv4", () => {
    expect(rateLimitKeyOf(`::ffff:${CLIENTE}`)).toBe(CLIENTE);
  });

  test("lo que no es una IP devuelve null", () => {
    for (const valor of [
      "unknown",
      "1.2.3",
      "300.1.1.1",
      "1::2::3",
      "1:2:3:4:5:6:7",
      "1:2:3:4:5:6:7:8:9",
      "g::1",
    ]) {
      expect(rateLimitKeyOf(valor)).toBeNull();
    }
  });
});

describe("clientIpFrom con IPv6", () => {
  test("dos direcciones del mismo /64 cuentan como el mismo cliente", () => {
    const una = clientIpFrom({ forwardedFor: "2001:db8:aa:bb::1", socketAddress: SOCKET, trustedHops: 1 });
    const otra = clientIpFrom({
      forwardedFor: "2001:db8:aa:bb::ffff",
      socketAddress: SOCKET,
      trustedHops: 1,
    });
    expect(una).toBe(otra);
  });
});
