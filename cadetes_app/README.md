# Cadetería

Aplicación web para que **comercios** sin cadete propio encuentren **cadetes**, y para que los cadetes encuentren comercios donde trabajar.

Hecha con Django 5 y Bootstrap 5.

## Funcionalidades

**Comercios**
- Perfil del comercio (rubro, zona, dirección, teléfono).
- Publicar, editar y pausar ofertas: zona de reparto, horario, vehículo requerido y forma de pago (por envío, hora, turno o mensual).
- Buscar cadetes disponibles filtrando por zona, vehículo o palabra clave.
- Invitar a un cadete a una oferta.
- Aceptar o rechazar postulaciones.

**Cadetes**
- Perfil con zona, vehículo, horarios y experiencia; switch "busco trabajo" para aparecer (o no) en las búsquedas.
- Ver y filtrar ofertas, postularse con un mensaje.
- Ofertas sugeridas en el panel según su zona y vehículo.
- Ver comercios y sus ofertas activas; aceptar o rechazar invitaciones.

**Privacidad:** el teléfono y la dirección de cada parte se muestran recién cuando una postulación o invitación es **aceptada**.

## Cómo correrla

```bash
cd cadetes_app
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py datos_demo        # opcional: datos de ejemplo (contraseña demo1234)
python manage.py createsuperuser   # opcional: acceso a /admin
python manage.py runserver
```

Abrí http://127.0.0.1:8000. Usuarios de demo: `rotiseria`, `farmacia`, `heladeria` (comercios) y `lucas`, `sofia`, `martin`, `carla` (cadetes).

## Tests

```bash
python manage.py test
```

## Producción

Configurar las variables de entorno `DJANGO_SECRET_KEY`, `DJANGO_DEBUG=0` y `DJANGO_ALLOWED_HOSTS`.

## Estructura

- `core/models.py` — `Usuario` (con rol), `PerfilComercio`, `PerfilCadete`, `Oferta`, `Postulacion`.
- `core/views.py` — registro, paneles, ofertas, búsquedas y respuestas.
- `templates/` — plantillas Bootstrap.

## Ideas para seguir

- Calificaciones entre comercios y cadetes después de trabajar juntos.
- Notificaciones por email o WhatsApp al recibir una postulación.
- Mapa con la ubicación de comercios y zonas de cobertura.
