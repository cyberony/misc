const $ = (sel) => document.querySelector(sel);

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

async function load() {
  const gate = $('#bugReportsGate');
  const list = $('#bugReportsList');
  if (!gate || !list) return;

  const token = localStorage.getItem('msai_auth_token') || '';
  if (!token) {
    gate.innerHTML =
      'You need to be logged in. <a href="/">Go to the home page</a> and sign in as an admin.';
    return;
  }

  const meRes = await fetch('/api/auth/me', { headers: authHeaders() });
  const me = await meRes.json().catch(() => ({}));
  if (!meRes.ok || !me.user) {
    gate.innerHTML =
      'Session invalid. <a href="/">Go to the home page</a> and sign in again.';
    return;
  }
  if (me.user.role !== 'admin') {
    gate.innerHTML =
      'Admin access required. <a href="/">Back to home</a>';
    return;
  }

  const repRes = await fetch('/api/admin/bug-reports', { headers: authHeaders() });
  const data = await repRes.json().catch(() => ({}));
  if (!repRes.ok) {
    gate.textContent = data.error || `Could not load reports (${repRes.status}).`;
    return;
  }

  const reports = Array.isArray(data.bugReports) ? data.bugReports : [];
  gate.hidden = true;
  list.hidden = false;

  if (!reports.length) {
    list.innerHTML = '<p class="muted bug-reports-empty">No bug reports yet.</p>';
    return;
  }

  list.innerHTML = reports
    .map(
      (r) => `
      <article class="bug-report-card panel">
        <header class="bug-report-card-head">
          <h2 class="bug-report-title">${escapeHTML(r.title || '(no title)')}</h2>
          <span class="bug-report-meta">${escapeHTML(r.createdAt || '')} · <span class="bug-report-status">${escapeHTML(r.status || 'open')}</span></span>
        </header>
        ${r.area ? `<p class="bug-report-line"><strong>Area</strong> ${escapeHTML(r.area)}</p>` : ''}
        <div class="bug-report-block">
          <div class="bug-report-label">Steps</div>
          <pre class="bug-report-pre">${escapeHTML(r.steps || '')}</pre>
        </div>
        ${r.expected ? `<div class="bug-report-block"><div class="bug-report-label">Expected</div><pre class="bug-report-pre">${escapeHTML(r.expected)}</pre></div>` : ''}
        ${r.actual ? `<div class="bug-report-block"><div class="bug-report-label">Actual</div><pre class="bug-report-pre">${escapeHTML(r.actual)}</pre></div>` : ''}
        ${r.email ? `<p class="bug-report-line"><strong>Contact</strong> ${escapeHTML(r.email)}</p>` : ''}
        ${r.meta?.userAgent ? `<p class="bug-report-ua muted">${escapeHTML(r.meta.userAgent)}</p>` : ''}
        <p class="bug-report-id muted">ID ${escapeHTML(r.id || '')}</p>
      </article>
    `,
    )
    .join('');
}

load();
