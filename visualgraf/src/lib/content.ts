// Textos editables del sitio. Cambiá acá sin tocar los componentes.
// Historia, clientes y datos tomados de vgtubolsaimpresa.store.

export const rubros = [
  "Indumentaria",
  "Perfumerías",
  "Fábricas de hielo",
  "Accesorios",
  "Limpieza y aromas",
  "Indumentaria deportiva",
  "Megastores",
  "Ecommerce",
  "Almacenes didácticos",
  "Emprendimientos",
];

export const steps = [
  {
    title: "Elegí tus bolsas",
    text: "Encontrá la medida y el color que necesitás. Revisá qué incluye cada pack antes de comprar.",
  },
  {
    title: "Probá tu logo",
    text: "Subilo al simulador y mirá cómo queda en la bolsa con el color de impresión que elijas.",
  },
  {
    title: "Coordiná tu diseño",
    text: "Compartí tu logo y tu número de pedido por WhatsApp para definir los detalles de impresión.",
  },
  {
    title: "Recibilo en todo el país",
    text: "Consultá los tiempos de producción y las opciones de envío para tu localidad.",
  },
];

export const benefits = [
  { title: "Tu logo, tu estilo", text: "Impresión serigráfica personalizada, nítida y resistente." },
  { title: "Desde 100 unidades", text: "Packs pensados para emprendimientos y comercios." },
  { title: "Pedidos por volumen", text: "Atención mayorista para comercios y empresas." },
  { title: "A todo el país", text: "Comprá online estés donde estés. Coordinamos tu envío." },
];

export type Work = { src: string; alt: string; name: string; detail: string };

export const works: Work[] = [
  { src: "/img/clientes/olivia.webp", alt: "Bolsa blanca impresa en rosa para Olivia Kids", name: "Olivia Kids", detail: "Indumentaria infantil" },
  { src: "/img/clientes/perfumate.webp", alt: "Bolsa negra de Perfúmate MG con impresión dorada", name: "Perfúmate MG", detail: "Perfumería" },
  { src: "/img/clientes/aromasol.webp", alt: "Bolsa blanca con manija riñón impresa para Aromasol", name: "Aromasol", detail: "Limpieza y aromas" },
  { src: "/img/clientes/dobleg-negra.webp", alt: "Bolsa negra impresa en blanco para Doble G Sports", name: "Doble G Sports", detail: "Indumentaria deportiva" },
  { src: "/img/clientes/thomas.webp", alt: "Bolsa transparente para hielo personalizada para Thomas Hielo", name: "Thomas Hielo", detail: "Fábrica de hielo" },
  { src: "/img/clientes/hiloazul.webp", alt: "Bolsa negra impresa para Hilo Azul", name: "Hilo Azul", detail: "Mercería" },
  { src: "/img/clientes/pame.webp", alt: "Bolsa blanca impresa para Pame Megastore", name: "Pame Megastore", detail: "Megastore" },
  { src: "/img/clientes/lifa.webp", alt: "Bolsa negra impresa para Lifa Accesorios", name: "Lifa Accesorios", detail: "Accesorios" },
  { src: "/img/clientes/rodecesari.webp", alt: "Bolsa blanca impresa para Ro de Cesari indumentaria", name: "Ro de Cesari", detail: "Indumentaria" },
  { src: "/img/bolsa-lila.webp", alt: "Bolsa lila pastel impresa para Muy Julieta", name: "Muy Julieta", detail: "Indumentaria" },
  { src: "/img/bolsa-blanca.webp", alt: "Bolsa blanca impresa para Vitalitto y Dolce Bloom", name: "Vitalitto & Dolce Bloom", detail: "Moda" },
  { src: "/img/bolsa-cristal.webp", alt: "Bolsa cristal impresa para Red de Aprendizaje", name: "Red de Aprendizaje", detail: "Almacén didáctico" },
];

export const faqs = [
  {
    q: "¿Puedo poner el logo de mi negocio?",
    a: "Sí, para eso estamos. Imprimimos el logo, nombre o diseño de tu marca en serigrafía. Podés probar cómo queda en el simulador y después compartirnos el archivo por WhatsApp con tu número de pedido.",
  },
  {
    q: "¿Cuál es la cantidad mínima?",
    a: "Las bolsas manija riñón se venden en packs de 100 unidades impresas a 1 cara 1 color. Para bolsas para hielo y ecommerce, consultanos las cantidades disponibles.",
  },
  {
    q: "¿Cómo consulto el plazo y el envío?",
    a: "Escribinos por WhatsApp con tu localidad y tu pedido. Te confirmamos el tiempo de producción y las opciones y el costo de envío antes de que cierres la compra.",
  },
  {
    q: "¿Hacen envíos a todo el país?",
    a: "Sí. Vendemos a toda la Argentina y coordinamos el despacho a tu localidad.",
  },
  {
    q: "¿En qué formato mando mi logo?",
    a: "Ideal en PDF, AI, SVG o PNG en buena calidad. Si solo tenés una imagen o una foto, mandala igual y te ayudamos a adaptarla para imprimir.",
  },
  {
    q: "¿Necesito otra medida o una cantidad especial?",
    a: "Te ayudamos a elegir. Contanos qué vendés y cómo entregás tus productos y te asesoramos con la medida, el formato y la impresión. También atendemos pedidos mayoristas.",
  },
  {
    q: "¿Cómo pago?",
    a: "Podés pagar online con Mercado Pago o coordinar transferencia por WhatsApp.",
  },
];

// Historia en primera persona, tomada de la sección "Sobre nosotros" de la web actual.
export const story = {
  kicker: "Mi historia",
  headline: "Hay sueños que no desaparecen. Solo esperan su momento.",
  intro:
    "Visual Graf no nació de un día para el otro. Es una idea que me acompaña desde que tenía 19 años y que, después de mucho trabajo, experiencia y aprendizaje, finalmente pude volver a poner en marcha.",
  quote: "Hace casi 18 años soñaba con tener mi propia imprenta. La vida me llevó por distintos caminos, pero ese sueño nunca desapareció.",
  milestones: [
    {
      tag: "Donde empezó todo",
      title: "Siempre me llamó la atención el mundo de la impresión",
      text: "Cuando tenía 19 años trabajaba en una fábrica de polietileno, dentro del área de impresión. Ahí descubrí un mundo que me atrapó: las máquinas, las tintas, los procesos. Viajé a Santa Fe para capacitarme, compré una computadora, herramientas y todo lo que podía pagar, y presenté el proyecto en un programa para emprendedores. Pero necesitaba una inversión mucho más grande. Tuve que dejarlo en pausa. Lo que nunca dejé atrás fue el nombre: Visual Graf.",
      image: "/img/produccion.webp",
      alt: "Producción de bolsas impresas apiladas en el taller",
    },
    {
      tag: "El camino",
      title: "Aprendí a imprimir, aprendí a vender",
      text: "Trabajé años con impresión flexográfica y aprendí el producto desde adentro: materiales, tintas, máquinas y terminaciones. Después desarrollé experiencia comercial: qué busca un cliente y qué hace que una bolsa realmente represente a su negocio. Así terminé entendiendo el negocio completo.",
      image: "/img/clientes/perfumate.webp",
      alt: "Bolsa negra con impresión dorada para Perfúmate MG",
    },
    {
      tag: "2021 · El punto de regreso",
      title: "Volví a las máquinas. Y volvió también aquella vieja idea",
      text: "En 2021 me ofrecieron volver a trabajar con impresión flexográfica. Todo lo que había imaginado a los 19 volvió a aparecer, pero esta vez tenía experiencia. Entendí que Visual Graf todavía tenía sentido: ya no quería una imprenta tradicional, quería especializarme en lo que conocía de verdad, la impresión de bolsas.",
      image: "/img/vg-marca.webp",
      alt: "Bolsa blanca impresa con el logo de Visual Graf",
    },
    {
      tag: "Visual Graf hoy",
      title: "Aquel sueño finalmente tiene forma",
      text: "Hoy Visual Graf se enfoca en la impresión y personalización de bolsas para comercios, emprendimientos, empresas y marcas. Empezamos con serigrafía y polietileno, y el objetivo es seguir creciendo: nuevos materiales, bolsas laminadas, otros sistemas de impresión y cada vez más soluciones.",
      image: "/img/ecommerce-rosa.webp",
      alt: "Bolsa rosa para ecommerce con el logo de Visual Graf",
    },
  ],
  stats: [
    { n: "19", label: "años tenía cuando empecé a imaginar Visual Graf" },
    { n: "4", label: "años como impresor flexográfico en una fábrica de polietileno" },
    { n: "4", label: "años en la comercialización de productos de polietileno" },
    { n: "8", label: "años de experiencia directa en el rubro" },
  ],
  closing:
    "Cuando un cliente me encarga una bolsa, para mí no se trata solamente de imprimir un logo. Se trata de ayudar a que su marca salga a la calle, llegue a más personas y sea recordada.",
  closingQuote:
    "Visual Graf empezó siendo un sueño cuando tenía 19 años. Hoy tengo la experiencia, el conocimiento y las ganas de llevarlo mucho más lejos.",
};
