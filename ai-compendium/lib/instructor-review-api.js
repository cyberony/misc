/**
 * Instructor quiz review: polish / refine / transcribe (Whisper) / save-comments.
 * Same behavior as ai_perspectives_spring_2026/scripts/review-server.mjs (Express).
 */
const fs = require('fs');
const path = require('path');
const express = require('express');

const SYSTEM = `You edit instructor notes about a student's quiz responses. The input is rough speech-to-text dictated by the instructor themselves.

Rewrite as clear, professional prose suitable for course records or written feedback. Keep every substantive point, judgment, and fact; do not invent or assume anything not implied by the input. Remove filler (um, uh, like), false starts, and repetition. Use short paragraphs where helpful.

Write from the instructor's standpoint: use first person (I, me, my, we where appropriate) as if they are writing their own comments. Do not shift to third person about the instructor (e.g. avoid "the instructor notes that…", "they observed…"). If the raw transcript is already first person, preserve that voice; if it drifts, correct it back to first person while keeping meaning.

Output only the polished text—no quotation marks around it and no preamble like "Here is".`;

const SYSTEM_MERGE = `The instructor is extending feedback to a student. They already have a polished note (first person, suitable for course records). That note may include wording they typed or edited by hand after a previous polish—treat that text as authoritative.

New rough speech-to-text is additional content they want to say to the student (not meta-instructions to you). Merge it into the existing polished note: keep prior sentences intact unless the new dictation explicitly revises or replaces a specific point. Prefer appending or short bridges; do not rewrite untouched paragraphs. Same first-person instructor voice; no third person about the instructor.

Output only the full combined polished note—no preamble.`;

const SYSTEM_MERGE_FULL_RAW = `The instructor has a polished note (first person, course feedback) and a full rough transcript that may have been edited anywhere (not only at the end). The polished text is authoritative where it still matches the rough meaning.

Produce one complete polished note that reflects the entire rough transcript: keep polished sentences that still apply; revise or extend where the rough changed, contradicts, or adds content. Same first-person instructor voice; no third person about the instructor.

Output only the full polished note—no preamble.`;

const REFINE_SYSTEM = `You help an instructor edit written feedback to a student. They speak to you as an assistant (e.g. "add a line saying…", "shorten this", "warm up the tone")—that speech is transcribed for you.

If a current polished note is provided, apply their request and output the full updated note. If there is no note yet, write polished first-person instructor feedback that fulfills their request.

If they ask to delete, clear, or remove all of the text, output nothing (empty output). Do not refuse and do not leave the old text.

Keep first person (I/me/my). Do not invent facts about the student beyond what they implied. Output only the polished note—no preamble or quotation marks.`;

const REFINE_TRANSCRIBE_SYSTEM = `You help an instructor edit their rough speech-to-text notes (the raw transcript, before polishing). They speak to you as an assistant (e.g. "add that they improved on the second question", "delete the part about…")—that speech is transcribed for you.

If a current rough transcript is provided, apply their request and output the full updated rough transcript (same informal dictated tone unless they asked otherwise). If there is no transcript yet, write the rough notes they asked for.

If they ask to delete, clear, or remove all of the text, output nothing (empty output). Do not refuse and do not leave the old text.

Do not invent facts beyond what they implied. Output only the transcript text—no preamble or quotation marks.`;

const COMMENTS_NOTE =
  'comments[id]: { transcribe, polish, polishTranscribeEnd, exportPreferred }. exportPreferred: null|transcribe|polish (unset = neither thumb). exportVersion 6.';

/** Spring / localStorage used short ids; compendium manifest uses CSV-slug ids. */
const LEGACY_ASSIGNMENT_ID_TO_CANONICAL = {
  'thoughts-on-ai': 'thoughts-on-ai-quiz-student-analysis-report',
  'week-1-thoughts': 'week-1-thoughts-quiz-student-analysis-report',
};

const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

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

function countEntriesWithText(map) {
  let n = 0;
  for (const entry of Object.values(map || {})) {
    if (entryHasText(entry)) n += 1;
  }
  return n;
}

function readCommentsFileMap(filePath) {
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    const parsed = JSON.parse(raw || '{}');
    return normalizeCommentsObject(parsed?.comments);
  } catch {
    return {};
  }
}

function mergeCommentsPreservingNonEmpty(existingMap, incomingMap) {
  const existing = normalizeCommentsObject(existingMap);
  const incoming = normalizeCommentsObject(incomingMap);
  const allIds = new Set([...Object.keys(existing), ...Object.keys(incoming)]);
  const merged = {};
  let preservedFromExisting = 0;

  for (const id of allIds) {
    const ex = normalizeCommentEntry(existing[id]);
    const inc = normalizeCommentEntry(incoming[id]);
    if (!entryHasText(inc) && entryHasText(ex)) {
      merged[id] = ex;
      preservedFromExisting += 1;
      continue;
    }
    merged[id] = inc;
  }
  return { merged, preservedFromExisting };
}

/** One in-flight read-merge-write per file so concurrent POSTs cannot interleave. */
const commentSaveChains = new Map();

async function withSerializedCommentSave(outPath, fn) {
  const prev = commentSaveChains.get(outPath) || Promise.resolve();
  const next = prev.catch(() => {}).then(() => fn());
  commentSaveChains.set(outPath, next);
  try {
    return await next;
  } finally {
    if (commentSaveChains.get(outPath) === next) {
      commentSaveChains.delete(outPath);
    }
  }
}

function readAssignmentsManifest(assignmentsManifestPath) {
  try {
    const raw = fs.readFileSync(assignmentsManifestPath, 'utf8');
    const o = JSON.parse(raw);
    return Array.isArray(o.assignments) ? o.assignments : [];
  } catch {
    return [];
  }
}

function commentsPathForAssignmentId(dataRoot, assignmentId) {
  if (!assignmentId || typeof assignmentId !== 'string') return null;
  const manifestPath = path.join(dataRoot, 'assignments', 'manifest.json');
  const list = readAssignmentsManifest(manifestPath);
  let a = list.find(x => x && x.id === assignmentId && typeof x.dir === 'string');
  if (!a) {
    const canon = LEGACY_ASSIGNMENT_ID_TO_CANONICAL[assignmentId];
    if (canon) {
      a = list.find(x => x && x.id === canon && typeof x.dir === 'string');
    }
  }
  if (!a) return null;
  const base = path.join(dataRoot, 'assignments');
  const full = path.resolve(base, a.dir);
  if (!full.startsWith(base + path.sep)) return null;
  return path.join(full, 'comments.json');
}

function audioFilename(contentType) {
  const ct = (contentType || '').toLowerCase();
  if (ct.includes('mp4') || ct.includes('m4a')) return 'clip.m4a';
  if (ct.includes('mpeg') || ct.includes('mp3')) return 'clip.mp3';
  if (ct.includes('wav')) return 'clip.wav';
  return 'clip.webm';
}

async function transcribeAudio(key, body, contentType) {
  const FormData = globalThis.FormData;
  const Blob = globalThis.Blob;
  const form = new FormData();
  form.append('file', new Blob([body], { type: contentType || 'audio/webm' }), audioFilename(contentType));
  form.append('model', 'whisper-1');
  const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}` },
    body: form,
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data.error?.message || JSON.stringify(data) || r.statusText;
    throw new Error(msg);
  }
  const text = typeof data.text === 'string' ? data.text.trim() : '';
  return text;
}

async function polish(key, text, existingPolish, integrateFullRaw) {
  const chunk = (text || '').trim();
  if (!chunk) throw new Error('Empty input');
  const existing = typeof existingPolish === 'string' ? existingPolish.trim() : '';
  const useMerge = existing.length > 0;
  const system = useMerge ? (integrateFullRaw ? SYSTEM_MERGE_FULL_RAW : SYSTEM_MERGE) : SYSTEM;
  const userContent = useMerge
    ? integrateFullRaw
      ? `--- Existing polished note ---\n${existing}\n\n--- Full rough transcript (may have been edited anywhere) ---\n${chunk}`
      : `--- Existing polished note ---\n${existing}\n\n--- New rough dictation to integrate ---\n${chunk}`
    : chunk;
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: userContent },
      ],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data.error?.message || JSON.stringify(data) || r.statusText;
    throw new Error(msg);
  }
  const out = data.choices?.[0]?.message?.content?.trim();
  if (!out) throw new Error('Empty model response');
  return out;
}

async function refineTranscribe(key, transcribeText, instruction) {
  const ins = instruction.trim();
  if (!ins) throw new Error('Empty instruction');
  const raw = transcribeText.trim();
  const user = raw
    ? `--- Current rough transcript ---\n${raw}\n\n--- What the instructor asked you (the assistant), by voice ---\n${ins}`
    : `There is no rough transcript yet.\n\n--- What the instructor asked you (the assistant), by voice ---\n${ins}\n\nWrite the rough transcript they want.`;
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      messages: [
        { role: 'system', content: REFINE_TRANSCRIBE_SYSTEM },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data.error?.message || JSON.stringify(data) || r.statusText;
    throw new Error(msg);
  }
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Empty model response');
  return content.trim();
}

async function refinePolished(key, polishText, instruction) {
  const ins = instruction.trim();
  if (!ins) throw new Error('Empty instruction');
  const pol = polishText.trim();
  const user = pol
    ? `--- Current polished note ---\n${pol}\n\n--- What the instructor asked you (the assistant), by voice ---\n${ins}`
    : `There is no polished note yet.\n\n--- What the instructor asked you (the assistant), by voice ---\n${ins}\n\nWrite the polished first-person instructor note they want.`;
  const r = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      temperature: 0.25,
      messages: [
        { role: 'system', content: REFINE_SYSTEM },
        { role: 'user', content: user },
      ],
    }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = data.error?.message || JSON.stringify(data) || r.statusText;
    throw new Error(msg);
  }
  const content = data.choices?.[0]?.message?.content;
  if (typeof content !== 'string') throw new Error('Empty model response');
  return content.trim();
}

/**
 * @param {import('express').Application} app
 * @param {{ dataRoot: string; requireMagic: import('express').RequestHandler }} opts
 */
function mountInstructorReview(app, opts) {
  const { dataRoot, requireMagic } = opts;
  const legacyComments = path.join(dataRoot, 'comments.json');

  const json5mb = express.json({ limit: '5mb' });
  const rawAudio = express.raw({ type: () => true, limit: `${MAX_AUDIO_BYTES + 1024 * 1024}` });

  function getKey() {
    return String(process.env.OPENAI_API_KEY || '').trim();
  }

  app.post('/api/instructor-review/polish', requireMagic, json5mb, async (req, res) => {
    const key = getKey();
    if (!key) return res.status(500).json({ error: 'Set OPENAI_API_KEY in the environment.' });
    const text = typeof req.body?.text === 'string' ? req.body.text : '';
    const existingPolish = typeof req.body?.existingPolish === 'string' ? req.body.existingPolish : '';
    const integrateFullRaw = !!req.body?.integrateFullRaw;
    try {
      const polished = await polish(key, text, existingPolish, integrateFullRaw);
      res.json({ polished });
    } catch (e) {
      res.status(502).json({ error: String(e.message || e) });
    }
  });

  app.post('/api/instructor-review/refine', requireMagic, json5mb, async (req, res) => {
    const key = getKey();
    if (!key) return res.status(500).json({ error: 'Set OPENAI_API_KEY in the environment.' });
    const instruction = typeof req.body?.instruction === 'string' ? req.body.instruction : '';
    if (!instruction.trim()) {
      return res.status(400).json({ error: 'Missing or empty "instruction"' });
    }
    const target =
      req.body?.target === 'transcribe'
        ? 'transcribe'
        : req.body?.target === 'polish'
          ? 'polish'
          : 'polish';
    try {
      if (target === 'transcribe') {
        const transcribeText = typeof req.body?.transcribe === 'string' ? req.body.transcribe : '';
        const transcribe = await refineTranscribe(key, transcribeText, instruction);
        return res.json({ transcribe });
      }
      const polishText = typeof req.body?.polish === 'string' ? req.body.polish : '';
      const polished = await refinePolished(key, polishText, instruction);
      return res.json({ polished });
    } catch (e) {
      return res.status(502).json({ error: String(e.message || e) });
    }
  });

  app.post('/api/instructor-review/save-comments', requireMagic, json5mb, async (req, res) => {
    const c = req.body?.comments;
    if (!c || typeof c !== 'object' || Array.isArray(c)) {
      return res.status(400).json({ error: 'Body must include a "comments" object' });
    }
    const assignmentId = typeof req.body?.assignmentId === 'string' ? req.body.assignmentId.trim() : '';
    let outPath = assignmentId ? commentsPathForAssignmentId(dataRoot, assignmentId) : null;
    if (assignmentId && !outPath) {
      return res.status(400).json({ error: 'Unknown assignmentId' });
    }
    if (!outPath) outPath = legacyComments;
    try {
      const result = await withSerializedCommentSave(outPath, async () => {
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        const existing = readCommentsFileMap(outPath);
        const { merged, preservedFromExisting } = mergeCommentsPreservingNonEmpty(existing, c);
        const payload = {
          comments: merged,
          updatedAt: new Date().toISOString(),
          note: COMMENTS_NOTE,
        };
        fs.writeFileSync(outPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
        return {
          updatedAt: payload.updatedAt,
          entriesWithText: countEntriesWithText(merged),
          preservedFromExisting,
        };
      });
      return res.json({
        ok: true,
        ...result,
      });
    } catch (e) {
      return res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.post('/api/instructor-review/transcribe', requireMagic, rawAudio, async (req, res) => {
    const key = getKey();
    if (!key) return res.status(500).json({ error: 'Set OPENAI_API_KEY in .env for dictation.' });
    const ct = req.headers['content-type'] || 'audio/webm';
    const body = req.body;
    if (!Buffer.isBuffer(body) || body.length < 80) {
      return res.status(400).json({ error: 'Audio too short.' });
    }
    if (body.length > MAX_AUDIO_BYTES) {
      return res.status(413).json({ error: 'Recording too large (max ~20 MB).' });
    }
    try {
      const text = await transcribeAudio(key, body, ct);
      res.json({ text });
    } catch (e) {
      res.status(502).json({ error: String(e.message || e) });
    }
  });

  const uploadJson = express.json({ limit: '25mb' });
  const manifestAssignmentsPath = path.join(dataRoot, 'assignments', 'manifest.json');

  function assignDirFull(dir) {
    const base = path.join(dataRoot, 'assignments');
    const full = path.resolve(base, dir);
    if (!full.startsWith(base + path.sep)) return null;
    return full;
  }

  function sanitizeSlug(id) {
    const s = String(id || '')
      .trim()
      .toLowerCase();
    if (!/^[a-z0-9][a-z0-9_-]{0,62}$/.test(s)) return null;
    return s;
  }

  app.post('/api/instructor-review/assignments', requireMagic, uploadJson, (req, res) => {
    try {
      const id = sanitizeSlug(req.body?.id);
      const title = String(req.body?.title || '').trim();
      const dir = String(req.body?.dir || '').trim();
      const students = req.body?.students;
      if (!id || !title || !dir) {
        return res.status(400).json({ error: 'Fields id, title, and dir are required.' });
      }
      if (!students || typeof students !== 'object' || Array.isArray(students)) {
        return res.status(400).json({ error: 'Body must include a students object (students.json payload).' });
      }
      if (!Array.isArray(students.questions) || !Array.isArray(students.students)) {
        return res.status(400).json({ error: 'students must include questions[] and students[]' });
      }
      const assignmentRoot = assignDirFull(dir);
      if (!assignmentRoot) {
        return res.status(400).json({ error: 'Invalid folder name (dir).' });
      }
      fs.mkdirSync(assignmentRoot, { recursive: true });
      fs.writeFileSync(
        path.join(assignmentRoot, 'students.json'),
        `${JSON.stringify(students, null, 2)}\n`,
        'utf8',
      );
      const comments = req.body?.comments;
      if (comments && typeof comments === 'object' && !Array.isArray(comments)) {
        const c =
          comments.comments && typeof comments.comments === 'object' && !Array.isArray(comments.comments)
            ? comments.comments
            : {};
        const payload = {
          comments: c,
          updatedAt: new Date().toISOString(),
          note: COMMENTS_NOTE,
        };
        fs.writeFileSync(
          path.join(assignmentRoot, 'comments.json'),
          `${JSON.stringify(payload, null, 2)}\n`,
          'utf8',
        );
      } else {
        const defaultComments = {
          comments: {},
          updatedAt: null,
          note: COMMENTS_NOTE,
        };
        fs.writeFileSync(
          path.join(assignmentRoot, 'comments.json'),
          `${JSON.stringify(defaultComments, null, 2)}\n`,
          'utf8',
        );
      }
      let list = readAssignmentsManifest(manifestAssignmentsPath);
      const idx = list.findIndex(a => a && a.id === id);
      const sourceFile =
        typeof students.sourceFile === 'string' && students.sourceFile.trim()
          ? students.sourceFile.trim()
          : null;
      const entry = { id, title, dir, ...(sourceFile ? { sourceFile } : {}) };
      if (idx >= 0) list[idx] = entry;
      else list.push(entry);
      list.sort((a, b) =>
        String(a.title || a.id).localeCompare(String(b.title || b.id), undefined, { sensitivity: 'base' }),
      );
      fs.writeFileSync(manifestAssignmentsPath, `${JSON.stringify({ assignments: list }, null, 2)}\n`, 'utf8');
      res.json({ ok: true, assignments: list });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  /** POST (not PATCH): matches patch-assignment-meta; some proxies only forward GET/POST. */
  app.post('/api/instructor-review/rename-assignment', requireMagic, uploadJson, (req, res) => {
    try {
      const assignmentId = sanitizeSlug(req.body?.assignmentId);
      if (!assignmentId) return res.status(400).json({ error: 'Invalid assignment id' });
      const title = String(req.body?.title || '').trim();
      if (!title) return res.status(400).json({ error: 'Display name is required' });
      let list = readAssignmentsManifest(manifestAssignmentsPath);
      const idx = list.findIndex(a => a && a.id === assignmentId);
      if (idx < 0) return res.status(404).json({ error: 'Assignment not found' });
      let next = { ...list[idx], title };
      const assignmentRoot = assignDirFull(list[idx].dir);
      if (assignmentRoot) {
        const studentsPath = path.join(assignmentRoot, 'students.json');
        if (fs.existsSync(studentsPath)) {
          try {
            const doc = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
            const sf =
              doc && typeof doc.sourceFile === 'string' && doc.sourceFile.trim()
                ? doc.sourceFile.trim()
                : null;
            if (sf) next.sourceFile = sf;
          } catch {
            /* keep manifest title-only */
          }
        }
      }
      list[idx] = next;
      list.sort((a, b) =>
        String(a.title || a.id).localeCompare(String(b.title || b.id), undefined, { sensitivity: 'base' }),
      );
      fs.writeFileSync(manifestAssignmentsPath, `${JSON.stringify({ assignments: list }, null, 2)}\n`, 'utf8');
      res.json({ ok: true, assignments: list });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.delete('/api/instructor-review/assignments/:id', requireMagic, (req, res) => {
    try {
      const id = sanitizeSlug(req.params.id);
      if (!id) return res.status(400).json({ error: 'Invalid assignment id' });
      let list = readAssignmentsManifest(manifestAssignmentsPath);
      const idx = list.findIndex(a => a && a.id === id);
      if (idx < 0) return res.status(404).json({ error: 'Assignment not found' });
      const { dir } = list[idx];
      const assignmentRoot = assignDirFull(dir);
      if (!assignmentRoot) return res.status(400).json({ error: 'Invalid manifest folder' });
      list.splice(idx, 1);
      fs.writeFileSync(manifestAssignmentsPath, `${JSON.stringify({ assignments: list }, null, 2)}\n`, 'utf8');
      if (fs.existsSync(assignmentRoot)) {
        fs.rmSync(assignmentRoot, { recursive: true, force: true });
      }
      res.json({ ok: true, assignments: list });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.post('/api/instructor-review/patch-assignment-meta', requireMagic, uploadJson, (req, res) => {
    try {
      const assignmentId = sanitizeSlug(req.body?.assignmentId);
      if (!assignmentId) return res.status(400).json({ error: 'Invalid assignment id' });
      const list = readAssignmentsManifest(manifestAssignmentsPath);
      const idx = list.findIndex(a => a && a.id === assignmentId);
      if (idx < 0) return res.status(404).json({ error: 'Assignment not found' });
      const { dir } = list[idx];
      const assignmentRoot = assignDirFull(dir);
      if (!assignmentRoot) return res.status(400).json({ error: 'Invalid manifest folder' });
      const studentsPath = path.join(assignmentRoot, 'students.json');
      if (!fs.existsSync(studentsPath)) return res.status(404).json({ error: 'students.json missing' });
      let doc;
      try {
        doc = JSON.parse(fs.readFileSync(studentsPath, 'utf8'));
      } catch {
        return res.status(500).json({ error: 'Could not read students.json' });
      }
      if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
        return res.status(500).json({ error: 'Invalid students.json shape' });
      }
      const rawDue = req.body?.dueDate;
      if (rawDue === null || rawDue === undefined || rawDue === '') {
        delete doc.dueDate;
      } else {
        const s = String(rawDue).trim();
        if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) {
          return res.status(400).json({ error: 'dueDate must be YYYY-MM-DD or empty' });
        }
        doc.dueDate = s;
      }
      fs.writeFileSync(studentsPath, `${JSON.stringify(doc, null, 2)}\n`, 'utf8');
      res.json({ ok: true, dueDate: doc.dueDate ?? null });
    } catch (e) {
      res.status(500).json({ error: String(e.message || e) });
    }
  });

  app.use(
    '/api/instructor-review/static',
    requireMagic,
    (req, res, next) => {
      if (req.path.endsWith('.json')) {
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
      }
      next();
    },
    express.static(dataRoot),
  );
}

module.exports = { mountInstructorReview };
