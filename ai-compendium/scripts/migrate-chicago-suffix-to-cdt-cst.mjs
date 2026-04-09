/**
 * Replace legacy "… Chicago" suffix with "… CDT" or "… CST" using US Central Time rules.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

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

function formatChicagoLegacyLine(ymd, hms, d) {
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

function migrateStringField(val) {
  if (typeof val !== "string" || !val.endsWith(" Chicago")) return val;
  const m = val.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2}:\d{2}) Chicago$/);
  if (!m) return val;
  const inst = parseWallClockChicago(m[1], m[2]);
  if (!inst) return val;
  return formatChicagoLegacyLine(m[1], m[2], inst);
}

function migrateFile(filePath) {
  const j = JSON.parse(fs.readFileSync(filePath, "utf8"));
  if (j.generatedAt) j.generatedAt = migrateStringField(j.generatedAt);
  for (const s of j.students || []) {
    if (s.submitted) s.submitted = migrateStringField(s.submitted);
  }
  fs.writeFileSync(filePath, JSON.stringify(j, null, 2) + "\n", "utf8");
  console.log("OK", filePath);
}

const root = path.join(__dirname, "../data/instructor-review/assignments");
for (const dir of ["thoughts-on-ai-quiz-student-analysis-report", "week-1-thoughts-quiz-student-analysis-report"]) {
  migrateFile(path.join(root, dir, "students.json"));
}
