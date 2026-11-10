from django.core.management.base import BaseCommand

from core.models import Oferta, PerfilCadete, PerfilComercio, Usuario

COMERCIOS = [
    ("rotiseria", "Rotisería La Esquina", "Rotisería", "Palermo", "Gorriti 4500", "11-4000-0001"),
    ("farmacia", "Farmacia Central", "Farmacia", "Belgrano", "Cabildo 2100", "11-4000-0002"),
    ("heladeria", "Heladería Polo", "Heladería", "Caballito", "Rivadavia 5200", "11-4000-0003"),
]
CADETES = [
    ("lucas", "Lucas Gómez", "Palermo", "moto", "Lunes a sábado, noches"),
    ("sofia", "Sofía Ramírez", "Belgrano", "bici", "Mañanas y tardes"),
    ("martin", "Martín Díaz", "Caballito", "moto", "Fines de semana"),
    ("carla", "Carla Ruiz", "Palermo", "bici", "Tardes"),
]
OFERTAS = [
    ("rotiseria", "Cadete para delivery nocturno", "Repartos de comida en un radio de 20 cuadras.", "Palermo", "Mar a Dom 19 a 24", "moto", "envio", 1800),
    ("farmacia", "Cadete de mañana", "Entregas de medicamentos a domicilio.", "Belgrano", "Lun a Vie 9 a 14", "", "hora", 4500),
    ("heladeria", "Delivery de helado fines de semana", "Pedidos por apps y teléfono.", "Caballito", "Sáb y Dom 15 a 23", "moto", "turno", 25000),
]


class Command(BaseCommand):
    help = "Carga comercios, cadetes y ofertas de ejemplo (contraseña: demo1234)."

    def handle(self, *args, **options):
        comercios = {}
        for user, nombre, rubro, zona, direccion, tel in COMERCIOS:
            u, _ = Usuario.objects.get_or_create(username=user, defaults={"rol": "comercio"})
            u.set_password("demo1234")
            u.save()
            comercios[user], _ = PerfilComercio.objects.update_or_create(
                usuario=u,
                defaults=dict(nombre=nombre, rubro=rubro, zona=zona, direccion=direccion, telefono=tel),
            )
        for i, (user, nombre, zona, vehiculo, horarios) in enumerate(CADETES):
            u, _ = Usuario.objects.get_or_create(username=user, defaults={"rol": "cadete"})
            u.set_password("demo1234")
            u.save()
            PerfilCadete.objects.update_or_create(
                usuario=u,
                defaults=dict(nombre=nombre, zona=zona, vehiculo=vehiculo, horarios=horarios, telefono=f"11-5000-000{i}"),
            )
        for user, titulo, desc, zona, horario, vehiculo, pago, monto in OFERTAS:
            Oferta.objects.get_or_create(
                comercio=comercios[user],
                titulo=titulo,
                defaults=dict(descripcion=desc, zona=zona, horario=horario, vehiculo=vehiculo, modalidad_pago=pago, monto=monto),
            )
        self.stdout.write(self.style.SUCCESS("Datos de demo cargados. Usuarios: " + ", ".join(
            [c[0] for c in COMERCIOS] + [c[0] for c in CADETES]) + " (contraseña: demo1234)"))
