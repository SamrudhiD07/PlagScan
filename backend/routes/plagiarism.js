const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");
const ScanRecord = require("../models/ScanRecord");
const LibraryDocument = require("../models/LibraryDocument");

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
    const refFile = req.files?.reference?.[0]; // Optional now

    if (!subFile) return res.status(400).json({ message: "Submitted file required" });

    try {
      let result;
      const form = new FormData();
      form.append("submitted", fs.createReadStream(subFile.path), subFile.originalname);

      if (refFile) {
        // --- 1v1 Comparison ---
        form.append("reference", fs.createReadStream(refFile.path), refFile.originalname);
        const mlRes = await fetch(`${process.env.ML_SERVICE_URL || "http://localhost:8000"}/analyze`,
          { method: "POST", body: form, headers: form.getHeaders() });
        if (!mlRes.ok) throw new Error(`ML service error: ${await mlRes.text()}`);
        const data = await mlRes.json();
        result = { 
          matches: [{ 
            title: refFile.originalname, 
            cosine_similarity: data.cosine_similarity,
            paraphrase_score: data.paraphrase_score,
            flagged_count: data.plagiarized_sentences?.length ?? 0,
            plagiarized_sentences: data.plagiarized_sentences,
            summary: data.summary 
          }],
          stats: data.stats 
        };
      } else {
        // --- Library Scan (1vMany) ---
        // ML Service now fetches the library directly from MongoDB to avoid payload limits
        const mlRes = await fetch(`${process.env.ML_SERVICE_URL || "http://localhost:8000"}/analyze-library`,
          { method: "POST", body: form, headers: form.getHeaders() });
        if (!mlRes.ok) throw new Error(`ML service error: ${await mlRes.text()}`);
        result = await mlRes.json();
      }

      const record = await ScanRecord.create({
        user: req.user.id,
        submitted_file: subFile.originalname,
        matches: result.matches.map(m => ({
          docId: m.id,
          title: m.title,
          cosine_similarity: m.cosine_similarity,
          paraphrase_score: m.paraphrase_score,
          flagged_count: m.flagged_count,
          plagiarized_sentences: m.plagiarized_sentences,
          summary: m.summary
        })),
        total_library_size: result.total_library_size,
        // Backward compatibility (using best match)
        reference_file: result.matches[0]?.title || "N/A",
        cosine_similarity: result.matches[0]?.cosine_similarity || 0
      });

      res.json({ ...result, recordId: record._id });
    } catch (e) {
      console.error("PLAGIARISM CHECK ERROR:", e);
      res.status(500).json({ message: e.message });
    } finally {
      [subFile?.path, refFile?.path].forEach(p => { if (p && fs.existsSync(p)) fs.unlinkSync(p); });
    }
  });
});

router.get("/history", async (req, res) => {
  try {
    const records = await ScanRecord.find({ user: req.user.id }).sort({ createdAt: -1 }).limit(50).select("-plagiarized_sentences");
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