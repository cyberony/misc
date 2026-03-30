const path = require('path');
const fs = require('fs/promises');

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

function decodeHtmlEntities(s) {
  return String(s || '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

/** Stable key for snapshot map */
function linkedinKey(url) {
  let u = String(url || '').trim();
  if (!u) return '';
  try {
    const parsed = new URL(u.startsWith('http') ? u : `https://${u}`);
    if (!parsed.hostname.toLowerCase().includes('linkedin.com')) return '';
    parsed.hash = '';
    parsed.search = '';
    let out = parsed.toString();
    if (out.endsWith('/')) out = out.slice(0, -1);
    return out.toLowerCase();
  } catch {
    return '';
  }
}

function parseLinkedInPublicMeta(html) {
  const ogTitle =
    html.match(/<meta\s+property="og:title"\s+content="([^"]*)"/i)?.[1] ||
    html.match(/<meta\s+content="([^"]*)"\s+property="og:title"/i)?.[1] ||
    '';
  const ogDesc =
    html.match(/<meta\s+property="og:description"\s+content="([^"]*)"/i)?.[1] ||
    html.match(/<meta\s+content="([^"]*)"\s+property="og:description"/i)?.[1] ||
    '';
  const titleDecoded = ogTitle ? decodeHtmlEntities(ogTitle) : '';
  const descDecoded = ogDesc ? decodeHtmlEntities(ogDesc) : '';

  let experienceCompany = '';
  const m = descDecoded.match(/Experience:\s*([^·]+)/i);
  if (m) experienceCompany = m[1].trim();

  let companyFromTitle = '';
  const m2 = titleDecoded.match(/^(.+?)\s+-\s+(.+?)\s+\|\s*LinkedIn\s*$/i);
  if (m2) companyFromTitle = m2[2].trim();

  return {
    ogTitle: titleDecoded,
    ogDescription: descDecoded,
    experienceCompany,
    companyFromTitle,
  };
}

/** Fingerprint for job-change detection */
function jobFingerprint(meta) {
  const parts = [
    meta.companyFromTitle,
    meta.experienceCompany,
    meta.ogTitle,
  ].filter(Boolean);
  return parts.join(' | ');
}

async function fetchLinkedInHtml(url) {
  const u = String(url || '').trim();
  if (!u || !linkedinKey(u)) return null;
  const res = await fetch(u, {
    redirect: 'follow',
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml',
      'Accept-Language': 'en-US,en;q=0.9',
    },
  });
  if (!res.ok) return null;
  return res.text();
}

async function readAlumniPayload(alumniJsonPath) {
  const raw = await fs.readFile(alumniJsonPath, 'utf8');
  const data = JSON.parse(raw);
  return data;
}

async function readSnapshot(snapshotPath) {
  try {
    const raw = await fs.readFile(snapshotPath, 'utf8');
    return JSON.parse(raw);
  } catch {
    return { meta: {}, byKey: {} };
  }
}

async function writeSnapshot(snapshotPath, snap) {
  await fs.writeFile(snapshotPath, JSON.stringify(snap, null, 2), 'utf8');
}

module.exports = {
  decodeHtmlEntities,
  linkedinKey,
  parseLinkedInPublicMeta,
  jobFingerprint,
  fetchLinkedInHtml,
  readAlumniPayload,
  readSnapshot,
  writeSnapshot,
};
