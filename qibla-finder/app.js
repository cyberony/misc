(function () {
  'use strict';

  const {
    KM_PER_MILE, norm360, angleDiff, bearing, distanceKm, compassPoint, isValidCoord, formatCoords,
    formatAccuracy, shouldAcceptFix,
  } = window.QiblaGeo;
  const { declination } = window.QiblaDeclination;

  const GEOCODE_URL = 'https://geocoding-api.open-meteo.com/v1/search';
  const STORE_LOCATION = 'qibla.location';
  const STORE_THEME = 'qibla.theme';
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const C = 230;
  const R_FACE = 186;
  const R_KAABA = 152;
  const ALIGN_ENTER = 2.5;
  const ALIGN_EXIT = 5;
  const AT_KAABA_KM = 0.2;
  const GPS_PRECISE = { enableHighAccuracy: true, timeout: 12000, maximumAge: 5000 };
  const GPS_COARSE = { enableHighAccuracy: false, timeout: 10000, maximumAge: 10 * 60 * 1000 };

  const $ = (id) => document.getElementById(id);
  const app = $('app');
  const els = {
    eyebrow: $('eyebrow'),
    headline: $('headline'),
    subline: $('subline'),
    facts: $('facts'),
    bearing: $('fact-bearing'),
    point: $('fact-point'),
    distance: $('fact-distance'),
    distanceUnit: $('fact-distance-unit'),
    place: $('place'),
    placeName: $('place-name'),
    placeCoords: $('place-coords'),
    placeAccuracy: $('place-accuracy'),
    hint: $('hint'),
    announce: $('announce'),
    btnLocate: $('btn-locate'),
    btnPlace: $('btn-place'),
    themeToggle: $('theme-toggle'),
    dialog: $('place-dialog'),
    notice: $('place-notice'),
    cityForm: $('city-form'),
    cityInput: $('city-input'),
    cityStatus: $('city-status'),
    cityResults: $('city-results'),
    coords: $('coords'),
    coordsForm: $('coords-form'),
    latInput: $('lat-input'),
    lonInput: $('lon-input'),
    coordsStatus: $('coords-status'),
  };

  const state = {
    view: 'idle', // idle | locating | ready
    location: null, // { lat, lon, label, source: gps | city | coords, accuracy? }
    gpsFresh: false, // false while a GPS location is only the one remembered from the last visit
    qibla: 0,
    distanceKm: 0,
    declination: 0,
    compass: 'checking', // checking | prompt | live | denied | unavailable
    magnetic: null,
    lowAccuracy: false,
    aligned: false,
    message: '',
  };

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const coarsePointer = window.matchMedia('(pointer: coarse)');

  const store = {
    get(key) {
      try {
        return localStorage.getItem(key);
      } catch (e) {
        return null;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        /* private mode or storage disabled: the app still works for this visit */
      }
    },
  };

  /* ---------- Dial ---------- */

  const dial = { rot: null, needle: null, kaaba: null, arc: null, cardinals: [] };
  const shown = { heading: 0, needle: 0 };
  const target = { heading: 0, needle: 0 };
  const TAU = { heading: 110, needle: 320 };
  let frame = 0;
  let lastFrameTime = 0;

  function svg(tag, attrs, parent) {
    const el = document.createElementNS(SVG_NS, tag);
    for (const key in attrs) el.setAttribute(key, attrs[key]);
    if (parent) parent.appendChild(el);
    return el;
  }

  function polar(radius, angle) {
    const a = (angle * Math.PI) / 180;
    return [C + radius * Math.sin(a), C - radius * Math.cos(a)];
  }

  function buildDial() {
    const root = $('dial');
    svg('circle', { class: 'dial-halo', cx: C, cy: C, r: R_FACE + 6 }, root);
    svg('circle', { class: 'dial-face', cx: C, cy: C, r: R_FACE }, root);

    dial.rot = svg('g', {}, root);
    const ticks = svg('g', { class: 'dial-ticks' }, dial.rot);
    for (let a = 0; a < 360; a += 5) {
      const major = a % 30 === 0;
      svg(
        'line',
        {
          class: major ? 'tick tick-major' : 'tick',
          x1: C,
          y1: C - (major ? 164 : 171),
          x2: C,
          y2: C - 178,
          transform: `rotate(${a} ${C} ${C})`,
        },
        ticks
      );
    }

    ['N', 'E', 'S', 'W'].forEach((letter, i) => {
      const [x, y] = polar(213, i * 90);
      const el = svg('text', { class: i === 0 ? 'cardinal cardinal-north' : 'cardinal', x, y }, dial.rot);
      el.textContent = letter;
      dial.cardinals.push({ el, x, y });
    });

    const layer = svg('g', { class: 'qibla-layer' }, dial.rot);
    dial.arc = svg('path', { class: 'qibla-arc' }, layer);
    dial.needle = svg('g', {}, layer);
    svg('polygon', { class: 'needle-tail', points: `${C - 3.5},${C} ${C + 3.5},${C} ${C},${C + 52}` }, dial.needle);
    svg(
      'polygon',
      { class: 'needle-head', points: `${C - 3.5},${C} ${C + 3.5},${C} ${C},${C - R_KAABA + 10}` },
      dial.needle
    );
    dial.kaaba = svg('g', {}, dial.needle);
    svg(
      'rect',
      { class: 'kaaba-body', x: C - 11, y: C - R_KAABA - 11, width: 22, height: 22, rx: 3.5 },
      dial.kaaba
    );
    svg(
      'line',
      { class: 'kaaba-band', x1: C - 10.4, x2: C + 10.4, y1: C - R_KAABA - 4, y2: C - R_KAABA - 4 },
      dial.kaaba
    );
    svg('circle', { class: 'dial-hub', cx: C, cy: C, r: 5.5 }, dial.rot);

    svg(
      'polygon',
      { class: 'dial-pointer', points: `${C - 7},${C - 203} ${C + 7},${C - 203} ${C},${C - 191}` },
      root
    );
    renderDial();
  }

  function arcPath(q) {
    const signed = angleDiff(q, 0);
    if (Math.abs(signed) < 0.5 || Math.abs(signed) > 179.5) return '';
    const [x, y] = polar(R_FACE, q);
    return `M ${C} ${C - R_FACE} A ${R_FACE} ${R_FACE} 0 0 ${signed > 0 ? 1 : 0} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }

  function renderDial() {
    const h = shown.heading;
    const q = shown.needle;
    dial.rot.setAttribute('transform', `rotate(${(-h).toFixed(2)} ${C} ${C})`);
    for (const c of dial.cardinals) c.el.setAttribute('transform', `rotate(${h.toFixed(2)} ${c.x} ${c.y})`);
    dial.needle.setAttribute('transform', `rotate(${q.toFixed(2)} ${C} ${C})`);
    dial.kaaba.setAttribute('transform', `rotate(${(h - q).toFixed(2)} ${C} ${C - R_KAABA})`);
    dial.arc.setAttribute('d', arcPath(q));
  }

  function step(now) {
    const dt = lastFrameTime ? Math.min(100, now - lastFrameTime) : 16;
    lastFrameTime = now;
    let moving = false;
    for (const key of ['heading', 'needle']) {
      const d = angleDiff(target[key], shown[key]);
      if (Math.abs(d) < 0.05 || reducedMotion.matches) {
        shown[key] = target[key];
      } else {
        shown[key] = norm360(shown[key] + d * (1 - Math.exp(-dt / TAU[key])));
        moving = true;
      }
    }
    renderDial();
    if (moving) {
      frame = requestAnimationFrame(step);
    } else {
      frame = 0;
      lastFrameTime = 0;
    }
  }

  function animate() {
    if (!frame) frame = requestAnimationFrame(step);
  }

  /* ---------- Text ---------- */

  const usesMiles = /-(US|GB|LR|MM)\b/i.test(navigator.language || '');

  function formatDistance(km) {
    const value = usesMiles ? km / KM_PER_MILE : km;
    const digits = value < 100 ? 1 : 0;
    let text;
    try {
      text = new Intl.NumberFormat(undefined, { maximumFractionDigits: digits }).format(value);
    } catch (e) {
      text = value.toFixed(digits);
    }
    return [text, usesMiles ? 'mi' : 'km'];
  }

  function capitalise(text) {
    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  function setText(el, text) {
    if (el.textContent !== text) el.textContent = text;
  }

  function staticSubline() {
    switch (state.compass) {
      case 'prompt':
        return 'North is at the top of the dial. Tap anywhere to start the compass.';
      case 'denied':
        return 'North is at the top of the dial. Motion access is off, so the compass can’t follow your movement.';
      case 'unavailable':
        return coarsePointer.matches
          ? 'North is at the top of the dial. This device doesn’t report a compass heading.'
          : 'North is at the top of the dial. Open this page on a phone for a live compass.';
      default:
        return 'North is at the top of the dial.';
    }
  }

  function render() {
    app.dataset.view = state.view;
    app.dataset.compass = state.compass;
    app.dataset.aligned = String(state.aligned);

    const ready = state.view === 'ready';
    const locating = state.view === 'locating';
    const live = state.compass === 'live';
    const atKaaba = ready && state.distanceKm < AT_KAABA_KM;

    els.facts.hidden = !ready;
    els.place.hidden = !ready;
    els.btnLocate.hidden = ready;
    els.btnLocate.disabled = locating;
    els.btnPlace.disabled = locating;
    setText(els.btnPlace, ready ? 'Change location' : 'Choose a place');

    let headline;
    let subline;
    let hint = state.message;

    if (locating) {
      headline = 'Finding your location…';
      subline = 'Allow location access if your browser asks.';
    } else if (!ready) {
      headline = 'Find the Qibla from wherever you are.';
      subline = 'Share your location, or choose a place, to see the direction and distance to Mecca.';
    } else if (atKaaba) {
      headline = 'You are at the Kaaba.';
      subline = 'Every direction here faces it.';
    } else if (live) {
      const turn = angleDiff(state.qibla, target.heading);
      if (state.aligned) {
        headline = 'Facing the Qibla';
        subline = 'The top of your phone points to the Kaaba.';
      } else {
        headline = turn > 0 ? 'Turn right' : 'Turn left';
        subline = `${Math.max(1, Math.round(Math.abs(turn)))}° to go`;
      }
      hint =
        hint ||
        (state.lowAccuracy
          ? 'Compass accuracy is low. Move your phone in a figure of eight to calibrate it.'
          : 'Hold your phone flat, away from metal and magnets.');
    } else {
      headline = capitalise(compassPoint(state.qibla).name);
      subline = staticSubline();
    }

    setText(els.headline, headline);
    setText(els.subline, subline);
    setText(els.hint, hint);

    if (ready) {
      const [distance, unit] = formatDistance(state.distanceKm);
      setText(els.bearing, atKaaba ? '—' : `${state.qibla.toFixed(1)}°`);
      setText(els.point, atKaaba ? '' : compassPoint(state.qibla).abbr);
      setText(els.distance, distance);
      setText(els.distanceUnit, unit);
      const place = state.location;
      const fromGps = place.source === 'gps';
      // Fresh GPS coordinates speak for themselves; a remembered or chosen place is named.
      setText(els.placeName, fromGps ? (state.gpsFresh ? '' : 'Last visit') : place.label);
      setText(els.placeCoords, formatCoords(place.lat, place.lon, place.source === 'city' ? 2 : 5));
      setText(els.placeAccuracy, fromGps && state.gpsFresh ? formatAccuracy(place.accuracy) : '');
    }
  }

  function announce(text) {
    els.announce.textContent = text;
  }

  /* ---------- Location ---------- */

  function setLocation(location, { persist = true, quiet = false, fresh = true } = {}) {
    state.location = location;
    state.gpsFresh = location.source === 'gps' && fresh;
    state.qibla = bearing(location.lat, location.lon);
    state.distanceKm = distanceKm(location.lat, location.lon);
    state.declination = declination(location.lat, location.lon, new Date());
    state.view = 'ready';
    state.message = '';
    target.needle = state.qibla;
    if (persist) {
      const { lat, lon, label, source } = location;
      store.set(STORE_LOCATION, JSON.stringify({ lat, lon, label, source }));
    }
    updateHeading();
    if (!quiet) {
      const [distance, unit] = formatDistance(state.distanceKm);
      announce(
        `The Qibla is ${state.qibla.toFixed(1)} degrees from north, ${compassPoint(state.qibla).name}. ` +
          `${distance} ${unit === 'mi' ? 'miles' : 'kilometres'} to Mecca.`
      );
    }
  }

  function restoreLocation() {
    try {
      const saved = JSON.parse(store.get(STORE_LOCATION));
      if (saved && isValidCoord(saved.lat, saved.lon)) {
        const label = typeof saved.label === 'string' ? saved.label.slice(0, 120) : 'Saved location';
        let source = saved.source;
        if (source !== 'gps' && source !== 'city' && source !== 'coords') {
          source = label === 'Chosen coordinates' ? 'coords' : 'city';
        }
        setLocation({ lat: saved.lat, lon: saved.lon, label, source }, { persist: false, quiet: true, fresh: false });
        return true;
      }
    } catch (e) {
      /* nothing saved, or not valid JSON */
    }
    return false;
  }

  /* ---------- GPS ---------- */

  const gps = { run: 0, watchId: null, tracking: false, silent: false, fix: null, returnView: 'idle' };

  function clearGpsWatch() {
    if (gps.watchId !== null) {
      navigator.geolocation.clearWatch(gps.watchId);
      gps.watchId = null;
    }
  }

  function stopGps() {
    gps.run++;
    gps.tracking = false;
    clearGpsWatch();
  }

  function acceptFix(position) {
    const { latitude: lat, longitude: lon, accuracy } = position.coords;
    if (!isValidCoord(lat, lon)) return;
    const fix = { lat, lon, accuracy, time: Date.now() };
    if (!shouldAcceptFix(gps.fix, fix)) return;
    const first = !gps.fix;
    gps.fix = fix;
    setLocation({ lat, lon, accuracy, label: 'Current location', source: 'gps' }, { quiet: gps.silent || !first });
  }

  function gpsFailed(denied) {
    const silent = gps.silent;
    stopGps();
    if (silent && state.view === 'ready') {
      state.message = denied
        ? 'Location access is off. Showing where you were last time.'
        : 'Couldn’t update your location. Showing where you were last time.';
      render();
      return;
    }
    state.view = gps.returnView;
    render();
    openPlaceDialog(
      denied
        ? 'Location access is off. Search for your city, or enter coordinates, instead.'
        : 'Your location couldn’t be found just now. Search for your city instead, or try again.'
    );
  }

  // Asks for a precise fix and keeps listening, so the first rough position sharpens as the
  // GPS settles. If no precise fix arrives in time, one coarse (network) position is used.
  function watchGps() {
    const run = ++gps.run;
    let triedCoarse = false;
    clearGpsWatch();
    const onFix = (position) => {
      if (run === gps.run) acceptFix(position);
    };
    const onError = (error) => {
      if (run !== gps.run || gps.fix) return;
      if (error && error.code === 1) {
        gpsFailed(true);
      } else if (!triedCoarse) {
        triedCoarse = true;
        navigator.geolocation.getCurrentPosition(
          onFix,
          (coarseError) => {
            if (run === gps.run && !gps.fix) gpsFailed(Boolean(coarseError && coarseError.code === 1));
          },
          GPS_COARSE
        );
      }
    };
    gps.watchId = navigator.geolocation.watchPosition(onFix, onError, GPS_PRECISE);
  }

  function startGps({ silent = false } = {}) {
    if (!('geolocation' in navigator)) {
      if (!silent) openPlaceDialog('This browser can’t share its location. Search for your city instead.');
      return;
    }
    gps.tracking = true;
    gps.silent = silent;
    gps.fix = null;
    gps.returnView = state.view === 'ready' ? 'ready' : 'idle';
    if (!silent) {
      state.view = 'locating';
      state.message = '';
      render();
    }
    watchGps();
  }

  function onVisibilityChange() {
    if (!gps.tracking) return;
    if (document.hidden) {
      gps.run++;
      clearGpsWatch();
    } else {
      if (gps.fix) gps.silent = true;
      watchGps();
    }
  }

  /* ---------- Compass ---------- */

  let sensorTimer = 0;
  let lastGuidance = 0;

  function screenAngle() {
    const angle =
      window.screen && screen.orientation && typeof screen.orientation.angle === 'number'
        ? screen.orientation.angle
        : window.orientation;
    return typeof angle === 'number' ? angle : 0;
  }

  function updateHeading() {
    const live = state.compass === 'live' && state.magnetic !== null;
    target.heading = live ? norm360(state.magnetic + state.declination) : 0;

    const wasAligned = state.aligned;
    if (live && state.view === 'ready' && state.distanceKm >= AT_KAABA_KM) {
      const off = Math.abs(angleDiff(state.qibla, target.heading));
      state.aligned = off <= (wasAligned ? ALIGN_EXIT : ALIGN_ENTER);
    } else {
      state.aligned = false;
    }
    if (state.aligned && !wasAligned) {
      announce('Facing the Qibla.');
      // Browsers refuse to vibrate before the first tap, which an auto-started compass may not have had.
      const tapped = !navigator.userActivation || navigator.userActivation.hasBeenActive;
      if (navigator.vibrate && tapped) navigator.vibrate(18);
    }

    animate();
    render();
  }

  function onOrientation(event) {
    let magnetic = null;
    if (typeof event.webkitCompassHeading === 'number' && !Number.isNaN(event.webkitCompassHeading)) {
      magnetic = event.webkitCompassHeading;
      const accuracy = event.webkitCompassAccuracy;
      state.lowAccuracy = typeof accuracy === 'number' && (accuracy < 0 || accuracy > 30);
    } else if (event.absolute === true && typeof event.alpha === 'number') {
      magnetic = 360 - event.alpha;
    }
    if (magnetic === null) return;

    clearTimeout(sensorTimer);
    state.magnetic = norm360(magnetic + screenAngle());
    const becameLive = state.compass !== 'live';
    state.compass = 'live';

    // The dial eases on every event; the text only needs to keep up with reading speed.
    const now = Date.now();
    if (becameLive || now - lastGuidance > 120) {
      lastGuidance = now;
      updateHeading();
    } else {
      target.heading = norm360(state.magnetic + state.declination);
      animate();
    }
  }

  function listenForOrientation() {
    window.addEventListener('deviceorientationabsolute', onOrientation, true);
    window.addEventListener('deviceorientation', onOrientation, true);
  }

  function initCompass() {
    if (typeof window.DeviceOrientationEvent === 'undefined') {
      state.compass = 'unavailable';
      return;
    }
    listenForOrientation();
    // iOS only delivers headings once the page has asked for motion access. Some desktop
    // browsers expose the same method without having a compass, so only ask on touch devices.
    const needsPermission =
      typeof DeviceOrientationEvent.requestPermission === 'function' &&
      (navigator.maxTouchPoints > 0 || coarsePointer.matches);
    if (needsPermission) {
      requestCompass('load');
      return;
    }
    sensorTimer = setTimeout(() => {
      if (state.compass === 'checking') {
        state.compass = 'unavailable';
        render();
      }
    }, 2500);
  }

  let compassAsking = false;
  let touchEndRefusals = 0;
  let clickRefusals = 0;

  function onGesture(event) {
    if (event.type === 'touchend' && touchEndRefusals >= 2) return;
    requestCompass(event.type);
  }

  function waitForGesture(on) {
    const method = on ? 'addEventListener' : 'removeEventListener';
    document[method]('touchend', onGesture, true);
    document[method]('click', onGesture, true);
  }

  // Safari answers straight away when motion access was already decided, and otherwise only
  // asks from inside a tap. So this is tried on load, then again on the first tap anywhere.
  function requestCompass(trigger) {
    if (compassAsking || state.compass === 'live' || state.compass === 'denied') return;
    compassAsking = true;
    let request;
    try {
      request = Promise.resolve(DeviceOrientationEvent.requestPermission());
    } catch (e) {
      request = Promise.reject(e);
    }
    request.then(
      (result) => {
        compassAsking = false;
        waitForGesture(false);
        if (state.compass === 'live') return;
        if (result === 'granted') {
          state.compass = 'checking';
          clearTimeout(sensorTimer);
          sensorTimer = setTimeout(() => {
            if (state.compass !== 'live') {
              state.compass = 'unavailable';
              render();
            }
          }, 3000);
        } else {
          state.compass = 'denied';
        }
        render();
      },
      () => {
        compassAsking = false;
        if (state.compass === 'live') return;
        if (trigger === 'touchend') touchEndRefusals++;
        if (trigger === 'click') clickRefusals++;
        if (clickRefusals >= 2) {
          // Refused from a real tap twice: the page is not allowed to ask here at all.
          waitForGesture(false);
          state.compass = 'unavailable';
        } else {
          state.compass = 'prompt';
          waitForGesture(true);
        }
        render();
      }
    );
  }

  /* ---------- Place dialog ---------- */

  let searchTimer = 0;
  let searchSeq = 0;
  let searchAbort = null;

  function setStatus(el, text, tone) {
    el.textContent = text;
    if (tone) el.dataset.tone = tone;
    else delete el.dataset.tone;
  }

  function openPlaceDialog(notice) {
    els.notice.hidden = !notice;
    els.notice.textContent = notice || '';
    setStatus(els.coordsStatus, '');
    if (!els.dialog.open) {
      searchSeq++;
      els.cityInput.value = '';
      els.cityResults.textContent = '';
      setStatus(els.cityStatus, '');
      if (typeof els.dialog.showModal === 'function') els.dialog.showModal();
      else els.dialog.setAttribute('open', '');
    }
    if (!coarsePointer.matches) els.cityInput.focus();
  }

  function closePlaceDialog() {
    if (typeof els.dialog.close === 'function') els.dialog.close();
    else els.dialog.removeAttribute('open');
  }

  function renderResults(results) {
    els.cityResults.textContent = '';
    for (const place of results) {
      const region = [place.admin1, place.country].filter((part) => part && part !== place.name).join(', ');
      const item = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'result';
      const name = document.createElement('span');
      name.className = 'result-name';
      name.textContent = place.name;
      const sub = document.createElement('span');
      sub.className = 'result-region';
      sub.textContent = region;
      button.append(name, sub);
      button.addEventListener('click', () => {
        const label = place.country && place.country !== place.name ? `${place.name}, ${place.country}` : place.name;
        stopGps();
        setLocation({ lat: place.latitude, lon: place.longitude, label, source: 'city' });
        closePlaceDialog();
      });
      item.appendChild(button);
      els.cityResults.appendChild(item);
    }
  }

  function searchPlaces(query) {
    const seq = ++searchSeq;
    if (searchAbort) searchAbort.abort();
    searchAbort = typeof AbortController === 'function' ? new AbortController() : null;
    const abort = searchAbort;
    const timeout = setTimeout(() => abort && abort.abort(), 8000);
    const language = /^[a-z]{2}/i.test(navigator.language || '') ? navigator.language.slice(0, 2).toLowerCase() : 'en';
    const url = `${GEOCODE_URL}?name=${encodeURIComponent(query)}&count=6&language=${language}&format=json`;

    setStatus(els.cityStatus, 'Searching…');
    fetch(url, abort ? { signal: abort.signal } : undefined)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((data) => {
        if (seq !== searchSeq) return;
        const results = (Array.isArray(data.results) ? data.results : []).filter(
          (place) => place && typeof place.name === 'string' && isValidCoord(place.latitude, place.longitude)
        );
        renderResults(results);
        setStatus(
          els.cityStatus,
          results.length ? '' : 'No places found with that name. Check the spelling, or enter coordinates below.'
        );
      })
      .catch(() => {
        if (seq !== searchSeq) return;
        els.cityResults.textContent = '';
        setStatus(els.cityStatus, 'Place search isn’t available right now. You can enter coordinates below.', 'error');
        els.coords.open = true;
      })
      .then(() => clearTimeout(timeout));
  }

  function onCityInput() {
    clearTimeout(searchTimer);
    const query = els.cityInput.value.trim();
    if (query.length < 2) {
      searchSeq++;
      if (searchAbort) searchAbort.abort();
      els.cityResults.textContent = '';
      setStatus(els.cityStatus, '');
      return;
    }
    searchTimer = setTimeout(() => searchPlaces(query), 280);
  }

  function parseCoordinate(text, positive, negative) {
    const match = text
      .trim()
      .replace(',', '.')
      .match(/^([+-]?\d+(?:\.\d+)?)\s*°?\s*([a-z])?$/i);
    if (!match) return NaN;
    const value = parseFloat(match[1]);
    const hemisphere = (match[2] || '').toUpperCase();
    if (!hemisphere) return value;
    if (hemisphere === positive) return Math.abs(value);
    if (hemisphere === negative) return -Math.abs(value);
    return NaN;
  }

  function onCoordsSubmit(event) {
    event.preventDefault();
    const lat = parseCoordinate(els.latInput.value, 'N', 'S');
    const lon = parseCoordinate(els.lonInput.value, 'E', 'W');
    if (!Number.isFinite(lat) || Math.abs(lat) > 90) {
      setStatus(els.coordsStatus, 'Latitude should be a number between −90 and 90.', 'error');
      els.latInput.focus();
      return;
    }
    if (!Number.isFinite(lon) || Math.abs(lon) > 180) {
      setStatus(els.coordsStatus, 'Longitude should be a number between −180 and 180.', 'error');
      els.lonInput.focus();
      return;
    }
    stopGps();
    setLocation({ lat, lon, label: 'Chosen coordinates', source: 'coords' });
    closePlaceDialog();
  }

  /* ---------- Theme ---------- */

  const darkScheme = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0c1311' : '#f4f1e9');
    els.themeToggle.setAttribute('aria-label', theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  }

  function initTheme() {
    applyTheme(document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');
    els.themeToggle.addEventListener('click', () => {
      const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
      store.set(STORE_THEME, next);
      applyTheme(next);
    });
    const followSystem = (event) => {
      if (!store.get(STORE_THEME)) applyTheme(event.matches ? 'dark' : 'light');
    };
    if (darkScheme.addEventListener) darkScheme.addEventListener('change', followSystem);
    else if (darkScheme.addListener) darkScheme.addListener(followSystem);
  }

  /* ---------- Start ---------- */

  function init() {
    initTheme();
    buildDial();
    initCompass();

    els.btnLocate.addEventListener('click', () => startGps());
    els.btnPlace.addEventListener('click', () => openPlaceDialog(''));
    $('place-close').addEventListener('click', closePlaceDialog);
    $('place-locate').addEventListener('click', () => {
      closePlaceDialog();
      startGps();
    });
    els.dialog.addEventListener('click', (event) => {
      if (event.target !== els.dialog) return;
      const box = els.dialog.getBoundingClientRect();
      const inside =
        event.clientX >= box.left && event.clientX <= box.right && event.clientY >= box.top && event.clientY <= box.bottom;
      if (!inside) closePlaceDialog();
    });
    els.cityInput.addEventListener('input', onCityInput);
    els.cityForm.addEventListener('submit', (event) => {
      event.preventDefault();
      clearTimeout(searchTimer);
      const query = els.cityInput.value.trim();
      if (query.length >= 2) searchPlaces(query);
    });
    els.coordsForm.addEventListener('submit', onCoordsSubmit);

    const restored = restoreLocation();
    render();

    document.addEventListener('visibilitychange', onVisibilityChange);

    if (restored) {
      // A returning visitor who used GPS gets a fresh fix without asking for it again;
      // one who chose a place keeps that place.
      if (state.location.source === 'gps') startGps({ silent: true });
    } else if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'geolocation' })
        .then((status) => {
          if (status.state === 'granted' && state.view === 'idle') startGps();
        })
        .catch(() => {});
    }
  }

  init();
})();
