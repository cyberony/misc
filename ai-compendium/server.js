const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const express = require('express');
const fs = require('fs/promises');
const crypto = require('crypto');
const { promisify } = require('util');
const nodemailer = require('nodemailer');

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
  const passwordResetTokens = Array.isArray(parsed.passwordResetTokens)
    ? parsed.passwordResetTokens
    : [];
  return { resources, users, sessions, votesByUser, bugReports, passwordResetTokens };
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

function normalizeUrlValue(rawUrl) {
  const raw = String(rawUrl || '').trim();
  if (!raw) return '';
  const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw) ? raw : `https://${raw}`;
  let u;
  try {
    u = new URL(withScheme);
  } catch {
    return '';
  }
  if (!['http:', 'https:'].includes(u.protocol)) return '';
  u.hash = '';
  const blockedParams = new Set([
    'utm_source',
    'utm_medium',
    'utm_campaign',
    'utm_term',
    'utm_content',
    'gclid',
    'fbclid',
    'ref',
    'source',
  ]);
  const nextParams = new URLSearchParams();
  for (const [k, v] of u.searchParams.entries()) {
    const key = String(k || '').toLowerCase();
    if (blockedParams.has(key)) continue;
    nextParams.append(k, v);
  }
  u.search = nextParams.toString() ? `?${nextParams.toString()}` : '';
  u.pathname = u.pathname.replace(/\/+$/, '') || '/';
  return u.toString().toLowerCase();
}

function hostWithoutWww(hostname) {
  return String(hostname || '').toLowerCase().replace(/^www\./, '');
}

function apexDomain(hostname) {
  const parts = hostWithoutWww(hostname).split('.').filter(Boolean);
  if (parts.length < 2) return hostWithoutWww(hostname);
  return `${parts[parts.length - 2]}.${parts[parts.length - 1]}`;
}

function urlIdentityKeys(rawUrl) {
  const normalized = normalizeUrlValue(rawUrl);
  if (!normalized) return [];
  const u = new URL(normalized);
  const host = hostWithoutWww(u.hostname);
  const apex = apexDomain(host);
  const segments = u.pathname.split('/').filter(Boolean).map((s) => s.toLowerCase());
  const keys = new Set();
  const fullNoQuery = `${host}${u.pathname}`;
  keys.add(fullNoQuery);
  keys.add(host);
  keys.add(apex);
  if (segments.length) {
    keys.add(`${host}/${segments[0]}`);
    keys.add(`${apex}/${segments[0]}`);
  }
  if ((host === 'github.com' || host === 'gitlab.com') && segments.length >= 2) {
    keys.add(`${host}/${segments[0]}/${segments[1]}`);
  }
  if (host === 'npmjs.com' && segments[0] === 'package' && segments[1]) {
    keys.add(`${host}/package/${segments[1]}`);
  }
  if (host === 'pypi.org' && segments[0] === 'project' && segments[1]) {
    keys.add(`${host}/project/${segments[1]}`);
  }
  return [...keys];
}

function findDuplicateByUrl(resources, incomingUrl) {
  const incomingKeys = new Set(urlIdentityKeys(incomingUrl));
  if (!incomingKeys.size) return null;
  for (const r of resources || []) {
    if (!r || !r.url) continue;
    const existingKeys = urlIdentityKeys(r.url);
    if (!existingKeys.length) continue;
    if (existingKeys.some((k) => incomingKeys.has(k))) {
      return r;
    }
  }
  return null;
}

function collectTagVocabulary(resources) {
  const counts = new Map();
  for (const r of resources || []) {
    for (const t of r.tags || []) {
      const k = String(t).trim().toLowerCase();
      if (!k) continue;
      counts.set(k, (counts.get(k) || 0) + 1);
    }
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 200)
    .map(([tag]) => tag);
}

function normalizeSuggestedTag(s) {
  let t = String(s || '').trim().toLowerCase();
  t = t.replace(/\s+/g, '-');
  t = t.replace(/[^a-z0-9-]/g, '');
  t = t.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return t.slice(0, 48);
}

async function suggestTagsFromOpenAI({ url, vocabulary, currentTags }) {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  const model = String(process.env.OPENAI_SUGGEST_MODEL || 'gpt-4o-mini').trim();
  const vocabSet = new Set(vocabulary.map((t) => String(t).toLowerCase()));

  const payload = {
    url,
    existingTagVocabulary: vocabulary,
    currentTags,
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.25,
      max_tokens: 500,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: [
            'You help tag video/audio AI tools in a shared catalog.',
            'Infer tags ONLY from the URL string (hostname, path segments, known product or service names implied by the URL).',
            'Ignore any title or description — they are not provided; use the URL alone.',
            'Return JSON only: {"suggestedExisting": string[], "suggestedNew": string[]}.',
            'suggestedExisting: up to 8 tags chosen ONLY from the provided vocabulary list when they clearly apply.',
            'suggestedNew: up to 2 new concise tags only if needed; use lowercase, hyphen-separated words (e.g. speech-to-text).',
            'Avoid generic tags: ai, tool, software, app, website unless nothing else fits.',
            'Prefer vocabulary matches over inventing new tags.',
            'Do not repeat tags in currentTags.',
          ].join(' '),
        },
        {
          role: 'user',
          content: JSON.stringify(payload),
        },
      ],
    }),
  });

  const rawText = await res.text();
  if (!res.ok) {
    const err = new Error(`OpenAI HTTP ${res.status}`);
    err.detail = rawText.slice(0, 500);
    throw err;
  }

  let data;
  try {
    data = JSON.parse(rawText);
  } catch {
    throw new Error('Invalid OpenAI response');
  }

  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty OpenAI content');

  let parsed;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error('OpenAI returned non-JSON');
  }

  const existingRaw = Array.isArray(parsed.suggestedExisting) ? parsed.suggestedExisting : [];
  const newRaw = Array.isArray(parsed.suggestedNew) ? parsed.suggestedNew : [];

  const suggestedExisting = [];
  const seen = new Set(currentTags.map((t) => normalizeSuggestedTag(t)).filter(Boolean));
  for (const x of existingRaw) {
    const n = normalizeSuggestedTag(x);
    if (!n || seen.has(n)) continue;
    if (vocabSet.has(n)) {
      suggestedExisting.push(n);
      seen.add(n);
    }
  }
  if (suggestedExisting.length > 8) suggestedExisting.length = 8;

  const suggestedNew = [];
  for (const x of newRaw) {
    const n = normalizeSuggestedTag(x);
    if (!n || seen.has(n)) continue;
    if (vocabSet.has(n)) continue;
    suggestedNew.push(n);
    seen.add(n);
    if (suggestedNew.length >= 2) break;
  }

  return { suggestedExisting, suggestedNew };
}

const scryptAsync = promisify(crypto.scrypt);
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days
const RESET_TOKEN_TTL_MS = 1000 * 60 * 30; // 30 minutes
const FORGOT_RATE_WINDOW_MS = 1000 * 60 * 60; // 1 hour
const FORGOT_RATE_MAX = 5;
const PASSWORD_SPECIAL = '!@#$%^&*()_+-=[]{}|;\':",.<>?/~`';
const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_+\-=[\]{}|;':",.<>?/~`]/;

function nowMs() {
  return Date.now();
}

function normalizeEmail(v) {
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
    role: user.role === 'admin' ? 'admin' : 'user',
    createdAt: user.createdAt,
  };
}

function isAdminUser(user) {
  return Boolean(user && user.role === 'admin');
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

const forgotRateByIp = new Map();

function hashResetToken(raw) {
  return crypto.createHash('sha256').update(String(raw), 'utf8').digest('hex');
}

function sweepExpiredPasswordResetTokens(db) {
  const t = nowMs();
  const list = db.passwordResetTokens || [];
  const next = list.filter((x) => Number(x.expiresAt || 0) > t);
  if (next.length !== list.length) {
    db.passwordResetTokens = next;
    return true;
  }
  return false;
}

function getClientIp(req) {
  const xf = String(req.headers['x-forwarded-for'] || '').split(',')[0].trim();
  if (xf) return xf;
  return String(req.socket?.remoteAddress || req.ip || '');
}

function forgotPasswordRateOk(ip) {
  const now = nowMs();
  let arr = forgotRateByIp.get(ip) || [];
  arr = arr.filter((t) => now - t < FORGOT_RATE_WINDOW_MS);
  if (arr.length >= FORGOT_RATE_MAX) return false;
  arr.push(now);
  forgotRateByIp.set(ip, arr);
  return true;
}

function getPublicBaseUrl() {
  const fromEnv = String(process.env.PUBLIC_BASE_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');
  const p = process.env.PORT ? Number(process.env.PORT) : 3000;
  return `http://localhost:${p}`;
}

let mailTransport = null;
function getMailTransport() {
  if (mailTransport) return mailTransport;
  const host = process.env.SMTP_HOST || '127.0.0.1';
  const port = Number(process.env.SMTP_PORT || 1025);
  const secure = String(process.env.SMTP_SECURE || '').toLowerCase() === 'true';
  const user = String(process.env.SMTP_USER || '').trim();
  const pass = String(process.env.SMTP_PASS || '').replace(/\s/g, '');
  mailTransport = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: user ? { user, pass } : undefined,
    connectionTimeout: 20_000,
    greetingTimeout: 20_000,
    socketTimeout: 25_000,
    // Gmail and most providers on 587 use STARTTLS (not implicit TLS on 465).
    ...(!secure && port === 587 ? { requireTLS: true } : {}),
  });
  if (String(process.env.SMTP_LOG_CONFIG || '').toLowerCase() === 'true') {
    console.log(`[mail] SMTP ${host}:${port} secure=${secure} auth=${user ? 'yes' : 'no'}`);
  }
  return mailTransport;
}

async function sendPasswordResetEmail(toEmail, rawToken) {
  const from = String(process.env.SMTP_FROM || 'AI Compendium <noreply@localhost>').trim();
  const base = getPublicBaseUrl();
  const url = `${base}/reset-password.html?token=${encodeURIComponent(rawToken)}`;
  const transport = getMailTransport();
  await transport.sendMail({
    from,
    to: toEmail,
    subject: 'Reset your AI Compendium password',
    text: `We received a request to reset your password.\n\nOpen this link (valid 30 minutes):\n${url}\n\nIf you did not request this, you can ignore this email.`,
    html: `<p>We received a request to reset your password.</p><p><a href="${escapeHtmlAttr(url)}">Set a new password</a> (link valid 30 minutes)</p><p>If you did not request this, you can ignore this email.</p>`,
  });
}

function escapeHtmlAttr(u) {
  return String(u)
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
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
        role: 'user',
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

const FORGOT_PASSWORD_MESSAGE =
  'If an account exists for that email, a reset link has been sent. Check your inbox (or Mailpit in development).';

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const email = normalizeEmail(req.body?.email);
    if (!email || !email.includes('@')) {
      return res.status(400).json({ error: 'Enter a valid email' });
    }

    const ip = getClientIp(req);
    const rateOk = forgotPasswordRateOk(ip);

    /** Set when we saved a token and must send mail (or roll back if SMTP fails). */
    let mailPayload = null;

    await enqueueWrite(async () => {
      const db = await readDB();
      sweepExpiredSessions(db);
      sweepExpiredPasswordResetTokens(db);

      const user = db.users.find((u) => normalizeEmail(u.email) === email);
      if (!user) {
        await writeDB(db);
        return;
      }
      if (!rateOk) {
        await writeDB(db);
        return;
      }

      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = hashResetToken(rawToken);
      db.passwordResetTokens = (db.passwordResetTokens || []).filter((t) => t.userId !== user.id);
      db.passwordResetTokens.push({
        id: crypto.randomUUID(),
        userId: user.id,
        tokenHash,
        expiresAt: nowMs() + RESET_TOKEN_TTL_MS,
        createdAt: new Date().toISOString(),
      });
      await writeDB(db);
      mailPayload = { toEmail: user.email, rawToken, userId: user.id };
    });

    if (mailPayload) {
      try {
        await sendPasswordResetEmail(mailPayload.toEmail, mailPayload.rawToken);
      } catch (err) {
        const detail = err?.response || err?.message || String(err);
        console.error('sendPasswordResetEmail failed:', detail);
        await enqueueWrite(async () => {
          const db = await readDB();
          db.passwordResetTokens = (db.passwordResetTokens || []).filter(
            (t) => t.userId !== mailPayload.userId,
          );
          await writeDB(db);
        });
        if (String(process.env.SMTP_DEBUG || '').toLowerCase() === 'true') {
          return res.status(503).json({
            error: `Could not send email. ${typeof detail === 'string' ? detail : err?.message || 'Check SMTP_* in .env and server logs.'}`,
          });
        }
        return res.status(503).json({
          error:
            'Could not send the reset email. Check that SMTP is configured in .env (see .env.example) and the server log for details.',
        });
      }
    }

    res.json({ ok: true, message: FORGOT_PASSWORD_MESSAGE });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const rawToken = String(req.body?.token || '').trim();
    const newPassword = String(req.body?.newPassword || '');
    if (!rawToken) return res.status(400).json({ error: 'Missing token' });
    const pwValidation = validatePassword(newPassword);
    if (!pwValidation.ok) return res.status(400).json({ error: pwValidation.error });

    const tokenHash = hashResetToken(rawToken);
    await enqueueWrite(async () => {
      const db = await readDB();
      sweepExpiredSessions(db);
      sweepExpiredPasswordResetTokens(db);

      const idx = (db.passwordResetTokens || []).findIndex((t) => t.tokenHash === tokenHash);
      if (idx === -1) {
        const err = new Error('Invalid or expired reset link');
        err.statusCode = 400;
        throw err;
      }
      const record = db.passwordResetTokens[idx];
      if (Number(record.expiresAt) <= nowMs()) {
        db.passwordResetTokens.splice(idx, 1);
        await writeDB(db);
        const err = new Error('Invalid or expired reset link');
        err.statusCode = 400;
        throw err;
      }
      const user = db.users.find((u) => u.id === record.userId);
      if (!user) {
        db.passwordResetTokens.splice(idx, 1);
        await writeDB(db);
        const err = new Error('Invalid or expired reset link');
        err.statusCode = 400;
        throw err;
      }
      user.passwordHash = await hashPassword(newPassword);
      user.updatedAt = new Date().toISOString();
      db.passwordResetTokens = (db.passwordResetTokens || []).filter((t) => t.userId !== user.id);
      for (const [token, session] of Object.entries(db.sessions || {})) {
        if (session && session.userId === user.id) delete db.sessions[token];
      }
      await writeDB(db);
    });

    res.json({ ok: true, message: 'Password updated. You can log in.' });
  } catch (e) {
    if (e && typeof e === 'object' && e.statusCode) {
      return res.status(e.statusCode).json({ error: String(e.message || 'Request failed') });
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

app.patch('/api/auth/profile', async (req, res) => {
  try {
    const nextEmail = normalizeEmail(req.body?.email);
    const nextName = String(req.body?.name || '').trim();
    const currentPassword = String(req.body?.currentPassword || '');
    const newPassword = String(req.body?.newPassword || '');
    if (!nextEmail || !nextEmail.includes('@')) {
      return res.status(400).json({ error: 'Enter a valid email' });
    }

    let outUser = null;
    await enqueueWrite(async () => {
      const db = await readDB();
      sweepExpiredSessions(db);
      const user = getAuthUserFromDB(req, db);
      if (!user) {
        const err = new Error('Authentication required');
        err.statusCode = 401;
        throw err;
      }

      const emailTaken = db.users.some(
        (u) => u.id !== user.id && normalizeEmail(u.email) === nextEmail,
      );
      if (emailTaken) {
        const err = new Error('Email already in use');
        err.statusCode = 409;
        throw err;
      }

      user.email = nextEmail;
      user.name = nextName;
      user.updatedAt = new Date().toISOString();

      if (newPassword) {
        if (!currentPassword) {
          const err = new Error('Current password is required to set a new password');
          err.statusCode = 400;
          throw err;
        }
        const ok = await verifyPassword(currentPassword, user.passwordHash);
        if (!ok) {
          const err = new Error('Current password is incorrect');
          err.statusCode = 401;
          throw err;
        }
        const pwValidation = validatePassword(newPassword);
        if (!pwValidation.ok) {
          const err = new Error(pwValidation.error);
          err.statusCode = 400;
          throw err;
        }
        user.passwordHash = await hashPassword(newPassword);
      }

      outUser = publicUser(user);
      await writeDB(db);
    });

    return res.json({ ok: true, user: outUser });
  } catch (e) {
    if (e && typeof e === 'object' && e.statusCode) {
      return res.status(e.statusCode).json({ error: String(e.message || 'Request failed') });
    }
    return res.status(500).json({ error: String(e?.message || e) });
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
    const kindRaw = String(req.body?.kind || 'bug').trim().toLowerCase();
    const kind = kindRaw === 'feature' ? 'feature' : 'bug';

    if (!title) {
      return res.status(400).json({ error: kind === 'feature' ? 'Title is required' : 'Bug title is required' });
    }
    if (!steps) {
      return res.status(400).json({
        error: kind === 'feature' ? 'Description is required' : 'Steps to reproduce are required',
      });
    }

    const reportId = crypto.randomUUID();
    const createdAt = new Date().toISOString();
    const userAgent = String(req.headers['user-agent'] || '');

    await enqueueWrite(async () => {
      const db = await readDB();
      sweepExpiredSessions(db);
      const user = getAuthUserFromDB(req, db);
      const bodyEmail = normalizeEmail(req.body?.email || '');
      const email =
        user && user.email ? normalizeEmail(user.email) : bodyEmail;
      const report = {
        id: reportId,
        kind,
        title,
        steps,
        area: area || null,
        expected: expected || null,
        actual: actual || null,
        email: email || null,
        status: 'open',
        createdAt,
        meta: {
          userAgent,
        },
      };
      db.bugReports.push(report);
      await writeDB(db);
    });

    res.status(201).json({ ok: true, reportId });
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

app.post('/api/resources/suggest-tags', async (req, res) => {
  try {
    const url = String(req.body?.url || '').trim();
    const currentTags = Array.isArray(req.body?.currentTags)
      ? req.body.currentTags.map((t) => normalizeSuggestedTag(t)).filter(Boolean)
      : [];

    const urlLooksLikeLink =
      url.length >= 3 && (/^https?:\/\//i.test(url) || /\./.test(url));
    if (!urlLooksLikeLink) {
      return res.status(400).json({ error: 'Provide a link URL for tag suggestions' });
    }

    const db = await readDB();
    const vocabulary = collectTagVocabulary(db.resources);
    const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
    if (!apiKey) {
      return res.json({
        ok: true,
        suggestedExisting: [],
        suggestedNew: [],
        unavailableReason: 'no_api_key',
      });
    }

    try {
      const out = await suggestTagsFromOpenAI({
        url,
        vocabulary,
        currentTags,
      });
      return res.json({ ok: true, ...out });
    } catch (e) {
      console.error('suggestTagsFromOpenAI:', e?.message || e);
      return res.json({
        ok: true,
        suggestedExisting: [],
        suggestedNew: [],
        unavailableReason: 'openai_failed',
      });
    }
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
      const duplicate = findDuplicateByUrl(db.resources, url);
      if (duplicate) {
        const err = new Error('This product is already in the list.');
        err.statusCode = 409;
        err.duplicateResource = {
          id: duplicate.id,
          title: duplicate.title,
          url: duplicate.url || '',
        };
        throw err;
      }
      db.resources.push(resource);
      await writeDB(db);
    });

    res.status(201).json({ resource });
  } catch (e) {
    if (e && typeof e === 'object' && e.statusCode === 409) {
      return res.status(409).json({
        error: String(e.message || 'Duplicate resource'),
        duplicateResource: e.duplicateResource || null,
      });
    }
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

app.delete('/api/resources/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Missing resource id' });

    let deleted = null;
    await enqueueWrite(async () => {
      const db = await readDB();
      sweepExpiredSessions(db);
      const user = getAuthUserFromDB(req, db);
      if (!user) {
        const err = new Error('Authentication required');
        err.statusCode = 401;
        throw err;
      }
      if (!isAdminUser(user)) {
        const err = new Error('Admin access required');
        err.statusCode = 403;
        throw err;
      }

      const idx = db.resources.findIndex((r) => r.id === id);
      if (idx === -1) {
        const err = new Error('Not found');
        err.statusCode = 404;
        throw err;
      }
      deleted = db.resources[idx];
      db.resources.splice(idx, 1);

      // Clean vote references for this resource.
      for (const userId of Object.keys(db.votesByUser || {})) {
        if (db.votesByUser[userId] && Object.prototype.hasOwnProperty.call(db.votesByUser[userId], id)) {
          delete db.votesByUser[userId][id];
        }
      }

      await writeDB(db);
    });

    return res.json({ ok: true, resource: deleted });
  } catch (e) {
    if (e && typeof e === 'object' && e.statusCode) {
      return res.status(e.statusCode).json({ error: String(e.message || 'Request failed') });
    }
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get('/api/admin/bug-reports', async (req, res) => {
  try {
    const db = await readDB();
    sweepExpiredSessions(db);
    const user = getAuthUserFromDB(req, db);
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    if (!isAdminUser(user)) return res.status(403).json({ error: 'Admin access required' });

    const bugReports = [...(db.bugReports || [])].sort((a, b) =>
      String(b.createdAt || '').localeCompare(String(a.createdAt || '')),
    );
    res.json({ bugReports });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.patch('/api/admin/bug-reports/:id', async (req, res) => {
  try {
    const id = String(req.params.id || '').trim();
    const statusRaw = String(req.body?.status || '').trim().toLowerCase();
    if (!id) return res.status(400).json({ error: 'Missing report id' });
    if (statusRaw !== 'open' && statusRaw !== 'closed') {
      return res.status(400).json({ error: 'status must be "open" or "closed"' });
    }

    let errOut = null;
    await enqueueWrite(async () => {
      const db = await readDB();
      sweepExpiredSessions(db);
      const user = getAuthUserFromDB(req, db);
      if (!user) {
        errOut = { code: 401, message: 'Authentication required' };
        return;
      }
      if (!isAdminUser(user)) {
        errOut = { code: 403, message: 'Admin access required' };
        return;
      }
      const rep = (db.bugReports || []).find((r) => r.id === id);
      if (!rep) {
        errOut = { code: 404, message: 'Report not found' };
        return;
      }
      rep.status = statusRaw;
      await writeDB(db);
    });

    if (errOut) return res.status(errOut.code).json({ error: errOut.message });
    return res.json({ ok: true, status: statusRaw });
  } catch (e) {
    return res.status(500).json({ error: String(e?.message || e) });
  }
});

app.get('/api/admin/users', async (req, res) => {
  try {
    const db = await readDB();
    sweepExpiredSessions(db);
    const user = getAuthUserFromDB(req, db);
    if (!user) return res.status(401).json({ error: 'Authentication required' });
    if (!isAdminUser(user)) return res.status(403).json({ error: 'Admin access required' });

    const users = (db.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name || '',
      role: u.role === 'admin' ? 'admin' : 'user',
      createdAt: u.createdAt,
    }));
    res.json({ users });
  } catch (e) {
    res.status(500).json({ error: String(e?.message || e) });
  }
});

app.patch('/api/admin/users/:id/role', async (req, res) => {
  try {
    const targetId = String(req.params.id || '').trim();
    const role = String(req.body?.role || '').trim().toLowerCase();
    if (!targetId) return res.status(400).json({ error: 'Missing user id' });
    if (!['admin', 'user'].includes(role)) return res.status(400).json({ error: 'role must be admin or user' });

    let updated = null;
    await enqueueWrite(async () => {
      const db = await readDB();
      sweepExpiredSessions(db);
      const requester = getAuthUserFromDB(req, db);
      if (!requester) {
        const err = new Error('Authentication required');
        err.statusCode = 401;
        throw err;
      }
      if (!isAdminUser(requester)) {
        const err = new Error('Admin access required');
        err.statusCode = 403;
        throw err;
      }
      const user = (db.users || []).find((u) => u.id === targetId);
      if (!user) {
        const err = new Error('User not found');
        err.statusCode = 404;
        throw err;
      }
      user.role = role;
      user.updatedAt = new Date().toISOString();
      updated = publicUser(user);
      await writeDB(db);
    });
    res.json({ ok: true, user: updated });
  } catch (e) {
    if (e && typeof e === 'object' && e.statusCode) {
      return res.status(e.statusCode).json({ error: String(e.message || 'Request failed') });
    }
    res.status(500).json({ error: String(e?.message || e) });
  }
});

const MAGIC_PAGE_COOKIE = 'msai_magic_page';
const MAGIC_UNLOCK_WINDOW_MS = 15 * 60 * 1000;
const MAGIC_UNLOCK_MAX_FAILS = 12;
/** @type {Map<string, { failed: number; resetAt: number }>} */
const magicUnlockByIp = new Map();

function clientIpForRateLimit(req) {
  const xf = req.headers['x-forwarded-for'];
  if (typeof xf === 'string' && xf.trim()) {
    return xf.split(',')[0].trim().slice(0, 80);
  }
  const ra = req.socket?.remoteAddress || req.ip;
  return ra ? String(ra).slice(0, 80) : 'unknown';
}

function sweepMagicUnlockMap() {
  const now = Date.now();
  for (const [k, v] of magicUnlockByIp) {
    if (v.resetAt <= now) magicUnlockByIp.delete(k);
  }
}

function magicUnlockRateBlocked(ip) {
  sweepMagicUnlockMap();
  const entry = magicUnlockByIp.get(ip);
  if (!entry || entry.resetAt <= Date.now()) return { blocked: false, retryAfterSec: 0 };
  if (entry.failed >= MAGIC_UNLOCK_MAX_FAILS) {
    return { blocked: true, retryAfterSec: Math.max(1, Math.ceil((entry.resetAt - Date.now()) / 1000)) };
  }
  return { blocked: false, retryAfterSec: 0 };
}

function magicUnlockRecordFailure(ip) {
  const now = Date.now();
  let entry = magicUnlockByIp.get(ip);
  if (!entry || entry.resetAt <= now) {
    entry = { failed: 0, resetAt: now + MAGIC_UNLOCK_WINDOW_MS };
  }
  entry.failed += 1;
  magicUnlockByIp.set(ip, entry);
}

function magicUnlockClearFailures(ip) {
  magicUnlockByIp.delete(ip);
}

const magicUnlockSweepTimer = setInterval(sweepMagicUnlockMap, 60 * 1000);
if (typeof magicUnlockSweepTimer.unref === 'function') magicUnlockSweepTimer.unref();

function parseCookieHeader(header) {
  const out = {};
  if (!header || typeof header !== 'string') return out;
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i < 0) continue;
    const k = part.slice(0, i).trim();
    const v = part.slice(i + 1).trim();
    try {
      out[k] = decodeURIComponent(v);
    } catch {
      out[k] = v;
    }
  }
  return out;
}

function magicPageSigningSecret() {
  const cookieSecret = String(process.env.MAGIC_PAGE_COOKIE_SECRET || '').trim();
  const pwd = String(process.env.MAGIC_PAGE_PASSWORD || '').trim();
  return cookieSecret || pwd || '';
}

function makeMagicPageToken() {
  const exp = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const payload = String(exp);
  const sig = crypto.createHmac('sha256', magicPageSigningSecret()).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyMagicPageToken(token) {
  const secret = magicPageSigningSecret();
  if (!secret) return false;
  const s = String(token || '').trim();
  const dot = s.lastIndexOf('.');
  if (dot < 1) return false;
  const exp = s.slice(0, dot);
  const sig = s.slice(dot + 1);
  if (!/^\d+$/.test(exp)) return false;
  const expectedSig = crypto.createHmac('sha256', secret).update(exp).digest('base64url');
  let ok = false;
  try {
    const a = Buffer.from(sig, 'utf8');
    const b = Buffer.from(expectedSig, 'utf8');
    ok = a.length === b.length && crypto.timingSafeEqual(a, b);
  } catch {
    ok = false;
  }
  if (!ok) return false;
  if (Number(exp) <= Date.now()) return false;
  return true;
}

app.get('/api/magic-page/status', (req, res) => {
  const cookies = parseCookieHeader(req.headers.cookie);
  const configured = Boolean(String(process.env.MAGIC_PAGE_PASSWORD || '').trim());
  const unlocked = configured && verifyMagicPageToken(cookies[MAGIC_PAGE_COOKIE]);
  res.json({ unlocked, configured });
});

app.post('/api/magic-page/unlock', (req, res) => {
  const expectedPwd = String(process.env.MAGIC_PAGE_PASSWORD || '').trim();
  if (!expectedPwd) {
    return res
      .status(503)
      .json({ error: 'This page is not configured yet (set MAGIC_PAGE_PASSWORD in the server environment).' });
  }
  const ip = clientIpForRateLimit(req);
  const rate = magicUnlockRateBlocked(ip);
  if (rate.blocked) {
    res.setHeader('Retry-After', String(rate.retryAfterSec));
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  const bodyPwd = String(req.body?.password ?? '');
  const a = Buffer.from(expectedPwd, 'utf8');
  const b = Buffer.from(bodyPwd, 'utf8');
  if (a.length !== b.length) {
    try {
      crypto.timingSafeEqual(a, a);
    } catch {
      /* ignore */
    }
    magicUnlockRecordFailure(ip);
    return res.status(401).json({ error: 'Wrong password.' });
  }
  let match = false;
  try {
    match = crypto.timingSafeEqual(a, b);
  } catch {
    match = false;
  }
  if (!match) {
    magicUnlockRecordFailure(ip);
    return res.status(401).json({ error: 'Wrong password.' });
  }

  magicUnlockClearFailures(ip);
  const token = makeMagicPageToken();
  const maxAge = 30 * 24 * 60 * 60;
  const secure =
    String(process.env.MAGIC_PAGE_COOKIE_SECURE || '').toLowerCase() === 'true' ? '; Secure' : '';
  res.setHeader(
    'Set-Cookie',
    `${MAGIC_PAGE_COOKIE}=${encodeURIComponent(token)}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${maxAge}${secure}`,
  );
  res.json({ ok: true });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
app.listen(PORT, () => {
  console.log(`AI compendium running on http://localhost:${PORT}`);
});

