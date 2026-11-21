// Genera supabase/seed.sql a partir de src/lib/catalog.ts (fuente única de los datos base).
// Uso: npm run seed:sql
import { writeFileSync } from "node:fs";
import { sampleProducts, samplePromotions } from "../src/lib/catalog";

const q = (v: unknown) => (v == null ? "null" : `'${String(v).replace(/'/g, "''")}'`);
const j = (v: unknown) => (v == null ? "null" : `${q(JSON.stringify(v))}::jsonb`);
const arr = (v: string[]) => `array[${v.map(q).join(",")}]::text[]`;

let sql = "-- Generado por scripts/seed-sql.ts. No editar a mano.\n\n";
sampleProducts.forEach((p, i) => {
  sql += `insert into public.products (id, slug, name, short, description, category, images, pack_size, variants, colors, features, featured, active, sort) values (${[
    q(p.id), q(p.slug), q(p.name), q(p.short), q(p.description), q(p.category), j(p.images), p.packSize, j(p.variants), arr(p.colors), arr(p.features), !!p.featured, p.active !== false, i + 1,
  ].join(", ")}) on conflict (id) do nothing;\n`;
});
samplePromotions.forEach((p) => {
  sql += `insert into public.promotions (slug, title, description, badge, price, price_note, details, code, discount_percent, ends_at, image, cta, active) values (${[
    q(p.id), q(p.title), q(p.description), q(p.badge), p.price ?? "null", q(p.priceNote), j(p.details), q(p.code), p.discountPercent ?? "null", q(p.endsAt), q(p.image), q(p.cta), p.active !== false,
  ].join(", ")}) on conflict (slug) do nothing;\n`;
});
writeFileSync("supabase/seed.sql", sql);
console.log("supabase/seed.sql generado");
