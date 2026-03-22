#!/usr/bin/env node
/**
 * Convert a PDF to one PNG per page for the slide viewer.
 * Usage: node pdf-to-slides.mjs <path-to-Search.pdf>
 * Output: slides/1.png, 2.png, ... (in search-slides/slides/)
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pdf } from "pdf-to-img";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pdfPath = process.argv[2];

if (!pdfPath) {
  console.error("Usage: node pdf-to-slides.mjs <path-to-Search.pdf>");
  process.exit(1);
}

const outDir = path.join(__dirname, "slides");
await fs.mkdir(outDir, { recursive: true });

console.log("Converting PDF to images...");
const document = await pdf(pdfPath, { scale: 2 });
let counter = 1;
for await (const image of document) {
  const outPath = path.join(outDir, `${counter}.png`);
  await fs.writeFile(outPath, image);
  if (counter % 10 === 0) console.log(`  ${counter} pages...`);
  counter++;
}
console.log(`Done. Wrote ${counter} slides to ${outDir}`);
