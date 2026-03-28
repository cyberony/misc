const $ = (sel) => document.querySelector(sel);

function stopMagicWordVideo() {
  const ifr = document.querySelector('.magic-word-video');
  if (!ifr) return;
  ifr.removeAttribute('src');
  ifr.src = 'about:blank';
}

function magicPageLogoutOnLeave() {
  stopMagicWordVideo();
  fetch('/api/magic-page/logout', {
    method: 'POST',
    credentials: 'include',
    keepalive: true,
  });
}

window.addEventListener('pagehide', magicPageLogoutOnLeave);

window.addEventListener('pageshow', (e) => {
  if (e.persisted) void init();
});

async function magicPageClearSession() {
  await fetch('/api/magic-page/logout', {
    method: 'POST',
    credentials: 'include',
  }).catch(() => {});
}

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
  errEl.textContent = '';
  if (form) form.hidden = false;
  if (pwd) pwd.disabled = false;
  if (submit) submit.disabled = !configured;
  if (!configured) {
    errEl.textContent =
      'Set MAGIC_PAGE_PASSWORD in ai-compendium/.env (non-empty), save, restart the server, then use Unlock.';
  }
}

function showContent() {
  stopMagicWordVideo();
  $('#magicWordGate').hidden = true;
  $('#magicWordContent').hidden = false;
  $('#magicWordGateError').textContent = '';
}

async function init() {
  await magicPageClearSession();
  try {
    const { configured } = await fetchStatus();
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
  const password = pwd?.value || '';
  const res = await fetch('/api/magic-page/unlock', {
    method: 'POST',
    credentials: 'include',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    errEl.textContent = data.error || `Could not unlock (${res.status}).`;
    return;
  }
  showContent();
});

init();
