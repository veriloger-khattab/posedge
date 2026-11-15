// VS Code paints keyword "brackets" that it cannot pair (e.g. the `fork` in `disable fork`) with the
// red "unexpected bracket" color. The Verilog-HDL extension registers fork/join, class/endclass,
// function/endfunction, property/endproperty, ... as brackets, so Posedge marks legitimately
// unpaired keywords with a scope from the host's unbalancedBracketScopes. This test reads VS Code's
// per-token "contains balanced brackets" bit, exactly as the editor computes it.

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import vsctm from 'vscode-textmate';
import { createRegistry, findCodeWords, ROOT, tokenize } from './lib/textmate.mts';
import { SV_BRACKET_PAIRS } from '../design/keywords.mts';

const BRACKETS = JSON.parse(readFileSync(join(ROOT, 'test', 'fixtures', 'hosts', 'mshr-h', 'brackets.json'), 'utf8')) as Array<{
  language: string;
  balancedBracketScopes: string[];
  unbalancedBracketScopes: string[];
}>;

/** Words expected to be unpaired (non-bracket) on lines containing the given text. */
const UNPAIRED: Array<[string, string[]]> = [
  ['typedef class fwd_c', ['class']],
  ['typedef interface class fwd_ifc', ['interface', 'class']],
  ['context function int c_add', ['function']],
  ['sv_name = function void c_print', ['function']],
  ['export "DPI-C" task sv_task', ['task']],
  ['interface class shape_ifc', ['interface']],
  ['pure virtual function real area', ['function']],
  ['extern function void ext_f', ['function']],
  ['pure virtual task run_t', ['task']],
  ['extern protected virtual function int ext_g', ['function']],
  ['virtual interface apb_if vif', ['interface']],
  ['with function sample', ['function']],
  ['disable fork', ['fork']],
  ['wait fork', ['fork']],
  ['assert property', ['property']],
  ['cover sequence', ['sequence']],
  ['assume property', ['property']],
];

test('legitimately unpaired keywords are not bracket tokens; real blocks still are', async () => {
  const file = join(ROOT, 'test', 'fixtures', 'rules', 'unpaired.sv');
  const text = readFileSync(file, 'utf8');
  const cfg = BRACKETS.find((b) => b.language === 'systemverilog')!;
  const registry = await createRegistry();
  const grammar = await registry.loadGrammarWithConfiguration('source.systemverilog', 1, {
    balancedBracketSelectors: cfg.balancedBracketScopes,
    unbalancedBracketSelectors: cfg.unbalancedBracketScopes,
  });
  assert.ok(grammar);
  const scopesOnly = await tokenize(text, 'source.systemverilog');
  const words = [...new Set(SV_BRACKET_PAIRS.flat())];
  const hits = findCodeWords(scopesOnly, new RegExp(`(?<![\\w$\`])(?:${words.join('|')})(?![\\w$])`, 'g'));

  // balanced-bracket bit per character, from tokenizeLine2 metadata (bit 10)
  const bits: number[][] = [];
  let state = vsctm.INITIAL;
  for (const line of scopesOnly.lines) {
    const r = grammar.tokenizeLine2(line, state);
    const row: number[] = [];
    for (let k = 0; k < r.tokens.length; k += 2) {
      const end = k + 2 < r.tokens.length ? r.tokens[k + 2] : line.length;
      for (let c = r.tokens[k]; c < end; c++) row[c] = (r.tokens[k + 1] >>> 10) & 1;
    }
    bits.push(row);
    state = r.ruleStack;
  }

  let unpairedSeen = 0;
  for (const hit of hits) {
    const line = scopesOnly.lines[hit.line];
    const expectUnpaired = UNPAIRED.some(([ctx, ws]) => line.includes(ctx) && ws.includes(hit.word));
    const bit = bits[hit.line][hit.col];
    const where = `${hit.word} on line ${hit.line + 1}: "${line.trim()}"`;
    if (expectUnpaired) {
      assert.equal(bit, 0, `${where} must not be a bracket token`);
      unpairedSeen++;
    } else {
      assert.equal(bit, 1, `${where} should stay a bracket token`);
    }
  }
  assert.ok(unpairedSeen >= 18, `only ${unpairedSeen} unpaired keywords checked`);
});
