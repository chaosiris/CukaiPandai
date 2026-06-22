# CukaiPandai API (backend). Build context = repo root.
FROM python:3.11-slim

WORKDIR /app

# Install deps first (better layer caching), then the package.
COPY pyproject.toml ./
COPY core ./core
COPY api ./api
RUN pip install --no-cache-dir -e .

EXPOSE 8000
# Run from /app so the law-corpus relative path (core/fixtures/...) resolves.
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
