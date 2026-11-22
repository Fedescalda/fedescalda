/*
 * Carga de datos del sitio.
 * Lee las pestañas "Productos", "Promos" y "Ajustes" de la planilla de Google (CONFIG.PLANILLA).
 * Si no hay planilla o no responde, usa el respaldo de js/productos.js.
 * Cuando termina, llama a window.iniciarSitio(datos).
 */
(function () {
  // --- Utilidades compartidas con la página de administración ---
  const sinTildes = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();

  // CSV con comillas, comas y saltos de línea dentro de celdas
  function leerCSV(texto) {
    const filas = [];
    let fila = [], celda = "", comillas = false;
    for (let i = 0; i < texto.length; i++) {
      const c = texto[i];
      if (comillas) {
        if (c === '"' && texto[i + 1] === '"') { celda += '"'; i++; }
        else if (c === '"') comillas = false;
        else celda += c;
      } else if (c === '"') comillas = true;
      else if (c === ",") { fila.push(celda); celda = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && texto[i + 1] === "\n") i++;
        fila.push(celda); filas.push(fila); fila = []; celda = "";
      } else celda += c;
    }
    if (celda !== "" || fila.length) { fila.push(celda); filas.push(fila); }
    const [encabezado = [], ...resto] = filas.filter((f) => f.some((x) => x.trim() !== ""));
    const claves = encabezado.map(sinTildes);
    return resto.map((f) => Object.fromEntries(claves.map((k, i) => [k, (f[i] || "").trim()])));
  }

  // "$ 142.850,00" / "142850" / "142.850" -> 142850
  function leerPrecio(v) {
    const t = String(v || "").replace(/[^\d.,]/g, "");
    if (!t) return null;
    const n = Number(t.replace(/\.(?=\d{3}(\D|$))/g, "").replace(",", "."));
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  }

  const siNo = (v, porDefecto = true) => {
    const t = sinTildes(v);
    if (!t) return porDefecto;
    return !["no", "n", "0", "false", "falso", "oculto"].includes(t);
  };

  // dd/mm/aaaa o aaaa-mm-dd -> Date (inicio del día)
  function leerFecha(v) {
    const t = String(v || "").trim();
    let m = t.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{2,4})$/);
    if (m) return new Date(+(m[3].length === 2 ? "20" + m[3] : m[3]), +m[2] - 1, +m[1]);
    m = t.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    return null;
  }

  // Links de Google Drive -> imagen directa
  function leerImagen(v) {
    const t = String(v || "").trim();
    if (!t) return "";
    const drive = t.match(/drive\.google\.com\/(?:file\/d\/|open\?id=|uc\?(?:export=\w+&)?id=)([\w-]{20,})/);
    if (drive) return `https://lh3.googleusercontent.com/d/${drive[1]}=w800`;
    return t;
  }

  function normalizarProducto(f) {
    return {
      nombre: f.nombre || "",
      categoria: f.categoria || "Otros",
      descripcion: f.descripcion || "",
      precio: leerPrecio(f.precio),
      precioAnterior: leerPrecio(f.precio_anterior || f["precio anterior"]),
      medidas: f.medidas || "",
      imagen: leerImagen(f.imagen),
      etiqueta: f.etiqueta || "",
      incluye: (f.incluye || "").split(/\s*\+\s*|\s*;\s*/).filter(Boolean),
      activo: siNo(f.activo),
    };
  }

  function normalizarPromo(f) {
    return {
      titulo: f.titulo || "",
      texto: f.texto || "",
      desde: leerFecha(f.desde),
      hasta: leerFecha(f.hasta),
      activa: siNo(f.activa),
      categoria: f.categoria || "",
    };
  }

  function promoVigente(p, hoy = new Date()) {
    if (!p.activa || !p.titulo) return false;
    if (p.desde && hoy < p.desde) return false;
    if (p.hasta) { const fin = new Date(p.hasta); fin.setDate(fin.getDate() + 1); if (hoy >= fin) return false; }
    return true;
  }

  function idPlanilla(url) {
    const m = String(url || "").match(/\/spreadsheets\/d\/([\w-]{20,})/);
    return m ? m[1] : String(url || "").trim();
  }

  async function leerPestana(id, nombre) {
    const url = `https://docs.google.com/spreadsheets/d/${id}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(nombre)}&t=${Date.now()}`;
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`La pestaña "${nombre}" no respondió (${r.status})`);
    const texto = await r.text();
    if (/^\s*</.test(texto)) throw new Error("La planilla no está compartida como 'Cualquier persona con el enlace'");
    return leerCSV(texto);
  }

  async function leerPlanilla(url) {
    const id = idPlanilla(url);
    if (!id) throw new Error("Falta el link de la planilla");
    const [productos, promos, ajustes] = await Promise.all([
      leerPestana(id, "Productos"),
      leerPestana(id, "Promos").catch(() => []),
      leerPestana(id, "Ajustes").catch(() => []),
    ]);
    return {
      productos: productos.map(normalizarProducto),
      promos: promos.map(normalizarPromo),
      ajustes: Object.fromEntries(ajustes.filter((a) => a.clave).map((a) => [sinTildes(a.clave).replace(/\s+/g, "_"), a.valor])),
      origen: "planilla",
    };
  }

  function respaldo() {
    return {
      productos: PRODUCTOS.map((p) => ({ precioAnterior: null, medidas: "", etiqueta: "", incluye: [], activo: true, ...p })),
      promos: (typeof PROMOS !== "undefined" ? PROMOS : []).map((p) => ({ activa: true, ...p, desde: leerFecha(p.desde), hasta: leerFecha(p.hasta) })),
      ajustes: typeof AJUSTES !== "undefined" ? AJUSTES : {},
      origen: "respaldo",
    };
  }

  window.ADF = { leerCSV, leerPrecio, leerFecha, leerImagen, leerPlanilla, promoVigente, sinTildes, respaldo };

  // --- Arranque del sitio ---
  async function cargar() {
    let datos = respaldo();
    if (typeof CONFIG !== "undefined" && CONFIG.PLANILLA) {
      try {
        const desdePlanilla = await Promise.race([
          leerPlanilla(CONFIG.PLANILLA),
          new Promise((_, no) => setTimeout(() => no(new Error("La planilla tardó demasiado")), 6000)),
        ]);
        if (desdePlanilla.productos.some((p) => p.nombre && p.activo)) datos = desdePlanilla;
      } catch (e) {
        console.warn("Usando catálogo de respaldo:", e.message);
      }
    }
    datos.productos = datos.productos.filter((p) => p.nombre && p.activo);
    datos.promos = datos.promos.filter((p) => promoVigente(p));
    if (window.iniciarSitio) window.iniciarSitio(datos);
  }
  if (!window.ADF_SIN_ARRANQUE) cargar();
})();
