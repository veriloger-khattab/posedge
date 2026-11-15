// Mock of VS Code's status bar using the same CSS VS Code applies to contributed font icons
// (16px/1 inline-block glyph spans inside a 22px flex label), to check the clock's size and baseline.
//
//   node build/clock-mock.mts   -> preview/clock.html

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { formatClock, toGlyphText } from '../src/clock/format.mts';
import { VARIANTS } from '../design/palette.mts';

const ROOT = join(import.meta.dirname, '..');
const map = JSON.parse(readFileSync(join(ROOT, 'build', 'font', 'glyph-map.json'), 'utf8')) as {
  glyphs: Array<{ id: string; codepoint: number }>;
};
const v = VARIANTS.graphite;
const css = map.glyphs.map((g) => `.codicon-${g.id}::before{content:'\\${g.codepoint.toString(16)}'}`).join('');
const toHtml = (glyphText: string): string =>
  glyphText.replace(/\$\(([a-z0-9-]+)\)/g, '<span class="codicon codicon-$1"></span>');
const now = new Date(2026, 9, 18, 14, 37, 5);
const time = toHtml(toGlyphText(formatClock('{HH}:{mm}', now)));
const date = toHtml(toGlyphText(formatClock('{ddd} {DD} {MMM} · WW{WW}', now)));
const timeSec = toHtml(toGlyphText(formatClock('{HH}:{mm}:{ss}', now)));

const bar = (t: string, dt: string): string => `<div class="statusbar">
  <div class="item remote"><span class="label">&gt;&lt; SSH: dv-farm-07</span></div>
  <div class="spacer"></div>
  <div class="item"><span class="label">Ln 42, Col 7</span></div>
  <div class="item"><span class="label">Spaces: 2</span></div>
  <div class="item"><span class="label">SystemVerilog</span></div>
  <div class="item"><span class="label" style="color:${v.accent}">${t}</span></div>
  <div class="item"><span class="label" style="color:${v.ink.muted}">${dt}</span></div>
</div>`;

const html = `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face{font-family:posedge-clock;src:url("../fonts/posedge-clock.woff") format("woff");font-display:block}
body{margin:0;background:${v.surface.editor};padding:30px}
.statusbar{display:flex;height:22px;background:${v.surface.chrome};border-top:1px solid ${v.surface.border};
  font:12px system-ui,"Segoe UI",sans-serif;color:${v.ink.muted};margin-bottom:16px;width:860px}
.spacer{flex:1}.item{display:flex}
.label{display:flex;height:100%;margin:0 3px;padding:0 5px;white-space:pre;align-items:center}
.remote .label{background:${v.accent};color:#141414;margin:0}
.codicon{font:normal normal normal 16px/1 posedge-clock;display:inline-block;text-align:center;-webkit-font-smoothing:antialiased}
${css}
</style></head><body>${bar(time, date)}${bar(timeSec, date)}</body></html>`;
mkdirSync(join(ROOT, 'preview'), { recursive: true });
writeFileSync(join(ROOT, 'preview', 'clock.html'), html);
console.log('wrote preview/clock.html');
