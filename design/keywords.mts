// SystemVerilog (IEEE 1800-2023) and Verilog (IEEE 1364-2005) reserved words, grouped into
// keyword families. This table is the single source of truth for rule #3: a keyword's color is a
// function of the word alone. Each word appears in exactly one family; the grammar generator and
// the invariance tests both read it.

export type KeywordFamily =
  | 'keyword' // structure and control: the skeleton of the code
  | 'modifier' // qualifiers
  | 'selfRef' // this, super
  | 'type' // data types and type constructors
  | 'time' // time and concurrency
  | 'verification' // assertions, coverage, constraints, randomization
  | 'illegalBins'
  | 'ignoreBins'
  | 'operator' // word operators and gate primitives used as operators
  | 'function' // new
  | 'null';

export const SV_KEYWORDS: Record<KeywordFamily, string[]> = {
  keyword: [
    'alias', 'begin', 'bind', 'break', 'buf', 'bufif0', 'bufif1', 'case', 'casex', 'casez', 'cell', 'class',
    'cmos', 'config', 'continue', 'default', 'defparam', 'design', 'do', 'else', 'end', 'endcase', 'endclass',
    'endconfig', 'endfunction', 'endgenerate', 'endinterface', 'endmodule', 'endpackage', 'endprimitive',
    'endprogram', 'endtable', 'endtask', 'export', 'extends', 'for', 'foreach', 'forever', 'function',
    'generate', 'if', 'implements', 'import', 'incdir', 'include', 'instance', 'interface', 'let', 'liblist',
    'library', 'localparam', 'macromodule', 'matches', 'modport', 'module', 'nettype', 'nmos', 'notif0',
    'notif1', 'package', 'parameter', 'pmos', 'primitive', 'priority', 'program', 'pulldown', 'pullup',
    'randcase', 'rcmos', 'repeat', 'return', 'rnmos', 'rpmos', 'rtran', 'rtranif0', 'rtranif1', 'specparam',
    'table', 'task', 'tran', 'tranif0', 'tranif1', 'typedef', 'unique', 'unique0', 'use', 'while',
  ],
  modifier: [
    'automatic', 'const', 'context', 'extern', 'highz0', 'highz1', 'inout', 'input', 'large', 'local', 'medium',
    'output', 'protected', 'pull0', 'pull1', 'pure', 'ref', 'scalared', 'small', 'static', 'strong0', 'strong1',
    'var', 'vectored', 'virtual', 'weak0', 'weak1',
  ],
  selfRef: ['this', 'super'],
  type: [
    'bit', 'byte', 'chandle', 'enum', 'event', 'genvar', 'int', 'integer', 'interconnect', 'logic', 'longint',
    'packed', 'real', 'realtime', 'reg', 'shortint', 'shortreal', 'signed', 'string', 'struct', 'supply0',
    'supply1', 'tagged', 'time', 'tri', 'tri0', 'tri1', 'triand', 'trior', 'trireg', 'type', 'union',
    'unsigned', 'untyped', 'uwire', 'void', 'wand', 'wire', 'wor',
  ],
  time: [
    'always', 'always_comb', 'always_ff', 'always_latch', 'assign', 'clocking', 'deassign', 'disable', 'edge',
    'endclocking', 'endspecify', 'final', 'force', 'fork', 'forkjoin', 'global', 'ifnone', 'initial', 'join',
    'join_any', 'join_none', 'negedge', 'noshowcancelled', 'posedge', 'pulsestyle_ondetect',
    'pulsestyle_onevent', 'release', 'showcancelled', 'specify', 'timeprecision', 'timeunit', 'wait',
    'wait_order',
  ],
  verification: [
    'accept_on', 'assert', 'assume', 'before', 'bins', 'binsof', 'checker', 'constraint', 'cover', 'covergroup',
    'coverpoint', 'cross', 'dist', 'endchecker', 'endgroup', 'endproperty', 'endsequence', 'eventually', 'expect',
    'first_match', 'iff', 'implies', 'inside', 'intersect', 'nexttime', 'property', 'rand', 'randc',
    'randsequence', 'reject_on', 'restrict', 's_always', 's_eventually', 's_nexttime', 's_until',
    's_until_with', 'sequence', 'soft', 'solve', 'strong', 'sync_accept_on', 'sync_reject_on', 'throughout',
    'until', 'until_with', 'weak', 'wildcard', 'with', 'within',
  ],
  illegalBins: ['illegal_bins'],
  ignoreBins: ['ignore_bins'],
  operator: ['and', 'nand', 'nor', 'not', 'or', 'xnor', 'xor'],
  function: ['new'],
  null: ['null'],
};

// IEEE 1364-2005 reserved words. Verilog files use only these; SystemVerilog-only words stay
// ordinary identifiers there (legacy code often has signals named `bit`, `logic`, `rand`, ...).
const VERILOG_WORDS = new Set(
  (
    'always and assign automatic begin buf bufif0 bufif1 case casex casez cell cmos config deassign default ' +
    'defparam design disable edge else end endcase endconfig endfunction endgenerate endmodule endprimitive ' +
    'endspecify endtable endtask event for force forever fork function generate genvar highz0 highz1 if ifnone ' +
    'incdir include initial inout input instance integer join large liblist library localparam macromodule ' +
    'medium module nand negedge nmos nor noshowcancelled not notif0 notif1 or output parameter pmos posedge ' +
    'primitive pull0 pull1 pulldown pullup pulsestyle_ondetect pulsestyle_onevent rcmos real realtime reg ' +
    'release repeat rnmos rpmos rtran rtranif0 rtranif1 scalared showcancelled signed small specify specparam ' +
    'strong0 strong1 supply0 supply1 table task time tran tranif0 tranif1 tri tri0 tri1 triand trior trireg ' +
    'unsigned use uwire vectored wait wand weak0 weak1 while wire wor xnor xor'
  ).split(' '),
);

export const VERILOG_KEYWORDS: Record<KeywordFamily, string[]> = Object.fromEntries(
  Object.entries(SV_KEYWORDS).map(([family, words]) => [family, words.filter((w) => VERILOG_WORDS.has(w))]),
) as Record<KeywordFamily, string[]>;

/** Every reserved word of a language, longest first (for regex alternations). */
export function allWords(table: Record<KeywordFamily, string[]>): string[] {
  return Object.values(table)
    .flat()
    .sort((a, b) => b.length - a.length || a.localeCompare(b));
}

/**
 * Opener/closer pairs that the Verilog-HDL extension registers as brackets
 * (configs/systemverilog.configuration.json). Rule #3: each pair must resolve to one color.
 */
export const SV_BRACKET_PAIRS: Array<[string, string]> = [
  ['begin', 'end'], ['case', 'endcase'], ['casex', 'endcase'], ['casez', 'endcase'], ['checker', 'endchecker'],
  ['class', 'endclass'], ['clocking', 'endclocking'], ['config', 'endconfig'], ['covergroup', 'endgroup'],
  ['fork', 'join'], ['fork', 'join_any'], ['fork', 'join_none'], ['function', 'endfunction'],
  ['generate', 'endgenerate'], ['interface', 'endinterface'], ['macromodule', 'endmodule'],
  ['module', 'endmodule'], ['package', 'endpackage'], ['primitive', 'endprimitive'], ['program', 'endprogram'],
  ['property', 'endproperty'], ['randcase', 'endcase'], ['specify', 'endspecify'], ['sequence', 'endsequence'],
  ['randsequence', 'endsequence'], ['table', 'endtable'], ['task', 'endtask'],
];

// Self-check at import time: a word in two families would break rule #3.
{
  const seen = new Map<string, string>();
  for (const [family, words] of Object.entries(SV_KEYWORDS)) {
    for (const w of words) {
      if (seen.has(w)) throw new Error(`keyword "${w}" is in both "${seen.get(w)}" and "${family}"`);
      seen.set(w, family);
    }
  }
  for (const [a, b] of SV_BRACKET_PAIRS) {
    if (seen.get(a) !== seen.get(b)) throw new Error(`bracket pair ${a}/${b} spans families ${seen.get(a)}/${seen.get(b)}`);
  }
}
