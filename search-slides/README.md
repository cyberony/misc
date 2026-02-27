# Search slides (MSAI 348 Intro to AI)

Web slide viewer for the **Search** deck — MSAI 348: Intro to Artificial Intelligence (Instructor: Mohammed A. Alam).

## Use

Open **index.html** in a browser. Use **Previous** / **Next** or the **←** / **→** arrow keys (or Space) to move between slides.

## Rebuild from PDF

If you have the original `Search.pdf`:

1. Extract text: `node extract-pdf-text.js /path/to/Search.pdf` (writes `_extracted.txt` next to the PDF).
2. Copy the extracted text to the misc repo as `search-slides-extract.txt` (in the repo root, one level up from `search-slides/`).
3. Run: `node search-slides/build.js`

This regenerates `index.html` from the extracted text.
