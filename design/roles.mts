// The Posedge color language: semantic roles -> color + font style.
//
// Principles (see README "The color language"):
//   * one meaning per hue; red and yellow appear in code only for errors and warnings
//   * bold   = declared here, or a severity ID: `define names, class names, function names at their declaration
//   * italic = a qualifier or a library name (modifiers, this/super, UVM/std types, $system tasks)
//
// Every generator (themes, icons, previews, tests) reads roles from here, never raw hex.

import { withLightness } from '../build/lib/color.mts';
import type { Variant } from './palette.mts';

export type FontStyle =
  | ''
  | 'italic'
  | 'bold'
  | 'underline'
  | 'strikethrough'
  | 'bold italic'
  | 'bold underline'
  | 'italic underline';

export interface Style {
  fg: string;
  fontStyle: FontStyle;
}

export const ROLE_NAMES = [
  // Base text
  'fg',
  'comment',
  'punctuation',
  'operator',
  'variable',
  'label',
  'port',
  // Keywords
  'keyword',
  'modifier',
  'selfRef',
  // Macros and directives (rule #4: one color)
  'macro',
  'macroDefinition',
  'macroParam',
  'formatSpec',
  'attribute',
  'pragma',
  'dpi',
  // Types
  'type',
  'typeDeclaration',
  'typeLibrary',
  'namespace',
  // Functions
  'function',
  'functionDeclaration',
  'functionLibrary',
  'phase',
  // Literals
  'string',
  'number',
  'numberXZ',
  'constant',
  'nullLiteral',
  'verbosityNone',
  'verbosityLow',
  'verbosityMedium',
  'verbosityHigh',
  'verbosityFull',
  'verbosityDebug',
  // Time and concurrency
  'time',
  'clock',
  'reset',
  // Verification
  'verification',
  'verificationName',
  'illegalBins',
  'ignoreBins',
  // Severity (rule #1)
  'severityInfo',
  'severityWarning',
  'severityError',
  'severityFatal',
  // Comment tags
  'tagTodo',
  'tagFixme',
  'tagNote',
  'tagWaive',
  // Diagnostics
  'invalid',
  'deprecated',
  // Simulation logs
  'logPass',
  'logFail',
  'logPath',
  'logHierarchy',
  'logHeading',
  // Markup, diff, data formats (other languages)
  'heading',
  'link',
  'emphasis',
  'strong',
  'inlineCode',
  'quote',
  'listMarker',
  'inserted',
  'deleted',
  'changed',
  'key',
  'regexp',
  'escape',
] as const;

export type Role = (typeof ROLE_NAMES)[number];
export type Roles = Record<Role, Style>;

const s = (fg: string, fontStyle: FontStyle = ''): Style => ({ fg, fontStyle });

/** Builds the full role table for a theme variant. */
export function rolesFor(v: Variant): Roles {
  const { syntax: h, ink } = v;
  const hc = v.type === 'hc';
  // Verbosity ramp: contrast tells how likely a message is to print. UVM_NONE always prints, so it
  // stands out most: brightest on dark, deepest on paper.
  const lift = hc ? 0.06 : 0;
  const verb = (L: number): string => withLightness(h.number, Math.min(0.97, L + lift));
  const [none, low, high, full, debug] = v.type === 'light' ? [0.32, 0.43, 0.6, 0.64, 0.67] : [0.92, 0.84, 0.66, 0.59, 0.53];

  return {
    fg: s(ink.fg),
    comment: s(ink.comment),
    punctuation: s(ink.punctuation),
    operator: s(ink.operator),
    variable: s(ink.fg),
    label: s(ink.label, 'italic'),
    port: s(ink.fg, 'italic'),

    keyword: s(h.keyword),
    modifier: s(h.modifier, 'italic'),
    selfRef: s(h.modifier, 'italic'),

    macro: s(h.macro),
    macroDefinition: s(h.macro, 'bold'),
    macroParam: s(ink.fg, 'italic'),
    formatSpec: s(h.macro),
    attribute: s(h.macro, 'italic'),
    pragma: s(h.macro, 'italic'),
    dpi: s(h.macro),

    type: s(h.type),
    typeDeclaration: s(h.type, 'bold'),
    typeLibrary: s(h.type, 'italic'),
    namespace: s(h.type, 'italic'),

    function: s(h.function),
    functionDeclaration: s(h.function, 'bold'),
    functionLibrary: s(h.function, 'italic'),
    phase: s(h.function),

    string: s(h.string),
    number: s(h.number),
    numberXZ: s(h.error),
    constant: s(h.number),
    nullLiteral: s(h.number),
    verbosityNone: s(verb(none), 'bold'),
    verbosityLow: s(verb(low)),
    verbosityMedium: s(h.number),
    verbosityHigh: s(verb(high)),
    verbosityFull: s(verb(full)),
    verbosityDebug: s(verb(debug)),

    time: s(h.time),
    clock: s(h.time),
    reset: s(h.time, 'italic'),

    verification: s(h.verification),
    verificationName: s(h.verification, 'italic'),
    illegalBins: s(h.error),
    ignoreBins: s(h.ignore, 'italic'),

    severityInfo: s(ink.fg, 'bold'),
    severityWarning: s(h.warning, 'bold'),
    severityError: s(h.error, 'bold'),
    severityFatal: s(h.error, 'bold'),

    tagTodo: s(h.warning, 'bold'),
    tagFixme: s(h.error, 'bold'),
    tagNote: s(ink.fg, 'bold'),
    tagWaive: s(h.verification, 'bold'),

    invalid: s(h.error, 'underline'),
    deprecated: s(ink.muted, 'strikethrough'),

    logPass: s(h.function, 'bold'),
    logFail: s(h.error, 'bold'),
    logPath: s(ink.muted, 'italic'),
    logHierarchy: s(ink.fg),
    logHeading: s(h.keyword, 'bold'),

    heading: s(h.keyword, 'bold'),
    link: s(h.time, 'underline'),
    emphasis: s(ink.fg, 'italic'),
    strong: s(ink.bright, 'bold'),
    inlineCode: s(h.macro),
    quote: s(ink.comment, 'italic'),
    listMarker: s(h.macro),
    inserted: s(h.function),
    deleted: s(h.error),
    changed: s(h.warning),
    key: s(h.type),
    regexp: s(h.macro),
    escape: s(h.macro),
  };
}

/**
 * Minimum WCAG contrast of each role against the editor background.
 * Defaults: 4.5 (AA) for dark and light variants, 7 (AAA) for High Contrast.
 */
export function minimumContrast(role: Role, v: Variant): number {
  const hc = v.type === 'hc';
  if (role === 'comment' || role === 'quote') return hc ? 7 : v.type === 'light' ? 4.5 : v.id === 'midnight' ? 3.5 : 3.9;
  // Deliberately dim: the least important verbosity levels and deprecated code.
  if (role === 'verbosityFull' || role === 'verbosityDebug' || role === 'deprecated') return hc ? 4.5 : 3;
  if (role === 'verbosityHigh') return hc ? 4.5 : 4;
  return hc ? 7 : 4.5;
}

/** Pairs that appear side by side in real code and must stay clearly distinct (ΔE OKLab x100). */
export const DISTINCT_PAIRS: Array<[Role, Role, number]> = [
  ['keyword', 'macro', 9.5], // both are the user's original picks; kept, and they still read as distinct
  ['keyword', 'severityError', 12],
  ['keyword', 'modifier', 6],
  ['keyword', 'verification', 12],
  ['verification', 'type', 9],
  ['verification', 'function', 9],
  ['verification', 'modifier', 10],
  ['modifier', 'severityWarning', 8], // warm, but must never be taken for a warning
  ['modifier', 'string', 8],
  ['macro', 'severityWarning', 12],
  ['macro', 'modifier', 8],
  ['macro', 'string', 12],
  ['string', 'function', 12],
  ['string', 'severityWarning', 12],
  ['type', 'time', 12],
  ['type', 'function', 12],
  ['number', 'time', 10],
  ['number', 'verification', 12],
  ['verification', 'severityError', 12],
  ['comment', 'fg', 20],
  ['operator', 'fg', 4],
];

/** Pairs that must stay distinguishable for colour-blind readers (checked after deutan/protan simulation). */
export const CVD_PAIRS: Array<[Role, Role, number]> = [
  ['severityError', 'function', 8],
  ['severityError', 'string', 8],
  ['severityWarning', 'string', 6],
  ['severityWarning', 'modifier', 6],
  ['keyword', 'function', 8],
  ['type', 'time', 6],
];

/** Legend shown in the README and the walkthrough. */
export const LEGEND: Array<{ role: Role; label: string; examples: string }> = [
  { role: 'keyword', label: 'Keywords', examples: 'class … endclass, module, function, begin … end, if/else, case' },
  { role: 'modifier', label: 'Modifiers (italic)', examples: 'virtual, local, protected, static, automatic, const, input, this, super' },
  { role: 'macro', label: 'Macros and directives', examples: '`ifdef, `define, `uvm_component_utils, `uvm_info, %0d, tool pragmas' },
  { role: 'type', label: 'Types', examples: 'bit, logic, int, string, apb_item, uvm_driver (library types italic)' },
  { role: 'function', label: 'Functions and tasks', examples: 'new, get_next_item(), $display (bold only where declared)' },
  { role: 'string', label: 'Strings', examples: '"message text"' },
  { role: 'number', label: 'Numbers and constants', examples: "8'hFF, 32, WIDTH, UVM_ALL_ON, null" },
  { role: 'time', label: 'Time and concurrency', examples: '@(posedge clk), #10ns, ##2, fork … join_none, always_ff, wait, clk, rst_n' },
  { role: 'verification', label: 'Verification', examples: 'assert, cover, property, covergroup, bins, constraint, rand, |->' },
  { role: 'severityError', label: 'Error (bold)', examples: '`uvm_error("ID", …), $error, UVM_ERROR, illegal_bins' },
  { role: 'severityFatal', label: 'Fatal (bold)', examples: '`uvm_fatal("ID", …), $fatal' },
  { role: 'severityWarning', label: 'Warning (bold)', examples: '`uvm_warning("ID", …), $warning, TODO' },
  { role: 'severityInfo', label: 'Info (bold, neutral)', examples: '`uvm_info("ID", …, UVM_LOW)' },
  { role: 'comment', label: 'Comments', examples: '// comment' },
];
