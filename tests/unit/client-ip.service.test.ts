import { describe, expect, test } from "bun:test";
import { clientIpFrom } from "@/http/services/client-ip.service.ts";

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
