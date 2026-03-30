const chrono = require('chrono-node');

const TITLE_MAX = 72;

/**
 * Turn the text left after removing the parsed date into a short list title (not the full request).
 */
function shortenReminderTitle(remainder) {
  let t = String(remainder || '')
    .replace(/\s+/g, ' ')
    .trim();
  if (!t) return 'Reminder';
  t = t
    .replace(/^(remind me (that )?|remember to |don['’]t forget to |please |reminder:\s*)/i, '')
    .trim();
  if (!t) return 'Reminder';
  if (t.length <= TITLE_MAX) return t;
  const cut = t.slice(0, TITLE_MAX);
  const lastSpace = cut.lastIndexOf(' ');
  const base = lastSpace > 24 ? cut.slice(0, lastSpace) : cut.replace(/\s+$/, '');
  return `${base}…`;
}

/**
 * Parse natural-language reminder text; extract first date (chrono) and derive a short title from the rest.
 * @returns {{ title: string, dueAt: string, rawText: string } | { error: string }}
 */
function parseReminderNaturalLanguage(text) {
  const raw = String(text || '').trim();
  if (!raw) return { error: 'Enter a reminder with a date.' };

  const results = chrono.parse(raw, new Date(), { forwardDate: true });
  if (!results.length) {
    return {
      error:
        'Could not find a date. Try e.g. “April 12, 2026”, “next Friday 9am”, or “2026-04-12”.',
    };
  }

  const hit = results[0];
  const start = hit.index;
  const end = start + hit.text.length;
  const remainder = (raw.slice(0, start) + raw.slice(end)).replace(/\s+/g, ' ').trim();
  const title = shortenReminderTitle(remainder);

  let dueDate;
  try {
    dueDate = hit.start.date();
  } catch {
    return { error: 'Could not resolve that date.' };
  }
  if (!dueDate || Number.isNaN(dueDate.getTime())) {
    return { error: 'Invalid date.' };
  }

  return {
    title,
    dueAt: dueDate.toISOString(),
    rawText: raw,
  };
}

module.exports = { parseReminderNaturalLanguage };
