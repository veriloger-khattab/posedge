// Unit tests for the runtime's pure logic: clock formatting, work weeks, glyph text, UVM roles.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { formatClock, hasSeconds, isoTimestamp, toGlyphText, toPlainText, toggleSeconds } from '../src/clock/format.mts';
import { isoWeek, sundayWeek } from '../src/clock/workweek.mts';
import { roleForFileName } from '../src/explorer/uvmRoles.mts';
import { ROOT } from './lib/textmate.mts';

const d = (y: number, m: number, day: number, h = 12, min = 0, s = 0): Date => new Date(y, m - 1, day, h, min, s);

test('ISO 8601 weeks, including the tricky days around New Year', () => {
  const cases: Array<[Date, number, number, number]> = [
    [d(2026, 10, 18), 2026, 42, 7],
    [d(2026, 12, 31), 2026, 53, 4],
    [d(2027, 1, 1), 2026, 53, 5],
    [d(2027, 1, 4), 2027, 1, 1],
    [d(2020, 12, 31), 2020, 53, 4],
    [d(2021, 1, 3), 2020, 53, 7],
    [d(2021, 1, 4), 2021, 1, 1],
    [d(2018, 12, 31), 2019, 1, 1],
  ];
  for (const [date, year, week, day] of cases) {
    assert.deepEqual(isoWeek(date), { year, week, day }, date.toDateString());
  }
});

test('Sunday-start (Intel-style) work weeks: WW01 contains January 1', () => {
  const cases: Array<[Date, number, number, number]> = [
    [d(2026, 1, 1), 2026, 1, 4],
    [d(2025, 12, 28), 2026, 1, 0],
    [d(2025, 12, 27), 2025, 52, 6],
    [d(2026, 10, 18), 2026, 43, 0],
    [d(2026, 12, 26), 2026, 52, 6],
    [d(2026, 12, 27), 2027, 1, 0],
  ];
  for (const [date, year, week, day] of cases) {
    assert.deepEqual(sundayWeek(date), { year, week, day }, date.toDateString());
  }
});

test('format tokens', () => {
  const t = d(2026, 10, 18, 14, 37, 5);
  assert.equal(formatClock('{HH}:{mm}', t), '14:37');
  assert.equal(formatClock('{HH}:{mm}:{ss}', t), '14:37:05');
  assert.equal(formatClock('{hh}:{mm} {A}', t), '02:37 PM');
  assert.equal(formatClock('{ddd} {DD} {MMM} · WW{WW}', t), 'Sun 18 Oct · WW42');
  assert.equal(formatClock('{dddd} {D} {MMMM} {YYYY}', t), 'Sunday 18 October 2026');
  assert.equal(formatClock('{YYYY}-{MM}-{DD} Q{Q} day {DOY}', t), '2026-10-18 Q4 day 291');
  assert.equal(formatClock('WW{WW}.{WD}', t, 'sunday'), 'WW43.0');
  assert.equal(formatClock('{YY}/{M}/{D} {H}', t), '26/10/18 14');
  assert.equal(formatClock('{nope}', t), '{nope}');
  assert.equal(formatClock('{h}:{mm} {a}', d(2026, 1, 1, 0, 5)), '12:05 am');
  assert.equal(isoTimestamp(t), '2026-10-18 14:37:05');
});

test('every character of the default formats has a JetBrains Mono glyph', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  const props = pkg.contributes.configuration.properties;
  const t = d(2026, 9, 3, 9, 5, 7);
  for (const key of ['posedge.clock.timeFormat', 'posedge.clock.dateFormat']) {
    const text = formatClock(props[key].default, t);
    const glyphText = toGlyphText(text);
    assert.ok(!/[^$()a-z0-9-]/.test(glyphText.replace(/\$\(posedge-c-[a-z0-9-]+\)/g, '')), `${key}: "${text}" has characters without glyphs`);
  }
  // every icon id used exists in the manifest
  for (const m of toGlyphText('Wed 03 Sep · WW36 09:05:07 AM').matchAll(/\$\(([^)]+)\)/g)) {
    assert.ok(pkg.contributes.icons[m[1]], `${m[1]} is not contributed`);
  }
});

test('glyph text, plain text and seconds toggling', () => {
  assert.equal(toGlyphText('14:37'), '$(posedge-c-1)$(posedge-c-4)$(posedge-c-colon)$(posedge-c-3)$(posedge-c-7)');
  assert.equal(toGlyphText('W·k'), '$(posedge-c-up-w)$(posedge-c-middot)$(posedge-c-k)');
  assert.equal(toGlyphText('年'), '年');
  assert.equal(toPlainText('cost $(x)'), 'cost $ (x)');
  assert.equal(toggleSeconds('{HH}:{mm}'), '{HH}:{mm}:{ss}');
  assert.equal(toggleSeconds('{HH}:{mm}:{ss}'), '{HH}:{mm}');
  assert.ok(hasSeconds('{ss}') && !hasSeconds('{mm}'));
});

test('UVM role badges from file names', () => {
  const cases: Record<string, string | undefined> = {
    'apb_driver.sv': 'DR',
    'apb_drv.svh': 'DR',
    'apb_monitor.sv': 'MO',
    'apb_seq_item.sv': 'TX',
    'apb_sequencer.sv': 'SQ',
    'apb_seq_lib.sv': 'SE',
    'apb_rand_seq.sv': 'SE',
    'apb_vseq.sv': 'VS',
    'apb_agent.sv': 'AG',
    'apb_env.sv': 'EN',
    'apb_scoreboard.sv': 'SB',
    'apb_coverage.sv': 'CV',
    'apb_base_test.sv': 'TS',
    'apb_sva.sv': 'AS',
    'apb_if.sv': 'IF',
    'apb_pkg.sv': 'PK',
    'apb_reg_pkg.sv': 'RG',
    'apb_reg_block.sv': 'RG',
    'apb_defines.svh': 'DF',
    'apb_config.sv': 'CF',
    'tb_top.sv': 'TB',
    'TOP.SV': 'TB',
    'driver.sv': undefined,
    'apb_driver.py': undefined,
    'README.md': undefined,
  };
  for (const [name, badge] of Object.entries(cases)) {
    assert.equal(roleForFileName(name)?.badge, badge, name);
  }
});
