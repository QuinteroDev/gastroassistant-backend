# programs/models.py
from django.db import models
from django.contrib.auth.models import User

class TreatmentProgram(models.Model):
    PROGRAM_TYPES = [
        ('A', 'Programa A - GerdQ y RSI positivos'),
        ('B', 'Programa B - GerdQ positivo, RSI negativo'),
        ('C', 'Programa C - GerdQ negativo, RSI positivo'),
        ('D', 'Programa D - GerdQ y RSI negativos'),
    ]
    
    name = models.CharField(max_length=100)
    type = models.CharField(max_length=1, choices=PROGRAM_TYPES)
    description = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.get_type_display()} - {self.name}"
    
class UserProgram(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='assigned_program')
    program = models.ForeignKey(TreatmentProgram, on_delete=models.PROTECT)
    assigned_at = models.DateTimeField(auto_now_add=True)
    completed = models.BooleanField(default=False)
    
    # Podríamos añadir campos adicionales como:
    # progress_percentage = models.FloatField(default=0.0)
    # last_activity_date = models.DateTimeField(null=True, blank=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.program.name}"