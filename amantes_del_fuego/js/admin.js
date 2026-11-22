(function () {
  const $ = (s) => document.querySelector(s);
  const pesos = new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", maximumFractionDigits: 0 });
  const esc = (t) => String(t ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const fecha = (d) => (d ? d.toLocaleDateString("es-AR") : "sin fecha");

  try { $("#link").value = localStorage.getItem("adf-planilla") || CONFIG.PLANILLA || ""; } catch (_) { $("#link").value = CONFIG.PLANILLA || ""; }

  $("#form-revisar").addEventListener("submit", async (e) => {
    e.preventDefault();
    const link = $("#link").value.trim();
    const boton = e.submitter;
    if (!/docs\.google\.com\/spreadsheets\/d\//.test(link)) {
      $("#estado").textContent = "Ese link no parece de Google Sheets. Copialo desde la barra del navegador con la planilla abierta.";
      $("#link").focus();
      return;
    }
    try { localStorage.setItem("adf-planilla", link); } catch (_) {}
    boton.disabled = true;
    $("#estado").textContent = "Leyendo la planilla…";
    try {
      mostrar(await ADF.leerPlanilla(link));
      $("#estado").textContent = `Revisada a las ${new Date().toLocaleTimeString("es-AR", { hour: "2-digit", minute: "2-digit" })}.`;
    } catch (err) {
      $("#resultado").hidden = true;
      $("#estado").textContent = `No se pudo leer la planilla: ${err.message}. Revisá que esté compartida como "Cualquier persona con el enlace: Lector" y que las pestañas se llamen Productos, Promos y Ajustes.`;
    } finally {
      boton.disabled = false;
    }
  });

  function mostrar(d) {
    const avisos = [];
    const activos = d.productos.filter((p) => p.nombre && p.activo);
    const ocultos = d.productos.filter((p) => p.nombre && !p.activo);
    const vistos = new Map();
    d.productos.forEach((p, i) => {
      const fila = `Fila ${i + 2}`;
      if (!p.nombre) { if (p.precio || p.categoria !== "Otros") avisos.push(["error", `${fila}: tiene datos pero le falta el nombre, así que no se muestra.`]); return; }
      if (vistos.has(p.nombre)) avisos.push(["error", `${fila}: "${p.nombre}" está repetido (también en la fila ${vistos.get(p.nombre)}). Cambiá uno de los nombres.`]);
      vistos.set(p.nombre, i + 2);
      if (!p.activo) return;
      if (!p.precio) avisos.push(["", `${fila}: "${p.nombre}" no tiene precio y va a decir "Consultar precio".`]);
      if (!p.imagen) avisos.push(["error", `${fila}: "${p.nombre}" no tiene foto.`]);
      if (p.precioAnterior && p.precio && p.precioAnterior <= p.precio) avisos.push(["error", `${fila}: "${p.nombre}" tiene precio_anterior menor o igual al precio. Para una oferta, el anterior tiene que ser más alto.`]);
      if (p.categoria === "Otros") avisos.push(["", `${fila}: "${p.nombre}" no tiene categoría y va a aparecer en "Otros".`]);
    });
    const hoy = new Date();
    d.promos.forEach((p, i) => {
      if (!p.titulo) return;
      if (ADF.promoVigente(p, hoy)) avisos.push(["ok", `Promo vigente: "${p.titulo}" (hasta ${fecha(p.hasta)}).`]);
      else if (p.activa && p.desde && hoy < p.desde) avisos.push(["", `Promo programada: "${p.titulo}" empieza el ${fecha(p.desde)}.`]);
      else if (p.activa && p.hasta) avisos.push(["", `Promo vencida: "${p.titulo}" terminó el ${fecha(p.hasta)}. Podés poner activa = no o borrarla.`]);
      if (p.categoria && !activos.some((x) => x.categoria === p.categoria)) avisos.push(["error", `Promo fila ${i + 2}: la categoría "${p.categoria}" no existe en Productos.`]);
    });
    const desc = parseFloat(String(d.ajustes.descuento_transferencia || "").replace(",", "."));
    if (d.ajustes.descuento_transferencia && !(desc > 0 && desc <= 50)) avisos.push(["error", `Ajustes: descuento_transferencia tiene que ser un número entre 1 y 50 (ahora dice "${d.ajustes.descuento_transferencia}").`]);
    if (!avisos.some(([t]) => t === "error")) avisos.unshift(["ok", "No hay errores. La planilla está lista."]);

    const categorias = [...new Set(activos.map((p) => p.categoria))];
    $("#resumen").innerHTML = [
      [activos.length, "productos visibles"], [ocultos.length, "ocultos"], [categorias.length, "categorías"],
      [d.promos.filter((p) => ADF.promoVigente(p)).length, "promos vigentes"], [desc > 0 ? `${desc}%` : "—", "desc. transferencia"],
    ].map(([n, t]) => `<div><b>${esc(n)}</b>${esc(t)}</div>`).join("");
    $("#avisos").innerHTML = avisos.map(([t, m]) => `<li class="${t}">${esc(m)}</li>`).join("");
    $("#filas").innerHTML = d.productos.filter((p) => p.nombre).map((p) => `
      <tr>
        <td>${p.imagen ? `<img src="${esc(p.imagen)}" alt="" loading="lazy" width="48" height="48">` : "—"}</td>
        <td>${esc(p.nombre)}${p.incluye.length ? `<br><small>Incluye: ${esc(p.incluye.join(" + "))}</small>` : ""}</td>
        <td>${esc(p.categoria)}</td>
        <td class="num">${p.precio ? pesos.format(p.precio) : "Consultar"}</td>
        <td class="num">${p.precioAnterior ? pesos.format(p.precioAnterior) : ""}</td>
        <td>${esc(p.etiqueta)}</td>
        <td>${p.activo ? "Visible" : "Oculto"}</td>
      </tr>`).join("");
    $("#resultado").hidden = false;
  }
})();
