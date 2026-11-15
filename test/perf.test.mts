// Performance budget: Posedge's lexer must not make big generated files (UVM register models are
// often 50k+ lines) noticeably slower than the host grammar alone. Budget: <= 1.5x the host.

import assert from 'node:assert/strict';
import { test } from 'node:test';
import vsctm from 'vscode-textmate';
import { createRegistry } from './lib/textmate.mts';

function generateRalModel(regs: number): string[] {
  const out: string[] = ['`ifndef BIG_RAL_SV', '`define BIG_RAL_SV', 'package big_ral_pkg;', '  import uvm_pkg::*;'];
  for (let i = 0; i < regs; i++) {
    out.push(
      `  class reg_${i} extends uvm_reg;`,
      `    \`uvm_object_utils(reg_${i})`,
      '    rand uvm_reg_field enable;   // field 0',
      '    rand uvm_reg_field mode;     /* field 1 */',
      `    function new(string name = "reg_${i}");`,
      '      super.new(name, 32, UVM_NO_COVERAGE);',
      '    endfunction : new',
      '    virtual function void build();',
      '      enable = uvm_reg_field::type_id::create("enable");',
      `      enable.configure(this, 1, 0, "RW", 0, 1'b0, 1, 1, 0);`,
      '      mode = uvm_reg_field::type_id::create("mode");',
      `      mode.configure(this, 3, 1, "RW", 0, 3'h${(i % 8).toString(16)}, 1, 1, 0);`,
      '    endfunction',
      `  endclass : reg_${i}`,
    );
  }
  out.push('endpackage', '`endif');
  return out;
}

async function microsPerLine(lines: string[], injections: boolean): Promise<number> {
  const registry = await createRegistry({ injections });
  const grammar = await registry.loadGrammar('source.systemverilog');
  assert.ok(grammar);
  let state = vsctm.INITIAL;
  for (const line of lines.slice(0, 500)) state = grammar.tokenizeLine2(line, state).ruleStack; // warm-up
  let best = Infinity;
  for (let round = 0; round < 2; round++) {
    state = vsctm.INITIAL;
    const t0 = performance.now();
    for (const line of lines) state = grammar.tokenizeLine2(line, state).ruleStack;
    best = Math.min(best, ((performance.now() - t0) / lines.length) * 1000);
  }
  return best;
}

test('tokenizing a 14k-line register model costs at most 1.5x the host grammar alone', async () => {
  const lines = generateRalModel(1000);
  const host = await microsPerLine(lines, false);
  const posedge = await microsPerLine(lines, true);
  console.log(`  ${lines.length} lines: host ${host.toFixed(1)} µs/line, host + Posedge ${posedge.toFixed(1)} µs/line (${(posedge / host).toFixed(2)}x)`);
  assert.ok(posedge / host <= 1.5, `Posedge costs ${(posedge / host).toFixed(2)}x the host grammar`);
});
