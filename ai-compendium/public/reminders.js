const $ = (sel) => document.querySelector(sel);

if (new URLSearchParams(window.location.search).get('embed') === '1') {
  document.body.classList.add('embed-shell');
}

const CHICAGO_TZ = 'America/Chicago';

function escapeHTML(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function escapeAttr(str) {
  return escapeHTML(str).replaceAll('\n', '&#10;');
}

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

function authHeaders() {
  const token = localStorage.getItem('msai_auth_token') || '';
  const h = {};
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

let allRemindersCache = [];
let remindersSearchWired = false;
/** When set, saving the modal PATCHes this id instead of POSTing a new reminder. */
let reminderModalEditingId = null;
let showingArchived = new URLSearchParams(window.location.search).get('archived') === '1';
let reminderSubmitInFlight = false;

function reminderHaystack(r) {
  const due = formatChicagoDateTime(r.dueAt);
  const parts = [r.rawText, due, r.sentAt ? 'sent' : 'pending', r.archivedAt ? 'archived' : 'active'];
  return parts
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

function filterRemindersByQuery(query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return allRemindersCache;
  return allRemindersCache.filter((r) => reminderHaystack(r).includes(q));
}

function buildReminderCardHtml(r) {
  const headLine = formatChicagoDateTime(r.dueAt) || 'Reminder';
  const isArchived = !!(r.archivedAt || r.sentAt);
  const sent = isArchived ? ' · Archived' : '';
  const recurrenceLine = r.recurrenceDisplay || '';
  const rid = r.id ? String(r.id) : '';
  const editBtn = isArchived
    ? ''
    : `<button type="button" class="btn ghost small reminder-card-edit" data-reminder-id="${escapeAttr(rid)}">Edit</button>`;
  return `
      <article class="reminder-card panel">
        <header class="reminder-card-head">
          <h2 class="reminder-card-title">${escapeHTML(headLine)}${escapeHTML(sent)}</h2>
          <div class="reminder-card-actions">
            ${editBtn}
            <button type="button" class="btn ghost small reminder-card-remove" data-reminder-id="${escapeAttr(rid)}">Remove</button>
          </div>
        </header>
        <div class="reminder-card-block">
          <div class="reminder-card-label">Original request</div>
          <pre class="reminder-card-pre">${escapeHTML(r.rawText || '')}</pre>
        </div>
        ${
          recurrenceLine
            ? `<div class="reminder-card-block"><div class="reminder-card-label">Recurrence</div><div class="reminder-card-meta">${escapeHTML(
                recurrenceLine,
              )}</div></div>`
            : ''
        }
      </article>
    `;
}

function renderRemindersList() {
  const list = $('#remindersList');
  if (!list) return;
  if (!allRemindersCache.length) {
    list.innerHTML = showingArchived
      ? '<p class="muted bug-reports-empty">No archived reminders yet.</p>'
      : '<p class="muted bug-reports-empty">No reminders yet.</p>';
    return;
  }
  const filtered = filterRemindersByQuery($('#remindersSearch')?.value || '');
  if (!filtered.length) {
    list.innerHTML = '<p class="muted bug-reports-empty">No matching reminders.</p>';
    return;
  }
  list.innerHTML = filtered.map(buildReminderCardHtml).join('');
}

function syncArchiveToggleUi() {
  const btn = $('#remindersArchiveToggle');
  if (!btn) return;
  btn.setAttribute('aria-pressed', showingArchived ? 'true' : 'false');
  btn.classList.toggle('is-active', showingArchived);
  btn.setAttribute(
    'aria-label',
    showingArchived ? 'Show active reminders' : 'Show archived reminders',
  );
  btn.setAttribute(
    'title',
    showingArchived ? 'Show active reminders' : 'Show archived reminders',
  );
}

function wireRemindersSearch() {
  if (remindersSearchWired) return;
  const inp = $('#remindersSearch');
  if (!inp) return;
  inp.addEventListener('input', () => renderRemindersList());
  inp.addEventListener('search', () => renderRemindersList());
  remindersSearchWired = true;
}

async function deleteReminder(id) {
  if (!id) return;
  const res = await fetch(`/api/reminders/${encodeURIComponent(id)}`, {
    method: 'DELETE',
    headers: authHeaders(),
    cache: 'no-store',
  });
  if (!res.ok) return;
  await load();
}

function openReminderAddModal() {
  reminderModalEditingId = null;
  const title = $('#reminderModalTitle');
  if (title) title.textContent = 'New reminder';
  const submitBtn = $('#reminderNlBtn');
  if (submitBtn) submitBtn.textContent = 'Add reminder';
  const m = $('#reminderAddModal');
  if (!m) return;
  m.hidden = false;
  m.style.display = 'flex';
  m.setAttribute('aria-hidden', 'false');
  const ta = $('#reminderNlInput');
  if (ta) {
    ta.value = '';
    queueMicrotask(() => ta.focus());
  }
  scheduleReminderPreview();
}

function openReminderEditModal(id) {
  const sid = String(id);
  const r = allRemindersCache.find((x) => String(x.id) === sid);
  if (!r) return;
  if (r.archivedAt || r.sentAt) return;
  reminderModalEditingId = sid;
  const title = $('#reminderModalTitle');
  if (title) title.textContent = 'Edit reminder';
  const submitBtn = $('#reminderNlBtn');
  if (submitBtn) submitBtn.textContent = 'Save changes';
  const m = $('#reminderAddModal');
  if (!m) return;
  m.hidden = false;
  m.style.display = 'flex';
  m.setAttribute('aria-hidden', 'false');
  const ta = $('#reminderNlInput');
  if (ta) {
    ta.value = r.rawText || '';
    queueMicrotask(() => {
      ta.focus();
      ta.setSelectionRange(ta.value.length, ta.value.length);
    });
  }
  const err = $('#reminderNlError');
  if (err) {
    err.hidden = true;
    err.textContent = '';
  }
  scheduleReminderPreview();
}

function closeReminderAddModal() {
  const m = $('#reminderAddModal');
  if (!m) return;
  m.hidden = true;
  m.style.display = 'none';
  m.setAttribute('aria-hidden', 'true');
  reminderModalEditingId = null;
  const title = $('#reminderModalTitle');
  if (title) title.textContent = 'New reminder';
  const submitBtn = $('#reminderNlBtn');
  if (submitBtn) submitBtn.textContent = 'Add reminder';
  const err = $('#reminderNlError');
  if (err) {
    err.hidden = true;
    err.textContent = '';
  }
  const prev = $('#reminderNlPreview');
  if (prev) {
    prev.hidden = true;
    prev.textContent = '';
  }
}

let reminderPreviewTimer = null;

function scheduleReminderPreview() {
  clearTimeout(reminderPreviewTimer);
  reminderPreviewTimer = setTimeout(() => {
    runReminderPreview();
  }, 350);
}

async function runReminderPreview() {
  const ta = $('#reminderNlInput');
  const out = $('#reminderNlPreview');
  if (!ta || !out) return;
  const text = String(ta.value || '').trim();
  if (!text) {
    out.hidden = true;
    out.textContent = '';
    return;
  }
  const token = localStorage.getItem('msai_auth_token') || '';
  if (!token) {
    out.hidden = true;
    return;
  }
  const res = await fetch('/api/reminders/preview', {
    method: 'POST',
    headers: { ...authHeaders(), 'content-type': 'application/json' },
    body: JSON.stringify({ text }),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    out.hidden = false;
    out.textContent = data.error || `Could not parse (${res.status})`;
    return;
  }
  out.hidden = false;
  const src =
    data.source === 'openai' ? ' · AI' : data.source === 'chrono' ? ' · rules' : '';
  const rec = String(data.recurrenceDisplay || '').trim();
  out.textContent = rec
    ? `Will send at: ${data.dueDisplayChicago}${src} · ${rec}`
    : `Will send at: ${data.dueDisplayChicago}${src}`;
}

async function submitReminderNl() {
  if (reminderSubmitInFlight) return;
  const ta = $('#reminderNlInput');
  const submitBtn = $('#reminderNlBtn');
  const err = $('#reminderNlError');
  const text = String(ta?.value || '').trim();
  if (err) {
    err.hidden = true;
    err.textContent = '';
  }
  if (!text) {
    if (err) {
      err.hidden = false;
      err.textContent = 'Enter a reminder with a date.';
    }
    return;
  }
  reminderSubmitInFlight = true;
  if (submitBtn) submitBtn.disabled = true;
  const editingId = reminderModalEditingId;
  const url = editingId
    ? `/api/reminders/${encodeURIComponent(editingId)}/update`
    : '/api/reminders';
  const method = 'POST';
  try {
    const res = await fetch(url, {
      method,
      headers: { ...authHeaders(), 'content-type': 'application/json' },
      body: JSON.stringify({ text }),
      cache: 'no-store',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (err) {
        err.hidden = false;
        err.textContent = data.error || `Failed (${res.status})`;
      }
      return;
    }
    if (data.reminder) {
      const rid = String(data.reminder.id);
      const idx = allRemindersCache.findIndex((x) => String(x.id) === rid);
      if (idx >= 0) allRemindersCache[idx] = data.reminder;
      else allRemindersCache.push(data.reminder);
      allRemindersCache.sort((a, b) => String(a.dueAt).localeCompare(String(b.dueAt)));
      renderRemindersList();
    }
    if (ta) ta.value = '';
    closeReminderAddModal();
    await load();
  } finally {
    reminderSubmitInFlight = false;
    if (submitBtn) submitBtn.disabled = false;
  }
}

function gateDeniedBox(innerHtml) {
  return `<div class="panel reminders-access-box">${innerHtml}</div>`;
}

async function load() {
  const gate = $('#remindersGate');
  const layout = $('#remindersLayout');
  const list = $('#remindersList');
  if (!gate || !layout || !list) return;

  const token = localStorage.getItem('msai_auth_token') || '';
  if (!token) {
    allRemindersCache = [];
    layout.hidden = true;
    gate.hidden = false;
    gate.innerHTML = gateDeniedBox(
      '<p class="muted" style="margin:0">Sign in to use this page.</p><p style="margin:10px 0 0"><a href="/">Home</a></p>',
    );
    return;
  }

  const meRes = await fetch('/api/auth/me', { headers: authHeaders() });
  const me = await meRes.json().catch(() => ({}));
  if (!meRes.ok || !me.user) {
    allRemindersCache = [];
    layout.hidden = true;
    gate.hidden = false;
    gate.innerHTML = gateDeniedBox(
      '<p class="muted" style="margin:0">Session expired.</p><p style="margin:10px 0 0"><a href="/">Home</a></p>',
    );
    return;
  }
  const role = String(me.user.role || '')
    .trim()
    .toLowerCase();
  if (role !== 'admin' && role !== 'superuser') {
    allRemindersCache = [];
    layout.hidden = true;
    gate.hidden = false;
    gate.innerHTML = gateDeniedBox('<p class="muted" style="margin:0">You don’t have access.</p>');
    return;
  }

  const route = showingArchived ? '/api/reminders?archived=1' : '/api/reminders';
  const res = await fetch(route, {
    headers: authHeaders(),
    cache: 'no-store',
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    allRemindersCache = [];
    layout.hidden = true;
    gate.hidden = false;
    gate.innerHTML = gateDeniedBox(
      `<p class="muted" style="margin:0">${escapeHTML(data.error || `Could not load (${res.status}).`)}</p>`,
    );
    return;
  }

  allRemindersCache = Array.isArray(data.reminders) ? data.reminders : [];
  allRemindersCache = allRemindersCache.map((r) => {
    if (r && typeof r === 'object' && r.recurrence && !r.recurrenceDisplay) {
      const freq = String(r.recurrence.frequency || '').trim();
      const interval = Number(r.recurrence.interval || 1);
      if (freq === 'daily' || freq === 'weekly' || freq === 'monthly') {
        const noun = freq === 'daily' ? 'day' : freq === 'weekly' ? 'week' : 'month';
        r.recurrenceDisplay = interval === 1 ? `Every ${noun}` : `Every ${interval} ${noun}s`;
      }
    }
    return r;
  });
  gate.hidden = true;
  layout.hidden = false;
  wireRemindersSearch();
  syncArchiveToggleUi();
  renderRemindersList();
}

const remindersListEl = $('#remindersList');
if (remindersListEl) {
  remindersListEl.addEventListener('click', (e) => {
    const btn = e.target.closest?.('[data-reminder-id]');
    if (!btn) return;
    const id = btn.getAttribute('data-reminder-id');
    if (!id) return;
    if (btn.classList.contains('reminder-card-remove')) {
      deleteReminder(id);
      return;
    }
    if (btn.classList.contains('reminder-card-edit')) {
      openReminderEditModal(id);
    }
  });
}

const reminderNlBtn = $('#reminderNlBtn');
if (reminderNlBtn) reminderNlBtn.addEventListener('click', () => submitReminderNl());

const reminderNlInput = $('#reminderNlInput');
if (reminderNlInput) reminderNlInput.addEventListener('input', () => scheduleReminderPreview());

const reminderAddBtn = $('#reminderAddBtn');
if (reminderAddBtn) reminderAddBtn.addEventListener('click', () => openReminderAddModal());

const remindersArchiveToggle = $('#remindersArchiveToggle');
if (remindersArchiveToggle) {
  remindersArchiveToggle.addEventListener('click', async () => {
    showingArchived = !showingArchived;
    const url = new URL(window.location.href);
    if (showingArchived) url.searchParams.set('archived', '1');
    else url.searchParams.delete('archived');
    history.replaceState(null, '', url);
    await load();
  });
}

const reminderAddModal = $('#reminderAddModal');
const reminderAddModalClose = $('#reminderAddModalClose');
if (reminderAddModal) {
  reminderAddModal.addEventListener('click', (e) => {
    if (e.target === reminderAddModal) closeReminderAddModal();
  });
}
if (reminderAddModalClose) {
  reminderAddModalClose.addEventListener('click', () => closeReminderAddModal());
}

document.addEventListener('keydown', (e) => {
  const m = $('#reminderAddModal');
  if (!m || m.hidden) return;
  if (e.key === 'Escape') {
    closeReminderAddModal();
    return;
  }
  /* Single primary button (Add reminder): Enter submits; Shift+Enter keeps a newline in the textarea. */
  if (e.key === 'Enter' && !e.shiftKey && e.target && e.target.id === 'reminderNlInput') {
    e.preventDefault();
    void submitReminderNl();
  }
});

load();
