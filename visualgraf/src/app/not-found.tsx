import Link from "next/link";
import { IconArrow } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="container-vg flex min-h-[70vh] flex-col items-center justify-center pt-28 text-center">
      <p className="text-gradient font-display text-8xl font-black">404</p>
      <h1 className="mt-4 font-display text-3xl font-black">Esta página no está en el catálogo</h1>
      <p className="mt-3 text-mute">Puede que el link haya cambiado. Volvé al inicio o mirá nuestras bolsas.</p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="btn btn-ghost">Ir al inicio</Link>
        <Link href="/productos" className="btn btn-primary">Ver productos <IconArrow /></Link>
      </div>
    </div>
  );
}
