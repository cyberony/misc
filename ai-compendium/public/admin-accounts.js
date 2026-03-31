const $ = (sel) => document.querySelector(sel);

if (new URLSearchParams(window.location.search).get('embed') === '1') {
  document.body.classList.add('embed-shell');
}

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

async function apiFetch(url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  const token = localStorage.getItem('msai_auth_token') || '';
  if (token) headers.authorization = `Bearer ${token}`;
  return fetch(url, { ...opts, headers });
}

let users = [];
let currentUser = null;

async function fetchUsers() {
  const res = await apiFetch('/api/admin/users');
  if (!res.ok) {
    users = [];
    return false;
  }
  const data = await res.json().catch(() => ({}));
  users = Array.isArray(data.users) ? data.users : [];
  return true;
}

function renderList() {
  const list = $('#adminUserList');
  const searchInput = $('#adminUserSearch');
  if (!list || !searchInput) return;

  const q = String(searchInput.value || '').trim().toLowerCase();
  const sorted = [...users].sort((a, b) =>
    String(a.email || '').localeCompare(String(b.email || ''), undefined, { sensitivity: 'base' }),
  );
  const filtered = sorted.filter((u) => {
    if (currentUser && u.id === currentUser.id) return false;
    const hay = `${String(u.email || '')} ${String(u.name || '')}`.toLowerCase();
    return !q || hay.includes(q);
  });

  if (!filtered.length) {
    list.innerHTML = '<p class="muted bug-reports-empty">No matching accounts</p>';
    return;
  }

  list.innerHTML = filtered
    .map(
      (u) => `
      <div class="admin-user-row panel">
        <div class="admin-user-meta">
          <p class="admin-user-email" title="${escapeAttr(u.email || '')}">${escapeHTML(u.email || '')}</p>
          <p class="admin-user-name">${escapeHTML(u.name || '(no name)')}</p>
        </div>
        <label class="admin-role-select-wrap">
          <span class="admin-role-label">Role</span>
          <select data-admin-user-role="${escapeAttr(u.id)}">
            <option value="user"${u.role === 'user' ? ' selected' : ''}>User</option>
            <option value="superuser"${u.role === 'superuser' ? ' selected' : ''}>Superuser</option>
            <option value="admin"${u.role === 'admin' ? ' selected' : ''}>Admin</option>
          </select>
        </label>
      </div>
    `,
    )
    .join('');

  list.querySelectorAll('[data-admin-user-role]').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const target = e.currentTarget;
      const userId = target.getAttribute('data-admin-user-role');
      const role = target.value;
      if (!userId || !['user', 'superuser', 'admin'].includes(role)) return;
      const prev = users.find((u) => u.id === userId)?.role || 'user';
      target.disabled = true;
      const res = await apiFetch(`/api/admin/users/${encodeURIComponent(userId)}/role`, {
        method: 'PATCH',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ role }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        target.value = prev;
        alert(data.error || `Role update failed (HTTP ${res.status})`);
      } else {
        const entry = users.find((u) => u.id === userId);
        if (entry) entry.role = role;
      }
      target.disabled = false;
      renderList();
    });
  });
}

async function init() {
  const gate = $('#adminAccountsGate');
  const section = $('#adminAccountsSection');
  const toolbar = $('#adminAccountsToolbar');
  if (!gate || !section) return;

  const token = localStorage.getItem('msai_auth_token') || '';
  if (!token) {
    gate.innerHTML = 'Sign in from the <a href="/">home page</a> first.';
    return;
  }

  const res = await apiFetch('/api/auth/me');
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.user) {
    gate.innerHTML = 'Session expired. <a href="/">Home</a>';
    return;
  }

  currentUser = data.user;
  const role = String(data.user.role || '')
    .trim()
    .toLowerCase();
  if (role !== 'admin') {
    gate.textContent = 'Account roles are only available to administrators.';
    return;
  }

  const ok = await fetchUsers();
  if (!ok) {
    gate.textContent = 'Could not load accounts.';
    return;
  }

  gate.hidden = true;
  if (toolbar) toolbar.hidden = false;
  section.hidden = false;
  renderList();

  const searchInput = $('#adminUserSearch');
  if (searchInput) searchInput.addEventListener('input', () => renderList());
}

init().catch((e) => {
  const gate = $('#adminAccountsGate');
  if (gate) gate.textContent = String(e.message || e);
});
