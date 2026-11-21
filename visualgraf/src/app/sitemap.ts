import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/data";
import { site } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const pages = ["", "/productos", "/personalizar", "/promociones", "/nuestra-historia", "/contacto", "/privacidad"].map((p) => ({
    url: `${site.url}${p}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: p === "" ? 1 : 0.8,
  }));
  const products = (await getProducts()).map((p) => ({
    url: `${site.url}/productos/${p.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.9,
  }));
  return [...pages, ...products];
}
