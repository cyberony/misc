(() => {
  'use strict';

  const PING_URL = 'ping.txt';
  const PROBE_URL = 'probe.bin';

  const PINGS_PER_CYCLE = 7;
  const PING_GAP_MS = 180;
  const PING_TIMEOUT_MS = 1500;
  const PROBE_WINDOW_MS = 250;
  const PROBE_TIMEOUT_MS = 2000;

  const RTT_WINDOW = 8;
  const HISTORY_MS = 60000;
  const GAP_MS = 3000;

  // Speed is scored on a log scale between these two rates. A short download
  // cannot resolve rates far above the upper one, so the scale stops there.
  const SPEED_FLOOR_MBPS = 0.5;
  const SPEED_CEIL_MBPS = 40;
  // Delay added on top of the best response time seen, scored on a log scale.
  const DELAY_FLOOR_MS = 5;
  const DELAY_CEIL_MS = 300;

  const el = (id) => document.getElementById(id);
  const ui = {
    status: el('status'),
    notice: el('notice'),
    bars: el('bars'),
    score: el('score'),
    label: el('label'),
    range: el('range'),
    speed: el('speed'),
    latency: el('latency'),
    jitter: el('jitter'),
    dropped: el('dropped'),
    toggle: el('toggle'),
    chart: el('chart'),
  };

  const state = {
    rtts: [],
    outcomes: [],
    rttMin: Infinity,
    mbps: null,
    history: [],
    best: null,
    worst: null,
  };

  let generation = 0;
  let running = false;
  let userPaused = false;
  let requestCount = 0;
  let wakeLock = null;

  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const clamp01 = (x) => Math.min(1, Math.max(0, x));

  function median(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = sorted.length >> 1;
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }

  // Resolves to the time until response headers arrive, or null if the request
  // failed or timed out.
  async function ping() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PING_TIMEOUT_MS);
    const sent = performance.now();
    try {
      const res = await fetch(`${PING_URL}?n=${++requestCount}`, {
        cache: 'no-store',
        signal: ctrl.signal,
      });
      const rtt = performance.now() - sent;
      await res.arrayBuffer();
      return res.ok ? rtt : null;
    } catch {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  // Downloads for a short window and resolves to the receive rate in Mbps
  // (0 if nothing arrived).
  async function probeSpeed() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), PROBE_TIMEOUT_MS);
    const sent = performance.now();
    let firstAt = null;
    let firstBytes = 0;
    let total = 0;
    let end = sent;
    try {
      const res = await fetch(`${PROBE_URL}?n=${++requestCount}`, {
        cache: 'no-store',
        signal: ctrl.signal,
      });
      if (!res.ok || !res.body) return 0;
      const reader = res.body.getReader();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        end = performance.now();
        if (firstAt === null) {
          firstAt = end;
          firstBytes = value.length;
        }
        total += value.length;
        if (end - firstAt >= PROBE_WINDOW_MS) break;
      }
    } catch {
      // A stalled transfer counts for the whole time it was stalled.
      end = performance.now();
    } finally {
      clearTimeout(timer);
      ctrl.abort();
    }
    if (total === 0) return 0;
    // Timing from the first chunk leaves out the request round trip. When the
    // whole download lands at once there is nothing to time that way, so fall
    // back to timing the full request.
    const streamed = end - firstAt;
    if (total > firstBytes && streamed >= 5) {
      return ((total - firstBytes) * 8) / streamed / 1000;
    }
    return (total * 8) / (end - sent) / 1000;
  }

  function recordPing(rtt) {
    state.outcomes.push(rtt !== null);
    if (state.outcomes.length > RTT_WINDOW) state.outcomes.shift();
    if (rtt === null) {
      // Three misses in a row is a dead spot; timings from before it are stale.
      if (state.outcomes.slice(-3).every((ok) => !ok)) state.rtts = [];
      return;
    }
    state.rtts.push(rtt);
    if (state.rtts.length > RTT_WINDOW) state.rtts.shift();
    state.rttMin = Math.min(state.rttMin, rtt);
  }

  // Smoothed as a ratio rather than a difference, so a drop from hundreds of
  // Mbps to a few shows up within a probe or two.
  function recordSpeed(mbps) {
    state.mbps = mbps > 0 && state.mbps > 0 ? state.mbps ** 0.3 * mbps ** 0.7 : mbps;
  }

  function latency() {
    return state.rtts.length ? median(state.rtts.slice(-5)) : null;
  }

  function jitter() {
    const r = state.rtts;
    if (r.length < 2) return null;
    let sum = 0;
    for (let i = 1; i < r.length; i++) sum += Math.abs(r[i] - r[i - 1]);
    return sum / (r.length - 1);
  }

  function droppedFraction() {
    const n = state.outcomes.length;
    return n ? state.outcomes.filter((ok) => !ok).length / n : null;
  }

  function lastPingOk() {
    const n = state.outcomes.length;
    return n === 0 || state.outcomes[n - 1];
  }

  function quality() {
    if (state.mbps === null || state.outcomes.length === 0) return null;
    if (state.rtts.length === 0) return 0;

    const speed = clamp01(
      Math.log(state.mbps / SPEED_FLOOR_MBPS) / Math.log(SPEED_CEIL_MBPS / SPEED_FLOOR_MBPS)
    );
    const addedDelay = latency() - state.rttMin + (jitter() || 0);
    const delay = clamp01(
      1 - Math.log(addedDelay / DELAY_FLOOR_MS) / Math.log(DELAY_CEIL_MS / DELAY_FLOOR_MS)
    );
    const delivered = (1 - droppedFraction()) ** 2;
    return 100 * (0.6 * speed + 0.4 * delay) * delivered;
  }

  function describe(score) {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    if (score >= 40) return 'Fair';
    if (score >= 20) return 'Weak';
    if (score >= 1) return 'Very weak';
    return 'No connection';
  }

  const hue = (score) => Math.round(score * 1.35);
  const formatNumber = (x) => (x >= 10 ? String(Math.round(x)) : x.toFixed(1));

  function render() {
    const score = quality();
    const now = performance.now();

    if (score === null) {
      ui.score.textContent = '\u2013';
      ui.label.textContent = 'Measuring\u2026';
      document.documentElement.style.removeProperty('--tone');
      setBars(0);
    } else {
      const shown = Math.round(score);
      ui.score.textContent = String(shown);
      ui.label.textContent = describe(shown);
      document.documentElement.style.setProperty('--tone', `hsl(${hue(shown)}, 85%, 55%)`);
      setBars(shown >= 75 ? 4 : shown >= 50 ? 3 : shown >= 25 ? 2 : shown >= 1 ? 1 : 0);

      state.history.push({ t: now, score: shown });
      state.best = state.best === null ? shown : Math.max(state.best, shown);
      state.worst = state.worst === null ? shown : Math.min(state.worst, shown);
      ui.range.textContent = `best ${state.best} \u00b7 worst ${state.worst}`;
    }

    const rtt = latency();
    const jit = jitter();
    const dropped = droppedFraction();
    ui.speed.textContent = state.mbps === null ? '\u2013' : formatNumber(state.mbps);
    ui.latency.textContent = rtt === null ? '\u2013' : formatNumber(rtt);
    ui.jitter.textContent = jit === null ? '\u2013' : formatNumber(jit);
    ui.dropped.textContent = dropped === null ? '\u2013' : String(Math.round(dropped * 100));

    drawChart();
  }

  function setBars(level) {
    for (const part of ui.bars.children) {
      part.classList.toggle('on', Number(part.dataset.level) <= level);
    }
  }

  function drawChart() {
    const canvas = ui.chart;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    }
    const ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const pad = 5;
    const y = (score) => pad + (1 - score / 100) * (h - 2 * pad);

    ctx.strokeStyle = '#1f2a36';
    ctx.lineWidth = 1;
    for (const level of [0, 25, 50, 75, 100]) {
      ctx.beginPath();
      ctx.moveTo(0, Math.round(y(level)) + 0.5);
      ctx.lineTo(w, Math.round(y(level)) + 0.5);
      ctx.stroke();
    }

    const now = performance.now();
    const history = state.history;
    while (history.length && now - history[0].t > HISTORY_MS) history.shift();
    if (!history.length) return;

    const x = (t) => w - ((now - t) / HISTORY_MS) * w;
    const tone = hue(history[history.length - 1].score);

    const fill = ctx.createLinearGradient(0, 0, 0, h);
    fill.addColorStop(0, `hsla(${tone}, 85%, 55%, 0.35)`);
    fill.addColorStop(1, `hsla(${tone}, 85%, 55%, 0)`);

    // A pause leaves a hole in the samples; draw each unbroken run separately.
    let start = 0;
    for (let i = 1; i <= history.length; i++) {
      if (i < history.length && history[i].t - history[i - 1].t <= GAP_MS) continue;
      const run = history.slice(start, i);
      start = i;

      ctx.beginPath();
      run.forEach((p, k) => (k ? ctx.lineTo(x(p.t), y(p.score)) : ctx.moveTo(x(p.t), y(p.score))));
      ctx.strokeStyle = `hsl(${tone}, 85%, 55%)`;
      ctx.lineWidth = 2;
      ctx.lineJoin = 'round';
      ctx.stroke();

      ctx.lineTo(x(run[run.length - 1].t), h);
      ctx.lineTo(x(run[0].t), h);
      ctx.closePath();
      ctx.fillStyle = fill;
      ctx.fill();
    }
  }

  async function run(gen) {
    const live = () => gen === generation;

    // The first request pays for opening the connection, so it is not scored.
    await ping();

    while (live()) {
      if (lastPingOk()) {
        const mbps = await probeSpeed();
        if (!live()) return;
        recordSpeed(mbps);
        // Cutting the download short can close the connection; let an unscored
        // request reopen it.
        await ping();
      } else {
        recordSpeed(0);
      }

      for (let i = 0; i < PINGS_PER_CYCLE && live(); i++) {
        const wasDown = !lastPingOk();
        const rtt = await ping();
        if (!live()) return;
        recordPing(rtt);
        render();
        // Coming back from a dead spot: measure speed again straight away.
        if (wasDown && rtt !== null) break;
        await sleep(PING_GAP_MS);
      }
    }
  }

  async function holdScreenOn() {
    if (!('wakeLock' in navigator) || wakeLock) return;
    try {
      wakeLock = await navigator.wakeLock.request('screen');
      wakeLock.addEventListener('release', () => {
        wakeLock = null;
      });
    } catch {
      // Not allowed right now (low battery, no secure context); carry on without it.
    }
  }

  function start() {
    running = true;
    state.rtts = [];
    state.outcomes = [];
    state.mbps = null;
    ui.status.dataset.state = 'live';
    ui.status.textContent = 'Live';
    ui.toggle.textContent = 'Pause';
    holdScreenOn();
    render();
    run(++generation);
  }

  function stop() {
    running = false;
    generation++;
    ui.status.dataset.state = 'paused';
    ui.status.textContent = 'Paused';
    ui.toggle.textContent = 'Resume';
    if (wakeLock) wakeLock.release();
  }

  function sync() {
    const shouldRun = !userPaused && !document.hidden;
    if (shouldRun && !running) start();
    else if (!shouldRun && running) stop();
  }

  function checkConnectionType() {
    const onCellular = navigator.connection && navigator.connection.type === 'cellular';
    ui.notice.hidden = !onCellular;
    if (onCellular) {
      ui.notice.textContent =
        'This phone is using mobile data right now, so the reading is not about WiFi.';
    }
  }

  ui.toggle.addEventListener('click', () => {
    userPaused = !userPaused;
    sync();
  });
  document.addEventListener('visibilitychange', sync);
  window.addEventListener('resize', drawChart);
  if (navigator.connection && navigator.connection.addEventListener) {
    navigator.connection.addEventListener('change', checkConnectionType);
  }

  checkConnectionType();
  sync();
})();
