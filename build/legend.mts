// Generates the color-language legends (media/walkthrough/legend.svg and legend-daylight.svg) from
// design/roles.mts, so the walkthrough and README always show the real colors.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { VARIANTS, type Variant } from '../design/palette.mts';
import { LEGEND, rolesFor } from '../design/roles.mts';

const ROOT = join(import.meta.dirname, '..');
const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export function legendSvg(v: Variant): string {
  const roles = rolesFor(v);
  const rowH = 30;
  const width = 1140;
  const height = 24 + LEGEND.length * rowH + 16;
  const rows = LEGEND.map((l, i) => {
    const st = roles[l.role];
    const y = 24 + i * rowH + 18;
    const weight = st.fontStyle.includes('bold') ? 700 : 400;
    const italic = st.fontStyle.includes('italic') ? 'italic' : 'normal';
    const underline = st.fontStyle.includes('underline') ? 'underline' : 'none';
    return (
      `<rect x="24" y="${y - 13}" width="14" height="14" rx="3" fill="${st.fg}"/>` +
      `<text x="50" y="${y}" fill="${st.fg}" font-weight="${weight}" font-style="${italic}" text-decoration="${underline}">${esc(l.label)}</text>` +
      `<text x="290" y="${y}" fill="${v.ink.muted}">${esc(l.examples)}</text>`
    );
  }).join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" ` +
    `font-family="'JetBrains Mono NL','JetBrains Mono',Consolas,monospace" font-size="14">` +
    `<rect width="${width}" height="${height}" rx="10" fill="${v.surface.editor}"/>${rows}</svg>\n`
  );
}

if (import.meta.main) {
  mkdirSync(join(ROOT, 'media', 'walkthrough'), { recursive: true });
  writeFileSync(join(ROOT, 'media', 'walkthrough', 'legend.svg'), legendSvg(VARIANTS.graphite));
  writeFileSync(join(ROOT, 'media', 'walkthrough', 'legend-daylight.svg'), legendSvg(VARIANTS.daylight));
  console.log('wrote media/walkthrough/legend.svg and legend-daylight.svg');
}
