const $ = (sel) => document.querySelector(sel);

function authHeadersJson() {
  const t = localStorage.getItem('msai_auth_token') || '';
  const h = { 'content-type': 'application/json' };
  if (t) h.authorization = `Bearer ${t}`;
  return h;
}

function stopMagicWordVideo() {
  const ifr = document.querySelector('.magic-word-video');
  if (!ifr) return;
  ifr.removeAttribute('src');
  ifr.src = 'about:blank';
}

window.addEventListener('pageshow', (e) => {
  if (e.persisted) void init();
});

async function fetchStatus() {
  const res = await fetch('/api/magic-page/status', { credentials: 'include' });
  const data = await res.json().catch(() => ({}));
  return {
    ok: res.ok,
    unlocked: Boolean(data.unlocked),
    configured: Boolean(data.configured),
  };
}

function showGate(configured) {
  const gate = $('#magicWordGate');
  const errEl = $('#magicWordGateError');
  const form = $('#magicWordForm');
  const submit = $('#magicWordSubmit');
  const pwd = $('#magicWordPassword');
  gate.hidden = false;
  errEl.textContent = '';
  if (form) form.hidden = false;
  if (pwd) pwd.disabled = false;
  if (submit) submit.disabled = !configured;
  if (!configured) {
    errEl.textContent =
      'Set MAGIC_PAGE_PASSWORD in ai-compendium/.env (non-empty), save, restart the server, then use Unlock.';
  }
}

/** Full-page grading app — same document as standalone (see ai_perspectives index.html). */
function goToReviewApp() {
  stopMagicWordVideo();
  window.location.replace('/review/');
}

async function init() {
  try {
    const { configured, unlocked } = await fetchStatus();
    if (unlocked) {
      goToReviewApp();
      return;
    }
    showGate(configured);
  } catch {
    showGate(true);
    const errEl = $('#magicWordGateError');
    if (errEl) errEl.textContent = 'Could not reach the server.';
  }
}

$('#magicWordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#magicWordGateError');
  const pwd = $('#magicWordPassword');
  errEl.textContent = '';
  const password = String(pwd?.value || '').trim();
  const res = await fetch('/api/magic-page/unlock', {
    method: 'POST',
    credentials: 'include',
    headers: authHeadersJson(),
    body: JSON.stringify({ password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    errEl.textContent = data.error || `Could not unlock (${res.status}).`;
    return;
  }
  goToReviewApp();
});

init();
