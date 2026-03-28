const $ = (sel) => document.querySelector(sel);

const state = {
  allResources: [],
  /** @type {Set<string>} lowercase tag strings; AND filter */
  selectedTags: new Set(),
  q: '',
  sort: 'votes_desc',
  currentUser: null,
  authToken: localStorage.getItem('msai_auth_token') || '',
  userVotes: {},
  authMode: 'login',
  recoverLinkSent: false,
  pendingAction: null,
  adminViewMode: localStorage.getItem('msai_admin_view_mode') || 'admin',
  adminUsers: [],
  /** Lowercase tags for the add-resource form (chips + hidden field). */
  addFormTags: [],
  /** Suggested tags from API (shown separately; click to add). */
  addFormSuggestedTags: [],
};

let addSuggestTimer = null;
let addSuggestSeq = 0;

const detailModal = $('#detailModal');
const addModal = $('#addModal');
const authModal = $('#authModal');
const signupSplashModal = $('#signupSplashModal');
const bugModal = $('#bugModal');
const profileModal = $('#profileModal');
const existingCardModal = $('#existingCardModal');
const PASSWORD_SPECIAL = '!@#$%^&*()_+-=[]{}|;\':",.<>?/~`';
const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_+\-=[\]{}|;':",.<>?/~`]/;

let activeDetailId = null;

/** Outline thumbs (monochrome via stroke="currentColor") */
const VOTE_ICON_UP =
  '<svg class="vote-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
const VOTE_ICON_DOWN =
  '<svg class="vote-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>';
const TRASH_ICON =
  '<svg class="vote-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M8 6V4h8v2"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';

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

function toggleSelectedTag(tag) {
  const t = String(tag ?? '')
    .trim()
    .toLowerCase();
  if (!t) return;
  if (state.selectedTags.has(t)) state.selectedTags.delete(t);
  else state.selectedTags.add(t);
}

/** Steel-blue title strip — lighter wash, still reads as steel (light text). */
const STEEL_BLUE_TITLE_BAND = {
  tb1: 'hsl(212 38% 56%)',
  tb2: 'hsl(210 42% 52%)',
  tb3: 'hsl(216 36% 54%)',
  border: 'hsl(218 40% 40%)',
  text: 'hsl(210 55% 98%)',
};

function titleBandStyleAttr(_resourceId) {
  const p = STEEL_BLUE_TITLE_BAND;
  const parts = [
    `--tb1:${p.tb1}`,
    `--tb2:${p.tb2}`,
    `--tb3:${p.tb3}`,
    `--tb-border:${p.border}`,
    `--tb-text:${p.text}`,
  ];
  return `style="${parts.join(';')}"`;
}

/** Brighter candy pastels: stronger saturation so each hue reads clearly; same fn everywhere = same tag → same colors. */
function pastelTagColors(hue) {
  return {
    bg: `hsla(${hue}, 92%, 89%, 1)`,
    border: `hsla(${hue}, 78%, 66%, 0.98)`,
    fg: `hsla(${hue}, 44%, 19%, 0.96)`,
  };
}

/**
 * Map tag text → theme (video, audio, speech, text, image, code, …).
 * First matching rule wins; order is tuned for overlaps (e.g. speech before audio).
 */
const TAG_THEME_RULES = [
  {
    id: 'image',
    hue: 330,
    test: t =>
      /^(image|img|vision|photo|png|jpeg|jpg|gif|diffusion|midjourney|screenshot|thumbnail)$/i.test(t) ||
      /\b(image|vision|photo|diffusion|png|jpeg|jpg|gif|screenshot|thumbnail|stable-diffusion|inpaint|segmentation)\b/i.test(t),
  },
  {
    id: 'video',
    hue: 220,
    test: t =>
      /^(video|ffmpeg|transcoding|subtitle|subtitles)$/i.test(t) ||
      /\b(video|ffmpeg|codec|h\.?26[45]|hevc|av1|nvenc|remux|mux|subtitle|transcod|encoding|mp4|mkv|webm|davinci|premiere|after\s*effects|timeline)\b/i.test(t),
  },
  {
    id: 'speech',
    hue: 275,
    test: t =>
      /^(stt|tts|whisper|transcription|speech-to-text|text-to-speech|asr)$/i.test(t) ||
      /\b(stt|tts|whisper|transcription|speech-to-text|text-to-speech|voiceover|narrat|dubbing|asr|speaker|diariz)\b/i.test(t) ||
      /^voice$/i.test(t),
  },
  {
    id: 'text',
    hue: 145,
    test: t =>
      /^(nlp|llm|gpt|rag|markdown|prompt)$/i.test(t) ||
      /\b(nlp|llm|gpt|token|embedding|rag|document|writing|copy|summar|translat|language model|chatgpt|bert|classif|ner|parse|ocr-text)\b/i.test(t),
  },
  {
    id: 'audio',
    hue: 40,
    test: t =>
      /^(audio|music|waveform|slicing|mix|mastering|flac|mp3|aac|opus|pydub|podcast)$/i.test(t) ||
      /\b(audio|music|waveform|slicing|mixing|mastering|flac|mp3|aac|opus|loudness|sample-rate|sound design|podcast|reverb|eq\b)\b/i.test(t),
  },
  {
    id: 'code',
    hue: 205,
    test: t =>
      /^(python|javascript|typescript|java|rust|go|api|cli|tooling|library|sdk)$/i.test(t) ||
      /\b(python|javascript|typescript|java|rust|golang|api|cli|tooling|library|devops|github|npm|pip|sdk|framework|kubernetes|docker)\b/i.test(t),
  },
  {
    id: 'presentation',
    hue: 295,
    test: t =>
      /^(presentations|presentation|slides|slide|deck|keynote)$/i.test(t) ||
      /\b(presentations?|slides?|deck|keynote|powerpoint|ppt)\b/i.test(t),
  },
];

const DEFAULT_TAG_HUE = 225; // clear blue for uncategorized tags

function getTagThemeHue(label) {
  const t = String(label ?? '')
    .trim()
    .toLowerCase();
  if (!t) return DEFAULT_TAG_HUE;
  for (const rule of TAG_THEME_RULES) {
    if (rule.test(t)) return rule.hue;
  }
  return DEFAULT_TAG_HUE;
}

function tagPillStyleVars(label) {
  const hue = getTagThemeHue(label);
  const { bg, border, fg } = pastelTagColors(hue);
  return `--tag-bg:${bg};--tag-border:${border};--tag-fg:${fg}`;
}

/** For use inside HTML template literals */
function tagPillStyleAttr(label) {
  return `style="${tagPillStyleVars(label)}"`;
}

function formatVotes(v) {
  const n = Number(v || 0);
  return `${n} vote${n === 1 ? '' : 's'}`;
}

function normalizeTagToken(str) {
  let t = String(str || '').trim().toLowerCase();
  t = t.replace(/\s+/g, '-');
  t = t.replace(/[^a-z0-9-]/g, '');
  t = t.replace(/-+/g, '-').replace(/^-+|-+$/g, '');
  return t.slice(0, 48);
}

function syncAddTagsHidden() {
  const hidden = $('#addTagsHidden');
  if (hidden) hidden.value = state.addFormTags.join(', ');
}

/** If tag already exists, remove the old pill so the newly entered one wins (order at end). */
function addTagReplacingDuplicate(n) {
  if (!n) return false;
  state.addFormTags = state.addFormTags.filter((t) => t !== n);
  state.addFormTags.push(n);
  state.addFormSuggestedTags = state.addFormSuggestedTags.filter((t) => t !== n);
  return true;
}

function focusAddTagInputAtEnd() {
  const input = $('#addTagInput');
  if (!input) return;
  const v = input.value;
  input.focus();
  try {
    const n = v.length;
    input.setSelectionRange(n, n);
  } catch (_) {
    /* ignore */
  }
}

function renderAddSuggestedChips() {
  const host = $('#addTagSuggestedChips');
  if (!host) return;
  const list = state.addFormSuggestedTags.filter((t) => !state.addFormTags.includes(t));
  if (!list.length) {
    host.innerHTML = '';
    return;
  }
  host.innerHTML = list
    .map(
      (tag) => `
      <span class="tag-pill add-form-tag-chip add-form-suggested-chip" ${tagPillStyleAttr(tag)}>
        <button type="button" class="add-form-tag-text add-form-suggested-add" data-suggested-tag="${escapeAttr(tag)}">${escapeHTML(tag)}</button>
        <button type="button" class="add-form-tag-remove" data-dismiss-suggested="${escapeAttr(tag)}" aria-label="Dismiss suggestion ${escapeAttr(tag)}">×</button>
      </span>
    `,
    )
    .join('');
  host.querySelectorAll('.add-form-suggested-add[data-suggested-tag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const raw = btn.getAttribute('data-suggested-tag');
      const n = normalizeTagToken(raw);
      if (!n) return;
      addTagReplacingDuplicate(n);
      renderAddTagChips();
      renderAddSuggestedChips();
      syncAddTagsHidden();
    });
  });
  host.querySelectorAll('[data-dismiss-suggested]').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const raw = btn.getAttribute('data-dismiss-suggested');
      const n = normalizeTagToken(raw);
      if (!n) return;
      state.addFormSuggestedTags = state.addFormSuggestedTags.filter((t) => t !== n);
      renderAddSuggestedChips();
    });
  });
}

function renderAddTagChips() {
  const host = $('#addTagChips');
  if (!host) return;
  host.innerHTML = state.addFormTags
    .map(
      (tag, i) => `
      <span class="tag-pill add-form-tag-chip" ${tagPillStyleAttr(tag)}>
        <span class="add-form-tag-text">${escapeHTML(tag)}</span>
        <button type="button" class="add-form-tag-remove" data-remove-add-tag="${i}" aria-label="Remove ${escapeAttr(tag)}">×</button>
      </span>
    `,
    )
    .join('');
  host.querySelectorAll('[data-remove-add-tag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const i = Number(btn.getAttribute('data-remove-add-tag'));
      if (Number.isNaN(i)) return;
      state.addFormTags.splice(i, 1);
      renderAddTagChips();
      syncAddTagsHidden();
    });
  });
}

function resetAddFormTags() {
  state.addFormTags = [];
  state.addFormSuggestedTags = [];
  const hint = $('#addTagsUnavailable');
  if (hint) {
    hint.hidden = true;
    hint.textContent = '';
  }
  const input = $('#addTagInput');
  if (input) input.value = '';
  renderAddTagChips();
  renderAddSuggestedChips();
  syncAddTagsHidden();
}

/** Split completed comma segments into pills; leave the rest in the input. */
function flushAddTagInputCommas() {
  const input = $('#addTagInput');
  if (!input || !input.value.includes(',')) return;
  const parts = input.value.split(',');
  const tail = parts.pop() ?? '';
  let didAny = false;
  for (const part of parts) {
    const n = normalizeTagToken(part);
    if (!n) continue;
    if (addTagReplacingDuplicate(n)) didAny = true;
  }
  input.value = tail;
  if (didAny) {
    renderAddTagChips();
    renderAddSuggestedChips();
    syncAddTagsHidden();
  }
}

function flushAddTagInputRemainderAsPill() {
  const input = $('#addTagInput');
  if (!input) return;
  const n = normalizeTagToken(input.value);
  input.value = '';
  if (!n) return;
  addTagReplacingDuplicate(n);
  renderAddTagChips();
  renderAddSuggestedChips();
  syncAddTagsHidden();
}

function scheduleSuggestTagsForAddForm() {
  if (!addModal || addModal.hidden) return;
  clearTimeout(addSuggestTimer);
  addSuggestTimer = setTimeout(() => {
    fetchSuggestTagsForAddForm();
  }, 350);
}

async function fetchSuggestTagsForAddForm() {
  const seq = ++addSuggestSeq;
  const form = $('#addForm');
  if (!form) return;
  const url = String(form.querySelector('[name="url"]')?.value || '').trim();
  const urlLooksLikeLink =
    url.length >= 3 &&
    (/^https?:\/\//i.test(url) || /\./.test(url));
  if (!urlLooksLikeLink) {
    state.addFormSuggestedTags = [];
    renderAddSuggestedChips();
    return;
  }

  try {
    const res = await apiFetch('/api/resources/suggest-tags', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        url,
        currentTags: state.addFormTags,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (seq !== addSuggestSeq) return;

    const hint = $('#addTagsUnavailable');
    if (data.unavailableReason === 'no_api_key') {
      if (hint) {
        hint.hidden = false;
        hint.textContent =
          'Tag suggestions need OPENAI_API_KEY on the server. You can still add tags manually.';
      }
    } else if (data.unavailableReason === 'openai_failed') {
      if (hint) {
        hint.hidden = false;
        hint.textContent =
          'Tag suggestions are temporarily unavailable. You can still add tags manually.';
      }
    } else if (hint) {
      hint.hidden = true;
      hint.textContent = '';
    }

    const merged = [
      ...(Array.isArray(data.suggestedExisting) ? data.suggestedExisting : []),
      ...(Array.isArray(data.suggestedNew) ? data.suggestedNew : []),
    ];
    const seen = new Set();
    const next = [];
    for (const t of merged) {
      const n = normalizeTagToken(t);
      if (!n || seen.has(n)) continue;
      seen.add(n);
      if (state.addFormTags.includes(n)) continue;
      next.push(n);
    }
    state.addFormSuggestedTags = next;
    renderAddSuggestedChips();
  } catch (e) {
    console.error('fetchSuggestTagsForAddForm', e);
    state.addFormSuggestedTags = [];
    renderAddSuggestedChips();
  }
}

function normalizeUrlForDuplicateCheck(rawUrl) {
  const raw = String(rawUrl || '').trim();
  if (!raw) return '';
  const withScheme = /^[a-zA-Z][a-zA-Z\d+\-.]*:/.test(raw) ? raw : `https://${raw}`;
  let u;
  try {
    u = new URL(withScheme);
  } catch {
    return '';
  }
  if (!['http:', 'https:'].includes(u.protocol)) return '';
  u.hash = '';
  u.pathname = u.pathname.replace(/\/+$/, '') || '/';
  return u.toString().toLowerCase();
}

function urlIdentityKeysForDuplicateCheck(rawUrl) {
  const normalized = normalizeUrlForDuplicateCheck(rawUrl);
  if (!normalized) return [];
  const u = new URL(normalized);
  const host = String(u.hostname || '').toLowerCase().replace(/^www\./, '');
  const parts = host.split('.').filter(Boolean);
  const apex = parts.length >= 2 ? `${parts[parts.length - 2]}.${parts[parts.length - 1]}` : host;
  const segments = u.pathname.split('/').filter(Boolean).map((s) => s.toLowerCase());
  const keys = new Set();
  keys.add(`${host}${u.pathname}`);
  keys.add(host);
  keys.add(apex);
  if (segments.length) {
    keys.add(`${host}/${segments[0]}`);
    keys.add(`${apex}/${segments[0]}`);
  }
  if ((host === 'github.com' || host === 'gitlab.com') && segments.length >= 2) {
    keys.add(`${host}/${segments[0]}/${segments[1]}`);
  }
  if (host === 'npmjs.com' && segments[0] === 'package' && segments[1]) {
    keys.add(`${host}/package/${segments[1]}`);
  }
  if (host === 'pypi.org' && segments[0] === 'project' && segments[1]) {
    keys.add(`${host}/project/${segments[1]}`);
  }
  return [...keys];
}

function findDuplicateResourceByUrl(url) {
  const incoming = new Set(urlIdentityKeysForDuplicateCheck(url));
  if (!incoming.size) return null;
  for (const r of state.allResources || []) {
    if (!r || !r.url) continue;
    const existingKeys = urlIdentityKeysForDuplicateCheck(r.url);
    if (existingKeys.some((k) => incoming.has(k))) return r;
  }
  return null;
}

async function apiFetch(url, opts = {}) {
  const headers = { ...(opts.headers || {}) };
  if (state.authToken) headers.authorization = `Bearer ${state.authToken}`;
  return fetch(url, { ...opts, headers });
}

function setAuthToken(token) {
  state.authToken = token || '';
  if (state.authToken) localStorage.setItem('msai_auth_token', state.authToken);
  else localStorage.removeItem('msai_auth_token');
}

function syncBugFormEmailField() {
  const wrap = $('#bugFormEmailWrap');
  if (wrap) wrap.hidden = Boolean(state.currentUser);
}

function updateAuthUI() {
  const logoutLink = $('#logoutLink');
  const authLinkText = $('#authLinkText');
  const adminModeWrap = $('#adminViewModeWrap');
  const adminModeSelect = $('#adminViewMode');
  const accountMenu = $('#accountMenu');
  const loggedIn = Boolean(state.currentUser);
  authLinkText.textContent = 'Log in';
  logoutLink.hidden = false;
  if (authLinkText) authLinkText.hidden = loggedIn;
  if (accountMenu) {
    accountMenu.hidden = !loggedIn;
    accountMenu.value = '';
  }
  const adminBugReportsLink = $('#adminBugReportsLink');
  if (adminBugReportsLink) adminBugReportsLink.hidden = !isAdminModeActive();
  syncBugFormEmailField();
  if (state.currentUser?.role === 'admin') {
    if (adminModeWrap) adminModeWrap.hidden = false;
    if (adminModeSelect) adminModeSelect.value = state.adminViewMode === 'user' ? 'user' : 'admin';
  } else {
    state.adminViewMode = 'admin';
    localStorage.setItem('msai_admin_view_mode', state.adminViewMode);
    if (adminModeWrap) adminModeWrap.hidden = true;
  }
  renderAdminAccountsPanel();
}

function getEffectiveRole() {
  if (state.currentUser?.role !== 'admin') return 'user';
  return state.adminViewMode === 'user' ? 'user' : 'admin';
}

function isAdminModeActive() {
  return state.currentUser?.role === 'admin' && getEffectiveRole() === 'admin';
}

async function fetchAdminUsers() {
  if (state.currentUser?.role !== 'admin') {
    state.adminUsers = [];
    return;
  }
  const res = await apiFetch('/api/admin/users');
  if (!res.ok) {
    state.adminUsers = [];
    return;
  }
  const data = await res.json().catch(() => ({}));
  state.adminUsers = Array.isArray(data.users) ? data.users : [];
}

function renderAdminAccountsPanel() {
  const panel = $('#adminAccountsPanel');
  const list = $('#adminUserList');
  const searchInput = $('#adminUserSearch');
  if (!panel || !list || !searchInput) return;

  if (!isAdminModeActive()) {
    panel.hidden = true;
    list.innerHTML = '';
    return;
  }

  panel.hidden = false;
  const q = String(searchInput.value || '').trim().toLowerCase();
  const users = [...(state.adminUsers || [])].sort((a, b) =>
    String(a.email || '').localeCompare(String(b.email || ''), undefined, { sensitivity: 'base' }),
  );
  const filtered = users.filter((u) => {
    if (state.currentUser && u.id === state.currentUser.id) return false;
    const hay = `${String(u.email || '')} ${String(u.name || '')}`.toLowerCase();
    return !q || hay.includes(q);
  });
  if (!filtered.length) {
    list.innerHTML = '<p class="muted admin-user-empty">No matching accounts</p>';
    return;
  }

  list.innerHTML = filtered
    .map((u) => `
      <div class="admin-user-row">
        <div class="admin-user-meta">
          <p class="admin-user-email">${escapeHTML(u.email || '')}</p>
          <p class="admin-user-name">${escapeHTML(u.name || '(no name)')}</p>
        </div>
        <label class="admin-role-select-wrap">
          <span class="admin-role-label">Role</span>
          <select data-admin-user-role="${escapeAttr(u.id)}">
            <option value="user"${u.role === 'user' ? ' selected' : ''}>User</option>
            <option value="admin"${u.role === 'admin' ? ' selected' : ''}>Admin</option>
          </select>
        </label>
      </div>
    `)
    .join('');

  list.querySelectorAll('[data-admin-user-role]').forEach((sel) => {
    sel.addEventListener('change', async (e) => {
      const target = e.currentTarget;
      const userId = target.getAttribute('data-admin-user-role');
      const role = target.value === 'admin' ? 'admin' : 'user';
      if (!userId) return;
      const prev = state.adminUsers.find((u) => u.id === userId)?.role || 'user';
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
        const entry = state.adminUsers.find((u) => u.id === userId);
        if (entry) entry.role = role;
        if (state.currentUser && state.currentUser.id === userId) {
          state.currentUser.role = role;
          updateAuthUI();
          renderGrid();
        }
      }
      target.disabled = false;
      renderAdminAccountsPanel();
    });
  });
}

function clearAuthEmailConflict() {
  const emailIn = $('#authEmail');
  const emailErr = $('#authEmailError');
  if (emailIn) emailIn.classList.remove('auth-input-error');
  if (emailErr) {
    emailErr.hidden = true;
    emailErr.textContent = '';
  }
}

function clearAuthPasswordConfirmError() {
  const el = $('#authPasswordConfirmError');
  if (!el) return;
  el.hidden = true;
  el.textContent = '';
}

function updateAuthEmailClearVisibility() {
  const btn = $('#authEmailClear');
  const emailEl = $('#authEmail');
  if (!btn || !emailEl) return;
  btn.hidden = !String(emailEl.value || '').trim();
}

function clearAuthEmailAndPasswordFields() {
  const emailEl = $('#authEmail');
  const pw = $('#authPassword');
  const pwc = $('#authPasswordConfirm');
  if (emailEl) emailEl.value = '';
  if (pw) pw.value = '';
  if (pwc) pwc.value = '';
  clearAuthEmailConflict();
  clearAuthPasswordConfirmError();
  if (pw) pw.type = 'password';
  const toggle = $('#authPasswordToggle');
  if (toggle) {
    toggle.classList.remove('showing');
    toggle.setAttribute('aria-label', 'Show password');
    toggle.setAttribute('title', 'Show password');
  }
  if (pwc) pwc.type = 'password';
  const toggleC = $('#authPasswordConfirmToggle');
  if (toggleC) {
    toggleC.classList.remove('showing');
    toggleC.setAttribute('aria-label', 'Show confirm password');
    toggleC.setAttribute('title', 'Show confirm password');
  }
  updateAuthPasswordRules();
  updateAuthEmailClearVisibility();
  if (emailEl) emailEl.focus();
}

/** Browsers often autofill password after paint; re-clear a few times for sign-up. */
function scheduleClearSignupPasswordFields() {
  const clear = () => {
    const pw = $('#authPassword');
    const pwc = $('#authPasswordConfirm');
    if (pw) pw.value = '';
    if (pwc) pwc.value = '';
  };
  clear();
  requestAnimationFrame(clear);
  setTimeout(clear, 50);
  setTimeout(clear, 200);
}

function setAuthMode(mode) {
  clearAuthEmailConflict();
  clearAuthPasswordConfirmError();
  state.authMode = ['login', 'signup', 'recover'].includes(mode) ? mode : 'login';
  const isSignup = state.authMode === 'signup';
  const isRecover = state.authMode === 'recover';
  if (!isRecover) state.recoverLinkSent = false;
  $('#authTitle').textContent = isSignup ? 'Sign up' : (isRecover ? 'Forgot password' : 'Log in');
  $('#authSubmit').textContent = isSignup
    ? 'Create account'
    : (isRecover ? (state.recoverLinkSent ? 'Resend reset link' : 'Send reset link') : 'Log in');
  $('#authSwitch').textContent = isRecover
    ? 'Back to log in'
    : (isSignup ? 'Already have an account?' : 'Need an account?');
  const authSwitch = $('#authSwitch');
  if (authSwitch) {
    authSwitch.hidden = false;
    authSwitch.style.display = '';
  }
  const sub = $('#authSubtitle');
  if (sub) {
    if (isRecover) {
      sub.textContent = state.recoverLinkSent
        ? 'If the email exists, we sent a link. You can resend below if needed.'
        : 'Enter your email. If an account exists, we’ll send a reset link.';
    } else {
      sub.textContent = 'Create an account or sign in to vote and add a resource or tool.';
    }
  }
  const nameWrap = $('#authNameWrap');
  if (nameWrap) {
    nameWrap.hidden = !isSignup;
    nameWrap.style.display = isSignup ? '' : 'none';
  }
  const pwBlock = $('#authPasswordBlock');
  if (pwBlock) pwBlock.hidden = isRecover;
  const pwConfirmWrap = $('#authPasswordConfirmWrap');
  if (pwConfirmWrap) {
    pwConfirmWrap.hidden = !isSignup;
    pwConfirmWrap.style.display = isSignup ? '' : 'none';
  }
  $('#authPasswordRules').hidden = !isSignup;
  const pw = $('#authPassword');
  if (pw) {
    pw.required = !isRecover;
    pw.disabled = isRecover;
    pw.setAttribute('autocomplete', isSignup ? 'new-password' : 'current-password');
    if (isSignup) pw.value = '';
  }
  const pwConfirm = $('#authPasswordConfirm');
  if (pwConfirm) {
    pwConfirm.required = isSignup;
    if (isSignup) pwConfirm.value = '';
  }
  if (isSignup) scheduleClearSignupPasswordFields();
  const nameInput = $('#authNameWrap input[name="name"]');
  if (nameInput) nameInput.required = false;
  const authRecover = $('#authRecover');
  if (authRecover) {
    const hideRecoverBtn = isSignup || isRecover;
    authRecover.hidden = hideRecoverBtn;
    authRecover.style.display = hideRecoverBtn ? 'none' : '';
  }
  const errEl = $('#authError');
  errEl.hidden = true;
  errEl.textContent = '';
  errEl.classList.remove('auth-success');
  updateAuthPasswordRules();
  updateAuthEmailClearVisibility();
}

function openAuthModal(mode = 'login') {
  setAuthMode(mode);
  authModal.hidden = false;
  authModal.style.display = 'flex';
  updateAuthEmailClearVisibility();
  requestAnimationFrame(() => updateAuthEmailClearVisibility());
  setTimeout(updateAuthEmailClearVisibility, 0);
  setTimeout(updateAuthEmailClearVisibility, 150);
  setTimeout(updateAuthEmailClearVisibility, 500);
}

function closeAuthModal() {
  clearAuthEmailConflict();
  clearAuthPasswordConfirmError();
  authModal.hidden = true;
  authModal.style.display = 'none';
  const form = $('#authForm');
  if (form && typeof form.reset === 'function') form.reset();
  state.recoverLinkSent = false;
  const pw = $('#authPassword');
  const toggle = $('#authPasswordToggle');
  if (pw) {
    pw.type = 'password';
    pw.disabled = false;
  }
  if (toggle) {
    toggle.classList.remove('showing');
    toggle.setAttribute('aria-label', 'Show password');
    toggle.setAttribute('title', 'Show password');
  }
  const pwC = $('#authPasswordConfirm');
  const toggleC = $('#authPasswordConfirmToggle');
  if (pwC) pwC.type = 'password';
  if (toggleC) {
    toggleC.classList.remove('showing');
    toggleC.setAttribute('aria-label', 'Show confirm password');
    toggleC.setAttribute('title', 'Show confirm password');
  }
  const ae = $('#authError');
  if (ae) {
    ae.hidden = true;
    ae.textContent = '';
    ae.classList.remove('auth-success');
  }
  updateAuthEmailClearVisibility();
}

function openSignupSplash(message) {
  $('#signupSplashText').textContent = message || 'Sign up successful.';
  signupSplashModal.hidden = false;
  signupSplashModal.style.display = 'flex';
}

function closeSignupSplash() {
  signupSplashModal.hidden = true;
  signupSplashModal.style.display = 'none';
  if (state.pendingAction === 'openAddAfterSplash') {
    state.pendingAction = null;
    openAddModal();
  }
}

function getFeedbackKind() {
  const r = document.querySelector('#bugForm input[name="feedbackKind"]:checked');
  return r && r.value === 'feature' ? 'feature' : 'bug';
}

function applyFeedbackKind(kind) {
  const isBug = kind !== 'feature';
  const heading = $('#bugModalHeading');
  const sub = $('#bugModalSubtitle');
  if (heading) heading.textContent = isBug ? 'Report bug' : 'Request feature';
  if (sub) {
    sub.textContent = isBug
      ? 'Help us improve MSAI · CAT'
      : 'Tell us what would help you in MSAI · CAT';
  }
  const titleL = $('#bugFormTitleLabel');
  if (titleL) titleL.textContent = isBug ? 'Bug title (required)' : 'Feature title (required)';
  const areaL = $('#bugFormAreaLabel');
  if (areaL) areaL.textContent = 'Area (optional)';
  const stepsL = $('#bugFormStepsLabel');
  if (stepsL) {
    stepsL.textContent = isBug ? 'Steps to reproduce (required)' : 'Description (required)';
  }
  const stepsEl = $('#bugFormSteps');
  if (stepsEl) {
    stepsEl.placeholder = isBug
      ? '1) … 2) … 3) …'
      : 'What would you like to see? Include any context that helps.';
  }
  const bugOnly = $('#bugFormBugOnlyFields');
  if (bugOnly) bugOnly.hidden = !isBug;
  if (!isBug) {
    const expTa = document.querySelector('#bugForm textarea[name="expected"]');
    const actTa = document.querySelector('#bugForm textarea[name="actual"]');
    if (expTa) expTa.value = '';
    if (actTa) actTa.value = '';
  }
  if (isBug) {
    const expL = $('#bugFormExpectedLabel');
    const actL = $('#bugFormActualLabel');
    if (expL) expL.textContent = 'Expected result (optional)';
    if (actL) actL.textContent = 'Actual result (optional)';
  }
  const submitBtn = $('#bugSubmit');
  if (submitBtn) submitBtn.textContent = isBug ? 'Submit bug report' : 'Submit feature request';
}

function openBugModal(kind = 'bug') {
  $('#bugError').hidden = true;
  $('#bugError').textContent = '';
  syncBugFormEmailField();
  bugModal.hidden = false;
  bugModal.style.display = 'flex';
  const k = kind === 'feature' ? 'feature' : 'bug';
  const radio = document.querySelector(`#bugForm input[name="feedbackKind"][value="${k}"]`);
  if (radio) radio.checked = true;
  applyFeedbackKind(k);
}

function closeBugModal() {
  bugModal.hidden = true;
  bugModal.style.display = 'none';
  const form = $('#bugForm');
  if (form && typeof form.reset === 'function') form.reset();
  $('#bugError').hidden = true;
  $('#bugError').textContent = '';
  const bugOnly = $('#bugFormBugOnlyFields');
  if (bugOnly) bugOnly.hidden = false;
  applyFeedbackKind('bug');
  syncBugFormEmailField();
}

function openProfileModal() {
  if (!state.currentUser) return;
  const form = $('#profileForm');
  if (form && typeof form.reset === 'function') form.reset();
  $('#profileName').value = state.currentUser.name || '';
  $('#profileEmail').value = state.currentUser.email || '';
  $('#profileCurrentPassword').value = '';
  $('#profileNewPassword').value = '';
  $('#profileNewPasswordConfirm').value = '';
  const errEl = $('#profileError');
  if (errEl) {
    errEl.hidden = true;
    errEl.textContent = '';
    errEl.classList.remove('auth-success');
  }
  profileModal.hidden = false;
  profileModal.style.display = 'flex';
}

function closeProfileModal() {
  profileModal.hidden = true;
  profileModal.style.display = 'none';
}

async function hydrateSession() {
  if (!state.authToken) {
    state.currentUser = null;
    state.adminUsers = [];
    updateAuthUI();
    return;
  }
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) {
    setAuthToken('');
    state.currentUser = null;
    state.adminUsers = [];
    updateAuthUI();
    return;
  }
  const data = await res.json();
  state.currentUser = data.user || null;
  await fetchAdminUsers();
  updateAuthUI();
}

function validatePasswordClient(password) {
  if (!password || password.length < 8) return 'Password must be at least 8 characters';
  if (!/[0-9]/.test(password)) return 'Password must include at least one number';
  if (!/[A-Z]/.test(password)) return 'Password must include at least one uppercase letter';
  if (!PASSWORD_SPECIAL_REGEX.test(password)) return `Password must include at least one special character: ${PASSWORD_SPECIAL}`;
  return null;
}

function getPasswordRequirementStatus(password) {
  const p = password || '';
  return {
    length: p.length >= 8,
    number: /[0-9]/.test(p),
    upper: /[A-Z]/.test(p),
    special: PASSWORD_SPECIAL_REGEX.test(p),
  };
}

function updateAuthPasswordRules() {
  if (state.authMode !== 'signup') return;
  const p = $('#authPassword')?.value || '';
  const status = getPasswordRequirementStatus(p);
  const map = {
    length: '#auth-pw-req-length',
    number: '#auth-pw-req-number',
    upper: '#auth-pw-req-upper',
    special: '#auth-pw-req-special',
  };
  for (const [k, sel] of Object.entries(map)) {
    const el = $(sel);
    if (el) el.classList.toggle('met', status[k]);
  }
}

function getTagCounts(resources) {
  const counts = new Map();
  for (const r of resources) {
    for (const t of (r.tags || [])) {
      const key = String(t).trim().toLowerCase();
      if (!key) continue;
      counts.set(key, (counts.get(key) || 0) + 1);
    }
  }
  return counts;
}

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  let out = state.allResources;

  if (state.selectedTags.size) {
    const required = [...state.selectedTags];
    out = out.filter(r => {
      const tags = (r.tags || []).map(x => String(x).trim().toLowerCase());
      return required.every(sel => tags.includes(sel));
    });
  }
  if (q) {
    out = out.filter(r => {
      const hay = [
        r.title,
        r.description,
        ...(r.tags || [])
      ].filter(Boolean).join(' ').toLowerCase();
      return hay.includes(q);
    });
  }
  return out;
}

function applySort(list) {
  const sorted = [...list];
  const byTitleAsc = (a, b) =>
    String(a?.title || '').localeCompare(String(b?.title || ''), undefined, { sensitivity: 'base' });
  if (state.sort === 'votes_asc') {
    sorted.sort((a, b) => {
      const voteDiff = (a.votes || 0) - (b.votes || 0);
      return voteDiff !== 0 ? voteDiff : byTitleAsc(a, b);
    });
  } else if (state.sort === 'recent_desc') {
    sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else {
    // votes_desc default
    sorted.sort((a, b) => {
      const voteDiff = (b.votes || 0) - (a.votes || 0);
      return voteDiff !== 0 ? voteDiff : byTitleAsc(a, b);
    });
  }
  return sorted;
}

function setActiveFiltersPill() {
  const parts = [];
  if (state.q.trim()) parts.push(`Search: “${state.q.trim()}”`);
  $('#activeFilters').textContent = parts.length ? parts.join(' · ') : '';
}

function renderSelectedLabelsRow() {
  const row = $('#selectedLabelsRow');
  const chips = $('#selectedLabelsChips');
  if (!row || !chips) return;
  const tags = [...state.selectedTags].sort();
  if (!tags.length) {
    row.hidden = true;
    chips.innerHTML = '';
    return;
  }
  row.hidden = false;
  chips.innerHTML = tags
    .map(
      tag => `
      <button
        type="button"
        class="tag-pill selected-label-chip"
        data-remove-tag="${escapeAttr(tag)}"
        aria-label="Remove ${escapeAttr(tag)} from filters"
        ${tagPillStyleAttr(tag)}
      >
        <span>${escapeHTML(tag)}</span>
        <span class="selected-label-remove" aria-hidden="true">×</span>
      </button>
    `
    )
    .join('');
  chips.querySelectorAll('[data-remove-tag]').forEach(btn => {
    btn.addEventListener('click', () => {
      const t = btn.getAttribute('data-remove-tag');
      if (t) state.selectedTags.delete(t);
      setActiveFiltersPill();
      renderGrid();
      renderSidebar();
    });
  });
}

function renderSidebar() {
  const all = state.allResources;

  const tags = [...getTagCounts(all).entries()]
    .sort((a, b) => {
      const countDiff = b[1] - a[1];
      if (countDiff !== 0) return countDiff;
      return String(a[0]).localeCompare(String(b[0]), undefined, { sensitivity: 'base' });
    })
    .slice(0, 36);

  const tagList = $('#tagList');
  tagList.innerHTML = '';
  for (const [t, count] of tags) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-pill' + (state.selectedTags.has(t) ? ' tag-pill-active' : '');
    btn.textContent = `${t} (${count})`;
    btn.setAttribute('style', tagPillStyleVars(t));

    btn.onclick = () => {
      toggleSelectedTag(t);
      state.q = '';
      $('#searchInput').value = '';
      setActiveFiltersPill();
      renderGrid();
      renderSidebar(); // highlight selection
    };
    tagList.appendChild(btn);
  }
  renderAdminAccountsPanel();
}

function renderGrid() {
  const list = applySort(applyFilters());
  const grid = $('#resourceGrid');
  grid.innerHTML = '';

  setActiveFiltersPill();
  renderSelectedLabelsRow();

  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'panel note';
    empty.textContent = 'No matching resources yet. Adjust search or tags, or add the first one!';
    grid.appendChild(empty);
    return;
  }

  for (const r of list) {
    const card = document.createElement('div');
    card.className = 'card';
    card.dataset.resourceId = String(r.id || '');
    card.setAttribute('role', 'listitem');

    const sortedTags = [...(r.tags || [])].sort((a, b) =>
      String(a).localeCompare(String(b), undefined, { sensitivity: 'base' })
    );
    const tags = sortedTags.slice(0, 4);
    const tagHtml = tags.map(t => {
      const key = String(t).trim().toLowerCase();
      return `
        <span
          class="tag-pill"
          data-tag="${escapeHTML(key)}"
          ${tagPillStyleAttr(t)}
        >${escapeHTML(t)}</span>
      `;
    }).join('');

    const url = r.url ? String(r.url).trim() : '';
    const examples = r.examples ? String(r.examples).trim() : '';
    const detailsBodyParts = [];
    if (examples) {
      detailsBodyParts.push(`<div class="card-details-block"><h4 class="card-details-heading">Examples</h4><pre class="card-details-pre">${escapeHTML(examples)}</pre></div>`);
    }
    if (url) {
      detailsBodyParts.push(
        `<div class="card-details-block"><a class="card-details-link" href="${escapeHTML(url)}" target="_blank" rel="noreferrer">Go to product</a></div>`,
      );
    }
    if (!detailsBodyParts.length) {
      detailsBodyParts.push(`<p class="card-details-empty muted">No examples or link yet.</p>`);
    }
    const detailsBodyHtml = detailsBodyParts.join('');

    const titleText = escapeHTML(r.title || '');
    const titleHtml = url
      ? `<a class="card-title-link" href="${escapeHTML(url)}" target="_blank" rel="noreferrer">${titleText}</a>`
      : titleText;

    card.innerHTML = `
      <div class="card-title-band" ${titleBandStyleAttr(r.id)}>
        <div class="card-title-band-inner">
          <h3 class="card-title-text">${titleHtml}</h3>
          <div class="votes">${escapeHTML(formatVotes(r.votes || 0))}</div>
        </div>
      </div>

      <p class="desc">${escapeHTML(r.description || '')}</p>

      <div class="chips" style="margin-top:-2px">
        ${tagHtml}
        ${Math.max(0, sortedTags.length - tags.length) ? `<span class="muted" style="font-size:12px">+${Math.max(0, sortedTags.length - tags.length)} more</span>` : ''}
      </div>

      <div class="card-footer-row">
        <details class="card-details">
          <summary class="card-details-summary">
            <span class="card-details-label">Details</span>
            <span class="card-details-chev" aria-hidden="true">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </summary>
          <div class="card-details-body">
            ${detailsBodyHtml}
          </div>
        </details>
        <div class="vote"${state.currentUser ? '' : ' style="display:none"'}>
          <button class="vote-icon-btn" type="button" data-vote="${escapeHTML(r.id)}" data-delta="1" aria-label="Vote up">${VOTE_ICON_UP}</button>
          <button class="vote-icon-btn" type="button" data-vote="${escapeHTML(r.id)}" data-delta="-1" aria-label="Vote down">${VOTE_ICON_DOWN}</button>
          ${getEffectiveRole() === 'admin'
            ? `<button class="vote-icon-btn vote-icon-btn-danger" type="button" data-delete-resource="${escapeHTML(r.id)}" aria-label="Delete resource" title="Delete resource">${TRASH_ICON}</button>`
            : ''}
        </div>
      </div>
    `;

    // tag clicks
    for (const el of card.querySelectorAll('[data-tag]')) {
      el.addEventListener('click', () => {
        toggleSelectedTag(el.getAttribute('data-tag'));
        state.q = '';
        $('#searchInput').value = '';
        setActiveFiltersPill();
        renderGrid();
        renderSidebar(); // highlight selection
      });
    }

    card.querySelectorAll('[data-vote]').forEach(btn => {
      const delta = Number(btn.getAttribute('data-delta'));
      const myVote = Number(state.userVotes?.[r.id] || 0);
      if (myVote === delta) {
        btn.disabled = true;
        btn.title = 'You already voted this way';
      } else {
        btn.disabled = false;
        btn.title = '';
      }
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-vote');
        vote(id, delta);
      });
    });

    card.querySelectorAll('[data-delete-resource]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-delete-resource');
        if (!id) return;
        await deleteResource(id);
      });
    });

    grid.appendChild(card);
  }
}

async function refreshAll() {
  const res = await apiFetch('/api/resources');
  if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
  const data = await res.json();
  state.allResources = Array.isArray(data.resources) ? data.resources : [];
  state.userVotes = data.userVotes && typeof data.userVotes === 'object' ? data.userVotes : {};
  renderSidebar();
  renderGrid();
}

async function openDetail(id) {
  const res = await fetch(`/api/resources/${encodeURIComponent(id)}`);
  if (!res.ok) throw new Error(`Failed to load detail: ${res.status}`);
  const data = await res.json();
  const r = data.resource;
  activeDetailId = r.id;

  $('#detailTitle').textContent = r.title || '';
  $('#detailVotes').textContent = formatVotes(r.votes || 0);

  $('#detailDesc').textContent = r.description || '';

  // tags
  const tagPills = $('#detailTagPills');
  tagPills.innerHTML = '';
  for (const t of (r.tags || [])) {
    const el = document.createElement('span');
    el.className = 'tag-pill';
    el.setAttribute('style', tagPillStyleVars(t));
    el.textContent = t;
    el.onclick = () => {
      toggleSelectedTag(String(t).trim().toLowerCase());
      state.q = '';
      $('#searchInput').value = '';
      closeDetail();
      refreshAll();
    };
    tagPills.appendChild(el);
  }

  // examples
  $('#detailExamples').textContent = r.examples || '(no examples yet)';

  // link
  const url = r.url;
  const urlEl = $('#detailUrl');
  if (url) {
    urlEl.href = url;
    urlEl.style.display = 'inline-flex';
  } else {
    urlEl.href = '#';
    urlEl.style.display = 'none';
  }

  $('#voteUp').disabled = false;
  $('#voteDown').disabled = false;
  const detailVoteRow = $('#detailModal .vote-row');
  detailVoteRow.style.display = state.currentUser ? '' : 'none';

  detailModal.hidden = false;
}

function closeDetail() {
  detailModal.hidden = true;
  activeDetailId = null;
}

async function vote(id, delta) {
  if (!state.currentUser) {
    openAuthModal('login');
    alert('Please log in to vote.');
    return;
  }
  const up = $('#voteUp');
  const down = $('#voteDown');
  // Disable to avoid rapid double-clicks
  if (activeDetailId === id) {
    up.disabled = true;
    down.disabled = true;
  }

  const res = await apiFetch(`/api/resources/${encodeURIComponent(id)}/vote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    if (res.status === 401) {
      setAuthToken('');
      state.currentUser = null;
      updateAuthUI();
      openAuthModal('login');
      alert('Session expired. Please log in again.');
      return;
    }
    alert(err.error || 'Vote failed');
    return;
  }

  await refreshAll();
  if (activeDetailId) {
    await openDetail(activeDetailId);
  }
}

async function deleteResource(id) {
  if (!state.currentUser || getEffectiveRole() !== 'admin') return;
  const confirmed = window.confirm('Delete this resource card? This cannot be undone.');
  if (!confirmed) return;
  const res = await apiFetch(`/api/resources/${encodeURIComponent(id)}`, { method: 'DELETE' });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    alert(data.error || `Delete failed (HTTP ${res.status})`);
    return;
  }
  await refreshAll();
}

function openAddModal() {
  if (!state.currentUser) {
    state.pendingAction = 'openAdd';
    openAuthModal('login');
    return;
  }
  resetAddFormTags();
  addModal.hidden = false;
  addModal.style.display = 'flex';
}

function closeAddModal() {
  clearTimeout(addSuggestTimer);
  addSuggestSeq++;
  // Hide first; make reset best-effort so we never get stuck open.
  addModal.hidden = true;
  addModal.style.display = 'none';
  const form = $('#addForm');
  try {
    if (form && typeof form.reset === 'function') form.reset();
  } catch (e) {
    // ignore reset errors
  }
  resetAddFormTags();
}

function closeExistingCardModal() {
  if (!existingCardModal) return;
  existingCardModal.hidden = true;
  existingCardModal.style.display = 'none';
  const host = $('#existingCardPreview');
  if (host) host.innerHTML = '';
}

function openExistingCardModal(resourceId) {
  if (!existingCardModal) return false;
  const id = String(resourceId || '').trim();
  if (!id) return false;
  const source = document.querySelector(`.card[data-resource-id="${CSS.escape(id)}"]`);
  const host = $('#existingCardPreview');
  if (!source || !host) return false;
  host.innerHTML = '';
  const clone = source.cloneNode(true);
  host.appendChild(clone);
  existingCardModal.hidden = false;
  existingCardModal.style.display = 'flex';
  return true;
}

async function submitAdd(e) {
  e.preventDefault();
  const form = $('#addForm');
  const fd = new FormData(form);

  syncAddTagsHidden();
  const payload = {
    title: fd.get('title'),
    tags: state.addFormTags.join(', '),
    url: fd.get('url'),
    description: fd.get('description'),
    examples: fd.get('examples'),
  };

  const localDuplicate = findDuplicateResourceByUrl(payload.url);
  if (localDuplicate?.id) {
    closeAddModal();
    const found = openExistingCardModal(localDuplicate.id);
    alert(
      `Already exists: ${localDuplicate.title || 'Existing entry'}. ${
        found ? 'Showing the existing card.' : 'It is already listed.'
      }`,
    );
    return;
  }

  try {
    const res = await apiFetch('/api/resources', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 409 && err.duplicateResource && err.duplicateResource.id) {
        const dup = err.duplicateResource;
        closeAddModal();
        await refreshAll();
        const found = openExistingCardModal(dup.id);
        alert(
          `Already exists: ${dup.title || 'Existing entry'}. ${
            found ? 'Showing the existing card.' : 'It is already listed.'
          }`,
        );
        return;
      }
      alert(err.error || `Failed to add (HTTP ${res.status})`);
      return;
    }

    closeAddModal();
    await refreshAll();
  } catch (err) {
    console.error('submitAdd error:', err);
    alert(String(err?.message || err || 'Failed to add resource'));
  }
}

async function submitAuth(e) {
  e.preventDefault();
  const form = $('#authForm');
  const fd = new FormData(form);
  const payload = {
    email: String(fd.get('email') || '').trim(),
    password: String(fd.get('password') || ''),
  };
  if (state.authMode === 'signup') {
    clearAuthPasswordConfirmError();
    payload.name = String(fd.get('name') || '').trim();
    const confirmPassword = String(fd.get('confirmPassword') || '');
    const pwErr = validatePasswordClient(payload.password);
    if (pwErr) {
      const errEl = $('#authError');
      errEl.hidden = false;
      errEl.textContent = pwErr;
      updateAuthPasswordRules();
      return;
    }
    if (payload.password !== confirmPassword) {
      const confirmErr = $('#authPasswordConfirmError');
      if (confirmErr) {
        confirmErr.hidden = false;
        confirmErr.textContent = 'Passwords do not match';
      }
      return;
    }
  }
  if (state.authMode === 'recover') {
    const startedAt = Date.now();
    const errEl = $('#authError');
    const submitBtn = $('#authSubmit');
    if (errEl) {
      errEl.hidden = true;
      errEl.textContent = '';
      errEl.classList.remove('auth-success');
    }
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = 'Sending...';
    }

    let resForgot;
    let dataForgot = {};
    try {
      resForgot = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email: payload.email }),
      });
      try {
        dataForgot = await resForgot.json();
      } catch {
        dataForgot = {};
      }
    } catch {
      resForgot = { ok: false, status: 0 };
    } finally {
      const elapsed = Date.now() - startedAt;
      const minSendingMs = 500;
      if (elapsed < minSendingMs) {
        await new Promise(resolve => setTimeout(resolve, minSendingMs - elapsed));
      }
      if (submitBtn) submitBtn.disabled = false;
    }

    if (!resForgot.ok) {
      const errEl = $('#authError');
      errEl.hidden = false;
      errEl.classList.remove('auth-success');
      errEl.textContent = dataForgot.error || `Request failed (HTTP ${resForgot.status})`;
      if (submitBtn) submitBtn.textContent = state.recoverLinkSent ? 'Resend reset link' : 'Send reset link';
      return;
    }
    state.recoverLinkSent = true;
    if (submitBtn) submitBtn.textContent = 'Resend reset link';
    const sub = $('#authSubtitle');
    if (sub) sub.textContent = 'If the email exists, we sent a link. You can resend below if needed.';
    const okEl = $('#authError');
    okEl.hidden = false;
    okEl.classList.add('auth-success');
    okEl.textContent = dataForgot.message || 'Reset link sent. If it does not arrive, click Resend reset link.';
    return;
  }

  const endpoint =
    state.authMode === 'signup' ? '/api/auth/signup' : '/api/auth/login';
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }
  if (!res.ok) {
    const msg = String(data.error || '');
    const emailTaken =
      state.authMode === 'signup' &&
      (res.status === 409 || /already in use/i.test(msg));
    if (emailTaken) {
      const errEl = $('#authError');
      if (errEl) {
        errEl.hidden = true;
        errEl.textContent = '';
        errEl.classList.remove('auth-success');
      }
      const emailIn = $('#authEmail');
      const emailErr = $('#authEmailError');
      if (emailIn) emailIn.classList.add('auth-input-error');
      if (emailErr) {
        emailErr.hidden = false;
        emailErr.textContent = msg || 'This email is already in use.';
      }
      return;
    }
    clearAuthEmailConflict();
    const errEl = $('#authError');
    errEl.hidden = false;
    errEl.textContent = data.error || `Authentication failed (HTTP ${res.status})`;
    return;
  }
  const submittedMode = state.authMode;
  setAuthToken(data.token || '');
  state.currentUser = data.user || null;
  updateAuthUI();
  closeAuthModal();
  await refreshAll();
  if (submittedMode === 'signup') {
    if (state.pendingAction === 'openAdd') state.pendingAction = 'openAddAfterSplash';
    openSignupSplash('You are signed up and logged in.');
  } else if (state.pendingAction === 'openAdd') {
    state.pendingAction = null;
    openAddModal();
  }
}

async function logout() {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (e) {
    // Ignore network failures here; we'll clear local session anyway.
  }
  setAuthToken('');
  state.currentUser = null;
  state.adminUsers = [];
  state.userVotes = {};
  state.pendingAction = null;
  updateAuthUI();
  await refreshAll();
}

async function submitProfile(e) {
  e.preventDefault();
  const errEl = $('#profileError');
  if (errEl) {
    errEl.hidden = true;
    errEl.textContent = '';
    errEl.classList.remove('auth-success');
  }

  const email = String($('#profileEmail')?.value || '').trim();
  const name = String($('#profileName')?.value || '').trim();
  const currentPassword = String($('#profileCurrentPassword')?.value || '');
  const newPassword = String($('#profileNewPassword')?.value || '');
  const newPasswordConfirm = String($('#profileNewPasswordConfirm')?.value || '');

  if (newPassword && newPassword !== newPasswordConfirm) {
    if (errEl) {
      errEl.hidden = false;
      errEl.textContent = 'New passwords do not match';
    }
    return;
  }

  const payload = { email, name };
  if (newPassword) {
    payload.currentPassword = currentPassword;
    payload.newPassword = newPassword;
  }

  const res = await apiFetch('/api/auth/profile', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    if (errEl) {
      errEl.hidden = false;
      errEl.textContent = data.error || `Could not update profile (HTTP ${res.status})`;
    }
    return;
  }

  state.currentUser = data.user || state.currentUser;
  updateAuthUI();
  if (errEl) {
    errEl.hidden = false;
    errEl.classList.add('auth-success');
    errEl.textContent = 'Profile updated';
  }
  await refreshAll();
}

async function submitBugReport(e) {
  e.preventDefault();
  const form = $('#bugForm');
  const fd = new FormData(form);
  const kind = getFeedbackKind();
  const payload = {
    kind,
    title: String(fd.get('title') || '').trim(),
    area: String(fd.get('area') || '').trim(),
    steps: String(fd.get('steps') || '').trim(),
    expected: kind === 'feature' ? '' : String(fd.get('expected') || '').trim(),
    actual: kind === 'feature' ? '' : String(fd.get('actual') || '').trim(),
  };
  if (!state.currentUser) {
    payload.email = String(fd.get('email') || '').trim();
  }

  const res = await apiFetch('/api/bug-reports', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = $('#bugError');
    err.hidden = false;
    err.textContent = data.error || `Could not submit report (HTTP ${res.status})`;
    return;
  }

  closeBugModal();
  alert(
    kind === 'feature'
      ? 'Thanks. Your feature request has been submitted.'
      : 'Thanks. Your bug report has been submitted.',
  );
}

function syncHowItWorksPanel() {
  const d = document.getElementById('howItWorks');
  if (!d) return;
  const wide = window.matchMedia('(min-width: 981px)').matches;
  d.open = wide;
}

const BRAND_INTERPUNCT_TRIPLE_MS = 650;

function wireBrandInterpunctEasterEgg() {
  const el = $('#brandInterpunct');
  if (!el) return;
  let count = 0;
  let resetTimer = null;
  el.addEventListener('click', (e) => {
    e.preventDefault();
    count += 1;
    if (resetTimer) clearTimeout(resetTimer);
    resetTimer = setTimeout(() => {
      count = 0;
      resetTimer = null;
    }, BRAND_INTERPUNCT_TRIPLE_MS);
    if (count >= 3) {
      count = 0;
      if (resetTimer) clearTimeout(resetTimer);
      resetTimer = null;
      window.location.href = '/magic-word.html';
    }
  });
}

function wireUI() {
  const howItWorks = document.getElementById('howItWorks');
  if (howItWorks) {
    howItWorks.addEventListener('toggle', () => {
      if (window.matchMedia('(min-width: 981px)').matches && !howItWorks.open) {
        howItWorks.open = true;
      }
    });
    syncHowItWorksPanel();
    window.addEventListener('resize', syncHowItWorksPanel);
  }

  // Search
  const search = $('#searchInput');
  let t = null;
  search.addEventListener('input', () => {
    clearTimeout(t);
    t = setTimeout(() => {
      state.q = search.value || '';
      renderGrid();
    }, 140);
  });

  // Sort
  $('#sortSelect').addEventListener('change', (e) => {
    state.sort = e.target.value;
    renderGrid();
  });

  // Detail modal
  $('#detailClose').addEventListener('click', closeDetail);
  $('#voteUp').addEventListener('click', () => activeDetailId && vote(activeDetailId, 1));
  $('#voteDown').addEventListener('click', () => activeDetailId && vote(activeDetailId, -1));

  detailModal.addEventListener('click', (e) => {
    if (e.target === detailModal) closeDetail();
  });

  // Add modal
  $('#addBtn').addEventListener('click', openAddModal);
  $('#addClose').addEventListener('click', closeAddModal);
  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) closeAddModal();
  });

  $('#addForm').addEventListener('submit', submitAdd);
  const addFormEl = $('#addForm');
  if (addFormEl) {
    const urlEl = addFormEl.querySelector('[name="url"]');
    if (urlEl) urlEl.addEventListener('input', scheduleSuggestTagsForAddForm);
  }
  const addTagInput = $('#addTagInput');
  const addTagsEntryComposite = $('#addTagsEntryComposite');
  if (addTagInput) {
    addTagInput.addEventListener('input', () => {
      flushAddTagInputCommas();
    });
    addTagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        flushAddTagInputRemainderAsPill();
      }
    });
    addTagInput.addEventListener('blur', () => {
      flushAddTagInputRemainderAsPill();
    });
  }
  if (addTagsEntryComposite && addTagInput) {
    addTagsEntryComposite.addEventListener('click', (e) => {
      if (e.target.closest('.add-form-tag-remove')) return;
      if (e.target.closest('.add-form-suggested-add')) return;
      if (e.target === addTagInput) return;
      focusAddTagInputAtEnd();
    });
  }

  // Auth modal + controls
  $('#logoutLink').addEventListener('click', (e) => {
    e.preventDefault();
    if (state.currentUser) return;
    openAuthModal('login');
  });
  const accountMenu = $('#accountMenu');
  if (accountMenu) {
    accountMenu.addEventListener('change', async (e) => {
      const action = e.target.value;
      e.target.value = '';
      if (action === 'settings') {
        openProfileModal();
        return;
      }
      if (action === 'logout') {
        await logout();
      }
    });
  }
  $('#authClose').addEventListener('click', closeAuthModal);
  $('#authSwitch').addEventListener('click', () => {
    if (state.authMode === 'recover') {
      setAuthMode('login');
      return;
    }
    setAuthMode(state.authMode === 'signup' ? 'login' : 'signup');
  });
  $('#authRecover').addEventListener('click', () => setAuthMode('recover'));
  const adminModeSelect = $('#adminViewMode');
  if (adminModeSelect) {
    adminModeSelect.addEventListener('change', async (e) => {
      const next = e.target.value === 'user' ? 'user' : 'admin';
      state.adminViewMode = next;
      localStorage.setItem('msai_admin_view_mode', next);
      if (next === 'admin') await fetchAdminUsers();
      updateAuthUI();
      renderGrid();
      renderSidebar();
    });
  }
  const adminUserSearch = $('#adminUserSearch');
  if (adminUserSearch) adminUserSearch.addEventListener('input', () => renderAdminAccountsPanel());
  const authEmail = $('#authEmail');
  if (authEmail) {
    authEmail.addEventListener('input', () => {
      clearAuthEmailConflict();
      updateAuthEmailClearVisibility();
    });
    authEmail.addEventListener('change', updateAuthEmailClearVisibility);
    authEmail.addEventListener('focus', updateAuthEmailClearVisibility);
  }
  const authEmailClear = $('#authEmailClear');
  if (authEmailClear) authEmailClear.addEventListener('click', clearAuthEmailAndPasswordFields);
  const authPassword = $('#authPassword');
  if (authPassword) authPassword.addEventListener('input', clearAuthPasswordConfirmError);
  const authPasswordConfirm = $('#authPasswordConfirm');
  if (authPasswordConfirm) authPasswordConfirm.addEventListener('input', clearAuthPasswordConfirmError);
  $('#authPassword').addEventListener('input', updateAuthPasswordRules);
  function wirePasswordToggle(inputId, btnId, showLabel, hideLabel) {
    const input = $(inputId);
    const btn = $(btnId);
    if (!input || !btn) return;
    btn.addEventListener('click', () => {
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.classList.toggle('showing', show);
      btn.setAttribute('aria-label', show ? hideLabel : showLabel);
      btn.setAttribute('title', show ? hideLabel : showLabel);
    });
  }
  wirePasswordToggle('#authPassword', '#authPasswordToggle', 'Show password', 'Hide password');
  wirePasswordToggle(
    '#authPasswordConfirm',
    '#authPasswordConfirmToggle',
    'Show confirm password',
    'Hide confirm password',
  );
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });
  $('#authForm').addEventListener('submit', submitAuth);

  // Signup splash
  $('#signupSplashOk').addEventListener('click', closeSignupSplash);
  signupSplashModal.addEventListener('click', (e) => {
    if (e.target === signupSplashModal) closeSignupSplash();
  });

  // Bug / feature report
  $('#reportBugLink').addEventListener('click', (e) => {
    e.preventDefault();
    openBugModal('bug');
  });
  for (const el of document.querySelectorAll('#bugForm input[name="feedbackKind"]')) {
    el.addEventListener('change', () => applyFeedbackKind(getFeedbackKind()));
  }
  $('#bugClose').addEventListener('click', closeBugModal);
  bugModal.addEventListener('click', (e) => {
    if (e.target === bugModal) closeBugModal();
  });
  $('#bugForm').addEventListener('submit', submitBugReport);
  $('#profileClose').addEventListener('click', closeProfileModal);
  $('#profileForm').addEventListener('submit', submitProfile);
  profileModal.addEventListener('click', (e) => {
    if (e.target === profileModal) closeProfileModal();
  });
  if (existingCardModal) {
    const existingClose = $('#existingCardClose');
    if (existingClose) existingClose.addEventListener('click', closeExistingCardModal);
    existingCardModal.addEventListener('click', (e) => {
      if (e.target === existingCardModal) closeExistingCardModal();
    });
  }

  wireBrandInterpunctEasterEgg();
}

wireUI();
(async () => {
  try {
    await hydrateSession();
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('reset') === 'ok') {
      urlParams.delete('reset');
      const qs = urlParams.toString();
      const newUrl = `${window.location.pathname}${qs ? `?${qs}` : ''}${window.location.hash}`;
      window.history.replaceState({}, '', newUrl);
      openAuthModal('login');
      const errEl = $('#authError');
      errEl.hidden = false;
      errEl.classList.add('auth-success');
      errEl.textContent = 'Password updated. You can log in with your new password.';
    }
    await refreshAll();
  } catch (err) {
    console.error(err);
    alert('Failed to load resources. Check server logs.');
  }
})();

