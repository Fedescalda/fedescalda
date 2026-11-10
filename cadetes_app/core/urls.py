from django.contrib.auth import views as auth_views
from django.urls import path

from . import views

urlpatterns = [
    path("", views.inicio, name="inicio"),
    path("registro/", views.registro, name="registro"),
    path("ingresar/", auth_views.LoginView.as_view(), name="login"),
    path("salir/", auth_views.LogoutView.as_view(), name="logout"),
    path("perfil/", views.perfil_editar, name="perfil_editar"),
    path("panel/", views.panel, name="panel"),
    path("ofertas/", views.ofertas_lista, name="ofertas_lista"),
    path("ofertas/nueva/", views.oferta_form, name="oferta_nueva"),
    path("ofertas/<int:pk>/", views.oferta_detalle, name="oferta_detalle"),
    path("ofertas/<int:pk>/editar/", views.oferta_form, name="oferta_editar"),
    path("ofertas/<int:pk>/alternar/", views.oferta_alternar, name="oferta_alternar"),
    path("ofertas/<int:pk>/postularse/", views.postularse, name="postularse"),
    path("cadetes/", views.cadetes_lista, name="cadetes_lista"),
    path("cadetes/<int:pk>/", views.cadete_detalle, name="cadete_detalle"),
    path("comercios/", views.comercios_lista, name="comercios_lista"),
    path("comercios/<int:pk>/", views.comercio_detalle, name="comercio_detalle"),
    path(
        "postulaciones/<int:pk>/responder/",
        views.postulacion_responder,
        name="postulacion_responder",
    ),
]
