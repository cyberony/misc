const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');

const app = express();
app.use(express.json({ limit: '1mb' }));

const PROJECT_ROOT = __dirname;
const DATA_DIR = path.join(PROJECT_ROOT, 'data');
const DATA_FILE = path.join(DATA_DIR, 'resources.json');

const PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
app.use(express.static(PUBLIC_DIR));

let writeQueue = Promise.resolve();
function enqueueWrite(task) {
  writeQueue = writeQueue.then(task, task);
  return writeQueue;
}

async function ensureDataFile() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  try {
    await fs.access(DATA_FILE);
  } catch {
    await fs.writeFile(DATA_FILE, JSON.stringify({ resources: [] }, null, 2), 'utf8');
  }
}

async function readDB() {
  await ensureDataFile();
  const txt = await fs.readFile(DATA_FILE, 'utf8');
  const parsed = JSON.parse(txt || '{}');
  const resources = Array.isArray(parsed.resources) ? parsed.resources : [];
  return { resources };
}

async function writeDB(db) {
  await ensureDataFile();
  await fs.writeFile(DATA_FILE, JSON.stringify(db, null, 2), 'utf8');
}

function normalizeTags(tagsInput) {
  if (!tagsInput) return [];
  if (Array.isArray(tagsInput)) return tagsInput.map(t => String(t).trim()).filter(Boolean);
  return String(tagsInput)
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
}

function sortByVotes(resources) {
  return [...resources].sort((a, b) => (b.votes || 0) - (a.votes || 0));
}

app.get('/api/resources', async (req, res) => {
  try {
    const { category, tag, q } = req.query;
    const { resources } = await readDB();

    let out = resources;
    if (category && String(category).trim()) {
      const c = String(category).trim().toLowerCase();
      out = out.filter(r => (r.category || '').toLowerCase() === c);
    }
    if (tag && String(tag).trim()) {
      const t = String(tag).trim().toLowerCase();
      out = out.filter(r => Array.isArray(r.tags) && r.tags.some(x => String(x).toLowerCase() === t));
    }
    if (q && String(q).trim()) {
      const s = String(q).trim().toLowerCase();
      out = out.filter(r => {
        const hay = [
          r.title,
          r.description,
          r.category,
          ...(r.tags || []),
        ].filter(Boolean).join(' ').toLowerCase();
        return hay.includes(s);
      });
    }

    res.json({ resources: sortByVotes(out) });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get('/api/resources/:id', async (req, res) => {
  try {
    const { resources } = await readDB();
    const id = req.params.id;
    const resource = resources.find(r => r.id === id);
    if (!resource) return res.status(404).json({ error: 'Not found' });
    res.json({ resource });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/api/resources', async (req, res) => {
  try {
    const body = req.body || {};
    const title = String(body.title || '').trim();
    if (!title) return res.status(400).json({ error: 'Missing title' });

    const category = String(body.category || 'Uncategorized').trim() || 'Uncategorized';
    const tags = normalizeTags(body.tags);
    const url = String(body.url || '').trim();
    const description = String(body.description || '').trim();
    const examples = String(body.examples || '').trim();

    const now = new Date().toISOString();
    const resource = {
      id: crypto.randomUUID(),
      title,
      category,
      url: url || null,
      tags,
      description,
      examples,
      votes: 0,
      createdAt: now,
      updatedAt: now,
    };

    await enqueueWrite(async () => {
      const db = await readDB();
      db.resources.push(resource);
      await writeDB(db);
    });

    res.status(201).json({ resource });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/api/resources/:id/vote', async (req, res) => {
  try {
    const delta = Number(req.body?.delta);
    if (![1, -1].includes(delta)) return res.status(400).json({ error: 'delta must be 1 or -1' });

    const id = req.params.id;
    let updated = null;
    await enqueueWrite(async () => {
      const db = await readDB();
      const idx = db.resources.findIndex(r => r.id === id);
      if (idx === -1) throw new Error('Not found');
      const next = (db.resources[idx].votes || 0) + delta;
      db.resources[idx].votes = next;
      db.resources[idx].updatedAt = new Date().toISOString();
      updated = db.resources[idx];
      await writeDB(db);
    });

    res.json({ resource: updated });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`AI compendium running on http://localhost:${PORT}`);
});

