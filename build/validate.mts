// Validates the design system and the generated artifacts.
//
//   node build/validate.mts            palette + generated themes + icon theme
//
// Checks:
//   1. WCAG contrast of every role against each variant's editor background
//   2. Perceptual distance between roles that appear side by side
//   3. The same pairs after deuteranopia / protanopia simulation
//   4. Every workbench color id in the generated themes exists in the installed VS Code
//   5. Every icon association points at a defined icon whose SVG file exists
//   6. Workbench text stays readable on its own surface; tokens stay readable when selected
//   7. Every variant is contributed in package.json with the right base theme

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { composite, contrast, deltaEOK, simulateCvd } from './lib/color.mts';
import { findVsCodeColorIds } from './lib/vscode.mts';
import { ICON_COLORS_LIGHT } from '../design/icons/registry.mts';
import { VARIANTS, VARIANT_IDS } from '../design/palette.mts';
import { CVD_PAIRS, DISTINCT_PAIRS, ROLE_NAMES, minimumContrast, rolesFor, type Role } from '../design/roles.mts';
import { UI_CONTRAST_PAIRS, workbenchColors } from '../design/workbench.mts';

const ROOT = join(import.meta.dirname, '..');
const failures: string[] = [];
const warnings: string[] = [];
const fail = (msg: string): void => {
  failures.push(msg);
};

// ---------------------------------------------------------------- 1-3 palette
for (const id of VARIANT_IDS) {
  const v = VARIANTS[id];
  const roles = rolesFor(v);
  const bg = v.surface.editor;
  let worst = { role: '', ratio: Infinity };
  for (const role of ROLE_NAMES) {
    const ratio = contrast(roles[role].fg, bg);
    const min = minimumContrast(role, v);
    if (ratio < min) fail(`[${v.name}] ${role} ${roles[role].fg} has contrast ${ratio.toFixed(2)}:1 < ${min}:1`);
    if (ratio < worst.ratio) worst = { role, ratio };
  }
  for (const [a, b, min] of DISTINCT_PAIRS) {
    const d = deltaEOK(roles[a].fg, roles[b].fg);
    const sameStyle = roles[a].fontStyle === roles[b].fontStyle;
    if (d < min && sameStyle) fail(`[${v.name}] ${a} vs ${b}: ΔE ${d.toFixed(1)} < ${min} and same font style`);
    else if (d < min) warnings.push(`[${v.name}] ${a} vs ${b}: ΔE ${d.toFixed(1)} < ${min} (separated by font style)`);
  }
  for (const kind of ['deutan', 'protan'] as const) {
    for (const [a, b, min] of CVD_PAIRS) {
      const d = deltaEOK(simulateCvd(roles[a].fg, kind), simulateCvd(roles[b].fg, kind));
      if (d < min) fail(`[${v.name}] ${kind}: ${a} vs ${b}: ΔE ${d.toFixed(1)} < ${min}`);
    }
  }
  console.log(`palette  ${v.name.padEnd(24)} lowest contrast: ${worst.role} ${worst.ratio.toFixed(2)}:1`);
}

// ---------------------------------------------------------------- 6 workbench readability
const SELECTED_ROLES: Role[] = ['fg', 'keyword', 'macro', 'type', 'function', 'string', 'number', 'time', 'verification', 'severityError', 'severityWarning'];
for (const id of VARIANT_IDS) {
  const v = VARIANTS[id];
  const ui = workbenchColors(v);
  // Daylight was designed against these checks; the dark variants predate them, so they only warn.
  const strict = v.type === 'light' ? fail : (msg: string): void => void warnings.push(msg);
  let worst = { pair: '', ratio: Infinity };
  for (const [fg, bg, min, under] of UI_CONTRAST_PAIRS) {
    if (!ui[fg] || !ui[bg]) {
      fail(`[${v.name}] contrast pair ${fg} on ${bg}: color not defined`);
      continue;
    }
    const surface = composite(ui[bg], ui[under ?? 'editor.background']);
    const ratio = contrast(ui[fg], surface);
    if (ratio < min) strict(`[${v.name}] ${fg} ${ui[fg]} on ${bg} ${surface} has contrast ${ratio.toFixed(2)}:1 < ${min}:1`);
    if (ratio / min < worst.ratio) worst = { pair: `${fg} on ${bg}`, ratio: ratio / min };
  }
  const roles = rolesFor(v);
  for (const role of SELECTED_ROLES) {
    const ratio = contrast(roles[role].fg, ui['editor.selectionBackground']);
    if (ratio < 3) strict(`[${v.name}] ${role} ${roles[role].fg} over the selection has contrast ${ratio.toFixed(2)}:1 < 3:1`);
  }
  console.log(`ui       ${v.name.padEnd(24)} tightest pair: ${worst.pair} (${worst.ratio.toFixed(2)}× its minimum)`);
}
const verbosity: Role[] = ['verbosityNone', 'verbosityLow', 'verbosityMedium', 'verbosityHigh', 'verbosityFull', 'verbosityDebug'];
for (const id of VARIANT_IDS) {
  const roles = rolesFor(VARIANTS[id]);
  const ratios = verbosity.map((r) => contrast(roles[r].fg, VARIANTS[id].surface.editor));
  if (ratios.some((r, i) => i > 0 && r >= ratios[i - 1])) fail(`[${VARIANTS[id].name}] verbosity ramp is not monotonic: ${ratios.map((r) => r.toFixed(2)).join(' ')}`);
}
for (const [name, color] of Object.entries(ICON_COLORS_LIGHT)) {
  const min = name === 'generated' ? 1.8 : 3; // generated folders are dimmed on purpose
  const ratio = contrast(color, VARIANTS.daylight.surface.sidebar);
  if (ratio < min) fail(`[Posedge Daylight] icon color ${name} ${color} has contrast ${ratio.toFixed(2)}:1 < ${min}:1 on the sidebar`);
}

// ---------------------------------------------------------------- 4 theme color ids
const known = findVsCodeColorIds();
// Our own contributed colors (package.json contributes.colors) are valid too.
const manifest = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as {
  contributes: { colors?: Array<{ id: string }>; themes: Array<{ label: string; uiTheme: string; path: string }> };
};
for (const c of manifest.contributes.colors ?? []) known?.add(c.id);
for (const id of VARIANT_IDS) {
  const contributed = manifest.contributes.themes.find((t) => t.label === VARIANTS[id].name);
  if (!contributed) fail(`[${VARIANTS[id].name}] is not contributed in package.json`);
  else if (contributed.uiTheme !== VARIANTS[id].uiTheme) fail(`[${VARIANTS[id].name}] uiTheme is ${contributed.uiTheme}, expected ${VARIANTS[id].uiTheme}`);
  const file = join(ROOT, 'themes', `${VARIANTS[id].file}-color-theme.json`);
  if (!existsSync(file)) {
    warnings.push(`theme not generated yet: ${file}`);
    continue;
  }
  const theme = JSON.parse(readFileSync(file, 'utf8')) as { colors: Record<string, string> };
  const ids = Object.keys(theme.colors);
  if (known) {
    const unknown = ids.filter((c) => !known.has(c));
    for (const c of unknown) fail(`[${VARIANTS[id].name}] unknown workbench color id "${c}"`);
    console.log(`colors   ${VARIANTS[id].name.padEnd(24)} ${ids.length} ids, ${unknown.length} unknown`);
  }
  for (const [k, val] of Object.entries(theme.colors)) {
    if (!/^#[0-9A-Fa-f]{6}([0-9A-Fa-f]{2})?$/.test(val)) fail(`[${VARIANTS[id].name}] ${k} has invalid value "${val}"`);
  }
}
if (!known) warnings.push('VS Code installation not found; skipped the workbench color id check (set VSCODE_APP_DIR to enable).');

// ---------------------------------------------------------------- 5 icon themes
for (const name of ['posedge-icon-theme.json', 'posedge-still-icon-theme.json']) {
  const file = join(ROOT, 'icons', name);
  if (!existsSync(file)) {
    warnings.push(`icon theme not generated yet: ${name}`);
    continue;
  }
  const t = JSON.parse(readFileSync(file, 'utf8')) as Record<string, unknown>;
  const defs = t.iconDefinitions as Record<string, { iconPath: string }>;
  for (const [key, def] of Object.entries(defs)) {
    if (!existsSync(join(ROOT, 'icons', def.iconPath))) fail(`${name}: ${key} -> missing ${def.iconPath}`);
  }
  const check = (where: string, map: unknown): void => {
    if (!map || typeof map !== 'object') return;
    for (const [k, ref] of Object.entries(map as Record<string, string>)) {
      if (!defs[ref]) fail(`${name}: ${where}["${k}"] -> undefined icon "${ref}"`);
    }
  };
  for (const section of [t, t.light as Record<string, unknown> | undefined, t.highContrast as Record<string, unknown> | undefined]) {
    if (!section) continue;
    for (const key of ['file', 'folder', 'folderExpanded', 'rootFolder', 'rootFolderExpanded'] as const) {
      const ref = section[key];
      if (typeof ref === 'string' && !defs[ref]) fail(`${name}: ${key} -> undefined icon "${ref}"`);
    }
    for (const key of ['folderNames', 'folderNamesExpanded', 'fileExtensions', 'fileNames', 'languageIds'] as const) {
      check(key, section[key]);
    }
  }
  console.log(`icons    ${name.padEnd(32)} ${Object.keys(defs).length} definitions`);
}

for (const w of warnings) console.log(`warning  ${w}`);
if (failures.length) {
  for (const f of failures) console.error(`FAIL     ${f}`);
  console.error(`\n${failures.length} validation failure(s).`);
  process.exit(1);
}
console.log('\nAll validation checks passed.');
