/*
 * CATÁLOGO DE PRODUCTOS
 * ---------------------
 * Para agregar o editar productos, modificá solo esta lista.
 *
 *  - nombre:     nombre del producto
 *  - categoria:  "Parrillas" | "Accesorios" | "Utensilios" | "Cuchillería" | "Otros"
 *  - descripcion: texto corto
 *  - precio:     número (ej: 45000) o null para mostrar "Consultar precio"
 *  - imagen:     ruta a la foto en img/productos/ (ej: "img/productos/parrilla-1.jpg")
 *                o null para mostrar un ícono
 *  - icono:      emoji que se muestra si no hay imagen
 *
 * Los productos de abajo son EJEMPLOS: reemplazalos por los del catálogo real.
 */
const NUMERO_WHATSAPP = "5493402487788";

const PRODUCTOS = [
  { nombre: "Parrilla de hierro", categoria: "Parrillas", descripcion: "Parrilla reforzada con varillas en V para juntar la grasa.", precio: null, imagen: null, icono: "🔥" },
  { nombre: "Parrilla portátil plegable", categoria: "Parrillas", descripcion: "Ideal para camping, quinchos y escapadas.", precio: null, imagen: null, icono: "🏕️" },
  { nombre: "Brasero / canasto para leña", categoria: "Parrillas", descripcion: "Para encender la leña y tener brasas siempre listas.", precio: null, imagen: null, icono: "🪵" },
  { nombre: "Disco de arado", categoria: "Parrillas", descripcion: "Para discadas, salteados y cocciones a fuego directo.", precio: null, imagen: null, icono: "🍳" },
  { nombre: "Set de asador", categoria: "Utensilios", descripcion: "Pinza, tenedor y cuchillo en estuche.", precio: null, imagen: null, icono: "🍴" },
  { nombre: "Pinza parrillera", categoria: "Utensilios", descripcion: "Acero inoxidable, mango largo.", precio: null, imagen: null, icono: "🥢" },
  { nombre: "Tenedor trinchante", categoria: "Utensilios", descripcion: "Para dar vuelta y servir los cortes.", precio: null, imagen: null, icono: "🔱" },
  { nombre: "Cuchillo de campo", categoria: "Cuchillería", descripcion: "Hoja de acero con mango de madera.", precio: null, imagen: null, icono: "🔪" },
  { nombre: "Tabla de madera", categoria: "Accesorios", descripcion: "Para cortar y servir el asado en la mesa.", precio: null, imagen: null, icono: "🪓" },
  { nombre: "Delantal parrillero", categoria: "Accesorios", descripcion: "Resistente, con bolsillos para los utensilios.", precio: null, imagen: null, icono: "🧑‍🍳" },
  { nombre: "Atizador y pala", categoria: "Accesorios", descripcion: "Para mover las brasas con comodidad.", precio: null, imagen: null, icono: "🧯" },
  { nombre: "Termómetro para carnes", categoria: "Accesorios", descripcion: "El punto justo, siempre.", precio: null, imagen: null, icono: "🌡️" },
];
