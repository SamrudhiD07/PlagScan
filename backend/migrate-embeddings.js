require("dotenv").config();
const mongoose = require("mongoose");
const fs = require("fs");
const fetch = require("node-fetch");
const LibraryDocument = require("./models/LibraryDocument");

const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/plagiarism_db";
const ML_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";

async function migrate() {
  console.log("Connecting to MongoDB...");
  await mongoose.connect(MONGO_URI);
  console.log("Connected.");

  const docs = await LibraryDocument.find({
    $or: [{ embeddings: { $exists: false } }, { embeddings: { $size: 0 } }]
  });

  console.log(`Found ${docs.length} documents to process.`);

  for (let i = 0; i < docs.length; i++) {
    const doc = docs[i];
    console.log(`[${i + 1}/${docs.length}] Processing: ${doc.title}...`);

    try {
      const res = await fetch(`${ML_URL}/preprocess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: doc.text })
      });

      if (!res.ok) {
        console.error(`  Error: ML service returned ${res.status}`);
        continue;
      }

      const { sentences, embeddings } = await res.json();

      await LibraryDocument.findByIdAndUpdate(doc._id, {
        sentences,
        embeddings
      });

      console.log(`  Success: Stored ${embeddings.length} embeddings.`);
    } catch (e) {
      console.error(`  Error: ${e.message}`);
    }
  }

  console.log("Migration finished.");
  process.exit(0);
}

migrate();
