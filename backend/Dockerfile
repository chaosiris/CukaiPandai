# CukaiPandai API (backend). Build context = backend/.
FROM python:3.11-slim

# Copy uv binary from the official image.
COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

WORKDIR /app

# Install deps first (better layer caching), then the package.
COPY pyproject.toml uv.lock ./
COPY core ./core
COPY api ./api
RUN uv pip install --system --no-cache -e .

EXPOSE 8000
# Run from /app so the law-corpus relative path (core/fixtures/...) resolves.
CMD uvicorn api.main:app --host 0.0.0.0 --port ${PORT:-8000}
