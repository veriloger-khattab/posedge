// AGENTS.md is the project's guide for AI agents, and the owner requires it to stay current. Prose cannot
// be checked, but the feature inventory can: a new version, setting, command or theme must be documented.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const doc = readFileSync(join(ROOT, 'AGENTS.md'), 'utf8');
const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
const hint = 'Update AGENTS.md in the same change as the feature.';

test('AGENTS.md documents the current version', () => {
  assert.ok(doc.includes(`**Documented version: ${pkg.version}**`), `AGENTS.md does not say version ${pkg.version}. ${hint}`);
});

test('every changelog version has a row in the AGENTS.md history', () => {
  const changelog = readFileSync(join(ROOT, 'CHANGELOG.md'), 'utf8');
  const versions = [...changelog.matchAll(/^## (\d+\.\d+\.\d+)/gm)].map((m) => m[1]);
  assert.equal(versions[0], pkg.version, 'CHANGELOG.md has no entry for the current version');
  for (const v of versions) assert.ok(doc.includes(`| ${v} |`), `Version ${v} is missing from the AGENTS.md history. ${hint}`);
});

test('every theme, icon theme, setting and command is in AGENTS.md', () => {
  const { themes, iconThemes, commands, configuration } = pkg.contributes;
  const settings = [configuration].flat().flatMap((c: { properties?: Record<string, unknown> }) => Object.keys(c.properties ?? {}));
  const names = [
    ...themes.map((t: { label: string }) => t.label),
    ...iconThemes.map((t: { id: string }) => t.id),
    ...commands.map((c: { command: string }) => c.command),
    ...settings,
  ];
  assert.ok(settings.length > 5, 'found too few settings');
  for (const name of names) assert.ok(doc.includes(name), `"${name}" is missing from AGENTS.md. ${hint}`);
});
