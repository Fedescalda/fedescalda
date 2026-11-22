import { expect, test } from "@playwright/test";
import { normalizeCP, toBultos } from "../src/lib/andreani-core";

// Lógica pura de Andreani (sin red): normalización de CP y armado de bultos.
test.describe("Andreani", () => {
  test.beforeEach(() => test.skip(test.info().project.name !== "desktop", "lógica pura: se corre una sola vez"));

  test("normaliza códigos postales argentinos", () => {
    expect(normalizeCP("2000")).toBe("2000");
    expect(normalizeCP("S2000ABC")).toBe("2000");
    expect(normalizeCP("b 1754 xyz")).toBe("1754");
    expect(normalizeCP("12")).toBeNull();
  });

  test("divide pedidos pesados en bultos de hasta 25 kg", () => {
    expect(toBultos({ kilos: 10, volumen: 6000 })).toEqual([{ kilos: 10, volumen: 6000 }]);
    const b = toBultos({ kilos: 60, volumen: 30000 });
    expect(b).toHaveLength(3);
    expect(b[0]).toEqual({ kilos: 20, volumen: 10000 });
  });
});
