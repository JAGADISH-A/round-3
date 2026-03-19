#!/usr/bin/env python3
"""
CareerSpark AI — Local Dataset Indexer
=======================================
Indexes all local datasets into ChromaDB using all-MiniLM-L6-v2 (100% local, zero API).

Run: python index_datasets.py

Supports resume — already indexed chunks are skipped.
"""

import os
import sys
import csv
import hashlib
import pathlib
import textwrap
import time
from typing import Generator

# ── Progress helper ────────────────────────────────────────────────────────────
def progress(msg: str, end: str = "\n"):
    print(f"\033[36m[INDEX]\033[0m {msg}", end=end, flush=True)

def ok(msg: str):
    print(f"\033[32m[  OK ]\033[0m {msg}", flush=True)

def warn(msg: str):
    print(f"\033[33m[ WARN]\033[0m {msg}", flush=True)

def err(msg: str):
    print(f"\033[31m[ ERR ]\033[0m {msg}", flush=True)


# ── Configuration ──────────────────────────────────────────────────────────────
BASE_DIR      = pathlib.Path(__file__).parent
DATASETS_DIR  = BASE_DIR / "careerspark_data_external" / "datasets"
VECTOR_DB_DIR = BASE_DIR / "careerspark_data_external" / "vector_db"
COLLECTION    = "career_knowledge"
EMBED_MODEL   = "all-MiniLM-L6-v2"
BATCH_SIZE    = 64    # chunks to embed at once (tune down if RAM issues)
CHUNK_SIZE    = 450   # target words per chunk
CHUNK_OVERLAP = 60    # word overlap between chunks

# Row caps for large CSVs (saves RAM & time, keeps diversity via sampling)
CSV_ROW_CAPS = {
    "job_skills.csv":            5_000,
    "linkedin_job_postings.csv": 3_000,
    "job_summary.csv":           0,    # 0 = skip entirely (5+ GB)
}
CSV_DEFAULT_CAP = 50_000  # unlimited in practice for small files


# ── Embedding model (loaded once) ──────────────────────────────────────────────
_model = None
def get_model():
    global _model
    if _model is None:
        progress("Loading all-MiniLM-L6-v2 (local, no API)...")
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer(EMBED_MODEL)
        ok(f"Model loaded · dim={_model.get_sentence_embedding_dimension()}")
    return _model


# ── ChromaDB collection ────────────────────────────────────────────────────────
_col = None
def get_collection():
    global _col
    if _col is None:
        import chromadb
        client = chromadb.PersistentClient(path=str(VECTOR_DB_DIR))
        _col = client.get_or_create_collection(
            name=COLLECTION,
            metadata={"hnsw:space": "cosine"}
        )
    return _col


# ── ID helpers (deterministic, dedup-safe) ─────────────────────────────────────
def chunk_id(source: str, text: str) -> str:
    h = hashlib.md5(f"{source}::{text[:120]}".encode()).hexdigest()[:16]
    return h

def already_indexed(ids: list[str]) -> set[str]:
    col = get_collection()
    if col.count() == 0:
        return set()
    existing = col.get(ids=ids, include=[])
    return set(existing["ids"])


# ── Text chunking ──────────────────────────────────────────────────────────────
def chunk_text(text: str, source: str) -> Generator[tuple[str, str], None, None]:
    """Yield (chunk_text, chunk_id) pairs."""
    words = text.split()
    if not words:
        return
    step = CHUNK_SIZE - CHUNK_OVERLAP
    for i in range(0, len(words), step):
        window = words[i: i + CHUNK_SIZE]
        chunk = " ".join(window).strip()
        if len(chunk) < 30:   # skip tiny fragments
            continue
        yield chunk, chunk_id(source, chunk)


# ── Batch upsert ────────────────────────────────────────────────────────────────
def upsert_chunks(chunks: list[str], ids: list[str], metas: list[dict]):
    if not chunks:
        return 0
    model = get_model()
    col   = get_collection()
    added = 0

    for b_start in range(0, len(chunks), BATCH_SIZE):
        b_chunks = chunks[b_start: b_start + BATCH_SIZE]
        b_ids    = ids[b_start: b_start + BATCH_SIZE]
        b_metas  = metas[b_start: b_start + BATCH_SIZE]

        # Skip already-indexed
        existing = already_indexed(b_ids)
        new_chunks = [(c, i, m) for c, i, m in zip(b_chunks, b_ids, b_metas) if i not in existing]
        if not new_chunks:
            continue

        texts, new_ids, new_metas = zip(*new_chunks)
        embeddings = model.encode(list(texts), show_progress_bar=False, batch_size=32).tolist()
        col.add(
            documents=list(texts),
            embeddings=embeddings,
            ids=list(new_ids),
            metadatas=list(new_metas)
        )
        added += len(new_ids)

    return added


# ── CSV file reader ────────────────────────────────────────────────────────────
def row_to_text(row: dict) -> str:
    """Convert a CSV row dict into a readable sentence."""
    parts = [f"{k}: {v}" for k, v in row.items() if v and str(v).strip()]
    return " | ".join(parts[:20])  # cap at 20 fields to avoid massive rows


def index_csv(path: pathlib.Path) -> int:
    filename = path.name
    cap = CSV_ROW_CAPS.get(filename, CSV_DEFAULT_CAP)
    if cap == 0:
        warn(f"Skipping {filename} (marked skip due to size)")
        return 0

    progress(f"CSV  → {filename} (cap={cap:,} rows)...", end=" ")

    chunks, ids, metas, total_added = [], [], [], 0
    try:
        with open(path, encoding="utf-8", errors="ignore") as f:
            reader = csv.DictReader(f)
            for i, row in enumerate(reader):
                if i >= cap:
                    break
                text = row_to_text(row)
                for chunk, cid in chunk_text(text, filename):
                    chunks.append(chunk)
                    ids.append(cid)
                    metas.append({"source": filename, "row": i})

                    if len(chunks) >= BATCH_SIZE * 4:
                        total_added += upsert_chunks(chunks, ids, metas)
                        chunks, ids, metas = [], [], []
                        print(".", end="", flush=True)

        if chunks:
            total_added += upsert_chunks(chunks, ids, metas)

    except Exception as e:
        err(f"Failed {filename}: {e}")
        return 0

    print()
    ok(f"{filename}: +{total_added} chunks indexed")
    return total_added


# ── Markdown file reader ───────────────────────────────────────────────────────
def index_markdown(path: pathlib.Path) -> int:
    rel = str(path.relative_to(DATASETS_DIR))
    try:
        text = path.read_text(encoding="utf-8", errors="ignore")
    except Exception as e:
        err(f"Cannot read {rel}: {e}")
        return 0

    # strip HTML/image syntax (markdown artifacts)
    import re
    text = re.sub(r"!\[.*?\]\(.*?\)", "", text)
    text = re.sub(r"<[^>]+>", " ", text)
    text = re.sub(r"\[([^\]]+)\]\([^\)]+\)", r"\1", text)  # keep link text
    text = re.sub(r"\s+", " ", text).strip()

    chunks, ids, metas = [], [], []
    for chunk, cid in chunk_text(text, rel):
        chunks.append(chunk)
        ids.append(cid)
        metas.append({"source": rel, "type": "markdown"})

    added = upsert_chunks(chunks, ids, metas)
    if added:
        ok(f"{rel}: +{added} chunks indexed")
    return added


# ── Directory walker for markdown ──────────────────────────────────────────────
def index_markdown_dir(root: pathlib.Path) -> int:
    total = 0
    md_files = list(root.glob("**/*.md")) + list(root.glob("**/*.txt"))
    md_files = [f for f in md_files if ".git" not in f.parts]
    progress(f"DIR  → {root.name}/ ({len(md_files)} markdown files)")
    for path in md_files:
        total += index_markdown(path)
    return total


# ── Main ───────────────────────────────────────────────────────────────────────
def main():
    print()
    print("=" * 60)
    print("  CareerSpark AI — Local Dataset Indexer")
    print(f"  Embedding: {EMBED_MODEL} (local CPU, no API)")
    print(f"  Target DB: {VECTOR_DB_DIR}")
    print("=" * 60)
    print()

    DATASETS_DIR.mkdir(parents=True, exist_ok=True)
    VECTOR_DB_DIR.mkdir(parents=True, exist_ok=True)

    start_time = time.time()
    grand_total = 0

    # ── Phase 1: Small priority CSVs (full index) ──────────────────────────────
    print("\n📊 Phase 1: Priority CSVs (full index)")
    print("-" * 40)
    priority_csvs = [
        "job_market.csv",
        "technical_skills.csv",
        "future_jobs_dataset.csv",
        "Salary_Dataset_DataScienceLovers.csv",
    ]
    for name in priority_csvs:
        path = DATASETS_DIR / name
        if path.exists():
            grand_total += index_csv(path)
        else:
            warn(f"Not found: {name}")

    # ── Phase 2: Large CSVs (sampled) ─────────────────────────────────────────
    print("\n📊 Phase 2: Large CSVs (sampled rows)")
    print("-" * 40)
    large_csvs = [
        "linkedin_job_postings.csv",
        "job_skills.csv",
    ]
    for name in large_csvs:
        path = DATASETS_DIR / name
        if path.exists():
            grand_total += index_csv(path)
        else:
            warn(f"Not found: {name}")

    # ── Phase 3: Markdown knowledge bases ─────────────────────────────────────
    print("\n📚 Phase 3: Knowledge Base Markdown")
    print("-" * 40)
    md_dirs = [
        "awesome-interview-questions",
        "coding-interview-university",
        "tech-interview-handbook",
        "developer-roadmap",
    ]
    for name in md_dirs:
        path = DATASETS_DIR / name
        if path.exists() and path.is_dir():
            grand_total += index_markdown_dir(path)
        else:
            warn(f"Not found: {name}/")

    # ── Summary ────────────────────────────────────────────────────────────────
    elapsed = time.time() - start_time
    col = get_collection()
    print()
    print("=" * 60)
    print(f"  ✅ Indexing complete in {elapsed:.0f}s")
    print(f"  📦 Chunks added this run : {grand_total:,}")
    print(f"  📦 Total in collection   : {col.count():,}")
    print(f"  🗄️  Vector DB path        : {VECTOR_DB_DIR}")
    print("=" * 60)
    print()
    print("  Restart your backend (python main.py) to use the new index.")
    print()


if __name__ == "__main__":
    main()
