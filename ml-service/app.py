import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from plagiarism_engine import analyze, analyze_library, extract_text, get_embeddings

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 100 * 1024 * 1024 # Buffer
CORS(app)

# MongoDB Setup for Direct Library Access
import os
from pymongo import MongoClient
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/plagiarism_db")
mongo_client = MongoClient(MONGO_URI)
try:
    db = mongo_client.get_default_database()
except Exception:
    db = mongo_client["plagiarism_db"]
library_collection = db["librarydocuments"]

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
    if err: return jsonify({"error": err}), 400
    try:
        text = extract_text(f._cached_bytes, f.filename)
        return jsonify({"text": text})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/preprocess", methods=["POST"])
def preprocess_endpoint():
    f = request.files.get("file")
    if not f:
        # Maybe text was sent instead of file
        text = request.json.get("text") if request.is_json else None
        if not text: return jsonify({"error": "No file or text"}), 400
    else:
        err = _validate(f)
        if err: return jsonify({"error": err}), 400
        text = extract_text(f._cached_bytes, f.filename)
    
    try:
        data = get_embeddings(text)
        return jsonify(data)
    except Exception as e:
        logger.exception("Pre-processing failed")
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
    f = request.files.get("submitted")
    err = _validate(f)
    if err: return jsonify({"error": err}), 400
    
    try:
        # Fetch library documents directly from MongoDB and convert ObjectId to string
        # Including sentences and embeddings in the projection
        library_docs = []
        for doc in library_collection.find({}, {"title": 1, "text": 1, "sentences": 1, "embeddings": 1}):
            doc["_id"] = str(doc["_id"])
            library_docs.append(doc)

        if not library_docs:
            return jsonify({"matches": [], "total_library_size": 0, "summary": "Library is empty."})

        submitted_text = extract_text(f._cached_bytes, f.filename)
        result = analyze_library(submitted_text, library_docs)
        return jsonify(result)
    except Exception as e:
        logger.exception("Library analysis failed")
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000, debug=False)