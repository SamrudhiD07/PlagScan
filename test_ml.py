import sys
import os
sys.path.append(os.path.join(os.getcwd(), 'ml-service'))

import torch
import numpy as np
from plagiarism_engine import analyze_library

# Mock library docs
library_docs = [
    {
        "_id": "60d5f9e0f1d2b34c5d6e7f8a",
        "title": "Test Doc 1",
        "text": "This is a test document about artificial intelligence and machines.",
        "sentences": ["This is a test document", "about artificial intelligence and machines."],
        "embeddings": np.random.randn(2, 384).tolist()
    }
]

submitted_text = "This is a test document about AI and robot machines."

print("Starting analysis...")
try:
    result = analyze_library(submitted_text, library_docs)
    print("Success!")
    print(result)
except Exception as e:
    print(f"FAILED: {e}")
    import traceback
    traceback.print_exc()
