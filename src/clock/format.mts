// Clock formatting: `{token}` placeholders, English names (so every character exists in the
// bundled glyph font), and glyph-icon text for the status bar.

import { GLYPHS } from './glyphs.generated.mts';
import { workWeek, type WorkWeekStyle } from './workweek.mts';

export const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const pad = (n: number, width = 2): string => String(n).padStart(width, '0');

export function dayOfYear(d: Date): number {
  const start = Date.UTC(d.getFullYear(), 0, 1);
  return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - start) / 86_400_000) + 1;
}

/** Expands `{HH}:{mm}`-style patterns. Unknown tokens are left untouched. */
export function formatClock(pattern: string, d: Date, style: WorkWeekStyle = 'iso'): string {
  const ww = workWeek(d, style);
  const h12 = d.getHours() % 12 || 12;
  const tokens: Record<string, string> = {
    HH: pad(d.getHours()),
    H: String(d.getHours()),
    hh: pad(h12),
    h: String(h12),
    mm: pad(d.getMinutes()),
    ss: pad(d.getSeconds()),
    A: d.getHours() < 12 ? 'AM' : 'PM',
    a: d.getHours() < 12 ? 'am' : 'pm',
    dddd: DAYS[d.getDay()],
    ddd: DAYS[d.getDay()].slice(0, 3),
    DD: pad(d.getDate()),
    D: String(d.getDate()),
    MMMM: MONTHS[d.getMonth()],
    MMM: MONTHS[d.getMonth()].slice(0, 3),
    MM: pad(d.getMonth() + 1),
    M: String(d.getMonth() + 1),
    YYYY: String(d.getFullYear()),
    YY: pad(d.getFullYear() % 100),
    WW: pad(ww.week),
    W: String(ww.week),
    WD: String(ww.day),
    Q: String(Math.floor(d.getMonth() / 3) + 1),
    DOY: pad(dayOfYear(d), 3),
  };
  return pattern.replace(/\{([A-Za-z]+)\}/g, (all, key: string) => tokens[key] ?? all);
}

export const hasSeconds = (pattern: string): boolean => pattern.includes('{ss}');

/** 2026-10-18 14:37:05 */
export function isoTimestamp(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/**
 * Turns text into status-bar label syntax that draws each character with the JetBrains Mono glyph
 * icons, e.g. "14:37" -> "$(posedge-c-1)$(posedge-c-4)...". Characters without a glyph stay text.
 */
export function toGlyphText(text: string): string {
  let out = '';
  for (const ch of text) out += GLYPHS[ch] ? `$(${GLYPHS[ch]})` : ch;
  return out;
}

/** Plain text that cannot be mistaken for `$(icon)` syntax by the status bar. */
export function toPlainText(text: string): string {
  return text.replace(/\$\(/g, '$ (');
}

/** Toggles seconds in a time pattern: `{HH}:{mm}` <-> `{HH}:{mm}:{ss}`. */
export function toggleSeconds(pattern: string): string {
  if (hasSeconds(pattern)) return pattern.replace(/[:.]?\{ss\}/, '');
  return pattern.includes('{mm}') ? pattern.replace('{mm}', '{mm}:{ss}') : `${pattern}:{ss}`;
}
