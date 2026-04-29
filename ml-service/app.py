import logging
import os
import json
from flask import Flask, request, jsonify
from flask_cors import CORS
from plagiarism_engine import analyze, extract_text, detect_similar_sentences, split_sentences, compute_tfidf_cosine, build_summary

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024
CORS(app)

ALLOWED_EXTENSIONS = {".pdf", ".txt", ".doc", ".docx"}
MAX_FILE_BYTES = 10 * 1024 * 1024

def _ext(filename):
    return "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

def _validate(file):
    if not file or file.filename == "":
        return "File missing"
    if _ext(file.filename) not in ALLOWED_EXTENSIONS:
        return f"Unsupported file type: {file.filename}"
    data = file.read()
    if len(data) > MAX_FILE_BYTES:
        return f"File too large: {file.filename}"
    file._cached_bytes = data
    return None

@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})

@app.route("/extract", methods=["POST"])
def extract_endpoint():
    f = request.files.get("file")
    err = _validate(f)
    if err:
        return jsonify({"error": err}), 400
    try:
        text = extract_text(f._cached_bytes, f.filename)
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/preprocess", methods=["POST"])
def preprocess_endpoint():
    f = request.files.get("file")
    if not f:
        return jsonify({"error": "No file provided"}), 400
    err = _validate(f)
    if err:
        return jsonify({"error": err}), 400
    try:
        text = extract_text(f._cached_bytes, f.filename)
        sentences = split_sentences(text)
        return jsonify({
            "text":      text,
            "sentences": sentences,
            "count":     len(sentences)
        })
    except Exception as e:
        logger.exception("Preprocessing failed")
        return jsonify({"error": str(e)}), 500

@app.route("/analyze", methods=["POST"])
def analyze_endpoint():
    submitted = request.files.get("submitted")
    reference = request.files.get("reference")
    for f in (submitted, reference):
        err = _validate(f)
        if err:
            return jsonify({"error": err}), 400
    try:
        result = analyze(
            submitted_bytes=submitted._cached_bytes,
            submitted_name=submitted.filename,
            reference_bytes=reference._cached_bytes,
            reference_name=reference.filename,
        )
        return jsonify(result)
    except Exception as e:
        logger.exception("Analysis failed")
        return jsonify({"error": str(e)}), 500

@app.route("/analyze-library", methods=["POST"])
def analyze_library_endpoint():
    submitted = request.files.get("submitted")
    err = _validate(submitted)
    if err:
        return jsonify({"error": err}), 400

    library_docs = request.form.get("library_docs")
    if not library_docs:
        return jsonify({"matches": [], "total_library_size": 0, "summary": "No library documents provided."})

    try:
        library_docs = json.loads(library_docs)
        submitted_text = extract_text(submitted._cached_bytes, submitted.filename)
        sents_sub = split_sentences(submitted_text)

        matches = []
        for doc in library_docs:
            ref_text = doc.get("text", "")
            if not ref_text.strip():
                continue
            cosine_sim, tfidf_score = compute_tfidf_cosine(submitted_text, ref_text)
            sents_ref = split_sentences(ref_text)
            flagged, paraphrase_score = detect_similar_sentences(sents_sub, sents_ref)
            summary = build_summary(cosine_sim, paraphrase_score, len(flagged), len(sents_sub))
            matches.append({
                "id":                    doc.get("_id", ""),
                "title":                 doc.get("title", "Unknown"),
                "cosine_similarity":     cosine_sim,
                "tfidf_score":           tfidf_score,
                "paraphrase_score":      paraphrase_score,
                "flagged_count":         len(flagged),
                "plagiarized_sentences": flagged[:10],
                "summary":               summary,
            })

        matches.sort(key=lambda x: x["cosine_similarity"], reverse=True)

        return jsonify({
            "matches":            matches[:10],
            "total_library_size": len(library_docs),
            "summary":            f"Checked against {len(library_docs)} documents. Top match: {matches[0]['cosine_similarity']*100:.0f}%" if matches else "No matches found."
        })

    except Exception as e:
        logger.exception("Library analysis failed")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)