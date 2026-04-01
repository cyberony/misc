const $ = (sel) => document.querySelector(sel);

if (new URLSearchParams(window.location.search).get('embed') === '1') {
  document.body.classList.add('embed-shell');
}

/** @type {Array<Record<string, unknown>>} */
let alumniRows = [];
const sortState = { key: 'graduationTerm', dir: 'asc' };
let tableInteractionWired = false;
let sortHeaderWired = false;
let downloadXlsxWired = false;

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

/** Winter → Spring → Fall (then Summer); primary sort by year */
function compareGraduationTerm(a, b) {
  const pa = parseGraduationTerm(a);
  const pb = parseGraduationTerm(b);
  if (pa && pb) {
    if (pa.year !== pb.year) return pa.year - pb.year;
    if (pa.quarter !== pb.quarter) return pa.quarter - pb.quarter;
    return 0;
  }
  if (pa && !pb) return -1;
  if (!pa && pb) return 1;
  return String(a.graduationTerm ?? '').localeCompare(String(b.graduationTerm ?? ''), undefined, {
    sensitivity: 'base',
    numeric: true,
  });
}

function parseGraduationTerm(row) {
  const s = String(row.graduationTerm ?? '').trim();
  const m = s.match(/^(winter|spring|fall|summer)\s+(\d{4})$/i);
  if (!m) return null;
  const season = m[1].toLowerCase();
  const year = parseInt(m[2], 10);
  const quarter = { winter: 0, spring: 1, fall: 2, summer: 3 }[season];
  if (quarter === undefined || Number.isNaN(year)) return null;
  return { year, quarter };
}

function sortRows(rows, key, dir) {
  const mult = dir === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    let cmp;
    if (key === 'graduationTerm') {
      cmp = compareGraduationTerm(a, b);
    } else {
      const va = sortValue(a, key);
      const vb = sortValue(b, key);
      cmp = va.localeCompare(vb, undefined, { sensitivity: 'base', numeric: true });
    }
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

function cellBlock(val, extraClass = '') {
  const classes = ['alumni-cell', extraClass].filter(Boolean).join(' ');
  return `<div class="${classes}">${escapeHTML(String(val || ''))}</div>`;
}

function nameCell(name, linkedinUrl) {
  const safe = escapeHTML(name);
  const url = String(linkedinUrl || '').trim();
  if (!url) {
    return `<div class="alumni-cell alumni-cell--name">${safe}</div>`;
  }
  return `<div class="alumni-cell alumni-cell--name"><a href="${escapeHTML(url)}" target="_blank" rel="noreferrer" class="alumni-name-link">${safe}</a></div>`;
}

function buildRow(r) {
  const name = [r.first, r.last].filter(Boolean).join(' ').trim();
  const rid = escapeHTML(r.id || '');
  return `<tr class="alumni-row" data-row-id="${rid}" tabindex="0" role="button" aria-expanded="false">
    <td>${cellBlock(r.graduationTerm)}</td>
    <td>${nameCell(name, r.linkedinUrl)}</td>
    <td>${cellBlock(r.company, 'alumni-cell--company')}</td>
    <td>${cellBlock(r.title, 'alumni-cell--title')}</td>
    <td>${cellBlock(r.industry)}</td>
    <td>${cellBlock(r.personalEmail)}</td>
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
    if (e.target.closest('a.alumni-name-link')) return;
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

function wireDownloadXlsx() {
  if (downloadXlsxWired) return;
  const btn = $('#alumniDownloadXlsx');
  if (!btn) return;
  downloadXlsxWired = true;
  btn.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/alumni/export.xlsx', { headers: authHeaders() });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(err.error || `Download failed (${res.status})`);
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'MSAI_Alumni_Directory.xlsx';
      a.rel = 'noopener';
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      alert(String(e?.message || e));
    }
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
  const synced = data.linkedInSyncedAt
    ? new Date(data.linkedInSyncedAt).toLocaleString()
    : '';
  meta.textContent = `${data.rowCount || 0} rows · imported ${imported} · last LinkedIn snapshot run: ${check}${
    synced ? ` · spreadsheet synced: ${synced}` : ''
  }`;

  alumniRows = Array.isArray(data.rows) ? data.rows : [];
  wireSortHeader();
  wireDownloadXlsx();
  renderAlumniTable();
}

load().catch((e) => {
  const gate = $('#alumniGate');
  if (gate) gate.textContent = String(e.message || e);
});
