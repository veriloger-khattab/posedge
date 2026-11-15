// Simulation log and filelist highlighting.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROOT, tokenize, type ThemeJson } from './lib/textmate.mts';
import { VARIANTS } from '../design/palette.mts';
import { rolesFor } from '../design/roles.mts';

const v = VARIANTS.graphite;
const roles = rolesFor(v);
const theme: ThemeJson = JSON.parse(readFileSync(join(ROOT, 'themes', `${v.file}-color-theme.json`), 'utf8'));

async function colorOf(file: string, scope: string, needle: string, nth = 0): Promise<string> {
  const t = await tokenize(readFileSync(join(ROOT, file), 'utf8'), scope, { theme });
  let n = 0;
  for (let i = 0; i < t.lines.length; i++) {
    let col = t.lines[i].indexOf(needle);
    while (col >= 0) {
      if (n++ === nth) return t.styles[i][col].fg;
      col = t.lines[i].indexOf(needle, col + 1);
    }
  }
  throw new Error(`${needle} not found in ${file}`);
}

const LOG = 'samples/sim/sim.log';

test('UVM log lines use the same severity colors as the code', async () => {
  assert.equal(await colorOf(LOG, 'text.log', 'UVM_ERROR'), roles.severityError.fg);
  assert.equal(await colorOf(LOG, 'text.log', '[ALGORITHM_ISSUE]'), roles.severityError.fg);
  assert.equal(await colorOf(LOG, 'text.log', 'UVM_WARNING'), roles.severityWarning.fg);
  assert.equal(await colorOf(LOG, 'text.log', '[APB_TIMEOUT]'), roles.severityWarning.fg);
  assert.equal(await colorOf(LOG, 'text.log', '[NOVIF]'), roles.severityFatal.fg);
  assert.equal(await colorOf(LOG, 'text.log', '2500ns'), roles.time.fg);
});

test('report summary: zero errors is good news, non-zero is a failure', async () => {
  const t = await tokenize(readFileSync(join(ROOT, LOG), 'utf8'), 'text.log', { theme });
  const line = (prefix: string): number => t.lines.findIndex((l) => l.startsWith(prefix));
  const countColor = (prefix: string): string => {
    const i = line(prefix);
    return t.styles[i][t.lines[i].search(/\d+\s*$/)].fg;
  };
  assert.equal(countColor('UVM_ERROR :'), roles.logFail.fg);
  assert.equal(countColor('UVM_FATAL :'), roles.logPass.fg);
  assert.equal(await colorOf(LOG, 'text.log', 'TEST FAILED'), roles.logFail.fg);
});

test('tool messages from VCS are colored by severity', async () => {
  assert.equal(await colorOf(LOG, 'text.log', 'Error-[XMRE]'), roles.severityError.fg);
  assert.equal(await colorOf(LOG, 'text.log', 'Warning-[TFIPC]'), roles.severityWarning.fg);
});

test('filelists: +define+ names get the same macro color they have in code', async () => {
  const F = 'samples/sim/files.f';
  assert.equal(await colorOf(F, 'source.verilog-filelist', 'APB_DEBUG'), roles.macroDefinition.fg);
  assert.equal(await colorOf(F, 'source.verilog-filelist', '+incdir+'), roles.macro.fg);
  assert.equal(await colorOf(F, 'source.verilog-filelist', '${UVM_HOME}'), roles.constant.fg);
  assert.equal(await colorOf(F, 'source.verilog-filelist', '../rtl/apb_slave.sv'), roles.fg.fg);
});
