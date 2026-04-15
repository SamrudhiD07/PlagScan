require("dotenv").config();
const express  = require("express");
const cors     = require("cors");
const mongoose = require("mongoose");
const path     = require("path");
const fs       = require("fs");

const authRoutes      = require("./routes/auth");
const plagRoutes      = require("./routes/plagiarism");
const adminRoutes     = require("./routes/admin");
const { authMiddleware, adminOnly } = require("./middleware/auth");

const app = express();

// Ensure upload dir exists
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

// Middleware
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api/auth",       authRoutes);
app.use("/api/plagiarism", authMiddleware, plagRoutes);
app.use("/api/admin",      authMiddleware, adminOnly, adminRoutes);

// Health check
app.get("/api/health", (_, res) => res.json({ status: "ok", time: new Date() }));

// MongoDB
mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/plagiarism_db")
  .then(() => console.log("✓ MongoDB connected"))
  .catch(e => console.error("✗ MongoDB:", e.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✓ Server running on port ${PORT}`));
