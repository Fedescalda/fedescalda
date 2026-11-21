import "server-only";
import { createAdminClient } from "./supabase/server";

const BUCKET = "pedidos";
export const ORDER_FILE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/svg+xml", "application/pdf"];
// Vercel limita el cuerpo de las requests a ~4,5 MB
export const MAX_ORDER_FILE = 4 * 1024 * 1024;

const ext: Record<string, string> = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/svg+xml": "svg", "application/pdf": "pdf" };

/** Sube un archivo del pedido al bucket privado y devuelve su ruta. */
export async function uploadOrderFile(orderId: string, kind: "logo" | "mockup" | "prueba", file: File) {
  const sb = createAdminClient();
  if (!sb) throw new Error("Storage no configurado");
  if (!ORDER_FILE_TYPES.includes(file.type)) throw new Error("Formato no soportado. Usá PNG, JPG, WEBP, SVG o PDF.");
  if (file.size > MAX_ORDER_FILE) throw new Error("El archivo supera los 4 MB. Exportalo más liviano o mandalo por WhatsApp.");
  const path = `${orderId}/${kind}-${Date.now()}.${ext[file.type]}`;
  const { error } = await sb.storage.from(BUCKET).upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("No pudimos guardar el archivo.");
  return path;
}

/** URL firmada temporal (por defecto 7 días) para ver/descargar un archivo privado. */
export async function signedUrl(path: string | null | undefined, seconds = 60 * 60 * 24 * 7) {
  if (!path) return null;
  const sb = createAdminClient();
  if (!sb) return null;
  const { data } = await sb.storage.from(BUCKET).createSignedUrl(path, seconds);
  return data?.signedUrl ?? null;
}
