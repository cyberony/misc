#!/usr/bin/env node
/**
 * Build search-slides/index.html from extracted PDF text.
 * Run: node build.js
 * Expects search-slides-extract.txt in parent dir (or pass path as arg).
 */
const fs = require('fs');
const path = require('path');

const extractPath = process.argv[2] || path.join(__dirname, '..', 'search-slides-extract.txt');
const raw = fs.readFileSync(extractPath, 'utf8');

// Split into slides: each slide starts with a line that is just a number
const allChunks = raw.trim().split(/\n(?=\d+\n)/);
const cover = allChunks[0].trim(); // "Search  MSAI 348  ..."
// Take first chunk that starts with "2\n", then "3\n", ... "107\n" (so we get 106 content slides in order)
const restChunks = allChunks.slice(1);
const slideChunks = [];
for (let n = 2; n <= 107; n++) {
  const prefix = n + '\n';
  const idx = restChunks.findIndex((c) => c.startsWith(prefix));
  if (idx >= 0) {
    slideChunks.push(restChunks[idx]);
  }
}

const slides = [
  { num: '1', content: cover.replace(/\t/g, '  ') },
  ...slideChunks.map((chunk) => {
    const firstNewline = chunk.indexOf('\n');
    const num = chunk.slice(0, firstNewline).trim();
    const content = chunk.slice(firstNewline + 1).trim();
    const contentClean = content.replace(/\t/g, '  ');
    return { num, content: contentClean };
  }),
];

const total = slides.length;
const slidesJson = JSON.stringify(slides.map((s) => ({ num: s.num, content: s.content })));

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Search — MSAI 348 Intro to AI</title>
  <style>
    * { box-sizing: border-box; }
    :root {
      --bg: #1a1b26;
      --fg: #c0caf5;
      --muted: #565f89;
      --accent: #7aa2f7;
      --slide-bg: #24283b;
      --border: #3b4261;
    }
    body {
      margin: 0;
      min-height: 100vh;
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: var(--bg);
      color: var(--fg);
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 1rem;
    }
    .toolbar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 1rem;
      flex-wrap: wrap;
    }
    .toolbar button {
      background: var(--slide-bg);
      color: var(--accent);
      border: 1px solid var(--border);
      padding: 0.5rem 1rem;
      border-radius: 6px;
      cursor: pointer;
      font-size: 1rem;
    }
    .toolbar button:hover {
      background: var(--border);
    }
    .toolbar .counter {
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }
    .slide-container {
      width: 100%;
      max-width: 900px;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }
    .slide {
      width: 100%;
      background: var(--slide-bg);
      border: 1px solid var(--border);
      border-radius: 12px;
      padding: 2rem 2.5rem;
      min-height: 400px;
      white-space: pre-wrap;
      font-size: clamp(0.9rem, 2vw, 1.05rem);
      line-height: 1.5;
      tab-size: 8;
    }
    .slide h2 {
      margin: 0 0 1rem 0;
      font-size: 1.25rem;
      color: var(--accent);
      border-bottom: 1px solid var(--border);
      padding-bottom: 0.5rem;
    }
    .slide-num {
      position: absolute;
      top: 1rem;
      right: 1rem;
      color: var(--muted);
      font-size: 0.875rem;
    }
    .slide-wrapper {
      position: relative;
      width: 100%;
    }
    .hint {
      margin-top: 1rem;
      color: var(--muted);
      font-size: 0.85rem;
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button type="button" id="prev" aria-label="Previous slide">← Previous</button>
    <span class="counter" id="counter">1 / ${total}</span>
    <button type="button" id="next" aria-label="Next slide">Next →</button>
  </div>
  <div class="slide-container">
    <div class="slide-wrapper">
      <div class="slide" id="slide" role="region" aria-live="polite"></div>
      <span class="slide-num" id="slideNum" aria-hidden="true"></span>
    </div>
    <p class="hint">Use ← → arrow keys or buttons to navigate</p>
  </div>

  <script>
    const slides = ${slidesJson};
    const total = ${total};
    const el = document.getElementById('slide');
    const counterEl = document.getElementById('counter');
    const slideNumEl = document.getElementById('slideNum');

    function escapeHtml(s) {
      const d = document.createElement('div');
      d.textContent = s;
      return d.innerHTML;
    }

    let index = 0;

    function render() {
      const s = slides[index];
      el.innerHTML = '<h2>Slide ' + escapeHtml(s.num) + '</h2>' + escapeHtml(s.content);
      counterEl.textContent = (index + 1) + ' / ' + total;
      slideNumEl.textContent = s.num + ' of 107';
    }

    function go(delta) {
      index = Math.max(0, Math.min(index + delta, total - 1));
      render();
    }

    document.getElementById('prev').addEventListener('click', () => go(-1));
    document.getElementById('next').addEventListener('click', () => go(1));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { go(-1); e.preventDefault(); }
      if (e.key === 'ArrowRight' || e.key === ' ') { go(1); e.preventDefault(); }
    });

    render();
  </script>
</body>
</html>
`;

fs.writeFileSync(path.join(__dirname, 'index.html'), html, 'utf8');
console.log('Wrote index.html with', total, 'slides');