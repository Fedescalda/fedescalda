"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import type { ActionResult } from "@/components/admin/ActionForm";
import type { Variant } from "@/lib/catalog";
import { createAdminClient, createSessionClient } from "@/lib/supabase/server";
import { orderStatuses } from "./display";
import { getAdminClient } from "./session";
import { notificationChannels, notify } from "@/lib/notify";

const denied = { error: "No tenés permisos para hacer este cambio." };

function field(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function priceValue(value: string) {
  return value === "" ? null : Number(value);
}

function validPrice(value: number | null) {
  return value === null || (Number.isFinite(value) && value >= 0);
}

export async function signOut() {
  const supabase = await createSessionClient();
  await supabase?.auth.signOut({ scope: "local" });
  redirect("/admin/login");
}

export async function updateOrderStatus(id: string, _state: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const status = field(form, "status");
  if (!Object.hasOwn(orderStatuses, status)) return { error: "Elegí un estado válido." };

  const { error } = await supabase.from("orders").update({ status }).eq("id", id).select("id").single();
  if (error) return { error: "No pudimos actualizar el pedido." };
  revalidatePath("/admin");
  return { success: "Estado actualizado." };
}

export async function markAnswered(id: string): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const { error } = await supabase.from("contact_messages").update({ status: "respondido" }).eq("id", id).select("id").single();
  if (error) return { error: "No pudimos marcar la consulta como respondida." };
  revalidatePath("/admin/consultas");
  return { success: "Consulta marcada como respondida." };
}

/* ───────── Productos ───────── */

const CATEGORIES = ["manija-rinon", "hielo", "ecommerce"] as const;
const BAG_COLORS = ["blanco", "negro", "cristal", "lila", "rosa"];
const MAX_IMAGES = 8;
const BUCKET = "productos";

function slugify(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function revalidateCatalog() {
  revalidatePath("/");
  revalidatePath("/productos");
  revalidatePath("/productos/[slug]", "page");
  revalidatePath("/sitemap.xml");
  revalidatePath("/admin/productos");
}

/** Lee y valida el formulario de producto (común a crear y editar). */
function parseProduct(form: FormData) {
  const name = field(form, "name");
  if (name.length < 3) return { error: "Ingresá el nombre del producto (mínimo 3 letras)." } as const;
  const category = field(form, "category");
  if (!(CATEGORIES as readonly string[]).includes(category)) return { error: "Elegí una categoría." } as const;
  const packSize = Number(field(form, "pack_size"));
  if (!Number.isInteger(packSize) || packSize < 1 || packSize > 100000) return { error: "Las unidades por pack tienen que ser un número entero." } as const;

  const sizes = form.getAll("variant_size").map((v) => String(v).trim());
  const prices = form.getAll("variant_price").map((v) => priceValue(String(v).trim()));
  const kilosList = form.getAll("variant_kilos").map((v) => priceValue(String(v).trim()));
  const volList = form.getAll("variant_volumen").map((v) => priceValue(String(v).trim()));
  const variants: Variant[] = [];
  for (let i = 0; i < sizes.length; i++) {
    if (!sizes[i] && prices[i] == null) continue; // fila vacía
    if (!sizes[i]) return { error: `Completá la medida de la fila ${i + 1}.` } as const;
    if (!validPrice(prices[i])) return { error: `El precio de "${sizes[i]}" no es válido.` } as const;
    const kilos = kilosList[i] ?? null;
    const volumen = volList[i] ?? null;
    if ((kilos != null && !(kilos > 0 && kilos <= 500)) || (volumen != null && !(volumen > 0 && volumen <= 5_000_000))) {
      return { error: `Revisá el peso o el volumen de "${sizes[i]}".` } as const;
    }
    variants.push({ size: sizes[i].slice(0, 80), price: prices[i], kilos, volumen });
  }
  if (!variants.length) return { error: "Agregá al menos una medida (con precio o vacío para cotizar)." } as const;
  if (new Set(variants.map((v) => v.size)).size !== variants.length) return { error: "Hay medidas repetidas." } as const;

  const colors = form.getAll("colors").map(String).filter((c) => BAG_COLORS.includes(c));
  if (!colors.length) return { error: "Elegí al menos un color de bolsa." } as const;

  return {
    data: {
      name: name.slice(0, 120),
      short: field(form, "short").slice(0, 200),
      description: field(form, "description").slice(0, 3000),
      category,
      pack_size: packSize,
      variants,
      colors,
      features: field(form, "features").split(/\r?\n/).map((f) => f.trim()).filter(Boolean).slice(0, 12),
      featured: form.has("featured"),
      active: form.has("active"),
    },
  } as const;
}

/** Sube las fotos nuevas al bucket y devuelve sus URLs públicas. */
async function uploadImages(productId: string, form: FormData, altBase: string) {
  const storage = createAdminClient()?.storage;
  if (!storage) throw new Error("Falta SUPABASE_SERVICE_ROLE_KEY para subir fotos.");
  const files = form.getAll("new_images").filter((f): f is File => f instanceof File && f.size > 0);
  const out: { src: string; alt: string }[] = [];
  for (const [i, file] of files.entries()) {
    if (!["image/webp", "image/jpeg", "image/png"].includes(file.type)) throw new Error("Formato de foto no soportado.");
    if (file.size > 5 * 1024 * 1024) throw new Error("Cada foto tiene que pesar menos de 5 MB.");
    const ext = file.type === "image/webp" ? "webp" : file.type === "image/png" ? "png" : "jpg";
    const path = `${productId}/${crypto.randomUUID()}.${ext}`;
    const { error } = await storage.from(BUCKET).upload(path, file, { contentType: file.type, cacheControl: "31536000" });
    if (error) throw new Error("No pudimos subir una foto.");
    out.push({ src: storage.from(BUCKET).getPublicUrl(path).data.publicUrl, alt: `${altBase}${files.length > 1 ? ` (foto ${i + 1})` : ""}` });
  }
  return out;
}

/** Borra del bucket las fotos que ya no se usan (solo las nuestras). */
async function removeStoredImages(srcs: string[]) {
  const storage = createAdminClient()?.storage;
  if (!storage) return;
  const marker = `/storage/v1/object/public/${BUCKET}/`;
  const paths = srcs.filter((s) => s.includes(marker)).map((s) => decodeURIComponent(s.split(marker)[1]));
  if (paths.length) await storage.from(BUCKET).remove(paths);
}

export async function createProduct(_state: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;
  const parsed = parseProduct(form);
  if ("error" in parsed) return { error: parsed.error };

  const slug = slugify(field(form, "slug") || parsed.data.name);
  if (!slug) return { error: "El link del producto no es válido." };
  const { data: clash } = await supabase.from("products").select("id").eq("slug", slug).maybeSingle();
  if (clash) return { error: `Ya existe un producto con el link "${slug}". Cambiá el nombre o el link.` };

  const id = `${slug.slice(0, 40)}-${crypto.randomUUID().slice(0, 6)}`;
  let images: { src: string; alt: string }[];
  try {
    images = await uploadImages(id, form, parsed.data.name);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No pudimos subir las fotos." };
  }
  if (!images.length) return { error: "Subí al menos una foto del producto." };
  if (images.length > MAX_IMAGES) return { error: `Máximo ${MAX_IMAGES} fotos.` };

  const { data: last } = await supabase.from("products").select("sort").order("sort", { ascending: false }).limit(1).maybeSingle();
  const { error } = await supabase
    .from("products")
    .insert({ id, slug, ...parsed.data, images, sort: (last?.sort ?? 0) + 1 })
    .select("id")
    .single();
  if (error) {
    await removeStoredImages(images.map((i) => i.src));
    return { error: "No pudimos crear el producto." };
  }
  revalidateCatalog();
  redirect(`/admin/productos/${encodeURIComponent(id)}?creado=1`);
}

export async function updateProduct(id: string, _state: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;
  const parsed = parseProduct(form);
  if ("error" in parsed) return { error: parsed.error };

  const { data: product, error: readError } = await supabase.from("products").select("images, updated_at, variants").eq("id", id).single();
  if (readError || !product) return { error: "No pudimos leer el producto." };
  if (product.updated_at !== field(form, "updated_at")) {
    return { error: "El producto cambió. Recargá la página antes de editarlo." };
  }

  // Fotos existentes: se conservan en el orden del formulario, con su texto alternativo editado
  const current = (product.images ?? []) as { src: string; alt: string }[];
  const keepSrc = form.getAll("image_src").map(String);
  const keepAlt = form.getAll("image_alt").map((a) => String(a).trim().slice(0, 200));
  const remove = new Set(form.getAll("image_remove").map(String));
  const kept = keepSrc
    .map((src, i) => ({ src, alt: keepAlt[i] || parsed.data.name }))
    .filter((img) => current.some((c) => c.src === img.src) && !remove.has(img.src));

  let added: { src: string; alt: string }[];
  try {
    added = await uploadImages(id, form, parsed.data.name);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "No pudimos subir las fotos." };
  }
  const images = [...kept, ...added];
  if (!images.length) {
    await removeStoredImages(added.map((i) => i.src));
    return { error: "El producto tiene que tener al menos una foto." };
  }
  if (images.length > MAX_IMAGES) {
    await removeStoredImages(added.map((i) => i.src));
    return { error: `Máximo ${MAX_IMAGES} fotos.` };
  }

  // Conserva datos extra de cada medida (foto asociada, detalle) si la medida sigue existiendo
  const oldVariants = (product.variants ?? []) as Variant[];
  const variants = parsed.data.variants.map((v) => {
    const old = oldVariants.find((o) => o.size === v.size);
    const image = old?.image && images.some((i) => i.src === old.image) ? old.image : undefined;
    return { ...v, ...(image && { image }), ...(old?.detail && { detail: old.detail }) };
  });

  const { error } = await supabase
    .from("products")
    .update({ ...parsed.data, variants, images, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("updated_at", product.updated_at)
    .select("id")
    .single();
  if (error) {
    await removeStoredImages(added.map((i) => i.src));
    return { error: "No pudimos guardar el producto. Recargá la página e intentá de nuevo." };
  }
  await removeStoredImages(current.filter((c) => !images.some((i) => i.src === c.src)).map((c) => c.src));
  revalidateCatalog();
  revalidatePath(`/admin/productos/${id}`);
  return { success: "Producto guardado." };
}

export async function deleteProduct(id: string): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;
  const { data: product } = await supabase.from("products").select("images").eq("id", id).maybeSingle();
  const { error } = await supabase.from("products").delete().eq("id", id).select("id").single();
  if (error) return { error: "No pudimos borrar el producto." };
  await removeStoredImages(((product?.images ?? []) as { src: string }[]).map((i) => i.src));
  revalidateCatalog();
  redirect("/admin/productos?borrado=1");
}

function isSitePath(value: string) {
  return value.startsWith("/") && !value.startsWith("//") && !value.includes("\\");
}

function validLink(value: string) {
  if (!value || isSitePath(value)) return true;
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export async function savePromotion(id: string | null, _state: ActionResult, form: FormData): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const title = field(form, "title");
  const price = priceValue(field(form, "price"));
  const endsAt = field(form, "ends_at");
  const image = field(form, "image");
  const cta = field(form, "cta");

  if (!title) return { error: "Ingresá un título." };
  if (!validPrice(price)) return { error: "Ingresá un precio válido o dejalo vacío." };
  const date = new Date(endsAt);
  if (endsAt && (!/^\d{4}-\d{2}-\d{2}$/.test(endsAt) || !Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== endsAt)) {
    return { error: "Ingresá una fecha de finalización válida." };
  }
  if (image && !isSitePath(image)) return { error: "Ingresá una ruta de imagen del sitio, como /img/promo.webp." };
  if (!validLink(cta)) return { error: "Ingresá una ruta del sitio o un enlace HTTPS para el botón." };

  const values = {
    title,
    description: field(form, "description"),
    badge: field(form, "badge") || "Promo",
    price,
    price_note: field(form, "price_note") || null,
    image: image || null,
    cta: cta || null,
    ends_at: endsAt || null,
    active: form.has("active"),
  };
  const query = id
    ? supabase.from("promotions").update(values).eq("id", id)
    : supabase.from("promotions").insert(values);
  const { error } = await query.select("id").single();

  if (error) return { error: "No pudimos guardar la promoción." };
  refreshPromotions();
  return { success: id ? "Promoción guardada." : "Promoción creada." };
}

export async function deletePromotion(id: string): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;

  const { error } = await supabase.from("promotions").delete().eq("id", id).select("id").single();
  if (error) return { error: "No pudimos borrar la promoción." };
  refreshPromotions();
  return { success: "Promoción borrada." };
}

function refreshPromotions() {
  revalidatePath("/admin/promociones");
  revalidatePath("/promociones");
  revalidatePath("/");
}

export async function sendTestNotification(): Promise<ActionResult> {
  const supabase = await getAdminClient();
  if (!supabase) return denied;
  const ch = notificationChannels();
  if (!ch.email && !ch.telegram) {
    return { error: "No hay avisos configurados. Cargá RESEND_API_KEY + NOTIFY_EMAIL y/o TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID." };
  }
  await notify({ subject: "🔔 Prueba de avisos de Visual Graf", lines: ["Si ves este mensaje, los avisos de pedidos y consultas funcionan."] });
  return { success: `Aviso de prueba enviado por ${[ch.email && "email", ch.telegram && "Telegram"].filter(Boolean).join(" y ")}. Revisá que te haya llegado.` };
}
