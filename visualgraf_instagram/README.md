# Visual Graf: publicación de Instagram (carrusel)

Para **@visualgraf.tubolsaimpresa**. Carrusel de 6 placas en 1080×1350 (formato 4:5).
Subí las imágenes en orden: `slide-01.png` → `slide-06.png`.

Usa la marca real del proyecto `visualgraf/` (rama `claude/vigilant-fermat-m7ikxc`): logo VG, fondo tinta `#07070d`,
degradado arcoíris, Montserrat + DM Sans, y fotos reales de trabajos de `public/img/`.

| # | Placa | Objetivo |
|---|---|---|
| 1 | “Tu marca en la mano de tus clientes.” + bolsa Olivia Kids | Frenar el scroll |
| 2 | “Cada venta sale a la calle con tu logo.” | Por qué conviene una bolsa impresa |
| 3 | “Ya confían en nosotros”: 6 trabajos reales | Prueba social |
| 4 | Manija riñón: 5 medidas y precios, colores | Producto y precio claros |
| 5 | Pedido en 4 pasos (simulador, prueba de diseño, envío) | Quitar fricción |
| 6 | WhatsApp 3364 62-2890 · DM “QUIERO MIS BOLSAS” | Llamado a la acción |

> ⚠️ Antes de publicar: confirmá que los **precios** de la placa 4 sigan vigentes (salen de `src/lib/catalog.ts`)
> y que los clientes que aparecen estén de acuerdo en que se muestre su bolsa (ya figuran en la web como trabajos reales).

## Texto de la publicación (caption)

```
Tu marca, en la mano de tus clientes 🛍️

Cada venta que hacés sale a la calle. Si va en una bolsa con tu logo, se convierte en publicidad que camina: la ven en la vereda, en el colectivo y en cada casa a la que llega ✨

En Visual Graf imprimimos bolsas personalizadas en serigrafía para comercios y emprendimientos:
✅ Manija riñón alta densidad, en 5 medidas
✅ Packs desde 100 unidades
✅ Bolsa blanca, negra, cristal, lila o rosa + 11 colores de tinta
✅ Bolsas para hielo y para ecommerce
✅ Envíos a toda la Argentina 🇦🇷

¿Cómo pedirlas?
1️⃣ Elegís medida y color
2️⃣ Probás tu logo en el simulador de la web
3️⃣ Aprobás la prueba de diseño
4️⃣ Las recibís donde estés

📲 WhatsApp: 3364 62-2890
💬 O escribinos "QUIERO MIS BOLSAS" por DM
🌐 vgtubolsaimpresa.store (link en la bio)

📌 Guardá este post y compartilo con ese emprendedor que todavía entrega en bolsa lisa 😉

#VisualGraf #TuBolsaImpresa #BolsasPersonalizadas #BolsasConLogo #BolsasImpresas #Serigrafía #Packaging #PackagingPersonalizado #BolsasManijaRiñón #Emprendedores #EmprendedoresArgentinos #Emprendimiento #Comercios #Pymes
```

## Cómo publicarlo
- **Cuándo:** martes a jueves, de 12 a 13 h o de 19 a 21 h.
- **Música:** si Instagram ofrece agregar audio al carrusel, elegí uno en tendencia; suma alcance.
- **Colaboración:** invitá como **colaborador** a un cliente de la placa 3 (por ejemplo @mg_perfumate o @dobleg.sports).
  El post aparece en las dos cuentas.
- **Comentario fijado:** “¿Qué color de bolsa elegirías para tu marca? 🖤🤍💗💜🩵”
- **Historia el mismo día:** compartí el post con una encuesta: “¿Tu negocio ya tiene bolsas con logo? Sí / Todavía no”.
  A los que voten “Todavía no”, escribiles por DM.
- **Respuesta rápida para “QUIERO MIS BOLSAS”:**
  _“¡Hola! 🙌 Gracias por escribirnos. Contanos qué vendés y qué medida o cantidad necesitás, y mandanos tu logo.
  Mientras tanto podés probarlo gratis en vgtubolsaimpresa.store/personalizar 🛍️”_
- **Primera hora:** respondé todos los comentarios y DMs.

## Editar
Los textos están en `carrusel.html`. Para regenerar los PNG, pedíselo a Claude (renderiza con Playwright)
o abrí el HTML en Chrome y sacá una captura de cada placa.
