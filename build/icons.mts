// Generates the file icon themes from design/icons/*.
//
//   icons/svg/files/*.svg                 file icons
//   icons/svg/folders/*.svg               closed folders (+ *-hc.svg for High Contrast)
//   icons/svg/folders-open/open.svg       the open folder, animated clock trace
//   icons/svg/folders-open-still/open.svg the open folder, no motion
//   icons/svg/roles/*.svg                 UVM role pictograms (assigned at run time, see src/explorer)
//   icons/svg/light/...                   the same sets for light color themes
//   icons/posedge-icon-theme.json         "Posedge Icons"
//   icons/posedge-still-icon-theme.json   "Posedge Icons (Still)"

import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FILES, FOLDERS, ICON_COLORS, ICON_COLORS_LIGHT, type FolderKind, type IconColor } from '../design/icons/registry.mts';
import { ROLE_ICONS } from '../design/icons/roles.mts';
import { DARK_TONE, LIGHT_TONE, fileWithEmblem, fileWithLabel, folderClosed, folderOpen, plainFile, quiet, roleIcon, type Tone } from '../design/icons/shapes.mts';
import { UVM_ROLES, type RoleId } from '../design/uvm.mts';

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'icons');

// Special folders that are not name-based.
const GENERIC: FolderKind = { id: 'default', color: 'neutral', emblem: 'dots', names: [] };
const ROOT_FOLDER: FolderKind = { id: 'root', color: 'accent', emblem: 'board', names: [] };

type IconTheme = Record<string, unknown>;

const ROLE_IDS = Object.keys(ROLE_ICONS) as RoleId[];

function assertNoDuplicates(): void {
  for (const role of UVM_ROLES) if (!ROLE_ICONS[role.id]) throw new Error(`Role "${role.id}" has no pictogram`);
  const seen = new Map<string, string>();
  const claim = (key: string, owner: string): void => {
    if (seen.has(key)) throw new Error(`"${key}" is mapped by both ${seen.get(key)} and ${owner}`);
    seen.set(key, owner);
  };
  for (const f of FOLDERS) for (const n of f.names) claim(`folder:${n.toLowerCase()}`, `folder ${f.id}`);
  for (const f of FILES) {
    for (const e of f.extensions ?? []) claim(`ext:${e.toLowerCase()}`, `file ${f.id}`);
    for (const n of f.fileNames ?? []) claim(`name:${n.toLowerCase()}`, `file ${f.id}`);
    for (const l of f.languageIds ?? []) claim(`lang:${l}`, `file ${f.id}`);
  }
}

function writeSet(dir: string, colors: Record<IconColor, string>, tone: Tone): void {
  for (const sub of ['files', 'roles', 'folders', 'folders-open', 'folders-open-still']) mkdirSync(join(OUT, dir, sub), { recursive: true });
  const write = (rel: string, content: string): void => writeFileSync(join(OUT, dir, rel), content);

  for (const id of ROLE_IDS) write(`roles/${id}.svg`, roleIcon(id, colors, tone));
  write('files/default.svg', plainFile(quiet(colors.neutral, tone)));
  for (const f of FILES) {
    const color = quiet(colors[f.color], tone);
    write(`files/${f.id}.svg`, f.label ? fileWithLabel(color, f.label, tone) : fileWithEmblem(color, f.emblem ?? 'dots'));
  }
  for (const f of [GENERIC, ROOT_FOLDER, ...FOLDERS]) {
    const generated = f.color === 'generated';
    write(`folders/${f.id}.svg`, folderClosed(f.emblem, tone, { generated }));
    if (tone === DARK_TONE) write(`folders/${f.id}-hc.svg`, folderClosed(f.emblem, tone, { generated, hc: true }));
  }
  write('folders-open/open.svg', folderOpen(true, tone));
  write('folders-open-still/open.svg', folderOpen(false, tone));
}

export function writeSvgs(): void {
  rmSync(join(OUT, 'svg'), { recursive: true, force: true });
  writeSet('svg', ICON_COLORS, DARK_TONE);
  writeSet('svg/light', ICON_COLORS_LIGHT, LIGHT_TONE);
}

/** The associations of one tone. `base` is the SVG directory, `suffix` keeps the definition ids apart. */
function associations(def: (id: string, path: string) => string, base: string, suffix: string, openDir: string): IconTheme {
  for (const id of ROLE_IDS) def(`_role_${id}${suffix}`, `${base}roles/${id}.svg`);
  // Every open folder looks the same: lit.
  const open = def(`_folder_open${suffix}`, `${base}${openDir}/open.svg`);
  const folderNames: Record<string, string> = {};
  const folderNamesExpanded: Record<string, string> = {};
  for (const f of FOLDERS) {
    const closed = def(`_folder_${f.id}${suffix}`, `${base}folders/${f.id}.svg`);
    for (const n of f.names) {
      folderNames[n.toLowerCase()] = closed;
      folderNamesExpanded[n.toLowerCase()] = open;
    }
  }

  const fileExtensions: Record<string, string> = {};
  const fileNames: Record<string, string> = {};
  const languageIds: Record<string, string> = {};
  for (const f of FILES) {
    const id = def(`_file_${f.id}${suffix}`, `${base}files/${f.id}.svg`);
    for (const e of f.extensions ?? []) fileExtensions[e.toLowerCase()] = id;
    for (const n of f.fileNames ?? []) fileNames[n.toLowerCase()] = id;
    for (const l of f.languageIds ?? []) languageIds[l] = id;
  }

  return {
    file: def(`_file${suffix}`, `${base}files/default.svg`),
    folder: def(`_folder${suffix}`, `${base}folders/default.svg`),
    folderExpanded: open,
    rootFolder: def(`_root${suffix}`, `${base}folders/root.svg`),
    rootFolderExpanded: open,
    folderNames,
    folderNamesExpanded,
    fileExtensions,
    fileNames,
    languageIds,
  };
}

export function buildIconTheme(animated: boolean): IconTheme {
  const openDir = animated ? 'folders-open' : 'folders-open-still';
  const defs: Record<string, { iconPath: string }> = {};
  const def = (id: string, path: string): string => {
    defs[id] = { iconPath: `./svg/${path}` };
    return id;
  };

  const dark = associations(def, '', '', openDir);
  const light = associations(def, 'light/', '_light', openDir);

  def('_folder_hc', 'folders/default-hc.svg');
  def('_root_hc', 'folders/root-hc.svg');
  const hcFolderNames: Record<string, string> = {};
  for (const f of FOLDERS) {
    const hc = def(`_folder_${f.id}_hc`, `folders/${f.id}-hc.svg`);
    for (const n of f.names) hcFolderNames[n.toLowerCase()] = hc;
  }

  return {
    $schema: 'vscode://schemas/icon-theme',
    comment: 'GENERATED by build/icons.mts from design/icons/*. Do not edit by hand.',
    iconDefinitions: defs,
    ...dark,
    hidesExplorerArrows: true,
    light,
    highContrast: {
      folder: '_folder_hc',
      rootFolder: '_root_hc',
      folderNames: hcFolderNames,
    },
  };
}

if (import.meta.main) {
  assertNoDuplicates();
  writeSvgs();
  writeFileSync(join(OUT, 'posedge-icon-theme.json'), `${JSON.stringify(buildIconTheme(true), null, 2)}\n`);
  writeFileSync(join(OUT, 'posedge-still-icon-theme.json'), `${JSON.stringify(buildIconTheme(false), null, 2)}\n`);
  const count = (FILES.length + ROLE_IDS.length + 1) * 2 + (FOLDERS.length + 2) * 3 + 4;
  console.log(`wrote ${count} SVGs and 2 icon themes (${FOLDERS.length} folder kinds, ${FILES.length} file kinds, ${ROLE_IDS.length} roles, dark and light)`);
}
