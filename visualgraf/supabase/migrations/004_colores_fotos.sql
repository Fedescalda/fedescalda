-- Migración 004: etiqueta de color en las fotos base de productos (no pisa cambios hechos en el panel).
with tags(src, color) as (values
  ('/img/productos/manija-rinon-20x30.webp', 'blanco'),
  ('/img/productos/manija-rinon-25x35.webp', 'negro'),
  ('/img/productos/manija-rinon-30x40.webp', 'cristal'),
  ('/img/productos/manija-rinon-35x45.webp', 'negro'),
  ('/img/productos/manija-rinon-40x50.webp', 'lila'),
  ('/img/clientes/thomas.webp', 'cristal'),
  ('/img/clientes/thomas-grande.webp', 'cristal'),
  ('/img/bolsa-hielo.webp', 'cristal'),
  ('/img/tu-logo-aca.webp', 'cristal'),
  ('/img/ecommerce-rosa.webp', 'rosa')
)
update public.products p set updated_at = now(), images = (
  select jsonb_agg(
    case when t.color is not null and not (e ? 'color') then e || jsonb_build_object('color', t.color) else e end
    order by ord)
  from jsonb_array_elements(p.images) with ordinality as x(e, ord)
  left join tags t on t.src = e->>'src'
)
where exists (select 1 from jsonb_array_elements(p.images) e join tags t on t.src = e->>'src' where not (e ? 'color'));
