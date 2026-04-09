const LS_COMMENTS_STORE = "aiPerspectives2026.v2.commentsByAssignment";
const LS_KEY_LEGACY = "aiPerspectives2026.v1.comments";
/** Set after one-time migration of legacy local comment cache into server files. */
const LS_COMMENTS_MIGRATED_TO_FILE = "aiPerspectives2026.v1.commentsMigratedToFile";
const LS_LAST_ASSIGNMENT = "aiPerspectives2026.v1.lastAssignmentId";
/** Override base URL only if polish is on another host (optional). */
const LS_POLISH_URL = "aiPerspectives2026.v1.polishProxy";

/** ai-compendium: data + APIs under magic-page session (see /magic-word.html). */
const REVIEW_DATA_BASE = "/api/instructor-review/static/";
const REVIEW_API_PREFIX = "/api/instructor-review";

const ICON_MIC = `<svg class="btn-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>`;

const ICON_STOP = `<svg class="btn-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="1"/></svg>`;

const ICON_POLISH = `<svg class="btn-svg" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m21.64 3.64-1.28-1.28a1.21 1.21 0 0 0-1.72 0L2.36 18.64a1.21 1.21 0 0 0 0 1.72l1.28 1.28a1.2 1.2 0 0 0 1.72 0L21.64 5.36a1.2 1.2 0 0 0 0-1.72Z"/><path d="m14 7 3 3"/><path d="M5 6v4"/><path d="M19 14v4"/><path d="M10 2v2"/><path d="M7 8H3"/><path d="M21 16h-4"/><path d="M11 3H9"/></svg>`;

const ICON_SPINNER = `<svg class="btn-svg icon-spin" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke-dasharray="42" stroke-dashoffset="12" stroke-linecap="round"/></svg>`;

const ICON_INSTRUCTION_RAW = `<svg class="btn-svg" xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="5.5" y="7" width="13" height="13" rx="2.5"/><path d="M12 7V4"/><circle cx="12" cy="3" r="1.5"/><path d="M5.5 12c-1.4 0-2.5 1.1-2.5 2.5S4.1 17 5.5 17"/><path d="M18.5 12c1.4 0 2.5 1.1 2.5 2.5S19.9 17 18.5 17"/><circle cx="9.5" cy="12.5" r="1.3"/><circle cx="14.5" cy="12.5" r="1.3"/><line x1="10" y1="16" x2="14" y2="16"/></svg>`;
const ICON_INSTRUCTION_POLISH = ICON_INSTRUCTION_RAW;

const ARIA_ASSIST_RAW =
  "Instruction mode for rough transcript: next mic tells the AI how to edit the first box";
const ARIA_ASSIST_POLISH =
  "Instruction mode for polished note: next mic tells the AI how to edit the second box";

function syncInstructionButtons() {
  const rawBtn = document.getElementById("btnAssist");
  const polBtn = document.getElementById("btnAssistPolish");
  if (rawBtn) rawBtn.setAttribute("aria-pressed", "false");
  if (polBtn) polBtn.setAttribute("aria-pressed", "false");
}

function dictateButtonIdle() {
  const btn = document.getElementById("btnDictate");
  if (!btn) return;
  btn.innerHTML = ICON_MIC;
  btn.classList.remove("icon-tool-busy");
  btn.setAttribute("aria-label", "Record and transcribe");
}

function dictateButtonRecording() {
  const btn = document.getElementById("btnDictate");
  if (!btn) return;
  btn.innerHTML = ICON_STOP;
  btn.classList.remove("icon-tool-busy");
  btn.setAttribute("aria-label", "Stop recording and transcribe");
}

function dictateButtonTranscribing() {
  const btn = document.getElementById("btnDictate");
  if (!btn) return;
  btn.innerHTML = ICON_MIC;
  btn.classList.remove("icon-tool-busy");
  btn.setAttribute("aria-label", "Transcribing…");
}

function polishButtonIdle() {
  const btn = document.getElementById("btnPolish");
  if (!btn) return;
  btn.innerHTML = ICON_POLISH;
  btn.setAttribute("aria-label", "Polish new transcription");
}

function polishButtonBusy() {
  const btn = document.getElementById("btnPolish");
  if (!btn) return;
  btn.innerHTML = ICON_POLISH;
  btn.setAttribute("aria-label", "Polishing…");
}

function instructionBubblesResetVisuals() {
  const rawBtn = document.getElementById("btnAssist");
  const polBtn = document.getElementById("btnAssistPolish");
  if (rawBtn) {
    rawBtn.innerHTML = ICON_INSTRUCTION_RAW;
    rawBtn.classList.remove("listening");
    rawBtn.setAttribute("aria-label", ARIA_ASSIST_RAW);
  }
  if (polBtn) {
    polBtn.innerHTML = ICON_INSTRUCTION_POLISH;
    polBtn.classList.remove("listening");
    polBtn.setAttribute("aria-label", ARIA_ASSIST_POLISH);
  }
}

/** Only the bubble that started instruction capture shows stop (mic never changes bubbles). */
function instructionBubbleShowStopFor(target) {
  const rawBtn = document.getElementById("btnAssist");
  const polBtn = document.getElementById("btnAssistPolish");
  if (target === "raw" && rawBtn) {
    rawBtn.innerHTML = ICON_STOP;
    rawBtn.classList.add("listening");
    rawBtn.setAttribute(
      "aria-label",
      "Stop recording and apply your spoken instruction to the rough transcript"
    );
  }
  if (target === "polish" && polBtn) {
    polBtn.innerHTML = ICON_STOP;
    polBtn.classList.add("listening");
    polBtn.setAttribute(
      "aria-label",
      "Stop recording and apply your spoken instruction to the polished note"
    );
  }
}

function stopDictateRecording() {
  if (!isRecording || !mediaRecorder) return false;
  try {
    mediaRecorder.stop();
    return true;
  } catch (e) {
    console.error(e);
    abortRecording();
    toast("Could not stop recording.");
    return false;
  }
}

let bundle = null;
/** @type {Record<string, { transcribe: string; polish: string; polishTranscribeEnd: number }>} */
let comments = {};
/** @type {{ id: string; title: string; dir: string }[]} */
let assignmentManifest = [];
let currentAssignmentId = null;
let selectedId = null;
/** Block persistCommentsFromDom while selectedId and textareas are out of sync (avoids saving wrong id + stale DOM). */
let suppressCommentPersist = false;
/** Serialize server writes so each text change persists in order. */
let persistQueue = Promise.resolve();
let _polishBusy = false;
/** While MediaRecorder runs: how this capture will be used after transcribe. */
let activeRecordingKind = null; // null | "plain" | "raw" | "polish"

function normalizeCommentEntry(val) {
  const base = { transcribe: "", polish: "", polishTranscribeEnd: 0, exportPreferred: null };
  if (val == null) return base;
  if (typeof val === "string") {
    return { ...base, transcribe: val, polish: "", exportPreferred: null };
  }
  if (typeof val === "object") {
    const transcribe = typeof val.transcribe === "string" ? val.transcribe : "";
    const polish = typeof val.polish === "string" ? val.polish : "";
    let polishTranscribeEnd =
      typeof val.polishTranscribeEnd === "number" && val.polishTranscribeEnd >= 0
        ? val.polishTranscribeEnd
        : polish.trim()
          ? transcribe.length
          : 0;
    if (polishTranscribeEnd > transcribe.length) polishTranscribeEnd = transcribe.length;
    const exportPreferred =
      val.exportPreferred === "polish" || val.exportPreferred === "transcribe"
        ? val.exportPreferred
        : null;
    return { transcribe, polish, polishTranscribeEnd, exportPreferred };
  }
  return base;
}

function normalizeCommentsObject(obj) {
  const out = {};
  for (const k of Object.keys(obj || {})) {
    out[k] = normalizeCommentEntry(obj[k]);
  }
  return out;
}

function assignmentFileUrl(dir, fileName) {
  const segs = dir.split("/").filter(Boolean).map((s) => encodeURIComponent(s));
  return `${REVIEW_DATA_BASE}assignments/${segs.join("/")}/${encodeURIComponent(fileName)}`;
}

function getCurrentAssignmentEntry() {
  return assignmentManifest.find((a) => a.id === currentAssignmentId) ?? null;
}

function formatMetaLine() {
  const n = bundle?.students?.length ?? 0;
  return n === 1 ? "1 student" : `${n} students`;
}

/** Optional top-level field in students.json: YYYY-MM-DD (US Central Time calendar date, inclusive; same zone as America/Chicago). */
function getDueDateYmdFromBundle(b) {
  const raw = b?.dueDate;
  if (typeof raw !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(raw.trim())) return null;
  return raw.trim();
}

/** Wall-clock time in America/Chicago → absolute instant (handles CDT/CST). */
function parseWallClockChicago(ymd, hms) {
  const [y, mo, d] = ymd.split("-").map(Number);
  const [h, mi, se] = hms.split(":").map(Number);
  const pad = (n) => String(n).padStart(2, "0");
  const base = `${y}-${pad(mo)}-${pad(d)}T${pad(h)}:${pad(mi)}:${pad(se)}`;
  for (const off of ["-05:00", "-06:00", "-04:00"]) {
    const dt = new Date(base + off);
    if (isNaN(dt.getTime())) continue;
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/Chicago",
      year: "numeric",
      month: "numeric",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      second: "numeric",
      hour12: false,
    }).formatToParts(dt);
    const get = (t) => {
      const p = parts.find((x) => x.type === t);
      return p ? +p.value : NaN;
    };
    if (
      get("year") === y &&
      get("month") === mo &&
      get("day") === d &&
      get("hour") === h &&
      get("minute") === mi &&
      get("second") === se
    ) {
      return dt;
    }
  }
  return null;
}

/** CDT vs CST for an instant (US Central Time / America/Chicago; follows US DST rules). */
function getCentralAbbreviationForInstant(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return "CT";
  const longName = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    timeZoneName: "long",
  })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName")?.value;
  if (longName === "Central Standard Time") return "CST";
  if (longName === "Central Daylight Time") return "CDT";
  const shortName = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Chicago",
    timeZoneName: "short",
  })
    .formatToParts(d)
    .find((p) => p.type === "timeZoneName")?.value;
  return shortName === "CST" || shortName === "CDT" ? shortName : "CT";
}

/** Stored wall clock + CDT or CST (not the word “Chicago”). */
function formatInstantAsCentralWallClock(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return "";
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? "";
  const abbr = getCentralAbbreviationForInstant(d);
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")} ${abbr}`;
}

/** YYYY-MM-DD in US Central Time for an absolute instant. */
function getCentralTimeYmdFromInstant(d) {
  if (!(d instanceof Date) || isNaN(d.getTime())) return null;
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  const parts = fmt.formatToParts(d);
  const get = (t) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

/** Parse Canvas export `… UTC`, stored `… CDT|CST` (or legacy `… Chicago`), or ISO 8601. */
function parseCanvasSubmittedUtc(submitted) {
  if (!submitted || typeof submitted !== "string") return null;
  const s = submitted.trim();
  if (!s.includes("T")) {
    const mUtc = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) UTC$/);
    if (mUtc) return new Date(`${mUtc[1]}T${mUtc[2]}Z`);
    const mChi = s.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) (Chicago|CDT|CST)$/);
    if (mChi) return parseWallClockChicago(mChi[1], mChi[2]);
    return null;
  }
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

/** Whole calendar days late: submission date (Central Time) vs due YYYY-MM-DD (Central Time calendar, inclusive). */
function calendarDaysLateCentral(submittedStr, dueDateYmd) {
  const sub = parseCanvasSubmittedUtc(submittedStr);
  if (!sub || !dueDateYmd) return null;
  const subDay = getCentralTimeYmdFromInstant(sub);
  if (!subDay) return null;
  if (subDay <= dueDateYmd) return 0;
  const tDue = Date.UTC(
    parseInt(dueDateYmd.slice(0, 4), 10),
    parseInt(dueDateYmd.slice(5, 7), 10) - 1,
    parseInt(dueDateYmd.slice(8, 10), 10),
  );
  const tSub = Date.UTC(
    parseInt(subDay.slice(0, 4), 10),
    parseInt(subDay.slice(5, 7), 10) - 1,
    parseInt(subDay.slice(8, 10), 10),
  );
  return Math.round((tSub - tDue) / 86400000);
}

function formatDueDateReadableCentral(ymd) {
  const y = parseInt(ymd.slice(0, 4), 10);
  const mo = parseInt(ymd.slice(5, 7), 10);
  const day = parseInt(ymd.slice(8, 10), 10);
  const pad = (n) => String(n).padStart(2, "0");
  const ymdStr = `${y}-${pad(mo)}-${pad(day)}`;
  const inst = parseWallClockChicago(ymdStr, "12:00:00");
  if (!inst) return ymd;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "America/Chicago",
  }).format(inst);
}

function formatSubmittedReadableUtc(submitted) {
  const d = parseCanvasSubmittedUtc(submitted);
  if (!d) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/Chicago",
    timeZoneName: "long",
  }).format(d);
}

function updateAssignmentDueBanner() {
  const wrap = document.getElementById("assignmentDueWrap");
  const pill = document.getElementById("assignmentDuePill");
  if (!wrap || !pill) return;
  if (!currentAssignmentId || !bundle) {
    wrap.hidden = true;
    return;
  }
  wrap.hidden = false;
  pill.hidden = false;
  const ymd = getDueDateYmdFromBundle(bundle);
  pill.classList.toggle("due-pill--empty", !ymd);
  if (!ymd) {
    pill.textContent = "No due date set";
    pill.title = "No due date — click to set. Used for on-time vs late (Central Time date).";
    pill.setAttribute("aria-label", "No due date set. Click to choose assignment due date.");
    return;
  }
  const readable = formatDueDateReadableCentral(ymd);
  pill.textContent = `Due ${readable}`;
  pill.title = `Due date ${ymd} (Central Time calendar day, inclusive). Click to change.`;
  pill.setAttribute("aria-label", `Assignment due ${readable}. Click to change.`);
}

function applyDueDateFromServerResponse(dueDate) {
  if (!bundle) return;
  if (dueDate && typeof dueDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dueDate.trim())) {
    bundle.dueDate = dueDate.trim();
  } else {
    delete bundle.dueDate;
  }
}

async function patchAssignmentDueDate(ymdOrNull) {
  if (!currentAssignmentId) return false;
  const res = await fetch(`${REVIEW_API_PREFIX}/patch-assignment-meta`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      assignmentId: currentAssignmentId,
      dueDate: ymdOrNull === null || ymdOrNull === undefined ? null : String(ymdOrNull),
    }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast(data.error || `Save failed (${res.status})`);
    return false;
  }
  applyDueDateFromServerResponse(data.dueDate);
  return true;
}

function wireDueDateEditor() {
  const modal = document.getElementById("dueDateModal");
  const backdrop = document.getElementById("dueDateModalBackdrop");
  const inp = document.getElementById("dueDateInput");
  const pill = document.getElementById("assignmentDuePill");
  const closeBtn = document.getElementById("dueDateModalClose");
  const save = document.getElementById("dueDateModalSave");
  const clearBtn = document.getElementById("dueDateModalClear");
  if (!modal || !inp || !pill) return;

  function openDueDateModal() {
    if (!currentAssignmentId || !bundle) return;
    inp.value = getDueDateYmdFromBundle(bundle) || "";
    modal.hidden = false;
    modal.setAttribute("aria-hidden", "false");
    inp.focus();
  }

  function closeDueDateModal() {
    modal.hidden = true;
    modal.setAttribute("aria-hidden", "true");
  }

  function refreshDueUiAfterSave() {
    updateAssignmentDueBanner();
    const s = bundle?.students?.find((x) => String(x.id) === selectedId);
    updateStudentSubmissionMeta(s || null);
  }

  pill.addEventListener("click", openDueDateModal);
  backdrop?.addEventListener("click", closeDueDateModal);
  closeBtn?.addEventListener("click", closeDueDateModal);
  clearBtn?.addEventListener("click", async () => {
    if (!currentAssignmentId) return;
    const ok = await patchAssignmentDueDate(null);
    if (ok) {
      closeDueDateModal();
      refreshDueUiAfterSave();
      toast("Due date cleared");
    }
  });
  async function saveDueDateFromModal() {
    if (!currentAssignmentId) return;
    const v = inp.value?.trim() || "";
    const ok = await patchAssignmentDueDate(v || null);
    if (ok) {
      closeDueDateModal();
      refreshDueUiAfterSave();
      toast(v ? "Due date saved" : "Due date cleared");
    }
  }

  save?.addEventListener("click", () => {
    void saveDueDateFromModal();
  });

  inp?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    void saveDueDateFromModal();
  });
}

function updateStudentSubmissionMeta(student) {
  const el = document.getElementById("studentSubmissionMeta");
  if (!el) return;
  if (!student) {
    el.textContent = "";
    el.hidden = true;
    el.classList.remove("student-submission-meta--late");
    return;
  }
  el.hidden = false;
  const subFmt = formatSubmittedReadableUtc(student.submitted);
  const dueYmd = getDueDateYmdFromBundle(bundle);
  if (!dueYmd) {
    el.textContent = subFmt ? `Submitted ${subFmt}` : "";
    el.classList.remove("student-submission-meta--late");
    return;
  }
  const lateDays = calendarDaysLateCentral(student.submitted, dueYmd);
  if (lateDays === null) {
    el.textContent = subFmt ? `Submitted ${subFmt}` : "—";
    el.classList.remove("student-submission-meta--late");
    return;
  }
  el.classList.toggle("student-submission-meta--late", lateDays > 0);
  const status =
    lateDays === 0 ? "On time" : lateDays === 1 ? "1 day late" : `${lateDays} days late`;
  el.textContent = subFmt ? `Submitted ${subFmt} · ${status}` : status;
}

/**
 * One-time: old builds cached comments in localStorage. Push any non-empty data to server files, then drop the cache.
 * Source of truth after this is `data/.../comments.json` only.
 */
/** Avoid stale HTTP cache of JSON (comments.json looked empty in the UI after disk was fixed). */
const REVIEW_STATIC_FETCH = { cache: "no-store", credentials: "include" };

/**
 * manifest.json may omit sourceFile (older uploads); students.json has it. Without this, only
 * assignments already loaded in-session get option[title] tooltips until you switch tabs.
 */
async function enrichManifestSourceFilesFromDisk() {
  if (!assignmentManifest.length) return;
  const bust = `t=${Date.now()}`;
  await Promise.all(
    assignmentManifest.map(async (a, i) => {
      if (a.sourceFile && String(a.sourceFile).trim()) return;
      if (!a.dir) return;
      try {
        const url = `${assignmentFileUrl(a.dir, "students.json")}?${bust}`;
        const res = await fetch(url, REVIEW_STATIC_FETCH);
        if (!res.ok) return;
        const doc = await res.json();
        const sf = typeof doc.sourceFile === "string" ? doc.sourceFile.trim() : "";
        if (!sf) return;
        assignmentManifest[i] = { ...assignmentManifest[i], sourceFile: sf };
      } catch {
        /* ignore */
      }
    }),
  );
}

async function migrateLegacyLocalCommentsToServerOnce() {
  try {
    if (localStorage.getItem(LS_COMMENTS_MIGRATED_TO_FILE) === "1") return;
  } catch {
    return;
  }
  let store = null;
  try {
    const raw = localStorage.getItem(LS_COMMENTS_STORE);
    if (raw) {
      const o = JSON.parse(raw);
      if (o && typeof o === "object" && !Array.isArray(o)) store = o;
    }
    if (!store) {
      const leg = localStorage.getItem(LS_KEY_LEGACY);
      if (leg) {
        const o = JSON.parse(leg);
        const flat = normalizeCommentsObject(o && typeof o === "object" ? o : {});
        store = { "thoughts-on-ai": flat };
      }
    }
  } catch (e) {
    console.warn(e);
  }
  if (!store || typeof store !== "object") {
    try {
      localStorage.setItem(LS_COMMENTS_MIGRATED_TO_FILE, "1");
    } catch {
      /* ignore */
    }
    return;
  }

  let failed = 0;
  for (const assignmentId of Object.keys(store)) {
    const rawMap = store[assignmentId];
    if (!rawMap || typeof rawMap !== "object" || Array.isArray(rawMap)) continue;
    const c = normalizeCommentsObject(rawMap);
    let hasText = false;
    for (const v of Object.values(c)) {
      if (v && (String(v.transcribe || "").trim() || String(v.polish || "").trim())) {
        hasText = true;
        break;
      }
    }
    if (!hasText) continue;
    try {
      const res = await fetch(`${REVIEW_API_PREFIX}/save-comments`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assignmentId, comments: c }),
      });
      if (!res.ok) {
        failed += 1;
        console.warn("migrate comments failed for", assignmentId, res.status);
      }
    } catch (e) {
      failed += 1;
      console.warn("migrate comments", assignmentId, e);
    }
  }
  try {
    if (failed === 0) {
      localStorage.removeItem(LS_COMMENTS_STORE);
      localStorage.removeItem(LS_KEY_LEGACY);
      localStorage.setItem(LS_COMMENTS_MIGRATED_TO_FILE, "1");
    }
  } catch {
    /* ignore */
  }
}

async function loadAssignmentBundle(id) {
  const entry = assignmentManifest.find((a) => a.id === id);
  if (!entry?.dir) {
    toast("Unknown assignment");
    return;
  }
  flushCommentToMap();
  await persistQueue;
  /* Keep currentAssignmentId on the old assignment until comments are replaced.
     Otherwise a save during the fetch below uses the NEW id with the OLD in-memory
     map and can corrupt the wrong comments.json (e.g. wipe another assignment). */
  try {
    localStorage.setItem(LS_LAST_ASSIGNMENT, id);
  } catch (_) {
    /* ignore */
  }

  /* Canvas ids are global: the same student id can appear on another assignment.
     If we keep selectedId set, the first selectStudent() after merge runs
     flushCommentToMap() while the textareas still show the *previous* assignment's
     text for that id and overwrites the merged comments (often with ""), wiping disk. */
  selectedId = null;

  const bust = `t=${Date.now()}`;
  const stuUrl = `${assignmentFileUrl(entry.dir, "students.json")}?${bust}`;
  const comUrl = `${assignmentFileUrl(entry.dir, "comments.json")}?${bust}`;
  const stuRes = await fetch(stuUrl, REVIEW_STATIC_FETCH);
  if (!stuRes.ok) throw new Error(`students.json missing for assignment: ${id}`);
  bundle = await stuRes.json();
  const sf = typeof bundle.sourceFile === "string" ? bundle.sourceFile.trim() : "";
  if (sf) {
    const ix = assignmentManifest.findIndex((a) => a.id === id);
    if (ix >= 0) {
      assignmentManifest[ix] = { ...assignmentManifest[ix], sourceFile: sf };
      const sel = document.getElementById("assignmentSelect");
      const opt = sel?.querySelector(`option[value="${id}"]`);
      if (opt) opt.title = sf;
    }
  }
  comments = {};
  const comRes = await fetch(comUrl, REVIEW_STATIC_FETCH);
  if (comRes.ok) {
    const comFile = await comRes.json();
    mergeCommentsFromFile(comFile);
  } else {
    toast(`Could not load comments.json (${comRes.status}). Using empty comments.`);
  }
  currentAssignmentId = id;
  syncAssignmentSelectTooltip();
  renderStudents();
  if (bundle.students?.length) {
    selectStudent(bundle.students[0].id);
  } else {
    abortRecording();
    selectedId = null;
    document.querySelectorAll(".student-block.selected").forEach((el) => el.classList.remove("selected"));
    const tr = getTranscribeBox();
    const pl = getPolishBox();
    document.getElementById("commentTitle").textContent = "Comments";
    updateStudentSubmissionMeta(null);
    if (tr) {
      tr.disabled = true;
      tr.value = "";
    }
    if (pl) {
      pl.disabled = true;
      pl.value = "";
    }
    updateCommentTools();
  }
}

function getTranscribeBox() {
  return document.getElementById("transcribeBox");
}

function getPolishBox() {
  return document.getElementById("polishBox");
}

function ensureCommentEntry(id) {
  if (!id) return;
  if (!comments[id]) comments[id] = normalizeCommentEntry(null);
}

function persistCommentsFromDom() {
  if (suppressCommentPersist) return;
  if (!selectedId) return;
  ensureCommentEntry(selectedId);
  const tr = getTranscribeBox();
  const pl = getPolishBox();
  if (!tr || !pl) return;
  const cur = comments[selectedId];
  comments[selectedId] = {
    transcribe: tr.value,
    polish: pl.value,
    polishTranscribeEnd: cur.polishTranscribeEnd,
    exportPreferred:
      cur.exportPreferred === "polish" || cur.exportPreferred === "transcribe"
        ? cur.exportPreferred
        : null,
  };
  schedulePersistCommentsToFile();
}

/** MediaRecorder dictation (OpenAI Whisper via server — no Google speech API). */
let mediaRecorder = null;
let recordStream = null;
let recordChunks = [];
let isRecording = false;
let activeRecordId = 0;
let mainTranscribeInFlight = false;

function pickAudioMime() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const t of candidates) {
    if (window.MediaRecorder && MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

function cleanupMicStream() {
  if (recordStream) {
    recordStream.getTracks().forEach((t) => t.stop());
    recordStream = null;
  }
}

function questionOneLine(text) {
  return (text || "")
    .replace(/\s*\n\s*/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function toast(msg) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => el.classList.remove("show"), 2200);
}

const KITT_SCAN_IDS = ["btnDictate", "btnPolish", "btnAssist", "btnAssistPolish"];

/** Knight Rider–style scanner on the active tool (mic, wand, or assist). */
function clearKittScan() {
  for (const bid of KITT_SCAN_IDS) {
    const el = document.getElementById(bid);
    if (el) {
      el.classList.remove("kitt-scan");
      el.removeAttribute("aria-busy");
    }
  }
}

function setKittScan(id) {
  clearKittScan();
  if (!id) return;
  const el = document.getElementById(id);
  if (el) {
    el.classList.add("kitt-scan");
    el.setAttribute("aria-busy", "true");
  }
}

function showDeleteConfirmDialog(message, onConfirm) {
  const wrap = document.getElementById("confirmDeleteDialog");
  const msgEl = document.getElementById("confirmDeleteMessage");
  const closeBtn = document.getElementById("confirmDeleteClose");
  const ok = document.getElementById("confirmDeleteOk");
  if (!wrap || !msgEl || !closeBtn || !ok) return;
  msgEl.textContent = message;
  wrap.hidden = false;
  wrap.classList.add("show");

  function removeEnter() {
    document.removeEventListener("keydown", onEnterKey);
  }

  function hide() {
    removeEnter();
    wrap.classList.remove("show");
    wrap.hidden = true;
  }

  function onEnterKey(e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    hide();
    onConfirm();
  }

  const onDismiss = () => {
    hide();
  };

  const onOk = () => {
    hide();
    onConfirm();
  };

  document.addEventListener("keydown", onEnterKey);
  closeBtn.addEventListener("click", onDismiss, { once: true });
  ok.addEventListener("click", onOk, { once: true });
}

function slugifyAssignmentId(raw) {
  let s = String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  if (!s) return null;
  if (!/^[a-z0-9]/.test(s)) s = `a-${s}`;
  return s.slice(0, 63);
}

/** Strip UTF-8 BOM so CSV header parses. */
function stripLeadingBom(text) {
  if (text.charCodeAt(0) === 0xfeff) return text.slice(1);
  return text;
}

/** Minimal RFC4180-style CSV parse (Canvas quiz exports; quoted fields supported). */
function parseCsvRows(text) {
  const s = stripLeadingBom(text);
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (inQuotes) {
      if (c === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
          continue;
        }
        inQuotes = false;
        continue;
      }
      field += c;
      continue;
    }
    if (c === '"') {
      inQuotes = true;
      continue;
    }
    if (c === ",") {
      row.push(field);
      field = "";
      continue;
    }
    if (c === "\n" || c === "\r") {
      if (c === "\r" && s[i + 1] === "\n") i++;
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
      continue;
    }
    field += c;
  }
  row.push(field);
  if (row.length > 1 || (row.length === 1 && row[0] !== "")) {
    rows.push(row);
  }
  return rows;
}

/** Canvas Quiz Student Analysis Report layout (matches scripts/import_from_csv.py). */
const CANVAS_Q_COL_START = 8;
const CANVAS_TRAILER_COLS = 3;

function cleanCanvasQuestionHeader(raw) {
  if (!raw) return "";
  let t = String(raw).trim();
  t = t.replace(/^\d+:\s*/, "");
  return t.trim();
}

function inferCanvasQuestionPairs(header) {
  const rest = header.length - CANVAS_Q_COL_START - CANVAS_TRAILER_COLS;
  if (rest < 2 || rest % 2 !== 0) {
    throw new Error(
      `Unexpected CSV: ${header.length} columns; expected ${CANVAS_Q_COL_START} + 2×questions + ${CANVAS_TRAILER_COLS} (Canvas quiz report).`,
    );
  }
  return rest / 2;
}

function parseCanvasQuizCsv(text) {
  const rows = parseCsvRows(text);
  if (!rows.length) throw new Error("Empty CSV");
  const header = rows[0];
  const qPairs = inferCanvasQuestionPairs(header);
  const questions = [];
  for (let i = 0; i < qPairs; i++) {
    const qIdx = CANVAS_Q_COL_START + i * 2;
    const rawQ = header[qIdx] ?? "";
    questions.push({
      index: i + 1,
      canvasColumnHeader: String(rawQ).trim(),
      text: cleanCanvasQuestionHeader(rawQ),
    });
  }
  const summaryStart = CANVAS_Q_COL_START + qPairs * 2;
  const students = [];
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    if (row.length < summaryStart + CANVAS_TRAILER_COLS) continue;
    const name = row[0].trim();
    if (!name) continue;
    const sid = row[1].trim();
    const answers = [];
    const scores = [];
    for (let i = 0; i < qPairs; i++) {
      const aIdx = CANVAS_Q_COL_START + i * 2;
      const sIdx = aIdx + 1;
      answers.push(row[aIdx]?.trim() ?? "");
      scores.push(row[sIdx]?.trim() ?? "");
    }
    let submitted = row[6].trim();
    if (submitted && / UTC$/i.test(submitted)) {
      const mUtc = submitted.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) UTC$/);
      if (mUtc) {
        const inst = new Date(`${mUtc[1]}T${mUtc[2]}Z`);
        if (!isNaN(inst.getTime())) submitted = formatInstantAsCentralWallClock(inst);
      }
    }
    students.push({
      id: sid,
      sisId: row[2].trim(),
      name,
      section: row[3].trim(),
      submitted,
      attempt: row[7].trim(),
      answers,
      scores,
      nCorrect: row[summaryStart].trim(),
      nIncorrect: row[summaryStart + 1].trim(),
      totalScore: row[summaryStart + 2].trim(),
    });
  }
  students.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  return { questions, students };
}

async function applyServerAssignmentsList(list) {
  assignmentManifest = Array.isArray(list) ? list.filter((a) => a && a.id && a.dir) : [];
  await enrichManifestSourceFilesFromDisk();
  fillAssignmentDropdown();
}

function syncAssignmentActionButtons() {
  const del = document.getElementById("btnDeleteAssignment");
  const ren = document.getElementById("btnRenameAssignment");
  const empty = assignmentManifest.length === 0;
  if (del) del.disabled = empty;
  if (ren) ren.disabled = empty;
}

function syncAssignmentSelectTooltip() {
  const sel = document.getElementById("assignmentSelect");
  if (!sel) return;
  const a = assignmentManifest.find((x) => x.id === sel.value);
  const fn = a?.sourceFile && String(a.sourceFile).trim();
  sel.title = fn || "";
}

function fillAssignmentDropdown() {
  const sel = document.getElementById("assignmentSelect");
  if (!sel) return;
  const keepPrev = currentAssignmentId;
  sel.innerHTML = "";
  for (const a of assignmentManifest) {
    const opt = document.createElement("option");
    opt.value = a.id;
    opt.textContent = a.title || a.id;
    const fn = a.sourceFile && String(a.sourceFile).trim();
    if (fn) opt.title = fn;
    sel.appendChild(opt);
  }
  const pick = assignmentManifest.some((a) => a.id === keepPrev) ? keepPrev : assignmentManifest[0]?.id;
  if (pick) sel.value = pick;
  syncAssignmentSelectTooltip();
  syncAssignmentActionButtons();
}

function wireAssignmentSelect() {
  const sel = document.getElementById("assignmentSelect");
  if (!sel) return;
  sel.onchange = async () => {
    const next = sel.value;
    if (next === currentAssignmentId) return;
    try {
      await loadAssignmentBundle(next);
    } catch (err) {
      console.error(err);
      toast("Could not load assignment");
    }
  };
}

function closeUploadModal() {
  const m = document.getElementById("uploadModal");
  if (m) {
    m.hidden = true;
    m.setAttribute("aria-hidden", "true");
  }
  const idEl = document.getElementById("uploadId");
  if (idEl) idEl.value = "";
  const csv = document.getElementById("uploadCsvFile");
  if (csv) csv.value = "";
}

function openUploadModal() {
  const m = document.getElementById("uploadModal");
  if (m) {
    m.hidden = false;
    m.setAttribute("aria-hidden", "false");
  }
  document.getElementById("uploadCsvFile")?.focus();
}

async function submitUploadModal() {
  const idInputRaw = document.getElementById("uploadId")?.value?.trim() || "";
  const csvFile = document.getElementById("uploadCsvFile")?.files?.[0];
  if (!csvFile) {
    toast("Choose a CSV file (Canvas quiz student analysis report).");
    return;
  }
  const lower = csvFile.name.toLowerCase();
  if (!lower.endsWith(".csv")) {
    toast("Only .csv files are accepted.");
    return;
  }
  let parsed;
  try {
    parsed = parseCanvasQuizCsv(await csvFile.text());
  } catch (e) {
    toast(e?.message || "Could not parse CSV.");
    return;
  }
  if (!parsed.students.length) {
    toast("No student rows found in CSV.");
    return;
  }
  const students = {
    generatedAt: formatInstantAsCentralWallClock(new Date()),
    sourceFile: csvFile.name,
    questions: parsed.questions,
    students: parsed.students,
  };

  let id;
  let title;
  let dir;
  if (idInputRaw) {
    id = slugifyAssignmentId(idInputRaw);
    if (!id) {
      toast("Assignment ID must be a valid slug (letters, numbers, hyphens). Or leave it blank to use the file name.");
      return;
    }
    title = idInputRaw.trim();
    dir = id;
  } else {
    const base = csvFile.name.replace(/\.csv$/i, "").trim() || "import";
    id = slugifyAssignmentId(base);
    if (!id) id = `a-${Date.now().toString(36)}`;
    title = base;
    dir = id;
  }

  const body = { id, title, dir, students };

  const res = await fetch(`${REVIEW_API_PREFIX}/assignments`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    toast(data.error || `Upload failed (${res.status})`);
    return;
  }
  closeUploadModal();
  await applyServerAssignmentsList(data.assignments);
  try {
    localStorage.setItem(LS_LAST_ASSIGNMENT, id);
  } catch (_) {
    /* ignore */
  }
  const sel = document.getElementById("assignmentSelect");
  if (sel) sel.value = id;
  try {
    await loadAssignmentBundle(id);
  } catch (e) {
    console.error(e);
    toast("Uploaded but could not load — refresh the page.");
    return;
  }
  toast("Assignment uploaded.");
}

function wireUploadModal() {
  document.getElementById("btnUploadAssignment")?.addEventListener("click", () => {
    openUploadModal();
  });
  document.getElementById("uploadModalClose")?.addEventListener("click", closeUploadModal);
  document.getElementById("uploadModalBackdrop")?.addEventListener("click", closeUploadModal);
  document.getElementById("uploadModalSubmit")?.addEventListener("click", () => {
    void submitUploadModal();
  });
  document.getElementById("uploadId")?.addEventListener("keydown", (e) => {
    if (e.key !== "Enter") return;
    e.preventDefault();
    void submitUploadModal();
  });
}

function wireDeleteAssignment() {
  document.getElementById("btnDeleteAssignment")?.addEventListener("click", () => {
    const sel = document.getElementById("assignmentSelect");
    const id = sel?.value;
    if (!id || assignmentManifest.length === 0) return;
    const meta = assignmentManifest.find((a) => a.id === id);
    const label = meta?.title || id;
    showDeleteConfirmDialog(
      `Delete “${label}” and remove its whole assignment folder on the server (including students.json and comments.json)? This cannot be undone.`,
      async () => {
      const res = await fetch(`${REVIEW_API_PREFIX}/assignments/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || `Delete failed (${res.status})`);
        return;
      }
      await applyServerAssignmentsList(data.assignments);
      if (data.assignments.length === 0) {
        abortRecording();
        bundle = { questions: [], students: [], sourceFile: null };
        comments = {};
        currentAssignmentId = null;
        selectedId = null;
        document.getElementById("studentList").innerHTML =
          '<p class="empty-state">No assignments. Use <strong>Upload assignment data</strong> with an assignment report CSV to get started.</p>';
        document.getElementById("commentTitle").textContent = "Comments";
        const tr = getTranscribeBox();
        const pl = getPolishBox();
        if (tr) {
          tr.disabled = true;
          tr.value = "";
        }
        if (pl) {
          pl.disabled = true;
          pl.value = "";
        }
        document.getElementById("metaLine").textContent = "";
        updateAssignmentDueBanner();
        updateCommentTools();
        toast("Assignment deleted.");
        return;
      }
      const nextId = data.assignments[0].id;
      if (sel) sel.value = nextId;
      try {
        localStorage.setItem(LS_LAST_ASSIGNMENT, nextId);
      } catch (_) {
        /* ignore */
      }
      try {
        await loadAssignmentBundle(nextId);
      } catch (e) {
        console.error(e);
        toast("Deleted — reload if the list looks wrong.");
        return;
      }
      toast("Assignment deleted.");
    });
  });
}

function wireRenameAssignment() {
  const modal = document.getElementById("renameAssignmentModal");
  const backdrop = document.getElementById("renameAssignmentModalBackdrop");
  const inp = document.getElementById("renameAssignmentInput");
  const closeBtn = document.getElementById("renameAssignmentModalClose");
  const saveBtn = document.getElementById("renameAssignmentSave");
  const openBtn = document.getElementById("btnRenameAssignment");

  function openRenameModal() {
    if (!currentAssignmentId || assignmentManifest.length === 0) return;
    const ent = getCurrentAssignmentEntry();
    if (!ent || !inp) return;
    inp.value = ent.title || ent.id;
    if (modal) {
      modal.hidden = false;
      modal.setAttribute("aria-hidden", "false");
    }
    inp.focus();
    inp.select();
  }

  function closeRenameModal() {
    if (modal) {
      modal.hidden = true;
      modal.setAttribute("aria-hidden", "true");
    }
  }

  async function saveRename() {
    if (!currentAssignmentId || !inp) return;
    const title = inp.value?.trim() || "";
    if (!title) {
      toast("Enter a display name.");
      return;
    }
    const res = await fetch(`${REVIEW_API_PREFIX}/rename-assignment`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assignmentId: currentAssignmentId, title }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      toast(data.error || `Rename failed (${res.status})`);
      return;
    }
    await applyServerAssignmentsList(data.assignments);
    const ix = assignmentManifest.findIndex((a) => a.id === currentAssignmentId);
    if (ix >= 0 && bundle?.sourceFile) {
      const sf = String(bundle.sourceFile).trim();
      if (sf && !assignmentManifest[ix].sourceFile) {
        assignmentManifest[ix] = { ...assignmentManifest[ix], sourceFile: sf };
        fillAssignmentDropdown();
      }
    }
    const sel = document.getElementById("assignmentSelect");
    if (sel) sel.value = currentAssignmentId;
    const meta = document.getElementById("metaLine");
    if (meta) meta.textContent = formatMetaLine();
    closeRenameModal();
    toast("Assignment renamed.");
  }

  openBtn?.addEventListener("click", openRenameModal);
  backdrop?.addEventListener("click", closeRenameModal);
  closeBtn?.addEventListener("click", closeRenameModal);
  saveBtn?.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    void saveRename();
  });
  inp?.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void saveRename();
    }
  });
}

function wireReviewHomeLogout() {
  const home = document.getElementById("reviewHomeLink");
  if (!home) return;
  home.addEventListener("click", async (e) => {
    e.preventDefault();
    try {
      await fetch("/api/magic-page/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (_) {
      /* ignore */
    }
    window.location.href = "/";
  });
}

/** Persist comments to server files under data/instructor-review/assignments/.../comments.json. */
function schedulePersistCommentsToFile() {
  const assignmentId = currentAssignmentId;
  const commentsSnapshot = normalizeCommentsObject(comments);
  persistQueue = persistQueue
    .then(() => pushCommentsToServer(assignmentId, commentsSnapshot))
    .catch(() => false);
}

async function pushCommentsToServer(assignmentId = currentAssignmentId, commentsPayload = comments) {
  if (!assignmentId) return false;
  try {
    const res = await fetch(`${REVIEW_API_PREFIX}/save-comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        assignmentId,
        comments: normalizeCommentsObject(commentsPayload),
      }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Last-chance sync when the page is going away (tab close, refresh, background on some browsers). */
function beaconSaveCommentsToServer() {
  if (!currentAssignmentId) return;
  try {
    const body = JSON.stringify({
      assignmentId: currentAssignmentId,
      comments: normalizeCommentsObject(comments),
    });
    const blob = new Blob([body], { type: "application/json" });
    if (navigator.sendBeacon?.(`${REVIEW_API_PREFIX}/save-comments`, blob)) return;
    void fetch(`${REVIEW_API_PREFIX}/save-comments`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true,
    });
  } catch {
    /* ignore */
  }
}

function flushPersistenceOnPageExit() {
  flushCommentToMap();
  beaconSaveCommentsToServer();
}

function mergeCommentsFromFile(fromFile) {
  const c = fromFile?.comments;
  if (c && typeof c === "object") {
    comments = { ...comments, ...normalizeCommentsObject(c) };
  }
}

function flushCommentToMap() {
  persistCommentsFromDom();
}

function resetDictateButtonUI() {
  const btn = document.getElementById("btnDictate");
  if (btn) {
    btn.classList.remove("listening");
    dictateButtonIdle();
  }
  instructionBubblesResetVisuals();
}

function abortRecording() {
  activeRecordId++;
  const mr = mediaRecorder;
  mediaRecorder = null;
  recordChunks = [];
  isRecording = false;
  if (mr && mr.state !== "inactive") {
    try {
      mr.onstop = () => {
        cleanupMicStream();
        resetDictateButtonUI();
        updateCommentTools();
      };
      mr.stop();
    } catch (_) {
      cleanupMicStream();
      resetDictateButtonUI();
      updateCommentTools();
    }
  } else {
    cleanupMicStream();
    resetDictateButtonUI();
    updateCommentTools();
  }
}

/** Append dictated text to the end of the transcription (student-facing). */
function appendToTranscribe(ta, chunk) {
  const t = (chunk || "").trim();
  if (!t) return;
  let v = ta.value;
  if (v.length > 0 && !/\s$/.test(v) && !/^[.,;:!?]/.test(t)) v += " ";
  ta.value = v + t;
  ta.selectionStart = ta.selectionEnd = ta.value.length;
  ta.focus();
  ta.dispatchEvent(new Event("input", { bubbles: true }));
  persistCommentsFromDom();
  updateCommentTools();
}

function polishPostUrl() {
  const saved = (localStorage.getItem(LS_POLISH_URL) || "").trim();
  if (saved) return `${saved.replace(/\/$/, "")}/polish`;
  return `${REVIEW_API_PREFIX}/polish`;
}

function transcribePostUrl() {
  const saved = (localStorage.getItem(LS_POLISH_URL) || "").trim();
  if (saved) return `${saved.replace(/\/$/, "")}/transcribe`;
  return `${REVIEW_API_PREFIX}/transcribe`;
}

function refinePostUrl() {
  const saved = (localStorage.getItem(LS_POLISH_URL) || "").trim();
  if (saved) return `${saved.replace(/\/$/, "")}/refine`;
  return `${REVIEW_API_PREFIX}/refine`;
}

async function runRawAssistFromInstruction(instruction) {
  const tr = getTranscribeBox();
  if (!tr || !selectedId) return;
  const raw = tr.value;
  try {
    const res = await fetch(refinePostUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: "transcribe",
        transcribe: raw,
        instruction,
      }),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Bad response from assistant");
    }
    if (!res.ok) {
      throw new Error(data.error || res.statusText || "Assistant request failed");
    }
    if (typeof data.transcribe !== "string") {
      throw new Error("Invalid response");
    }
    tr.value = data.transcribe;
    tr.dispatchEvent(new Event("input", { bubbles: true }));
    persistCommentsFromDom();
    toast("Rough transcript updated");
  } catch (e) {
    console.error(e);
    toast(String(e.message || e));
  }
}

async function runPolishAssistFromInstruction(instruction) {
  const pl = getPolishBox();
  if (!pl || !selectedId) return;
  const polished = pl.value.trim();
  try {
    const res = await fetch(refinePostUrl(), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        target: "polish",
        polish: polished,
        instruction,
      }),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Bad response from assistant");
    }
    if (!res.ok) {
      throw new Error(data.error || res.statusText || "Assistant request failed");
    }
    if (typeof data.polished !== "string") {
      throw new Error("Invalid response");
    }
    pl.value = data.polished;
    pl.dispatchEvent(new Event("input", { bubbles: true }));
    persistCommentsFromDom();
    toast("Polished note updated");
  } catch (e) {
    console.error(e);
    toast(String(e.message || e));
  }
}

async function startVoiceRecording(kind) {
  const ta = getTranscribeBox();
  if (!ta || ta.disabled || !selectedId) {
    toast("Select a student first");
    return;
  }

  if (!window.isSecureContext) {
    toast("Use http://127.0.0.1:PORT or http://localhost:PORT.");
    return;
  }

  if (!navigator.mediaDevices?.getUserMedia) {
    toast("Microphone access is not available in this browser.");
    return;
  }
  if (!window.MediaRecorder) {
    toast("Recording not supported — try Chrome or Edge.");
    return;
  }

  if (isRecording && mediaRecorder) {
    stopDictateRecording();
    return;
  }

  let stream;
  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  } catch (e) {
    console.warn("getUserMedia:", e);
    toast("Allow microphone access, then try again.");
    return;
  }

  recordStream = stream;
  recordChunks = [];
  const mime = pickAudioMime();
  try {
    mediaRecorder = mime ? new MediaRecorder(stream, { mimeType: mime }) : new MediaRecorder(stream);
  } catch (e) {
    console.error(e);
    cleanupMicStream();
    toast("Could not start recorder.");
    return;
  }

  activeRecordingKind = kind;
  const captureId = activeRecordId;
  const micBtn = document.getElementById("btnDictate");

  mediaRecorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) recordChunks.push(ev.data);
  };

  mediaRecorder.onstop = async () => {
    const usedMime = mediaRecorder?.mimeType || mime || "audio/webm";
    cleanupMicStream();
    mediaRecorder = null;
    isRecording = false;

    if (micBtn) {
      micBtn.classList.remove("listening");
      dictateButtonIdle();
    }
    instructionBubblesResetVisuals();

    const doneKind = activeRecordingKind;
    activeRecordingKind = null;

    if (captureId !== activeRecordId) {
      recordChunks = [];
      updateCommentTools();
      return;
    }

    const blob = new Blob(recordChunks, { type: usedMime });
    recordChunks = [];

    if (blob.size < 120) {
      toast("Recording too short — try again.");
      updateCommentTools();
      return;
    }

    if (micBtn) {
      micBtn.disabled = true;
      dictateButtonTranscribing();
    }
    mainTranscribeInFlight = true;
    /* One button only: mic for plain dictation; the assist bubble you used for instruction mode. */
    if (doneKind === "raw") {
      setKittScan("btnAssist");
    } else if (doneKind === "polish") {
      setKittScan("btnAssistPolish");
    } else {
      setKittScan("btnDictate");
    }
    updateCommentTools();

    try {
      const res = await fetch(transcribePostUrl(), {
        method: "POST",
        headers: { "Content-Type": usedMime },
        body: blob,
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error("Bad response from server");
      }
      if (!res.ok) {
        throw new Error(data.error || res.statusText || "Transcribe failed");
      }
      const text = (data.text || "").trim();
      if (!text) {
        toast("No speech detected in recording.");
        return;
      }

      if (doneKind === "raw") {
        await runRawAssistFromInstruction(text);
      } else if (doneKind === "polish") {
        await runPolishAssistFromInstruction(text);
      } else {
        appendToTranscribe(ta, text);
      }
    } catch (e) {
      console.error(e);
      toast(String(e.message || e));
    } finally {
      mainTranscribeInFlight = false;
      clearKittScan();
      if (micBtn) {
        micBtn.disabled = false;
        dictateButtonIdle();
      }
      updateCommentTools();
    }
  };

  try {
    mediaRecorder.start();
    isRecording = true;
    if (kind === "plain") {
      if (micBtn) {
        micBtn.classList.add("listening");
        dictateButtonRecording();
      }
    } else {
      instructionBubbleShowStopFor(kind);
    }
    updateCommentTools();
  } catch (e) {
    console.error(e);
    cleanupMicStream();
    mediaRecorder = null;
    activeRecordingKind = null;
    instructionBubblesResetVisuals();
    if (micBtn) dictateButtonIdle();
    toast("Could not start recording.");
    updateCommentTools();
  }
}

async function toggleDictate() {
  await startVoiceRecording("plain");
}

async function polishComment() {
  const tr = getTranscribeBox();
  const pl = getPolishBox();
  if (!tr || !pl || tr.disabled || !selectedId) {
    toast("Select a student first");
    return;
  }
  ensureCommentEntry(selectedId);
  const full = tr.value;
  const trimmedFull = full.trim();
  const existing = pl.value.trim();

  if (!trimmedFull) {
    toast("Add text in the rough transcript first.");
    return;
  }

  const url = polishPostUrl();
  const btn = document.getElementById("btnPolish");
  if (btn) {
    btn.disabled = true;
    polishButtonBusy();
  }
  _polishBusy = true;
  setKittScan("btnPolish");
  updateCommentTools();
  try {
    const body = existing
      ? { text: trimmedFull, existingPolish: existing, integrateFullRaw: true }
      : { text: trimmedFull };
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    let data;
    try {
      data = await res.json();
    } catch {
      throw new Error("Bad response from polish server");
    }
    if (!res.ok) {
      throw new Error(data.error || res.statusText || "Polish failed");
    }
    if (typeof data.polished !== "string") {
      throw new Error("Invalid polish response");
    }
    pl.value = data.polished;
    comments[selectedId].polishTranscribeEnd = full.length;
    pl.dispatchEvent(new Event("input", { bubbles: true }));
    persistCommentsFromDom();
    toast(existing ? "Polish extended" : "Polished");
  } catch (e) {
    console.error(e);
    toast("Polish failed — is review-server running?");
  } finally {
    _polishBusy = false;
    clearKittScan();
    if (btn) {
      btn.disabled = false;
      polishButtonIdle();
    }
    updateCommentTools();
  }
}

function polishCommentBusy() {
  return _polishBusy;
}

function commentPipelineBusy() {
  return mainTranscribeInFlight || polishCommentBusy();
}

function syncCommentFieldsProcessingChrome() {
  const busy = commentPipelineBusy();
  document.querySelector(".comment-fields")?.classList.toggle("comment-fields--processing", busy);
}

function updateCommentTools() {
  const tr = getTranscribeBox();
  const pl = getPolishBox();
  const dictate = document.getElementById("btnDictate");
  const polish = document.getElementById("btnPolish");
  const assist = document.getElementById("btnAssist");
  const assistPolish = document.getElementById("btnAssistPolish");
  if (!dictate || !tr) return;
  const pipelineBusy = commentPipelineBusy();
  if (tr) tr.disabled = !selectedId;
  if (pl) pl.disabled = !selectedId;
  const can = !!selectedId && !tr.disabled;
  dictate.disabled = !can || pipelineBusy;
  if (polish) {
    polish.disabled = !can || !tr.value.trim() || isRecording || pipelineBusy;
  }
  const assistDisabled = !can || pipelineBusy;
  if (assist) assist.disabled = assistDisabled;
  if (assistPolish) {
    const hasPolishedText = !!(pl && pl.value.trim());
    const canStopPolishInstruction = isRecording && activeRecordingKind === "polish";
    assistPolish.disabled = assistDisabled || (!hasPolishedText && !canStopPolishInstruction);
  }
  syncInstructionButtons();
  syncExportLikeButtons();
  syncCommentFieldsProcessingChrome();
}

function syncExportPrefFieldClass(pref) {
  const root = document.querySelector(".comment-fields");
  if (!root) return;
  root.classList.remove("export-pref--none", "export-pref--transcribe", "export-pref--polish");
  if (pref === "transcribe") root.classList.add("export-pref--transcribe");
  else if (pref === "polish") root.classList.add("export-pref--polish");
  else root.classList.add("export-pref--none");
}

function syncExportLikeButtons() {
  const trBtn = document.getElementById("btnExportLikeTranscribe");
  const plBtn = document.getElementById("btnExportLikePolish");
  const tr = getTranscribeBox();
  const pl = getPolishBox();
  if (!trBtn || !plBtn) return;
  const pipelineBusy = commentPipelineBusy();
  const can = !!selectedId && tr && !tr.disabled;
  const hasTr = !!(tr && String(tr.value || "").trim());
  const hasPl = !!(pl && String(pl.value || "").trim());

  let prefDirty = false;
  if (selectedId && comments[selectedId]) {
    const p = comments[selectedId].exportPreferred;
    if (p === "transcribe" && !hasTr) {
      comments[selectedId].exportPreferred = null;
      prefDirty = true;
    }
    if (p === "polish" && !hasPl) {
      comments[selectedId].exportPreferred = null;
      prefDirty = true;
    }
  }
  if (prefDirty) schedulePersistCommentsToFile();

  /* Rough export thumb: enable as soon as the top box has text (export can be rough-only; no need to wait for polish or pipeline). */
  trBtn.disabled = !can || !hasTr;
  plBtn.disabled = !can || pipelineBusy || !hasPl;
  trBtn.title = !hasTr
    ? "Add text to the rough transcript above to choose this for export."
    : "Use rough transcript for export (JSON/Excel use this when selected)";
  plBtn.title =
    can && !pipelineBusy && !hasPl
      ? "Add text to the polished note above to choose this for export."
      : "Use polished note for export (JSON/Excel use this when selected)";
  if (!can || !selectedId) {
    trBtn.setAttribute("aria-pressed", "false");
    plBtn.setAttribute("aria-pressed", "false");
    syncExportPrefFieldClass(null);
    return;
  }
  let pref = comments[selectedId]?.exportPreferred;
  if (pref !== "transcribe" && pref !== "polish") {
    pref = null;
  }
  trBtn.setAttribute("aria-pressed", pref === "transcribe" ? "true" : "false");
  plBtn.setAttribute("aria-pressed", pref === "polish" ? "true" : "false");
  syncExportPrefFieldClass(pref);
}

function setExportPreferred(which) {
  if (!selectedId || (which !== "transcribe" && which !== "polish")) return;
  ensureCommentEntry(selectedId);
  const cur = comments[selectedId].exportPreferred;
  comments[selectedId].exportPreferred = cur === which ? null : which;
  syncExportLikeButtons();
  schedulePersistCommentsToFile();
}

function selectStudent(id) {
  abortRecording();
  syncInstructionButtons();
  flushCommentToMap();
  suppressCommentPersist = true;
  try {
    const sid = id == null || id === "" ? null : String(id);
    selectedId = sid;
    document.querySelectorAll(".student-block").forEach((el) => {
      el.classList.toggle("selected", el.dataset.id === sid);
    });
    const tr = getTranscribeBox();
    const pl = getPolishBox();
    const s = bundle?.students?.find((x) => String(x.id) === sid);
    document.getElementById("commentTitle").textContent = s
      ? `Comments — ${s.name}`
      : "Comments";
    const entry = sid ? normalizeCommentEntry(comments[sid]) : normalizeCommentEntry(null);
    /* Do not assign comments[sid] = empty when comments[sid] was undefined.
     normalizeCommentEntry(undefined) is empty; writing that made autosave persist "" and wipe the file. */
    if (sid && comments[sid] !== undefined) {
      comments[sid] = entry;
    }
    if (tr) {
      tr.disabled = !sid;
      tr.value = sid ? entry.transcribe : "";
    }
    if (pl) {
      pl.disabled = !sid;
      pl.value = sid ? entry.polish : "";
    }
    updateStudentSubmissionMeta(sid && s ? s : null);
    updateCommentTools();
  } finally {
    suppressCommentPersist = false;
  }
}

function toggleExpand(block, studentId) {
  const wasOpen = block.classList.contains("expanded");
  document.querySelectorAll(".student-block.expanded").forEach((el) => {
    el.classList.remove("expanded");
    const btn = el.querySelector(".student-header");
    if (btn) btn.setAttribute("aria-expanded", "false");
  });
  if (!wasOpen) {
    block.classList.add("expanded");
    block.querySelector(".student-header")?.setAttribute("aria-expanded", "true");
  }
  selectStudent(studentId);
}

function renderStudents() {
  const root = document.getElementById("studentList");
  root.innerHTML = "";

  if (!bundle?.students?.length) {
    root.innerHTML =
      '<p class="empty-state">No students for this assignment. Re-upload an <strong>assignment report CSV</strong> via <strong>Upload assignment data</strong>.</p>';
    document.getElementById("metaLine").textContent = formatMetaLine();
    updateAssignmentDueBanner();
    return;
  }

  for (const s of bundle.students) {
    const block = document.createElement("div");
    block.className = "student-block";
    block.dataset.id = s.id;

    const header = document.createElement("button");
    header.type = "button";
    header.className = "student-header";
    header.setAttribute("aria-expanded", "false");
    header.innerHTML =
      '<span class="chevron" aria-hidden="true"></span>' +
      `<span class="student-name"></span>` +
      `<span class="student-meta"></span>`;
    header.querySelector(".student-name").textContent = s.name;
    const sec = s.section.includes("396") ? "396" : s.section.includes("496") ? "496" : "";
    header.querySelector(".student-meta").textContent = [sec, s.sisId].filter(Boolean).join(" · ");

    header.addEventListener("click", () => toggleExpand(block, s.id));

    const body = document.createElement("div");
    body.className = "student-body";

    bundle.questions.forEach((q, i) => {
      const qa = document.createElement("div");
      qa.className = "qa-block";
      const ans = s.answers[i] ?? "";
      qa.innerHTML =
        `<div class="q-line">` +
        `<span class="q-num">Question ${q.index}</span>` +
        `<span class="q-text"></span>` +
        `</div>` +
        `<div class="a-text"></div>`;
      qa.querySelector(".q-text").textContent = questionOneLine(q.text);
      const answerEl = qa.querySelector(".a-text");
      const trimmed = (ans || "").trim();
      answerEl.textContent = trimmed || "(no response)";
      answerEl.classList.toggle("a-text--empty", !trimmed);
      body.appendChild(qa);
    });

    block.appendChild(header);
    block.appendChild(body);
    root.appendChild(block);
  }

  document.getElementById("metaLine").textContent = formatMetaLine();
  updateAssignmentDueBanner();
}

function buildExportPayload() {
  flushCommentToMap();
  const asg = getCurrentAssignmentEntry();
  const norm = normalizeCommentsObject(comments);
  const exportByStudentId = {};
  const pickFromEntry = (e) => {
    if (e.exportPreferred === "transcribe") return "transcribe";
    if (e.exportPreferred === "polish") return "polish";
    return String(e.transcribe || "").trim()
      ? "transcribe"
      : String(e.polish || "").trim()
        ? "polish"
        : "transcribe";
  };
  for (const [id, e] of Object.entries(norm)) {
    const from = pickFromEntry(e);
    exportByStudentId[id] = {
      from,
      text: from === "transcribe" ? e.transcribe : e.polish,
    };
  }
  return {
    exportVersion: 6,
    exportedAt: formatInstantAsCentralWallClock(new Date()),
    assignmentId: currentAssignmentId,
    assignmentTitle: asg?.title ?? null,
    dueDate: getDueDateYmdFromBundle(bundle),
    questions: bundle.questions,
    students: bundle.students,
    comments: norm,
    exportByStudentId,
  };
}

function closeExportMenu() {
  document.getElementById("exportMenuDetails")?.removeAttribute("open");
}

/** `<details>` does not close on outside click or Escape; wire that so the menu is dismissible. */
function wireExportMenuDismiss() {
  const details = document.getElementById("exportMenuDetails");
  const summary = details?.querySelector("summary");
  if (!details || !summary) return;

  const syncAria = () => {
    summary.setAttribute("aria-expanded", details.open ? "true" : "false");
  };
  details.addEventListener("toggle", syncAria);
  syncAria();

  document.addEventListener("pointerdown", (e) => {
    if (!details.open) return;
    if (details.contains(e.target)) return;
    closeExportMenu();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    if (!details.open) return;
    closeExportMenu();
    e.preventDefault();
  });
}

function downloadExportJson() {
  closeExportMenu();
  if (!bundle) return;
  const data = buildExportPayload();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const slug = (currentAssignmentId || "export").replace(/[^a-z0-9-_]+/gi, "-");
  a.download = `ai-perspectives-review-${slug}-${getCentralTimeYmdFromInstant(new Date()) || "export"}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Downloaded merged JSON");
}

function escapeXmlCell(v) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function downloadExportExcel() {
  closeExportMenu();
  if (!bundle) return;
  flushCommentToMap();
  const norm = normalizeCommentsObject(comments);
  const pickFromEntry = (e) => {
    if (e.exportPreferred === "transcribe") return "transcribe";
    if (e.exportPreferred === "polish") return "polish";
    return String(e.transcribe || "").trim()
      ? "transcribe"
      : String(e.polish || "").trim()
        ? "polish"
        : "transcribe";
  };
  const headers = [
    "Student ID",
    "SIS ID",
    "Name",
    "Section",
    "Submitted",
    "Q1",
    "Q2",
    "Q3",
    "Q4",
    "Q5",
    "Instructor Comment (Selected)",
    "Comment Source",
  ];
  const rows = [];
  rows.push(headers);
  for (const s of bundle.students || []) {
    const e = norm[String(s.id)] || normalizeCommentEntry(null);
    const from = pickFromEntry(e);
    const selectedComment = from === "transcribe" ? e.transcribe : e.polish;
    rows.push([
      s.id || "",
      s.sisId || "",
      s.name || "",
      s.section || "",
      s.submitted || "",
      s.answers?.[0] || "",
      s.answers?.[1] || "",
      s.answers?.[2] || "",
      s.answers?.[3] || "",
      s.answers?.[4] || "",
      selectedComment || "",
      from,
    ]);
  }

  const xmlRows = rows
    .map(
      (r) =>
        `<Row>${r
          .map((cell) => `<Cell><Data ss:Type="String">${escapeXmlCell(cell)}</Data></Cell>`)
          .join("")}</Row>`,
    )
    .join("");
  const sheetName = (getCurrentAssignmentEntry()?.title || "Export").slice(0, 31);
  const xml =
    `<?xml version="1.0"?>` +
    `<?mso-application progid="Excel.Sheet"?>` +
    `<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ` +
    `xmlns:o="urn:schemas-microsoft-com:office:office" ` +
    `xmlns:x="urn:schemas-microsoft-com:office:excel" ` +
    `xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">` +
    `<Worksheet ss:Name="${escapeXmlCell(sheetName || "Export")}"><Table>${xmlRows}</Table></Worksheet>` +
    `</Workbook>`;

  const blob = new Blob([xml], { type: "application/vnd.ms-excel;charset=utf-8;" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const slug = (currentAssignmentId || "export").replace(/[^a-z0-9-_]+/gi, "-");
  a.download = `ai-perspectives-review-${slug}-${getCentralTimeYmdFromInstant(new Date()) || "export"}.xls`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Downloaded Excel export");
}

function wireVoiceAndPolish() {
  document.getElementById("btnDictate").addEventListener("click", () => {
    void toggleDictate();
  });
  document.getElementById("btnPolish").addEventListener("click", polishComment);

  document.getElementById("btnAssist").addEventListener("click", () => {
    if (isRecording && mediaRecorder) {
      if (activeRecordingKind === "raw") {
        stopDictateRecording();
      }
      return;
    }
    void startVoiceRecording("raw");
  });

  document.getElementById("btnAssistPolish").addEventListener("click", () => {
    if (isRecording && mediaRecorder) {
      if (activeRecordingKind === "polish") {
        stopDictateRecording();
      }
      return;
    }
    void startVoiceRecording("polish");
  });
}

function wireExportLikeButtons() {
  document.getElementById("btnExportLikeTranscribe")?.addEventListener("click", () => {
    if (selectedId) setExportPreferred("transcribe");
  });
  document.getElementById("btnExportLikePolish")?.addEventListener("click", () => {
    if (selectedId) setExportPreferred("polish");
  });
}

function wireCommentBox() {
  const onTranscribeInput = () => {
    if (!selectedId) return;
    ensureCommentEntry(selectedId);
    const tr = getTranscribeBox();
    const pl = getPolishBox();
    const c = comments[selectedId];
    if (tr && !String(tr.value || "").trim() && pl) {
      pl.value = "";
      if (c) {
        c.polishTranscribeEnd = 0;
        c.exportPreferred = null;
      }
    }
    if (tr && c && c.polishTranscribeEnd > tr.value.length) {
      c.polishTranscribeEnd = tr.value.length;
    }
    persistCommentsFromDom();
    updateCommentTools();
  };
  const onPolishInput = () => {
    if (!selectedId) return;
    ensureCommentEntry(selectedId);
    const pl = getPolishBox();
    if (pl && !pl.value.trim()) {
      comments[selectedId].polishTranscribeEnd = 0;
    }
    persistCommentsFromDom();
    updateCommentTools();
  };
  const tr = getTranscribeBox();
  const pl = getPolishBox();
  if (tr) {
    tr.addEventListener("input", onTranscribeInput);
    tr.addEventListener("blur", flushCommentToMap);
  }
  if (pl) {
    pl.addEventListener("input", onPolishInput);
    pl.addEventListener("blur", flushCommentToMap);
  }
}

async function init() {
  wireCommentBox();
  wireExportMenuDismiss();
  wireExportLikeButtons();
  wireVoiceAndPolish();
  syncInstructionButtons();
  window.addEventListener("pagehide", flushPersistenceOnPageExit);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPersistenceOnPageExit();
  });
  document.getElementById("btnExportJson").addEventListener("click", downloadExportJson);
  document.getElementById("btnExportExcel").addEventListener("click", downloadExportExcel);
  wireAssignmentSelect();
  wireUploadModal();
  wireDeleteAssignment();
  wireRenameAssignment();
  wireDueDateEditor();
  wireReviewHomeLogout();

  try {
    const manRes = await fetch(`${REVIEW_DATA_BASE}assignments/manifest.json`, REVIEW_STATIC_FETCH);
    if (!manRes.ok) throw new Error("assignments manifest missing");
    const man = await manRes.json();
    assignmentManifest = Array.isArray(man.assignments)
      ? man.assignments.filter((a) => a && a.id && a.dir)
      : [];
    await enrichManifestSourceFilesFromDisk();
    fillAssignmentDropdown();
    await migrateLegacyLocalCommentsToServerOnce();

    if (!assignmentManifest.length) {
      document.getElementById("studentList").innerHTML =
        '<p class="empty-state">No assignments yet. Use <strong>Upload assignment data</strong> with an <strong>assignment report CSV</strong>.</p>';
      document.getElementById("metaLine").textContent = "0 assignments";
      updateAssignmentDueBanner();
      syncAssignmentActionButtons();
      return;
    }

    const last = (localStorage.getItem(LS_LAST_ASSIGNMENT) || "").trim();
    const pickId = assignmentManifest.some((a) => a.id === last) ? last : assignmentManifest[0].id;
    const sel = document.getElementById("assignmentSelect");
    if (sel) sel.value = pickId;

    await loadAssignmentBundle(pickId);
  } catch (e) {
    console.error(e);
    const sel = document.getElementById("assignmentSelect");
    if (sel) sel.innerHTML = "";
    document.getElementById("studentList").innerHTML =
      '<p class="empty-state">Could not load assignment data. Unlock the <a href="/magic-word.html">magic word</a> page first (same browser), then open Quiz review from there.</p>';
    const tr = getTranscribeBox();
    const pl = getPolishBox();
    const as = document.getElementById("btnAssist");
    const asp = document.getElementById("btnAssistPolish");
    if (tr) tr.disabled = true;
    if (pl) pl.disabled = true;
    if (as) as.disabled = true;
    if (asp) asp.disabled = true;
    updateAssignmentDueBanner();
    updateStudentSubmissionMeta(null);
    updateCommentTools();
    toast("Load error — check assignments manifest");
  return;
  }
}

init();
