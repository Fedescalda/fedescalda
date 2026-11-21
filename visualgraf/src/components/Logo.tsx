import Image from "next/image";
import Link from "next/link";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <Link href="/" className={`group flex items-center gap-2.5 ${className}`} aria-label="Visual Graf, ir al inicio">
      <Image
        src="/img/logo.png"
        alt=""
        width={44}
        height={44}
        priority
        className="h-10 w-10 transition-transform duration-700 group-hover:rotate-[360deg] md:h-11 md:w-11"
      />
      <span className="flex flex-col leading-none">
        <span className="font-display text-[1.15rem] font-extrabold tracking-tight text-white md:text-xl">VISUAL GRAF</span>
        <span className="mt-1 text-[0.55rem] font-semibold tracking-[0.42em] text-mute">TU BOLSA IMPRESA</span>
      </span>
    </Link>
  );
}
