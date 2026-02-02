# Dockerfile para Pineai Backend
# Imagem mínima para produção

FROM python:3.13-slim

# Evita prompts interativos e configura Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

# Copia e instala dependências Python
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia código fonte
COPY src/ ./src/
COPY alembic.ini .
COPY db/ ./db/

# Configuração do servidor (pode ser sobrescrita via variáveis de ambiente)
ENV PORT=8888 \
    WORKERS=1

# Comando de inicialização
CMD uvicorn src.api:app --host 0.0.0.0 --port $PORT --workers $WORKERS
