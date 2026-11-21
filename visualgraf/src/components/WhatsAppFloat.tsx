import { waLink } from "@/lib/site";
import { IconWhatsApp } from "./Icons";

export function WhatsAppFloat() {
  return (
    <a
      href={waLink("¡Hola Visual Graf! Quiero cotizar bolsas personalizadas.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Escribinos por WhatsApp"
      className="fixed right-4 bottom-4 z-40 grid h-14 w-14 place-items-center rounded-full bg-whatsapp text-[#04210f] shadow-[0_12px_30px_-8px_rgba(37,211,102,.7)] transition-transform hover:scale-110 md:right-6 md:bottom-6"
    >
      <span className="absolute inset-0 animate-ping rounded-full bg-whatsapp opacity-25 motion-reduce:hidden" aria-hidden />
      <IconWhatsApp width={30} height={30} />
    </a>
  );
}
