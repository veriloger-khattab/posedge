// Fails if any generated file is out of date with design/ — the guard that keeps the committed
// themes, grammars, icons and manifest exactly in sync with their source of truth.
//
//   node build/verify.mts   (run by `npm run package` and in CI)

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const ROOT = join(import.meta.dirname, '..');
const GENERATED = ['themes', 'syntaxes', 'icons', 'media/walkthrough/legend.svg', 'media/walkthrough/legend-daylight.svg', 'src/clock/glyphs.generated.mts', 'package.json', 'docs/colors-and-icons.md'];

function files(p: string): string[] {
  const abs = join(ROOT, p);
  if (!existsSync(abs)) return [];
  if (!statSync(abs).isDirectory()) return [abs];
  return readdirSync(abs).flatMap((n) => files(relative(ROOT, join(abs, n))));
}

function snapshot(): Map<string, string> {
  const map = new Map<string, string>();
  for (const f of GENERATED.flatMap(files)) {
    map.set(relative(ROOT, f), createHash('sha256').update(readFileSync(f)).digest('hex'));
  }
  return map;
}

const before = snapshot();
for (const step of ['themes', 'grammars', 'icons', 'legend', 'manifest', 'reference']) {
  execFileSync(process.execPath, [join(ROOT, 'build', `${step}.mts`)], { cwd: ROOT, stdio: 'ignore' });
}
const after = snapshot();
const changed = [...new Set([...before.keys(), ...after.keys()])].filter((k) => before.get(k) !== after.get(k));
if (changed.length) {
  console.error('Generated files were out of date (they have now been regenerated; review and commit them):');
  for (const c of changed) console.error(`  ${c}`);
  process.exit(1);
}
console.log(`verify: ${after.size} generated files are up to date.`);
