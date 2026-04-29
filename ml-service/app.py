import logging
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from plagiarism_engine import analyze, extract_text

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

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port, debug=False)