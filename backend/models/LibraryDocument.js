const mongoose = require("mongoose");

const libraryDocumentSchema = new mongoose.Schema({
  title:      { type: String, required: true },
  text:       { type: String, required: true },
  sentences:  [{ type: String }],
  embeddings: [[Number]],
  fileType:   { type: String },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  filename:   { type: String }
}, { timestamps: true });

module.exports = mongoose.model("LibraryDocument", libraryDocumentSchema);
