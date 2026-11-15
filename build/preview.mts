// Renders the sample files through the real TextMate engine with each Posedge theme, producing
// static HTML pages that show exactly the colors VS Code paints. Used for design review and for the
// README screenshots (see build/screenshots.mts).
//
//   node build/preview.mts            -> preview/index.html + preview/<variant>.html

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { ROOT, scopeForFile, tokenize, type ThemeJson } from '../test/lib/textmate.mts';
import { VARIANTS, VARIANT_IDS } from '../design/palette.mts';
import { LEGEND, rolesFor } from '../design/roles.mts';

const OUT = join(ROOT, 'preview');

export const SHOWCASE = [
  'samples/verif/agents/apb/apb_driver.sv',
  'samples/verif/agents/apb/apb_seq_item.sv',
  'samples/verif/env/apb_coverage.sv',
  'samples/verif/sva/apb_sva.sv',
  'samples/rtl/apb_slave.sv',
  'samples/verif/include/apb_defines.svh',
  'samples/tb/tb_top.sv',
  'samples/sim/sim.log',
  'samples/sim/files.f',
];

const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

export async function renderCode(file: string, theme: ThemeJson, opts: { from?: number; to?: number } = {}): Promise<string> {
  const text = readFileSync(join(ROOT, file), 'utf8').replace(/\s+$/, '');
  const t = await tokenize(text, scopeForFile(file), { theme });
  const from = opts.from ?? 0;
  const to = Math.min(opts.to ?? t.lines.length, t.lines.length);
  const rows: string[] = [];
  for (let i = from; i < to; i++) {
    const line = t.lines[i];
    const styles = t.styles[i];
    let html = '';
    let k = 0;
    while (k < line.length) {
      const st = styles[k];
      let j = k + 1;
      while (j < line.length && styles[j].fg === st.fg && styles[j].fontStyle === st.fontStyle) j++;
      const css = [`color:${st.fg}`];
      if (st.fontStyle & 1) css.push('font-style:italic');
      if (st.fontStyle & 2) css.push('font-weight:700');
      if (st.fontStyle & 4) css.push('text-decoration:underline');
      if (st.fontStyle & 8) css.push('text-decoration:line-through');
      html += `<span style="${css.join(';')}">${esc(line.slice(k, j))}</span>`;
      k = j;
    }
    rows.push(`<div class="ln"><span class="no">${i + 1}</span><span class="tx">${html || ' '}</span></div>`);
  }
  return rows.join(''); // no newlines: the container is white-space:pre
}

function page(variantId: keyof typeof VARIANTS, body: string): string {
  const v = VARIANTS[variantId];
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${v.name} preview</title>
<style>
  body{margin:0;background:${v.surface.chrome};color:${v.ink.fg};font:14px/1.5 system-ui,-apple-system,"Segoe UI",sans-serif}
  header{padding:18px 24px;border-bottom:1px solid ${v.surface.border}}
  header h1{margin:0;font-size:18px;font-weight:600}
  header a{color:${v.accent};margin-right:16px}
  .legend{display:flex;flex-wrap:wrap;gap:6px;padding:14px 24px}
  .chip{background:${v.surface.editor};border:1px solid ${v.surface.border};border-radius:6px;padding:3px 9px;font:12px "JetBrains Mono NL","JetBrains Mono",monospace}
  .file{margin:18px 24px;border:1px solid ${v.surface.border};border-radius:8px;overflow:hidden}
  .tab{background:${v.surface.sidebar};color:${v.ink.bright};font:12px "JetBrains Mono NL","JetBrains Mono",monospace;padding:7px 14px;border-bottom:1px solid ${v.surface.border};border-top:2px solid ${v.accent}}
  .code{background:${v.surface.editor};font:13px/1.55 "JetBrains Mono NL","JetBrains Mono",ui-monospace,monospace;padding:10px 0;overflow-x:auto;white-space:pre}
  .ln{display:flex}.no{display:inline-block;min-width:44px;padding-right:16px;text-align:right;color:${v.ink.faint};user-select:none}
</style></head><body>${body}</body></html>`;
}

if (import.meta.main) {
  mkdirSync(OUT, { recursive: true });
  const links = VARIANT_IDS.map((id) => `<a href="${VARIANTS[id].file}.html">${VARIANTS[id].name}</a>`).join('');
  for (const id of VARIANT_IDS) {
    const v = VARIANTS[id];
    const theme: ThemeJson = JSON.parse(readFileSync(join(ROOT, 'themes', `${v.file}-color-theme.json`), 'utf8'));
    const roles = rolesFor(v);
    const legend = LEGEND.map(
      (l) =>
        `<span class="chip" style="color:${roles[l.role].fg};${roles[l.role].fontStyle.includes('bold') ? 'font-weight:700;' : ''}${roles[l.role].fontStyle.includes('italic') ? 'font-style:italic;' : ''}${roles[l.role].fontStyle.includes('underline') ? 'text-decoration:underline;' : ''}" title="${esc(l.examples)}">${esc(l.label)}</span>`,
    ).join('');
    const files: string[] = [];
    for (const f of SHOWCASE) {
      files.push(`<div class="file"><div class="tab">${esc(relative('samples', f))}</div><div class="code">${await renderCode(f, theme)}</div></div>`);
    }
    writeFileSync(join(OUT, `${v.file}.html`), page(id, `<header><h1>${v.name}</h1><nav>${links}</nav></header><div class="legend">${legend}</div>${files.join('')}`));
    console.log(`wrote preview/${v.file}.html`);
  }
  writeFileSync(join(OUT, 'index.html'), page('graphite', `<header><h1>Posedge previews</h1><nav>${links}</nav></header>`));
}
