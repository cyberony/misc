(() => {
  const dock = document.getElementById("qrDock");
  const img = document.getElementById("qrDockImg");
  const status = document.getElementById("qrDockStatus");
  const authEl = document.getElementById("qrAuth");
  const authForm = document.getElementById("qrAuthForm");
  const authEmail = document.getElementById("qrAuthEmail");
  const authPassword = document.getElementById("qrAuthPassword");
  const authError = document.getElementById("qrAuthError");
  const authCancel = document.getElementById("qrAuthCancel");
  if (!dock || !img) return;

  const TOKEN_KEY = "msai_deck_cat_token";
  const CAT_KEY = "msai_cat_origin";
  const LIVE_CAT = "https://msai-cat.165.124.25.23.sslip.io";
  let timer = null;
  let inFlight = false;
  let waitingAuth = false;
  let open = false;
  let revealTimer = null;
  let pendingShow = false;

  function isLocalCat(origin) {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/i.test(origin);
  }

  function catOrigin() {
    if (location.pathname.indexOf("/courses/") === 0) return location.origin;
    const q = new URLSearchParams(location.search).get("cat");
    if (q) {
      try {
        const origin = new URL(q).origin;
        localStorage.setItem(CAT_KEY, origin);
        return origin;
      } catch {
        /* fall through */
      }
    }
    const stored = String(localStorage.getItem(CAT_KEY) || "").replace(/\/$/, "");
    if (stored && !isLocalCat(stored)) return stored;
    const fromHtml = String(document.documentElement.getAttribute("data-cat-origin") || "").replace(/\/$/, "");
    return fromHtml || LIVE_CAT;
  }

  function bearer() {
    return String(sessionStorage.getItem(TOKEN_KEY) || "").trim();
  }

  function setStatus(text) {
    if (status) status.textContent = text || "";
  }

  function setAuthError(text) {
    if (!authError) return;
    const msg = String(text || "").trim();
    authError.hidden = !msg;
    authError.textContent = msg;
  }

  function canTakeAttendance(user) {
    const role = String(user?.role || "")
      .trim()
      .toLowerCase();
    if (role === "admin") return true;
    if (role === "superuser") {
      const arr = Array.isArray(user?.appAccess) ? user.appAccess : [];
      return arr.map((x) => String(x || "").trim()).includes("attendance");
    }
    return false;
  }

  function visible() {
    return open;
  }

  function authVisible() {
    return Boolean(authEl && !authEl.hidden);
  }

  function hideAuth() {
    if (authEl) authEl.hidden = true;
    setAuthError("");
    if (authPassword) authPassword.value = "";
    waitingAuth = false;
  }

  function cancelAuth() {
    hideAuth();
    pendingShow = false;
  }

  function stopLoop() {
    if (timer) clearInterval(timer);
    timer = null;
    inFlight = false;
  }

  function fitDurationMs() {
    const stage = document.querySelector(".stage");
    if (!stage) return 0;
    const raw = String(getComputedStyle(stage).transitionDuration || "0s").split(",")[0].trim();
    const n = parseFloat(raw);
    if (!Number.isFinite(n) || n <= 0) return 0;
    return raw.endsWith("ms") ? n : n * 1000;
  }

  function cancelReveal() {
    if (revealTimer) clearTimeout(revealTimer);
    revealTimer = null;
  }

  function revealDock() {
    cancelReveal();
    if (!open) return;
    dock.hidden = false;
  }

  function presentDock() {
    if (!open || !img.getAttribute("src")) return;
    if (!document.body.classList.contains("has-qr-margin")) {
      document.body.classList.add("has-qr-margin");
      window.dispatchEvent(new Event("resize"));
      const wait = fitDurationMs();
      if (wait <= 0) {
        revealDock();
        return;
      }
      cancelReveal();
      revealTimer = window.setTimeout(revealDock, wait);
      return;
    }
    revealDock();
  }

  function hide() {
    open = false;
    cancelReveal();
    stopLoop();
    dock.hidden = true;
    img.removeAttribute("src");
    setStatus("");
    document.body.classList.remove("has-qr-margin");
    window.dispatchEvent(new Event("resize"));
  }

  function acceptToken(token) {
    const t = String(token || "").trim();
    if (!t) return;
    sessionStorage.setItem(TOKEN_KEY, t);
    waitingAuth = false;
    const shouldShow = pendingShow || visible();
    hideAuth();
    pendingShow = false;
    if (shouldShow) show();
  }

  function showAuthOverlay() {
    if (!authEl) return false;
    hide();
    waitingAuth = true;
    pendingShow = true;
    authEl.hidden = false;
    setAuthError("");
    window.setTimeout(() => {
      authEmail?.focus();
    }, 0);
    return true;
  }

  function requestAuth() {
    showAuthOverlay();
  }

  async function generateQr() {
    if (inFlight) return;
    const token = bearer();
    if (!token) {
      hide();
      requestAuth();
      return;
    }
    inFlight = true;
    try {
      const res = await fetch(`${catOrigin()}/api/admin/attendance/qr-codes`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 401) {
        sessionStorage.removeItem(TOKEN_KEY);
        hide();
        requestAuth();
        return;
      }
      if (res.status === 403) {
        sessionStorage.removeItem(TOKEN_KEY);
        stopLoop();
        hide();
        if (showAuthOverlay()) {
          setAuthError("This account cannot take attendance.");
        }
        return;
      }
      if (!res.ok || !data.qr) {
        throw new Error(data.error || `QR failed (HTTP ${res.status})`);
      }
      const url = data.qr.qrImageUrl;
      img.onload = () => presentDock();
      img.onerror = () => {
        img.removeAttribute("src");
        setStatus("QR image failed to load.");
      };
      img.src = url;
      setStatus("");
      if (img.complete && img.naturalWidth) presentDock();
    } catch (e) {
      const msg = String(e && e.message ? e.message : e);
      if (msg === "Failed to fetch") {
        setStatus(`Cannot reach CAT at ${catOrigin()}.`);
      } else {
        setStatus(msg);
      }
      stopLoop();
    } finally {
      inFlight = false;
    }
  }

  function show() {
    if (open) return;
    if (!bearer()) {
      requestAuth();
      return;
    }
    open = true;
    generateQr();
    if (!timer) timer = setInterval(generateQr, 1000);
  }

  function toggle() {
    if (authVisible()) {
      cancelAuth();
      return;
    }
    if (visible()) hide();
    else show();
  }

  async function submitAuth(ev) {
    ev.preventDefault();
    const email = String(authEmail?.value || "").trim();
    const password = String(authPassword?.value || "");
    if (!email || !password) {
      setAuthError("Email and password required.");
      return;
    }
    const btn = authForm?.querySelector('button[type="submit"]');
    if (btn) btn.disabled = true;
    setAuthError("");
    try {
      const res = await fetch(`${catOrigin()}/api/auth/login`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.token) {
        setAuthError(data.error || "Could not sign in.");
        return;
      }
      if (!canTakeAttendance(data.user)) {
        setAuthError("This account cannot take attendance.");
        return;
      }
      acceptToken(data.token);
    } catch {
      setAuthError("Could not reach CAT.");
    } finally {
      if (btn) btn.disabled = false;
    }
  }

  window.addEventListener("message", (e) => {
    if (e.origin !== catOrigin()) return;
    const data = e.data || {};
    if (data.type !== "msai-cat-token" || !data.token) return;
    acceptToken(data.token);
  });

  authForm?.addEventListener("submit", (e) => {
    void submitAuth(e);
  });
  authCancel?.addEventListener("click", () => {
    cancelAuth();
  });
  authEl?.addEventListener("click", (e) => {
    if (e.target === authEl) cancelAuth();
  });

  const CHORD = "qrc";
  const CHORD_MS = 1500;
  let chord = "";
  let chordTimer = null;

  function resetChord() {
    chord = "";
    if (chordTimer) {
      clearTimeout(chordTimer);
      chordTimer = null;
    }
  }

  document.addEventListener(
    "keydown",
    (e) => {
      if (authVisible() && (e.key === "Escape" || e.key === "Esc")) {
        e.preventDefault();
        e.stopImmediatePropagation();
        resetChord();
        cancelAuth();
        return;
      }
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      const k = e.key;
      if (k === "Escape" && visible()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        resetChord();
        hide();
        return;
      }
      if (authVisible()) return;
      if (k.length !== 1) {
        resetChord();
        return;
      }
      const next = chord + k.toLowerCase();
      if (CHORD.startsWith(next)) {
        chord = next;
        if (chordTimer) clearTimeout(chordTimer);
        if (chord === CHORD) {
          e.preventDefault();
          e.stopImmediatePropagation();
          resetChord();
          toggle();
        } else {
          chordTimer = setTimeout(resetChord, CHORD_MS);
        }
        return;
      }
      resetChord();
    },
    true,
  );
})();
