// Installs the packaged VSIX into this machine's VS Code and carries the class icon map over.
//
// Each version gets a new folder with an empty map, and VS Code draws the Explorer before any extension
// can run, so the first launch of a new version would show generic icons for a moment. Copying the map
// here, before VS Code opens, gives that launch the right icons on its first frame.
//
//   npm run package && npm run install:local

import { execSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { applyClassIcons, type ClassIcons, type IconTheme } from '../src/explorer/iconMap.mts';

const ROOT = join(import.meta.dirname, '..');
const { name, publisher, version } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const vsix = join(ROOT, 'dist-vsix', `${name}-${version}.vsix`);
if (!existsSync(vsix)) throw new Error(`${vsix} does not exist. Run npm run package first.`);

const EXTENSIONS = join(homedir(), '.vscode', 'extensions');
const THEMES = ['posedge-icon-theme.json', 'posedge-still-icon-theme.json'];
const id = `${publisher}.${name}-`;
// Builds from before the first public release used this ID. Left installed, every theme would be listed twice.
const LEGACY_ID = 'posedge.posedge';
const readTheme = (path: string): IconTheme => JSON.parse(readFileSync(path, 'utf8'));

const icons: ClassIcons = {};
const installed = readdirSync(EXTENSIONS);
for (const folder of installed.filter((f) => f.startsWith(`${LEGACY_ID}-`) || f.startsWith(id))) {
  const path = join(EXTENSIONS, folder, 'icons', THEMES[0]);
  if (existsSync(path)) Object.assign(icons, readTheme(path).posedgeClassIcons);
}

if (installed.some((f) => f.startsWith(`${LEGACY_ID}-`))) execSync(`code --uninstall-extension ${LEGACY_ID}`, { stdio: 'inherit' });
execSync(`code --install-extension "${vsix}" --force`, { stdio: 'inherit' });

for (const file of THEMES) {
  const path = join(EXTENSIONS, `${id}${version}`, 'icons', file);
  const theme = readTheme(path);
  if (applyClassIcons(theme, icons)) writeFileSync(path, `${JSON.stringify(theme, null, 2)}\n`);
}
console.log(`Installed ${version} with ${Object.keys(icons).length} class icons carried over.`);
