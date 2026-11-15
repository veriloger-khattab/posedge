// Bundles the runtime (src/) into one readable file per host. Deliberately NOT minified, so anyone
// reviewing the extension (security teams, curious engineers) can read exactly what runs.
//
//   dist/extension.js       desktop VS Code (Node extension host)
//   dist/web/extension.js   vscode.dev, code-server, Coder, Codespaces (web worker host)

import { build, type BuildOptions } from 'esbuild';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string };

const common: BuildOptions = {
  absWorkingDir: ROOT,
  entryPoints: ['src/extension.ts'],
  bundle: true,
  format: 'cjs',
  external: ['vscode'],
  minify: false,
  sourcemap: false,
  legalComments: 'inline',
  logLevel: 'warning',
  banner: { js: `// Posedge ${pkg.version} (MIT). Source: src/ in the Posedge repository. Not minified on purpose.` },
};

await build({ ...common, platform: 'node', target: 'node18', outfile: 'dist/extension.js' });
await build({ ...common, platform: 'browser', target: 'es2022', outfile: 'dist/web/extension.js' });
console.log('bundled dist/extension.js and dist/web/extension.js');
