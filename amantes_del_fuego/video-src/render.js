/*
 * Genera los videos del reel a partir de video-src/reel.html.
 * Requiere Node, Playwright y ffmpeg.
 *
 *   node video-src/render.js            → img/video/reel.mp4 (1280x720, para la web) + poster
 *   node video-src/render.js vertical   → img/video/reel-vertical.mp4 (1080x1920, para Reels)
 */
const { chromium } = require("playwright");
const { execFileSync } = require("child_process");
const fs = require("fs");
const os = require("os");
const path = require("path");

const vertical = process.argv[2] === "vertical";
const [W, H] = vertical ? [1080, 1920] : [1280, 720];
const FPS = 30, DURACION = 15000;
const raiz = path.join(__dirname, "..");
const salida = path.join(raiz, "img/video", vertical ? "reel-vertical.mp4" : "reel.mp4");
const cuadros = fs.mkdtempSync(path.join(os.tmpdir(), "reel-"));

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.goto("file://" + path.join(__dirname, "reel.html") + (vertical ? "?formato=vertical" : ""));
  await page.evaluate(() => window.listo);
  const total = Math.round((DURACION / 1000) * FPS);
  for (let f = 0; f < total; f++) {
    await page.evaluate((t) => window.setTiempo(t), (f * 1000) / FPS);
    await page.screenshot({ path: path.join(cuadros, `f${String(f).padStart(4, "0")}.png`) });
  }
  await browser.close();

  fs.mkdirSync(path.dirname(salida), { recursive: true });
  execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-framerate", String(FPS), "-i", path.join(cuadros, "f%04d.png"),
    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", vertical ? "23" : "26", "-preset", "slow", "-movflags", "+faststart", salida]);
  if (!vertical) {
    // Poster: un cuadro de la escena de Discos, para mostrar mientras carga
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", path.join(cuadros, "f0120.png"), "-q:v", "4", path.join(raiz, "img/video/reel-poster.jpg")]);
  }
  fs.rmSync(cuadros, { recursive: true, force: true });
  console.log("Listo:", path.relative(raiz, salida), (fs.statSync(salida).size / 1e6).toFixed(2), "MB");
})();
