import { expect, test } from "@playwright/test";

const routes = [
  "/",
  "/productos",
  "/personalizar",
  "/promociones",
  "/nuestra-historia",
  "/contacto",
  "/carrito",
  "/admin/login",
];

const ignoredError = /favicon|Download the React DevTools/i;

for (const route of routes) {
  test(`${route} carga correctamente`, async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (message) => {
      if (message.type() === "error" && !ignoredError.test(message.text())) {
        errors.push(message.text());
      }
    });
    page.on("pageerror", (error) => {
      if (!ignoredError.test(error.message)) errors.push(error.message);
    });

    const response = await page.goto(route);
    expect(response?.status()).toBe(200);
    await expect(page.locator("h1:visible")).toHaveCount(1);
    await expect(page).toHaveTitle(/\S/);
    await expect(page.locator('meta[name="description"]')).toHaveAttribute("content", /\S/);

    const { scrollWidth, innerWidth } = await page.evaluate(() => ({
      scrollWidth: document.documentElement.scrollWidth,
      innerWidth: window.innerWidth,
    }));
    expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    await expect(page.locator("img:visible:not([alt])")).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}
