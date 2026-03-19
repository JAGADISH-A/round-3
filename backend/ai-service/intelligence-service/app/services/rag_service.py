"""RAG Service — ChromaDB + SentenceTransformers retrieval engine."""

import chromadb
from sentence_transformers import SentenceTransformer
from typing import Optional

COLLECTION_NAME = "career_knowledge"
EMBEDDING_MODEL = "all-MiniLM-L6-v2"

_client: Optional[chromadb.ClientAPI] = None
_model: Optional[SentenceTransformer] = None
_collection = None


def get_model() -> SentenceTransformer:
    global _model
    if _model is None:
        _model = SentenceTransformer(EMBEDDING_MODEL)
    return _model


def get_client() -> chromadb.ClientAPI:
    global _client
    if _client is None:
        _client = chromadb.PersistentClient(path="./chroma_db")
    return _client


def get_collection():
    global _collection
    if _collection is None:
        client = get_client()
        model = get_model()
        dim = model.get_sentence_embedding_dimension()

        _collection = client.get_or_create_collection(
            name=COLLECTION_NAME,
            metadata={"hnsw:space": "cosine", "embedding_dimension": dim},
        )

        if _collection.count() == 0:
            _seed_knowledge(model)

    return _collection


def _seed_knowledge(model: SentenceTransformer):
    """Seed the vector store with foundational career guidance data."""
    docs = [
        "When answering 'Tell me about yourself', structure your response with Present-Past-Future: start with your current role, highlight relevant past experience, then express enthusiasm for the opportunity.",
        "The STAR method (Situation, Task, Action, Result) is the gold standard for behavioral interview answers. Always quantify results when possible.",
        "Top behavioral interview questions include: 'Tell me about a time you failed', 'Describe a conflict with a coworker', 'Give an example of leadership', and 'How do you handle tight deadlines'.",
        "Salary negotiation tips: Research market rates on Glassdoor/Levels.fyi, never give the first number, anchor high but reasonable, and always negotiate in writing after verbal agreement.",
        "Questions to ask the interviewer: 'What does success look like in the first 90 days?', 'What's the team's biggest challenge right now?', 'How do you measure performance?', 'What's the growth trajectory for this role?'",
        "Resume best practices for 2026: Keep it to one page for under 10 years experience, use action verbs (Led, Built, Reduced, Increased), quantify achievements, and tailor keywords to the job description.",
        "Common interview mistakes: Not researching the company, giving vague answers without specific examples, speaking negatively about previous employers, and failing to prepare questions for the interviewer.",
        "For technical interviews: Practice data structures and algorithms daily, understand system design fundamentals, prepare to explain your past projects in depth, and always think out loud during problem-solving.",
        "Networking strategies: Attend industry meetups, contribute to open-source projects, maintain an active LinkedIn presence, and follow up within 24 hours of meeting someone new.",
        "Remote work interview tips: Test your technology beforehand, choose a clean and well-lit background, maintain eye contact by looking at the camera, and minimize distractions.",
        "Skills gap analysis process: List the requirements from target job descriptions, map them against your current skills, identify gaps, then create a 30-60-90 day learning plan to close them.",
        "Personal branding for job seekers: Build a portfolio website, write technical blog posts, create content on LinkedIn, contribute to community discussions, and maintain a consistent professional narrative.",
        "Emotional intelligence in interviews: Show self-awareness, demonstrate empathy, give examples of handling feedback gracefully, and describe how you manage stress and conflict constructively.",
        "Career transition strategies: Identify transferable skills, get certifications in the new field, do freelance or volunteer work for portfolio pieces, and network heavily in the target industry.",
        "Follow-up after interviews: Send a personalized thank-you email within 24 hours, reference specific conversation points, reiterate your interest, and provide any materials discussed during the interview.",
    ]

    ids = [f"doc_{i}" for i in range(len(docs))]
    embeddings = model.encode(docs).tolist()

    _collection.add(documents=docs, embeddings=embeddings, ids=ids)


def retrieve(query: str, n_results: int = 3) -> list[dict]:
    """Retrieve relevant documents for a query."""
    collection = get_collection()
    model = get_model()
    query_embedding = model.encode([query]).tolist()

    results = collection.query(
        query_embeddings=query_embedding,
        n_results=n_results,
        include=["documents", "distances"],
    )

    sources = []
    if results["documents"] and results["distances"]:
        for doc, dist in zip(results["documents"][0], results["distances"][0]):
            relevance = round(1 - dist, 4)
            sources.append({"text": doc, "relevance": relevance})

    return sources


def get_collection_info() -> dict:
    """Return collection metadata: name, count, embedding dimension."""
    collection = get_collection()
    model = get_model()
    dim = model.get_sentence_embedding_dimension()
    return {
        "name": collection.name,
        "count": collection.count(),
        "embedding_dimension": dim,
    }
