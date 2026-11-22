// Animación "vuela al carrito": una miniatura viaja en curva desde el producto hasta el ícono del carrito.
export function flyToCart(from: Element | null, imgSrc: string, fallback?: Element | null) {
  if (typeof window === "undefined") return;
  // Si la foto no está a la vista (se scrolleó), la animación sale desde el botón
  const visible = (el: Element | null) => {
    if (!el) return false;
    const r = el.getBoundingClientRect();
    return r.bottom > 60 && r.top < window.innerHeight - 60;
  };
  if (!visible(from)) from = fallback ?? null;
  if (!from) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  const target = document.getElementById("cart-button");
  if (!target) return;
  const a = from.getBoundingClientRect();
  const b = target.getBoundingClientRect();
  const size = Math.min(140, a.width * 0.45);
  const img = document.createElement("img");
  img.src = imgSrc;
  img.alt = "";
  Object.assign(img.style, {
    position: "fixed",
    left: `${a.left + a.width / 2 - size / 2}px`,
    top: `${a.top + a.height / 2 - size / 2}px`,
    width: `${size}px`,
    height: `${size}px`,
    objectFit: "cover",
    borderRadius: "18px",
    boxShadow: "0 20px 40px -10px rgba(155,51,245,.6)",
    zIndex: "80",
    pointerEvents: "none",
  } as CSSStyleDeclaration);
  document.body.appendChild(img);
  const dx = b.left + b.width / 2 - (a.left + a.width / 2);
  const dy = b.top + b.height / 2 - (a.top + a.height / 2);
  const anim = img.animate(
    [
      { transform: "translate(0,0) scale(1) rotate(0deg)", opacity: 1 },
      { transform: `translate(${dx * 0.45}px, ${dy * 0.45 - 120}px) scale(0.7) rotate(-8deg)`, opacity: 1, offset: 0.5 },
      { transform: `translate(${dx}px, ${dy}px) scale(0.12) rotate(6deg)`, opacity: 0.3 },
    ],
    { duration: 700, easing: "cubic-bezier(.5,-0.1,.3,1)" },
  );
  anim.onfinish = () => img.remove();
  anim.oncancel = () => img.remove();
}
