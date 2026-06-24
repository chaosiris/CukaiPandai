"""BE-12 — offline RAG index build. NOT run at request time.

Run from backend/:  PYTHONPATH=. python scripts/build_rag_index.py
Reads the law corpus → embeds each clause (local static model2vec) → L2-normalizes →
writes the COMMITTED index core/fixtures/rag/{vectors.npz, chunks.json} (with page-ref
provenance). Re-run whenever the corpus changes.
"""
from __future__ import annotations

import json
from pathlib import Path

import numpy as np

from core.lawcorpus import LawCorpus
from core.rag import _RAG_DIR, embed

CORPUS = Path("core/fixtures/lawcorpus_seed.json")


def main() -> int:
    corpus = LawCorpus.load(CORPUS)
    chunks = [
        {
            "clause_id": c.clause_id,
            "text": c.text,
            "source": c.source,
            "section": c.section,
            "page_ref": c.page_ref,
            "url": c.url,
        }
        for c in (corpus.get(cid) for cid in corpus.ids())
    ]
    vectors = embed([f"{c['source']} {c['text']}" for c in chunks])
    if vectors is None:
        raise SystemExit("embedder unavailable — cannot build index (install model2vec)")
    _RAG_DIR.mkdir(parents=True, exist_ok=True)
    np.savez(_RAG_DIR / "vectors.npz", vectors=vectors.astype(np.float32))
    (_RAG_DIR / "chunks.json").write_text(
        json.dumps(chunks, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(f"built RAG index: {vectors.shape[0]} chunks, dim {vectors.shape[1]} -> {_RAG_DIR}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
