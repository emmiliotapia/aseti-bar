FROM python:3.12-slim

WORKDIR /app

# Evitar buffering en stdout/stderr y escritura de .pyc
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código del backend
COPY . .

# Directorio de persistencia de SQLite
VOLUME ["/app/data"]

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

