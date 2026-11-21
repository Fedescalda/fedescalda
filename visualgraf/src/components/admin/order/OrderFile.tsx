import Image from "next/image";
import { signedUrl } from "@/lib/order-files";

export async function OrderFile({ title, path, empty }: { title: string; path?: string | null; empty: string }) {
  const signed = await signedUrl(path, 3600);
  const download = signed ? new URL(signed) : null;
  download?.searchParams.set("download", path?.split("/").pop() ?? "");
  const preview = path && /\.(png|jpe?g|webp)$/i.test(path);

  return (
    <div className="min-w-0 space-y-2">
      <h3 className="font-semibold">{title}</h3>
      {signed && preview && (
        <div className="relative h-44 rounded-lg bg-ink">
          <Image src={signed} alt={title} fill unoptimized className="object-contain" />
        </div>
      )}
      {download ? (
        <a className="btn btn-ghost" href={download.href} aria-label={`Descargar ${title.toLowerCase()}`}>Descargar</a>
      ) : (
        <p className="text-sm text-mute">{path ? "No pudimos generar el enlace al archivo." : empty}</p>
      )}
    </div>
  );
}
