from __future__ import annotations

from fastapi import FastAPI

app = FastAPI(title="CukaiPandai API")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
