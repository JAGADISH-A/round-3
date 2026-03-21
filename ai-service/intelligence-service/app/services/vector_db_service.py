"""Vector DB Service — Shared ChromaDB retrieval logic for all AI services."""

import os
import chromadb
from sentence_transformers import SentenceTransformer
from typing import List, Dict, Any, Optional

# ─── Configuration ───────────────────────────────────────────────────────────
CHROMA_PATH = "./careerspark_data_external/vector_db"
COLLECTION_NAME = "career_knowledge"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

# ─── Lazy-loaded singletons ───────────────────────────────────────────────────
_embedding_model: Optional[SentenceTransformer] = None
_chroma_client: Optional[chromadb.PersistentClient] = None
_collection: Optional[chromadb.Collection] = None

def get_embedding_model() -> SentenceTransformer:
    global _embedding_model
    if _embedding_model is None:
        _embedding_model = SentenceTransformer(EMBEDDING_MODEL)
    return _embedding_model

def get_collection():
    global _chroma_client, _collection
    if _collection is None:
        _chroma_client = chromadb.PersistentClient(path=CHROMA_PATH)
        _collection = _chroma_client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine"}
        )
    return _collection

def retrieve_context(query: str, k: int = 5) -> tuple[str, list[dict]]:
    """Retrieve top-k relevant chunks from local ChromaDB."""
    try:
        model = get_embedding_model()
        collection = get_collection()

        if collection.count() == 0:
            return "", []

        query_embedding = model.encode([query]).tolist()
        results = collection.query(
            query_embeddings=query_embedding,
            n_results=min(k, collection.count()),
            include=["documents", "distances", "metadatas"]
        )

        docs = results.get("documents", [[]])[0] if results.get("documents") else []
        distances = results.get("distances", [[]])[0] if results.get("distances") else []
        metadatas = results.get("metadatas", [[]])[0] if results.get("metadatas") else []

        context_parts: List[str] = []
        sources: List[Dict[str, Any]] = []
        seen_content = set()

        for doc, dist, meta in zip(docs, distances, metadatas):
            relevance = float(1.0 - float(dist)) if dist is not None else 0.0
            relevance = round(relevance, 4)
            
            doc_text = str(doc).strip()
            
            # Simple content-based deduplication
            content_hash = doc_text[:100].lower() # Use first 100 chars as a fingerprint
            if content_hash in seen_content:
                continue
            
            if relevance > 0.15: # Lowered threshold slightly to allow more exploration
                context_parts.append(doc_text)
                seen_content.add(content_hash)
                
                preview = doc_text[:200] + "..." if len(doc_text) > 200 else doc_text
                sources.append({
                    "text": preview,
                    "relevance": relevance,
                    "source": meta.get("source", "local-dataset") if isinstance(meta, dict) else "local-dataset"
                })

        return "\n\n---\n\n".join(context_parts), sources

    except Exception as e:
        print(f"[VectorDB] Retrieval error: {e}")
        return "", []
