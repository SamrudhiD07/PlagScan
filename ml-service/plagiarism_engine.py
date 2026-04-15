"""
plagiarism_engine.py
Core NLP engine for the semantic plagiarism detection system.

Pipeline:
  1. Text extraction  (PDF / DOCX / TXT)
  2. Preprocessing    (tokenize, clean, sentence-split)
  3. TF-IDF + Cosine  (document-level similarity)
  4. BERT paraphrase  (sentence-level semantic similarity)
  5. Report assembly
"""

import re
import io
import logging
import numpy as np
from typing import List, Tuple, Dict, Any

import nltk
import PyPDF2
import docx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sk_cosine
from sentence_transformers import SentenceTransformer, util

# Download NLTK data on first run
for pkg in ("punkt", "stopwords", "punkt_tab"):
    try:
        nltk.download(pkg, quiet=True)
    except Exception:
        pass

from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords

logger = logging.getLogger(__name__)

# ── Model (loaded once at import time) ───────────────────────────────────────
# 'paraphrase-MiniLM-L6-v2' is fast (~80 MB) and accurate for paraphrase tasks.
# Swap for 'all-mpnet-base-v2' for higher accuracy at the cost of speed.
_MODEL_NAME = "paraphrase-MiniLM-L6-v2"
logger.info(f"Loading sentence-transformer model: {_MODEL_NAME}")
_model = SentenceTransformer(_MODEL_NAME)
logger.info("Model loaded.")

STOP_WORDS = set(stopwords.words("english"))


# ── Text extraction ───────────────────────────────────────────────────────────

def extract_text(file_bytes: bytes, filename: str) -> str:
    """Extract plain text from PDF, DOCX, or TXT file bytes."""
    ext = filename.rsplit(".", 1)[-1].lower()

    if ext == "pdf":
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        pages  = [page.extract_text() or "" for page in reader.pages]
        return "\n".join(pages)

    if ext in ("doc", "docx"):
        doc  = docx.Document(io.BytesIO(file_bytes))
        paras = [p.text for p in doc.paragraphs if p.text.strip()]
        return "\n".join(paras)

    # Plain text fallback
    return file_bytes.decode("utf-8", errors="replace")


# ── Preprocessing ─────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    """Lowercase, remove special chars, collapse whitespace."""
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s\.\!\?]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def split_sentences(text: str) -> List[str]:
    """Split text into non-empty, meaningful sentences."""
    sentences = sent_tokenize(text)
    return [s.strip() for s in sentences if len(s.strip().split()) >= 3] # Lowered slightly for library coverage


def get_embeddings(text: str) -> Dict[str, Any]:
    """Pre-process text into sentences and their BERT embeddings."""
    clean = clean_text(text)
    sents = split_sentences(clean)
    if not sents:
        return {"sentences": [], "embeddings": []}
    
    # Generate embeddings
    embeddings = _model.encode(sents, batch_size=32, convert_to_tensor=True)
    # Convert to list for JSON serialization
    emb_list = embeddings.cpu().numpy().tolist()
    
    return {"sentences": sents, "embeddings": emb_list}


# ── TF-IDF + Cosine Similarity ────────────────────────────────────────────────

def compute_tfidf_cosine(text_a: str, text_b: str) -> Tuple[float, float]:
    """
    Returns (cosine_similarity, tfidf_score).
    cosine_similarity: raw cosine on TF-IDF vectors (0–1).
    tfidf_score:       weighted by shared vocabulary coverage (0–1).
    """
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    try:
        tfidf = vectorizer.fit_transform([clean_text(text_a), clean_text(text_b)])
    except ValueError:
        return 0.0, 0.0

    cos_sim = float(sk_cosine(tfidf[0], tfidf[1])[0][0])

    # Vocabulary overlap ratio as tfidf_score
    vocab    = vectorizer.vocabulary_
    tokens_a = set(clean_text(text_a).split())
    tokens_b = set(clean_text(text_b).split())
    shared   = tokens_a & tokens_b & set(vocab.keys())
    union    = tokens_a | tokens_b
    tfidf_score = len(shared) / len(union) if union else 0.0

    return round(cos_sim, 4), round(tfidf_score, 4)


# ── BERT Sentence-Level Paraphrase Detection ──────────────────────────────────

def detect_paraphrases(
    sents_submitted: List[str],
    sents_reference: List[str],
    similarity_threshold: float = 0.45,
    paraphrase_threshold: float = 0.72,
    emb_ref: Any = None,
) -> Tuple[List[Dict[str, Any]], float]:
    """
    Compare every submitted sentence against every reference sentence.
    'emb_ref' can be pre-computed embeddings.
    """
    if not sents_submitted or not sents_reference:
        return [], 0.0

    # Encode submitted sentences
    emb_sub = _model.encode(sents_submitted, batch_size=32, convert_to_tensor=True)
    
    # Use precomputed reference embeddings or compute them now
    if emb_ref is not None:
        # Convert list back to tensor if needed
        if isinstance(emb_ref, list):
            emb_ref = np.array(emb_ref)
        if isinstance(emb_ref, np.ndarray):
            import torch
            # Explicitly cast to float32 to match model output and avoid float != double error
            emb_ref = torch.from_numpy(emb_ref).to(device=_model.device, dtype=torch.float32)
    else:
        emb_ref = _model.encode(sents_reference, batch_size=32, convert_to_tensor=True)

    # Cosine similarity matrix: (len_sub × len_ref)
    sim_matrix = util.cos_sim(emb_sub, emb_ref).cpu().numpy()

    flagged    = []
    top_scores = []

    for i, sub_sent in enumerate(sents_submitted):
        best_j   = int(sim_matrix[i].argmax())
        best_sim = float(sim_matrix[i, best_j])
        top_scores.append(best_sim)

        if best_sim >= similarity_threshold:
            flagged.append({
                "submitted_sentence": sub_sent,
                "reference_sentence": sents_reference[best_j],
                "similarity":         round(best_sim, 4),
                "is_paraphrase":      best_sim >= paraphrase_threshold,
            })

    avg_score = round(sum(top_scores) / len(top_scores), 4) if top_scores else 0.0
    # Sort by similarity descending
    flagged.sort(key=lambda x: x["similarity"], reverse=True)
    return flagged, avg_score


# ── Summary generator ─────────────────────────────────────────────────────────

def build_summary(cosine_sim: float, paraphrase_score: float,
                  flagged_count: int, total_sentences: int) -> str:
    pct  = int(cosine_sim * 100)
    para = int(paraphrase_score * 100)

    if cosine_sim >= 0.80:
        level = "high"
    elif cosine_sim >= 0.40:
        level = "moderate"
    else:
        level = "low"

    flagged_pct = int(flagged_count / total_sentences * 100) if total_sentences else 0

    msgs = {
        "high":     f"Documents show {pct}% cosine similarity — strong evidence of plagiarism. "
                    f"{flagged_count} of {total_sentences} sentences ({flagged_pct}%) are flagged, "
                    f"with a BERT paraphrase score of {para}%.",
        "moderate": f"Documents show {pct}% cosine similarity — possible partial or paraphrased plagiarism. "
                    f"{flagged_count} sentences flagged. BERT paraphrase score: {para}%.",
        "low":      f"Documents show only {pct}% cosine similarity — likely original content. "
                    f"{flagged_count} sentence(s) had minor overlap. BERT score: {para}%.",
    }
    return msgs[level]


# ── Public API ────────────────────────────────────────────────────────────────

# ── Library-Level Analysis (1 vs Many) ────────────────────────────────────────

def analyze_library(
    submitted_text: str,
    library_docs: List[Dict[str, Any]],
    top_k: int = 5
) -> Dict[str, Any]:
    """
    Compare a single submitted document against an entire library.
    Returns:
      - overall_top_matches: List of {doc_id, title, cosine_similarity, ...}
    """
    if not library_docs:
        return {"matches": [], "summary": "Library is empty."}

    # 1. Preprocess submission
    clean_sub = clean_text(submitted_text)
    sents_sub = split_sentences(clean_sub)
    if not sents_sub:
        return {"error": "Submitted text is too short or empty."}

    # 2. Batch Document-Level Similarity (TF-IDF)
    # We'll use a single Vectorizer for the whole library + submission
    all_texts = [clean_sub] + [clean_text(d.get("text", "")) for d in library_docs if d.get("text")]
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    try:
        tfidf_matrix = vectorizer.fit_transform(all_texts)
    except ValueError:
        return {"error": "TF-IDF computation failed."}

    # Cosine vs all library docs
    # tfidf_matrix[0] is the submission
    doc_similarities = sk_cosine(tfidf_matrix[0:1], tfidf_matrix[1:]).flatten()

    # 3. Identify Top K
    match_indices = doc_similarities.argsort()[::-1][:top_k]
    matches = []

    for idx in match_indices:
        similarity = float(doc_similarities[idx])
        if similarity < 0.05: continue # Skip completely unrelated docs
        
        lib_doc = library_docs[idx]
        
        # Check for precomputed data
        sents_ref = lib_doc.get("sentences")
        emb_ref   = lib_doc.get("embeddings")

        if not sents_ref:
            lib_text = clean_text(lib_doc["text"])
            sents_ref = split_sentences(lib_text)
            emb_ref   = None # Fallback to on-the-fly encoding

        # 4. Sentence-Level analysis (BERT)
        flagged, paraphrase_score = detect_paraphrases(sents_sub, sents_ref, emb_ref=emb_ref)

        matches.append({
            "id": str(lib_doc["_id"]) if "_id" in lib_doc else str(idx),
            "title": lib_doc.get("title", "Untitled"),
            "cosine_similarity": round(similarity, 4),
            "paraphrase_score": paraphrase_score,
            "flagged_count": len(flagged),
            "plagiarized_sentences": flagged[:15], # cap sentences per match
            "summary": build_summary(similarity, paraphrase_score, len(flagged), len(sents_sub))
        })

    # Return results sorted by similarity
    return {
        "matches": matches,
        "total_library_size": len(library_docs),
        "stats": {
            "submitted_sentences": len(sents_sub)
        }
    }


def analyze(
    submitted_bytes: bytes, submitted_name: str,
    reference_bytes: bytes, reference_name: str,
) -> Dict[str, Any]:
    """
    Full pipeline. Returns a result dict consumed by the Express backend.
    """
    # 1. Extract
    text_sub = extract_text(submitted_bytes, submitted_name)
    text_ref = extract_text(reference_bytes, reference_name)

    # 2. TF-IDF cosine
    cosine_sim, tfidf_score = compute_tfidf_cosine(text_sub, text_ref)

    # 3. Sentence split
    sents_sub = split_sentences(text_sub)
    sents_ref = split_sentences(text_ref)

    # 4. BERT paraphrase detection
    flagged, paraphrase_score = detect_paraphrases(sents_sub, sents_ref)

    # 5. Summary
    summary = build_summary(cosine_sim, paraphrase_score, len(flagged), len(sents_sub))

    return {
        "cosine_similarity":     cosine_sim,
        "tfidf_score":           tfidf_score,
        "paraphrase_score":      paraphrase_score,
        "plagiarized_sentences": flagged[:30],  # cap at 30 for response size
        "summary":               summary,
        "stats": {
            "submitted_sentences": len(sents_sub),
            "reference_sentences": len(sents_ref),
            "flagged_sentences":   len(flagged),
        },
    }
