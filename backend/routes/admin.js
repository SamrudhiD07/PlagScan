const router = require("express").Router();
const User = require("../models/User");
const ScanRecord = require("../models/ScanRecord");
const LibraryDocument = require("../models/LibraryDocument");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const fetch = require("node-fetch");
const FormData = require("form-data");

const storage = multer.diskStorage({
  destination: (_, __, cb) => cb(null, path.join(__dirname, "../uploads")),
  filename: (_, file, cb) => cb(null, `LIB-${Date.now()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_")}`),
});
const upload = multer({ 
  storage, 
  limits: { fileSize: 10 * 1024 * 1024 } 
}).single("file");

router.get("/users", async (_, res) => {
  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-password");
    res.json({ users });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post("/users/:id/role", async (req, res) => {
  try {
    const { role } = req.body;
    if (!["user","admin"].includes(role)) return res.status(400).json({ message: "Invalid role" });
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.delete("/users/:id", async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await ScanRecord.deleteMany({ user: req.params.id });
    res.json({ message: "Deleted" });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get("/stats", async (_, res) => {
  try {
    const [totalUsers, totalScans, highRisk, avgArr, totalLib] = await Promise.all([
      User.countDocuments(),
      ScanRecord.countDocuments(),
      ScanRecord.countDocuments({ cosine_similarity: { $gte: 0.8 } }),
      ScanRecord.aggregate([{ $group: { _id: null, avg: { $avg: "$cosine_similarity" } } }]),
      LibraryDocument.countDocuments()
    ]);
    res.json({ totalUsers, totalScans, highRisk, avgScore: avgArr[0]?.avg ?? 0, totalLib });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// Library Management
router.get("/library", async (_, res) => {
  try {
    const documents = await LibraryDocument.find().sort({ createdAt: -1 }).select("-text");
    res.json({ documents });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post("/library/upload", (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(400).json({ message: err.message });
    if (!req.file) return res.status(400).json({ message: "File required" });

    try {
      // Create text extraction request
      const form = new FormData();
      form.append("file", fs.createReadStream(req.file.path), req.file.originalname);
      const preRes = await fetch(`${process.env.ML_SERVICE_URL || "http://localhost:8000"}/preprocess`, 
        { method: "POST", body: form, headers: form.getHeaders() });
      
      if (!preRes.ok) throw new Error("Pre-processing failed");
      const { sentences, embeddings } = await preRes.json();
      const text = (sentences || []).join(" ");

      const doc = await LibraryDocument.create({
        title: req.body.title || req.file.originalname,
        text: text || "[No text extracted]",
        sentences: sentences || [],
        embeddings: embeddings || [],
        fileType: path.extname(req.file.originalname),
        uploadedBy: req.user.id,
        filename: req.file.filename
      });

      res.json({ message: "Added to library", document: doc });
    } catch (e) {
      console.error("Library upload error:", e);
      res.status(500).json({ message: e.message });
    } finally {
      if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    }
  });
});

router.delete("/library/:id", async (req, res) => {
  try {
    await LibraryDocument.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted from library" });
  } catch (e) { 
    console.error("Error deleting library document:", e);
    res.status(500).json({ message: e.message }); 
  }
});

module.exports = router;
