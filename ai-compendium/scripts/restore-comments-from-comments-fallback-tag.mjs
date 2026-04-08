#!/usr/bin/env node
/**
 * Restore instructor-review comments from git tag `comments-fallback` on **this** repo (`misc`)
 * into the current slug-based assignment folders (manifest-compatible). This is the usual
 * source of truth for compendium grading JSON when you need a snapshot from git.
 *
 * Do **not** confuse with `import-comments-from-github-flat.mjs`, which merges from
 * **ai_perspectives_spring_2026** `origin/main` (different snapshot; requires `--force`).
 *
 * Run from repo root: misc
 *   node ai-compendium/scripts/restore-comments-from-comments-fallback-tag.mjs
 *
 * Or from ai-compendium:
 *   node scripts/restore-comments-from-comments-fallback-tag.mjs
 */

import { execFileSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const TAG = process.env.COMMENTS_FALLBACK_TAG || 'comments-fallback';
const COMMENTS_NOTE =
  'comments[id]: { transcribe, polish, polishTranscribeEnd, exportPreferred }. exportPreferred: null|transcribe|polish. exportVersion 6.';

/** misc repo root (parent of ai-compendium). */
function findMiscRoot() {
  let d = __dirname;
  for (let i = 0; i < 6; i++) {
    if (fs.existsSync(path.join(d, 'ai-compendium', 'package.json'))) return d;
    d = path.dirname(d);
  }
  return path.resolve(__dirname, '../..');
}

const MISC_ROOT = findMiscRoot();
const ASSIGNMENTS = path.join(MISC_ROOT, 'ai-compendium/data/instructor-review/assignments');

const PAIRS = [
  {
    gitRevPath:
      'ai-compendium/data/instructor-review/assignments/Thoughts on AI/comments.json',
    targetDir: 'thoughts-on-ai-quiz-student-analysis-report',
  },
  {
    gitRevPath:
      'ai-compendium/data/instructor-review/assignments/Week 1 Thoughts/comments.json',
    targetDir: 'week-1-thoughts-quiz-student-analysis-report',
  },
];

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

function normalizeCommentsObject(raw) {
  const src = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
  const out = {};
  for (const [id, value] of Object.entries(src)) {
    out[String(id)] = normalizeCommentEntry(value);
  }
  return out;
}

function rosterIds(studentsPath) {
  const doc = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
  const list = Array.isArray(doc.students) ? doc.students : [];
  return new Set(list.map((s) => String(s.id)));
}

function gitShowComments(revPath) {
  const spec = `${TAG}:${revPath}`;
  return execFileSync('git', ['show', spec], {
    cwd: MISC_ROOT,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
}

function main() {
  for (const { gitRevPath, targetDir } of PAIRS) {
    const targetRoot = path.join(ASSIGNMENTS, targetDir);
    const studentsPath = path.join(targetRoot, 'students.json');
    const targetComments = path.join(targetRoot, 'comments.json');
    if (!fs.existsSync(studentsPath)) {
      console.warn(`Skip ${targetDir}: no students.json`);
      continue;
    }

    let txt;
    try {
      txt = gitShowComments(gitRevPath);
    } catch (e) {
      console.error(`git show failed for ${TAG}:${gitRevPath}`, e.message);
      process.exit(1);
    }

    const doc = JSON.parse(txt);
    const fromTag = normalizeCommentsObject(doc.comments);
    const roster = rosterIds(studentsPath);

    const merged = {};
    for (const id of roster) {
      if (fromTag[id] !== undefined) merged[id] = fromTag[id];
      else merged[id] = normalizeCommentEntry(null);
    }

    const payload = {
      comments: merged,
      updatedAt: new Date().toISOString(),
      note: COMMENTS_NOTE,
    };
    fs.writeFileSync(targetComments, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');

    let withText = 0;
    for (const v of Object.values(merged)) {
      if (String(v.transcribe || '').trim() || String(v.polish || '').trim()) withText += 1;
    }
    console.log(
      `Wrote ${path.relative(MISC_ROOT, targetComments)} — ${Object.keys(merged).length} keys, ${withText} non-empty`,
    );
  }
}

main();
