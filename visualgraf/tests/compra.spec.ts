import { expect, test } from "@playwright/test";

// Flujo completo: elegir medida → agregar → carrito → confirmar por WhatsApp (sin Mercado Pago configurado)
test("Compra de punta a punta con cierre por WhatsApp", async ({ page }) => {
  await page.goto("/productos/bolsa-manija-rinon-personalizada?medida=2");
  await expect(page.getByRole("button", { name: /^30 × 40 cm/ })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Sumar un pack" }).click();
  await expect(page.getByText("$ 104.000").first()).toBeVisible();
  await page.getByRole("button", { name: /Agregar al pedido/ }).click();
  await page.getByRole("link", { name: /Ver mi pedido/ }).click();
  await expect(page).toHaveURL(/\/carrito/);
  await expect(page.getByText("30 × 40 cm").first()).toBeVisible();

  await page.fill("#c-name", "Ana Pérez");
  await page.fill("#c-email", "ana@example.com");
  await page.fill("#c-phone", "3364000000");
  await page.selectOption("#c-province", "Santa Fe");
  await page.fill("#c-city", "Rosario");
  await page.fill("#c-address", "Calle Falsa 123");
  await page.fill("#c-zip", "2000");
  // Sin logo: hay que subirlo o marcar que se envía después
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await expect(page.getByText("Subí tu logo o marcá que lo enviás después.")).toBeVisible();
  await page.getByLabel(/Lo envío después/).check();
  // Sin aceptar las condiciones del diseño no se puede confirmar
  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  await expect(page.getByText("Para confirmar tenés que aceptar las condiciones del diseño.")).toBeVisible();
  await page.getByLabel(/Acepto las condiciones del diseño/).check();
  await page.getByRole("button", { name: "Confirmar pedido" }).click();

  const wa = page.getByRole("link", { name: /Enviar pedido por WhatsApp/ });
  await expect(wa).toBeVisible();
  const href = decodeURIComponent((await wa.getAttribute("href")) ?? "");
  expect(href).toContain("https://wa.me/");
  expect(href).toContain("30 × 40 cm");
  expect(href).toMatch(/\$\s104\.000/);
});

test("El servidor ignora precios manipulados y valida datos", async ({ request }) => {
  const res = await request.post("/api/orders", {
    data: { customer: { name: "x" }, items: [], paymentMethod: "whatsapp" },
  });
  expect(res.status()).toBe(400);
  const bad = await request.post("/api/orders", {
    data: {
      customer: { name: "Ana", email: "a@b.co", phone: "123456", province: "Salta", city: "Salta", address: "X 1", zip: "4400" },
      items: [{ productId: "manija-rinon-ad", size: "99 × 99 cm", bagColor: "Blanco", inkColor: "Negro", quantity: 1 }],
      paymentMethod: "whatsapp",
      termsAccepted: true,
    },
  });
  expect(bad.status()).toBe(409);
});

test("Contacto: envío exitoso muestra confirmación", async ({ page }) => {
  await page.goto("/contacto");
  await page.fill("#name", "Ana");
  await page.fill("#email", "ana@example.com");
  await page.fill("#message", "Quiero 500 bolsas negras con impresión dorada");
  await page.getByRole("button", { name: "Enviar consulta" }).click();
  await expect(page.getByRole("status")).toContainText(/(Recibimos|Casi listo)/);
});
