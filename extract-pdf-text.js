#!/usr/bin/env node
/**
 * Extract text from a PDF and write to _extracted.txt next to the PDF
 * (or next to the PDF’s directory if you pass a relative path).
 * Usage: node extract-pdf-text.js <path-to-pdf>
 */
const fs = require('fs');
const path = require('path');

const pdfPath = process.argv[2];
if (!pdfPath) {
  console.error('Usage: node extract-pdf-text.js <path-to-pdf>');
  process.exit(1);
}

const resolved = path.resolve(process.cwd(), pdfPath);
if (!fs.existsSync(resolved)) {
  console.error('File not found:', resolved);
  process.exit(1);
}

const pdf = require('pdf-parse');
const dataBuffer = fs.readFileSync(resolved);

pdf(dataBuffer)
  .then((data) => {
    const outDir = path.dirname(resolved);
    const outPath = path.join(outDir, '_extracted.txt');
    fs.writeFileSync(outPath, data.text, 'utf8');
    console.log('Pages:', data.numpages);
    console.log('Wrote:', outPath);
    console.log('Length:', data.text.length, 'chars');
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
