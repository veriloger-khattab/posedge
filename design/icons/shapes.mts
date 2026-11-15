// SVG builders for the icon theme. All geometry lives on a 16x16 grid with strokes on half pixels
// and fills on whole pixels, so icons render crisp at 100% and stay clean at 125-200% scaling.
//
// Folders work like a lamp, an idea borrowed from Ayu: every closed folder is the same flat, colorless
// silhouette, and only an open folder lights up, as a bright amber outline glowing from inside with a
// clock trace across it. So "what is open?" reads at a glance. In the animated set the trace scrolls
// (CSS steps(), ~5 repaints/s, reduced-motion aware); in the still set it is frozen.
//
// Files stay quiet for the same reason: their colors are faded toward the background, so nothing at
// rest competes with a lit folder. VS Code picks icons by base theme, so there are two tones of the art.

import { mix, withAlpha } from '../../build/lib/color.mts';
import { VARIANTS } from '../palette.mts';
import type { RoleId } from '../uvm.mts';
import { EMBLEMS, bitmapPath, labelPath, labelWidth } from './pixels.mts';
import type { IconColor } from './registry.mts';
import { ROLE_ICONS } from './roles.mts';

export interface Tone {
  bg: string; // reference background for tinting
  ink: string; // ink drawn on opaque color
  fg: string; // strongest ink directly on the background
  red: string;
  green: string;
  off: string; // a closed folder
  offEmblem: string;
  offGenerated: string; // a closed folder of tool output: dimmer still
  lit: string; // an open folder
  trace: string; // the clock trace inside it
  led: string;
  fade: number; // how far file icons lean toward the background
}

const OFF_DARK = '#3A3F46';
const OFF_LIGHT = '#C4C5C2';

export const DARK_TONE: Tone = {
  bg: VARIANTS.graphite.surface.editor,
  ink: '#141414',
  fg: VARIANTS.graphite.ink.bright,
  red: VARIANTS.graphite.syntax.error,
  green: VARIANTS.graphite.syntax.function,
  off: OFF_DARK,
  offEmblem: mix(OFF_DARK, VARIANTS.graphite.surface.editor, 0.65),
  offGenerated: mix(OFF_DARK, VARIANTS.graphite.surface.editor, 0.45),
  lit: '#FFB02E',
  trace: '#FFE2A0',
  led: '#FFE2A0',
  fade: 0.32,
};

export const LIGHT_TONE: Tone = {
  bg: VARIANTS.daylight.surface.sidebar,
  ink: '#FFFFFF',
  fg: VARIANTS.daylight.ink.fg,
  red: VARIANTS.daylight.syntax.error,
  green: VARIANTS.daylight.syntax.function,
  off: OFF_LIGHT,
  offEmblem: mix(OFF_LIGHT, '#000000', 0.2),
  offGenerated: mix(OFF_LIGHT, VARIANTS.daylight.surface.sidebar, 0.45),
  lit: '#C87000',
  trace: VARIANTS.daylight.accent,
  led: '#FD9720',
  fade: 0.3,
};

/** A file icon's color at rest. */
export const quiet = (color: string, tone: Tone): string => mix(color, tone.bg, tone.fade);

const svg = (body: string, style = '', height = 16): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 ${height}">${style ? `<style>${style}</style>` : ''}${body}</svg>\n`;

// VS Code draws icons 16 px wide in a 22 px tall box, keeping the image's proportions. A 16x18 canvas
// lets pages grow past 16 px tall, and still fits the 18 px tall breadcrumbs.
const page = (body: string): string => svg(body, '', 18);

const emblemPath = (name: string, x: number, y: number): string => {
  const rows = EMBLEMS[name];
  if (!rows) throw new Error(`Unknown emblem "${name}"`);
  return bitmapPath(rows, x, y);
};

// ---------------------------------------------------------------- files

const PAGE = 'M1.5 .5h9l4 4v13h-13z';
const FOLD = 'M10.5 .5v4h4';

/** A page with a colored tag band carrying a dot-matrix label (e.g. SV, SVH, TCL). */
export function fileWithLabel(color: string, label: string, tone: Tone = DARK_TONE): string {
  const w = labelWidth(label);
  const x = Math.floor((16 - w) / 2);
  return page(
    `<path d="${PAGE}" fill="${withAlpha(color, 0.1)}" stroke="${withAlpha(color, 0.75)}"/>` +
      `<path d="${FOLD}" fill="none" stroke="${withAlpha(color, 0.75)}"/>` +
      `<rect y="10" width="16" height="8" rx="1.5" fill="${color}"/>` +
      `<path d="${labelPath(label, x, 11.5)}" fill="${tone.ink}"/>`,
  );
}

/** A page with a 5x5 emblem (waves, coverage, logs, ...). */
export function fileWithEmblem(color: string, emblem: string): string {
  return page(
    `<path d="${PAGE}" fill="${withAlpha(color, 0.14)}" stroke="${color}"/>` +
      `<path d="${FOLD}" fill="none" stroke="${color}"/>` +
      `<g transform="translate(3 6) scale(2)"><path d="${emblemPath(emblem, 0, 0)}" fill="${color}"/></g>`,
  );
}

/** The default file: a plain page. */
export function plainFile(color: string): string {
  return page(
    `<path d="${PAGE}" fill="${withAlpha(color, 0.1)}" stroke="${withAlpha(color, 0.8)}"/>` +
      `<path d="${FOLD}" fill="none" stroke="${withAlpha(color, 0.8)}"/>` +
      `<path d="M4 8.5h8M4 11h8M4 13.5h5" stroke="${withAlpha(color, 0.45)}"/>`,
  );
}

/** A UVM role pictogram, used instead of the page for files whose class is recognised. */
export function roleIcon(id: RoleId, colors: Record<IconColor, string>, tone: Tone = DARK_TONE): string {
  const { color, draw } = ROLE_ICONS[id];
  const c = quiet(colors[color], tone);
  return svg(draw({ c, tint: withAlpha(c, 0.16), fg: quiet(tone.fg, tone), bg: tone.bg, red: quiet(tone.red, tone), green: quiet(tone.green, tone) }));
}

// ---------------------------------------------------------------- folders

const CLOSED = 'M.5 3.5a1 1 0 0 1 1-1h4.4l1.5 1.5h7.1a1 1 0 0 1 1 1v8.5a1 1 0 0 1-1 1h-13a1 1 0 0 1-1-1z';
const OPEN = 'M1 3.5a1 1 0 0 1 1-1h3.7L7.2 4H14a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1z';
const OPEN_TAB = 'M1.3 3.5a.8.8 0 0 1 .8-.8h3.5L7.1 4.3H1.3z';

/** Closed folder: off. No color at all, only a faint emblem. `hc` outlines it for High Contrast themes. */
export function folderClosed(emblem: string, tone: Tone = DARK_TONE, opts: { generated?: boolean; hc?: boolean } = {}): string {
  const body = opts.generated ? tone.offGenerated : tone.off;
  if (opts.hc) return svg(`<path d="${CLOSED}" fill="none" stroke="#B0B6BC"/><path d="${emblemPath(emblem, 6, 7)}" fill="#B0B6BC"/>`);
  return svg(`<path d="${CLOSED}" fill="${body}"/><path d="${emblemPath(emblem, 6, 7)}" fill="${tone.offEmblem}"/>`);
}

/**
 * Open folder: on. The same art for every kind of folder, because here the only question is "open or
 * not". In the animated set the trace scrolls one pixel per step and the LED halo blinks with the clock.
 */
export function folderOpen(animated: boolean, tone: Tone = DARK_TONE): string {
  // Square wave with a 4 px period between y=8 and y=11, wide enough to scroll by one period.
  const wave = 'M-4 11h2V8h2v3h2V8h2v3h2V8h2v3h2V8h2v3h2V8h2v3h2V8h2v3h2';
  const style = animated
    ? '@keyframes s{to{transform:translateX(-4px)}}@keyframes b{50%{opacity:.25}}' +
      '.w{animation:s .8s steps(4) infinite}.h{animation:b .8s steps(1) infinite}' +
      '@media (prefers-reduced-motion:reduce){.w,.h{animation:none}}'
    : '';
  return svg(
    `<defs><clipPath id="c"><path d="M1.8 4.8h12.4v8.4H1.8z"/></clipPath></defs>` +
      `<path d="${OPEN}" fill="${withAlpha(tone.lit, 0.24)}" stroke="${tone.lit}" stroke-width="1.6"/>` +
      `<path d="${OPEN_TAB}" fill="${tone.lit}"/>` +
      `<g clip-path="url(#c)"><path class="w" d="${wave}" fill="none" stroke="${tone.trace}" stroke-width="1.2"/></g>` +
      `<circle class="h" cx="13.5" cy="2.1" r="2" fill="${tone.led}" fill-opacity=".35"/>` +
      `<circle cx="13.5" cy="2.1" r="1.2" fill="${tone.led}"/>`,
    style,
  );
}
