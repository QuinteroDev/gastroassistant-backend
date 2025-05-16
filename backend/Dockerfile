# Dockerfile - Como una "receta" para construir tu aplicación

# 1. Usar una imagen base con Python ya instalado
FROM python:3.11-slim

# 2. Configurar variables de entorno para Python
ENV PYTHONDONTWRITEBYTECODE 1  # No crear archivos .pyc
ENV PYTHONUNBUFFERED 1         # Mostrar output en tiempo real

# 3. Instalar herramientas necesarias para PostgreSQL
RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        postgresql-client \
        gcc \
        python3-dev \
        musl-dev \
    && rm -rf /var/lib/apt/lists/*

# 4. Crear directorio de trabajo dentro del contenedor
WORKDIR /app

# 5. Copiar archivo de dependencias e instalarlas
COPY requirements.txt /app/
RUN pip install --no-cache-dir -r requirements.txt

# 6. Copiar todo el código de la aplicación
COPY . /app/

# 7. Crear carpetas para archivos estáticos
RUN mkdir -p /app/static
RUN mkdir -p /app/media

# 8. Exponer el puerto donde correrá Django
EXPOSE 8000

# 9. Comando por defecto para ejecutar la aplicación
# Gunicorn es un servidor web para Django en producción
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "gastro_assistant.wsgi:application"]