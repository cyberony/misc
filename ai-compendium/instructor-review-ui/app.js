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
  btn.classList.add("icon-tool-busy");
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
  btn.innerHTML = ICON_SPINNER;
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
/** Serialize server writes so each text change persists in order. */
let persistQueue = Promise.resolve();
let _polishBusy = false;
/** While MediaRecorder runs: how this capture will be used after transcribe. */
let activeRecordingKind = null; // null | "plain" | "raw" | "polish"

function normalizeCommentEntry(val) {
  const base = { transcribe: "", polish: "", polishTranscribeEnd: 0 };
  if (val == null) return base;
  if (typeof val === "string") return { ...base, transcribe: val };
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
    return { transcribe, polish, polishTranscribeEnd };
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
  const entry = getCurrentAssignmentEntry();
  const title = entry?.title || currentAssignmentId || "";
  const n = bundle?.students?.length ?? 0;
  const src = bundle?.sourceFile ?? "students.json";
  return `${title} · ${n} students · ${src}`;
}

/**
 * One-time: old builds cached comments in localStorage. Push any non-empty data to server files, then drop the cache.
 * Source of truth after this is `data/.../comments.json` only.
 */
/** Avoid stale HTTP cache of JSON (comments.json looked empty in the UI after disk was fixed). */
const REVIEW_STATIC_FETCH = { cache: "no-store", credentials: "include" };

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

  const stuUrl = assignmentFileUrl(entry.dir, "students.json");
  const comUrl = assignmentFileUrl(entry.dir, "comments.json");
  const stuRes = await fetch(stuUrl, REVIEW_STATIC_FETCH);
  if (!stuRes.ok) throw new Error(`students.json missing for assignment: ${id}`);
  bundle = await stuRes.json();
  comments = {};
  const comRes = await fetch(comUrl, REVIEW_STATIC_FETCH);
  if (comRes.ok) {
    const comFile = await comRes.json();
    mergeCommentsFromFile(comFile);
  }
  currentAssignmentId = id;
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

function showDeleteConfirmDialog(message, onConfirm) {
  const wrap = document.getElementById("confirmDeleteDialog");
  const msgEl = document.getElementById("confirmDeleteMessage");
  const cancel = document.getElementById("confirmDeleteCancel");
  const ok = document.getElementById("confirmDeleteOk");
  if (!wrap || !msgEl || !cancel || !ok) return;
  msgEl.textContent = message;
  wrap.hidden = false;
  wrap.classList.add("show");
  const hide = () => {
    wrap.classList.remove("show");
    wrap.hidden = true;
  };
  const onCancel = () => {
    hide();
  };
  const onOk = () => {
    hide();
    onConfirm();
  };
  cancel.addEventListener("click", onCancel, { once: true });
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

function applyServerAssignmentsList(list) {
  assignmentManifest = Array.isArray(list) ? list.filter((a) => a && a.id && a.dir) : [];
  fillAssignmentDropdown();
}

function syncDeleteButtonState() {
  const btn = document.getElementById("btnDeleteAssignment");
  if (btn) btn.disabled = assignmentManifest.length === 0;
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
    sel.appendChild(opt);
  }
  const pick = assignmentManifest.some((a) => a.id === keepPrev) ? keepPrev : assignmentManifest[0]?.id;
  if (pick) sel.value = pick;
  syncDeleteButtonState();
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
  document.getElementById("uploadId") && (document.getElementById("uploadId").value = "");
  document.getElementById("uploadTitle") && (document.getElementById("uploadTitle").value = "");
  document.getElementById("uploadDir") && (document.getElementById("uploadDir").value = "");
  const sf = document.getElementById("uploadStudentsFile");
  const cf = document.getElementById("uploadCommentsFile");
  if (sf) sf.value = "";
  if (cf) cf.value = "";
}

function openUploadModal() {
  const m = document.getElementById("uploadModal");
  if (m) {
    m.hidden = false;
    m.setAttribute("aria-hidden", "false");
  }
  document.getElementById("uploadId")?.focus();
}

async function submitUploadModal() {
  const idInput = document.getElementById("uploadId")?.value?.trim() || "";
  const title = document.getElementById("uploadTitle")?.value?.trim() || "";
  let dir = document.getElementById("uploadDir")?.value?.trim() || "";
  const studentsFile = document.getElementById("uploadStudentsFile")?.files?.[0];
  if (!studentsFile) {
    toast("Choose a students.json file.");
    return;
  }
  let students;
  try {
    students = JSON.parse(await studentsFile.text());
  } catch {
    toast("Could not parse students.json.");
    return;
  }
  if (!Array.isArray(students.questions) || !Array.isArray(students.students)) {
    toast("students.json must include questions and students arrays.");
    return;
  }
  const id = slugifyAssignmentId(idInput) || slugifyAssignmentId(title);
  if (!id) {
    toast("Enter a title or assignment ID.");
    return;
  }
  if (!title) {
    toast("Enter a display title.");
    return;
  }
  if (!dir) dir = title;

  let commentsPayload = undefined;
  const commentsFile = document.getElementById("uploadCommentsFile")?.files?.[0];
  if (commentsFile) {
    try {
      commentsPayload = JSON.parse(await commentsFile.text());
    } catch {
      toast("Could not parse comments.json.");
      return;
    }
  }

  const body = { id, title, dir, students };
  if (commentsPayload && typeof commentsPayload === "object") {
    body.comments = commentsPayload;
  }

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
  applyServerAssignmentsList(data.assignments);
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
  document.getElementById("uploadModalCancel")?.addEventListener("click", closeUploadModal);
  document.getElementById("uploadModalBackdrop")?.addEventListener("click", closeUploadModal);
  document.getElementById("uploadModalSubmit")?.addEventListener("click", () => {
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
    showDeleteConfirmDialog(`Delete “${label}” and remove its folder on the server? This cannot be undone.`, async () => {
      const res = await fetch(`${REVIEW_API_PREFIX}/assignments/${encodeURIComponent(id)}`, {
        method: "DELETE",
        credentials: "include",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast(data.error || `Delete failed (${res.status})`);
        return;
      }
      applyServerAssignmentsList(data.assignments);
      if (data.assignments.length === 0) {
        abortRecording();
        bundle = { questions: [], students: [], sourceFile: null };
        comments = {};
        currentAssignmentId = null;
        selectedId = null;
        document.getElementById("studentList").innerHTML =
          '<p class="empty-state">No assignments. Upload assignment data to get started.</p>';
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

function updateCommentTools() {
  const tr = getTranscribeBox();
  const pl = getPolishBox();
  const dictate = document.getElementById("btnDictate");
  const polish = document.getElementById("btnPolish");
  const assist = document.getElementById("btnAssist");
  const assistPolish = document.getElementById("btnAssistPolish");
  if (!dictate || !tr) return;
  const can = !!selectedId && !tr.disabled;
  const pipelineBusy = polishCommentBusy();
  dictate.disabled = !can || mainTranscribeInFlight || pipelineBusy;
  if (polish) {
    polish.disabled =
      !can ||
      !tr.value.trim() ||
      isRecording ||
      mainTranscribeInFlight ||
      pipelineBusy;
  }
  const assistDisabled = !can || mainTranscribeInFlight || pipelineBusy;
  if (assist) assist.disabled = assistDisabled;
  if (assistPolish) {
    const hasPolishedText = !!(pl && pl.value.trim());
    const canStopPolishInstruction = isRecording && activeRecordingKind === "polish";
    assistPolish.disabled = assistDisabled || (!hasPolishedText && !canStopPolishInstruction);
  }
  syncInstructionButtons();
}

function selectStudent(id) {
  abortRecording();
  syncInstructionButtons();
  flushCommentToMap();
  selectedId = id;
  document.querySelectorAll(".student-block").forEach((el) => {
    el.classList.toggle("selected", el.dataset.id === id);
  });
  const tr = getTranscribeBox();
  const pl = getPolishBox();
  const s = bundle?.students?.find((x) => x.id === id);
  document.getElementById("commentTitle").textContent = s
    ? `Comments — ${s.name}`
    : "Comments";
  const entry = id ? normalizeCommentEntry(comments[id]) : normalizeCommentEntry(null);
  if (id) comments[id] = entry;
  if (tr) {
    tr.disabled = !id;
    tr.value = id ? entry.transcribe : "";
  }
  if (pl) {
    pl.disabled = !id;
    pl.value = id ? entry.polish : "";
  }
  updateCommentTools();
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
    const ae = getCurrentAssignmentEntry();
    const pathHint = ae
      ? `data/instructor-review/assignments/${ae.dir}/students.json`
      : "data/instructor-review/assignments/…/students.json";
    root.innerHTML =
      `<p class="empty-state">No students for this assignment. Add <code>${pathHint}</code> or use Import JSON.</p>`;
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
}

function buildExportPayload() {
  flushCommentToMap();
  const asg = getCurrentAssignmentEntry();
  return {
    exportVersion: 5,
    exportedAt: new Date().toISOString(),
    assignmentId: currentAssignmentId,
    assignmentTitle: asg?.title ?? null,
    questions: bundle.questions,
    students: bundle.students,
    comments: normalizeCommentsObject(comments),
  };
}

function downloadExport() {
  if (!bundle) return;
  const data = buildExportPayload();
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  const slug = (currentAssignmentId || "export").replace(/[^a-z0-9-_]+/gi, "-");
  a.download = `ai-perspectives-review-${slug}-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
  toast("Downloaded merged JSON");
}

function onImportFile(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      mergeCommentsFromFile(data);
      if (Array.isArray(data.students) && data.students.length && data.questions) {
        bundle = {
          questions: data.questions,
          students: data.students,
          sourceFile: data.sourceFile ?? "imported",
        };
        renderStudents();
      }
      schedulePersistCommentsToFile();
      void pushCommentsToServer();
      if (selectedId) {
        const ent = normalizeCommentEntry(comments[selectedId]);
        comments[selectedId] = ent;
        const tr = getTranscribeBox();
        const pl = getPolishBox();
        if (tr) tr.value = ent.transcribe;
        if (pl) pl.value = ent.polish;
      }
      toast("Import applied");
    } catch (err) {
      toast("Invalid JSON file");
      console.error(err);
    }
  };
  reader.readAsText(file);
  e.target.value = "";
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

function wireCommentBox() {
  const onTranscribeInput = () => {
    if (!selectedId) return;
    ensureCommentEntry(selectedId);
    const tr = getTranscribeBox();
    const c = comments[selectedId];
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
  wireVoiceAndPolish();
  syncInstructionButtons();
  window.addEventListener("pagehide", flushPersistenceOnPageExit);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flushPersistenceOnPageExit();
  });
  document.getElementById("btnExport").addEventListener("click", downloadExport);
  document.getElementById("importInput").addEventListener("change", onImportFile);
  wireAssignmentSelect();
  wireUploadModal();
  wireDeleteAssignment();
  wireReviewHomeLogout();

  try {
    const manRes = await fetch(`${REVIEW_DATA_BASE}assignments/manifest.json`, REVIEW_STATIC_FETCH);
    if (!manRes.ok) throw new Error("assignments manifest missing");
    const man = await manRes.json();
    assignmentManifest = Array.isArray(man.assignments)
      ? man.assignments.filter((a) => a && a.id && a.dir)
      : [];
    fillAssignmentDropdown();
    await migrateLegacyLocalCommentsToServerOnce();

    if (!assignmentManifest.length) {
      document.getElementById("studentList").innerHTML =
        '<p class="empty-state">No assignments yet. Use <strong>Upload assignment data</strong> to add a Canvas-style <code>students.json</code>.</p>';
      document.getElementById("metaLine").textContent = "0 assignments";
      syncDeleteButtonState();
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
    updateCommentTools();
    toast("Load error — check assignments manifest");
    return;
  }
}

init();
