from functools import wraps

from django.contrib import messages
from django.contrib.auth import login
from django.contrib.auth.decorators import login_required
from django.db import IntegrityError, transaction
from django.db.models import Count, Q
from django.http import HttpResponseForbidden
from django.shortcuts import get_object_or_404, redirect, render
from django.views.decorators.http import require_POST

from .forms import (
    FiltroForm,
    InvitacionForm,
    MensajeForm,
    OfertaForm,
    PerfilCadeteForm,
    PerfilComercioForm,
    RegistroForm,
)
from .models import Oferta, PerfilCadete, PerfilComercio, Postulacion, Usuario


def requiere_perfil(rol=None):
    """Exige login, un perfil completo y (opcionalmente) un rol determinado."""

    def decorador(vista):
        @wraps(vista)
        @login_required
        def envoltura(request, *args, **kwargs):
            if rol and request.user.rol != rol:
                return HttpResponseForbidden("Esta sección no está disponible para tu tipo de cuenta.")
            if request.user.perfil is None:
                messages.info(request, "Completá tu perfil para continuar.")
                return redirect("perfil_editar")
            return vista(request, *args, **kwargs)

        return envoltura

    return decorador


def _filtrar(queryset, form, campos_texto):
    if not form.is_valid():
        return queryset
    datos = form.cleaned_data
    if datos.get("q"):
        filtro = Q()
        for campo in campos_texto:
            filtro |= Q(**{f"{campo}__icontains": datos["q"]})
        queryset = queryset.filter(filtro)
    if datos.get("zona"):
        queryset = queryset.filter(zona__icontains=datos["zona"])
    if datos.get("vehiculo"):
        queryset = queryset.filter(vehiculo=datos["vehiculo"])
    return queryset


# --- Cuenta -----------------------------------------------------------------


def inicio(request):
    if request.user.is_authenticated:
        return redirect("panel")
    contexto = {
        "total_cadetes": PerfilCadete.objects.filter(disponible=True).count(),
        "total_comercios": PerfilComercio.objects.count(),
        "total_ofertas": Oferta.objects.filter(activa=True).count(),
    }
    return render(request, "core/inicio.html", contexto)


def registro(request):
    if request.user.is_authenticated:
        return redirect("panel")
    form = RegistroForm(request.POST or None, initial={"rol": request.GET.get("rol")})
    if form.is_valid():
        usuario = form.save()
        login(request, usuario)
        messages.success(request, "¡Cuenta creada! Ahora completá tu perfil.")
        return redirect("perfil_editar")
    return render(request, "registration/registro.html", {"form": form})


@login_required
def perfil_editar(request):
    usuario = request.user
    if usuario.es_comercio:
        form_class, instancia = PerfilComercioForm, usuario.perfil
    elif usuario.es_cadete:
        form_class, instancia = PerfilCadeteForm, usuario.perfil
    else:
        return HttpResponseForbidden("Tu cuenta no tiene un rol asignado.")

    form = form_class(request.POST or None, instance=instancia)
    if form.is_valid():
        perfil = form.save(commit=False)
        perfil.usuario = usuario
        perfil.save()
        messages.success(request, "Perfil guardado.")
        return redirect("panel")
    return render(request, "core/perfil_form.html", {"form": form, "nuevo": instancia is None})


@requiere_perfil()
def panel(request):
    usuario = request.user
    if usuario.es_comercio:
        comercio = usuario.perfil
        ofertas = comercio.ofertas.annotate(
            pendientes=Count(
                "postulaciones",
                filter=Q(postulaciones__estado=Postulacion.Estado.PENDIENTE),
            )
        )
        postulaciones = Postulacion.objects.filter(oferta__comercio=comercio).select_related(
            "cadete", "oferta"
        )
        return render(
            request,
            "core/panel_comercio.html",
            {"comercio": comercio, "ofertas": ofertas, "postulaciones": postulaciones},
        )

    cadete = usuario.perfil
    postulaciones = cadete.postulaciones.select_related("oferta__comercio")
    sugeridas = (
        Oferta.objects.filter(activa=True, zona__icontains=cadete.zona)
        .filter(Q(vehiculo="") | Q(vehiculo=cadete.vehiculo))
        .exclude(postulaciones__cadete=cadete)
        .select_related("comercio")[:5]
    )
    return render(
        request,
        "core/panel_cadete.html",
        {"cadete": cadete, "postulaciones": postulaciones, "sugeridas": sugeridas},
    )


# --- Ofertas ----------------------------------------------------------------


def ofertas_lista(request):
    form = FiltroForm(request.GET or None)
    ofertas = Oferta.objects.filter(activa=True).select_related("comercio")
    ofertas = _filtrar(ofertas, form, ["titulo", "descripcion", "comercio__nombre", "comercio__rubro"])
    return render(request, "core/ofertas_lista.html", {"form": form, "ofertas": ofertas})


def oferta_detalle(request, pk):
    oferta = get_object_or_404(Oferta.objects.select_related("comercio"), pk=pk)
    usuario = request.user
    es_duenio = usuario.is_authenticated and oferta.comercio.usuario_id == usuario.pk
    if not oferta.activa and not es_duenio:
        messages.info(request, "Esa oferta ya no está activa.")
        return redirect("ofertas_lista")

    contexto = {"oferta": oferta, "es_duenio": es_duenio}
    if es_duenio:
        contexto["postulaciones"] = oferta.postulaciones.select_related("cadete")
    elif usuario.is_authenticated and usuario.es_cadete and usuario.perfil:
        contexto["mi_postulacion"] = oferta.postulaciones.filter(cadete=usuario.perfil).first()
        contexto["form"] = MensajeForm()
    return render(request, "core/oferta_detalle.html", contexto)


@requiere_perfil(Usuario.Rol.COMERCIO)
def oferta_form(request, pk=None):
    oferta = None
    if pk:
        oferta = get_object_or_404(Oferta, pk=pk, comercio=request.user.perfil)
    form = OfertaForm(
        request.POST or None,
        instance=oferta,
        initial=None if oferta else {"zona": request.user.perfil.zona},
    )
    if form.is_valid():
        oferta = form.save(commit=False)
        oferta.comercio = request.user.perfil
        oferta.save()
        messages.success(request, "Oferta guardada.")
        return redirect(oferta)
    return render(request, "core/oferta_form.html", {"form": form, "oferta": oferta})


@require_POST
@requiere_perfil(Usuario.Rol.COMERCIO)
def oferta_alternar(request, pk):
    oferta = get_object_or_404(Oferta, pk=pk, comercio=request.user.perfil)
    oferta.activa = not oferta.activa
    oferta.save(update_fields=["activa"])
    messages.success(request, "Oferta publicada." if oferta.activa else "Oferta pausada.")
    return redirect(oferta)


@require_POST
@requiere_perfil(Usuario.Rol.CADETE)
def postularse(request, pk):
    oferta = get_object_or_404(Oferta, pk=pk, activa=True)
    form = MensajeForm(request.POST)
    if form.is_valid():
        postulacion = form.save(commit=False)
        postulacion.oferta = oferta
        postulacion.cadete = request.user.perfil
        postulacion.origen = Postulacion.Origen.CADETE
        try:
            with transaction.atomic():
                postulacion.save()
            messages.success(request, "¡Te postulaste! El comercio te va a responder por acá.")
        except IntegrityError:
            messages.warning(request, "Ya tenés una postulación para esta oferta.")
    return redirect(oferta)


# --- Cadetes y comercios ----------------------------------------------------


@requiere_perfil(Usuario.Rol.COMERCIO)
def cadetes_lista(request):
    form = FiltroForm(request.GET or None)
    cadetes = PerfilCadete.objects.filter(disponible=True)
    cadetes = _filtrar(cadetes, form, ["nombre", "experiencia", "horarios"])
    return render(request, "core/cadetes_lista.html", {"form": form, "cadetes": cadetes})


@requiere_perfil(Usuario.Rol.COMERCIO)
def cadete_detalle(request, pk):
    cadete = get_object_or_404(PerfilCadete, pk=pk)
    comercio = request.user.perfil
    vinculos = cadete.postulaciones.filter(oferta__comercio=comercio).select_related("oferta")
    form = InvitacionForm(request.POST or None, comercio=comercio)
    if request.method == "POST" and form.is_valid():
        invitacion = form.save(commit=False)
        invitacion.cadete = cadete
        invitacion.origen = Postulacion.Origen.COMERCIO
        try:
            with transaction.atomic():
                invitacion.save()
            messages.success(request, f"Invitaste a {cadete.nombre}.")
            return redirect(cadete)
        except IntegrityError:
            form.add_error("oferta", "Este cadete ya está vinculado a esa oferta.")
    contacto_visible = vinculos.filter(estado=Postulacion.Estado.ACEPTADA).exists()
    return render(
        request,
        "core/cadete_detalle.html",
        {"cadete": cadete, "vinculos": vinculos, "form": form, "contacto_visible": contacto_visible},
    )


@requiere_perfil(Usuario.Rol.CADETE)
def comercios_lista(request):
    form = FiltroForm(request.GET or None)
    comercios = PerfilComercio.objects.annotate(
        ofertas_activas=Count("ofertas", filter=Q(ofertas__activa=True))
    )
    comercios = _filtrar(comercios, form, ["nombre", "rubro", "descripcion"])
    return render(request, "core/comercios_lista.html", {"form": form, "comercios": comercios})


@requiere_perfil(Usuario.Rol.CADETE)
def comercio_detalle(request, pk):
    comercio = get_object_or_404(PerfilComercio, pk=pk)
    contacto_visible = Postulacion.objects.filter(
        oferta__comercio=comercio,
        cadete=request.user.perfil,
        estado=Postulacion.Estado.ACEPTADA,
    ).exists()
    return render(
        request,
        "core/comercio_detalle.html",
        {
            "comercio": comercio,
            "ofertas": comercio.ofertas.filter(activa=True),
            "contacto_visible": contacto_visible,
        },
    )


# --- Respuestas -------------------------------------------------------------


@require_POST
@requiere_perfil()
def postulacion_responder(request, pk):
    postulacion = get_object_or_404(
        Postulacion.objects.select_related("oferta__comercio", "cadete"), pk=pk
    )
    if not postulacion.puede_responder(request.user):
        return HttpResponseForbidden("No podés responder esta postulación.")
    accion = request.POST.get("accion")
    if accion == "aceptar":
        postulacion.estado = Postulacion.Estado.ACEPTADA
        messages.success(request, "¡Aceptada! Ya pueden ver sus datos de contacto.")
    elif accion == "rechazar":
        postulacion.estado = Postulacion.Estado.RECHAZADA
        messages.info(request, "Rechazada.")
    else:
        messages.error(request, "Acción inválida.")
        return redirect("panel")
    postulacion.save(update_fields=["estado"])
    return redirect("panel")
