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
  pendingAction: null,
};

const detailModal = $('#detailModal');
const addModal = $('#addModal');
const authModal = $('#authModal');
const signupSplashModal = $('#signupSplashModal');
const bugModal = $('#bugModal');
const PASSWORD_SPECIAL = '!@#$%^&*()_+-=[]{}|;\':",.<>?/~`';
const PASSWORD_SPECIAL_REGEX = /[!@#$%^&*()_+\-=[\]{}|;':",.<>?/~`]/;

let activeDetailId = null;

/** Outline thumbs (monochrome via stroke="currentColor") */
const VOTE_ICON_UP =
  '<svg class="vote-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
const VOTE_ICON_DOWN =
  '<svg class="vote-icon-svg" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h3a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3"/></svg>';

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

/** Light but vivid: high lightness + strong saturation (candy / high-key, not deep). */
function pastelTagColors(hue) {
  return {
    bg: `hsla(${hue}, 82%, 94%, 0.98)`,
    border: `hsla(${hue}, 70%, 80%, 0.92)`,
    fg: `hsla(${hue}, 32%, 24%, 0.92)`,
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

function getTagThemeStyle(label) {
  return pastelTagColors(getTagThemeHue(label));
}

function tagPillStyleVars(label) {
  const { bg, border, fg } = getTagThemeStyle(label);
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

function updateAuthUI() {
  const logoutLink = $('#logoutLink');
  const authLinkText = $('#authLinkText');
  if (state.currentUser) {
    authLinkText.textContent = 'Log out';
    logoutLink.hidden = false;
  } else {
    authLinkText.textContent = 'Log in';
    logoutLink.hidden = false;
  }
}

function setAuthMode(mode) {
  state.authMode = ['login', 'signup', 'recover'].includes(mode) ? mode : 'login';
  const isSignup = state.authMode === 'signup';
  const isRecover = state.authMode === 'recover';
  $('#authTitle').textContent = isSignup ? 'Sign up' : (isRecover ? 'Forgot password' : 'Log in');
  $('#authSubmit').textContent = isSignup ? 'Create account' : (isRecover ? 'Send reset link' : 'Log in');
  $('#authSwitch').textContent = isSignup ? 'Already have an account?' : 'Need an account?';
  const sub = $('#authSubtitle');
  if (sub) {
    sub.textContent = isRecover
      ? 'Enter your email. If an account exists, we’ll send a reset link.'
      : 'Create an account or sign in to vote';
  }
  $('#authNameWrap').hidden = !isSignup;
  const pwBlock = $('#authPasswordBlock');
  if (pwBlock) pwBlock.hidden = isRecover;
  $('#authPasswordRules').hidden = !isSignup;
  const pw = $('#authPassword');
  if (pw) {
    pw.required = !isRecover;
    pw.setAttribute('autocomplete', isSignup ? 'new-password' : 'current-password');
  }
  $('#authRecover').hidden = isSignup || isRecover;
  const errEl = $('#authError');
  errEl.hidden = true;
  errEl.textContent = '';
  errEl.classList.remove('auth-success');
  updateAuthPasswordRules();
}

function openAuthModal(mode = 'login') {
  setAuthMode(mode);
  authModal.hidden = false;
  authModal.style.display = 'flex';
}

function closeAuthModal() {
  authModal.hidden = true;
  authModal.style.display = 'none';
  const form = $('#authForm');
  if (form && typeof form.reset === 'function') form.reset();
  const pw = $('#authPassword');
  const toggle = $('#authPasswordToggle');
  if (pw) pw.type = 'password';
  if (toggle) {
    toggle.classList.remove('showing');
    toggle.setAttribute('aria-label', 'Show password');
    toggle.setAttribute('title', 'Show password');
  }
  const ae = $('#authError');
  if (ae) {
    ae.hidden = true;
    ae.textContent = '';
    ae.classList.remove('auth-success');
  }
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

function openBugModal() {
  $('#bugError').hidden = true;
  $('#bugError').textContent = '';
  bugModal.hidden = false;
  bugModal.style.display = 'flex';
}

function closeBugModal() {
  bugModal.hidden = true;
  bugModal.style.display = 'none';
  const form = $('#bugForm');
  if (form && typeof form.reset === 'function') form.reset();
  $('#bugError').hidden = true;
  $('#bugError').textContent = '';
}

async function hydrateSession() {
  if (!state.authToken) {
    state.currentUser = null;
    updateAuthUI();
    return;
  }
  const res = await apiFetch('/api/auth/me');
  if (!res.ok) {
    setAuthToken('');
    state.currentUser = null;
    updateAuthUI();
    return;
  }
  const data = await res.json();
  state.currentUser = data.user || null;
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
  if (state.sort === 'votes_asc') {
    sorted.sort((a, b) => (a.votes || 0) - (b.votes || 0));
  } else if (state.sort === 'recent_desc') {
    sorted.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  } else {
    // votes_desc default
    sorted.sort((a, b) => (b.votes || 0) - (a.votes || 0));
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
    .sort((a, b) => b[1] - a[1])
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
      detailsBodyParts.push(`<div class="card-details-block"><a class="card-details-link" href="${escapeHTML(url)}" target="_blank" rel="noreferrer">Open link</a></div>`);
    }
    if (!detailsBodyParts.length) {
      detailsBodyParts.push(`<p class="card-details-empty muted">No examples or link yet.</p>`);
    }
    const detailsBodyHtml = detailsBodyParts.join('');

    card.innerHTML = `
      <div class="card-title-band" ${titleBandStyleAttr(r.id)}>
        <div class="card-title-band-inner">
          <h3 class="card-title-text">${escapeHTML(r.title)}</h3>
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

function openAddModal() {
  if (!state.currentUser) {
    state.pendingAction = 'openAdd';
    openAuthModal('login');
    return;
  }
  addModal.hidden = false;
  addModal.style.display = 'flex';
}

function closeAddModal() {
  // Hide first; make reset best-effort so we never get stuck open.
  addModal.hidden = true;
  addModal.style.display = 'none';
  const form = $('#addForm');
  try {
    if (form && typeof form.reset === 'function') form.reset();
  } catch (e) {
    // ignore reset errors
  }
}

async function submitAdd(e) {
  e.preventDefault();
  const form = $('#addForm');
  const fd = new FormData(form);

  const payload = {
    title: fd.get('title'),
    tags: fd.get('tags'),
    url: fd.get('url'),
    description: fd.get('description'),
    examples: fd.get('examples'),
  };

  try {
    const res = await apiFetch('/api/resources', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
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
    payload.name = String(fd.get('name') || '').trim();
    const pwErr = validatePasswordClient(payload.password);
    if (pwErr) {
      const errEl = $('#authError');
      errEl.hidden = false;
      errEl.textContent = pwErr;
      updateAuthPasswordRules();
      return;
    }
  }
  if (state.authMode === 'recover') {
    const resForgot = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: payload.email }),
    });
    let dataForgot = {};
    try {
      dataForgot = await resForgot.json();
    } catch {
      dataForgot = {};
    }
    if (!resForgot.ok) {
      const errEl = $('#authError');
      errEl.hidden = false;
      errEl.classList.remove('auth-success');
      errEl.textContent = dataForgot.error || `Request failed (HTTP ${resForgot.status})`;
      return;
    }
    setAuthMode('login');
    const okEl = $('#authError');
    okEl.hidden = false;
    okEl.classList.add('auth-success');
    okEl.textContent = dataForgot.message || 'Check your email for a reset link.';
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
  state.userVotes = {};
  state.pendingAction = null;
  updateAuthUI();
  await refreshAll();
}

async function submitBugReport(e) {
  e.preventDefault();
  const form = $('#bugForm');
  const fd = new FormData(form);
  const payload = {
    title: String(fd.get('title') || '').trim(),
    area: String(fd.get('area') || '').trim(),
    steps: String(fd.get('steps') || '').trim(),
    expected: String(fd.get('expected') || '').trim(),
    actual: String(fd.get('actual') || '').trim(),
    email: String(fd.get('email') || '').trim(),
  };

  const res = await fetch('/api/bug-reports', {
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
  alert('Thanks. Your bug report has been submitted.');
}

function syncHowItWorksPanel() {
  const d = document.getElementById('howItWorks');
  if (!d) return;
  const wide = window.matchMedia('(min-width: 981px)').matches;
  d.open = wide;
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
  $('#addCancel').addEventListener('click', closeAddModal);
  addModal.addEventListener('click', (e) => {
    if (e.target === addModal) closeAddModal();
  });

  $('#addForm').addEventListener('submit', submitAdd);

  // Auth modal + controls
  $('#logoutLink').addEventListener('click', (e) => {
    e.preventDefault();
    if (state.currentUser) logout();
    else openAuthModal('login');
  });
  $('#authClose').addEventListener('click', closeAuthModal);
  $('#authSwitch').addEventListener('click', () => {
    setAuthMode(state.authMode === 'signup' ? 'login' : 'signup');
  });
  $('#authRecover').addEventListener('click', () => setAuthMode('recover'));
  $('#authPassword').addEventListener('input', updateAuthPasswordRules);
  $('#authPasswordToggle').addEventListener('click', () => {
    const input = $('#authPassword');
    const btn = $('#authPasswordToggle');
    if (!input || !btn) return;
    const show = input.type === 'password';
    input.type = show ? 'text' : 'password';
    btn.classList.toggle('showing', show);
    btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    btn.setAttribute('title', show ? 'Hide password' : 'Show password');
  });
  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });
  $('#authForm').addEventListener('submit', submitAuth);

  // Signup splash
  $('#signupSplashOk').addEventListener('click', closeSignupSplash);
  signupSplashModal.addEventListener('click', (e) => {
    if (e.target === signupSplashModal) closeSignupSplash();
  });

  // Bug report
  $('#reportBugLink').addEventListener('click', (e) => {
    e.preventDefault();
    openBugModal();
  });
  $('#bugClose').addEventListener('click', closeBugModal);
  $('#bugCancel').addEventListener('click', closeBugModal);
  bugModal.addEventListener('click', (e) => {
    if (e.target === bugModal) closeBugModal();
  });
  $('#bugForm').addEventListener('submit', submitBugReport);
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

