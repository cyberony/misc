const $ = (sel) => document.querySelector(sel);

function escapeHTML(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const CHICAGO_TZ = 'America/Chicago';

/** Format an ISO (UTC) instant for display in Chicago time, e.g. Mar 27, 2026, 4:12:30 PM CDT */
function formatChicagoDateTime(iso) {
  const s = String(iso || '').trim();
  if (!s) return '';
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: CHICAGO_TZ,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
      timeZoneName: 'short',
    }).format(d);
  } catch {
    return s;
  }
}

/** Stable B1… / F1… labels: order by createdAt (oldest first), separate sequences per kind. */
function buildFeedbackRefById(reports) {
  const chron = [...reports].sort((a, b) => {
    const t = String(a.createdAt || '').localeCompare(String(b.createdAt || ''));
    if (t !== 0) return t;
    return String(a.id || '').localeCompare(String(b.id || ''));
  });
  const refById = new Map();
  let b = 0;
  let f = 0;
  for (const r of chron) {
    const id = r.id;
    if (!id) continue;
    if (r.kind === 'feature') {
      f += 1;
      refById.set(id, `F${f}`);
    } else {
      b += 1;
      refById.set(id, `B${b}`);
    }
  }
  return refById;
}

function authHeaders() {
  const token = localStorage.getItem('msai_auth_token') || '';
  const h = {};
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

let allReportsCache = [];
let bugReportsSearchWired = false;

function feedbackHaystack(r, refById) {
  const ref = refById.get(r.id) || '';
  const kind = r.kind === 'feature' ? 'feature' : 'bug';
  const parts = [
    r.title,
    r.steps,
    r.area,
    r.email,
    r.meta && typeof r.meta.submittedBy === 'string' ? r.meta.submittedBy : '',
    r.expected,
    r.actual,
    kind,
    kind === 'feature' ? 'feature request' : 'bug report',
    r.status,
    ref,
    formatChicagoDateTime(r.createdAt),
  ];
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function feedbackContactDisplay(r) {
  const email = String(r.email || '').trim();
  const by =
    r.meta && typeof r.meta.submittedBy === 'string' ? String(r.meta.submittedBy).trim() : '';
  if (!email && !by) return '';
  if (email && by) return `${email} (${by})`;
  return email || by;
}

function filterReportsByQuery(query) {
  const q = String(query || '').trim().toLowerCase();
  const refById = buildFeedbackRefById(allReportsCache);
  if (!q) return allReportsCache;
  return allReportsCache.filter((r) => feedbackHaystack(r, refById).includes(q));
}

function buildRowHtml(r, refById) {
  const kind = r.kind === 'feature' ? 'feature' : 'bug';
  const ref = refById.get(r.id) || '';
  const stepsLabel = kind === 'feature' ? 'Description' : 'Steps';
  const badgeClass =
    kind === 'feature' ? 'bug-report-type-badge bug-report-type-feature' : 'bug-report-type-badge bug-report-type-bug';
  const badgeText = kind === 'feature' ? 'Feature' : 'Bug';
  const st = String(r.status || 'open').toLowerCase();
  const isOpen = st === 'open';
  const rid = r.id ? String(r.id) : '';
  const statusBtn = rid
    ? isOpen
      ? `<button type="button" class="btn ghost small bug-report-close-btn" data-feedback-close="${escapeHTML(rid)}">Close</button>`
      : `<button type="button" class="btn ghost small bug-report-reopen-btn" data-feedback-reopen="${escapeHTML(rid)}">Reopen</button>`
    : '';
  const whenChicago = formatChicagoDateTime(r.createdAt);
  const metaWhen = whenChicago ? `${escapeHTML(whenChicago)} · ` : '';
  const refInner = ref
    ? `<span class="bug-report-ref" aria-label="Reference ${escapeHTML(ref)}">${escapeHTML(ref)}</span>`
    : '';
  const cardClosedClass = isOpen ? '' : ' bug-report-card-closed';
  const contactDisp = feedbackContactDisplay(r);
  return `
      <article class="bug-report-card panel${cardClosedClass}">
        <header class="bug-report-card-head">
          <div class="bug-report-title-block">
            <span class="${badgeClass}">${escapeHTML(badgeText)}${refInner}</span>
            <h2 class="bug-report-title">${escapeHTML(r.title || '(no title)')}</h2>
          </div>
          <div class="bug-report-head-right">
            <span class="bug-report-meta">${metaWhen}<span class="bug-report-status">${escapeHTML(st)}</span></span>
            ${statusBtn}
          </div>
        </header>
        ${r.area ? `<p class="bug-report-line"><strong>Area</strong> ${escapeHTML(r.area)}</p>` : ''}
        <div class="bug-report-block">
          <div class="bug-report-label">${escapeHTML(stepsLabel)}</div>
          <pre class="bug-report-pre">${escapeHTML(r.steps || '')}</pre>
        </div>
        ${kind === 'bug' && r.expected ? `<div class="bug-report-block"><div class="bug-report-label">Expected</div><pre class="bug-report-pre">${escapeHTML(r.expected)}</pre></div>` : ''}
        ${kind === 'bug' && r.actual ? `<div class="bug-report-block"><div class="bug-report-label">Actual</div><pre class="bug-report-pre">${escapeHTML(r.actual)}</pre></div>` : ''}
        ${contactDisp ? `<p class="bug-report-line"><strong>Contact</strong> ${escapeHTML(contactDisp)}</p>` : ''}
      </article>
    `;
}

function renderFeedbackList() {
  const list = $('#bugReportsList');
  if (!list) return;
  const refById = buildFeedbackRefById(allReportsCache);
  if (!allReportsCache.length) {
    list.innerHTML = '<p class="muted bug-reports-empty">No feedback yet.</p>';
    return;
  }
  const filtered = filterReportsByQuery($('#bugReportsSearch')?.value || '');
  if (!filtered.length) {
    list.innerHTML = '<p class="muted bug-reports-empty">No matching feedback.</p>';
    return;
  }
  list.innerHTML = filtered.map((r) => buildRowHtml(r, refById)).join('');
}

function wireBugReportsSearch() {
  if (bugReportsSearchWired) return;
  const inp = $('#bugReportsSearch');
  if (!inp) return;
  inp.addEventListener('input', () => renderFeedbackList());
  inp.addEventListener('search', () => renderFeedbackList());
  bugReportsSearchWired = true;
}

async function load() {
  const gate = $('#bugReportsGate');
  const list = $('#bugReportsList');
  const toolbar = $('#bugReportsToolbar');
  if (!gate || !list) return;
  if (toolbar) toolbar.hidden = true;

  const token = localStorage.getItem('msai_auth_token') || '';
  if (!token) {
    allReportsCache = [];
    list.hidden = true;
    gate.hidden = false;
    gate.innerHTML =
      'You need to be logged in. <a href="/">Go to the home page</a> and sign in as an admin.';
    return;
  }

  const meRes = await fetch('/api/auth/me', { headers: authHeaders() });
  const me = await meRes.json().catch(() => ({}));
  if (!meRes.ok || !me.user) {
    allReportsCache = [];
    list.hidden = true;
    gate.hidden = false;
    gate.innerHTML =
      'Session invalid. <a href="/">Go to the home page</a> and sign in again.';
    return;
  }
  if (me.user.role !== 'admin') {
    allReportsCache = [];
    list.hidden = true;
    gate.hidden = false;
    gate.innerHTML =
      'Admin access required. <a href="/">Back to home</a>';
    return;
  }

  const repRes = await fetch('/api/admin/bug-reports', { headers: authHeaders() });
  const data = await repRes.json().catch(() => ({}));
  if (!repRes.ok) {
    allReportsCache = [];
    list.hidden = true;
    gate.hidden = false;
    gate.textContent = data.error || `Could not load reports (${repRes.status}).`;
    return;
  }

  const reports = Array.isArray(data.bugReports) ? data.bugReports : [];
  allReportsCache = reports;
  gate.hidden = true;
  list.hidden = false;
  if (toolbar) toolbar.hidden = false;
  wireBugReportsSearch();
  renderFeedbackList();
}

const bugReportsListEl = $('#bugReportsList');
if (bugReportsListEl) {
  bugReportsListEl.addEventListener('click', async (e) => {
    const raw = e.target;
    const el = raw?.nodeType === Node.ELEMENT_NODE ? raw : raw?.parentElement;
    const closeBtn = el?.closest?.('[data-feedback-close]');
    const reopenBtn = el?.closest?.('[data-feedback-reopen]');
    const id = closeBtn?.getAttribute('data-feedback-close') || reopenBtn?.getAttribute('data-feedback-reopen');
    if (!id) return;
    e.preventDefault();
    const status = closeBtn ? 'closed' : 'open';
    const res = await fetch(`/api/admin/bug-reports/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(data.error || `Could not update status (${res.status})`);
      return;
    }
    await load();
  });
}

load();
