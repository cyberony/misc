const chrono = require('chrono-node');

/** Wall-clock for reminder dates/times: always America/Chicago (9:00 default = 9:00 AM Chicago). */
function reminderWallClockTimeZone() {
  return 'America/Chicago';
}

/**
 * Tweaks so chrono's first hit matches user intent. Stored `rawText` stays the user's wording.
 *
 * - Bare "day after tomorrow" → "the day after tomorrow" (otherwise chrono matches "tomorrow" only).
 * - "N days from tomorrow" → "N days after tomorrow" (otherwise chrono splits into "in N days" + "tomorrow").
 */
function normalizeChronoInputText(raw) {
  let s = raw.replace(/\bday after tomorrow\b/gi, (match, offset, str) => {
    if (offset >= 4) {
      const prev = str.slice(offset - 4, offset);
      if (/^the\s$/i.test(prev)) return match;
    }
    return 'the day after tomorrow';
  });
  s = s.replace(/\b(\d+)\s+days?\s+from\s+tomorrow\b/gi, '$1 days after tomorrow');
  s = s.replace(
    /\b(one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve)\s+days?\s+from\s+tomorrow\b/gi,
    '$1 days after tomorrow',
  );
  return s;
}

/** Calendar Y-M-D for an instant as seen in `timeZone` (what users mean by “that day”). */
function calendarPartsInTimeZone(utcDate, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(utcDate);
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  return { y, m, day };
}

function chicagoCalendarDateTodayString(now = new Date()) {
  const { y, m, day } = calendarPartsInTimeZone(now, reminderWallClockTimeZone());
  if (!y || !m || !day) return '';
  const mm = String(m).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${y}-${mm}-${dd}`;
}

/**
 * UTC instant when wall-clock (hour:minute) on y-m-day occurs in `timeZone`.
 */
function utcInstantForWallClock(y, m, day, hour, minute, timeZone) {
  let t = Date.UTC(y, m - 1, day, 12, 0, 0);
  for (let i = 0; i < 48; i++) {
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(new Date(t));
    const yy = Number(parts.find((p) => p.type === 'year')?.value);
    const mo = Number(parts.find((p) => p.type === 'month')?.value);
    const dd = Number(parts.find((p) => p.type === 'day')?.value);
    const h = Number(parts.find((p) => p.type === 'hour')?.value);
    const mi = Number(parts.find((p) => p.type === 'minute')?.value);
    if (yy === y && mo === m && dd === day && h === hour && mi === minute) {
      return new Date(t);
    }
    t += ((hour - h) * 60 + (minute - mi)) * 60 * 1000;
  }
  return new Date(Date.UTC(y, m - 1, day, 12, 0, 0));
}

/**
 * Chrono often copies the reference time onto a date-only parse (e.g. "April 2").
 * When the hour was not explicitly parsed, use 9:00 AM that calendar day in Chicago.
 *
 * Use the Chicago calendar of `dueDate` so late-evening Chicago (stored as “next day” UTC)
 * still snaps to the day people mean (e.g. “5 days after tomorrow” must not show as the next UTC day).
 * Exception: phrases containing “the day after tomorrow” matched chrono + UTC snap better than Chicago snap.
 */
function normalizeImpliedClockTime(start, dueDate, forParse) {
  if (start.isCertain('hour')) return dueDate;
  const tz = reminderWallClockTimeZone();
  try {
    let y;
    let m;
    let day;
    if (forParse && /\b(the\s+)?day\s+after\s+tomorrow\b/i.test(forParse)) {
      y = dueDate.getUTCFullYear();
      m = dueDate.getUTCMonth() + 1;
      day = dueDate.getUTCDate();
    } else {
      const p = calendarPartsInTimeZone(dueDate, tz);
      y = p.y;
      m = p.m;
      day = p.day;
    }
    if (!y || !m || !day) return dueDate;
    return utcInstantForWallClock(y, m, day, 9, 0, tz);
  } catch {
    return dueDate;
  }
}

/**
 * Chrono often returns separate spans for calendar date vs clock time (e.g. "April 2 … at 5pm").
 * If we only used results[0], the time would be dropped. Merge date-only + time-only when both exist.
 */
function pickChronoInterpretation(results) {
  if (!results.length) return null;
  const withDateAndTime = results.find((r) => {
    const s = r.start;
    const hasDate = s.isCertain('day') || s.isCertain('month');
    return hasDate && s.isCertain('hour');
  });
  if (withDateAndTime) return { kind: 'single', hit: withDateAndTime };

  const dateOnly = results.find((r) => r.start.isOnlyDate && !r.start.isCertain('hour'));
  const timeOnly = results.find((r) => r.start.isOnlyTime && r.start.isCertain('hour'));
  if (dateOnly && timeOnly) return { kind: 'merge', dateOnly, timeOnly };

  return { kind: 'single', hit: results[0] };
}

function mergeDateOnlyWithTimeOnly(dateHit, timeHit) {
  const tz = reminderWallClockTimeZone();
  const d = dateHit.start.date();
  if (!d || Number.isNaN(d.getTime())) return null;
  const { y, m, day } = calendarPartsInTimeZone(d, tz);
  if (!y || !m || !day) return null;
  const hour = timeHit.start.get('hour');
  const minute = timeHit.start.get('minute') ?? 0;
  if (hour == null) return null;
  return utcInstantForWallClock(y, m, day, hour, minute, tz);
}

function dateTimePartsInTimeZone(utcDate, timeZone) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(utcDate);
  const y = Number(parts.find((p) => p.type === 'year')?.value);
  const m = Number(parts.find((p) => p.type === 'month')?.value);
  const day = Number(parts.find((p) => p.type === 'day')?.value);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value);
  return { y, m, day, hour, minute };
}

function addDaysYmd(y, m, day, n) {
  const d = new Date(Date.UTC(y, m - 1, day + n, 12, 0, 0));
  return { y: d.getUTCFullYear(), m: d.getUTCMonth() + 1, day: d.getUTCDate() };
}

function addMonthsYmd(y, m, day, n) {
  const first = new Date(Date.UTC(y, m - 1, 1, 12, 0, 0));
  first.setUTCMonth(first.getUTCMonth() + n);
  const yy = first.getUTCFullYear();
  const mm = first.getUTCMonth() + 1;
  const daysInTargetMonth = new Date(Date.UTC(yy, mm, 0)).getUTCDate();
  const dd = Math.min(day, daysInTargetMonth);
  return { y: yy, m: mm, day: dd };
}

function parseRecurrenceIntent(rawText, dueAtIso) {
  const raw = String(rawText || '').trim();
  const lower = raw.toLowerCase();
  const due = new Date(dueAtIso);
  if (!raw || Number.isNaN(due.getTime())) return { dueAt: dueAtIso, recurrence: null };

  let frequency = null;
  if (/\b(daily|every day|each day)\b/.test(lower)) frequency = 'daily';
  else if (/\b(weekly|every week|each week)\b/.test(lower)) frequency = 'weekly';
  else if (/\b(monthly|every month|each month)\b/.test(lower)) frequency = 'monthly';
  if (!frequency) return { dueAt: dueAtIso, recurrence: null };

  let interval = 1;
  if (/\bevery other (day|week|month)\b/.test(lower)) interval = 2;
  const everyN = lower.match(/\bevery\s+(\d+)\s+(day|days|week|weeks|month|months)\b/);
  if (everyN) {
    const parsed = Number(everyN[1]);
    if (Number.isFinite(parsed) && parsed > 0) interval = parsed;
  }

  const recurrence = { frequency, interval };
  let firstDueIso = due.toISOString();

  // "daily next week at 11 am" => first fire at start of next week, stop end of next week.
  if (frequency === 'daily' && /\bnext week\b/.test(lower)) {
    const tz = reminderWallClockTimeZone();
    const now = new Date();
    const nowParts = dateTimePartsInTimeZone(now, tz);
    if (nowParts.y && nowParts.m && nowParts.day) {
      const todayNoonUtc = new Date(Date.UTC(nowParts.y, nowParts.m - 1, nowParts.day, 12, 0, 0));
      const jsDow = todayNoonUtc.getUTCDay(); // 0..6, Sun..Sat
      const mondayBased = jsDow === 0 ? 7 : jsDow; // 1..7
      const daysUntilNextMonday = 8 - mondayBased;
      const start = addDaysYmd(nowParts.y, nowParts.m, nowParts.day, daysUntilNextMonday);
      const end = addDaysYmd(start.y, start.m, start.day, 6);
      const dueParts = dateTimePartsInTimeZone(due, tz);
      const hh = Number.isFinite(dueParts.hour) ? dueParts.hour : 9;
      const mi = Number.isFinite(dueParts.minute) ? dueParts.minute : 0;
      const startAt = utcInstantForWallClock(start.y, start.m, start.day, hh, mi, tz);
      const endAt = utcInstantForWallClock(end.y, end.m, end.day, hh, mi, tz);
      firstDueIso = startAt.toISOString();
      recurrence.until = endAt.toISOString();
    }
  }

  return { dueAt: firstDueIso, recurrence };
}

function getNextReminderDueAt(reminder) {
  const rec = reminder && typeof reminder.recurrence === 'object' ? reminder.recurrence : null;
  if (!rec) return null;
  const current = new Date(reminder.dueAt);
  if (Number.isNaN(current.getTime())) return null;
  const tz = reminderWallClockTimeZone();
  const parts = dateTimePartsInTimeZone(current, tz);
  if (!parts.y || !parts.m || !parts.day) return null;
  const interval = Number.isFinite(Number(rec.interval)) && Number(rec.interval) > 0 ? Number(rec.interval) : 1;
  let nextYmd = null;
  if (rec.frequency === 'daily') nextYmd = addDaysYmd(parts.y, parts.m, parts.day, interval);
  else if (rec.frequency === 'weekly') nextYmd = addDaysYmd(parts.y, parts.m, parts.day, interval * 7);
  else if (rec.frequency === 'monthly') nextYmd = addMonthsYmd(parts.y, parts.m, parts.day, interval);
  else return null;
  const next = utcInstantForWallClock(nextYmd.y, nextYmd.m, nextYmd.day, parts.hour, parts.minute, tz);
  if (Number.isNaN(next.getTime())) return null;
  if (rec.until) {
    const until = new Date(rec.until);
    if (!Number.isNaN(until.getTime()) && next.getTime() > until.getTime()) return null;
  }
  return next.toISOString();
}

function formatRecurrence(rec) {
  if (!rec || typeof rec !== 'object') return '';
  const interval = Number.isFinite(Number(rec.interval)) && Number(rec.interval) > 0 ? Number(rec.interval) : 1;
  const noun =
    rec.frequency === 'daily' ? 'day' : rec.frequency === 'weekly' ? 'week' : rec.frequency === 'monthly' ? 'month' : '';
  if (!noun) return '';
  if (interval === 1) return `Every ${noun}`;
  return `Every ${interval} ${noun}s`;
}

function formatReminderDueDisplay(dueAtIso) {
  const due = new Date(dueAtIso);
  if (!dueAtIso || Number.isNaN(due.getTime())) return 'Reminder';
  const tz = reminderWallClockTimeZone();
  try {
    return due.toLocaleString('en-US', {
      timeZone: tz,
      dateStyle: 'medium',
      timeStyle: 'short',
    });
  } catch {
    return due.toISOString();
  }
}

/**
 * Rule-based parse (chrono + heuristics). Used when OpenAI is off or fails.
 * @returns {{ dueAt: string, rawText: string } | { error: string }}
 */
function parseReminderNaturalLanguageWithChrono(text) {
  const raw = String(text || '').trim();
  if (!raw) return { error: 'Enter a reminder with a date.' };

  const forParse = normalizeChronoInputText(raw);
  /* Central Time ref: chrono’s map uses CT with DST (not IANA strings). */
  const results = chrono.parse(
    forParse,
    { instant: new Date(), timezone: 'CT' },
    { forwardDate: true },
  );
  if (!results.length) {
    return {
      error:
        'Could not find a date. Try e.g. “April 12, 2026”, “next Friday 9am”, or “2026-04-12”.',
    };
  }

  const interpretation = pickChronoInterpretation(results);
  if (!interpretation) {
    return { error: 'Could not resolve that date.' };
  }

  let dueDate;
  if (interpretation.kind === 'merge') {
    dueDate = mergeDateOnlyWithTimeOnly(interpretation.dateOnly, interpretation.timeOnly);
    if (!dueDate || Number.isNaN(dueDate.getTime())) {
      return { error: 'Could not resolve that date.' };
    }
  } else {
    const hit = interpretation.hit;
    try {
      dueDate = hit.start.date();
    } catch {
      return { error: 'Could not resolve that date.' };
    }
    if (!dueDate || Number.isNaN(dueDate.getTime())) {
      return { error: 'Invalid date.' };
    }
    dueDate = normalizeImpliedClockTime(hit.start, dueDate, forParse);
  }

  return {
    dueAt: dueDate.toISOString(),
    rawText: raw,
  };
}

const REMINDER_DATE_OPENAI_SYSTEM = [
  'You resolve when a natural-language email reminder should fire.',
  'All calendar reasoning uses America/Chicago (Central Time), including DST.',
  'REFERENCE_NOW is an ISO 8601 UTC instant.',
  'CHICAGO_TODAY is the authoritative calendar date (YYYY-MM-DD) for "today" in America/Chicago.',
  'Always anchor "today", "tomorrow", and every relative phrase to CHICAGO_TODAY — never use UTC calendar date alone (it can be a different day than Chicago).',
  '',
  'Relative phrases (Chicago calendar dates):',
  '- "tomorrow" = the day after today\'s Chicago date.',
  '- "the day after tomorrow" / "day after tomorrow" = today + 2 days.',
  '- "N days from tomorrow" / "N days after tomorrow" = (tomorrow\'s Chicago date) plus N full calendar days. Example: if tomorrow is Apr 1, then "4 days from tomorrow" is Apr 5.',
  '- "in N days" / "N days from now" = today\'s Chicago date + N days.',
  '- "next Monday" (etc.) = the next occurrence of that weekday in Chicago unless a specific date is given.',
  '',
  'Time:',
  '- If the text names a time (3pm, 15:30, noon), use that local time in Chicago on the resolved date.',
  '- If no time is named, use 09:00 (9 AM) America/Chicago on that date.',
  '',
  'Return JSON only. Success: {"dueAt":"<ISO 8601 UTC with Z suffix>"} for the exact instant.',
  'If there is no date or time: {"error":"brief reason"}.',
].join('\n');

/**
 * OpenAI date resolution. Returns { dueAt } or { useChronoFallback: true } on failure.
 */
async function parseReminderDueDateWithOpenAI(text) {
  const apiKey = String(process.env.OPENAI_API_KEY || '').trim();
  const useOpenAI = String(process.env.REMINDER_DATE_USE_OPENAI || '1').trim() !== '0';
  if (!apiKey || !useOpenAI) return { useChronoFallback: true };

  const model = String(process.env.OPENAI_REMINDER_MODEL || 'gpt-4o-mini').trim();
  const referenceNowUtc = new Date().toISOString();
  const chicagoToday = chicagoCalendarDateTodayString();

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0,
        max_tokens: 300,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: REMINDER_DATE_OPENAI_SYSTEM },
          {
            role: 'user',
            content: JSON.stringify({
              referenceNowUtc,
              chicagoCalendarDateToday: chicagoToday,
              reminderText: text,
            }),
          },
        ],
      }),
    });

    const rawText = await res.text();
    if (!res.ok) return { useChronoFallback: true };

    const data = JSON.parse(rawText);
    const content = data.choices?.[0]?.message?.content;
    if (!content) return { useChronoFallback: true };

    const parsed = JSON.parse(content);
    if (parsed.error) return { useChronoFallback: true };
    if (!parsed.dueAt) return { useChronoFallback: true };

    const d = new Date(String(parsed.dueAt));
    if (Number.isNaN(d.getTime())) return { useChronoFallback: true };

    return { dueAt: d.toISOString(), source: 'openai' };
  } catch {
    return { useChronoFallback: true };
  }
}

/**
 * Parse natural-language reminder: OpenAI when configured, else chrono rules.
 * @returns {Promise<{ dueAt: string, rawText: string, source?: string } | { error: string }>}
 */
async function parseReminderNaturalLanguage(text) {
  const raw = String(text || '').trim();
  if (!raw) return { error: 'Enter a reminder with a date.' };

  const oai = await parseReminderDueDateWithOpenAI(raw);
  if (oai.dueAt) {
    const withRecurrence = parseRecurrenceIntent(raw, oai.dueAt);
    return {
      dueAt: withRecurrence.dueAt,
      rawText: raw,
      source: oai.source || 'openai',
      recurrence: withRecurrence.recurrence,
    };
  }

  const fallback = parseReminderNaturalLanguageWithChrono(raw);
  if (fallback.error) return fallback;
  const withRecurrence = parseRecurrenceIntent(raw, fallback.dueAt);
  return {
    dueAt: withRecurrence.dueAt,
    rawText: raw,
    source: 'chrono',
    recurrence: withRecurrence.recurrence,
  };
}

/**
 * Due-email subject/body heading: formatted due datetime (REMINDER_DISPLAY_TZ).
 */
function getReminderDisplayTitle(reminder) {
  return formatReminderDueDisplay(reminder?.dueAt);
}

module.exports = {
  parseReminderNaturalLanguage,
  parseReminderNaturalLanguageWithChrono,
  getReminderDisplayTitle,
  formatReminderDueDisplay,
  getNextReminderDueAt,
  formatRecurrence,
};
