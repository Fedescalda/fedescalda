from django.contrib.auth.models import AbstractUser
from django.db import models
from django.urls import reverse


class Vehiculo(models.TextChoices):
    A_PIE = "pie", "A pie"
    BICI = "bici", "Bicicleta"
    MOTO = "moto", "Moto"
    AUTO = "auto", "Auto"


class Usuario(AbstractUser):
    class Rol(models.TextChoices):
        COMERCIO = "comercio", "Comercio"
        CADETE = "cadete", "Cadete"

    rol = models.CharField(max_length=10, choices=Rol.choices)

    @property
    def es_comercio(self):
        return self.rol == self.Rol.COMERCIO

    @property
    def es_cadete(self):
        return self.rol == self.Rol.CADETE

    @property
    def perfil(self):
        if self.es_comercio:
            return getattr(self, "perfil_comercio", None)
        if self.es_cadete:
            return getattr(self, "perfil_cadete", None)
        return None


class PerfilComercio(models.Model):
    usuario = models.OneToOneField(
        Usuario, on_delete=models.CASCADE, related_name="perfil_comercio"
    )
    nombre = models.CharField("nombre del comercio", max_length=120)
    rubro = models.CharField(
        max_length=80, help_text="Ej: rotisería, farmacia, kiosco, pizzería"
    )
    zona = models.CharField(max_length=80, help_text="Barrio o localidad")
    direccion = models.CharField("dirección", max_length=160)
    telefono = models.CharField("teléfono", max_length=40)
    descripcion = models.TextField("descripción", blank=True)

    class Meta:
        verbose_name = "perfil de comercio"
        verbose_name_plural = "perfiles de comercio"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre

    def get_absolute_url(self):
        return reverse("comercio_detalle", args=[self.pk])


class PerfilCadete(models.Model):
    usuario = models.OneToOneField(
        Usuario, on_delete=models.CASCADE, related_name="perfil_cadete"
    )
    nombre = models.CharField("nombre y apellido", max_length=120)
    zona = models.CharField(max_length=80, help_text="Barrio o localidad donde trabajás")
    vehiculo = models.CharField("vehículo", max_length=10, choices=Vehiculo.choices)
    telefono = models.CharField("teléfono", max_length=40)
    horarios = models.CharField(
        "horarios disponibles", max_length=160, help_text="Ej: lunes a viernes de 19 a 24"
    )
    experiencia = models.TextField(blank=True)
    disponible = models.BooleanField(
        "busco trabajo", default=True, help_text="Mostrarme en la búsqueda de comercios"
    )

    class Meta:
        verbose_name = "perfil de cadete"
        verbose_name_plural = "perfiles de cadete"
        ordering = ["nombre"]

    def __str__(self):
        return self.nombre

    def get_absolute_url(self):
        return reverse("cadete_detalle", args=[self.pk])


class Oferta(models.Model):
    class Pago(models.TextChoices):
        POR_ENVIO = "envio", "Por envío"
        POR_HORA = "hora", "Por hora"
        POR_TURNO = "turno", "Por turno"
        MENSUAL = "mensual", "Mensual"

    comercio = models.ForeignKey(
        PerfilComercio, on_delete=models.CASCADE, related_name="ofertas"
    )
    titulo = models.CharField("título", max_length=120)
    descripcion = models.TextField("descripción")
    zona = models.CharField(max_length=80, help_text="Zona de reparto")
    horario = models.CharField(max_length=160, help_text="Días y horarios del trabajo")
    vehiculo = models.CharField(
        "vehículo requerido",
        max_length=10,
        choices=Vehiculo.choices,
        blank=True,
        help_text="Dejalo vacío si cualquiera sirve",
    )
    modalidad_pago = models.CharField(
        "modalidad de pago", max_length=10, choices=Pago.choices
    )
    monto = models.DecimalField(
        "monto ($)", max_digits=10, decimal_places=2, null=True, blank=True
    )
    activa = models.BooleanField(default=True)
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-creada"]

    def __str__(self):
        return f"{self.titulo} ({self.comercio})"

    def get_absolute_url(self):
        return reverse("oferta_detalle", args=[self.pk])


class Postulacion(models.Model):
    """Vínculo entre un cadete y una oferta.

    Puede iniciarlo el cadete (postulación) o el comercio (invitación).
    Responde siempre la otra parte. Los datos de contacto se muestran
    sólo cuando la postulación fue aceptada.
    """

    class Origen(models.TextChoices):
        CADETE = "cadete", "Postulación del cadete"
        COMERCIO = "comercio", "Invitación del comercio"

    class Estado(models.TextChoices):
        PENDIENTE = "pendiente", "Pendiente"
        ACEPTADA = "aceptada", "Aceptada"
        RECHAZADA = "rechazada", "Rechazada"

    oferta = models.ForeignKey(
        Oferta, on_delete=models.CASCADE, related_name="postulaciones"
    )
    cadete = models.ForeignKey(
        PerfilCadete, on_delete=models.CASCADE, related_name="postulaciones"
    )
    origen = models.CharField(max_length=10, choices=Origen.choices)
    mensaje = models.TextField(blank=True)
    estado = models.CharField(
        max_length=10, choices=Estado.choices, default=Estado.PENDIENTE
    )
    creada = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "postulación"
        verbose_name_plural = "postulaciones"
        ordering = ["-creada"]
        constraints = [
            models.UniqueConstraint(
                fields=["oferta", "cadete"], name="una_postulacion_por_oferta"
            )
        ]

    def __str__(self):
        return f"{self.cadete} → {self.oferta}"

    def puede_responder(self, usuario):
        """Sólo responde la parte que NO inició el contacto, mientras esté pendiente."""
        if self.estado != self.Estado.PENDIENTE:
            return False
        if self.origen == self.Origen.CADETE:
            return usuario.es_comercio and self.oferta.comercio.usuario_id == usuario.pk
        return usuario.es_cadete and self.cadete.usuario_id == usuario.pk
