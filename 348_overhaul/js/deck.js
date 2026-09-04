(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const stage = document.querySelector(".stage");
  const bar = document.querySelector(".progress span");
  const baseTitle = document.title;
  let i = 0;

  function frags(slide) {
    return [...slide.querySelectorAll("[data-frag]")].sort((a, b) => {
      const oa = Number(a.dataset.fragOrder || 0);
      const ob = Number(b.dataset.fragOrder || 0);
      return oa - ob;
    });
  }

  function revealed(slide) {
    return frags(slide).filter((el) => el.classList.contains("is-on")).length;
  }

  function withGroup(slide, el) {
    const g = el.dataset.with;
    if (!g) return [el];
    return frags(slide).filter((x) => x.dataset.with === g);
  }

  function parseHash() {
    const n = parseInt(location.hash.replace("#", ""), 10);
    if (Number.isFinite(n) && n >= 1 && n <= slides.length) return n - 1;
    return 0;
  }

  function paint() {
    slides.forEach((s, k) => s.classList.toggle("is-current", k === i));
    document.documentElement.style.setProperty("--on", String(i + 1));
    document.title = `${baseTitle} — ${i + 1} / ${slides.length}`;
    if (bar) bar.style.width = `${((i + 1) / slides.length) * 100}%`;
    if (location.hash !== `#${i + 1}`) history.replaceState(null, "", `#${i + 1}`);
  }

  let ytPlayer = null;
  let watchTimer = null;
  let fadeTimer = null;
  let ytQueue = null;

  function withYT(fn) {
    if (window.YT && window.YT.Player) {
      fn();
      return;
    }
    if (!ytQueue) {
      ytQueue = [];
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (typeof prev === "function") prev();
        const q = ytQueue;
        ytQueue = true;
        q.forEach((cb) => cb());
      };
    }
    if (ytQueue === true) fn();
    else ytQueue.push(fn);
  }

  function stopWatch() {
    clearInterval(watchTimer);
    watchTimer = null;
    clearTimeout(fadeTimer);
    fadeTimer = null;
  }

  function destroyPlayer() {
    stopWatch();
    if (ytPlayer) {
      try { ytPlayer.destroy(); } catch (e) {}
      ytPlayer = null;
    }
  }

  function readyMount(slide) {
    const host = slide.querySelector(".yt-host");
    if (!host) return null;
    host.replaceChildren();
    const mount = document.createElement("div");
    mount.className = "yt-mount";
    host.appendChild(mount);
    return mount;
  }

  function closeVideo(slide = slides[i]) {
    destroyPlayer();
    if (!slide) return;
    slide.classList.remove("is-playing");
    const panel = slide.querySelector(".embed");
    if (panel) {
      panel.classList.remove("is-fading");
      panel.setAttribute("aria-hidden", "true");
    }
    readyMount(slide);
  }

  function fadeOutVideo(slide) {
    const panel = slide.querySelector(".embed");
    if (!panel) return;
    panel.classList.add("is-fading");
    fadeTimer = setTimeout(() => closeVideo(slide), 1450);
  }

  function beginWatch(slide, endAt) {
    stopWatch();
    watchTimer = setInterval(() => {
      if (!ytPlayer || typeof ytPlayer.getCurrentTime !== "function") return;
      let t = 0;
      try { t = ytPlayer.getCurrentTime(); } catch (e) { return; }
      if (t >= endAt - 0.08) {
        stopWatch();
        try { ytPlayer.pauseVideo(); } catch (e) {}
        fadeOutVideo(slide);
      }
    }, 120);
  }

  function openVideo(link) {
    const slide = link.closest(".slide");
    if (!slide) return;
    const panel = slide.querySelector(".embed");
    if (!panel) return;
    destroyPlayer();
    const mount = readyMount(slide);
    if (!mount) return;
    panel.classList.remove("is-fading");
    slide.classList.add("is-playing");
    panel.setAttribute("aria-hidden", "false");
    const id = link.dataset.yt;
    const start = Number(link.dataset.ytStart || 0);
    const endAt = link.dataset.ytEnd ? Number(link.dataset.ytEnd) : null;
    withYT(() => {
      ytPlayer = new YT.Player(mount, {
        videoId: id,
        width: "100%",
        height: "100%",
        playerVars: {
          autoplay: 1,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
          start,
        },
        events: {
          onReady(ev) {
            ev.target.playVideo();
          },
          onStateChange(ev) {
            if (!window.YT) return;
            if (ev.data === YT.PlayerState.PLAYING) {
              const stopAt = endAt || Math.max(0, ytPlayer.getDuration() - 0.2);
              if (stopAt) beginWatch(slide, stopAt);
            } else if (ev.data === YT.PlayerState.ENDED) {
              stopWatch();
              try { ytPlayer.pauseVideo(); } catch (e) {}
              fadeOutVideo(slide);
            }
          },
        },
      });
    });
  }

  function show(n, { resetFrags = true } = {}) {
    closeVideo(slides[i]);
    i = Math.max(0, Math.min(slides.length - 1, n));
    if (resetFrags) {
      slides.forEach((s) => {
        frags(s).forEach((el) => el.classList.remove("is-on"));
        if (window.Walk) Walk.reset(s);
      });
    }
    if (window.Walk) Walk.prepare(slides[i]);
    paint();
  }

  function next() {
    if (window.Walk && Walk.advance(slides[i])) return;
    const f = frags(slides[i]);
    const r = revealed(slides[i]);
    if (r < f.length) {
      withGroup(slides[i], f[r]).forEach((el) => el.classList.add("is-on"));
      return;
    }
    show(i + 1);
  }

  function prev() {
    if (window.Walk && Walk.rewind(slides[i])) return;
    const f = frags(slides[i]);
    const r = revealed(slides[i]);
    if (r > 0) {
      withGroup(slides[i], f[r - 1]).forEach((el) => el.classList.remove("is-on"));
      return;
    }
    show(i - 1, { resetFrags: false });
    frags(slides[i]).forEach((el) => el.classList.add("is-on"));
    if (window.Walk) Walk.finish(slides[i]);
  }

  function fit() {
    const s = Math.min(window.innerWidth / 1280, window.innerHeight / 720);
    stage.style.transform = `translate(-50%, -50%) scale(${s})`;
  }

  window.addEventListener("resize", fit);
  window.addEventListener("hashchange", () => show(parseHash()));

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.metaKey || e.ctrlKey) return;
    const k = e.key;
    if (k === "Escape" && slides[i] && slides[i].classList.contains("is-playing")) {
      e.preventDefault();
      closeVideo();
      return;
    }
    if (["ArrowRight", "ArrowDown", "PageDown", " ", "Enter"].includes(k)) {
      e.preventDefault();
      next();
    } else if (["ArrowLeft", "ArrowUp", "PageUp", "Backspace"].includes(k)) {
      e.preventDefault();
      prev();
    } else if (k === "Home") {
      e.preventDefault();
      show(0);
    } else if (k === "End") {
      e.preventDefault();
      show(slides.length - 1);
    }
  });

  document.addEventListener("click", (e) => {
    const yt = e.target.closest("[data-yt]");
    if (yt) {
      e.preventDefault();
      openVideo(yt);
      return;
    }
    if (e.target.closest(".embed-close")) {
      e.preventDefault();
      closeVideo();
      return;
    }
    if (e.target.closest("a, button, .embed")) return;
    if (e.clientX < window.innerWidth * 0.18) prev();
    else next();
  });

  let touchX = null;
  document.addEventListener("touchstart", (e) => {
    touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  document.addEventListener("touchend", (e) => {
    if (touchX == null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    touchX = null;
    if (Math.abs(dx) < 50) return;
    if (dx < 0) next();
    else prev();
  }, { passive: true });

  fit();
  show(parseHash());
})();
