(function () {
  const $ = (sel) => document.querySelector(sel);
  const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  const waUrl = (texto) => `https://wa.me/${NUMERO_WHATSAPP}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;
  const escapar = (t) => String(t).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
    el.textContent = abierto ? `Abierto ahora, hasta las ${hoy.hasta} hs` : "Cerrado ahora. Dejanos tu mensaje y te respondemos.";
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
      .map((c) => `<button type="button" class="filter" data-cat="${escapar(c)}" aria-pressed="${c === filtro}">${escapar(c)}<small>${c === "Todos" ? PRODUCTOS.length : cuenta(c)}</small></button>`)
      .join("");
  }

  function tarjeta(p, i, n) {
    const precio = p.precio
      ? `<span class="item__price">${pesos.format(p.precio)}</span>`
      : `<span class="item__price item__price--consultar">Consultar precio</span>`;
    return `
      <li class="item" style="--n:${n}">
        <div class="item__media"><img src="${escapar(p.imagen)}" alt="${escapar(p.nombre)}" width="480" height="480" loading="lazy" decoding="async"></div>
        <h4>${escapar(p.nombre)}</h4>
        <p>${escapar(p.descripcion)}</p>
        <div class="item__foot">${precio}<button type="button" class="item__add" data-add="${i}">Agregar al pedido</button></div>
      </li>`;
  }

  function renderProductos() {
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

  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    filtro = b.dataset.cat;
    const url = new URL(location.href);
    if (filtro === "Todos") url.searchParams.delete("cat");
    else url.searchParams.set("cat", filtro);
    history.replaceState(null, "", url);
    renderFiltros();
    renderProductos();
  });

  // Pedido (carrito). Se guarda por nombre de producto para que no se mezcle si cambia el orden del catálogo.
  let carrito = {};
  try { carrito = JSON.parse(localStorage.getItem("adf-pedido")) || {}; } catch (_) {}
  const indice = Object.fromEntries(PRODUCTOS.map((p, i) => [p.nombre, i]));
  const guardar = () => { try { localStorage.setItem("adf-pedido", JSON.stringify(carrito)); } catch (_) {} };
  const lineasCarrito = () => Object.entries(carrito).filter(([n]) => n in indice).map(([n, q]) => [PRODUCTOS[indice[n]], q]);

  function renderCarrito() {
    const items = lineasCarrito();
    const unidades = items.reduce((n, [, q]) => n + q, 0);
    const total = items.reduce((t, [p, q]) => t + (p.precio || 0) * q, 0);
    const consultar = items.some(([p]) => !p.precio);
    $("#cart-count").textContent = unidades;
    $(".cart-btn").classList.toggle("has-items", unidades > 0);
    $(".cart-btn").setAttribute("aria-label", `Ver pedido, ${unidades} ${unidades === 1 ? "producto" : "productos"}`);
    $("#cart-empty").hidden = items.length > 0;
    $("#cart-send").disabled = items.length === 0;
    $("#cart-total").innerHTML = total ? `<span>Total${consultar ? " (sin los de consultar)" : ""}</span><span>${pesos.format(total)}</span>` : "";
    $("#cart-items").innerHTML = items
      .map(
        ([p, q]) => `
      <li class="cart__item">
        <div><strong>${escapar(p.nombre)}</strong><small>${p.precio ? pesos.format(p.precio) + " c/u" : "Consultar precio"}</small></div>
        <div class="qty">
          <button type="button" data-dec="${escapar(p.nombre)}" aria-label="Quitar uno de ${escapar(p.nombre)}">−</button>
          <span>${q}</span>
          <button type="button" data-inc="${escapar(p.nombre)}" aria-label="Agregar uno de ${escapar(p.nombre)}">+</button>
        </div>
      </li>`
      )
      .join("");
  }

  const cart = $("#cart");
  let volverA = null;
  function abrirCarrito() {
    volverA = document.activeElement;
    cart.hidden = false;
    document.body.style.overflow = "hidden";
    $(".cart__close").focus();
  }
  function cerrarCarrito() {
    cart.hidden = true;
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
    btnCarrito.classList.remove("bump");
    void btnCarrito.offsetWidth;
    btnCarrito.classList.add("bump");
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
    const f = [...cart.querySelectorAll("button:not([disabled]), input")];
    const [primero, ultimo] = [f[0], f[f.length - 1]];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  });

  $("#cart-send").addEventListener("click", () => {
    const nombre = $("#cart-name").value.trim();
    const items = lineasCarrito();
    const lineas = items.map(([p, q]) => `• ${q} x ${p.nombre}${p.precio ? ` (${pesos.format(p.precio)} c/u)` : ""}`);
    const total = items.reduce((t, [p, q]) => t + (p.precio || 0) * q, 0);
    const texto = `¡Hola Amantes del Fuego!${nombre ? ` Soy ${nombre}.` : ""}\nQuiero hacer este pedido:\n${lineas.join("\n")}${total ? `\n\nTotal aprox.: ${pesos.format(total)}` : ""}`;
    window.open(waUrl(texto), "_blank", "noopener");
  });

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
    medir();
    chispas = Array.from({ length: cantidad() }, () => nueva(true));
    addEventListener("resize", () => { medir(); chispas.length = Math.min(chispas.length, cantidad()); });

    function cuadro(t) {
      if (!activo) { corriendo = false; return; }
      const dt = Math.min((t - ultimo) / 1000 || 0, 0.05);
      ultimo = t;
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = "lighter";
      while (chispas.length < cantidad()) chispas.push(nueva(false));
      chispas.forEach((c, i) => {
        c.y -= c.vy * dt;
        c.x += (c.vx + Math.sin(t / 600 + c.fase) * 12) * dt;
        const altura = 1 - c.y / h; // 0 abajo, 1 arriba
        if (altura > c.vida || c.y < -10) { chispas[i] = nueva(false); return; }
        const alfa = Math.max(0, 1 - altura / c.vida) * (0.7 + 0.3 * Math.sin(t / 90 + c.fase));
        const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.r * 4);
        g.addColorStop(0, `rgba(255, 210, 140, ${alfa})`);
        g.addColorStop(0.35, `rgba(255, 120, 40, ${alfa * 0.8})`);
        g.addColorStop(1, "rgba(203, 49, 39, 0)");
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(c.x, c.y, c.r * 4, 0, Math.PI * 2);
        ctx.fill();
      });
      requestAnimationFrame(cuadro);
    }
    // Pausar cuando la portada no se ve o la pestaña está oculta
    const reanudar = () => { activo = true; if (!corriendo) { corriendo = true; ultimo = performance.now(); requestAnimationFrame(cuadro); } };
    new IntersectionObserver(([e]) => (e.isIntersecting ? reanudar() : (activo = false))).observe(canvas);
    document.addEventListener("visibilitychange", () => (document.hidden ? (activo = false) : reanudar()));
    requestAnimationFrame(cuadro);
  }

  renderFiltros();
  renderProductos();
  renderCarrito();
})();
