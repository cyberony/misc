const $ = (sel) => document.querySelector(sel);

const state = {
  allResources: [],
  category: null,
  tag: null,
  q: '',
  sort: 'votes_desc',
};

const detailModal = $('#detailModal');
const addModal = $('#addModal');

let activeDetailId = null;

function escapeHTML(str) {
  return String(str)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function formatVotes(v) {
  const n = Number(v || 0);
  return `${n} vote${n === 1 ? '' : 's'}`;
}

function hashString(s) {
  const str = String(s ?? '');
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h;
}

function getPastelTagStyle(label) {
  // Deterministic “baby color” palette based on tag text.
  const hue = hashString(label) % 360;
  const bg = `hsla(${hue}, 95%, 82%, .55)`;
  const border = `hsla(${hue}, 90%, 58%, .85)`;
  return { bg, border };
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

function getCategoryCounts(resources) {
  const counts = new Map();
  for (const r of resources) {
    const c = String(r.category || 'Uncategorized').trim();
    if (!c) continue;
    counts.set(c, (counts.get(c) || 0) + 1);
  }
  return counts;
}

function applyFilters() {
  const q = state.q.trim().toLowerCase();
  let out = state.allResources;

  if (state.category) {
    out = out.filter(r => String(r.category || '') === state.category);
  }
  if (state.tag) {
    const t = state.tag.trim().toLowerCase();
    out = out.filter(r => (r.tags || []).some(x => String(x).trim().toLowerCase() === t));
  }
  if (q) {
    out = out.filter(r => {
      const hay = [
        r.title,
        r.category,
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
  if (state.category) parts.push(`Category: ${state.category}`);
  if (state.tag) parts.push(`Tag: ${state.tag}`);
  if (state.q.trim()) parts.push(`Search: “${state.q.trim()}”`);
  $('#activeFilters').textContent = parts.length ? parts.join(' · ') : '';
}

function renderSidebar() {
  const all = state.allResources;

  const cats = [...getCategoryCounts(all).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 12);

  const tags = [...getTagCounts(all).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18);

  const catList = $('#categoryList');
  catList.innerHTML = '';
  for (const [cat, count] of cats) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-pill';
    btn.textContent = `${cat} (${count})`;
    btn.onclick = () => {
      state.category = cat;
      setActiveFiltersPill();
      renderGrid();
      renderSidebar(); // highlight via re-render
    };
    if (state.category === cat) btn.style.borderColor = 'rgba(124,92,255,.65)';
    catList.appendChild(btn);
  }

  const tagList = $('#tagList');
  tagList.innerHTML = '';
  for (const [t, count] of tags) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'tag-pill';
    btn.textContent = `${t} (${count})`;

    const { bg, border } = getPastelTagStyle(t);
    btn.style.backgroundColor = bg;
    btn.style.borderColor = border;

    btn.onclick = () => {
      state.tag = t;
      // Tag filtering should always be intuitive: a tag click should not be blocked by an
      // already-selected category/search.
      state.category = null;
      state.q = '';
      setActiveFiltersPill();
      renderGrid();
      renderSidebar(); // highlight selection
    };
    if (state.tag === t) btn.style.borderColor = 'rgba(37,99,235,.90)';
    tagList.appendChild(btn);
  }
}

function renderGrid() {
  const list = applySort(applyFilters());
  const grid = $('#resourceGrid');
  grid.innerHTML = '';

  $('#resultCount').textContent = `${list.length} item${list.length === 1 ? '' : 's'}`;
  setActiveFiltersPill();

  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'panel note';
    empty.textContent = 'No matching resources yet. Try clearing filters or add the first one!';
    grid.appendChild(empty);
    return;
  }

  for (const r of list) {
    const card = document.createElement('div');
    card.className = 'card';
    card.setAttribute('role', 'listitem');

    const tags = (r.tags || []).slice(0, 4);
    const tagHtml = tags.map(t => {
      const { bg, border } = getPastelTagStyle(t);
      const key = String(t).trim().toLowerCase();
      return `
        <span
          class="tag-pill"
          data-tag="${escapeHTML(key)}"
          style="background-color:${bg}; border-color:${border};"
        >${escapeHTML(t)}</span>
      `;
    }).join('');

    card.innerHTML = `
      <div class="card-top">
        <div style="min-width:0">
          <div class="cat-pill">${escapeHTML(r.category || 'Uncategorized')}</div>
          <h3>${escapeHTML(r.title)}</h3>
        </div>
        <div class="votes">${escapeHTML(formatVotes(r.votes || 0))}</div>
      </div>

      <p class="desc">${escapeHTML(r.description || '')}</p>

      <div class="chips" style="margin-top:-2px">
        ${tagHtml}
        ${Math.max(0, (r.tags || []).length - tags.length) ? `<span class="muted" style="font-size:12px">+${Math.max(0,(r.tags||[]).length-tags.length)} more</span>` : ''}
      </div>

      <div class="card-actions">
        <button class="btn ghost" type="button" data-view="${escapeHTML(r.id)}">View</button>
        <div class="vote">
          <button class="btn ghost small" type="button" data-vote="${escapeHTML(r.id)}" data-delta="-1">-1</button>
          <button class="btn primary small" type="button" data-vote="${escapeHTML(r.id)}" data-delta="1">+1</button>
        </div>
      </div>
    `;

    // tag clicks
    for (const el of card.querySelectorAll('[data-tag]')) {
      el.addEventListener('click', () => {
        state.tag = el.getAttribute('data-tag');
        state.category = null;
        state.q = '';
        setActiveFiltersPill();
        renderGrid();
        renderSidebar(); // highlight selection
      });
    }

    card.querySelector('[data-view]').addEventListener('click', () => openDetail(r.id));
    card.querySelectorAll('[data-vote]').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.getAttribute('data-vote');
        const delta = Number(btn.getAttribute('data-delta'));
        vote(id, delta);
      });
    });

    grid.appendChild(card);
  }
}

async function refreshAll() {
  const res = await fetch('/api/resources');
  if (!res.ok) throw new Error(`Failed to load: ${res.status}`);
  const data = await res.json();
  state.allResources = Array.isArray(data.resources) ? data.resources : [];
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
  $('#detailCategory').textContent = r.category || 'Uncategorized';
  $('#detailVotes').textContent = formatVotes(r.votes || 0);

  $('#detailDesc').textContent = r.description || '';

  // tags
  const tagPills = $('#detailTagPills');
  tagPills.innerHTML = '';
  for (const t of (r.tags || [])) {
    const el = document.createElement('span');
    el.className = 'tag-pill';
    el.textContent = t;
    const { bg, border } = getPastelTagStyle(t);
    el.style.backgroundColor = bg;
    el.style.borderColor = border;
    el.onclick = () => {
      state.tag = String(t).trim().toLowerCase();
      state.category = null;
      state.q = '';
      detailModal.hidden = true;
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

  detailModal.hidden = false;
}

function closeDetail() {
  detailModal.hidden = true;
  activeDetailId = null;
}

async function vote(id, delta) {
  const up = $('#voteUp');
  const down = $('#voteDown');
  // Disable to avoid rapid double-clicks
  if (activeDetailId === id) {
    up.disabled = true;
    down.disabled = true;
  }

  const res = await fetch(`/api/resources/${encodeURIComponent(id)}/vote`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ delta }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    alert(err.error || 'Vote failed');
    return;
  }

  await refreshAll();
  if (activeDetailId) {
    await openDetail(activeDetailId);
  }
}

function openAddModal() {
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
    category: fd.get('category'),
    tags: fd.get('tags'),
    url: fd.get('url'),
    description: fd.get('description'),
    examples: fd.get('examples'),
  };

  try {
    const res = await fetch('/api/resources', {
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

function wireUI() {
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

  // Clear filters
  $('#clearCategory').addEventListener('click', () => {
    state.category = null;
    renderGrid();
    renderSidebar();
  });
  $('#clearTag').addEventListener('click', () => {
    state.tag = null;
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
}

wireUI();
refreshAll().catch(err => {
  console.error(err);
  alert('Failed to load resources. Check server logs.');
});

