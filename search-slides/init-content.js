#!/usr/bin/env node
/**
 * Seed content/01.md … 108.md from extracted PDF text.
 * Run once: node init-content.js
 * Expects search-slides-extract.txt in parent dir.
 * After this, content/*.md are the source of truth — edit them (or ask the AI to).
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

const contentDir = path.join(__dirname, 'content');
fs.mkdirSync(contentDir, { recursive: true });

const TOTAL = 108;
for (let i = 0; i < TOTAL; i++) {
  const n = (i + 1).toString().padStart(2, '0');
  const text = textSlides[i] ? textSlides[i].content : `(Slide ${i + 1} — no text extracted.)`;
  fs.writeFileSync(path.join(contentDir, n + '.md'), text.trim() + '\n', 'utf8');
}

console.log('Wrote content/01.md … ' + TOTAL + '.md (' + TOTAL + ' files). Edit these; then run node build.js');