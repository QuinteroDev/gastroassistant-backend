# ========================================
# 1. users/models.py - CREAR ESTE ARCHIVO
# ========================================

from django.db import models
from django.contrib.auth.models import User
import uuid
from datetime import timedelta
from django.utils import timezone

class PasswordResetToken(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    token = models.UUIDField(default=uuid.uuid4, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    used = models.BooleanField(default=False)
    
    def is_valid(self):
        """Token válido por 1 hora"""
        expiry_time = self.created_at + timedelta(hours=1)
        return not self.used and timezone.now() < expiry_time
    
    def __str__(self):
        return f"Reset token para {self.user.username}"