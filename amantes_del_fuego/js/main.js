// Lo llama js/datos.js cuando terminó de cargar la planilla (o el respaldo)
window.iniciarSitio = function (DATOS) {
  const PRODUCTOS = DATOS.productos;
  const AJUSTES = DATOS.ajustes || {};
  const PROMOS = DATOS.promos || [];
  const $ = (sel) => document.querySelector(sel);
  const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  const waUrl = (texto) => `https://wa.me/${NUMERO_WHATSAPP}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
  const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  // Descuento por pagar con transferencia (pestaña Ajustes de la planilla)
  const descuento = Math.max(0, Math.min(50, parseFloat(String(AJUSTES.descuento_transferencia || "").replace(",", ".")) || 0));
  const conTransferencia = (n) => Math.round(n * (1 - descuento / 100));
  const sinTildes = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const avisar = (t) => { $("#aviso").textContent = ""; setTimeout(() => ($("#aviso").textContent = t), 30); };

  // Links generales de WhatsApp
  document.querySelectorAll(".js-wa-link").forEach((a) => {
    a.href = waUrl("¡Hola Amantes del Fuego! Quería hacer una consulta.");
    a.target = "_blank";
    a.rel = "noopener";
  });
  $("#year").textContent = new Date().getFullYear();

  // Menú en celular
  const toggle = $(".nav__toggle");
  const menu = $("#menu");
  const cerrarMenu = () => { menu.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); toggle.setAttribute("aria-label", "Abrir menú"); };
  toggle.addEventListener("click", () => {
    const abierto = menu.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", abierto);
    toggle.setAttribute("aria-label", abierto ? "Cerrar menú" : "Abrir menú");
  });
  menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", cerrarMenu));

  // Horarios + estado abierto/cerrado (hora de Argentina)
  $("#hours-list").innerHTML = HORARIOS.map(
    (h) => `<div><dt>${h.etiqueta}</dt><dd>${h.desde} a ${h.hasta} hs</dd></div>`
  ).join("");
  // "Abrimos hoy a las 10:00 hs" / "Abrimos mañana…" / "Abrimos el lunes…"
  function proximaApertura(dia, ahora) {
    const nombres = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];
    for (let i = 0; i < 7; i++) {
      const d = (dia + i) % 7;
      const h = HORARIOS.find((x) => x.dias.includes(d));
      if (!h || (i === 0 && ahora >= h.desde)) continue;
      const cuando = i === 0 ? "hoy" : i === 1 ? "mañana" : `el ${nombres[d]}`;
      return `Abrimos ${cuando} a las ${h.desde} hs.`;
    }
    return "";
  }
  function estadoHorario() {
    const partes = Object.fromEntries(
      new Intl.DateTimeFormat("en-US", { timeZone: "America/Argentina/Buenos_Aires", weekday: "short", hour: "2-digit", minute: "2-digit", hourCycle: "h23" })
        .formatToParts(new Date()).map((p) => [p.type, p.value])
    );
    const dia = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(partes.weekday);
    const ahora = `${partes.hour}:${partes.minute}`;
    const hoy = HORARIOS.find((h) => h.dias.includes(dia));
    const abierto = hoy && ahora >= hoy.desde && ahora < hoy.hasta;
    const el = $("#hours-status");
    el.textContent = abierto ? `Abierto ahora, hasta las ${hoy.hasta} hs` : `Cerrado ahora. ${proximaApertura(dia, ahora)} Dejanos tu mensaje y te respondemos.`;
    el.classList.toggle("is-open", Boolean(abierto));
  }
  estadoHorario();
  setInterval(estadoHorario, 60000);

  // Catálogo agrupado por categoría. El filtro elegido queda en la URL (?cat=Mecheros)
  const categorias = [...new Set(PRODUCTOS.map((p) => p.categoria))];
  const cuenta = (c) => PRODUCTOS.filter((p) => p.categoria === c).length;
  const slug = (t) => t.normalize("NFD").replace(/[^\w]+/g, "-").toLowerCase();
  const desdeUrl = new URLSearchParams(location.search).get("cat");
  let filtro = categorias.includes(desdeUrl) ? desdeUrl : "Todos";

  function renderFiltros() {
    $("#filters").innerHTML = ["Todos", ...categorias]
      .map((c) => `<button type="button" class="filter" data-cat="${escapar(c)}" aria-pressed="${c === filtro}" aria-label="${escapar(c)}, ${c === "Todos" ? PRODUCTOS.length : cuenta(c)} productos">${escapar(c)}<small>${c === "Todos" ? PRODUCTOS.length : cuenta(c)}</small></button>`)
      .join("");
  }

  function bloquePrecio(p, grande) {
    if (!p.precio) return `<span class="item__price item__price--consultar">Consultar precio</span>`;
    const antes = p.precioAnterior && p.precioAnterior > p.precio ? `<s class="item__before">${pesos.format(p.precioAnterior)}</s>` : "";
    const transf = descuento ? `<span class="item__transfer">${pesos.format(conTransferencia(p.precio))} con transferencia</span>` : "";
    return `<span class="item__prices${grande ? " is-big" : ""}">${antes}<span class="item__price">${pesos.format(p.precio)}</span>${transf}</span>`;
  }
  function etiquetaDe(p) {
    if (p.etiqueta) return p.etiqueta;
    if (p.precio && p.precioAnterior > p.precio) return `-${Math.round((1 - p.precio / p.precioAnterior) * 100)}%`;
    return "";
  }

  function tarjeta(p, i, n) {
    const etiqueta = etiquetaDe(p);
    const media = p.imagen
      ? `<img src="${escapar(p.imagen)}" alt="" width="480" height="480" loading="lazy" decoding="async">`
      : `<span class="item__noimg" aria-hidden="true">Sin foto</span>`;
    return `
      <li class="item" style="--n:${n}">
        <button type="button" class="item__open" data-ver="${i}" aria-label="Ver detalle de ${escapar(p.nombre)}">
          <span class="item__media">${media}${etiqueta ? `<span class="item__tag">${escapar(etiqueta)}</span>` : ""}</span>
        </button>
        <h4>${escapar(p.nombre)}</h4>
        ${p.medidas ? `<p class="item__specs">${escapar(p.medidas)}</p>` : ""}
        ${p.incluye.length ? `<p class="item__incluye">Incluye: ${p.incluye.map(escapar).join(" + ")}</p>` : `<p>${escapar(p.descripcion)}</p>`}
        <div class="item__foot">${bloquePrecio(p)}<button type="button" class="item__add" data-add="${i}" aria-label="Agregar ${escapar(p.nombre)} al pedido">Agregar al pedido</button></div>
      </li>`;
  }

  let busqueda = "";
  function renderProductos() {
    if (busqueda) {
      const q = sinTildes(busqueda);
      const items = PRODUCTOS.map((p, i) => [p, i]).filter(([p]) => sinTildes(`${p.nombre} ${p.categoria} ${p.descripcion} ${p.medidas}`).includes(q));
      $("#products").innerHTML = items.length
        ? `<section class="group" aria-labelledby="g-resultados">
            <h3 class="group__title" id="g-resultados">Resultados <small>${items.length} ${items.length === 1 ? "producto" : "productos"}</small></h3>
            <ul class="grid">${items.map(([p, i], n) => tarjeta(p, i, n)).join("")}</ul>
          </section>`
        : `<div class="vacio"><p>No encontramos “${escapar(busqueda)}”. Probá con otra palabra, como “disco” o “mechero”, o consultanos por WhatsApp.</p></div>`;
      observarGrupos();
      avisar(items.length ? `${items.length} resultados` : "Sin resultados");
      return;
    }
    const visibles = filtro === "Todos" ? categorias : [filtro];
    $("#products").innerHTML = visibles
      .map((c) => {
        const items = PRODUCTOS.map((p, i) => [p, i]).filter(([p]) => p.categoria === c);
        return `
        <section class="group" aria-labelledby="g-${slug(c)}">
          <h3 class="group__title" id="g-${slug(c)}">${escapar(c)} <small>${items.length} ${items.length === 1 ? "producto" : "productos"}</small></h3>
          <ul class="grid">${items.map(([p, i], n) => tarjeta(p, i, n)).join("")}</ul>
        </section>`;
      })
      .join("");
    observarGrupos();
  }

  // Aparición escalonada de productos (solo si el visitante no desactivó las animaciones)
  const sinMovimiento = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const observador = !sinMovimiento && "IntersectionObserver" in window
    ? new IntersectionObserver((entradas) => entradas.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add("is-visible"); observador.unobserve(e.target); }
      }), { rootMargin: "0px 0px -10% 0px" })
    : null;
  if (observador) document.documentElement.classList.add("js-reveal");
  function observarGrupos() {
    if (observador) document.querySelectorAll(".group").forEach((g) => observador.observe(g));
  }

  let esperaBusqueda;
  $("#buscar").addEventListener("input", (e) => {
    clearTimeout(esperaBusqueda);
    esperaBusqueda = setTimeout(() => { busqueda = e.target.value.trim(); renderProductos(); }, 180);
  });

  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    filtro = b.dataset.cat;
    busqueda = ""; $("#buscar").value = "";
    const url = new URL(location.href);
    if (filtro === "Todos") url.searchParams.delete("cat");
    else url.searchParams.set("cat", filtro);
    try { history.replaceState(null, "", url); } catch (_) {}
    const cambiar = () => { renderFiltros(); renderProductos(); };
    if (document.startViewTransition && !sinMovimiento) document.startViewTransition(cambiar);
    else cambiar();
  });

  // Pedido (carrito). Se guarda por nombre de producto para que no se mezcle si cambia el orden del catálogo.
  let carrito = {};
  try { carrito = JSON.parse(localStorage.getItem("adf-pedido")) || {}; } catch (_) {}
  const indice = Object.fromEntries(PRODUCTOS.map((p, i) => [p.nombre, i]));
  const guardar = () => { try { localStorage.setItem("adf-pedido", JSON.stringify(carrito)); } catch (_) {} };
  const lineasCarrito = () => Object.entries(carrito).filter(([n]) => n in indice).map(([n, q]) => [PRODUCTOS[indice[n]], q]);

  let yaMostrados = new Set(); // solo se anima el producto recién agregado
  function renderCarrito() {
    const items = lineasCarrito();
    const unidades = items.reduce((n, [, q]) => n + q, 0);
    const total = items.reduce((t, [p, q]) => t + (p.precio || 0) * q, 0);
    const consultar = items.some(([p]) => !p.precio);
    $("#cart-count").textContent = unidades;
    $(".cart-btn").classList.toggle("has-items", unidades > 0);
    $(".cart-btn").setAttribute("aria-label", `Ver pedido, ${unidades} ${unidades === 1 ? "producto" : "productos"}`);
    $("#cart-empty").hidden = items.length > 0;
    $("#cart-total").innerHTML = total
      ? `<span>Total${consultar ? " (sin los productos a consultar)" : ""}</span><span>${pesos.format(total)}</span>` +
        (descuento ? `<small class="cart__transfer"><span>Con transferencia (${descuento}% off)</span><span>${pesos.format(conTransferencia(total))}</span></small>` : "")
      : "";
    $("#cart-items").innerHTML = items
      .map(
        ([p, q]) => `
      <li class="cart__item${yaMostrados.has(p.nombre) ? "" : " is-new"}">
        <div><strong>${escapar(p.nombre)}</strong><small>${p.precio ? pesos.format(p.precio) + " c/u" : "Consultar precio"}</small></div>
        <div class="qty">
          <button type="button" data-dec="${escapar(p.nombre)}" aria-label="Quitar uno de ${escapar(p.nombre)}">−</button>
          <span>${q}</span>
          <button type="button" data-inc="${escapar(p.nombre)}" aria-label="Agregar uno de ${escapar(p.nombre)}">+</button>
        </div>
      </li>`
      )
      .join("");
    yaMostrados = new Set(items.map(([p]) => p.nombre));
    linkPedido();
  }

  const cart = $("#cart");
  let volverA = null;
  let cierre = null;
  function abrirCarrito() {
    volverA = document.activeElement;
    clearTimeout(cierre);
    cart.classList.remove("is-closing");
    cart.hidden = false;
    document.body.style.overflow = "hidden";
    $(".cart__close").focus();
  }
  function cerrarCarrito() {
    if (cart.hidden || cart.classList.contains("is-closing")) return;
    const terminar = () => { cart.hidden = true; cart.classList.remove("is-closing"); };
    if (sinMovimiento) terminar();
    else { cart.classList.add("is-closing"); cierre = setTimeout(terminar, 200); }
    document.body.style.overflow = "";
    if (volverA) volverA.focus();
  }

  $("#products").addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    const p = PRODUCTOS[b.dataset.add];
    carrito[p.nombre] = (carrito[p.nombre] || 0) + 1;
    guardar();
    renderCarrito();
    avisar(`${p.nombre} agregado al pedido`);
    const btnCarrito = $(".cart-btn");
    const saltar = () => { btnCarrito.classList.remove("bump"); void btnCarrito.offsetWidth; btnCarrito.classList.add("bump"); };
    const foto = b.closest(".item").querySelector("img");
    if (foto && !sinMovimiento && foto.animate) {
      const de = foto.getBoundingClientRect(), a = btnCarrito.getBoundingClientRect();
      const clon = foto.cloneNode();
      clon.removeAttribute("loading");
      clon.className = "vuela";
      Object.assign(clon.style, { left: de.left + "px", top: de.top + "px", width: de.width + "px", height: de.height + "px" });
      document.body.appendChild(clon);
      const dx = a.left + a.width / 2 - (de.left + de.width / 2), dy = a.top + a.height / 2 - (de.top + de.height / 2);
      clon.animate([
        { transform: "translate(0, 0) scale(1)", opacity: 1 },
        { transform: `translate(${dx * 0.5}px, ${dy * 0.5 - 120}px) scale(.45) rotate(-8deg)`, opacity: 1, offset: 0.5 },
        { transform: `translate(${dx}px, ${dy}px) scale(.08) rotate(-20deg)`, opacity: 0.4 },
      ], { duration: 600, easing: "cubic-bezier(.645, .045, .355, 1)" }).finished.then(() => { clon.remove(); saltar(); }, () => clon.remove());
    } else saltar();
    b.textContent = "Agregado";
    b.classList.add("is-added");
    setTimeout(() => { b.textContent = "Agregar al pedido"; b.classList.remove("is-added"); }, 1200);
  });

  $("#cart-items").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    if (inc) carrito[inc.dataset.inc]++;
    if (dec && --carrito[dec.dataset.dec] <= 0) {
      delete carrito[dec.dataset.dec];
      avisar(`${dec.dataset.dec} quitado del pedido`);
    }
    guardar();
    renderCarrito();
    if (!lineasCarrito().length) $(".cart__close").focus();
  });

  $(".cart-btn").addEventListener("click", abrirCarrito);
  cart.addEventListener("click", (e) => { if (e.target.closest("[data-close]")) cerrarCarrito(); });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!cart.hidden) cerrarCarrito();
    else if (menu.classList.contains("is-open")) { cerrarMenu(); toggle.focus(); }
  });
  // Mantener el foco dentro del pedido mientras está abierto
  cart.addEventListener("keydown", (e) => {
    if (e.key !== "Tab") return;
    const f = [...cart.querySelectorAll("button:not([disabled]), input, a[href]:not([aria-disabled=\"true\"])")];
    const [primero, ultimo] = [f[0], f[f.length - 1]];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });

  // El envío es un link común (funciona aunque el navegador bloquee ventanas emergentes)
  function linkPedido() {
    const nombre = $("#cart-name").value.trim();
    const items = lineasCarrito();
    const lineas = items.map(([p, q]) => `• ${q} x ${p.nombre}${p.precio ? ` (${pesos.format(p.precio)} c/u)` : ""}`);
    const total = items.reduce((t, [p, q]) => t + (p.precio || 0) * q, 0);
    const texto = `¡Hola Amantes del Fuego!${nombre ? ` Soy ${nombre}.` : ""}\nQuiero hacer este pedido:\n${lineas.join("\n")}${total ? `\n\nTotal aprox.: ${pesos.format(total)}` : ""}${total && descuento ? `\nCon transferencia (${descuento}% off): ${pesos.format(conTransferencia(total))}` : ""}`;
    const envio = $("#cart-send");
    envio.href = items.length ? waUrl(texto) : "#";
    envio.setAttribute("aria-disabled", String(!items.length));
  }
  $("#cart-name").addEventListener("input", linkPedido);
  $("#cart-send").addEventListener("click", (e) => { if (!lineasCarrito().length) e.preventDefault(); });

  // Video del catálogo: se reproduce solo cuando está en pantalla; siempre se puede pausar
  const video = $("#reel-video");
  const btnVideo = $("#reel-toggle");
  let pausadoPorUsuario = sinMovimiento;
  const marcarVideo = () => {
    const sonando = !video.paused;
    btnVideo.classList.toggle("is-playing", sonando);
    btnVideo.setAttribute("aria-label", sonando ? "Pausar video" : "Reproducir video");
  };
  video.addEventListener("play", marcarVideo);
  video.addEventListener("pause", marcarVideo);
  btnVideo.addEventListener("click", () => {
    if (video.paused) { pausadoPorUsuario = false; video.play().catch(() => {}); }
    else { pausadoPorUsuario = true; video.pause(); }
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !pausadoPorUsuario) video.play().catch(() => {});
      else if (!e.isIntersecting) video.pause();
    }, { threshold: 0.4 }).observe(video);
  }

  // Botón para pausar las animaciones continuas (cinta, brasa y chispas). Se recuerda en este navegador.
  const raiz = document.documentElement;
  const btnPausa = $("#pausa-anim");
  let animPausada = false;
  try { animPausada = localStorage.getItem("adf-pausa") === "1"; } catch (_) {}
  function aplicarPausa() {
    raiz.classList.toggle("pausado", animPausada);
    btnPausa.setAttribute("aria-label", animPausada ? "Reanudar animaciones" : "Pausar animaciones");
    document.dispatchEvent(new CustomEvent("adf-pausa", { detail: animPausada }));
  }
  btnPausa.addEventListener("click", () => {
    animPausada = !animPausada;
    try { localStorage.setItem("adf-pausa", animPausada ? "1" : "0"); } catch (_) {}
    aplicarPausa();
    avisar(animPausada ? "Animaciones pausadas" : "Animaciones reanudadas");
  });

  // Chispas que suben desde la brasa de la portada
  const canvas = $("#chispas");
  if (canvas && !sinMovimiento) {
    const ctx = canvas.getContext("2d");
    let w = 0, h = 0, chispas = [], activo = true, corriendo = true, ultimo = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const medir = () => {
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    const nueva = (alAzar) => ({
      x: w / 2 + (Math.random() - 0.5) * w * 0.6,
      y: alAzar ? h * (0.4 + Math.random() * 0.6) : h + 10,
      r: 0.8 + Math.random() * 1.8,
      vy: 25 + Math.random() * 55,
      vx: (Math.random() - 0.5) * 18,
      fase: Math.random() * Math.PI * 2,
      vida: 0.55 + Math.random() * 0.4,
    });
    const cantidad = () => Math.round(Math.min(70, w / 18));
    const puntero = { x: -999, y: -999 };
    const hero = canvas.closest(".hero");
    const posicion = (e) => { const r = canvas.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top]; };
    hero.addEventListener("pointermove", (e) => { [puntero.x, puntero.y] = posicion(e); });
    hero.addEventListener("pointerleave", () => { puntero.x = puntero.y = -999; });
    hero.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a, button")) return;
      const [x, y] = posicion(e);
      for (let i = 0; i < 22; i++) {
        const ang = -Math.PI / 2 + (Math.random() - 0.5) * 2.2, vel = 60 + Math.random() * 160;
        chispas.push({ x, y, r: 0.8 + Math.random() * 1.6, vx: Math.cos(ang) * vel, vy: -Math.sin(ang) * vel, fase: Math.random() * 6, vida: Math.min(1, 1 - y / h + 0.2 + Math.random() * 0.25), extra: true });
      }
    });
    medir();
    chispas = Array.from({ length: cantidad() }, () => nueva(true));
    addEventListener("resize", () => { medir(); chispas.length = Math.min(chispas.length, cantidad()); });

    function cuadro(t) {
      if (!activo) { corriendo = false; return; }
      const dt = Math.min((t - ultimo) / 1000 || 0, 0.05);
      ultimo = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      while (chispas.filter((c) => !c.extra).length < cantidad()) chispas.push(nueva(false));
      for (let i = chispas.length - 1; i >= 0; i--) {
        const c = chispas[i];
        // El puntero sopla las brasas: las chispas cercanas se apartan
        const px = c.x - puntero.x, py = c.y - puntero.y, d = Math.hypot(px, py);
        if (d < 110 && d > 0) { const f = (110 - d) * 4 * dt; c.x += (px / d) * f; c.y += (py / d) * f; }
        if (c.extra) { c.vx *= 1 - 1.2 * dt; c.vy = c.vy * (1 - 1.2 * dt) + 30 * dt; }
        c.y -= c.vy * dt;
        c.x += (c.vx + Math.sin(t / 600 + c.fase) * 12) * dt;
        const altura = 1 - c.y / h; // 0 abajo, 1 arriba
        if (altura > c.vida || c.y < -10 || c.x < -20 || c.x > w + 20) {
          if (c.extra || chispas.length > cantidad()) chispas.splice(i, 1);
          else chispas[i] = nueva(false);
          continue;
        }
        const alfa = Math.max(0, 1 - altura / c.vida) * (0.7 + 0.3 * Math.sin(t / 90 + c.fase));
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 4);
        g.addColorStop(0, `rgba(255, 210, 140, ${alfa})`);
        g.addColorStop(0.35, `rgba(255, 120, 40, ${alfa * 0.8})`);
        g.addColorStop(1, "rgba(203, 49, 39, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * 4, 0, Math.PI * 2);
        ctx.fill();
      }
      requestAnimationFrame(cuadro);
    }
    // Pausar cuando la portada no se ve o la pestaña está oculta
    const reanudar = () => { activo = true; if (!corriendo) { corriendo = true; ultimo = performance.now(); requestAnimationFrame(cuadro); } };
    let enPantalla = true;
    const decidir = () => (enPantalla && !document.hidden && !animPausada ? reanudar() : (activo = false));
    new IntersectionObserver(([e]) => { enPantalla = e.isIntersecting; decidir(); }).observe(canvas);
    document.addEventListener("visibilitychange", decidir);
    document.addEventListener("adf-pausa", decidir);
    requestAnimationFrame(cuadro);
  }

  // Barra de progreso y palabras de "Nosotros" que se encienden al bajar
  const progreso = $("#progreso");
  const frase = $(".about__statement");
  frase.innerHTML = frase.textContent.trim().split(/\s+/).map((p) => `<span class="w">${escapar(p)}</span> `).join("");
  const palabras = [...frase.querySelectorAll(".w")];
  let pendiente = false;
  function alDesplazar() {
    pendiente = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    progreso.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    if (sinMovimiento) { palabras.forEach((w) => w.classList.add("on")); return; }
    const r = frase.getBoundingClientRect();
    const avance = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
    const encendidas = Math.round(avance * palabras.length);
    palabras.forEach((w, i) => w.classList.toggle("on", i < encendidas));
  }
  addEventListener("scroll", () => { if (!pendiente) { pendiente = true; requestAnimationFrame(alDesplazar); } }, { passive: true });
  addEventListener("resize", alDesplazar);
  alDesplazar();

  const pasos = $("#pasos");
  if ("IntersectionObserver" in window) {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { pasos.classList.add("is-in"); obs.disconnect(); } }, { threshold: 0.35 });
    obs.observe(pasos);
  } else pasos.classList.add("is-in");

  aplicarPausa();

  // Ficha de producto (se abre al tocar la foto)
  const ficha = $("#ficha");
  function abrirFicha(i) {
    const p = PRODUCTOS[i];
    const etiqueta = etiquetaDe(p);
    $("#ficha-contenido").innerHTML = `
      <div class="ficha__media">${p.imagen ? `<img src="${escapar(p.imagen)}" alt="${escapar(p.nombre)}" width="480" height="480">` : ""}${etiqueta ? `<span class="item__tag">${escapar(etiqueta)}</span>` : ""}</div>
      <div class="ficha__info">
        <p class="ficha__cat">${escapar(p.categoria)}</p>
        <h3 id="ficha-titulo">${escapar(p.nombre)}</h3>
        ${p.medidas ? `<p class="item__specs">${escapar(p.medidas)}</p>` : ""}
        ${p.descripcion ? `<p class="ficha__desc">${escapar(p.descripcion)}</p>` : ""}
        ${p.incluye.length ? `<div class="ficha__incluye"><h4>Incluye</h4><ul>${p.incluye.map((x) => `<li>${escapar(x)}</li>`).join("")}</ul></div>` : ""}
        ${bloquePrecio(p, true)}
        <div class="ficha__acciones">
          <button type="button" class="btn btn--primary" data-add-ficha="${i}">Agregar al pedido</button>
          <a class="btn btn--ghost" target="_blank" rel="noopener" href="${waUrl(`¡Hola Amantes del Fuego! Quería consultar por: ${p.nombre}`)}">Consultar por WhatsApp</a>
        </div>
      </div>`;
    ficha.showModal();
  }
  $("#products").addEventListener("click", (e) => { const b = e.target.closest("[data-ver]"); if (b) abrirFicha(+b.dataset.ver); });
  ficha.addEventListener("click", (e) => {
    if (e.target === ficha || e.target.closest("[data-cerrar-ficha]")) { ficha.close(); return; }
    const b = e.target.closest("[data-add-ficha]");
    if (!b) return;
    const p = PRODUCTOS[b.dataset.addFicha];
    carrito[p.nombre] = (carrito[p.nombre] || 0) + 1;
    guardar();
    renderCarrito();
    avisar(`${p.nombre} agregado al pedido`);
    b.textContent = "Agregado";
    const btnCarrito = $(".cart-btn");
    btnCarrito.classList.remove("bump"); void btnCarrito.offsetWidth; btnCarrito.classList.add("bump");
    setTimeout(() => { if (ficha.open) b.textContent = "Agregar otro"; }, 1200);
  });

  // Barra de promoción (pestaña Promos: la primera vigente)
  const promo = PROMOS[0];
  if (promo) {
    const barra = $("#anuncio");
    barra.innerHTML = `<p><strong>${escapar(promo.titulo)}</strong>${promo.texto ? ` <span>${escapar(promo.texto)}</span>` : ""}</p>` +
      (promo.categoria && categorias.includes(promo.categoria) ? `<button type="button" class="anuncio__ver" data-ir="${escapar(promo.categoria)}">Ver ${escapar(promo.categoria)}</button>` : "");
    barra.hidden = false;
    barra.addEventListener("click", (e) => {
      const b = e.target.closest("[data-ir]");
      if (!b) return;
      const f = document.querySelector(`.filter[data-cat="${CSS.escape(b.dataset.ir)}"]`);
      if (f) f.click();
      $("#catalogo").scrollIntoView({ behavior: sinMovimiento ? "auto" : "smooth" });
    });
  }

  // Cómo pagar y recibir (pestaña Ajustes). Solo se muestra lo que esté cargado.
  const avisos = [
    ["aviso_pagos", "Pagos", '<path d="M3 7h18v10H3zM3 11h18" fill="none" stroke="currentColor" stroke-width="2"/>'],
    ["aviso_envios", "Envíos", '<path d="M3 7h11v8H3zM14 10h4l3 3v2h-7z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><circle cx="7" cy="18" r="1.6" fill="currentColor"/><circle cx="17" cy="18" r="1.6" fill="currentColor"/>'],
    ["aviso_retiro", "Retiro", '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="10" r="2.5" fill="currentColor"/>'],
    ["aviso_garantia", "Garantía", '<path d="M12 3l8 3v6c0 4.5-3.4 8.2-8 9-4.6-.8-8-4.5-8-9V6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'],
  ].filter(([k]) => AJUSTES[k]);
  if (descuento) avisos.unshift(["", "Transferencia", '<path d="M4 9h13l-3-3M20 15H7l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>', `${descuento}% de descuento pagando con transferencia.`]);
  if (avisos.length) {
    $("#info").innerHTML = avisos.map(([k, t, icono, texto]) => `<li><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">${icono}</svg><div><strong>${t}</strong><span>${escapar(texto || AJUSTES[k])}</span></div></li>`).join("");
    $("#info").hidden = false;
  }

  // Datos estructurados (schema.org): URLs absolutas, horarios y catálogo desde productos.js
  try {
    const nodo = $("#schema-negocio");
    const datos = JSON.parse(nodo.textContent);
    const base = location.href.split(/[?#]/)[0];
    const abs = (r) => new URL(r, base).href;
    const dias = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    Object.assign(datos, {
      "@id": base + "#negocio",
      url: base,
      image: abs(datos.image),
      priceRange: (() => { const v = PRODUCTOS.map((p) => p.precio).filter(Boolean); return `${pesos.format(Math.min(...v))} - ${pesos.format(Math.max(...v))}`; })(),
      logo: abs(datos.logo),
      openingHoursSpecification: HORARIOS.map((h) => ({ "@type": "OpeningHoursSpecification", dayOfWeek: h.dias.map((d) => dias[d]), opens: h.desde, closes: h.hasta })),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Catálogo",
        itemListElement: categorias.map((c) => ({
          "@type": "OfferCatalog",
          name: c,
          itemListElement: PRODUCTOS.filter((p) => p.categoria === c).map((p) => ({
            "@type": "Offer",
            itemOffered: { "@type": "Product", name: p.nombre, description: p.descripcion, image: abs(p.imagen) },
            ...(p.precio ? { price: p.precio, priceCurrency: "ARS" } : {}),
          })),
        })),
      },
    });
    nodo.textContent = JSON.stringify(datos);
  } catch (_) {}

  renderFiltros();
  renderProductos();
  renderCarrito();
};
