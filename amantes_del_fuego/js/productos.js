/*
 * CATÁLOGO DE PRODUCTOS
 * ---------------------
 * Para agregar o editar productos, modificá solo esta lista.
 *
 *  - nombre:      nombre del producto
 *  - categoria:   los filtros del catálogo se arman solos con estas categorías
 *  - descripcion: texto corto
 *  - precio:      número sin puntos (ej: 142850) o null para mostrar "Consultar precio"
 *  - imagen:      ruta a la foto en img/productos/ (cuadrada, fondo blanco)
 */
const NUMERO_WHATSAPP = "5493402487788";

const img = (nombre) => `img/productos/${nombre}.jpg`;

const PRODUCTOS = [
  // DISCOS
  { nombre: "Disco de arado", categoria: "Discos", descripcion: "Tradición, sabor y calidad en un solo producto.", precio: 80340, imagen: img("disco-arado") },
  { nombre: "Disco de arado con tapa", categoria: "Discos", descripcion: "Prepará tus mejores comidas al fuego.", precio: 105600, imagen: img("disco-tapa") },
  { nombre: "Disco de arado con tapa bifera", categoria: "Discos", descripcion: "Disco de arado con tapa bifera, ideal para cocinar de todo.", precio: 130500, imagen: img("disco-tapa-bifera") },
  { nombre: "Disco de arado enlozado", categoria: "Discos", descripcion: "Disco de acero enlozado de gran resistencia.", precio: 142850, imagen: img("disco-enlozado") },
  { nombre: "Disco de arado enlozado con tapa", categoria: "Discos", descripcion: "Disco de acero enlozado de gran resistencia, con tapa.", precio: 173450, imagen: img("disco-enlozado-tapa") },
  { nombre: "Disco de arado enlozado con tapa bifera", categoria: "Discos", descripcion: "✔ Disco de arado enlozado. ✔ Tapa bifera.", precio: 251000, imagen: img("disco-enlozado-tapa-bifera") },
  { nombre: "Disco paellero plano Ø25", categoria: "Discos", descripcion: "Disco paellero plano fabricado en acero.", precio: 72950, imagen: img("disco-paellero-25") },
  { nombre: "Disco paellero plano Ø25 con tapa", categoria: "Discos", descripcion: "Disfrutá de la auténtica cocina al aire libre.", precio: null, imagen: img("disco-paellero-25-tapa") },
  { nombre: "Canasto para disco", categoria: "Discos", descripcion: "Canasto freidor para disco.", precio: 31950, imagen: img("canasto-disco") },
  { nombre: "Espumadera", categoria: "Discos", descripcion: "Espumadera para disco, imprescindible para freír.", precio: 15200, imagen: img("espumadera") },

  // MECHEROS
  { nombre: "Mechero simple un aro Ø19cm", categoria: "Mecheros", descripcion: "Mechero a gas de aro simple de 19 cm.", precio: 95340, imagen: img("mechero-simple-19") },
  { nombre: "Mechero doble hornalla una llave Ø32cm", categoria: "Mecheros", descripcion: "Potencia, resistencia y eficiencia en un solo equipo.", precio: 148560, imagen: img("mechero-doble-una-llave-32") },
  { nombre: "Mechero simple un comando Ø52cm", categoria: "Mecheros", descripcion: "La máxima potencia para grandes volúmenes.", precio: 167380, imagen: img("mechero-simple-52") },
  { nombre: "Mechero doble comando Ø32cm", categoria: "Mecheros", descripcion: "Máxima potencia y control para cocinar.", precio: 189720, imagen: img("mechero-doble-32") },
  { nombre: "Mechero doble comando Ø52cm", categoria: "Mecheros", descripcion: "Potencia y capacidad para grandes preparaciones.", precio: 232990, imagen: img("mechero-doble-52") },
  { nombre: "Mechero triple hornalla 3 comandos Ø32cm", categoria: "Mecheros", descripcion: "Potencia superior para los trabajos más exigentes.", precio: 249900, imagen: img("mechero-triple-32") },
  { nombre: "Pie para mechero Ø32cm", categoria: "Mecheros", descripcion: "Mayor comodidad, estabilidad y seguridad.", precio: 99750, imagen: img("pie-mechero-32") },

  // ESTACAS
  { nombre: "Estaca cruz de hierro", categoria: "Estacas", descripcion: "La opción ideal para los amantes del asado a la cruz.", precio: 158510, imagen: img("estaca-cruz-hierro") },
  { nombre: "Estaca cruz acero inoxidable", categoria: "Estacas", descripcion: "Llevá tus asados a otro nivel.", precio: 402370, imagen: img("estaca-cruz-inox") },

  // CUNITAS / LEÑEROS
  { nombre: "Cuna leñero hierro 46x26 Ø8", categoria: "Cunitas / Leñeros", descripcion: "Combina resistencia y practicidad.", precio: 51230, imagen: img("cuna-hierro-46x26") },
  { nombre: "Cuna leñero hierro 50x30 Ø10", categoria: "Cunitas / Leñeros", descripcion: "Combina funcionalidad y durabilidad.", precio: 86280, imagen: img("cuna-hierro-50x30") },
  { nombre: "Cuna leñero acero inoxidable 50x30 Ø8", categoria: "Cunitas / Leñeros", descripcion: "Estructura robusta en acero inoxidable.", precio: 285460, imagen: img("cuna-inox-50x30") },
];
