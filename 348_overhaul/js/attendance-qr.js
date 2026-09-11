(() => {
  const dock = document.getElementById("qrDock");
  const img = document.getElementById("qrDockImg");
  const status = document.getElementById("qrDockStatus");
  if (!dock || !img) return;

  const TOKEN_KEY = "msai_deck_cat_token";
  const CAT_KEY = "msai_cat_origin";
  let timer = null;
  let inFlight = false;
  let waitingAuth = false;

  function catOrigin() {
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
    if (stored) return stored;
    const fromHtml = String(document.documentElement.getAttribute("data-cat-origin") || "").replace(/\/$/, "");
    return fromHtml || "http://localhost:3000";
  }

  function bearer() {
    if (location.origin === catOrigin()) {
      return String(localStorage.getItem("msai_auth_token") || "").trim();
    }
    return String(sessionStorage.getItem(TOKEN_KEY) || "").trim();
  }

  function setStatus(text) {
    if (status) status.textContent = text || "";
  }

  function visible() {
    return !dock.hidden;
  }

  function stopLoop() {
    if (timer) clearInterval(timer);
    timer = null;
    inFlight = false;
  }

  function hide() {
    stopLoop();
    dock.hidden = true;
    img.removeAttribute("src");
    setStatus("");
  }

  function requestToken() {
    if (waitingAuth) return;
    waitingAuth = true;
    setStatus("Sign in to CAT if asked, then press Q again.");
    const w = window.open(
      `${catOrigin()}/attendance-deck-auth.html`,
      "msai-cat-auth",
      "width=440,height=320",
    );
    if (!w) {
      waitingAuth = false;
      setStatus("Allow pop-ups, then press Q.");
    }
    window.setTimeout(() => {
      waitingAuth = false;
    }, 4000);
  }

  async function generateQr() {
    if (inFlight) return;
    const token = bearer();
    if (!token) {
      requestToken();
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
        requestToken();
        return;
      }
      if (!res.ok || !data.qr) {
        throw new Error(data.error || `QR failed (HTTP ${res.status})`);
      }
      img.src = data.qr.qrImageUrl;
      setStatus("");
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
    dock.hidden = false;
    generateQr();
    if (!timer) timer = setInterval(generateQr, 1000);
  }

  function toggle() {
    if (visible()) hide();
    else show();
  }

  window.addEventListener("message", (e) => {
    if (e.origin !== catOrigin()) return;
    const data = e.data || {};
    if (data.type !== "msai-cat-token" || !data.token) return;
    sessionStorage.setItem(TOKEN_KEY, String(data.token));
    waitingAuth = false;
    if (visible()) generateQr();
  });

  document.addEventListener(
    "keydown",
    (e) => {
      if (e.altKey || e.metaKey || e.ctrlKey) return;
      const k = e.key;
      if (k === "q" || k === "Q") {
        e.preventDefault();
        e.stopImmediatePropagation();
        toggle();
        return;
      }
      if (k === "Escape" && visible()) {
        e.preventDefault();
        e.stopImmediatePropagation();
        hide();
      }
    },
    true,
  );
})();
