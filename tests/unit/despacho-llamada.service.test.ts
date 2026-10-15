import { describe, expect, test } from "bun:test";
import { HERRAMIENTA, NOMBRE_VISIBLE } from "@/config/constants/tools.constants.ts";
import { casoDeArgumentos, casoDeLlamada } from "@/loop/services/despacho-llamada.service.ts";

const EC = "ec-corp-andina";
const LEER = NOMBRE_VISIBLE[HERRAMIENTA.LEER_SOLICITUD];

describe("casoDeArgumentos solo publica un caso que cumple PATRON_CASO (G-03-17, T-03-45)", () => {
  test("un caso válido sale tal cual", () => {
    expect(casoDeArgumentos({ caso: EC })).toBe(EC);
  });

  test.each([
    ["el caso vacío del listado", { caso: "" }],
    ["una ruta relativa", { caso: "../x" }],
    ["un caso en mayúsculas", { caso: "EC-CORP" }],
    ["un caso que no es texto", { caso: 7 }],
    ["argumentos sin caso", {}],
    ["argumentos que no son objeto", "ec-corp-andina"],
  ])("%s da null", (_, argumentos) => {
    expect(casoDeArgumentos(argumentos)).toBeNull();
  });
});

describe("casoDeLlamada lee el caso de los argumentos JSON de la llamada", () => {
  test("con un caso válido lo devuelve y con el listado da null", () => {
    expect(casoDeLlamada({ id: "call_1", nombre: LEER, argumentos: JSON.stringify({ caso: EC }) })).toBe(EC);
    expect(
      casoDeLlamada({ id: "call_2", nombre: LEER, argumentos: JSON.stringify({ caso: "" }) }),
    ).toBeNull();
  });

  test("con argumentos que no son JSON da null", () => {
    expect(casoDeLlamada({ id: "call_3", nombre: LEER, argumentos: "{caso:" })).toBeNull();
  });
});
