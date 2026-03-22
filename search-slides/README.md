# Search slides (MSAI 348 Intro to AI)

## Two ways to view the slides

1. **index.html** — **Image-only viewer.** Shows the PDF slides (images only), no editable panel. ← → or Space to navigate.  
   Build: `node search-slides/build-image-only.js`

2. **index-with-source.html** — Same images plus a “Show editable source” panel (content from `content/01.md` … `108.md`).  
   Build: `node search-slides/build.js` (requires `content/*.md`; run `init-content.js` first if needed).

Both need `slides/1.png` … `108.png` (from `node search-slides/pdf-to-slides.mjs /path/to/Search.pdf`).

## Teach: BFS (web version)

**teach-bfs.html** — A separate, colorful web lesson that teaches Breadth-First Search with diagrams and short explanations (no PDF look). Open it directly or from the link on the image-only viewer.

## Editing slide text (for index-with-source)

- Edit `content/01.md` … `content/108.md`. Then run `node search-slides/build.js` and refresh **index-with-source.html** to see updated source in the panel.
- You can also ask the AI to edit a slide; it will change the right `content/NN.md` file.

## First-time setup

1. **Slide images:**  
   `node search-slides/pdf-to-slides.mjs /path/to/Search.pdf`  
   → creates `slides/1.png` … `108.png`.

2. **Content files** (only for index-with-source):  
   Put extracted PDF text at `search-slides-extract.txt` in the repo root, then:  
   `node search-slides/init-content.js`  
   → creates `content/01.md` … `108.md`.

3. **Build:**  
   - Image-only: `node search-slides/build-image-only.js` → **index.html**  
   - With source: `node search-slides/build.js` → **index-with-source.html**
