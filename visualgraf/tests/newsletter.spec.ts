import { expect, test } from "@playwright/test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { NewsletterForm } from "../src/components/newsletter/NewsletterForm";

test("el formulario exige consentimiento antes de permitir la suscripción", async ({ page }) => {
  const markup = renderToStaticMarkup(createElement(NewsletterForm, { variant: "card", source: "home" }));
  await page.setContent(markup);
  await page.locator("form").evaluate((form) => {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      form.setAttribute("data-submitted", "true");
    });
  });

  await page.getByRole("textbox", { name: "Email" }).fill("cliente@example.com");
  const consent = page.getByRole("checkbox", { name: /Acepto recibir novedades/ });
  const submit = page.getByRole("button", { name: "Suscribirme" });

  await submit.click();
  await expect(consent).toBeFocused();
  await expect(page.locator("form")).not.toHaveAttribute("data-submitted", "true");

  await consent.check();
  await submit.click();
  await expect(page.locator("form")).toHaveAttribute("data-submitted", "true");
});

test("la API rechaza un email inválido", async ({ request }) => {
  const response = await request.post("/api/newsletter", { data: { email: "email-invalido", source: "home" } });
  expect(response.status()).toBe(400);
  expect(await response.json()).toMatchObject({ ok: false, message: expect.stringMatching(/email válido/) });
});
