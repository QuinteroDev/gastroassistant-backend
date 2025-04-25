# profiles/models.py
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    weight_kg = models.FloatField(null=True, blank=True, verbose_name="Peso (kg)")
    height_cm = models.FloatField(null=True, blank=True, verbose_name="Altura (cm)")
    onboarding_complete = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        # Intenta obtener el username, maneja el caso donde el usuario podría no tenerlo aún
        # (aunque con OneToOneField a User, siempre debería tenerlo si el User existe)
        try:
             username = self.user.username
        except User.DoesNotExist:
             username = "[Usuario no disponible]"
        except AttributeError: # Por si user fuera None, aunque no debería con OneToOneField
             username = "[Usuario no asignado]"
        return f"Perfil de {username}"

@receiver(post_save, sender=User)
def create_or_update_user_profile(sender, instance, created, **kwargs):
    if created:
        UserProfile.objects.create(user=instance)
    else:
        # Asegura que el perfil exista para usuarios existentes
        UserProfile.objects.get_or_create(user=instance)