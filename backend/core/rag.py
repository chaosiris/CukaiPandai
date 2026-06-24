"""Sovereign RAG (Q8/BE-13): local static embeddings + a committed numpy index, fail-open.

No foreign API — `model2vec` is an in-process token→vector lookup (~30MB), sized for the Render
256MB free tier. The deterministic clause-ID gate (`core/citations.ground_citation`) stays
authoritative; RAG only retrieves candidate clauses + threads provenance into the Citation.
"""
from __future__ import annotations

import json
import os
from functools import lru_cache
from pathlib import Path

import numpy as np

_RAG_DIR = Path(__file__).parent / "fixtures" / "rag"
_VECTORS = _RAG_DIR / "vectors.npz"
_CHUNKS = _RAG_DIR / "chunks.json"
# Prefer an explicit path, then a local copy (Windows-dev, no HF symlink), then the HF hub id.
_LOCAL_MODEL = Path(__file__).parent.parent / ".hf_models" / "potion-base-8M"
_MODEL_ID = os.getenv("RAG_MODEL", "minishlab/potion-base-8M")


@lru_cache(maxsize=1)
def _embedder():
    """Load the static embedder once; return None on any failure (fail-open)."""
    try:
        from model2vec import StaticModel

        src = os.getenv("RAG_MODEL_PATH") or (
            str(_LOCAL_MODEL) if _LOCAL_MODEL.exists() else _MODEL_ID
        )
        return StaticModel.from_pretrained(src)
    except Exception:
        return None


def embed(texts: list[str]) -> np.ndarray | None:
    """Embed + L2-normalize a list of texts; None if the embedder is unavailable."""
    m = _embedder()
    if m is None:
        return None
    v = np.asarray(m.encode(list(texts)), dtype=np.float32)
    norms = np.linalg.norm(v, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return v / norms


@lru_cache(maxsize=1)
def _index():
    """Load the committed (vectors, chunks) index; None on any failure (fail-open)."""
    try:
        chunks = json.loads(_CHUNKS.read_text(encoding="utf-8"))
        mat = np.load(_VECTORS)["vectors"].astype(np.float32)
        if mat.shape[0] != len(chunks):
            return None
        return mat, chunks
    except Exception:
        return None


def thread_provenance(citation, hits: list[dict]):
    """Attach the retrieved section/page_ref/url/passage for the first cited clause that was
    retrieved (additive — leaves the citation unchanged if nothing matches). Mutates + returns it."""
    by_id = {h.get("clause_id"): h for h in hits}
    for cid in citation.clause_ids:
        h = by_id.get(cid)
        if h:
            citation.section = h.get("section")
            citation.page_ref = h.get("page_ref")
            citation.url = h.get("url")
            citation.passage = h.get("text")
            break
    return citation


def retrieve(query: str, k: int = 4, *, clause_filter=None) -> list[dict]:
    """Cosine top-k chunks for a query. FAIL-OPEN: any error / missing index / missing embedder
    returns ``[]`` and never raises. Each chunk carries clause_id + section/page_ref/url."""
    try:
        idx = _index()
        if idx is None:
            return []
        mat, chunks = idx
        q = embed([query])
        if q is None:
            return []
        scores = mat @ q[0]
        out: list[dict] = []
        for i in np.argsort(-scores):
            chunk = chunks[int(i)]
            if clause_filter and chunk.get("clause_id") not in clause_filter:
                continue
            out.append(chunk)
            if len(out) >= k:
                break
        return out
    except Exception:
        return []
