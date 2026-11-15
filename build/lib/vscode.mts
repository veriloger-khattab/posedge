// Locates the local VS Code installation and extracts the registered workbench color ids from its
// bundled workbench code. Used only by the validator; returns null when VS Code is not found.

import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

function candidateAppDirs(): string[] {
  const dirs: string[] = [];
  if (process.env.VSCODE_APP_DIR) dirs.push(process.env.VSCODE_APP_DIR);
  const local = process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local');
  const winRoots = [join(local, 'Programs', 'Microsoft VS Code'), 'C:\\Program Files\\Microsoft VS Code'];
  for (const root of winRoots) {
    if (!existsSync(root)) continue;
    dirs.push(join(root, 'resources', 'app'));
    // Newer builds keep the app under a commit-hash folder; prefer the most recently modified one.
    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (entry.isDirectory()) dirs.push(join(root, entry.name, 'resources', 'app'));
    }
  }
  dirs.push('/usr/share/code/resources/app', '/opt/visual-studio-code/resources/app', '/usr/lib/code/resources/app');
  dirs.push('/Applications/Visual Studio Code.app/Contents/Resources/app');
  return dirs;
}

export function findWorkbenchBundle(): string | null {
  for (const dir of candidateAppDirs()) {
    const file = join(dir, 'out', 'vs', 'workbench', 'workbench.desktop.main.js');
    if (existsSync(file)) return file;
  }
  return null;
}

/** All theme color ids registered by the installed VS Code, or null if it cannot be found. */
export function findVsCodeColorIds(): Set<string> | null {
  const file = findWorkbenchBundle();
  if (!file) return null;
  const src = readFileSync(file, 'utf8');
  // The (minified) registration function is whatever is called with "editor.background" first.
  const fn = /([A-Za-z_$][\w$]*)\("editor\.background",/.exec(src)?.[1];
  if (!fn) return null;
  const ids = new Set<string>();
  const call = new RegExp(`[^\\w$.]${fn.replace(/\$/g, '\\$')}\\("([a-zA-Z][\\w.-]*)",`, 'g');
  for (const m of src.matchAll(call)) ids.add(m[1]);
  for (const m of src.matchAll(/"(terminal\.ansi[A-Za-z]+)":\{index:/g)) ids.add(m[1]);
  // Colors contributed by built-in extensions (git, merge-conflict, ...).
  const extDir = join(file, '..', '..', '..', '..', 'extensions');
  if (existsSync(extDir)) {
    for (const ext of readdirSync(extDir, { withFileTypes: true })) {
      const pkg = join(extDir, ext.name, 'package.json');
      if (!ext.isDirectory() || !existsSync(pkg)) continue;
      const colors = (JSON.parse(readFileSync(pkg, 'utf8')) as { contributes?: { colors?: Array<{ id: string }> } })
        .contributes?.colors;
      for (const c of colors ?? []) ids.add(c.id);
    }
  }
  return ids.size > 500 ? ids : null;
}
