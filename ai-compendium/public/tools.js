const $ = (sel) => document.querySelector(sel);

const TOOL_SRC = {
  alumni: '/alumni-table.html?embed=1',
  reminders: '/reminders.html?embed=1',
  accounts: '/admin-accounts.html?embed=1',
};

function authHeaders() {
  const token = localStorage.getItem('msai_auth_token') || '';
  const h = {};
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

/** Fixed fast drift speed; heavy random vertical lane each crossing (tools hub). */
function wireToolsHubCatLaneOffset() {
  const mover = document.querySelector('.tools-hub-cat-mover');
  if (!mover || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const spread = 96;
  function rnd4() {
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const buf = new Uint32Array(4);
      crypto.getRandomValues(buf);
      return [buf[0] / 2 ** 32, buf[1] / 2 ** 32, buf[2] / 2 ** 32, buf[3] / 2 ** 32];
    }
    return [Math.random(), Math.random(), Math.random(), Math.random()];
  }
  function apply() {
    const [a, b, c, d] = rnd4();
    /* Lane: blend several independent swings so crossings land in different bands. */
    const lane1 = (a * 2 - 1) * spread;
    const lane2 = (b * 2 - 1) * spread * 0.72;
    const lane3 = (c * 2 - 1) * spread * 0.48;
    let accent = 0;
    if (d < 0.2) {
      const k = (d / 0.2) * 2 - 1;
      accent = k * spread * 0.68;
    }
    let y = lane1 * 0.42 + lane2 * 0.33 + lane3 * 0.22 + accent * 0.35;
    y = Math.round(Math.max(-spread, Math.min(spread, y)));
    mover.style.setProperty('--tools-hub-cat-y-offset', `${y}px`);
  }
  apply();
  mover.addEventListener('animationiteration', apply);
}

function lineSegmentsIntersect(a1x, a1y, a2x, a2y, b1x, b1y, b2x, b2y) {
  const dx1 = a2x - a1x;
  const dy1 = a2y - a1y;
  const dx2 = b2x - b1x;
  const dy2 = b2y - b1y;
  const d = dx1 * dy2 - dy1 * dx2;
  if (Math.abs(d) < 1e-10) return false;
  const t = ((b1x - a1x) * dy2 - (b1y - a1y) * dx2) / d;
  const u = ((b1x - a1x) * dy1 - (b1y - a1y) * dx1) / d;
  return t >= 0 && t <= 1 && u >= 0 && u <= 1;
}

function segmentIntersectsRect(x1, y1, x2, y2, rx, ry, rw, rh) {
  const rx2 = rx + rw;
  const ry2 = ry + rh;
  const inside = (x, y) => x >= rx && x <= rx2 && y >= ry && y <= ry2;
  if (inside(x1, y1) || inside(x2, y2)) return true;
  if (lineSegmentsIntersect(x1, y1, x2, y2, rx, ry, rx2, ry)) return true;
  if (lineSegmentsIntersect(x1, y1, x2, y2, rx2, ry, rx2, ry2)) return true;
  if (lineSegmentsIntersect(x1, y1, x2, y2, rx2, ry2, rx, ry2)) return true;
  if (lineSegmentsIntersect(x1, y1, x2, y2, rx, ry2, rx, ry)) return true;
  return false;
}

function pointInPolygonRay(px, py, poly) {
  let inside = false;
  const n = poly.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = poly[i].x;
    const yi = poly[i].y;
    const xj = poly[j].x;
    const yj = poly[j].y;
    const denom = yj - yi;
    if (Math.abs(denom) < 1e-10) continue;
    if ((yi > py) === (yj > py)) continue;
    const xInters = xi + ((py - yi) * (xj - xi)) / denom;
    if (px < xInters) inside = !inside;
  }
  return inside;
}

/** Blue lasso; valid closed loop (no crossing the cat) stops it; click (tap) on the lane to go again. */
function wireToolsHubCatLasso() {
  const lane = document.querySelector('.tools-hub-cat-lane');
  const canvas = document.querySelector('.tools-hub-cat-draw');
  const mover = document.querySelector('.tools-hub-cat-mover');
  const img = document.querySelector('.tools-hub-cat-img');
  if (!lane || !canvas || !mover || !img) return;

  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  let points = [];
  let drawing = false;
  let activePointerId = null;
  let resumeOnly = false;
  let didDrag = false;
  let dragStartTime = 0;
  const DRAG_THRESHOLD = 8;

  function syncCanvasSize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = lane.clientWidth;
    const h = lane.clientHeight;
    if (w < 2 || h < 2) return;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  syncCanvasSize();
  const ro = new ResizeObserver(() => syncCanvasSize());
  ro.observe(lane);

  function clientToPoint(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return { x: clientX - r.left, y: clientY - r.top };
  }

  function catRectInCanvas() {
    const cr = canvas.getBoundingClientRect();
    const ir = img.getBoundingClientRect();
    return {
      x: ir.left - cr.left,
      y: ir.top - cr.top,
      w: ir.width,
      h: ir.height,
    };
  }

  function tryComplete() {
    const r = canvas.getBoundingClientRect();
    const w = r.width;
    const h = r.height;
    const closeMax = Math.max(56, Math.min(w, h) * 0.22);
    if (points.length < 3) return false;
    const p0 = points[0];
    const pL = points[points.length - 1];
    const closeDist = Math.hypot(pL.x - p0.x, pL.y - p0.y);
    if (closeDist > closeMax) return false;

    const catEnd = catRectInCanvas();
    if (catEnd.w < 4 || catEnd.h < 4) return false;

    function strokeHitsCatRect(rx, ry, rw, rh) {
      const pad = 4;
      let ix = rx + pad;
      let iy = ry + pad;
      let iw = rw - 2 * pad;
      let ih = rh - 2 * pad;
      if (iw < 4 || ih < 4) {
        ix = rx;
        iy = ry;
        iw = rw;
        ih = rh;
      }
      for (let i = 0; i < points.length - 1; i++) {
        const a = points[i];
        const b = points[i + 1];
        if (segmentIntersectsRect(a.x, a.y, b.x, b.y, ix, iy, iw, ih)) return true;
      }
      return false;
    }
    if (strokeHitsCatRect(catEnd.x, catEnd.y, catEnd.w, catEnd.h)) return false;

    let perim = 0;
    for (let i = 1; i < points.length; i++) {
      perim += Math.hypot(points[i].x - points[i - 1].x, points[i].y - points[i - 1].y);
    }
    perim += closeDist;
    const minLoop = Math.max(28, Math.max(catEnd.w, catEnd.h));
    if (perim < minLoop) return false;

    const endCx = catEnd.x + catEnd.w / 2;
    const endCy = catEnd.y + catEnd.h / 2;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();
    let inside = ctx.isPointInPath(endCx, endCy);
    if (!inside) {
      try {
        inside = ctx.isPointInPath(endCx, endCy, 'evenodd');
      } catch (_) {}
    }
    ctx.restore();
    if (!inside) inside = pointInPolygonRay(endCx, endCy, points);
    if (!inside) return false;

    return true;
  }

  function stopCatCaught() {
    mover.classList.add('tools-hub-cat-mover--stopped');
    mover.style.animationPlayState = 'paused';
    if (typeof mover.getAnimations === 'function') {
      mover.getAnimations().forEach((a) => {
        try {
          a.pause();
        } catch (_) {}
      });
    }
  }

  function resumeCatTap() {
    mover.classList.remove('tools-hub-cat-mover--stopped');
    mover.style.animationPlayState = '';
    if (typeof mover.getAnimations === 'function') {
      mover.getAnimations().forEach((a) => {
        try {
          a.play();
        } catch (_) {}
      });
    }
  }

  function redrawStroke() {
    const r = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, r.width, r.height);
    if (points.length < 2) return;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.strokeStyle = '#2563eb';
    ctx.globalAlpha = 1;
    ctx.lineWidth = 3;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  function teardownDocListeners() {
    canvas.removeEventListener('pointermove', onDocPointerMove, true);
    canvas.removeEventListener('pointerup', onDocPointerUp, true);
    canvas.removeEventListener('pointercancel', onDocPointerCancel, true);
    canvas.removeEventListener('lostpointercapture', onLostPointerCapture, true);
  }

  function onDocPointerMove(e) {
    if (!drawing || e.pointerId !== activePointerId) return;
    const p = clientToPoint(e.clientX, e.clientY);
    if (resumeOnly) {
      if (points.length && Math.hypot(p.x - points[0].x, p.y - points[0].y) > DRAG_THRESHOLD) {
        didDrag = true;
      }
      return;
    }
    const last = points[points.length - 1];
    if (last && Math.hypot(p.x - last.x, p.y - last.y) < 2) return;
    points.push(p);
    redrawStroke();
  }

  function finalizePointerEnd(e, isCancel) {
    if (!drawing) return;
    if (e.pointerId !== activePointerId) return;
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch (_) {}
    drawing = false;
    activePointerId = null;
    teardownDocListeners();

    const r = canvas.getBoundingClientRect();
    const clearAll = () => ctx.clearRect(0, 0, r.width, r.height);

    if (isCancel) {
      resumeOnly = false;
      clearAll();
      points = [];
      return;
    }

    if (resumeOnly) {
      resumeOnly = false;
      const tapDuration = performance.now() - dragStartTime;
      if (!didDrag && tapDuration < 400) {
        resumeCatTap();
      }
      clearAll();
      points = [];
      return;
    }

    if (tryComplete()) {
      stopCatCaught();
    }
    clearAll();
    points = [];
  }

  function onDocPointerUp(e) {
    finalizePointerEnd(e, false);
  }

  function onDocPointerCancel(e) {
    finalizePointerEnd(e, true);
  }

  function onLostPointerCapture(e) {
    if (!drawing || e.pointerId !== activePointerId) return;
    finalizePointerEnd(e, false);
  }

  function onCanvasPointerDown(e) {
    if (e.button != null && e.button !== 0) return;
    e.preventDefault();

    if (mover.classList.contains('tools-hub-cat-mover--stopped')) {
      drawing = true;
      resumeOnly = true;
      didDrag = false;
      dragStartTime = performance.now();
      points = [clientToPoint(e.clientX, e.clientY)];
      activePointerId = e.pointerId;
      try {
        canvas.setPointerCapture(e.pointerId);
      } catch (_) {}
      canvas.addEventListener('pointermove', onDocPointerMove, true);
      canvas.addEventListener('pointerup', onDocPointerUp, true);
      canvas.addEventListener('pointercancel', onDocPointerCancel, true);
      canvas.addEventListener('lostpointercapture', onLostPointerCapture, true);
      return;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    drawing = true;
    resumeOnly = false;
    activePointerId = e.pointerId;
    points = [clientToPoint(e.clientX, e.clientY)];
    try {
      canvas.setPointerCapture(e.pointerId);
    } catch (_) {}
    canvas.addEventListener('pointermove', onDocPointerMove, true);
    canvas.addEventListener('pointerup', onDocPointerUp, true);
    canvas.addEventListener('pointercancel', onDocPointerCancel, true);
    canvas.addEventListener('lostpointercapture', onLostPointerCapture, true);
    redrawStroke();
  }

  canvas.addEventListener('pointerdown', onCanvasPointerDown);
}

function toolFromUrl() {
  const t = new URLSearchParams(window.location.search).get('tool');
  return t && TOOL_SRC[t] ? t : '';
}

function selectTool(tool, { syncUrl = false } = {}) {
  const frame = $('#toolsHubFrame');
  const empty = $('#toolsHubEmpty');
  const cards = document.querySelectorAll('.tools-hub-card');
  if (!frame || !empty) return false;

  const src = tool ? TOOL_SRC[tool] : '';
  if (!src) return false;

  const cardEl = document.querySelector(`.tools-hub-card[data-tool="${tool}"]`);
  if (cardEl && cardEl.hidden) return false;

  cards.forEach((c) => c.classList.remove('is-active'));
  if (cardEl) cardEl.classList.add('is-active');
  empty.hidden = true;
  frame.hidden = false;
  frame.src = src;

  if (syncUrl) {
    const url = new URL(window.location.href);
    url.searchParams.set('tool', tool);
    history.replaceState(null, '', url);
  }
  return true;
}

function wireNav() {
  const cards = document.querySelectorAll('.tools-hub-card');
  cards.forEach((card) => {
    card.addEventListener('click', () => {
      const tool = card.getAttribute('data-tool');
      if (!tool || !TOOL_SRC[tool]) return;
      selectTool(tool, { syncUrl: true });
    });
  });
}

async function init() {
  const gate = $('#toolsHubGate');
  const workspace = $('#toolsHubWorkspace');
  if (!gate || !workspace) return;

  const token = localStorage.getItem('msai_auth_token') || '';
  if (!token) {
    gate.innerHTML = 'Sign in from the <a href="/">home page</a> first.';
    return;
  }

  const res = await fetch('/api/auth/me', { headers: authHeaders() });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.user) {
    gate.innerHTML = 'Session expired. <a href="/">Home</a>';
    return;
  }

  const role = String(data.user.role || '')
    .trim()
    .toLowerCase();
  if (role !== 'admin' && role !== 'superuser') {
    gate.textContent = 'You don’t have access to this area.';
    return;
  }

  const accountsCard = $('#toolsHubAccountsCard');
  if (accountsCard) accountsCard.hidden = role !== 'admin';

  gate.hidden = true;
  workspace.hidden = false;
  wireNav();
  const initial = toolFromUrl();
  if (initial && !selectTool(initial, { syncUrl: false })) {
    const url = new URL(window.location.href);
    url.searchParams.delete('tool');
    history.replaceState(null, '', url);
  }
  wireToolsHubCatLaneOffset();
  wireToolsHubCatLasso();
}

init().catch((e) => {
  const gate = $('#toolsHubGate');
  if (gate) gate.textContent = String(e.message || e);
});
