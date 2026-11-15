// Icon galleries and a mock Explorer, for reviewing the icon themes (and for README screenshots).
//
//   node build/gallery.mts   -> preview/icons.html (dark set), preview/icons-daylight.html (light set)

import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { FILES, FOLDERS } from '../design/icons/registry.mts';
import { VARIANTS, type Variant } from '../design/palette.mts';
import { CLASS_ICON_EXTENSIONS, UVM_ROLES, type UvmRole } from '../design/uvm.mts';
import { classTable, roleForFile, scanSource, type SvFacts } from '../src/explorer/svClasses.mts';
import { roleForFileName } from '../src/explorer/uvmRoles.mts';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'preview');

// What the extension finds at run time, so the mock Explorer shows the same class icons.
function scanTree(dir: string, found = new Map<string, SvFacts>()): Map<string, SvFacts> {
  for (const n of readdirSync(dir)) {
    const p = join(dir, n);
    if (statSync(p).isDirectory()) scanTree(p, found);
    else if (CLASS_ICON_EXTENSIONS.includes(n.split('.').pop() ?? '')) found.set(n, scanSource(readFileSync(p, 'utf8')));
  }
  return found;
}

const SAMPLES = existsSync(join(ROOT, 'samples')) ? scanTree(join(ROOT, 'samples')) : new Map<string, SvFacts>();
const TABLE = classTable(SAMPLES.values());

function roleFor(name: string): UvmRole | undefined {
  const facts = SAMPLES.get(name);
  return facts ? roleForFile(name, facts, TABLE) : roleForFileName(name);
}

function folderIcon(svg: string, name: string, open: boolean, still = false): string {
  if (open) return `${svg}/${still ? 'folders-open-still' : 'folders-open'}/open.svg`;
  const kind = FOLDERS.find((f) => f.names.includes(name.toLowerCase()));
  return `${svg}/folders/${kind ? kind.id : 'default'}.svg`;
}

function fileIcon(svg: string, name: string): string {
  const lower = name.toLowerCase();
  const role = SAMPLES.has(name) ? roleFor(name) : undefined;
  if (role) return `${svg}/roles/${role.id}.svg`;
  const byName = FILES.find((f) => f.fileNames?.includes(lower));
  if (byName) return `${svg}/files/${byName.id}.svg`;
  const parts = lower.split('.');
  for (let i = 1; i < parts.length; i++) {
    const ext = parts.slice(i).join('.');
    const byExt = FILES.find((f) => f.extensions?.includes(ext));
    if (byExt) return `${svg}/files/${byExt.id}.svg`;
  }
  return `${svg}/files/default.svg`;
}

function badgeFor(name: string): string {
  const role = roleFor(name);
  return role ? `<span class="badge" title="${role.label}">${role.badge}</span>` : '';
}

/** Mock Explorer over samples/, every folder expanded except the ones listed as collapsed. */
function explorer(svg: string, dir: string, depth: number, collapsed: Set<string>): string {
  const entries = readdirSync(dir)
    .map((n) => ({ n, d: statSync(join(dir, n)).isDirectory() }))
    .sort((a, b) => Number(b.d) - Number(a.d) || a.n.localeCompare(b.n));
  let html = '';
  for (const { n, d } of entries) {
    const pad = 8 + depth * 14;
    if (d) {
      const open = !collapsed.has(n);
      html += `<div class="row" style="padding-left:${pad}px"><img src="${folderIcon(svg, n, open)}"><span>${n}</span></div>`;
      if (open) html += explorer(svg, join(dir, n), depth + 1, collapsed);
    } else {
      html += `<div class="row" style="padding-left:${pad}px"><img src="${fileIcon(svg, n)}"><span>${n}</span>${badgeFor(n)}</div>`;
    }
  }
  return html;
}

const grid = (items: string[]): string => `<div class="grid">${items.join('')}</div>`;

function gallery(v: Variant, svg: string): string {
  const samples = join(ROOT, 'samples');
  const tree = existsSync(samples) ? explorer(svg, samples, 1, new Set(['docs', 'scripts', 'include'])) : '';
  const folders = grid(
    FOLDERS.map(
      (f) =>
        `<div class="cell"><div class="icons"><img class="big" src="${svg}/folders/${f.id}.svg"><img src="${svg}/folders/${f.id}.svg"></div><div class="name">${f.id}</div><div class="names">${f.names.slice(0, 5).join(', ')}</div></div>`,
    ),
  );
  const roles = grid(
    UVM_ROLES.map(
      (r) =>
        `<div class="cell"><div class="icons"><img class="big" src="${svg}/roles/${r.id}.svg"><img src="${svg}/roles/${r.id}.svg"></div><div class="name">${r.id}</div><div class="names">${r.label}</div></div>`,
    ),
  );
  const files = grid(
    FILES.map(
      (f) =>
        `<div class="cell"><div class="icons"><img class="big" src="${svg}/files/${f.id}.svg"><img src="${svg}/files/${f.id}.svg"></div><div class="name">${f.id}</div><div class="names">${[...(f.extensions ?? []).map((e) => `.${e}`), ...(f.fileNames ?? [])].slice(0, 5).join(' ')}</div></div>`,
    ),
  );
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Posedge icons</title><style>
body{margin:0;background:${v.surface.chrome};color:${v.ink.fg};font:13px/1.4 system-ui,"Segoe UI",sans-serif}
h2{font-size:15px;font-weight:600;margin:22px 24px 10px}
.layout{display:flex;gap:24px;padding:0 24px}
.explorer{width:320px;background:${v.surface.sidebar};border:1px solid ${v.surface.border};border-radius:8px;padding:6px 0}
.row{display:flex;align-items:center;gap:6px;height:22px;color:${v.ink.muted}}
.row img{width:16px;height:auto}
.badge{margin-left:auto;margin-right:12px;font:11px "JetBrains Mono NL","JetBrains Mono",monospace;color:${v.ink.subtle}}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px;padding:0 24px 24px}
.cell{background:${v.surface.sidebar};border:1px solid ${v.surface.border};border-radius:8px;padding:10px}
.icons{display:flex;gap:8px;align-items:center}.icons.small{margin-top:6px}.icons img{width:16px;height:auto}
.icons img.big{width:32px;height:auto}
.name{margin-top:6px;color:${v.ink.bright};font-weight:600}.names{color:${v.ink.subtle};font-size:11px}
</style></head><body>
<h2>Explorer: closed folders are off, open folders are lit</h2><div class="layout"><div class="explorer">${tree}</div></div>
<h2>Class icons: chosen from the class a file declares</h2>${roles}
<h2>The open folder: animated and still</h2><div class="grid"><div class="cell"><div class="icons"><img class="big" src="${svg}/folders-open/open.svg"><img src="${svg}/folders-open/open.svg"><img class="big" src="${svg}/folders-open-still/open.svg"></div></div></div>
<h2>Closed folders, by kind</h2>${folders}
<h2>File kinds</h2>${files}
</body></html>`;
}

if (import.meta.main) {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(join(OUT, 'icons.html'), gallery(VARIANTS.graphite, '../icons/svg'));
  writeFileSync(join(OUT, 'icons-daylight.html'), gallery(VARIANTS.daylight, '../icons/svg/light'));
  console.log(`wrote ${relative(ROOT, join(OUT, 'icons.html'))} and icons-daylight.html`);
}
