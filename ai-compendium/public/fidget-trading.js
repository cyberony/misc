/**
 * Fidget Trading — two-player turn game; P2 is AI.
 * Drag from your inventory to Offering, from computer inventory to Asking for.
 * Check = accept, Plus = ask for one more (then drag), Cross = reject and return all.
 */

if (new URLSearchParams(window.location.search).get('embed') === '1') {
  document.body.classList.add('embed-shell');
}

const NS = 'http://www.w3.org/2000/svg';

/** @param {string} inner @param {string} [viewBox] */
function svgWrap(inner, viewBox = '0 0 64 64') {
  return `<svg xmlns="${NS}" viewBox="${viewBox}" class="ft-fidget-svg" width="64" height="64" aria-hidden="true">${inner}</svg>`;
}

/** Plastic-style gradients + shapes — 20 distinct “3D” toys */
const FIDGET_KINDS = [
  // 0 pop-it heart-ish
  () =>
    svgWrap(
      `<defs><linearGradient id="g0" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#93c5fd"/><stop offset="45%" stop-color="#3b82f6"/><stop offset="100%" stop-color="#1d4ed8"/></linearGradient></defs>
      <ellipse cx="32" cy="54" rx="18" ry="5" fill="rgba(0,0,0,.12)"/>
      <path d="M32 8 C48 8 56 22 56 36 C56 48 44 56 32 56 C20 56 8 48 8 36 C8 22 16 8 32 8Z" fill="url(#g0)" stroke="#1e40af" stroke-width="1.2"/>
      <circle cx="24" cy="30" r="5" fill="#dbeafe" stroke="#1e3a8a" stroke-width="0.8"/><circle cx="40" cy="30" r="5" fill="#dbeafe" stroke="#1e3a8a" stroke-width="0.8"/>
      <circle cx="32" cy="40" r="5" fill="#bfdbfe" stroke="#1e3a8a" stroke-width="0.8"/>`,
    ),
  // 1 pea pod
  () =>
    svgWrap(
      `<defs><linearGradient id="g1" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#86efac"/><stop offset="100%" stop-color="#16a34a"/></linearGradient></defs>
      <ellipse cx="32" cy="54" rx="20" ry="5" fill="rgba(0,0,0,.1)"/>
      <path d="M12 28 Q32 8 52 28 Q52 44 32 50 Q12 44 12 28Z" fill="url(#g1)" stroke="#14532d" stroke-width="1.2"/>
      <circle cx="22" cy="30" r="7" fill="#bbf7d0" stroke="#166534"/><circle cx="32" cy="32" r="7" fill="#bbf7d0" stroke="#166534"/><circle cx="42" cy="30" r="7" fill="#bbf7d0" stroke="#166534"/>`,
    ),
  // 2 spinner triangle
  () =>
    svgWrap(
      `<defs><linearGradient id="g2" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#f9a8d4"/><stop offset="100%" stop-color="#db2777"/></linearGradient></defs>
      <ellipse cx="32" cy="52" rx="14" ry="4" fill="rgba(0,0,0,.12)"/>
      <circle cx="32" cy="32" r="22" fill="#fce7f3" stroke="#be185d" stroke-width="2"/>
      <path d="M32 14 L46 40 L18 40 Z" fill="url(#g2)" stroke="#9d174d" stroke-width="1"/>
      <circle cx="32" cy="32" r="5" fill="#fff" stroke="#9d174d"/>`,
    ),
  // 3 cube
  () =>
    svgWrap(
      `<defs><linearGradient id="g3" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fde047"/><stop offset="100%" stop-color="#ca8a04"/></linearGradient></defs>
      <path d="M32 12 L50 22 L50 42 L32 52 L14 42 L14 22 Z" fill="url(#g3)" stroke="#a16207" stroke-width="1.2"/>
      <path d="M14 22 L32 12 L50 22 L32 32 Z" fill="#fef08a" stroke="#a16207" stroke-width="0.8"/>
      <path d="M32 32 L50 22 L50 42 L32 52 Z" fill="#eab308" stroke="#a16207" stroke-width="0.8"/>`,
    ),
  // 4 donut ring
  () =>
    svgWrap(
      `<defs><linearGradient id="g4" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#c4b5fd"/><stop offset="100%" stop-color="#6d28d9"/></linearGradient></defs>
      <ellipse cx="32" cy="50" rx="16" ry="4" fill="rgba(0,0,0,.1)"/>
      <circle cx="32" cy="30" r="20" fill="url(#g4)" stroke="#5b21b6" stroke-width="1.5"/>
      <circle cx="32" cy="30" r="9" fill="#faf5ff" stroke="#6d28d9"/>`,
    ),
  // 5 ball
  () =>
    svgWrap(
      `<defs><radialGradient id="g5" cx="35%" cy="30%" r="70%"><stop offset="0%" stop-color="#fff"/><stop offset="40%" stop-color="#fb923c"/><stop offset="100%" stop-color="#c2410c"/></radialGradient></defs>
      <ellipse cx="32" cy="52" rx="14" ry="4" fill="rgba(0,0,0,.12)"/>
      <circle cx="32" cy="30" r="20" fill="url(#g5)" stroke="#9a3412" stroke-width="1"/>`,
    ),
  // 6 coil spring
  () =>
    svgWrap(
      `<defs><linearGradient id="g6" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="#67e8f9"/><stop offset="100%" stop-color="#0891b2"/></linearGradient></defs>
      <path d="M20 48 Q32 8 44 48" fill="none" stroke="url(#g6)" stroke-width="6" stroke-linecap="round"/>
      <path d="M22 40 Q32 16 42 40" fill="none" stroke="#0e7490" stroke-width="3" stroke-linecap="round"/>`,
    ),
  // 7 gem
  () =>
    svgWrap(
      `<defs><linearGradient id="g7" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#fecdd3"/><stop offset="100%" stop-color="#e11d48"/></linearGradient></defs>
      <path d="M32 10 L48 24 L40 48 L24 48 L16 24 Z" fill="url(#g7)" stroke="#9f1239" stroke-width="1.2"/>
      <path d="M32 10 L16 24 L24 48 L32 36 L40 48 L48 24 Z" fill="none" stroke="#881337" stroke-width="0.6" opacity="0.6"/>`,
    ),
  // 8 disc
  () =>
    svgWrap(
      `<defs><linearGradient id="g8" x1="0%" y1="0%" x2="0%" y2="100%"><stop offset="0%" stop-color="#a7f3d0"/><stop offset="100%" stop-color="#059669"/></linearGradient></defs>
      <ellipse cx="32" cy="48" rx="18" ry="5" fill="rgba(0,0,0,.1)"/>
      <ellipse cx="32" cy="30" rx="22" ry="8" fill="url(#g8)" stroke="#047857"/>
      <ellipse cx="32" cy="26" rx="16" ry="5" fill="#ecfdf5" opacity="0.9"/>`,
    ),
  // 9 joystick
  () =>
    svgWrap(
      `<rect x="14" y="40" width="36" height="12" rx="3" fill="#64748b" stroke="#334155"/>
      <rect x="26" y="18" width="12" height="26" rx="2" fill="#94a3b8" stroke="#334155"/>
      <circle cx="32" cy="16" r="10" fill="#ef4444" stroke="#991b1b"/>`,
    ),
];

// Pad with variations using hue shifts via distinct shapes — add 11–19 as remixes
const EXTRA = [
  () =>
    svgWrap(
      `<defs><linearGradient id="ga" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#fcd34d"/><stop offset="100%" stop-color="#b45309"/></linearGradient></defs>
      <rect x="10" y="18" width="44" height="28" rx="6" fill="url(#ga)" stroke="#92400e"/>
      <circle cx="22" cy="32" r="5" fill="#fffbeb"/><circle cx="32" cy="32" r="5" fill="#fffbeb"/><circle cx="42" cy="32" r="5" fill="#fffbeb"/>`,
    ),
  () =>
    svgWrap(
      `<ellipse cx="32" cy="52" rx="18" ry="4" fill="rgba(0,0,0,.1)"/>
      <rect x="16" y="12" width="32" height="32" rx="8" fill="#38bdf8" stroke="#0369a1" stroke-width="1.5"/>
      <circle cx="26" cy="26" r="4" fill="#e0f2fe"/><circle cx="38" cy="26" r="4" fill="#e0f2fe"/><circle cx="32" cy="36" r="4" fill="#e0f2fe"/>`,
    ),
  () =>
    svgWrap(
      `<path d="M32 8 L54 54 L10 54 Z" fill="#a78bfa" stroke="#5b21b6" stroke-width="1.2"/>
      <circle cx="32" cy="36" r="8" fill="#ddd6fe" stroke="#5b21b6"/>`,
    ),
  () =>
    svgWrap(
      `<ellipse cx="32" cy="50" rx="20" ry="5" fill="rgba(0,0,0,.1)"/>
      <ellipse cx="32" cy="28" rx="24" ry="20" fill="#f472b6" stroke="#be185d"/>
      <ellipse cx="26" cy="24" rx="6" ry="5" fill="#fbcfe8"/><ellipse cx="38" cy="24" rx="6" ry="5" fill="#fbcfe8"/>`,
    ),
  () =>
    svgWrap(
      `<rect x="12" y="20" width="40" height="24" rx="4" fill="#34d399" stroke="#047857"/>
      <path d="M16 28 H48 M16 36 H48" stroke="#065f46" stroke-width="1.5"/>`,
    ),
  () =>
    svgWrap(
      `<circle cx="32" cy="32" r="22" fill="#1e293b" stroke="#0f172a"/>
      <circle cx="32" cy="32" r="16" fill="#334155"/>
      <circle cx="28" cy="28" r="4" fill="#94a3b8"/><circle cx="38" cy="36" r="3" fill="#64748b"/>`,
    ),
  () =>
    svgWrap(
      `<path d="M8 40 Q32 4 56 40" fill="none" stroke="#f472b6" stroke-width="8" stroke-linecap="round"/>
      <circle cx="32" cy="40" r="6" fill="#ec4899"/>`,
    ),
  () =>
    svgWrap(
      `<defs><radialGradient id="gb" cx="30%" cy="30%"><stop offset="0%" stop-color="#fff"/><stop offset="100%" stop-color="#14b8a6"/></radialGradient></defs>
      <ellipse cx="32" cy="50" rx="14" ry="4" fill="rgba(0,0,0,.1)"/>
      <rect x="18" y="14" width="28" height="32" rx="6" fill="url(#gb)" stroke="#0f766e"/>`,
    ),
  () =>
    svgWrap(
      `<polygon points="32,6 58,52 6,52" fill="#fbbf24" stroke="#d97706"/>
      <circle cx="32" cy="38" r="10" fill="#fde68a" stroke="#d97706"/>`,
    ),
  () =>
    svgWrap(
      `<ellipse cx="32" cy="52" rx="16" ry="4" fill="rgba(0,0,0,.1)"/>
      <path d="M12 32 Q32 8 52 32 Q32 48 12 32" fill="#818cf8" stroke="#4338ca"/>`,
    ),
  () =>
    svgWrap(
      `<rect x="14" y="14" width="36" height="36" rx="4" fill="#fda4af" stroke="#e11d48"/>
      <circle cx="24" cy="26" r="3" fill="#fff"/><circle cx="40" cy="26" r="3" fill="#fff"/>
      <path d="M22 38 Q32 44 42 38" fill="none" stroke="#9f1239" stroke-width="2" stroke-linecap="round"/>`,
    ),
];

const ALL_KINDS = [...FIDGET_KINDS, ...EXTRA];

function kindSvg(kind, uniq) {
  const suf = String(uniq || 'x').replace(/[^a-zA-Z0-9]/g, '');
  let html = ALL_KINDS[kind % ALL_KINDS.length]();
  html = html.replace(/url\(#([^)]+)\)/g, (_, id) => `url(#${id}_${suf})`);
  html = html.replace(/\bid="([^"]+)"/g, (_, id) => `id="${id}_${suf}"`);
  return html;
}

let nextId = 0;
function makeItem(kind, owner) {
  return {
    id: `f-${nextId++}`,
    kind,
    owner,
  };
}

/** @type {{ id: string, kind: number, owner: 'p1'|'p2' }[]} */
let items = [];

/** @type {'p1_build'|'p1_review'|'ai_think'|'p2_build'} */
let phase = 'p1_build';

/** Who is proposing the current staged trade */
let proposer = 'p1';

/** After Plus: next drag from opponent adds to “take” */
let plusPickActive = false;

const zones = {
  give: [],
  take: [],
};

const els = {
  invP1: null,
  invP2: null,
  dropGive: null,
  dropTake: null,
  status: null,
  phaseLabel: null,
  rowP1: null,
  rowP2: null,
};

function resetCenter() {
  zones.give = [];
  zones.take = [];
}

function itemById(id) {
  return items.find((x) => x.id === id);
}

function returnCenterToInventories() {
  for (const id of [...zones.give, ...zones.take]) {
    const it = itemById(id);
    if (it) {
      /* items stay in items[] — zone is implicit from DOM placement */
    }
  }
  resetCenter();
}

function executeTrade() {
  plusPickActive = false;
  const giveIds = new Set(zones.give);
  const takeIds = new Set(zones.take);
  if (proposer === 'p1') {
    for (const id of giveIds) {
      const it = itemById(id);
      if (it) it.owner = 'p2';
    }
    for (const id of takeIds) {
      const it = itemById(id);
      if (it) it.owner = 'p1';
    }
  } else {
    for (const id of giveIds) {
      const it = itemById(id);
      if (it) it.owner = 'p1';
    }
    for (const id of takeIds) {
      const it = itemById(id);
      if (it) it.owner = 'p2';
    }
  }
  resetCenter();
}

function rejectTrade() {
  plusPickActive = false;
  returnCenterToInventories();
}

function initItems() {
  items = [];
  nextId = 0;
  for (let i = 0; i < 10; i++) items.push(makeItem(i, 'p1'));
  for (let i = 0; i < 10; i++) items.push(makeItem(10 + i, 'p2'));
  resetCenter();
}

function inventoryIds(owner) {
  const inCenter = new Set([...zones.give, ...zones.take]);
  return items.filter((it) => it.owner === owner && !inCenter.has(it.id)).map((it) => it.id);
}

function zoneForItemId(id) {
  if (zones.give.includes(id)) return 'give';
  if (zones.take.includes(id)) return 'take';
  const it = itemById(id);
  if (!it) return null;
  return it.owner === 'p1' ? 'p1-inv' : 'p2-inv';
}

function moveItemToZone(id, z) {
  const it = itemById(id);
  if (!it) return false;
  zones.give = zones.give.filter((x) => x !== id);
  zones.take = zones.take.filter((x) => x !== id);
  if (z === 'give') {
    if (it.owner !== proposer) return false;
    zones.give.push(id);
    return true;
  }
  if (z === 'take') {
    const other = proposer === 'p1' ? 'p2' : 'p1';
    if (it.owner !== other) return false;
    zones.take.push(id);
    return true;
  }
  if (z === 'p1-inv' || z === 'p2-inv') {
    return true;
  }
  return false;
}

function removeFromZoneLists(id) {
  zones.give = zones.give.filter((x) => x !== id);
  zones.take = zones.take.filter((x) => x !== id);
}

/** Drag from inventory or center back */
function placeItemInInventory(id, owner) {
  removeFromZoneLists(id);
  const it = itemById(id);
  if (it) it.owner = owner;
}

function canDragStart(id) {
  const it = itemById(id);
  if (!it) return false;
  if (phase === 'ai_think') return false;
  if (phase === 'p1_build' && proposer === 'p1') {
    const z = zoneForItemId(id);
    if (z === 'give' || z === 'take') return true;
    if (it.owner === 'p1' && z === 'p1-inv') return true;
    if (it.owner === 'p2' && z === 'p2-inv') return true;
    return false;
  }
  if (phase === 'p1_review' && proposer === 'p2') {
    const z = zoneForItemId(id);
    if (z === 'give' || z === 'take') return false;
    if (plusPickActive && it.owner === 'p2' && z === 'p2-inv') return true;
    return false;
  }
  if (phase === 'p2_build') return false;
  return false;
}

function allowDropTarget(zoneKind, draggedId) {
  const it = itemById(draggedId);
  if (!it) return false;
  if (zoneKind === 'give') return it.owner === proposer;
  if (zoneKind === 'take') {
    const other = proposer === 'p1' ? 'p2' : 'p1';
    return it.owner === other;
  }
  if (zoneKind === 'p1-inv') return it.owner === 'p1';
  if (zoneKind === 'p2-inv') return it.owner === 'p2';
  return false;
}

function renderFidgetButton(id) {
  const it = itemById(id);
  if (!it) return '';
  const draggable = canDragStart(id) ? 'true' : 'false';
  return `<div class="ft-fidget" draggable="${draggable}" data-item-id="${id}" title="Fidget ${it.kind + 1}">${kindSvg(it.kind, id)}</div>`;
}

function renderZone(container, ids) {
  if (!container) return;
  container.innerHTML = ids.map((id) => renderFidgetButton(id)).join('');
  container.querySelectorAll('.ft-fidget').forEach((el) => wireDrag(el));
}

function fullRender() {
  renderZone(els.invP1, inventoryIds('p1'));
  renderZone(els.invP2, inventoryIds('p2'));
  renderZone(document.getElementById('ftDropGiveItems'), zones.give);
  renderZone(document.getElementById('ftDropTakeItems'), zones.take);
  updateChrome();
}

function updateChrome() {
  const st = els.status;
  const pl = els.phaseLabel;
  if (plusPickActive && st) {
    st.textContent = 'Drag one more toy from the computer’s shelf into Offering (what you get).';
    if (pl) pl.textContent = 'Ask for more — one drag from the computer’s shelf';
  }
  if (pl && !plusPickActive) {
    if (phase === 'p1_build' && proposer === 'p1') {
      pl.textContent = 'Your turn — drag toys into Offering / Asking for, then ✓ to propose.';
    } else if (phase === 'ai_think') {
      pl.textContent = 'Computer is deciding…';
    } else if (phase === 'p1_review' && proposer === 'p2') {
      pl.textContent = 'Computer proposed a trade — respond with the bottom row.';
    } else if (phase === 'p2_build') {
      pl.textContent = 'Computer is building an offer…';
    }
  }
  const p1Active = phase === 'p1_build' && proposer === 'p1';
  const p1Review = phase === 'p1_review' && proposer === 'p2';

  document.querySelectorAll('[data-ft-role="p1"]').forEach((btn) => {
    const act = btn.getAttribute('data-ft-act');
    let on = false;
    if (p1Active) on = act === 'accept' || act === 'reject';
    if (p1Review) on = act === 'accept' || act === 'reject' || act === 'plus';
    btn.disabled = !on;
    btn.classList.toggle('ft-pad--disabled', !on);
  });
  document.querySelectorAll('[data-ft-role="p2"]').forEach((btn) => {
    btn.disabled = true;
    btn.classList.add('ft-pad--disabled');
  });

  if (st && !plusPickActive) {
    if (phase === 'ai_think') {
      st.textContent = 'Computer is thinking about your offer…';
    } else if (phase === 'p1_build' && proposer === 'p1') {
      st.textContent = 'Offer your toys on the left pile; pick what you want from the computer on the right pile. ✓ proposes; ✕ clears.';
    } else if (phase === 'p1_review') {
      st.textContent = '✓ accept · ✕ reject (everything returns) · + then drag one more computer toy into Offering.';
    } else if (phase === 'p2_build') {
      st.textContent = 'Computer is setting up its offer…';
    }
  }
}

function wireDrag(el) {
  const id = el.getAttribute('data-item-id');
  if (!id) return;
  el.addEventListener('dragstart', (e) => {
    if (!canDragStart(id)) {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData('text/plain', id);
    e.dataTransfer.effectAllowed = 'move';
  });
}

function wireDropZone(zoneEl, zoneKind) {
  zoneEl.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  });
  zoneEl.addEventListener('drop', (e) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/plain');
    if (!id || !allowDropTarget(zoneKind, id)) return;
    if (zoneKind === 'give' || zoneKind === 'take') {
      if (
        plusPickActive &&
        zoneKind === 'give' &&
        phase === 'p1_review' &&
        proposer === 'p2' &&
        itemById(id)?.owner === 'p2'
      ) {
        moveItemToZone(id, 'give');
        plusPickActive = false;
        fullRender();
        return;
      }
      moveItemToZone(id, zoneKind);
      fullRender();
      return;
    }
    if (zoneKind === 'p1-inv' || zoneKind === 'p2-inv') {
      const it = itemById(id);
      if (!it) return;
      placeItemInInventory(id, zoneKind === 'p1-inv' ? 'p1' : 'p2');
      fullRender();
    }
  });
}

function wirePads() {
  document.querySelectorAll('[data-ft-role="p1"]').forEach((btn) => {
    btn.addEventListener('click', () => onP1Pad(btn.getAttribute('data-ft-act')));
  });
}

function onP1Pad(act) {
  if (phase === 'p1_build' && proposer === 'p1') {
    if (act === 'accept') {
      if (zones.give.length === 0 && zones.take.length === 0) {
        if (els.status) els.status.textContent = 'Add at least one toy to Offering or Asking for.';
        return;
      }
      phase = 'ai_think';
      fullRender();
      setTimeout(aiRespondToP1, 700);
    } else if (act === 'reject') {
      rejectTrade();
      fullRender();
      if (els.status) els.status.textContent = 'Cleared. Drag toys to try again.';
    }
    return;
  }
  if (phase === 'p1_review' && proposer === 'p2') {
    if (act === 'accept') {
      executeTrade();
      proposer = 'p1';
      phase = 'p1_build';
      plusPickActive = false;
      if (els.status) els.status.textContent = 'Trade completed! Your turn to propose again.';
      fullRender();
    } else if (act === 'reject') {
      rejectTrade();
      proposer = 'p1';
      phase = 'p1_build';
      plusPickActive = false;
      if (els.status) els.status.textContent = 'Rejected. Your turn to propose a new trade.';
      fullRender();
    } else if (act === 'plus') {
      plusPickActive = true;
      fullRender();
    }
  }
}

function flashAiButton(which) {
  const btn = document.querySelector(`[data-ft-role="p2"][data-ft-act="${which}"]`);
  if (!btn) return;
  btn.classList.add('ft-pad--flash');
  setTimeout(() => btn.classList.remove('ft-pad--flash'), 600);
}

function aiRespondToP1() {
  const giveN = zones.give.length;
  const takeN = zones.take.length;
  if (giveN === 0 && takeN === 0) {
    phase = 'p1_build';
    fullRender();
    return;
  }

  const r = Math.random();
  let decision = 'reject';
  if (r < 0.42) decision = 'accept';
  else if (r < 0.72) decision = 'plus';
  else decision = 'reject';

  if (decision === 'accept') {
    flashAiButton('accept');
    setTimeout(() => {
      executeTrade();
      proposer = 'p2';
      phase = 'p2_build';
      if (els.status) els.status.textContent = 'Computer accepted! Its turn to propose…';
      fullRender();
      setTimeout(aiBuildOffer, 900);
    }, 400);
    return;
  }
  if (decision === 'plus') {
    flashAiButton('plus');
    setTimeout(() => {
      const p1Pool = inventoryIds('p1');
      if (p1Pool.length) {
        const pick = p1Pool[Math.floor(Math.random() * p1Pool.length)];
        moveItemToZone(pick, 'take');
        if (els.status) els.status.textContent = 'Computer wants more — adjust your offer and press ✓ again.';
      } else {
        if (els.status) els.status.textContent = 'Computer passes on demanding more.';
      }
      phase = 'p1_build';
      fullRender();
    }, 400);
    return;
  }
  flashAiButton('reject');
  setTimeout(() => {
    rejectTrade();
    proposer = 'p2';
    phase = 'p2_build';
    if (els.status) els.status.textContent = 'Computer rejected. Its turn to propose…';
    fullRender();
    setTimeout(aiBuildOffer, 800);
  }, 400);
}

function aiBuildOffer() {
  const p2 = inventoryIds('p2');
  const p1 = inventoryIds('p1');
  proposer = 'p2';
  resetCenter();
  if (p2.length === 0 || p1.length === 0) {
    phase = 'p1_build';
    proposer = 'p1';
    if (els.status) els.status.textContent = 'Not enough toys left to trade. Reset the page to play again.';
    fullRender();
    return;
  }
  const ng = 1 + Math.floor(Math.random() * Math.min(3, p2.length));
  const nt = 1 + Math.floor(Math.random() * Math.min(3, p1.length));
  const sh2 = [...p2].sort(() => Math.random() - 0.5);
  const sh1 = [...p1].sort(() => Math.random() - 0.5);
  for (let i = 0; i < Math.min(ng, sh2.length); i++) moveItemToZone(sh2[i], 'give');
  for (let i = 0; i < Math.min(nt, sh1.length); i++) moveItemToZone(sh1[i], 'take');
  phase = 'p1_review';
  if (els.status) els.status.textContent = 'Computer’s offer is on the table. Your move (bottom row).';
  fullRender();
}

function init() {
  els.invP1 = document.getElementById('ftInvP1');
  els.invP2 = document.getElementById('ftInvP2');
  els.dropGive = document.getElementById('ftDropGive');
  els.dropTake = document.getElementById('ftDropTake');
  els.status = document.getElementById('ftStatus');
  els.phaseLabel = document.getElementById('ftPhaseLabel');
  els.rowP1 = document.getElementById('ftRowP1');
  els.rowP2 = document.getElementById('ftRowP2');

  initItems();
  wirePads();
  wireDropZone(els.invP1, 'p1-inv');
  wireDropZone(els.invP2, 'p2-inv');
  wireDropZone(document.getElementById('ftDropGive'), 'give');
  wireDropZone(document.getElementById('ftDropTake'), 'take');

  fullRender();
}

init();
