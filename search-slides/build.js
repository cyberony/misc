#!/usr/bin/env node
/**
 * Build index.html from content/01.md … 108.md and slides/1.png … 108.png.
 * - Viewer shows the PDF image per slide (looks like the PDF).
 * - Content from content/N.md is the editable source (edit those files or ask the AI to).
 * Run: node build.js
 * Requires: content/*.md (run init-content.js once), slides/*.png (run pdf-to-slides.mjs).
 */
const fs = require('fs');
const path = require('path');

const contentDir = path.join(__dirname, 'content');
const TOTAL = 108;

const contents = [];
for (let i = 1; i <= TOTAL; i++) {
  const n = i.toString().padStart(2, '0');
  const p = path.join(contentDir, n + '.md');
  const raw = fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : '(No content yet.)';
  // Escape for embedding in HTML (show as pre or simple HTML)
  const escaped = raw
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  contents.push(escaped);
}

const contentsJson = JSON.stringify(contents);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Search — MSAI 348 Intro to AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    :root {
      --bg: #0f0f12;
      --bg-elevated: #18181c;
      --fg: #e4e4e7;
      --fg-muted: #71717a;
      --accent: #6366f1;
      --border: #27272a;
      --radius: 8px;
    }
    body { margin: 0; min-height: 100vh; font-family: 'DM Sans', system-ui, sans-serif; background: var(--bg); color: var(--fg); display: flex; flex-direction: column; overflow: hidden; }
    .header { flex-shrink: 0; padding: 0.75rem 1.5rem; border-bottom: 1px solid var(--border); background: var(--bg-elevated); display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .header h1 { margin: 0; font-size: 1rem; font-weight: 600; }
    .header .meta { font-size: 0.8125rem; color: var(--fg-muted); }
    .nav { display: flex; align-items: center; gap: 0.5rem; }
    .nav button { background: var(--bg); color: var(--fg); border: 1px solid var(--border); width: 40px; height: 40px; border-radius: var(--radius); cursor: pointer; font-size: 1.25rem; display: flex; align-items: center; justify-content: center; }
    .nav button:hover:not(:disabled) { background: var(--bg-elevated); border-color: var(--accent); color: var(--accent); }
    .nav button:disabled { opacity: 0.4; cursor: not-allowed; }
    .counter { min-width: 5ch; text-align: center; font-variant-numeric: tabular-nums; font-size: 0.875rem; color: var(--fg-muted); }
    .main { flex: 1; overflow: auto; display: flex; align-items: center; justify-content: center; padding: 1rem; }
    .slide-wrap { max-width: 100%; max-height: 100%; display: flex; flex-direction: column; align-items: center; gap: 0.75rem; }
    .slide-img { max-width: 100%; max-height: calc(100vh - 200px); width: auto; height: auto; display: block; border-radius: 4px; box-shadow: 0 4px 24px rgba(0,0,0,0.3); }
    .source-toggle { font-size: 0.75rem; color: var(--fg-muted); cursor: pointer; user-select: none; }
    .source-toggle:hover { color: var(--accent); }
    .source-content { display: none; max-width: 900px; width: 100%; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius); padding: 1rem; font-size: 0.8125rem; white-space: pre-wrap; max-height: 200px; overflow: auto; }
    .source-content.open { display: block; }
    .hint { font-size: 0.75rem; color: var(--fg-muted); text-align: center; margin-top: 0.25rem; }
  </style>
</head>
<body>
  <header class="header">
    <div><h1>Search</h1><span class="meta">MSAI 348: Intro to AI — Mohammed A. Alam</span></div>
    <nav class="nav">
      <button type="button" id="prev" aria-label="Previous">←</button>
      <span class="counter" id="counter">1 / ${TOTAL}</span>
      <button type="button" id="next" aria-label="Next">→</button>
    </nav>
  </header>
  <main class="main">
    <div class="slide-wrap">
      <img id="slideImg" class="slide-img" src="slides/1.png" alt="Slide 1">
      <span class="source-toggle" id="sourceToggle">Show editable source (content/N.md)</span>
      <pre class="source-content" id="sourceContent"></pre>
    </div>
  </main>
  <p class="hint">← → or Space to navigate. Slide text lives in content/01.md … 108.md — edit those (or ask the AI) then run node build.js.</p>

  <script>
    const contents = ${contentsJson};
    const total = ${TOTAL};
    let index = 0;
    const slideImg = document.getElementById('slideImg');
    const counterEl = document.getElementById('counter');
    const sourceContent = document.getElementById('sourceContent');
    const sourceToggle = document.getElementById('sourceToggle');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');

    function updateSlide() {
      const n = index + 1;
      slideImg.src = 'slides/' + n + '.png';
      slideImg.alt = 'Slide ' + n;
      counterEl.textContent = n + ' / ' + total;
      sourceContent.textContent = contents[index];
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === total - 1;
    }

    sourceToggle.addEventListener('click', () => {
      sourceContent.classList.toggle('open');
      sourceToggle.textContent = sourceContent.classList.contains('open') ? 'Hide editable source' : 'Show editable source (content/N.md)';
    });

    function go(delta) {
      index = Math.max(0, Math.min(index + delta, total - 1));
      updateSlide();
    }

    prevBtn.addEventListener('click', () => go(-1));
    nextBtn.addEventListener('click', () => go(1));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === ' ') { go(1); e.preventDefault(); }
    });

    updateSlide();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'index-with-source.html'), html, 'utf8');
console.log('Wrote index-with-source.html (images + editable source panel). Use index.html for image-only.');