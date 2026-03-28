const $ = (sel) => document.querySelector(sel);

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
  const content = $('#magicWordContent');
  const errEl = $('#magicWordGateError');
  const form = $('#magicWordForm');
  const submit = $('#magicWordSubmit');
  const pwd = $('#magicWordPassword');
  gate.hidden = false;
  content.hidden = true;
  errEl.hidden = true;
  errEl.textContent = '';
  if (form) form.hidden = false;
  if (submit) submit.disabled = false;
  if (pwd) pwd.disabled = false;
  if (!configured) {
    errEl.hidden = false;
    errEl.textContent =
      'This destination is not enabled yet. Set MAGIC_PAGE_PASSWORD on the server (see .env.example).';
    if (form) form.hidden = true;
    if (submit) submit.disabled = true;
    if (pwd) pwd.disabled = true;
  }
}

function showContent() {
  $('#magicWordGate').hidden = true;
  $('#magicWordContent').hidden = false;
  const errEl = $('#magicWordGateError');
  errEl.hidden = true;
  errEl.textContent = '';
}

async function init() {
  try {
    const { unlocked, configured } = await fetchStatus();
    if (unlocked) {
      showContent();
      return;
    }
    showGate(configured);
  } catch {
    showGate(true);
    const errEl = $('#magicWordGateError');
    if (errEl) {
      errEl.hidden = false;
      errEl.textContent = 'Could not reach the server.';
    }
  }
}

$('#magicWordForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = $('#magicWordGateError');
  const pwd = $('#magicWordPassword');
  errEl.hidden = true;
  errEl.textContent = '';
  const password = pwd?.value || '';
  const res = await fetch('/api/magic-page/unlock', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    errEl.hidden = false;
    errEl.textContent = data.error || `Could not unlock (${res.status}).`;
    return;
  }
  showContent();
});

init();
