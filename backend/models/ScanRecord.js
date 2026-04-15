const mongoose = require("mongoose");

const flaggedSchema = new mongoose.Schema({
  submitted_sentence: String,
  reference_sentence: String,
  similarity: Number,
  is_paraphrase: Boolean,
}, { _id: false });

const matchSchema = new mongoose.Schema({
  docId:              { type: mongoose.Schema.Types.ObjectId, ref: "LibraryDocument" },
  title:              { type: String },
  cosine_similarity:  { type: Number },
  paraphrase_score:   { type: Number },
  flagged_count:      { type: Number },
  plagiarized_sentences: [flaggedSchema],
  summary:            { type: String },
}, { _id: false });

const scanSchema = new mongoose.Schema({
  user:               { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  submitted_file:     { type: String, required: true },
  matches:            [matchSchema],
  total_library_size: { type: Number },
  // Backward compatibility
  reference_file:     { type: String },
  cosine_similarity:  { type: Number },
}, { timestamps: true });

module.exports = mongoose.model("ScanRecord", scanSchema);