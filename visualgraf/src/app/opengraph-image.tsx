import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const alt = "Visual Graf · Tu marca, en cada bolsa";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OgImage() {
  const logo = await readFile(join(process.cwd(), "public/img/logo.png"));
  const logoSrc = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "linear-gradient(125deg,#07070d 0%,#141448 45%,#3a0f3f 80%,#5a1a10 100%)", color: "#fff", padding: 70, fontFamily: "sans-serif" }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <img src={logoSrc} width={96} height={96} alt="" />
            <div style={{ display: "flex", flexDirection: "column" }}>
              <span style={{ fontSize: 44, fontWeight: 900 }}>VISUAL GRAF</span>
              <span style={{ fontSize: 18, letterSpacing: 10, opacity: 0.7 }}>TU BOLSA IMPRESA</span>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <span style={{ fontSize: 92, fontWeight: 900, lineHeight: 1 }}>Tu marca,</span>
            <span style={{ fontSize: 92, fontWeight: 900, lineHeight: 1.05, backgroundImage: "linear-gradient(90deg,#34d3f3,#3a64ff,#9b33f5,#ff2e93,#ff7a1c,#ffc61f)", backgroundClip: "text", color: "transparent" }}>en cada bolsa.</span>
          </div>
          <div style={{ display: "flex", gap: 24, fontSize: 28, opacity: 0.85 }}>
            <span>Bolsas personalizadas</span>
            <span>·</span>
            <span>Envíos a toda la Argentina</span>
          </div>
        </div>
      </div>
    ),
    size,
  );
}
