// Generates the color theme JSON files from the design system.
//
//   themes/posedge-graphite-color-theme.json
//   themes/posedge-midnight-color-theme.json
//   themes/posedge-daylight-color-theme.json
//   themes/posedge-high-contrast-color-theme.json

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { VARIANTS, VARIANT_IDS, type Variant } from '../design/palette.mts';
import { ROLE_NAMES, rolesFor, type Role } from '../design/roles.mts';
import { THEME_SELECTORS } from '../design/scopes.mts';
import { semanticTokenColors } from '../design/semantic.mts';
import { workbenchColors } from '../design/workbench.mts';

const ROOT = join(import.meta.dirname, '..');

const ROLE_TITLES: Partial<Record<Role, string>> = {
  keyword: 'Keywords: structure and control (class/endclass, begin/end, if/else, …)',
  modifier: 'Modifiers (virtual, local, static, automatic, input, …)',
  macro: 'Macros and compiler directives — one color for every backtick token',
  type: 'Data types',
  function: 'Functions and tasks',
  time: 'Time and concurrency (@, #, ##, posedge, fork/join, always*, clocks, resets)',
  verification: 'Verification (assertions, coverage, constraints, randomization)',
  severityError: 'uvm_error / $error / UVM_ERROR',
  severityFatal: 'uvm_fatal / $fatal / UVM_FATAL',
  severityWarning: 'uvm_warning / $warning / UVM_WARNING',
  severityInfo: 'uvm_info / $info / UVM_INFO',
};

/** Throws if one selector is claimed by two roles (that would make colors depend on file order). */
function assertUniqueSelectors(): void {
  const owner = new Map<string, Role>();
  for (const role of ROLE_NAMES) {
    for (const sel of THEME_SELECTORS[role]) {
      if (sel.includes(',')) throw new Error(`Selector "${sel}" (role ${role}) contains a comma; split it.`);
      const prev = owner.get(sel);
      if (prev) throw new Error(`Selector "${sel}" is used by both "${prev}" and "${role}".`);
      owner.set(sel, role);
    }
  }
}

export function buildTheme(v: Variant): Record<string, unknown> {
  const roles = rolesFor(v);
  const tokenColors = ROLE_NAMES.filter((role) => THEME_SELECTORS[role].length).map((role) => ({
    name: ROLE_TITLES[role] ?? role,
    scope: THEME_SELECTORS[role],
    settings: { foreground: roles[role].fg, fontStyle: roles[role].fontStyle },
  }));
  return {
    $schema: 'vscode://schemas/color-theme',
    name: v.name,
    type: v.type,
    semanticHighlighting: true,
    colors: workbenchColors(v),
    tokenColors,
    semanticTokenColors: semanticTokenColors(roles),
  };
}

if (import.meta.main) {
  assertUniqueSelectors();
  mkdirSync(join(ROOT, 'themes'), { recursive: true });
  for (const id of VARIANT_IDS) {
    const v = VARIANTS[id];
    const file = `themes/${v.file}-color-theme.json`;
    writeFileSync(join(ROOT, file), `${JSON.stringify(buildTheme(v), null, 2)}\n`);
    console.log(`wrote ${file}`);
  }
}
