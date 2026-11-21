import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Visual Graf · Tu bolsa impresa",
    short_name: "Visual Graf",
    description: "Bolsas personalizadas para comercios y emprendimientos.",
    start_url: "/",
    display: "standalone",
    background_color: "#07070d",
    theme_color: "#07070d",
    icons: [
      { src: "/img/logo.png", sizes: "256x256", type: "image/png" },
      { src: "/img/logo-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
