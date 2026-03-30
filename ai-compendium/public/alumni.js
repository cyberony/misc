const $ = (sel) => document.querySelector(sel);

/** @type {Array<Record<string, unknown>>} */
let alumniRows = [];
const sortState = { key: 'graduationTerm', dir: 'asc' };
let tableInteractionWired = false;
let sortHeaderWired = false;

function escapeHTML(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function authHeaders() {
  const token = localStorage.getItem('msai_auth_token') || '';
  const h = {};
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

function sortValue(row, key) {
  if (key === 'name') {
    return [row.first, row.last].filter(Boolean).join(' ').trim().toLowerCase();
  }
  return String(row[key] ?? '').trim().toLowerCase();
}

function sortRows(rows, key, dir) {
  const mult = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const va = sortValue(a, key);
    const vb = sortValue(b, key);
    const cmp = va.localeCompare(vb, undefined, { sensitivity: 'base', numeric: true });
    if (cmp !== 0) return cmp * mult;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
}

function updateSortHeaderIndicators() {
  const table = $('#alumniTable');
  if (!table) return;
  table.querySelectorAll('thead .alumni-th-btn').forEach((btn) => {
    const key = btn.getAttribute('data-sort-key');
    const ind = btn.querySelector('.alumni-sort-ind');
    if (!ind) return;
    if (key === sortState.key) {
      ind.textContent = sortState.dir === 'asc' ? '\u25B2' : '\u25BC';
      ind.classList.remove('alumni-sort-neutral');
      ind.classList.add('alumni-sort-active');
      btn.setAttribute('aria-pressed', 'true');
      btn.setAttribute(
        'title',
        `Sorted ${sortState.dir === 'asc' ? 'ascending' : 'descending'} — click to reverse`,
      );
    } else {
      ind.textContent = '\u25B2';
      ind.classList.remove('alumni-sort-active');
      ind.classList.add('alumni-sort-neutral');
      btn.setAttribute('aria-pressed', 'false');
      btn.setAttribute('title', 'Sort column');
    }
  });
}

function cellBlock(val) {
  return `<div class="alumni-cell">${escapeHTML(String(val || ''))}</div>`;
}

function linkCell(url) {
  if (!url) return `<div class="alumni-cell alumni-cell-link">${escapeHTML('—')}</div>`;
  return `<div class="alumni-cell alumni-cell-link"><a href="${escapeHTML(url)}" target="_blank" rel="noreferrer" class="alumni-link-in-cell">Profile</a></div>`;
}

function buildRow(r) {
  const name = [r.first, r.last].filter(Boolean).join(' ').trim();
  const rid = escapeHTML(r.id || '');
  return `<tr class="alumni-row" data-row-id="${rid}" tabindex="0" role="button" aria-expanded="false">
    <td>${cellBlock(r.graduationTerm)}</td>
    <td>${cellBlock(name)}</td>
    <td>${cellBlock(r.company)}</td>
    <td>${cellBlock(r.title)}</td>
    <td>${cellBlock(r.industry)}</td>
    <td>${cellBlock(r.personalEmail)}</td>
    <td>${linkCell(r.linkedinUrl)}</td>
    <td>${cellBlock(r.capstone)}</td>
    <td>${cellBlock(r.internship)}</td>
    <td>${cellBlock(r.practicum)}</td>
  </tr>`;
}

function renderAlumniTable() {
  const tbody = $('#alumniTbody');
  if (!tbody) return;
  const sorted = sortRows(alumniRows, sortState.key, sortState.dir);
  tbody.innerHTML = sorted.map(buildRow).join('');
  if (!tableInteractionWired) {
    wireTableInteraction(tbody);
    tableInteractionWired = true;
  }
  updateSortHeaderIndicators();
}

function wireTableInteraction(tbody) {
  tbody.addEventListener('click', (e) => {
    if (e.target.closest('a.alumni-link-in-cell')) return;
    const tr = e.target.closest('tr.alumni-row');
    if (!tr) return;
    const open = !tr.classList.contains('expanded');
    tr.classList.toggle('expanded', open);
    tr.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  tbody.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    const tr = e.target.closest('tr.alumni-row');
    if (!tr || tr !== document.activeElement) return;
    e.preventDefault();
    const open = !tr.classList.contains('expanded');
    tr.classList.toggle('expanded', open);
    tr.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
}

function wireSortHeader() {
  if (sortHeaderWired) return;
  const thead = $('#alumniTable')?.querySelector('thead');
  if (!thead) return;
  sortHeaderWired = true;
  thead.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-sort-key]');
    if (!btn) return;
    const key = btn.getAttribute('data-sort-key');
    if (!key) return;
    if (sortState.key === key) {
      sortState.dir = sortState.dir === 'asc' ? 'desc' : 'asc';
    } else {
      sortState.key = key;
      sortState.dir = 'asc';
    }
    renderAlumniTable();
  });
}

async function load() {
  const gate = $('#alumniGate');
  const wrap = $('#alumniTableWrap');
  const meta = $('#alumniMeta');
  const metaBlock = $('#alumniMetaBlock');

  const res = await fetch('/api/alumni', { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    gate.textContent = 'Sign in on the home page, then return here.';
    return;
  }
  if (res.status === 403) {
    gate.textContent = 'This directory is for admins and superusers only.';
    return;
  }
  if (!res.ok) {
    gate.textContent = data.error || `Could not load alumni (${res.status})`;
    return;
  }

  gate.hidden = true;
  wrap.hidden = false;
  if (metaBlock) metaBlock.hidden = false;
  const imported = data.importedAt ? new Date(data.importedAt).toLocaleString() : '';
  const check = data.lastLinkedInCheckAt
    ? new Date(data.lastLinkedInCheckAt).toLocaleString()
    : 'never';
  meta.textContent = `${data.rowCount || 0} rows · imported ${imported} · last LinkedIn snapshot run: ${check}`;

  alumniRows = Array.isArray(data.rows) ? data.rows : [];
  wireSortHeader();
  renderAlumniTable();
}

load().catch((e) => {
  const gate = $('#alumniGate');
  if (gate) gate.textContent = String(e.message || e);
});
