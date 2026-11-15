// Edits the generated icon theme JSON: file name -> class icon. VS Code icon themes map by name and
// cannot look inside a file, so the extension records what it found here and VS Code reloads the
// theme (`_watch` in package.json). Pure, so it is unit-tested without VS Code.

import type { RoleId } from '../../design/uvm.mts';

/** File name (lower case) -> role. */
export type ClassIcons = Record<string, RoleId>;

export interface IconTheme {
  fileNames: Record<string, string>;
  light: { fileNames: Record<string, string> };
  /** What this extension added, so it can be undone. VS Code ignores the field. */
  posedgeClassIcons?: ClassIcons;
  [key: string]: unknown;
}

/** Older entries are dropped past this size; they only matter for projects you are not in. */
const MAX_ENTRIES = 20000;

/**
 * Icon themes are shared by every window, so entries from other projects stay. `scanned` is every
 * file name this window looked at: those entries are replaced by `found`.
 */
export function mergeClassIcons(previous: ClassIcons, scanned: Iterable<string>, found: ClassIcons): ClassIcons {
  const merged = { ...previous };
  for (const name of scanned) delete merged[name];
  Object.assign(merged, found);
  return Object.keys(merged).length > MAX_ENTRIES ? { ...found } : merged;
}

export const sameIcons = (a: ClassIcons, b: ClassIcons): boolean => {
  const keys = Object.keys(a);
  return keys.length === Object.keys(b).length && keys.every((k) => a[k] === b[k]);
};

/** Applies `icons` to the theme and returns whether anything changed. Fixed associations always win. */
export function applyClassIcons(theme: IconTheme, icons: ClassIcons): boolean {
  const previous = theme.posedgeClassIcons ?? {};
  // A name with a fixed icon is never recorded, so it must not count as a change: every write reloads
  // the icon theme, and every icon in the window with it.
  const wanted = Object.entries(icons).filter(([name]) => name in previous || !theme.fileNames[name]);
  if (sameIcons(previous, Object.fromEntries(wanted))) return false;
  for (const name of Object.keys(previous)) {
    delete theme.fileNames[name];
    delete theme.light.fileNames[name];
  }
  const applied: ClassIcons = {};
  for (const [name, role] of wanted) {
    theme.fileNames[name] = `_role_${role}`;
    theme.light.fileNames[name] = `_role_${role}_light`;
    applied[name] = role;
  }
  theme.posedgeClassIcons = applied;
  return true;
}
