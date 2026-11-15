// The owner's first rule for the public release: Posedge says it was designed by Ahmed Khattab, everywhere a
// user meets it. These checks also guard what the store listings depend on.

import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';

const ROOT = join(import.meta.dirname, '..');
const read = (rel: string): string => readFileSync(join(ROOT, rel), 'utf8');
const pkg = JSON.parse(read('package.json'));
const CREDIT = 'Designed by Ahmed Khattab';

test('the listing, the README, the walkthrough and the license credit Ahmed Khattab', () => {
  assert.equal(pkg.author.name, 'Ahmed Khattab');
  assert.ok(pkg.description.endsWith(`${CREDIT}.`), 'the store description ends with the credit');
  assert.ok(pkg.contributes.walkthroughs[0].description.includes(CREDIT), 'the walkthrough shows the credit');
  const readme = read('README.md');
  assert.ok(readme.slice(0, 700).includes('Designed by <b>Ahmed Khattab</b>'), 'the credit is at the top of the README');
  assert.ok(readme.includes('designed and built by **Ahmed Khattab**'), 'the README has a Credits section');
  assert.ok(read('LICENSE').includes('Copyright (c) 2026 Ahmed Khattab'));
});

test('the Lite edition carries the same credit', () => {
  const lite = read('build/package-lite.mts');
  assert.ok(lite.includes(`${CREDIT}.'`), 'in its store description');
  assert.ok(lite.includes('Designed by **Ahmed Khattab**'), 'in its README');
});

test('the publisher ID and the extension name are the published ones', () => {
  // Both are permanent in the stores: changing either would publish a different extension.
  assert.equal(pkg.publisher, 'ahmedkhattab');
  assert.equal(pkg.name, 'posedge');
});

test('every README image exists in the repository, because the stores load them from GitHub', () => {
  assert.match(pkg.repository.url, /^https:\/\/github\.com\/[\w-]+\/posedge\.git$/);
  const images = [...read('README.md').matchAll(/!\[[^\]]*\]\(([^)]+)\)|<img[^>]+src="([^"]+)"/g)].map((m) => m[1] ?? m[2]);
  assert.ok(images.length >= 6, 'found the README images');
  for (const src of images) {
    assert.ok(!/^https?:|\.svg$/i.test(src), `${src}: use a relative PNG, the stores reject SVG and vsce rewrites the path`);
    assert.ok(existsSync(join(ROOT, src)), `${src} is missing`);
  }
});
