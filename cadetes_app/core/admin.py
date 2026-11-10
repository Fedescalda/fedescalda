from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .models import Oferta, PerfilCadete, PerfilComercio, Postulacion, Usuario


@admin.register(Usuario)
class UsuarioAdmin(UserAdmin):
    fieldsets = UserAdmin.fieldsets + (("Rol", {"fields": ("rol",)}),)
    list_display = ("username", "email", "rol", "is_staff")
    list_filter = ("rol", "is_staff")


@admin.register(PerfilComercio)
class PerfilComercioAdmin(admin.ModelAdmin):
    list_display = ("nombre", "rubro", "zona", "telefono")
    search_fields = ("nombre", "rubro", "zona")


@admin.register(PerfilCadete)
class PerfilCadeteAdmin(admin.ModelAdmin):
    list_display = ("nombre", "zona", "vehiculo", "disponible")
    list_filter = ("vehiculo", "disponible")
    search_fields = ("nombre", "zona")


@admin.register(Oferta)
class OfertaAdmin(admin.ModelAdmin):
    list_display = ("titulo", "comercio", "zona", "modalidad_pago", "activa", "creada")
    list_filter = ("activa", "modalidad_pago", "vehiculo")
    search_fields = ("titulo", "comercio__nombre", "zona")


@admin.register(Postulacion)
class PostulacionAdmin(admin.ModelAdmin):
    list_display = ("cadete", "oferta", "origen", "estado", "creada")
    list_filter = ("estado", "origen")
