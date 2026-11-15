// Generates the Posedge TextMate injection grammars from the design tables.
//
//   syntaxes/posedge-systemverilog.injection.json   injected into source.systemverilog
//   syntaxes/posedge-verilog.injection.json         injected into source.verilog
//   syntaxes/posedge-log.injection.json             injected into text.log (simulation logs)
//   syntaxes/posedge-filelist.injection.json        injected into source.verilog-filelist
//
// How the SV/Verilog lexer guarantees consistent colors (rules #1, #3, #4):
//   * It is injected with `L:` priority and matches at EVERY position (whitespace and a catch-all
//     included), so the host grammar's context-dependent rules never get to fire.
//   * A keyword's scope is a function of the word alone (design/keywords.mts). Rules that need
//     context (declarations, labels) re-tokenize the keyword through the same #keywords table.
//     The one exception is `new`, a declared name in `function new(`: same color, declaration bold.
//   * Nested constructs are our own begin/end rules named `meta.posedge.*`, and the injection
//     selector excludes those (plus comments, strings, embedded blocks) so nothing can pre-empt
//     their end patterns.
//   * Every backtick token gets one macro scope (plus the host's preprocessor scope, so the host's
//     bracket matching keeps treating macro names as non-brackets).

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { SV_KEYWORDS, VERILOG_KEYWORDS, allWords, type KeywordFamily } from '../design/keywords.mts';
import { lexerScope, LEXER_EXTRA } from '../design/scopes.mts';
import type { Role } from '../design/roles.mts';
import {
  COVER_OPTIONS,
  LIBRARY_TYPES,
  PHASE_METHODS,
  REPORT_FUNCTIONS,
  REPORT_MACROS,
  SEVERITIES,
  SEVERITY_ENUMS,
  SEVERITY_TASKS,
  TWO_TYPE_ARG_MACROS,
  TYPE_ARG_MACROS,
  VERBOSITY,
  type Severity,
} from '../design/uvm.mts';

type Rule = Record<string, unknown>;
type Grammar = { scopeName: string; injectionSelector: string; patterns: Rule[]; repository: Record<string, Rule> };

const ROOT = join(import.meta.dirname, '..');
const OUT = join(ROOT, 'syntaxes');

// ---------------------------------------------------------------- regex helpers
const ID = '[A-Za-z_][\\w$]*';
const NB = '(?<![\\w$])'; // not preceded by an identifier character
const NA = '(?![\\w$])'; // not followed by an identifier character
const esc = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const alt = (words: readonly string[]): string =>
  [...words].sort((a, b) => b.length - a.length || a.localeCompare(b)).map(esc).join('|');
const word = (words: readonly string[]): string => `${NB}(?:${alt(words)})${NA}`;

/**
 * One regex with a capture group per alternative, instead of one rule per alternative. Fewer
 * regexes means fewer re-searches per token, which matters for big files.
 */
const merged = (alts: Array<{ re: string; scope: string }>, prefix = '', suffix = ''): Rule => ({
  match: `${prefix}(?:${alts.map((x) => `(${x.re})`).join('|')})${suffix}`,
  captures: Object.fromEntries(alts.map((x, i) => [i + 1, { name: x.scope }])),
});

const FAMILY_ROLE: Record<KeywordFamily, Role> = {
  keyword: 'keyword',
  modifier: 'modifier',
  selfRef: 'selfRef',
  type: 'type',
  time: 'time',
  verification: 'verification',
  illegalBins: 'illegalBins',
  ignoreBins: 'ignoreBins',
  operator: 'operator',
  function: 'function',
  null: 'nullLiteral',
};

const SEVERITY_ROLE: Record<Severity, Role> = {
  info: 'severityInfo',
  warning: 'severityWarning',
  error: 'severityError',
  fatal: 'severityFatal',
};

const VERBOSITY_ROLE: Record<(typeof VERBOSITY)[number], Role> = {
  UVM_NONE: 'verbosityNone',
  UVM_LOW: 'verbosityLow',
  UVM_MEDIUM: 'verbosityMedium',
  UVM_HIGH: 'verbosityHigh',
  UVM_FULL: 'verbosityFull',
  UVM_DEBUG: 'verbosityDebug',
};

// ---------------------------------------------------------------- SystemVerilog / Verilog lexer
interface LexerSpec {
  lang: 'systemverilog' | 'verilog';
  keywords: Record<KeywordFamily, string[]>;
  sv: boolean;
}

function buildLexer(spec: LexerSpec): Grammar {
  const { lang, keywords, sv } = spec;
  const sc = (role: Role | keyof typeof LEXER_EXTRA): string => lexerScope(role, lang);
  const meta = (name: string): string => `meta.posedge.${name}.${lang}`;
  const macroTok = `variable.other.constant.preprocessor.${lang} ${sc('macro')}`;
  const ident = `variable.other.identifier.${lang}`;
  const punct = sc('punctuation');
  const has = (w: string): boolean => Object.values(keywords).some((list) => list.includes(w));
  const kwList = (words: string[]): string[] => words.filter(has);
  const NOT_KW = `(?!(?:${alt(allWords(keywords))})${NA})`;
  const inc = (name: string): Rule => ({ include: `#${name}` });
  // Captures that re-tokenize with `patterns` must carry a meta.posedge scope: VS Code re-runs
  // injections inside captures, and without it our own L: injection would override these patterns.
  const cap = (patterns: Rule[]): Rule => ({ name: meta('capture'), patterns });
  const kwCap = cap([inc('keywords')]);
  // A keyword that the host registers as a bracket but that is legitimately unpaired here (e.g. the
  // `fork` in `disable fork`). The outer scope is in the host's unbalancedBracketScopes, so VS Code
  // does not flag it as an "unexpected bracket" (red); the inner scope keeps the keyword's color.
  const unpaired = (role: Role): string => `${ident} ${sc(role)}`;

  const repo: Record<string, Rule> = {};

  // ---- keywords: one rule per family; the word alone decides the scope
  repo.keywords = merged(
    (Object.keys(keywords) as KeywordFamily[])
      .filter((f) => keywords[f].length)
      .map((f) => ({ re: alt(keywords[f]), scope: sc(FAMILY_ROLE[f]) })),
    NB,
    NA,
  );

  // ---- comments (tool pragmas are directives to tools, so they get the macro color)
  const PRAGMA =
    '(?i:synopsys|synthesis|pragma|cadence|spyglass|verilator|verilog_lint|verible|lint_checking|' +
    'ri\\s+lint_check|leda|altera|xilinx|questa|vcs\\s+coverage|coverage\\s+(?:off|on|toggle_ignore|fsm_off|fsm_on|exclude_file))\\b';
  repo['comment-tags'] = {
    patterns: [
      { match: '\\b(?:TODO|HACK|OPTIMIZE|REVIEW)\\b', name: sc('tagTodo') },
      { match: '\\b(?:FIXME|BUG|XXX)\\b', name: sc('tagFixme') },
      { match: '\\bNOTE\\b', name: sc('tagNote') },
      { match: '\\b(?:WAIVE|WAIVER|WAIVED)\\b', name: sc('tagWaive') },
    ],
  };
  repo.comments = {
    patterns: [
      { match: `(//)\\s*(${PRAGMA}.*)`, name: sc('comment'), captures: { 2: { name: sc('pragma') } } },
      { match: `(/\\*)\\s*(${PRAGMA}.*?)\\s*(\\*/)`, name: sc('blockComment'), captures: { 2: { name: sc('pragma') } } },
      { match: '(//)(.*)', name: sc('comment'), captures: { 2: cap([inc('comment-tags')]) } },
      { begin: '/\\*', end: '\\*/', name: sc('blockComment'), patterns: [inc('comment-tags')] },
    ],
  };

  // ---- strings: escapes and %format specifiers are formatting directives (macro color)
  repo['string-content'] = {
    patterns: [
      { match: '\\\\(?:[nt\\\\"vfa]|[0-7]{1,3}|x[0-9A-Fa-f]{1,2}|$)', name: sc('escape') },
      { match: '%(?:\\d+\\$)?[-+0 #]*(?:\\d+|\\*)?(?:\\.(?:\\d+|\\*))?[bBoOdDhHxXeEfFgGcCvVmMsStTuUzZlLpP]', name: sc('formatSpec') },
      { match: '%%', name: sc('formatSpec') },
    ],
  };
  repo.strings = {
    patterns: [
      ...(sv ? [{ begin: '"""', end: '"""', name: sc('string'), patterns: [inc('string-content')] }] : []),
      { match: '"DPI(?:-C)?"', name: `${sc('string')} ${sc('dpi')}` },
      // Lines are tokenized with a trailing "\n" and `$` also matches after it, so line ends use (?=\n).
      { begin: '"', end: '"|(?<!\\\\)(?=\\n)', name: sc('string'), patterns: [inc('string-content')] },
    ],
  };

  // ---- macros (rule #4: one color for every backtick token)
  repo['type-name'] = {
    patterns: [
      { match: `${NB}uvm_[\\w$]+${NA}`, name: sc('typeLibrary') },
      { match: word(LIBRARY_TYPES), name: sc('typeLibrary') },
      inc('keywords'),
      { match: `${NB}${ID}`, name: sc('userType') },
    ],
  };
  repo.macro = { patterns: [{ match: `\`${ID}`, name: macroTok }] };
  repo['macro-define'] = {
    begin: `(\`define)${NA}(?:\\s+(${ID})(?:(\\()([^)]*)(\\)))?)?`,
    beginCaptures: {
      1: { name: macroTok },
      2: { name: `variable.other.constant.preprocessor.${lang} ${sc('macroDefinition')}` },
      3: { name: punct },
      4: cap([
          { match: `${NB}${ID}`, name: sc('macroParam') },
          inc('strings'),
          inc('numbers'),
          { match: '[,=]', name: punct },
          { match: '\\s+' },
        ]),
      5: { name: punct },
    },
    end: '(?<!\\\\)(?=\\n)',
    name: meta('define'),
    patterns: [
      { match: '\\\\$', name: macroTok },
      { match: '`(?:"|\\\\`"|`)', name: macroTok },
      inc('code'),
    ],
  };
  repo['macro-include'] = {
    match: `(\`include)${NA}\\s*("[^"]*"|<[^>]*>)?`,
    captures: { 1: { name: macroTok }, 2: { name: sc('string') } },
  };
  repo['macro-directive-name'] = {
    match: `(\`(?:ifdef|ifndef|elsif|undef))${NA}\\s+(${ID})`,
    captures: { 1: { name: macroTok }, 2: { name: macroTok } },
  };
  repo['macro-special'] = { match: '`(?:"|\\\\`"|`)', name: macroTok };
  repo['macro-type-arg'] = {
    patterns: [
      {
        match: `(\`(?:${alt(TWO_TYPE_ARG_MACROS)}))${NA}\\s*(\\()\\s*(${ID})\\s*(,)\\s*(${ID})`,
        captures: {
          1: { name: macroTok },
          2: { name: punct },
          3: cap([inc('type-name')]),
          4: { name: punct },
          5: cap([inc('type-name')]),
        },
      },
      {
        match: `(\`(?:${alt(TYPE_ARG_MACROS)}))${NA}\\s*(\\()\\s*(${ID})`,
        captures: { 1: { name: macroTok }, 2: { name: punct }, 3: cap([inc('type-name')]) },
      },
    ],
  };

  // ---- UVM report IDs (rule #1): first argument takes the severity color
  const reportArgRules: Rule[] = [];
  for (const sev of SEVERITIES) {
    const sevScope = sc(SEVERITY_ROLE[sev]);
    repo[`report-id-${sev}`] = {
      patterns: [
        inc('comments'),
        inc('macro-special'),
        { begin: '"', end: '"|(?<!\\\\)(?=\\n)', name: `${sc('string')} ${sevScope}`, patterns: [inc('string-content')] },
        inc('macro'),
        { match: `${NB}${ID}`, name: sevScope },
        {
          begin: '\\(',
          end: '\\)',
          beginCaptures: { 0: { name: punct } },
          endCaptures: { 0: { name: punct } },
          name: meta(`report-paren-${sev}`),
          patterns: [inc(`report-id-${sev}`)],
        },
        { match: '\\.|::', name: punct },
        { match: '\\s+' },
      ],
    };
    reportArgRules.push({
      begin: `(\`(?:${alt(REPORT_MACROS[sev])}))${NA}\\s*(\\()`,
      beginCaptures: { 1: { name: macroTok }, 2: { name: punct } },
      end: '(,)|(?=\\))',
      endCaptures: { 1: { name: punct } },
      name: meta(`uvm-report-${sev}`),
      patterns: [inc(`report-id-${sev}`)],
    });
    reportArgRules.push({
      begin: `${NB}(${alt(REPORT_FUNCTIONS[sev])})\\s*(\\()`,
      beginCaptures: { 1: { name: sc('functionLibrary') }, 2: { name: punct } },
      end: '(,)|(?=\\))',
      endCaptures: { 1: { name: punct } },
      name: meta(`uvm-report-fn-${sev}`),
      patterns: [inc(`report-id-${sev}`)],
    });
  }
  repo['uvm-report'] = { patterns: reportArgRules };

  // ---- system tasks
  repo['system-tasks'] = {
    patterns: [
      ...SEVERITIES.map((sev) => ({
        match: `${esc(SEVERITY_TASKS[sev])}${NA}`,
        name: `${sc('functionLibrary')} ${sc(SEVERITY_ROLE[sev])}`,
      })),
      { match: `\\$(?:unit|root)${NA}`, name: sc('namespace') },
      { match: '\\$(?![\\w$])', name: sc('constant') }, // `$` as the last index: [0:$], q[$]
      { match: '\\$[A-Za-z_][\\w$]*', name: sc('functionLibrary') },
    ],
  };

  // ---- attributes (* ... *) are directives to tools; never confuse with @(*)
  repo.attribute = {
    begin: '\\(\\*(?!\\s*\\))',
    end: '\\*\\)',
    beginCaptures: { 0: { name: sc('attribute') } },
    endCaptures: { 0: { name: sc('attribute') } },
    name: meta('attribute'),
    patterns: [{ match: ID, name: sc('attribute') }, inc('strings'), inc('numbers'), { match: '[=,]', name: sc('operator') }, { match: '\\s+' }],
  };

  // ---- numbers (X/Z/? digits are red: unknowns are where bugs hide)
  repo.numbers = {
    patterns: [
      {
        match: "(?<![\\w$.])(\\d[\\d_]*)?\\s*(')([sS]?[bBoOdDhH])\\s*([0-9a-fA-FxXzZ?_]+)",
        captures: {
          1: { name: sc('numberBase') },
          2: { name: sc('numberBase') },
          3: { name: sc('numberBase') },
          4: cap([
              { match: '[xXzZ?]+', name: sc('numberXZ') },
              { match: '[0-9a-fA-F_]+', name: sc('number') },
            ]),
        },
      },
      { match: `(?<![\\w$'])'[01]${NA}`, name: sc('number') },
      { match: `(?<![\\w$'])'[xXzZ]${NA}`, name: sc('numberXZ') },
      { match: `(?<![\\w$.])\\d[\\d_]*(?:\\.\\d[\\d_]*)?(?:fs|ps|ns|us|ms|s|step)${NA}`, name: sc('timeLiteral') },
      { match: `(?<![\\w$.])\\d[\\d_]*\\.\\d[\\d_]*(?:[eE][+-]?\\d+)?${NA}`, name: sc('number') },
      { match: `(?<![\\w$.])\\d[\\d_]*[eE][+-]?\\d+${NA}`, name: sc('number') },
      { match: `(?<![\\w$.])\\d[\\d_]*${NA}`, name: sc('number') },
    ],
  };

  // ---- constraint blocks: inside them `->` is implication (verification), not an event trigger
  repo['constraint-body'] = {
    patterns: [
      { match: '->', name: sc('verificationOperator') },
      {
        begin: '\\{',
        end: '\\}',
        beginCaptures: { 0: { name: punct } },
        endCaptures: { 0: { name: punct } },
        name: meta('braces'),
        patterns: [inc('constraint-body')],
      },
      inc('code'),
    ],
  };
  repo['constraint-block'] = {
    patterns: sv
      ? [
          {
            begin: `${NB}(?:(static|extern|pure)\\s+)?(constraint)\\s+(?:(${ID})\\s*(::)\\s*)?(${ID})\\s*(\\{)`,
            beginCaptures: {
              1: kwCap,
              2: kwCap,
              3: cap([inc('type-name')]),
              4: { name: sc('operator') },
              5: { name: sc('verificationName') },
              6: { name: punct },
            },
            end: '\\}',
            endCaptures: { 0: { name: punct } },
            name: meta('constraint'),
            patterns: [inc('constraint-body')],
          },
          {
            begin: `${NB}(with)\\s*(\\{)`,
            beginCaptures: { 1: kwCap, 2: { name: punct } },
            end: '\\}',
            endCaptures: { 0: { name: punct } },
            name: meta('constraint'),
            patterns: [inc('constraint-body')],
          },
        ]
      : [],
  };

  // ---- declarations: names get bold, keywords keep their table scope
  const PARAMS = '(?:\\s*#\\s*\\((?:[^()]|\\([^()]*\\))*\\))?'; // #(T), #(int, my_class#(8))
  const SCOPED = `${ID}${PARAMS}(?:\\s*::\\s*${ID}${PARAMS})*`;
  const RANGE = '\\[[^\\]]*\\]';
  const TYPE_EXPR =
    `${sv ? '(?:virtual\\s+(?:interface\\s+)?)?' : ''}${SCOPED}(?:\\s+(?:signed|unsigned))?(?:\\s*${RANGE})*`;
  // Bold belongs to the name being declared, and a name is declared only here: phases and `new` are
  // bold in this position and plain everywhere else. `new` is a keyword that is also a declared name,
  // so it takes the declaration's bold (same color); any other keyword keeps its table scope.
  const functionName = cap([
    { match: word(['new']), name: sc('functionDeclaration') },
    inc('keywords'),
    { match: ID, name: sc('functionDeclaration') },
  ]);
  const typeExprCap = cap([
      // keeps the rule the same as a `virtual interface` declaration: this keyword has no closer
      ...(sv ? [{ match: `${NB}(virtual)\\s+(interface)${NA}`, captures: { 1: kwCap, 2: { name: unpaired('keyword') } } }] : []),
      inc('keywords'),
      inc('type-name'),
      inc('numbers'),
      inc('operators'),
      { match: '[\\[\\]():,#]', name: punct },
      { match: '\\s+' },
    ]);
  // After function/task: [return type] [class scope ::] name. The return type may be a bare range
  // (Verilog's `function [7:0] f;`), which can touch the name. Both of those groups re-tokenize as
  // plain code, so matching here changes the name's look and nothing else on the line.
  const DECL_TAIL =
    `(?:\\s+(${TYPE_EXPR})|\\s*(${RANGE}(?:\\s*${RANGE})*))?(?:\\s+|(?<=\\]))` +
    `(${SCOPED}\\s*::\\s*)?(${ID})(?=\\s*[(;])`;
  const tailCaptures = (first: number): Record<number, Rule> => ({
    [first]: typeExprCap,
    [first + 1]: cap([inc('code')]),
    [first + 2]: cap([inc('scope-resolution'), inc('code')]),
    [first + 3]: functionName,
  });
  const decl: Rule[] = [];
  if (sv) {
    decl.push(
      {
        match: `${NB}(virtual)\\s+(interface)\\s+(${ID})`,
        captures: { 1: kwCap, 2: { name: unpaired('keyword') }, 3: cap([inc('type-name')]) },
      },
      {
        match: `${NB}(class)\\s+(?:(static|automatic)\\s+)?${NOT_KW}(${ID})`,
        captures: { 1: kwCap, 2: kwCap, 3: { name: sc('typeDeclaration') } },
      },
      {
        match: `${NB}(extends|implements)\\s+((?:${ID}\\s*::\\s*)*${ID})`,
        captures: { 1: kwCap, 2: cap([inc('scope-resolution'), inc('type-name')]) },
      },
      {
        match: `${NB}(covergroup)\\s+(${ID})`,
        captures: { 1: kwCap, 2: { name: sc('typeDeclaration') } },
      },
      {
        match: `${NB}(?:(static|extern|pure)\\s+)?(constraint)\\s+(?:(${ID})\\s*(::)\\s*)?${NOT_KW}(${ID})`,
        captures: {
          1: kwCap,
          2: kwCap,
          3: cap([inc('type-name')]),
          4: { name: sc('operator') },
          5: { name: sc('verificationName') },
        },
      },
      {
        match: `${NB}(property|sequence)\\s+${NOT_KW}(${ID})`,
        captures: { 1: kwCap, 2: { name: sc('verificationName') } },
      },
      {
        match: `${NB}(?:(default|global)\\s+)?(clocking)\\s+${NOT_KW}(${ID})`,
        captures: { 1: kwCap, 2: kwCap, 3: { name: sc('label') } },
      },
      {
        match: `${NB}(modport)\\s+(${ID})`,
        captures: { 1: kwCap, 2: { name: sc('label') } },
      },
      {
        match: `${NB}(package)\\s+${NOT_KW}(${ID})`,
        captures: { 1: kwCap, 2: { name: `${sc('namespace')} ${sc('typeDeclaration')}` } },
      },
    );
  }
  decl.push(
    {
      match: `${NB}(${alt(kwList(['module', 'macromodule', 'interface', 'program', 'checker', 'primitive', 'config']))})\\s+(?:(static|automatic)\\s+)?${NOT_KW}(${ID})`,
      captures: { 1: kwCap, 2: kwCap, 3: { name: sc('typeDeclaration') } },
    },
    {
      // `automatic [W-1:0]` is left to the return-type group, which keeps its existing colors
      match: `${NB}(function|task)${NA}(?:\\s+(static|automatic)${NA}(?!\\s*\\[))?${DECL_TAIL}`,
      captures: { 1: kwCap, 2: kwCap, ...tailCaptures(3) },
    },
    {
      // single-identifier parameterization: uvm_driver #(apb_item), my_fifo #(WIDTH)
      match: `(#)\\s*(\\()\\s*(${ID})\\s*(\\))`,
      captures: {
        1: { name: sc('operator') },
        2: { name: punct },
        3: cap([inc('uvm-identifiers'), inc('constants'), inc('type-name')]),
        4: { name: punct },
      },
    },
  );
  repo.declarations = { patterns: decl };

  // ---- keywords the host treats as bracket openers but that have no closer in these contexts
  repo['unpaired-keywords'] = {
    patterns: sv
      ? [
          // disable fork; wait fork;
          { match: `${NB}(disable|wait)\\s+(fork)${NA}`, captures: { 1: kwCap, 2: { name: unpaired('time') } } },
          // assert property (...), cover sequence (...)
          {
            match: `${NB}(assert|assume|cover|restrict|expect)\\s+(property|sequence)${NA}`,
            captures: { 1: kwCap, 2: { name: unpaired('verification') } },
          },
          // default clocking cb;  (a reference, not a clocking block)
          {
            match: `${NB}(?:(default|global)\\s+)?(clocking)\\s+(${ID})(?=\\s*;)`,
            captures: { 1: kwCap, 2: { name: unpaired('time') }, 3: { name: sc('label') } },
          },
          // interface class X ... endclass: the class pairs with endclass, `interface` does not
          { match: `${NB}(interface)(?=\\s+class${NA})`, captures: { 1: { name: unpaired('keyword') } } },
          // extern / pure virtual prototypes
          {
            match: `${NB}(extern|pure)((?:\\s+(?:virtual|static|protected|local|automatic))*)\\s+(function|task)${NA}${DECL_TAIL}`,
            captures: { 1: kwCap, 2: kwCap, 3: { name: unpaired('keyword') }, ...tailCaptures(4) },
          },
          // DPI and modport imports/exports: import "DPI-C" context function int f(...);
          {
            match:
              `${NB}(import|export)\\s+(?:("DPI(?:-C)?")\\s+)?(?:(context|pure)\\s+)?(?:(${ID})\\s*(=)\\s*)?` +
              `(function|task)${NA}${DECL_TAIL}`,
            captures: {
              1: kwCap,
              2: { name: `${sc('string')} ${sc('dpi')}` },
              3: kwCap,
              4: { name: sc('functionDeclaration') },
              5: { name: sc('operator') },
              6: { name: unpaired('keyword') },
              ...tailCaptures(7),
            },
          },
          // covergroup cg with function sample(...);
          {
            match: `${NB}(with)\\s+(function)\\s+(sample)${NA}`,
            captures: { 1: kwCap, 2: { name: unpaired('keyword') }, 3: { name: sc('functionDeclaration') } },
          },
        ]
      : [],
  };

  // ---- typedef ... NAME;  (braces are tracked so `a;` inside a struct doesn't end it)
  repo['braces-body'] = {
    patterns: [
      {
        begin: '\\{',
        end: '\\}',
        beginCaptures: { 0: { name: punct } },
        endCaptures: { 0: { name: punct } },
        name: meta('braces'),
        patterns: [inc('braces-body')],
      },
      inc('code'),
    ],
  };
  repo.typedef = sv
    ? {
        // `typedef class X;` / `typedef interface class X;` are forward declarations: unpaired keywords
        begin: `${NB}(typedef)${NA}(?:\\s+(?:(interface)\\s+)?(class)${NA})?`,
        beginCaptures: { 1: kwCap, 2: { name: unpaired('keyword') }, 3: { name: unpaired('keyword') } },
        end: `(?:(${ID})\\s*(?:\\[[^\\]]*\\]\\s*)*)?(;)`,
        endCaptures: { 1: { name: sc('typeDeclaration') }, 2: { name: punct } },
        name: meta('typedef'),
        patterns: [inc('braces-body')],
      }
    : { patterns: [] };

  // ---- labels: closers take the color of what they close
  const closer = (words: string[], labelCap: Rule): Rule | null => {
    const list = kwList(words);
    return list.length
      ? { match: `${NB}(${alt(list)})\\s*(:)(?!:)\\s*(${ID})`, captures: { 1: kwCap, 2: { name: punct }, 3: labelCap } }
      : null;
  };
  repo.labels = {
    patterns: [
      closer(['begin', 'fork'], { name: sc('label') }),
      closer(['end', 'join', 'join_any', 'join_none', 'endclocking', 'endspecify', 'endgenerate'], { name: sc('label') }),
      closer(
        ['endclass', 'endinterface', 'endmodule', 'endprogram', 'endchecker', 'endconfig', 'endprimitive', 'endgroup'],
        { name: sc('userType') },
      ),
      closer(['endpackage'], { name: sc('namespace') }),
      closer(
        ['endfunction', 'endtask'],
        cap([inc('keywords'), { match: word(PHASE_METHODS), name: sc('phase') }, { match: ID, name: sc('function') }]),
      ),
      closer(['endproperty', 'endsequence'], { name: sc('verificationName') }),
      sv
        ? {
            match: `${NB}${NOT_KW}(${ID})\\s*(:)(?!:)\\s*(?=(?:assert|assume|cover|restrict|expect|coverpoint|cross)${NA})`,
            captures: { 1: { name: sc('verificationName') }, 2: { name: punct } },
          }
        : null,
    ].filter(Boolean) as Rule[],
  };

  // ---- UVM vocabulary
  repo['uvm-identifiers'] = merged(
    [
      ...VERBOSITY.map((v) => ({ re: `${v}${NA}`, scope: sc(VERBOSITY_ROLE[v]) })),
      ...SEVERITIES.map((sev) => ({ re: `${SEVERITY_ENUMS[sev]}${NA}`, scope: sc(SEVERITY_ROLE[sev]) })),
      { re: `(?:${alt(PHASE_METHODS)})${NA}`, scope: sc('phase') },
      { re: 'uvm_[\\w$]+(?=\\s*\\()', scope: sc('functionLibrary') },
      { re: `uvm_[\\w$]+${NA}`, scope: sc('typeLibrary') },
      { re: `(?:${alt(LIBRARY_TYPES)})${NA}`, scope: sc('typeLibrary') },
      { re: 'std(?=\\s*::)', scope: sc('namespace') },
      ...(sv ? [{ re: `(?:${alt(COVER_OPTIONS)})(?=\\s*\\.)`, scope: sc('verification') }] : []),
    ],
    NB,
  );

  // ---- clocks and resets, recognised by name segment (clk, pclk, sys_clk; rst_n, presetn, rst_ni).
  // Never applied to calls: reset_signals() is a task, not a reset.
  const SEG = '[A-Za-z0-9$]+';
  const NOT_CALL = '(?!\\s*\\()';
  const CLOCK = `(?:${SEG}_)*?(?i:[a-z]{0,3}clk[0-9]*x?|[a-z]{0,4}clock[0-9]*)(?:_${SEG})*`;
  const RESET =
    `(?:${SEG}_)*?(?i:(?:[aphsgmnctr]|sys|por|ext|glb|cpu|soft|hard|warm|cold)?(?:rst|reset)[0-9]*[nb]?|porn?)` +
    `(?:_${SEG})*`;
  repo['clock-reset'] = merged(
    [
      { re: CLOCK, scope: sc('clock') },
      { re: RESET, scope: sc('reset') },
    ],
    // cheap guard first: most identifiers contain none of these fragments
    `${NB}(?=[A-Za-z_])(?=[\\w$]*(?i:clk|clock|rst|reset|por))`,
    `${NA}${NOT_CALL}`,
  );

  // ---- calls, scopes, casts, member access
  repo['port-connection'] = {
    match: `(?<![\\w$)\\]])(\\.)\\s*(${ID})(?=\\s*\\()`,
    captures: { 1: { name: punct }, 2: cap([inc('clock-reset'), { match: ID, name: sc('port') }]) },
  };
  repo['method-call'] = {
    match: `(?<=[\\w$)\\]])(\\.)(${ID})(?=\\s*\\()`,
    captures: {
      1: { name: punct },
      2: cap([inc('keywords'), { match: word(PHASE_METHODS), name: sc('phase') }, { match: ID, name: sc('function') }]),
    },
  };
  repo['member-triggered'] = { match: `(?<=\\.)triggered${NA}`, name: sc('time') };
  repo['scope-resolution'] = {
    match: `${NB}(${ID})\\s*(::)`,
    captures: {
      1: cap([
          inc('uvm-identifiers'),
          inc('keywords'),
          { match: `${ID}(?:_pkg|pkg)${NA}`, name: sc('namespace') },
          { match: ID, name: sc('userType') },
        ]),
      2: { name: sc('operator') },
    },
  };
  repo.cast = {
    match: `${NB}(${ID})(')(?=\\()`,
    captures: { 1: cap([inc('type-name')]), 2: { name: sc('operator') } },
  };
  // Module/interface instances: `apb_slave u_dut (`, `apb_slave #(.W(8)) u_dut (`, `) u_dut (`.
  // The instance name is a plain identifier, not a function call.
  repo.instances = {
    patterns: [
      {
        match: `${NB}${NOT_KW}(${ID})\\s*(#)\\s*(\\((?:[^()]|\\([^()]*\\))*\\))\\s*(${ID})(?=\\s*\\()`,
        captures: {
          1: cap([inc('type-name')]),
          2: { name: sc('operator') },
          3: cap([inc('code')]),
          4: { name: ident },
        },
      },
      {
        match: `${NB}${NOT_KW}(${ID})\\s+${NOT_KW}(${ID})(?=\\s*\\()`,
        captures: { 1: cap([inc('type-name')]), 2: { name: ident } },
      },
      { match: `^\\s*(\\))\\s*(${ID})(?=\\s*\\()`, captures: { 1: { name: punct }, 2: { name: ident } } },
      ...(sv ? [{ match: `${NB}(bind)\\s+(${ID})`, captures: { 1: kwCap, 2: cap([inc('type-name')]) } }] : []),
    ],
  };
  repo['function-call'] = { match: `${NB}${ID}(?=\\s*\\()`, name: sc('function') };
  repo['type-heuristic'] = {
    patterns: [
      { match: `${NB}${ID}(?=\\s*#\\s*\\(|\\s+${NOT_KW}${ID}\\s*(?:[;,=\\[)(]|$))`, name: sc('userType') },
      { match: `${NB}${ID}(?=\\.${ID}\\s+${ID}\\s*[;,=\\[)])`, name: sc('userType') },
    ],
  };
  repo.constants = { match: `${NB}[A-Z][A-Z0-9_$]*${NA}`, name: sc('constant') };
  repo.identifiers = {
    patterns: [
      { match: '\\\\\\S+', name: ident }, // escaped identifier: \bus[0]
      merged([{ re: `[A-Z][A-Z0-9_$]*${NA}`, scope: sc('constant') }, { re: ID, scope: ident }], NB),
    ],
  };

  // ---- operators: timing (@ # ## ->) is blue, SVA/constraint operators are pink
  repo.operators = {
    patterns: [
      ...(sv
        ? [
            { match: '\\|->|\\|=>|#-#|#=#', name: sc('verificationOperator') },
            { match: '\\[\\s*(?:\\*|->|=)[^\\]]*\\]', name: sc('verificationOperator') },
            { match: ':=|:/', name: sc('verificationOperator') },
            { match: `##\\s*(?:\\[[^\\]]*\\]|\\d[\\d_]*|${ID})?`, name: sc('timeOperator') },
          ]
        : []),
      { match: '#(?=\\s*(?:\\d|[A-Za-z_]))', name: sc('timeOperator') },
      // `#(` is a delay at statement start (after ; ) or a process keyword), otherwise a parameter list.
      { match: '^\\s*(#)(?=\\s*\\()', captures: { 1: { name: sc('timeOperator') } } },
      {
        match: '(?<=[;)]|[;)]\\s|\\b(?:always|initial|forever|begin|else|fork|final)\\s)#(?=\\s*\\()',
        name: sc('timeOperator'),
      },
      { match: '@\\*|@', name: sc('timeOperator') },
      { match: '->>|->', name: sc('timeOperator') },
      {
        match:
          '<->|===|!==|==\\?|!=\\?|==|!=|<<<=|>>>=|<<=|>>=|<=|>=|<<<|>>>|<<|>>|&&&|&&|\\|\\||\\+\\+|--|' +
          '\\+=|-=|\\*=|/=|%=|&=|\\|=|\\^=|~&|~\\||~\\^|\\^~|\\*\\*|::|[-+*/%=<>!~&|^?#]',
        name: sc('operator'),
      },
      { match: "'(?=\\{)", name: sc('operator') },
    ],
  };
  repo.punctuation = { match: '[;,.:(){}\\[\\]\']+', name: punct };

  // ---- order decides ties at the same position: specific before generic
  repo.code = {
    patterns: [
      inc('comments'),
      inc('strings'),
      inc('macro-define'),
      inc('macro-include'),
      inc('uvm-report'),
      inc('macro-type-arg'),
      inc('macro-directive-name'),
      inc('macro-special'),
      inc('macro'),
      inc('attribute'),
      inc('system-tasks'),
      inc('numbers'),
      inc('constraint-block'),
      inc('unpaired-keywords'),
      inc('declarations'),
      inc('typedef'),
      inc('labels'),
      inc('keywords'),
      inc('uvm-identifiers'),
      inc('clock-reset'),
      inc('port-connection'),
      inc('method-call'),
      inc('member-triggered'),
      inc('scope-resolution'),
      inc('cast'),
      inc('instances'),
      inc('function-call'),
      inc('type-heuristic'),
      inc('identifiers'),
      inc('operators'),
      inc('punctuation'),
      { match: '\\s+' },
      { match: '.' },
    ],
  };

  foldLeadingWhitespace(repo);
  return {
    scopeName: `posedge.injection.${lang}`,
    injectionSelector: `L:source.${lang} -comment -string -meta.posedge -meta.embedded`,
    patterns: [
      // At the first position of the document, open a rule that never closes. From then on the host
      // grammar's top-level rules are never even scanned, which halves tokenization time. (\A only
      // matches on a document's first line, or wherever VS Code restarts from the initial state.)
      { begin: '\\A', end: '(?!)', name: meta('document'), patterns: [inc('code')] },
      inc('code'),
    ],
    repository: repo,
  };
}

/**
 * Performance: VS Code runs the host grammar's scanner once per token we produce, so fewer tokens
 * means faster tokenization. Every rule may absorb the whitespace in front of it (left unscoped
 * where possible), which roughly halves the number of tokens on a typical line.
 */
function foldLeadingWhitespace(repo: Record<string, Rule>): void {
  const visit = (rule: Rule): void => {
    if (Array.isArray(rule.patterns)) (rule.patterns as Rule[]).forEach(visit);
    for (const key of ['captures', 'beginCaptures', 'endCaptures'] as const) {
      const caps = rule[key] as Record<string, Rule> | undefined;
      if (caps) Object.values(caps).forEach(visit);
    }
    const fold = (re: string): boolean => !re.startsWith('^') && !re.startsWith('\\A') && re !== '\\s+' && re !== '.';
    if (typeof rule.match === 'string' && fold(rule.match)) {
      if (rule.name && !rule.captures) {
        rule.match = `\\s*(${rule.match})`;
        rule.captures = { 1: { name: rule.name } };
        delete rule.name;
      } else {
        rule.match = `\\s*(?:${rule.match})`;
      }
    }
    if (typeof rule.begin === 'string' && fold(rule.begin)) rule.begin = `\\s*(?:${rule.begin})`;
  };
  Object.values(repo).forEach(visit);
}

// ---------------------------------------------------------------- simulation logs
function buildLog(): Grammar {
  const L = 'log';
  const sc = (role: Role | keyof typeof LEXER_EXTRA): string => lexerScope(role, L);
  const meta = (name: string): string => `meta.posedge.${name}.${L}`;
  const SEV_RE: Record<Severity, string> = { info: 'INFO', warning: 'WARNING', error: 'ERROR', fatal: 'FATAL' };
  const TIME = '\\d[\\d.,_]*\\s*(?:fs|ps|ns|us|ms|s)?';
  const repo: Record<string, Rule> = {};

  const lineBody = (sev: Severity): Rule[] => [
    { match: `(@)\\s*(${TIME})`, captures: { 1: { name: sc('timeOperator') }, 2: { name: sc('timeLiteral') } } },
    { match: '\\[([^\\]\\s]+)\\]', captures: { 0: { name: sc(SEVERITY_ROLE[sev]) } } },
    { match: '[\\w./\\\\-]+\\.(?:sv|svh|v|vh|sva|svi|vhd|vhdl|c|cpp|h)\\(\\d+\\)', name: sc('logPath') },
    { match: '\\b[A-Za-z_][\\w$]*(?:\\.[A-Za-z_][\\w$\\[\\]]*)+(?=\\s*\\[|\\s*:)', name: sc('logHierarchy') },
    { include: 'text.log' },
  ];

  const patterns: Rule[] = [];
  for (const sev of SEVERITIES) {
    const role = SEVERITY_ROLE[sev];
    // Report summary counts: zero is good news (green), non-zero is a problem.
    patterns.push({
      match: `^(?:#\\s*)?(UVM_${SEV_RE[sev]})(\\s*:\\s*)(0)\\s*$`,
      captures: { 1: { name: sc(role) }, 3: { name: sc('logPass') } },
    });
    patterns.push({
      match: `^(?:#\\s*)?(UVM_${SEV_RE[sev]})(\\s*:\\s*)([1-9]\\d*)\\s*$`,
      captures: {
        1: { name: sc(role) },
        3: { name: sev === 'error' || sev === 'fatal' ? sc('logFail') : sc(role) },
      },
    });
    patterns.push({
      begin: `^(?:#\\s*)?(UVM_${SEV_RE[sev]})(?![\\w$])`,
      beginCaptures: { 1: { name: sc(role) } },
      end: '$',
      name: meta(`uvm-${sev}`),
      patterns: lineBody(sev),
    });
  }
  const tool = (re: string, role: Role, extra: Rule = {}): Rule => ({ match: re, captures: { 1: { name: sc(role) } }, ...extra });
  patterns.push(
    { match: '^(?:#\\s*)?-{2,}\\s*UVM Report (?:catcher )?Summary\\s*-{2,}.*$', name: sc('logHeading') },
    { match: '^(?:#\\s*)?\\*\\*\\s*Report counts by (?:severity|id).*$', name: sc('logHeading') },
    // Questa / ModelSim
    tool('^(?:#\\s*)?(\\*\\*\\s*(?:Fatal)(?:\\s*\\(suppressible\\))?:)', 'severityFatal'),
    tool('^(?:#\\s*)?(\\*\\*\\s*(?:Error)(?:\\s*\\(suppressible\\))?:)', 'severityError'),
    tool('^(?:#\\s*)?(\\*\\*\\s*Warning(?:\\s*\\(suppressible\\))?:)', 'severityWarning'),
    tool('^(?:#\\s*)?(\\*\\*\\s*(?:Note|Info):)', 'severityInfo'),
    // VCS
    tool('^((?:Error|Fatal)-\\[[^\\]]+\\])', 'severityError'),
    tool('^((?:Warning|Lint)-\\[[^\\]]+\\])', 'severityWarning'),
    tool('^((?:Note|Information)-\\[[^\\]]+\\])', 'severityInfo'),
    // Xcelium / Incisive
    tool('^(?:\\w+:\\s*)?(\\*F,\\w+)', 'severityFatal'),
    tool('^(?:\\w+:\\s*)?(\\*E,\\w+)', 'severityError'),
    tool('^(?:\\w+:\\s*)?(\\*W,\\w+)', 'severityWarning'),
    tool('^(?:\\w+:\\s*)?(\\*N,\\w+)', 'severityInfo'),
    // Verilator
    tool('^(%Error(?:-[\\w-]+)?:)', 'severityError'),
    tool('^(%Warning(?:-[\\w-]+)?:)', 'severityWarning'),
    // Vivado / xsim
    tool('^(ERROR:)', 'severityError'),
    tool('^(CRITICAL WARNING:)', 'severityError'),
    tool('^(WARNING:)', 'severityWarning'),
    // SVA failures (VCS/Xcelium/Questa styles)
    { match: '\\b(?:Assertion\\s+\\S+\\s+failed|Offending\\s+\'[^\']*\'|failed at\\s+\\d+\\s*\\w*)', name: sc('logFail') },
    // Verdicts
    { match: '\\b(?:TEST(?:CASE)?\\s+PASS(?:ED)?|SIMULATION\\s+PASS(?:ED)?|ALL\\s+TESTS\\s+PASSED|PASSED)\\b', name: sc('logPass') },
    { match: '\\b(?:TEST(?:CASE)?\\s+FAIL(?:ED)?|SIMULATION\\s+FAIL(?:ED)?|FAILED)\\b', name: sc('logFail') },
    { match: '\\$(?:finish|stop)\\b', name: sc('functionLibrary') },
    { match: `(?:\\b(?:at\\s+)?time\\s*[:=]?\\s*|@\\s*)(${TIME})\\b`, captures: { 1: { name: sc('timeLiteral') } } },
  );
  repo.log = { patterns };
  return {
    scopeName: 'posedge.injection.log',
    injectionSelector: 'L:text.log -meta.posedge',
    patterns: [{ include: '#log' }],
    repository: repo,
  };
}

// ---------------------------------------------------------------- filelists (.f)
function buildFilelist(): Grammar {
  const L = 'verilog-filelist';
  const sc = (role: Role | keyof typeof LEXER_EXTRA): string => lexerScope(role, L);
  const macroTok = sc('macro');
  const repo: Record<string, Rule> = {
    filelist: {
      patterns: [
        { match: '(?:^|(?<=\\s))//.*$', name: sc('comment') },
        { match: '(?:^|(?<=\\s))#.*$', name: sc('comment') },
        {
          // +define+NAME=VALUE+NAME2 : the macro names get the same color they have in code
          match: '(\\+define)((?:\\+[A-Za-z_][\\w$]*(?:=[^\\s+]*)?)+)\\+?',
          captures: {
            1: { name: macroTok },
            2: {
              name: `meta.posedge.capture.${L}`,
              patterns: [
                { match: '\\+', name: macroTok },
                { match: '[A-Za-z_][\\w$]*', name: sc('macroDefinition') },
                { match: '(=)("[^"]*"|[^\\s+]*)', captures: { 1: { name: sc('operator') }, 2: { name: sc('number') } } },
              ],
            },
          },
        },
        { match: '(?<!\\S)\\+[A-Za-z_][\\w-]*\\+?', name: macroTok },
        { match: '(?<!\\S)-{1,2}[A-Za-z][\\w-]*(?:=\\S*)?', name: macroTok },
        { match: '\\$\\{\\w+\\}|\\$\\(\\w+\\)|\\$\\w+|%\\w+%', name: sc('constant') },
        { match: '"[^"]*"', name: sc('string') },
        { match: '\\S+?(?=\\$|\\s|$)|\\S', name: `string.unquoted.path.posedge.${L}` },
        { match: '\\s+' },
      ],
    },
  };
  return {
    scopeName: 'posedge.injection.verilog-filelist',
    injectionSelector: 'L:source.verilog-filelist -meta.posedge',
    patterns: [{ include: '#filelist' }],
    repository: repo,
  };
}

// ---------------------------------------------------------------- write
export function buildAll(): Record<string, Grammar> {
  return {
    'posedge-systemverilog.injection.json': buildLexer({ lang: 'systemverilog', keywords: SV_KEYWORDS, sv: true }),
    'posedge-verilog.injection.json': buildLexer({ lang: 'verilog', keywords: VERILOG_KEYWORDS, sv: false }),
    'posedge-log.injection.json': buildLog(),
    'posedge-filelist.injection.json': buildFilelist(),
  };
}

export function serialize(g: Grammar): string {
  const header = {
    $schema: 'https://raw.githubusercontent.com/martinring/tmlanguage/master/tmlanguage.json',
    name: g.scopeName,
    comment: 'GENERATED by build/grammars.mts from design/*.mts. Do not edit by hand.',
  };
  return `${JSON.stringify({ ...header, ...g }, null, 2)}\n`;
}

if (import.meta.main) {
  mkdirSync(OUT, { recursive: true });
  for (const [file, g] of Object.entries(buildAll())) {
    writeFileSync(join(OUT, file), serialize(g));
    console.log(`wrote syntaxes/${file}`);
  }
}
