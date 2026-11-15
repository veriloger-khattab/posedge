// Checks that hold across color variants: Daylight must speak the same language as the dark themes,
// and the icon theme must give light color themes a complete set of their own.

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { composite, contrast, toOklch } from '../build/lib/color.mts';
import { DAYLIGHT_HUES, HUES, VARIANTS, VARIANT_IDS } from '../design/palette.mts';
import { rolesFor } from '../design/roles.mts';
import { semanticTokenColors } from '../design/semantic.mts';
import { workbenchColors } from '../design/workbench.mts';

const ROOT = join(import.meta.dirname, '..');
const read = (rel: string): any => JSON.parse(readFileSync(join(ROOT, rel), 'utf8'));
const hueGap = (a: number, b: number): number => Math.abs(((a - b + 540) % 360) - 180);

test('every variant is contributed with the base theme its colors were made for', () => {
  const contributed = read('package.json').contributes.themes as Array<{ label: string; uiTheme: string; path: string }>;
  assert.equal(contributed.length, VARIANT_IDS.length);
  for (const id of VARIANT_IDS) {
    const v = VARIANTS[id];
    const entry = contributed.find((t) => t.label === v.name);
    assert.ok(entry, `${v.name} is missing from package.json`);
    assert.equal(entry.uiTheme, v.uiTheme);
    const theme = read(entry.path);
    assert.equal(theme.type, v.type);
    assert.equal(theme.name, v.name);
  }
});

test('brackets keep one color at every nesting depth, in every theme', () => {
  for (const id of VARIANT_IDS) {
    const { colors } = read(`themes/${VARIANTS[id].file}-color-theme.json`);
    for (let depth = 1; depth <= 6; depth++) {
      assert.equal(colors[`editorBracketHighlight.foreground${depth}`], rolesFor(VARIANTS[id]).punctuation.fg, `${VARIANTS[id].name}: depth ${depth}`);
    }
    // A guide with its own color would bring the rainbow back; without one it follows the bracket.
    assert.deepEqual(Object.keys(colors).filter((k) => k.startsWith('editorBracketPairGuide.')), [], VARIANTS[id].name);
    assert.equal(colors['editorBracketHighlight.unexpectedBracket.foreground'], VARIANTS[id].syntax.error, 'an unmatched bracket is an error');
  }
});

test('Daylight keeps every hue family of the dark palette', () => {
  // Same meaning, same family: switching to Daylight must not teach a new color language.
  for (const key of Object.keys(HUES) as Array<keyof typeof HUES>) {
    const gap = hueGap(toOklch(HUES[key]).h, toOklch(DAYLIGHT_HUES[key]).h);
    assert.ok(gap <= 16, `${key} moved ${gap.toFixed(0)}° away from its dark hue`);
  }
});

test('a Daylight token is never a dark-theme color that would vanish on paper', () => {
  const v = VARIANTS.daylight;
  const roles = rolesFor(v);
  for (const [role, style] of Object.entries(roles)) {
    assert.ok(contrast(style.fg, v.surface.editor) >= 3, `${role} ${style.fg} is too faint on paper`);
  }
  const theme = read('themes/posedge-daylight-color-theme.json');
  const dark = new Set(Object.values(HUES).map((c) => c.toUpperCase()));
  for (const rule of theme.tokenColors as Array<{ name: string; settings: { foreground: string } }>) {
    assert.ok(!dark.has(rule.settings.foreground.toUpperCase()), `${rule.name} still uses the dark hue ${rule.settings.foreground}`);
  }
  for (const [selector, style] of Object.entries(semanticTokenColors(roles))) {
    const fg = typeof style === 'string' ? style : (style as { foreground?: string }).foreground;
    if (fg) assert.ok(!dark.has(fg.toUpperCase()), `semantic ${selector} still uses the dark hue ${fg}`);
  }
});

test('the verbosity ramp fades in every variant: UVM_NONE stands out most, UVM_DEBUG least', () => {
  for (const id of VARIANT_IDS) {
    const v = VARIANTS[id];
    const r = rolesFor(v);
    const ramp = [r.verbosityNone, r.verbosityLow, r.verbosityMedium, r.verbosityHigh, r.verbosityFull, r.verbosityDebug];
    const ratios = ramp.map((s) => contrast(s.fg, v.surface.editor));
    for (let i = 1; i < ratios.length; i++) assert.ok(ratios[i] < ratios[i - 1], `${v.name}: ${ratios.map((x) => x.toFixed(2)).join(' > ')}`);
  }
});

for (const file of ['icons/posedge-icon-theme.json', 'icons/posedge-still-icon-theme.json']) {
  test(`${file}: light color themes get a complete icon set`, () => {
    const t = read(file);
    assert.ok(t.light, 'no "light" section');
    for (const key of ['file', 'folder', 'folderExpanded', 'rootFolder', 'rootFolderExpanded']) {
      assert.ok(t.iconDefinitions[t.light[key]], `light.${key} is undefined`);
    }
    for (const key of ['folderNames', 'folderNamesExpanded', 'fileExtensions', 'fileNames', 'languageIds']) {
      assert.deepEqual(Object.keys(t.light[key]).sort(), Object.keys(t[key]).sort(), `light.${key} does not cover the same names`);
      for (const ref of Object.values(t.light[key]) as string[]) {
        const path = t.iconDefinitions[ref]?.iconPath as string;
        assert.ok(path?.startsWith('./svg/light/'), `${ref} does not point at the light set`);
        assert.ok(existsSync(join(ROOT, 'icons', path)), `${path} is missing`);
      }
    }
  });
}

test('sidebar text is easy to read in every variant', () => {
  for (const id of VARIANT_IDS) {
    const ui = workbenchColors(VARIANTS[id]);
    const bg = ui['sideBar.background'];
    assert.ok(contrast(ui['sideBar.foreground'], bg) >= 7, `${VARIANTS[id].name}: sidebar text`);
    assert.ok(contrast(ui['gitDecoration.ignoredResourceForeground'], bg) >= 4.5, `${VARIANTS[id].name}: git-ignored folders`);
  }
});

test('the selected file glows amber, even while focus is in the editor', () => {
  for (const id of VARIANT_IDS.filter((v) => VARIANTS[v].type !== 'hc')) {
    const ui = workbenchColors(VARIANTS[id]);
    const bg = ui['sideBar.background'];
    for (const [state, fg] of [
      ['list.activeSelectionBackground', 'list.activeSelectionForeground'],
      ['list.inactiveSelectionBackground', 'list.inactiveSelectionForeground'],
    ]) {
      const row = composite(ui[state], bg);
      const { C, h } = toOklch(row);
      assert.ok(C > 0.025 && h > 40 && h < 90, `${VARIANTS[id].name}: ${state} ${row} is not amber`);
      assert.ok(contrast(ui[fg], row) >= 7, `${VARIANTS[id].name}: label on ${state}`);
    }
  }
});

test('a closed folder shows no color, so only open folders look lit', () => {
  for (const dir of ['icons/svg/folders', 'icons/svg/light/folders']) {
    for (const name of readdirSync(join(ROOT, dir))) {
      const hexes = readFileSync(join(ROOT, dir, name), 'utf8').match(/#[0-9A-Fa-f]{6}/g) ?? [];
      assert.ok(hexes.length > 0, name);
      for (const hex of hexes) assert.ok(toOklch(hex).C < 0.03, `${dir}/${name} uses the color ${hex}`);
    }
  }
});

test('an open folder stands out from every closed folder', () => {
  const lit = (dir: string): string => readFileSync(join(ROOT, 'icons/svg', dir, 'open.svg'), 'utf8').match(/stroke="(#[0-9A-Fa-f]{6})"/)![1];
  const off = (dir: string): string => readFileSync(join(ROOT, 'icons/svg', dir, 'rtl.svg'), 'utf8').match(/fill="(#[0-9A-Fa-f]{6})"/)![1];
  for (const [surface, litDir, offDir, litMin, offMax] of [
    [VARIANTS.graphite.surface.sidebar, 'folders-open', 'folders', 8, 2.2],
    [VARIANTS.midnight.surface.sidebar, 'folders-open', 'folders', 8, 2.2],
    [VARIANTS.daylight.surface.sidebar, 'light/folders-open', 'light/folders', 3, 1.8],
  ] as const) {
    assert.ok(contrast(lit(litDir), surface) >= litMin, `lit ${lit(litDir)} on ${surface}: ${contrast(lit(litDir), surface).toFixed(2)}`);
    assert.ok(contrast(off(offDir), surface) <= offMax, `off ${off(offDir)} on ${surface}: ${contrast(off(offDir), surface).toFixed(2)}`);
  }
});

test('every folder name lights the same open icon', () => {
  const t = read('icons/posedge-icon-theme.json');
  assert.ok(Object.keys(t.folderNamesExpanded).length > 50);
  for (const id of Object.values(t.folderNamesExpanded)) assert.equal(id, t.folderExpanded);
  for (const id of Object.values(t.light.folderNamesExpanded)) assert.equal(id, t.light.folderExpanded);
  assert.equal(t.rootFolderExpanded, t.folderExpanded);
});

test('open folders animate in the animated set and stay still in the Still set, on both tones', () => {
  const animated = read('icons/posedge-icon-theme.json');
  const still = read('icons/posedge-still-icon-theme.json');
  for (const [t, moving] of [[animated, true], [still, false]] as const) {
    for (const ref of [t.folderExpanded, t.light.folderExpanded]) {
      const svg = readFileSync(join(ROOT, 'icons', t.iconDefinitions[ref].iconPath), 'utf8');
      assert.equal(svg.includes('@keyframes'), moving, `${ref}: wrong motion`);
    }
  }
});

test('the walkthrough legend has a Daylight version', () => {
  const steps = read('package.json').contributes.walkthroughs[0].steps as Array<{ id: string; media: { image?: Record<string, string> } }>;
  const image = steps.find((s) => s.id === 'legend')?.media.image;
  assert.ok(image, 'legend step has no themed image');
  for (const key of ['dark', 'light', 'hc', 'hcLight']) assert.ok(existsSync(join(ROOT, image[key])), `${key} legend is missing`);
  assert.ok(image.light.includes('daylight'));
});
