// Builds the code-free "Posedge Lite" VSIX: color themes and icon themes only — no JavaScript, no
// grammars, no settings — for companies whose policy allows only declarative extensions.
//
//   node build/package-lite.mts   -> dist-vsix/posedge-lite-<version>.vsix

import { execFileSync } from 'node:child_process';
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const STAGE = join(ROOT, 'dist-lite');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));

rmSync(STAGE, { recursive: true, force: true });
mkdirSync(join(STAGE, 'themes'), { recursive: true });
mkdirSync(join(STAGE, 'assets'), { recursive: true });

// Themes without Posedge's own colors (those belong to the clock, which Lite does not have).
for (const file of readdirSync(join(ROOT, 'themes'))) {
  const theme = JSON.parse(readFileSync(join(ROOT, 'themes', file), 'utf8'));
  for (const key of Object.keys(theme.colors)) if (key.startsWith('posedge.')) delete theme.colors[key];
  writeFileSync(join(STAGE, 'themes', file), `${JSON.stringify(theme, null, 2)}\n`);
}
cpSync(join(ROOT, 'icons'), join(STAGE, 'icons'), { recursive: true });
for (const f of ['LICENSE', 'CHANGELOG.md']) cpSync(join(ROOT, f), join(STAGE, f));
cpSync(join(ROOT, 'assets', 'icon.png'), join(STAGE, 'assets', 'icon.png'));

writeFileSync(
  join(STAGE, 'README.md'),
  `# Posedge Lite\n\nThe code-free edition of **Posedge**: the SystemVerilog & UVM color themes (Graphite, Midnight, Daylight, High Contrast)\n` +
    `and the file icon themes (animated and still), with no JavaScript, no grammars and no settings.\n\n` +
    `The full edition adds the SystemVerilog/UVM lexer that guarantees consistent keyword and macro colors and\n` +
    `severity-colored UVM message IDs, simulation-log and filelist highlighting, the JetBrains Mono clock, class icons and\n` +
    `UVM role badges. Without the lexer, colors depend on your SystemVerilog extension's grammar.\n\n` +
    `Designed by **Ahmed Khattab**. Source, full edition and issue tracker: ${pkg.homepage.replace('#readme', '')}\n`,
);

const lite = {
  name: 'posedge-lite',
  displayName: 'Posedge Lite — SystemVerilog & UVM Theme (code-free)',
  description: 'The Posedge color themes and file icon themes for verification engineers, with no code at all. Designed by Ahmed Khattab.',
  version: pkg.version,
  publisher: pkg.publisher,
  license: pkg.license,
  author: pkg.author,
  homepage: pkg.homepage,
  repository: pkg.repository,
  bugs: pkg.bugs,
  engines: pkg.engines,
  categories: ['Themes'],
  keywords: pkg.keywords,
  icon: pkg.icon,
  galleryBanner: pkg.galleryBanner,
  contributes: { themes: pkg.contributes.themes, iconThemes: pkg.contributes.iconThemes },
};
writeFileSync(join(STAGE, 'package.json'), `${JSON.stringify(lite, null, 2)}\n`);

mkdirSync(join(ROOT, 'dist-vsix'), { recursive: true });
const out = join(ROOT, 'dist-vsix', `posedge-lite-${pkg.version}.vsix`);
const vsce = join(ROOT, 'node_modules', '@vscode', 'vsce', 'vsce');
execFileSync(process.execPath, [vsce, 'package', '--no-dependencies', '--out', out], {
  cwd: STAGE,
  stdio: 'inherit',
});
