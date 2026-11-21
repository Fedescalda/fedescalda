import { expect, test } from "@playwright/test";

test("El enlace de inicio abre el personalizador", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("link", { name: "Probá tu logo gratis", exact: true }).click();
  await expect(page).toHaveURL("/personalizar");
});

test("Subir el logo habilita la descarga", async ({ page }) => {
  await page.goto("/personalizar");
  await page.locator('input[type="file"]').setInputFiles("public/img/logo.png");

  const download = page.getByRole("button", { name: /Descargar/i });
  await expect(download).toBeVisible();
  await expect(download).toBeEnabled();
});

test("El formulario de contacto aplica la validación HTML5", async ({ page }) => {
  await page.goto("/contacto");
  const form = page.locator("form").filter({ has: page.locator('[name="message"]') });
  for (const name of ["name", "email", "message"]) {
    await expect(form.locator(`[name="${name}"]`)).toBeVisible();
  }

  const submit = form.locator('button:not([type]), button[type="submit"], input[type="submit"]');
  await submit.click();
  await expect(form.locator(":invalid").first()).toBeFocused();
  await expect(page).toHaveURL("/contacto");
});

test("El botón flotante abre WhatsApp", async ({ page }) => {
  await page.goto("/");
  const whatsapp = page.getByRole("link", { name: "Escribinos por WhatsApp", exact: true });
  await expect(whatsapp).toBeVisible();
  await expect(whatsapp).toHaveAttribute("href", /^https:\/\/wa\.me\//);
});

for (const route of ["/sitemap.xml", "/robots.txt"]) {
  test(`${route} responde 200`, async ({ request }) => {
    const response = await request.get(route);
    expect(response.status()).toBe(200);
  });
}
