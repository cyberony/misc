const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { promisify } = require('util');

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
  const users = Array.isArray(parsed.users) ? parsed.users : [];
  const sessions = parsed.sessions && typeof parsed.sessions === 'object' ? parsed.sessions : {};
  const votesByUser = parsed.votesByUser && typeof parsed.votesByUser === 'object' ? parsed.votesByUser : {};
  const bugReports = Array.isArray(parsed.bugReports) ? parsed.bugReports : [];
  return { resources, users, sessions, votesByUser, bugReports };
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

const scryptAsync = promisify(crypto.scrypt);
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const PASSWORD_SPECIAL = '!@#$%^&*()_+-=[]{}|;\':",.<>?/~`';
const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_+\-=[\]{}|;':",.<>?/~`]/;

function nowMs() {
  return Date.now();
}

function normalizeEmail(v) {
  return String(v || '').trim().toLowerCase();
}
function normalizeText(v) {
  return String(v || '').trim().toLowerCase();
}

function validatePassword(password) {
  if (typeof password !== 'string' || password.length < 8) {
    return { ok: false, error: 'Password must be at least 8 characters' };
  }
  if (!/[0-9]/.test(password)) {
    return { ok: false, error: 'Password must include at least one number' };
  }
  if (!/[A-Z]/.test(password)) {
    return { ok: false, error: 'Password must include at least one uppercase letter' };
  }
  if (!PASSWORD_SPECIAL_REGEX.test(password)) {
    return { ok: false, error: `Password must include at least one special character: ${PASSWORD_SPECIAL}` };
  }
  return { ok: true };
}

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = await scryptAsync(password, salt, 64);
  return `${salt}:${Buffer.from(derived).toString('hex')}`;
}

async function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  const derived = await scryptAsync(password, salt, 64);
  const key = Buffer.from(keyHex, 'hex');
  const candidate = Buffer.from(derived);
  if (key.length !== candidate.length) return false;
  return crypto.timingSafeEqual(key, candidate);
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name || '',
    createdAt: user.createdAt,
  };
}

function getBearerToken(req) {
  const header = String(req.headers.authorization || '');
  if (!header.startsWith('Bearer ')) return '';
  return header.slice('Bearer '.length).trim();
}

function sweepExpiredSessions(db) {
  const t = nowMs();
  let changed = false;
  for (const [token, session] of Object.entries(db.sessions || {})) {
    if (!session || Number(session.expiresAt || 0) <= t) {
      delete db.sessions[token];
      changed = true;
    }
  }
  return changed;
}

function getAuthUserFromDB(req, db) {
  const token = getBearerToken(req);
  if (!token) return null;
  const session = db.sessions[token];
  if (!session) return null;
  if (Number(session.expiresAt || 0) <= nowMs()) {
    delete db.sessions[token];
    return null;
  }
  const user = db.users.find(u => u.id === session.userId);
  if (!user) return null;
  return user;
}

app.post('/api/auth/signup', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    const name = String(req.body?.name || '').trim();
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Enter a valid email' });
    const pwValidation = validatePassword(password);
    if (!pwValidation.ok) return res.status(400).json({ error: pwValidation.error });

    let outUser = null;
    let token = '';
    await enqueueWrite(async () => {
      const db = await readDB();
      sweepExpiredSessions(db);
      if (db.users.some(u => normalizeEmail(u.email) === email)) {
        throw new Error('Email already in use');
      }
      const now = new Date().toISOString();
      const user = {
        id: crypto.randomUUID(),
        email,
        name,
        passwordHash: await hashPassword(password),
        createdAt: now,
      };
      db.users.push(user);
      token = crypto.randomBytes(32).toString('hex');
      db.sessions[token] = {
        userId: user.id,
        createdAt: now,
        expiresAt: nowMs() + TOKEN_TTL_MS,
      };
      outUser = publicUser(user);
      await writeDB(db);
    });

    res.status(201).json({ token, user: outUser });
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg === 'Email already in use') return res.status(409).json({ error: msg });
    res.status(500).json({ error: msg });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const password = String(req.body?.password || '');
    if (!email || !password) return res.status(400).json({ error: 'Missing email or password' });

    let outUser = null;
    let token = '';
    await enqueueWrite(async () => {
      const db = await readDB();
      sweepExpiredSessions(db);
      const user = db.users.find(u => normalizeEmail(u.email) === email);
      if (!user) throw new Error('Invalid email or password');
      const ok = await verifyPassword(password, user.passwordHash);
      if (!ok) throw new Error('Invalid email or password');

      token = crypto.randomBytes(32).toString('hex');
      db.sessions[token] = {
        userId: user.id,
        createdAt: new Date().toISOString(),
        expiresAt: nowMs() + TOKEN_TTL_MS,
      };
      outUser = publicUser(user);
      await writeDB(db);
    });

    res.json({ token, user: outUser });
  } catch (e) {
    const msg = String(e?.message || e);
    if (msg === 'Invalid email or password') return res.status(401).json({ error: msg });
    res.status(500).json({ error: msg });
  }
});

app.post('/api/auth/recover', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    const name = String(req.body?.name || '').trim();
    const newPassword = String(req.body?.newPassword || '');
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Enter a valid email' });
    const pwValidation = validatePassword(newPassword);
    if (!pwValidation.ok) return res.status(400).json({ error: pwValidation.error });

    let changed = false;
    await enqueueWrite(async () => {
      const db = await readDB();
      const user = db.users.find(u => normalizeEmail(u.email) === email);
      if (!user) {
        const err = new Error('No account found for this email');
        err.statusCode = 404;
        throw err;
      }
      // Light identity check for this local app: if account has a name, require exact match.
      if (user.name && normalizeText(user.name) !== normalizeText(name)) {
        const err = new Error('Name does not match this account');
        err.statusCode = 403;
        throw err;
      }
      user.passwordHash = await hashPassword(newPassword);
      user.updatedAt = new Date().toISOString();
      // Invalidate all sessions for this user after password reset.
      for (const [token, session] of Object.entries(db.sessions || {})) {
        if (session && session.userId === user.id) delete db.sessions[token];
      }
      changed = true;
      await writeDB(db);
    });

    if (!changed) return res.status(500).json({ error: 'Password reset failed' });
    res.json({ ok: true, message: 'Password reset. Please log in with your new password.' });
  } catch (e) {
    if (e && typeof e === 'object' && e.statusCode) {
      return res.status(e.statusCode).json({ error: String(e.message || 'Recovery failed') });
    }
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const db = await readDB();
    const changed = sweepExpiredSessions(db);
    const user = getAuthUserFromDB(req, db);
    if (changed) await writeDB(db);
    if (!user) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ user: publicUser(user) });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/api/auth/logout', async (req, res) => {
  try {
    const token = getBearerToken(req);
    if (!token) return res.status(204).end();
    await enqueueWrite(async () => {
      const db = await readDB();
      if (db.sessions[token]) {
        delete db.sessions[token];
        await writeDB(db);
      }
    });
    res.status(204).end();
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/api/bug-reports', async (req, res) => {
  try {
    const title = String(req.body?.title || '').trim();
    const steps = String(req.body?.steps || '').trim();
    const area = String(req.body?.area || '').trim();
    const expected = String(req.body?.expected || '').trim();
    const actual = String(req.body?.actual || '').trim();
    const email = normalizeEmail(req.body?.email || '');

    if (!title) return res.status(400).json({ error: 'Bug title is required' });
    if (!steps) return res.status(400).json({ error: 'Steps to reproduce are required' });

    const createdAt = new Date().toISOString();
    const report = {
      id: crypto.randomUUID(),
      title,
      steps,
      area: area || null,
      expected: expected || null,
      actual: actual || null,
      email: email || null,
      status: 'open',
      createdAt,
      meta: {
        userAgent: String(req.headers['user-agent'] || ''),
      },
    };

    await enqueueWrite(async () => {
      const db = await readDB();
      db.bugReports.push(report);
      await writeDB(db);
    });

    res.status(201).json({ ok: true, reportId: report.id });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get('/api/resources', async (req, res) => {
  try {
    const { category, tag, q } = req.query;
    const db = await readDB();
    const resources = db.resources;

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

    const user = getAuthUserFromDB(req, db);
    const userVotes = user ? (db.votesByUser[user.id] || {}) : {};
    res.json({ resources: sortByVotes(out), userVotes });
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
    let nextVote = null;
    let shouldRejectSameVote = false;
    await enqueueWrite(async () => {
      const db = await readDB();
      sweepExpiredSessions(db);
      const user = getAuthUserFromDB(req, db);
      if (!user) {
        const err = new Error('Authentication required');
        err.statusCode = 401;
        throw err;
      }
      const idx = db.resources.findIndex(r => r.id === id);
      if (idx === -1) {
        const err = new Error('Not found');
        err.statusCode = 404;
        throw err;
      }

      db.votesByUser[user.id] = db.votesByUser[user.id] || {};
      const prevVote = Number(db.votesByUser[user.id][id] || 0);
      if (prevVote === delta) {
        shouldRejectSameVote = true;
        return;
      }

      const change = prevVote === 0 ? delta : (delta - prevVote);
      const next = (db.resources[idx].votes || 0) + change;
      db.resources[idx].votes = next;
      db.resources[idx].updatedAt = new Date().toISOString();
      db.votesByUser[user.id][id] = delta;
      nextVote = delta;
      updated = db.resources[idx];
      await writeDB(db);
    });

    if (shouldRejectSameVote) {
      return res.status(409).json({ error: 'You already voted that way for this resource' });
    }
    res.json({ resource: updated, yourVote: nextVote });
  } catch (e) {
    if (e && typeof e === 'object' && e.statusCode) {
      return res.status(e.statusCode).json({ error: String(e.message || 'Request failed') });
    }
    res.status(500).json({ error: String(e?.message || e) });
  }
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`AI compendium running on http://localhost:${PORT}`);
});

