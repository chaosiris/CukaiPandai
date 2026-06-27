# CukaiPandai API (backend). Build context = backend/.
FROM python:3.11-slim

# Copy uv binary from the official image.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# WeasyPrint native dependencies (Pango / Cairo / GDK-PixBuf / libffi) + a base font, for the
# filing draft-pack PDF renderer. Installed before the Python deps so this layer caches well.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libpango-1.0-0 libpangocairo-1.0-0 libpangoft2-1.0-0 libharfbuzz0b \
    libgdk-pixbuf-2.0-0 libcairo2 libffi8 \
    shared-mime-info fonts-dejavu-core fonts-liberation \
    && rm -rf /var/lib/apt/lists/*

# Install deps first (better layer caching), then the package.
COPY pyproject.toml uv.lock ./
COPY core ./core
COPY api ./api
RUN uv pip install --system --no-cache -e ".[auth-google]"

EXPOSE 8000
# Run from /app so the law-corpus relative path (core/fixtures/...) resolves.
CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
