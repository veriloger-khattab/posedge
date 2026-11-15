// Pictograms for UVM roles: the icon a SystemVerilog file gets from the class it declares.
// Hand-drawn on the full 16x16 box with round 1.5 px strokes, so each one reads at Explorer size.
//
// The colors keep the language of the code:
//   automation (green)   drives the pins             = functions in code
//   verification (teal)  observes and checks         = assert/cover in code
//   silicon (orange-red) the testbench's structure   = structural keywords in code
//   data (purple)        transactions and registers  = numbers in code: an item, the sequence that holds
//                                                      items and the sequencer that fires them all share it
//   hdl (cyan)           connects to the design      = types in code
//   directive (orange)   defines                     = macros in code
//   time (blue)          handles reset               = resets in code

import type { RoleId } from '../uvm.mts';
import type { IconColor } from './registry.mts';

export interface Pen {
  c: string; // the role's color
  tint: string; // a soft fill of that color
  fg: string; // strongest ink on this background
  bg: string; // the background behind the icon
  red: string;
  green: string;
}

const line = (d: string, color: string, width = 1.5): string =>
  `<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;
const shape = (d: string, color: string): string => `<path d="${d}" fill="${color}"/>`;
const outlined = (d: string, p: Pen, width = 1.5): string =>
  `<path d="${d}" fill="${p.tint}" stroke="${p.c}" stroke-width="${width}" stroke-linejoin="round"/>`;
const dot = (cx: number, cy: number, r: number, color: string): string => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${color}"/>`;
const box = (x: number, y: number, w: number, h: number, r: number, fill: string, stroke?: string, width = 1.5): string =>
  `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}"${stroke ? ` stroke="${stroke}" stroke-width="${width}"` : ''}/>`;

// A cannon has to survive 16 px, so everything is solid: a thick barrel with a rounded breech and a flared
// muzzle, over a solid wheel. A thin outline turns into a scribble at this size. The barrel stops short of
// the wheel instead of being painted over, so the gap between them is truly empty on every background.
// The dashed one is the same outline cut across into three pieces.
const BARREL = 'M2.16 4.27 12.56 1.55 12.25.71 14.04.06 16 5.5 14.24 6.16 13.93 5.31 9.48 7.42A4.65 4.65 0 0 0 4.66 9.7L4.22 9.91A3 3 0 0 1 2.16 4.27z';
const BARREL_DASHED =
  'M2.16 4.27 5.03 3.52 6.6 7.85A4.65 4.65 0 0 0 4.66 9.7L4.22 9.91A3 3 0 0 1 2.16 4.27z' +
  'M5.86 3.31 9.11 2.46 10.71 6.84 9.48 7.42A4.65 4.65 0 0 0 7.4 7.54z' +
  'M9.94 2.24 12.56 1.55 12.25.71 14.04.06 16 5.5 14.24 6.16 13.93 5.31 11.48 6.47z';
/** What the barrel sits on: a solid wheel with an axle hole, and the trail that rests on the ground. */
const carriage = (p: Pen): string => `<circle cx="8.7" cy="12" r="2.6" fill="none" stroke="${p.c}" stroke-width="2.6"/>` + line('M4.7 12.5 1 14.6', p.c, 1.9);

// A highlight has to be lighter than the ball on both tones, which neither p.fg nor p.bg is.
const SHINE = '#FFFFFFA0';
const hundredths = (n: number): number => Math.round(n * 100) / 100;
/** A sequence item: a solid sphere with a small highlight, at any size. */
const ball = (x: number, y: number, r: number, p: Pen): string => dot(x, y, r, p.c) + dot(hundredths(x - r * 0.35), hundredths(y - r * 0.35), hundredths(r * 0.26), SHINE);

// Drawn dash by dash, not with stroke-dasharray: every dash lands on whole pixels and the frame stays
// symmetric, with a bracket on each corner and one dash in the middle of each side.
const DASHED_FRAME =
  'M.5 3.5v-1a2 2 0 0 1 2-2h1M6.5.5h3M12.5.5h1a2 2 0 0 1 2 2v1M15.5 6.5v3' +
  'M15.5 12.5v1a2 2 0 0 1-2 2h-1M9.5 15.5h-3M3.5 15.5h-1a2 2 0 0 1-2-2v-1M.5 9.5v-3';

/** `look` says in words what each pictogram shows; docs/colors-and-icons.md is generated from it. */
export const ROLE_ICONS: Record<RoleId, { color: IconColor; look: string; draw: (p: Pen) => string }> = {
  // ---- stimulus
  driver: {
    color: 'automation',
    look: 'A steering wheel: rim, hub and three spokes.',
    draw: (p) =>
      `<circle cx="8" cy="8" r="6.6" fill="${p.tint}" stroke="${p.c}" stroke-width="1.7"/>` +
      line('M2 7.1 6 8M14 7.1 10 8M8 10.2v4', p.c, 1.5) +
      dot(8, 8.1, 2.3, p.c),
  },
  sequencer: { color: 'data', look: 'A cannon on its wheel, barrel up and to the right: it fires what the sequences load.', draw: (p) => shape(BARREL, p.c) + carriage(p) },
  vsequencer: { color: 'data', look: 'The same cannon with a dashed barrel: virtual, it holds no shot of its own.', draw: (p) => shape(BARREL_DASHED, p.c) + carriage(p) },
  sequence: { color: 'data', look: 'Three small items sitting side by side, ready to fire.', draw: (p) => [2.55, 8, 13.45].map((x) => ball(x, 8, 2.5, p)).join('') },
  vsequence: { color: 'data', look: 'Three smaller items in a dashed frame: virtual, it only starts other sequences.', draw: (p) => line(DASHED_FRAME, p.c, 1) + [3.7, 8, 12.3].map((x) => dot(x, 8, 2, p.c)).join('') },
  item: { color: 'data', look: 'One large item, which is what a sequence is made of: one transaction.', draw: (p) => ball(8, 8, 6.5, p) },

  // ---- observation and checking
  monitor: {
    color: 'verification',
    look: 'An eye.',
    draw: (p) => outlined('M.9 8C2.6 4.8 5 3 8 3s5.4 1.8 7.1 5c-1.7 3.2-4.1 5-7.1 5S2.6 11.2.9 8z', p) + dot(8, 8, 3, p.c) + dot(8, 8, 1.2, p.bg),
  },
  coverage: {
    color: 'verification',
    look: 'A Wi-Fi signal: how much of the space has been reached.',
    draw: (p) => line('M1 5.4a10 10 0 0 1 14 0M3.5 8.1a6.4 6.4 0 0 1 9 0M6 10.7a2.9 2.9 0 0 1 4 0', p.c, 1.7) + dot(8, 12.9, 1.4, p.c),
  },
  scoreboard: {
    color: 'neutral',
    look: 'A box with a green (match) and a red (mismatch) light.',
    draw: (p) => box(0.75, 2.75, 14.5, 10.5, 2, p.tint, p.c) + dot(5, 8, 2.5, p.green) + dot(11, 8, 2.5, p.red),
  },
  subscriber: {
    color: 'verification',
    look: 'An inbox: a subscriber receives what is broadcast.',
    draw: (p) =>
      line('M8 1.2v6.6M5.1 5.2 8 8l2.9-2.8', p.c, 1.6) + shape('M1 9.5h3.6l1 2.2h4.8l1-2.2H15v3.8a1.4 1.4 0 0 1-1.4 1.4H2.4A1.4 1.4 0 0 1 1 13.3z', p.c),
  },
  predictor: {
    color: 'verification',
    look: 'A crystal ball: the reference model predicts the expected result.',
    draw: (p) =>
      `<circle cx="8" cy="6.9" r="5.7" fill="${p.tint}" stroke="${p.c}" stroke-width="1.5"/>` +
      line('M4.9 7a3.2 3.2 0 0 1 2.6-3', p.c, 1.2) +
      line('M5 12.2 4.2 14.8h7.6L11 12.2', p.c, 1.4),
  },
  assertion: {
    color: 'verification',
    look: 'A shield with a check mark.',
    draw: (p) =>
      outlined('M8 1 14 3.2v4.6c0 3.4-2.4 5.9-6 7.2-3.6-1.3-6-3.8-6-7.2V3.2z', p) + line('M5.1 7.8 7.2 9.9l3.8-4', p.c, 1.7),
  },

  // ---- structure
  agent: {
    color: 'silicon',
    look: 'A person wearing a headset with a boom microphone.',
    draw: (p) =>
      shape('M2.2 15.5c.4-3 2.7-4.7 5.8-4.7s5.4 1.7 5.8 4.7z', p.c) +
      dot(8, 6.4, 3.3, p.c) +
      line('M3.4 6.8V6a4.6 4.6 0 0 1 9.2 0v.8', p.fg, 1.4) +
      box(2.5, 6, 1.9, 3, 0.8, p.fg) +
      box(11.6, 6, 1.9, 3, 0.8, p.fg) +
      line('M12.6 9c0 1.5-1.2 2-3 2', p.fg, 1.2) +
      dot(9.2, 11, 0.95, p.fg),
  },
  env: {
    color: 'silicon',
    look: 'A hierarchy: the environment contains the agents.',
    draw: (p) =>
      box(5.25, 0.9, 5.5, 4.3, 1, p.c) + line('M8 5.2v2.6M3.4 10.6V7.8h9.2v2.8', p.c, 1.4) + box(0.9, 10.6, 5, 4.4, 1, p.c) + box(10.1, 10.6, 5, 4.4, 1, p.c),
  },
  test: {
    color: 'silicon',
    look: 'A lab flask.',
    draw: (p) =>
      line('M5.6 1.3h4.8M6.6 1.3V6L2.4 12.9a1.3 1.3 0 0 0 1.1 1.9h9a1.3 1.3 0 0 0 1.1-1.9L9.4 6V1.3', p.c) +
      shape('M4.6 10h6.8l1.9 3.1c.3.5-.1 1.1-.6 1.1H3.3c-.5 0-.9-.6-.6-1.1z', p.c),
  },
  reset: { color: 'time', look: 'One arrow going around a circle, the sign for restart: everything returns to its initial state.', draw: (p) => line('M13.54 6.7A6 6 0 1 1 9.75 3.04', p.c, 2) + shape('M10.74 0 13.94 4.4 8.77 6.09z', p.c) },
  // ---- data
  config: {
    color: 'data',
    look: 'Two sliders.',
    draw: (p) => line('M1.5 4.5h13M1.5 11.5h13', p.c) + dot(10.5, 4.5, 2.5, p.c) + dot(10.5, 4.5, 0.9, p.bg) + dot(5.5, 11.5, 2.5, p.c) + dot(5.5, 11.5, 0.9, p.bg),
  },
  regmodel: {
    color: 'data',
    look: 'A register map with one field selected.',
    draw: (p) => box(0.9, 1.9, 14.2, 12.2, 1.4, p.tint, p.c, 1.4) + line('M.9 6h14.2M.9 10h14.2M5.6 1.9v12.2M10.4 1.9v12.2', p.c, 1.1) + box(5.6, 6, 4.8, 4, 0, p.c),
  },
  adapter: {
    color: 'data',
    look: 'A plug: it makes register operations fit the bus.',
    draw: (p) => line('M5.4 1.2v3.6M10.6 1.2v3.6', p.c, 1.7) + shape('M3 4.8h10v2.4a5 5 0 0 1-3.8 4.85V14.8H6.8v-2.75A5 5 0 0 1 3 7.2z', p.c),
  },
  callback: { color: 'data', look: 'An arrow turning back.', draw: (p) => line('M5.3 2.5 1.8 6l3.5 3.5M1.8 6h8.4a3.9 3.9 0 0 1 0 7.8H6.6', p.c, 1.7) },

  // ---- connection to the design
  interface: { color: 'hdl', look: 'Two arrows, one above the other, pointing in opposite directions: signals cross it both ways.', draw: (p) => line('M1.5 4.5h12.5M10.5 1.5l3.5 3-3.5 3M14.5 11.5H2M5.5 8.5l-3.5 3 3.5 3', p.c, 1.7) },
  bind: {
    color: 'hdl',
    look: 'Two chain links.',
    draw: (p) => line('M6.6 9.4a3.2 3.2 0 0 0 4.6.1l2.5-2.5a3.2 3.2 0 1 0-4.6-4.5L8 3.6', p.c, 1.7) + line('M9.4 6.6a3.2 3.2 0 0 0-4.6-.1L2.3 9a3.2 3.2 0 1 0 4.6 4.5L8 12.4', p.c, 1.7),
  },
  package: {
    color: 'hdl',
    look: 'A parcel.',
    draw: (p) => outlined('M8 1.1 14.4 4.5v7L8 14.9 1.6 11.5v-7z', p) + line('M1.9 4.7 8 8l6.1-3.3M8 8v6.6M4.7 2.9l6.4 3.4', p.c, 1.3),
  },
  top: {
    color: 'hdl',
    look: 'A chip: the top level that holds the design.',
    draw: (p) =>
      box(3.25, 3.25, 9.5, 9.5, 1.4, p.tint, p.c) +
      line('M6 .9v2M10 .9v2M6 13.1v2M10 13.1v2M.9 6h2M.9 10h2M13.1 6h2M13.1 10h2', p.c, 1.4) +
      box(6, 6, 4, 4, 0.6, p.c),
  },

  // ---- directives
  defines: { color: 'directive', look: 'A hash sign.', draw: (p) => line('M6.2 1.6 4.6 14.4M11.4 1.6 9.8 14.4M2.2 5.6h12.2M1.6 10.4h12.2', p.c, 1.7) },
};
