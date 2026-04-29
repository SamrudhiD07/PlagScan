import re
import io
import logging
from typing import List, Dict, Any, Tuple

import nltk
import PyPDF2
import docx
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity as sk_cosine

for pkg in ("punkt", "stopwords", "punkt_tab"):
    try:
        nltk.download(pkg, quiet=True)
    except:
        pass

from nltk.tokenize import sent_tokenize
from nltk.corpus import stopwords

logger = logging.getLogger(__name__)

# ── Text Extraction ───────────────────────────────────────────────────────────

def extract_text(file_bytes: bytes, filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext == "pdf":
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        return "\n".join([page.extract_text() or "" for page in reader.pages])
    if ext in ("doc", "docx"):
        doc = docx.Document(io.BytesIO(file_bytes))
        return "\n".join([p.text for p in doc.paragraphs if p.text.strip()])
    return file_bytes.decode("utf-8", errors="replace")

# ── Preprocessing ─────────────────────────────────────────────────────────────

def clean_text(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^a-z0-9\s\.\!\?]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text

def split_sentences(text: str) -> List[str]:
    sentences = sent_tokenize(text)
    return [s.strip() for s in sentences if len(s.strip().split()) >= 5]

# ── TF-IDF Cosine Similarity ──────────────────────────────────────────────────

def compute_tfidf_cosine(text_a: str, text_b: str) -> Tuple[float, float]:
    vectorizer = TfidfVectorizer(stop_words="english", ngram_range=(1, 2))
    try:
        tfidf = vectorizer.fit_transform([clean_text(text_a), clean_text(text_b)])
    except ValueError:
        return 0.0, 0.0
    cos_sim = float(sk_cosine(tfidf[0], tfidf[1])[0][0])
    vocab = vectorizer.vocabulary_
    tokens_a = set(clean_text(text_a).split())
    tokens_b = set(clean_text(text_b).split())
    shared = tokens_a & tokens_b & set(vocab.keys())
    union = tokens_a | tokens_b
    tfidf_score = len(shared) / len(union) if union else 0.0
    return round(cos_sim, 4), round(tfidf_score, 4)

# ── Sentence-Level Matching (TF-IDF based, no BERT) ──────────────────────────

def detect_similar_sentences(
    sents_submitted: List[str],
    sents_reference: List[str],
    threshold: float = 0.45,
) -> Tuple[List[Dict[str, Any]], float]:
    if not sents_submitted or not sents_reference:
        return [], 0.0

    all_sents = sents_submitted + sents_reference
    vectorizer = TfidfVectorizer(stop_words="english")
    try:
        tfidf_matrix = vectorizer.fit_transform(all_sents)
    except ValueError:
        return [], 0.0

    sub_matrix = tfidf_matrix[:len(sents_submitted)]
    ref_matrix = tfidf_matrix[len(sents_submitted):]

    sim_matrix = sk_cosine(sub_matrix, ref_matrix)

    flagged = []
    top_scores = []

    for i, sub_sent in enumerate(sents_submitted):
        best_j   = int(sim_matrix[i].argmax())
        best_sim = float(sim_matrix[i, best_j])
        top_scores.append(best_sim)

        if best_sim >= threshold:
            flagged.append({
                "submitted_sentence": sub_sent,
                "reference_sentence": sents_reference[best_j],
                "similarity":         round(best_sim, 4),
                "is_paraphrase":      best_sim >= 0.70,
            })

    avg_score = round(sum(top_scores) / len(top_scores), 4) if top_scores else 0.0
    flagged.sort(key=lambda x: x["similarity"], reverse=True)
    return flagged, avg_score

# ── Summary ───────────────────────────────────────────────────────────────────

def build_summary(cosine_sim, paraphrase_score, flagged_count, total_sentences):
    pct  = int(cosine_sim * 100)
    para = int(paraphrase_score * 100)
    flagged_pct = int(flagged_count / total_sentences * 100) if total_sentences else 0
    if cosine_sim >= 0.80:
        return f"Documents show {pct}% cosine similarity — strong evidence of plagiarism. {flagged_count} of {total_sentences} sentences ({flagged_pct}%) flagged."
    elif cosine_sim >= 0.40:
        return f"Documents show {pct}% cosine similarity — possible partial or paraphrased plagiarism. {flagged_count} sentences flagged."
    else:
        return f"Documents show only {pct}% cosine similarity — likely original content. {flagged_count} sentence(s) had minor overlap."

# ── Public API ────────────────────────────────────────────────────────────────

def analyze(submitted_bytes, submitted_name, reference_bytes, reference_name):
    text_sub = extract_text(submitted_bytes, submitted_name)
    text_ref = extract_text(reference_bytes, reference_name)

    cosine_sim, tfidf_score = compute_tfidf_cosine(text_sub, text_ref)

    sents_sub = split_sentences(text_sub)
    sents_ref = split_sentences(text_ref)

    flagged, paraphrase_score = detect_similar_sentences(sents_sub, sents_ref)

    summary = build_summary(cosine_sim, paraphrase_score, len(flagged), len(sents_sub))

    return {
        "cosine_similarity":     cosine_sim,
        "tfidf_score":           tfidf_score,
        "paraphrase_score":      paraphrase_score,
        "plagiarized_sentences": flagged[:30],
        "summary":               summary,
        "stats": {
            "submitted_sentences": len(sents_sub),
            "reference_sentences": len(sents_ref),
            "flagged_sentences":   len(flagged),
        },
    }