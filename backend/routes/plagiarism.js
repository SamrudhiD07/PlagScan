const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");
const ScanRecord = require("../models/ScanRecord");

const ALLOWED_MIME = new Set([
  "application/pdf", "text/plain", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (_, file, cb) => cb(null, `${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`),
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_MIME.has(file.mimetype) || [".pdf",".txt",".doc",".docx"].includes(ext))
      return cb(null, true);
    cb(new Error("Only PDF, TXT, DOC, DOCX allowed"));
  },
}).fields([{ name: "submitted", maxCount: 1 }, { name: "reference", maxCount: 1 }]);

router.post("/check", (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });

    const subFile = req.files?.submitted?.[0];
    const refFile = req.files?.reference?.[0];

    if (!subFile) return res.status(400).json({ message: "Submitted file required" });

    try {
      let result;
      const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

      if (refFile) {
        // ── 1v1 Comparison ──────────────────────────────────────────────
        const form = new FormData();
        form.append("submitted", fs.createReadStream(subFile.path), subFile.originalname);
        form.append("reference", fs.createReadStream(refFile.path), refFile.originalname);

        const mlRes = await fetch(`${ML_URL}/analyze`,
          { method: "POST", body: form, headers: form.getHeaders() });

        if (!mlRes.ok) throw new Error(`ML service error: ${await mlRes.text()}`);
        const data = await mlRes.json();

        result = {
          matches: [{
            title:                 refFile.originalname,
            cosine_similarity:     data.cosine_similarity,
            tfidf_score:           data.tfidf_score,
            paraphrase_score:      data.paraphrase_score,
            flagged_count:         data.plagiarized_sentences?.length ?? 0,
            plagiarized_sentences: data.plagiarized_sentences,
            summary:               data.summary,
          }],
          total_library_size: 1,
          stats: data.stats,
        };

      } else {
        // ── Library Scan ────────────────────────────────────────────────
        // Fetch library docs from MongoDB and send to ML service
        const mongoose = require("mongoose");
        const db = mongoose.connection.db;
        const libraryDocs = await db.collection("librarydocuments")
          .find({}, { projection: { title: 1, text: 1 } })
          .toArray();

        if (libraryDocs.length === 0) {
          return res.json({
            matches: [],
            total_library_size: 0,
            summary: "Library is empty. Please add documents to the library first."
          });
        }

        // Serialize library docs as JSON and send with file
        const form = new FormData();
        form.append("submitted", fs.createReadStream(subFile.path), subFile.originalname);
        form.append("library_docs", JSON.stringify(
          libraryDocs.map(d => ({
            _id:   d._id.toString(),
            title: d.title || "Untitled",
            text:  d.text  || "",
          }))
        ));

        const mlRes = await fetch(`${ML_URL}/analyze-library`,
          { method: "POST", body: form, headers: form.getHeaders() });

        if (!mlRes.ok) throw new Error(`ML service error: ${await mlRes.text()}`);
        result = await mlRes.json();
      }

      // ── Save to DB ────────────────────────────────────────────────────
      const record = await ScanRecord.create({
        user:               req.user.id,
        submitted_file:     subFile.originalname,
        reference_file:     result.matches[0]?.title || "Library Scan",
        cosine_similarity:  result.matches[0]?.cosine_similarity || 0,
        paraphrase_score:   result.matches[0]?.paraphrase_score  || 0,
        flagged_count:      result.matches[0]?.flagged_count      || 0,
        plagiarized_sentences: result.matches[0]?.plagiarized_sentences || [],
        summary:            result.matches[0]?.summary || "",
        matches:            result.matches.map(m => ({
          title:              m.title,
          cosine_similarity:  m.cosine_similarity,
          paraphrase_score:   m.paraphrase_score,
          flagged_count:      m.flagged_count,
          summary:            m.summary,
        })),
        total_library_size: result.total_library_size || 1,
      });

      res.json({ ...result, recordId: record._id });

    } catch (e) {
      console.error("PLAGIARISM CHECK ERROR:", e);
      res.status(500).json({ message: e.message });
    } finally {
      [subFile?.path, refFile?.path].forEach(p => {
        if (p && fs.existsSync(p)) fs.unlinkSync(p);
      });
    }
  });
});

router.get("/history", async (req, res) => {
  try {
    const records = await ScanRecord.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(50)
      .select("-plagiarized_sentences");
    res.json({ records });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get("/history/:id", async (req, res) => {
  try {
    const record = await ScanRecord.findOne({ _id: req.params.id, user: req.user.id });
    if (!record) return res.status(404).json({ message: "Not found" });
    res.json({ record });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

module.exports = router;