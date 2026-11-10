from django import forms
from django.contrib.auth.forms import UserCreationForm

from .models import Oferta, PerfilCadete, PerfilComercio, Postulacion, Usuario, Vehiculo


class BootstrapMixin:
    """Agrega las clases CSS de Bootstrap a todos los widgets."""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for campo in self.fields.values():
            widget = campo.widget
            if isinstance(widget, (forms.CheckboxInput, forms.RadioSelect)):
                clase = "form-check-input"
            elif isinstance(widget, forms.Select):
                clase = "form-select"
            else:
                clase = "form-control"
            widget.attrs["class"] = f"{widget.attrs.get('class', '')} {clase}".strip()


class RegistroForm(BootstrapMixin, UserCreationForm):
    rol = forms.ChoiceField(
        label="Soy", choices=Usuario.Rol.choices, widget=forms.RadioSelect
    )
    email = forms.EmailField(required=False)

    class Meta(UserCreationForm.Meta):
        model = Usuario
        fields = ("username", "email", "rol")


class PerfilComercioForm(BootstrapMixin, forms.ModelForm):
    class Meta:
        model = PerfilComercio
        exclude = ("usuario",)
        widgets = {"descripcion": forms.Textarea(attrs={"rows": 3})}


class PerfilCadeteForm(BootstrapMixin, forms.ModelForm):
    class Meta:
        model = PerfilCadete
        exclude = ("usuario",)
        widgets = {"experiencia": forms.Textarea(attrs={"rows": 3})}


class OfertaForm(BootstrapMixin, forms.ModelForm):
    class Meta:
        model = Oferta
        exclude = ("comercio", "creada")
        widgets = {"descripcion": forms.Textarea(attrs={"rows": 4})}


class MensajeForm(BootstrapMixin, forms.ModelForm):
    class Meta:
        model = Postulacion
        fields = ("mensaje",)
        widgets = {
            "mensaje": forms.Textarea(
                attrs={"rows": 3, "placeholder": "Contá brevemente por qué te interesa"}
            )
        }


class InvitacionForm(BootstrapMixin, forms.ModelForm):
    def __init__(self, *args, comercio, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["oferta"].queryset = comercio.ofertas.filter(activa=True)

    class Meta:
        model = Postulacion
        fields = ("oferta", "mensaje")
        widgets = {"mensaje": forms.Textarea(attrs={"rows": 3})}


VEHICULO_FILTRO = [("", "Cualquier vehículo"), *Vehiculo.choices]


class FiltroForm(BootstrapMixin, forms.Form):
    q = forms.CharField(
        label="Buscar",
        required=False,
        widget=forms.TextInput(attrs={"placeholder": "Buscar por nombre, rubro o palabra clave…"}),
    )
    zona = forms.CharField(
        required=False, widget=forms.TextInput(attrs={"placeholder": "Zona / barrio"})
    )
    vehiculo = forms.ChoiceField(choices=VEHICULO_FILTRO, required=False)
