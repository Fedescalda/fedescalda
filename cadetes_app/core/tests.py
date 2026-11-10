from django.test import TestCase
from django.urls import reverse

from .models import Oferta, PerfilCadete, PerfilComercio, Postulacion, Usuario


class Base(TestCase):
    def setUp(self):
        self.u_comercio = Usuario.objects.create_user("pizzeria", password="x", rol="comercio")
        self.comercio = PerfilComercio.objects.create(
            usuario=self.u_comercio,
            nombre="Pizzería Don Pepe",
            rubro="Pizzería",
            zona="Palermo",
            direccion="Av. Siempreviva 742",
            telefono="11-1111-1111",
        )
        self.u_cadete = Usuario.objects.create_user("juan", password="x", rol="cadete")
        self.cadete = PerfilCadete.objects.create(
            usuario=self.u_cadete,
            nombre="Juan Pérez",
            zona="Palermo",
            vehiculo="moto",
            telefono="11-2222-2222",
            horarios="Noches",
        )
        self.oferta = Oferta.objects.create(
            comercio=self.comercio,
            titulo="Cadete fines de semana",
            descripcion="Repartos de pizza",
            zona="Palermo",
            horario="Vie a Dom 20 a 24",
            vehiculo="moto",
            modalidad_pago="envio",
            monto=1500,
        )


class RegistroTests(TestCase):
    def test_registro_redirige_a_completar_perfil(self):
        r = self.client.post(
            reverse("registro"),
            {"username": "nuevo", "rol": "cadete", "password1": "ClaveSegura123", "password2": "ClaveSegura123"},
        )
        self.assertRedirects(r, reverse("perfil_editar"))
        self.assertEqual(Usuario.objects.get(username="nuevo").rol, "cadete")

    def test_panel_sin_perfil_redirige(self):
        Usuario.objects.create_user("sinperfil", password="x", rol="comercio")
        self.client.login(username="sinperfil", password="x")
        self.assertRedirects(self.client.get(reverse("panel")), reverse("perfil_editar"))

    def test_crear_perfil_cadete(self):
        Usuario.objects.create_user("ana", password="x", rol="cadete")
        self.client.login(username="ana", password="x")
        r = self.client.post(
            reverse("perfil_editar"),
            {"nombre": "Ana", "zona": "Belgrano", "vehiculo": "bici", "telefono": "123", "horarios": "Tardes", "disponible": "on"},
        )
        self.assertRedirects(r, reverse("panel"))
        self.assertTrue(PerfilCadete.objects.filter(nombre="Ana").exists())


class FlujoTests(Base):
    def test_listado_publico_y_filtros(self):
        r = self.client.get(reverse("ofertas_lista"), {"zona": "palermo", "vehiculo": "moto"})
        self.assertContains(r, "Cadete fines de semana")
        r = self.client.get(reverse("ofertas_lista"), {"zona": "Recoleta"})
        self.assertNotContains(r, "Cadete fines de semana")

    def test_cadete_se_postula_y_comercio_acepta(self):
        self.client.login(username="juan", password="x")
        self.client.post(reverse("postularse", args=[self.oferta.pk]), {"mensaje": "Tengo moto"})
        p = Postulacion.objects.get()
        self.assertEqual(p.origen, "cadete")

        # el cadete no puede aceptar su propia postulación
        r = self.client.post(reverse("postulacion_responder", args=[p.pk]), {"accion": "aceptar"})
        self.assertEqual(r.status_code, 403)

        # el teléfono del cadete está oculto antes de aceptar
        self.client.login(username="pizzeria", password="x")
        self.assertNotContains(self.client.get(reverse("cadete_detalle", args=[self.cadete.pk])), "11-2222-2222")

        self.client.post(reverse("postulacion_responder", args=[p.pk]), {"accion": "aceptar"})
        p.refresh_from_db()
        self.assertEqual(p.estado, "aceptada")
        self.assertContains(self.client.get(reverse("cadete_detalle", args=[self.cadete.pk])), "11-2222-2222")

    def test_postulacion_duplicada(self):
        self.client.login(username="juan", password="x")
        url = reverse("postularse", args=[self.oferta.pk])
        self.client.post(url, {"mensaje": "a"})
        self.client.post(url, {"mensaje": "b"})
        self.assertEqual(Postulacion.objects.count(), 1)

    def test_comercio_invita_y_cadete_acepta(self):
        self.client.login(username="pizzeria", password="x")
        self.client.post(
            reverse("cadete_detalle", args=[self.cadete.pk]),
            {"oferta": self.oferta.pk, "mensaje": "¿Te sumás?"},
        )
        p = Postulacion.objects.get()
        self.assertEqual(p.origen, "comercio")

        self.client.login(username="juan", password="x")
        self.assertNotContains(self.client.get(reverse("comercio_detalle", args=[self.comercio.pk])), "11-1111-1111")
        self.client.post(reverse("postulacion_responder", args=[p.pk]), {"accion": "aceptar"})
        self.assertContains(self.client.get(reverse("comercio_detalle", args=[self.comercio.pk])), "11-1111-1111")

    def test_permisos_por_rol(self):
        self.client.login(username="juan", password="x")
        self.assertEqual(self.client.get(reverse("cadetes_lista")).status_code, 403)
        self.assertEqual(self.client.get(reverse("oferta_nueva")).status_code, 403)
        self.client.login(username="pizzeria", password="x")
        self.assertEqual(self.client.get(reverse("comercios_lista")).status_code, 403)

    def test_comercio_no_edita_oferta_ajena(self):
        otro = Usuario.objects.create_user("otro", password="x", rol="comercio")
        PerfilComercio.objects.create(usuario=otro, nombre="Otro", rubro="Kiosco", zona="X", direccion="X", telefono="0")
        self.client.login(username="otro", password="x")
        self.assertEqual(self.client.get(reverse("oferta_editar", args=[self.oferta.pk])).status_code, 404)

    def test_oferta_pausada_no_se_lista(self):
        self.client.login(username="pizzeria", password="x")
        self.client.post(reverse("oferta_alternar", args=[self.oferta.pk]))
        self.client.logout()
        self.assertNotContains(self.client.get(reverse("ofertas_lista")), "Cadete fines de semana")

    def test_paneles_y_sugerencias(self):
        self.client.login(username="juan", password="x")
        self.assertContains(self.client.get(reverse("panel")), "Cadete fines de semana")
        self.client.login(username="pizzeria", password="x")
        self.assertContains(self.client.get(reverse("panel")), "Pizzería Don Pepe")
