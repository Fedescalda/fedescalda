import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  reporter: "list",
  use: {
    baseURL: process.env.BASE_URL || "http://localhost:3000",
    trace: "off",
    launchOptions: {
      executablePath: process.env.PW_CHROMIUM || undefined,
    },
  },
  // Con BASE_URL se prueba un sitio ya publicado (ej. BASE_URL=https://visualgraf.vercel.app npm test)
  webServer: process.env.BASE_URL ? undefined : {
    command: "npm run build && RATE_LIMIT_OFF=1 npm run start",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 240000,
  },
  projects: [
    {
      name: "mobile",
      use: {
        browserName: "chromium",
        viewport: { width: 390, height: 844 },
        isMobile: true,
        hasTouch: true,
      },
    },
    {
      name: "tablet",
      use: {
        browserName: "chromium",
        viewport: { width: 768, height: 1024 },
      },
    },
    {
      name: "desktop",
      use: {
        browserName: "chromium",
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
