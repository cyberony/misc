#!/usr/bin/env node
/**
 * Build index.html with one editable slide per page (no images).
 * Run: node build-editable.js
 * Expects search-slides-extract.txt in parent dir.
 */
const fs = require('fs');
const path = require('path');

const extractPath = path.join(__dirname, '..', 'search-slides-extract.txt');
if (!fs.existsSync(extractPath)) {
  console.error('Missing search-slides-extract.txt. Run extract-pdf-text.js on the PDF first.');
  process.exit(1);
}

const raw = fs.readFileSync(extractPath, 'utf8');
const allChunks = raw.trim().split(/\n(?=\d+\n)/);
const cover = allChunks[0].trim();
const restChunks = allChunks.slice(1);
const slideChunks = [];
for (let n = 2; n <= 107; n++) {
  const idx = restChunks.findIndex((c) => c.startsWith(n + '\n'));
  if (idx >= 0) slideChunks.push(restChunks[idx]);
}

const textSlides = [
  { num: 1, content: cover.replace(/\t/g, '  ') },
  ...slideChunks.map((chunk) => {
    const first = chunk.indexOf('\n');
    const num = chunk.slice(0, first).trim();
    const content = chunk.slice(first + 1).trim().replace(/\t/g, '  ');
    return { num, content };
  }),
];

const TOTAL_SLIDES = 108;

function escape(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Turn plain text into simple HTML: paragraphs, tables (tab-separated), lists (§ • -) */
function formatSlideContent(text) {
  if (!text.trim()) return '<p class="empty">(No text extracted for this slide.)</p>';
  const blocks = [];
  const lines = text.split(/\n/);
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) {
      i++;
      continue;
    }
    // List item
    if (/^[§•\-]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed) || /^\-\s/.test(trimmed)) {
      const items = [];
      while (i < lines.length && (lines[i].trim().match(/^[§•\-]\s/) || lines[i].trim().match(/^\d+\.\s/) || (lines[i].trim().startsWith('- ') && items.length > 0) || (items.length > 0 && lines[i].trim() && !lines[i].trim().includes('\t')))) {
        const l = lines[i].trim();
        if (l.match(/^[§•\-]\s/) || l.match(/^\d+\.\s/) || (items.length === 0 && l.startsWith('- '))) {
          items.push(l.replace(/^[§•\-]\s/, '').replace(/^\d+\.\s/, '').replace(/^\-\s/, ''));
          i++;
        } else if (items.length > 0 && l && !l.includes('\t')) {
          items[items.length - 1] += ' ' + l;
          i++;
        } else break;
      }
      blocks.push('<ul>' + items.map((it) => '<li>' + escape(it) + '</li>').join('') + '</ul>');
      continue;
    }
    // Table: 2+ consecutive lines with same number of tab-separated columns (2–8), short cells
    const cells = line.split(/\t+/).map((c) => c.trim()).filter(Boolean);
    const looksLikeTableRow = cells.length >= 2 && cells.length <= 8 && cells.every((c) => c.length < 40);
    if (looksLikeTableRow && i + 1 < lines.length) {
      const nextCells = lines[i + 1].split(/\t+/).map((c) => c.trim()).filter(Boolean);
      if (nextCells.length >= 2 && nextCells.length <= 8 && nextCells.every((c) => c.length < 40)) {
        const rows = [];
        while (i < lines.length) {
          const rowCells = lines[i].split(/\t+/).map((c) => c.trim());
          if (rowCells.length < 2 || rowCells.length > 8 || rowCells.some((c) => c.length > 60)) break;
          rows.push(rowCells.map((c) => escape(c)).join('</td><td>'));
          i++;
        }
        if (rows.length >= 1) {
          blocks.push('<table><tr><td>' + rows.join('</td></tr><tr><td>') + '</td></tr></table>');
          continue;
        }
      }
    }
    // Paragraph (merge consecutive non-empty lines that don't look like list/table)
    const paraLines = [];
    while (i < lines.length && lines[i].trim()) {
      const l = lines[i];
      if (l.trim().match(/^[§•\-]\s/) || l.trim().match(/^\d+\.\s/)) break;
      const cellCount = l.split(/\t+/).length;
      if (cellCount >= 2 && i + 1 < lines.length && lines[i + 1].split(/\t+/).length >= 2) break;
      paraLines.push(lines[i].trim());
      i++;
    }
    if (paraLines.length) {
      blocks.push('<p>' + escape(paraLines.join(' ')) + '</p>');
    }
  }
  return blocks.length ? blocks.join('\n') : '<p>' + escape(text.trim()) + '</p>';
}

const slides = [];
for (let i = 0; i < TOTAL_SLIDES; i++) {
  const oneBased = i + 1;
  const textSlide = textSlides[i];
  const htmlContent = textSlide ? formatSlideContent(textSlide.content) : '<p class="empty">(Slide ' + oneBased + ' — no text extracted.)</p>';
  slides.push({ num: oneBased, html: htmlContent });
}

const slidesJson = JSON.stringify(slides);

const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Search — MSAI 348 Intro to AI</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600&display=swap" rel="stylesheet">
  <style>
    * { box-sizing: border-box; }
    :root {
      --bg: #0f0f12;
      --bg-elevated: #18181c;
      --fg: #e4e4e7;
      --fg-muted: #71717a;
      --accent: #6366f1;
      --border: #27272a;
      --radius: 12px;
    }
    body { margin: 0; min-height: 100vh; font-family: 'DM Sans', system-ui, sans-serif; background: var(--bg); color: var(--fg); display: flex; flex-direction: column; overflow: hidden; }
    .header { flex-shrink: 0; padding: 0.75rem 1.5rem; border-bottom: 1px solid var(--border); background: var(--bg-elevated); display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
    .header h1 { margin: 0; font-size: 1rem; font-weight: 600; }
    .header .meta { font-size: 0.8125rem; color: var(--fg-muted); }
    .nav { display: flex; align-items: center; gap: 0.5rem; }
    .nav button { background: var(--bg); color: var(--fg); border: 1px solid var(--border); width: 40px; height: 40px; border-radius: 8px; cursor: pointer; font-size: 1.25rem; display: flex; align-items: center; justify-content: center; }
    .nav button:hover:not(:disabled) { background: var(--bg-elevated); border-color: var(--accent); color: var(--accent); }
    .nav button:disabled { opacity: 0.4; cursor: not-allowed; }
    .counter { min-width: 5ch; text-align: center; font-variant-numeric: tabular-nums; font-size: 0.875rem; color: var(--fg-muted); }
    .main { flex: 1; overflow: auto; padding: 1.5rem; display: flex; align-items: center; justify-content: center; }
    .slide { width: 100%; max-width: 900px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius); padding: 2rem 2.5rem; min-height: 320px; }
    .slide[contenteditable="true"] { outline: none; }
    .slide[contenteditable="true"]:focus { box-shadow: 0 0 0 2px var(--accent); }
    .slide p { margin: 0 0 0.75rem 0; line-height: 1.5; }
    .slide p:last-child { margin-bottom: 0; }
    .slide ul { margin: 0 0 0.75rem 0; padding-left: 1.5rem; }
    .slide table { width: 100%; border-collapse: collapse; margin: 0.75rem 0; font-size: 0.9rem; }
    .slide td { border: 1px solid var(--border); padding: 0.4rem 0.6rem; }
    .slide .empty { color: var(--fg-muted); font-style: italic; }
    .hint { text-align: center; font-size: 0.75rem; color: var(--fg-muted); margin-top: 0.5rem; }
  </style>
</head>
<body>
  <header class="header">
    <div><h1>Search</h1><span class="meta">MSAI 348: Intro to AI — Mohammed A. Alam</span></div>
    <nav class="nav">
      <button type="button" id="prev" aria-label="Previous">←</button>
      <span class="counter" id="counter">1 / ${TOTAL_SLIDES}</span>
      <button type="button" id="next" aria-label="Next">→</button>
    </nav>
  </header>
  <main class="main">
    <div class="slide" id="slideContent" contenteditable="true" spellcheck="true"></div>
  </main>
  <p class="hint">← → or Space to navigate. Click anywhere on the slide to edit.</p>

  <script>
    const slides = ${slidesJson};
    const total = ${TOTAL_SLIDES};
    let index = 0;
    const slideContent = document.getElementById('slideContent');
    const counterEl = document.getElementById('counter');
    const prevBtn = document.getElementById('prev');
    const nextBtn = document.getElementById('next');

    function updateSlide() {
      const s = slides[index];
      slideContent.innerHTML = s.html;
      counterEl.textContent = (index + 1) + ' / ' + total;
      prevBtn.disabled = index === 0;
      nextBtn.disabled = index === total - 1;
    }

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

fs.writeFileSync(path.join(__dirname, 'index.html'), html, 'utf8');
console.log('Wrote index.html with', TOTAL_SLIDES, 'editable slides.');