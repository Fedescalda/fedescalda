import { expect, test } from "@playwright/test";
import { computeStats, isInvalidCustomRange, previousRange, rangeFromParams, statsToCsv } from "../src/lib/stats";
import type { StatsOrder } from "../src/lib/stats-types";

test.beforeEach(() => test.skip(test.info().project.name !== "desktop"));

const now = new Date("2026-11-16T01:30:00.000Z");

function order(id: string, overrides: Partial<StatsOrder> = {}): StatsOrder {
  return {
    id,
    created_at: "2026-11-15T02:59:59.999Z",
    status: "pagado",
    total: 200,
    shipping: 0,
    discount: 0,
    payment_method: "transferencia",
    customer: { province: "Buenos Aires" },
    items: [{ name: "Bolsa", size: "30 × 40", bagColor: "Blanco", inkColor: "Negro", quantity: 2, packSize: 50, unitPrice: 100 }],
    ...overrides,
  };
}

test("calcula hoy y 30 días según el calendario ART", () => {
  const today = rangeFromParams({ p: "hoy" }, now);
  expect(today.from.toISOString()).toBe("2026-11-15T03:00:00.000Z");
  expect(today.to).toEqual(now);

  const range = rangeFromParams({ p: "30d" }, now);
  expect(range.from.toISOString()).toBe("2026-10-17T03:00:00.000Z");
  expect(range.to).toEqual(now);
  const previous = previousRange(range);
  expect(previous.to).toEqual(range.from);
  expect(previous.to.getTime() - previous.from.getTime()).toBe(range.to.getTime() - range.from.getTime());
});

test("completa la serie ART y excluye el límite superior", () => {
  const range = rangeFromParams({ p: "custom", desde: "2026-11-13", hasta: "2026-11-15" }, now);
  const stats = computeStats([order("sale"), order("boundary", { created_at: range.to.toISOString() })], range, []);
  expect(stats.series).toEqual([
    { key: "2026-11-13", label: "13/11", revenue: 0, orders: 0, units: 0 },
    { key: "2026-11-14", label: "14/11", revenue: 200, orders: 1, units: 100 },
    { key: "2026-11-15", label: "15/11", revenue: 0, orders: 0, units: 0 },
  ]);
});

test("calcula KPIs, separa pendientes y compara el período anterior", () => {
  const range = rangeFromParams({ p: "30d" }, now);
  const previousDate = "2026-10-16T20:00:00.000Z";
  const stats = computeStats(
    [order("sale"), order("pending", { status: "pendiente", total: 150 })],
    range,
    [
      order("old", { created_at: previousDate, total: 150, status: "entregado" }),
      order("old-pending", { created_at: previousDate, status: "pendiente", total: 100 }),
      order("outside"),
    ],
  );
  expect(stats.kpis).toEqual({
    revenue: { value: 200, previous: 150, changePct: 33.3 },
    orders: { value: 1, previous: 1, changePct: 0 },
    avgTicket: { value: 200, previous: 150, changePct: 33.3 },
    units: { value: 100, previous: 100, changePct: 0 },
    pendingOrders: { value: 1, previous: 1, changePct: 0 },
    pendingAmount: { value: 150, previous: 100, changePct: 50 },
  });
  expect(stats.funnel.slice(0, 2).map(({ count }) => count)).toEqual([1, 1]);
  expect(stats.byPayment[0]).toMatchObject({ label: "Transferencia", orders: 1, share: 1 });
  expect(statsToCsv(stats)).toContain("Facturado;200;150;33,3");
});

test("agrupa medidas sobrantes en Otros, ordena por bolsas y cuenta pedidos distintos", () => {
  const sale = order("sale", { total: 45 });
  const items = Array.from({ length: 9 }, (_, index) => ({
    ...sale.items[0], size: `Medida ${index + 1}`, quantity: index + 1, packSize: 100, unitPrice: 1,
  }));
  const stats = computeStats([{ ...sale, items }], rangeFromParams({}, now), []);
  expect(stats.bySize).toHaveLength(8);
  expect(stats.bySize[0]).toMatchObject({ label: "Medida 9", units: 900 });
  // participación sobre el total de bolsas de los ítems (4.500), nunca sobre el total del pedido
  expect(stats.bySize[7]).toEqual({ label: "Otros", revenue: 3, orders: 1, units: 300, share: 300 / 4500 });
  expect(stats.bySize.reduce((sum, row) => sum + row.share, 0)).toBeCloseTo(1);
  expect(stats.kpis.revenue.changePct).toBeNull();
});

test("la participación por producto no supera 100 % con descuento y envío", () => {
  const stats = computeStats([order("promo", { total: 80, discount: 20 })], rangeFromParams({}, now), []);
  expect(stats.bySize[0].share).toBe(1);
});

test("fecha la venta cuando se acreditó el pago, no cuando se creó el pedido", () => {
  const today = rangeFromParams({ p: "hoy" }, now);
  const late = order("late", {
    created_at: "2026-11-10T15:00:00.000Z",
    history: [{ status: "pendiente", at: "2026-11-10T15:00:00.000Z" }, { status: "pagado", at: "2026-11-15T12:00:00.000Z" }],
  });
  const stats = computeStats([late], today, []);
  expect(stats.kpis.revenue.value).toBe(200);
  expect(stats.funnel.find((f) => f.status === "pagado")?.count).toBe(0); // creado otro día
});

test("detecta rangos personalizados inválidos", () => {
  expect(isInvalidCustomRange({ p: "custom", desde: "2026-11-15", hasta: "2026-11-14" })).toBe(true);
  expect(isInvalidCustomRange({ p: "custom", desde: "2008-01-01", hasta: "2008-02-01" })).toBe(true);
  expect(isInvalidCustomRange({ p: "custom", desde: "2026-11-01", hasta: "2026-11-14" })).toBe(false);
  expect(isInvalidCustomRange({ p: "30d" })).toBe(false);
});

test("vuelve a 30 días si el rango custom es inválido", () => {
  const fallback = rangeFromParams({ p: "30d" }, now);
  for (const [desde, hasta] of [
    ["2026-02-30", "2026-03-01"],
    ["2026-11-15", "2026-11-14"],
    ["2023-01-01", "2026-01-01"],
  ]) {
    expect(rangeFromParams({ p: "custom", desde, hasta }, now)).toEqual(fallback);
  }
});
