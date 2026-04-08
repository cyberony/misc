#!/usr/bin/env node
/**
 * Merge legacy flat `data/comments.json` from the **ai_perspectives_spring_2026** repo’s
 * `origin/main` into **one** compendium assignment (`thoughts-on-ai-quiz-student-analysis-report`).
 *
 * **Not** the same snapshot as the instructor-review backup on `misc`: tag `comments-fallback`
 * (see `restore-comments-from-comments-fallback-tag.mjs`). Spring `main` can be older/different
 * and will **overwrite** per-student text where the merge rules prefer incoming text—so this
 * script is **opt-in** only.
 *
 * Usage (from ai-compendium):
 *   node scripts/import-comments-from-github-flat.mjs --force
 *
 * Env (alternative to --force):
 *   ALLOW_SPRING_MAIN_IMPORT=1
 *   SPRING_REPO — path to ai_perspectives_spring_2026 clone (default: ../../../ai_perspectives_spring_2026)
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const COMMENTS_NOTE =
  'comments[id]: { transcribe, polish, polishTranscribeEnd, exportPreferred }. exportPreferred: transcribe|polish (which text to use in export). exportVersion 6.';

const SPRING_REPO =
  process.env.SPRING_REPO || path.resolve(__dirname, '../../../ai_perspectives_spring_2026');
const COMPENDIUM_ASSIGNMENTS = path.resolve(__dirname, '../data/instructor-review/assignments');
const TARGET_DIR = 'thoughts-on-ai-quiz-student-analysis-report';

function normalizeCommentEntry(raw) {
  const obj = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const transcribe = typeof obj.transcribe === 'string' ? obj.transcribe : '';
  const polish = typeof obj.polish === 'string' ? obj.polish : '';
  const endRaw = Number(obj.polishTranscribeEnd);
  const polishTranscribeEnd = Number.isFinite(endRaw) && endRaw >= 0 ? Math.floor(endRaw) : 0;
  let exportPreferred =
    obj.exportPreferred === 'transcribe' || obj.exportPreferred === 'polish' ? obj.exportPreferred : null;
  if (!exportPreferred) {
    exportPreferred = polish.trim() ? 'polish' : 'transcribe';
  }
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

function filterCommentsToRoster(comments, roster) {
  const out = {};
  for (const id of roster) {
    if (comments[id] !== undefined) out[id] = comments[id];
  }
  return out;
}

function readFlatCommentsFromGitMain() {
  const txt = execSync('git show origin/main:data/comments.json', {
    cwd: SPRING_REPO,
    encoding: 'utf8',
    maxBuffer: 4 * 1024 * 1024,
  });
  const doc = JSON.parse(txt);
  return normalizeCommentsObject(doc.comments);
}

function rosterIds(studentsPath) {
  const doc = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
  const list = Array.isArray(doc.students) ? doc.students : [];
  return new Set(list.map((s) => String(s.id)));
}

function printAbortHelp() {
  console.error(`
This script imports from ai_perspectives_spring_2026 → origin/main:data/comments.json only.

To restore the usual instructor-review snapshot for this repo, use the misc tag instead:
  (from misc repo root)
  node ai-compendium/scripts/restore-comments-from-comments-fallback-tag.mjs

If you really want to merge from spring main into compendium Thoughts, run again with:
  --force
or: ALLOW_SPRING_MAIN_IMPORT=1
`);
}

function main() {
  const argv = process.argv.slice(2);
  const forced = argv.includes('--force') || process.env.ALLOW_SPRING_MAIN_IMPORT === '1';
  if (!forced) {
    console.error('Refusing to run: missing --force (or ALLOW_SPRING_MAIN_IMPORT=1).');
    printAbortHelp();
    process.exit(1);
  }

  if (!fs.existsSync(SPRING_REPO)) {
    console.error(`SPRING_REPO not found: ${SPRING_REPO}`);
    process.exit(1);
  }
  const targetRoot = path.join(COMPENDIUM_ASSIGNMENTS, TARGET_DIR);
  const targetStudents = path.join(targetRoot, 'students.json');
  const targetComments = path.join(targetRoot, 'comments.json');
  if (!fs.existsSync(targetStudents) || !fs.existsSync(targetComments)) {
    console.error(`Missing ${targetStudents} or comments.json`);
    process.exit(1);
  }

  let githubComments;
  try {
    githubComments = readFlatCommentsFromGitMain();
  } catch (e) {
    console.error('Could not read origin/main:data/comments.json — fetch origin and ensure branch exists.', e.message);
    process.exit(1);
  }

  const roster = rosterIds(targetStudents);
  const existing = normalizeCommentsObject(JSON.parse(fs.readFileSync(targetComments, 'utf8')).comments);

  const incomingFiltered = filterCommentsToRoster(githubComments, roster);
  const merged = mergeCommentsPreservingNonEmpty(existing, incomingFiltered);
  for (const id of roster) {
    if (merged[id] === undefined) merged[id] = normalizeCommentEntry(null);
  }

  const payload = {
    comments: merged,
    updatedAt: new Date().toISOString(),
    note: COMMENTS_NOTE,
  };
  fs.writeFileSync(targetComments, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

  let withText = 0;
  for (const v of Object.values(merged)) {
    if (entryHasText(v)) withText += 1;
  }
  console.log(`Wrote ${targetComments}`);
  console.log(`  ${Object.keys(merged).length} student keys, ${withText} with non-empty transcribe or polish`);
}

main();
