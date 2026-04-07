const crypto = require('crypto');

const MAGIC_PAGE_COOKIE = 'msai_magic_page';

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

function requireMagicPageCookieJson(req, res, next) {
  const cookies = parseCookieHeader(req.headers.cookie);
  const configured = Boolean(String(process.env.MAGIC_PAGE_PASSWORD || '').trim());
  if (!configured) return res.status(503).json({ error: 'Magic page not configured' });
  if (!verifyMagicPageToken(cookies[MAGIC_PAGE_COOKIE])) {
    return res.status(401).json({ error: 'Magic page session required' });
  }
  next();
}

function requireMagicPageHtml(req, res, next) {
  const cookies = parseCookieHeader(req.headers.cookie);
  const configured = Boolean(String(process.env.MAGIC_PAGE_PASSWORD || '').trim());
  if (!configured) {
    return res.status(503).type('text').send('Magic page not configured (set MAGIC_PAGE_PASSWORD).');
  }
  if (!verifyMagicPageToken(cookies[MAGIC_PAGE_COOKIE])) {
    return res
      .status(403)
      .type('text')
      .send('Unlock the magic word page in this browser first (same session cookie).');
  }
  next();
}

module.exports = {
  MAGIC_PAGE_COOKIE,
  parseCookieHeader,
  magicPageSigningSecret,
  makeMagicPageToken,
  verifyMagicPageToken,
  requireMagicPageCookieJson,
  requireMagicPageHtml,
};
