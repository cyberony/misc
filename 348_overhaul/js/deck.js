(() => {
  const slides = [...document.querySelectorAll(".slide")];
  const stage = document.querySelector(".stage");
  const bar = document.querySelector(".progress span");
  const baseTitle = document.title;
  let i = 0;

  function frags(slide) {
    return [...slide.querySelectorAll("[data-frag]")];
  }

  function revealed(slide) {
    return frags(slide).filter((el) => el.classList.contains("is-on")).length;
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

  function closeVideo(slide = slides[i]) {
    if (!slide) return;
    slide.classList.remove("is-playing");
    const iframe = slide.querySelector(".embed iframe");
    if (iframe) iframe.src = "";
    const panel = slide.querySelector(".embed");
    if (panel) panel.setAttribute("aria-hidden", "true");
  }

  function openVideo(link) {
    const slide = link.closest(".slide");
    if (!slide) return;
    const iframe = slide.querySelector(".embed iframe");
    if (!iframe) return;
    const id = link.dataset.yt;
    const start = link.dataset.ytStart || "0";
    iframe.src = `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&start=${start}`;
    slide.classList.add("is-playing");
    const panel = slide.querySelector(".embed");
    if (panel) panel.setAttribute("aria-hidden", "false");
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
      f[r].classList.add("is-on");
      return;
    }
    show(i + 1);
  }

  function prev() {
    if (window.Walk && Walk.rewind(slides[i])) return;
    const f = frags(slides[i]);
    const r = revealed(slides[i]);
    if (r > 0) {
      f[r - 1].classList.remove("is-on");
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
