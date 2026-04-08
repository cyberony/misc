#!/usr/bin/env node
/**
 * Merge comments from ai_perspectives_spring_2026/data/assignments/<dir>/comments.json
 * into misc ai-compendium data/instructor-review/assignments/<dir>/comments.json.
 * Only student ids present in the target students.json are kept (roster is canonical).
 * For the git tag snapshot on misc (`comments-fallback`), prefer
 * `restore-comments-from-comments-fallback-tag.mjs` instead.
 *
 * Usage:
 *   node scripts/merge-comments-from-spring.mjs
 *   SPRING_ROOT=/path/to/ai_perspectives_spring_2026/data/assignments node scripts/merge-comments-from-spring.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMENTS_NOTE =
  'comments[id]: { transcribe, polish, polishTranscribeEnd, exportPreferred }. exportPreferred: null|transcribe|polish. exportVersion 6.';

const PAIRS = [
  { springDir: 'Thoughts on AI', compendiumDir: 'thoughts-on-ai-quiz-student-analysis-report' },
  { springDir: 'Week 1 Thoughts', compendiumDir: 'week-1-thoughts-quiz-student-analysis-report' },
];

const SPRING_ROOT =
  process.env.SPRING_ROOT || path.resolve(__dirname, '../../../ai_perspectives_spring_2026/data/assignments');
const COMPENDIUM_ROOT = path.resolve(__dirname, '../data/instructor-review/assignments');

function normalizeCommentEntry(raw) {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const transcribe = typeof obj.transcribe === 'string' ? obj.transcribe : '';
  const polish = typeof obj.polish === 'string' ? obj.polish : '';
  const endRaw = Number(obj.polishTranscribeEnd);
  const polishTranscribeEnd = Number.isFinite(endRaw) && endRaw >= 0 ? Math.floor(endRaw) : 0;
  const exportPreferred =
    obj.exportPreferred === 'transcribe' || obj.exportPreferred === 'polish' ? obj.exportPreferred : null;
  return { transcribe, polish, polishTranscribeEnd, exportPreferred };
}

function entryHasText(entry) {
  return Boolean(String(entry?.transcribe || '').trim() || String(entry?.polish || '').trim());
}

function normalizeCommentsObject(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const [id, value] of Object.entries(src)) {
    out[String(id)] = normalizeCommentEntry(value);
  }
  return out;
}

function mergeCommentsPreservingNonEmpty(existingMap, incomingMap) {
  const existing = normalizeCommentsObject(existingMap);
  const incoming = normalizeCommentsObject(incomingMap);
  const allIds = new Set([...Object.keys(existing), ...Object.keys(incoming)]);
  const merged = {};
  for (const id of allIds) {
    const ex = normalizeCommentEntry(existing[id]);
    const inc = normalizeCommentEntry(incoming[id]);
    if (!entryHasText(inc) && entryHasText(ex)) {
      merged[id] = ex;
      continue;
    }
    merged[id] = inc;
  }
  return merged;
}

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function rosterIds(studentsPath) {
  const doc = readJson(studentsPath);
  const list = Array.isArray(doc.students) ? doc.students : [];
  return new Set(list.map((s) => String(s.id)));
}

function filterCommentsToRoster(comments, roster) {
  const out = {};
  for (const id of roster) {
    if (comments[id] !== undefined) out[id] = comments[id];
  }
  return out;
}

function main() {
  if (!fs.existsSync(SPRING_ROOT)) {
    console.error(`SPRING_ROOT not found: ${SPRING_ROOT}`);
    process.exit(1);
  }

  for (const { springDir, compendiumDir } of PAIRS) {
    const springCommentsPath = path.join(SPRING_ROOT, springDir, 'comments.json');
    const targetRoot = path.join(COMPENDIUM_ROOT, compendiumDir);
    const targetStudents = path.join(targetRoot, 'students.json');
    const targetComments = path.join(targetRoot, 'comments.json');

    if (!fs.existsSync(targetStudents) || !fs.existsSync(targetComments)) {
      console.warn(`Skip ${compendiumDir}: missing students.json or comments.json`);
      continue;
    }

    const roster = rosterIds(targetStudents);
    let springComments = {};
    if (fs.existsSync(springCommentsPath)) {
      try {
        const doc = readJson(springCommentsPath);
        springComments = normalizeCommentsObject(doc.comments);
      } catch (e) {
        console.warn(`Could not read ${springCommentsPath}`, e.message);
      }
    }

    const existingDoc = readJson(targetComments);
    const existing = normalizeCommentsObject(existingDoc.comments);

    const springFiltered = filterCommentsToRoster(springComments, roster);
    const merged = mergeCommentsPreservingNonEmpty(existing, springFiltered);

    const payload = {
      comments: merged,
      updatedAt: new Date().toISOString(),
      note: COMMENTS_NOTE,
    };
    fs.writeFileSync(targetComments, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    console.log(`Wrote ${targetComments} (${Object.keys(merged).length} student keys)`);
  }
}

main();
