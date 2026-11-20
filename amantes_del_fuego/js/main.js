(function () {
  const $ = (sel) => document.querySelector(sel);
  const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  const waUrl = (texto) => `https://wa.me/${NUMERO_WHATSAPP}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;

  // Links generales de WhatsApp
  document.querySelectorAll(".js-wa-link").forEach((a) => {
    a.href = waUrl("¡Hola Amantes del Fuego! 🔥 Quería hacer una consulta.");
    a.target = "_blank";
    a.rel = "noopener";
  });
  $("#year").textContent = new Date().getFullYear();

  // Menú mobile
  const toggle = $(".nav__toggle");
  const links = $(".nav__links");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", open);
  });
  links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => links.classList.remove("is-open")));

  // Catálogo + filtros
  const categorias = ["Todos", ...new Set(PRODUCTOS.map((p) => p.categoria))];
  let filtro = "Todos";

  function renderFiltros() {
    $("#filters").innerHTML = categorias
      .map((c) => `<button type="button" class="filter${c === filtro ? " is-active" : ""}" data-cat="${c}">${c}</button>`)
      .join("");
  }

  function renderProductos() {
    const lista = PRODUCTOS.map((p, i) => ({ ...p, i })).filter((p) => filtro === "Todos" || p.categoria === filtro);
    $("#products").innerHTML = lista
      .map(
        (p) => `
      <article class="card">
        <div class="card__media">${p.imagen ? `<img src="${p.imagen}" alt="${p.nombre}" loading="lazy">` : `<span>${p.icono || "🔥"}</span>`}</div>
        <div class="card__body">
          <span class="card__cat">${p.categoria}</span>
          <h3>${p.nombre}</h3>
          <p>${p.descripcion}</p>
          <div class="card__foot">
            <strong>${p.precio ? pesos.format(p.precio) : "Consultar precio"}</strong>
            <button type="button" class="btn btn--small" data-add="${p.i}">Agregar</button>
          </div>
        </div>
      </article>`
      )
      .join("");
  }

  $("#filters").addEventListener("click", (e) => {
    const b = e.target.closest("[data-cat]");
    if (!b) return;
    filtro = b.dataset.cat;
    renderFiltros();
    renderProductos();
  });

  // Carrito (pedido por WhatsApp)
  let carrito = {};
  try { carrito = JSON.parse(localStorage.getItem("adf-carrito")) || {}; } catch (_) {}
  const guardar = () => { try { localStorage.setItem("adf-carrito", JSON.stringify(carrito)); } catch (_) {} };

  function renderCarrito() {
    const items = Object.entries(carrito).filter(([i]) => PRODUCTOS[i]);
    $("#cart-count").textContent = items.reduce((n, [, q]) => n + q, 0);
    $("#cart-empty").hidden = items.length > 0;
    $("#cart-send").disabled = items.length === 0;
    $("#cart-items").innerHTML = items
      .map(
        ([i, q]) => `
      <li class="cart__item">
        <span>${PRODUCTOS[i].nombre}</span>
        <div class="qty">
          <button type="button" data-dec="${i}" aria-label="Quitar uno">−</button>
          <span>${q}</span>
          <button type="button" data-inc="${i}" aria-label="Agregar uno">+</button>
        </div>
      </li>`
      )
      .join("");
  }

  const abrirCarrito = (abrir) => {
    $("#cart").classList.toggle("is-open", abrir);
    $("#cart").setAttribute("aria-hidden", !abrir);
  };

  $("#products").addEventListener("click", (e) => {
    const b = e.target.closest("[data-add]");
    if (!b) return;
    carrito[b.dataset.add] = (carrito[b.dataset.add] || 0) + 1;
    guardar();
    renderCarrito();
    b.textContent = "¡Agregado!";
    setTimeout(() => (b.textContent = "Agregar"), 900);
  });

  $("#cart-items").addEventListener("click", (e) => {
    const inc = e.target.closest("[data-inc]");
    const dec = e.target.closest("[data-dec]");
    if (inc) carrito[inc.dataset.inc]++;
    if (dec && --carrito[dec.dataset.dec] <= 0) delete carrito[dec.dataset.dec];
    guardar();
    renderCarrito();
  });

  $(".cart-btn").addEventListener("click", () => abrirCarrito(true));
  $(".cart__close").addEventListener("click", () => abrirCarrito(false));
  $("#cart").addEventListener("click", (e) => { if (e.target.id === "cart") abrirCarrito(false); });

  $("#cart-send").addEventListener("click", () => {
    const nombre = $("#cart-name").value.trim();
    const lineas = Object.entries(carrito).map(([i, q]) => `• ${q} x ${PRODUCTOS[i].nombre}`);
    const texto = `¡Hola Amantes del Fuego! 🔥${nombre ? ` Soy ${nombre}.` : ""}\nQuiero consultar por este pedido:\n${lineas.join("\n")}`;
    window.open(waUrl(texto), "_blank", "noopener");
  });

  renderFiltros();
  renderProductos();
  renderCarrito();
})();
