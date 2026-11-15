// Bridges roles and TextMate scopes, in both directions:
//   * LEXER: the scope names the Posedge grammars emit for each role (`lexerScope`)
//   * THEME: the selectors each role colors in the themes (`THEME_SELECTORS`)
//
// Lexer scopes keep standard TextMate roots (keyword.*, storage.*, entity.name.*, ...) and add a
// `posedge` segment, so other color themes still render sensibly while ours can target them exactly.

import type { Role } from './roles.mts';

/** The role-specific part of every lexer scope; `.posedge.<lang>` is appended by `lexerScope`. */
export const LEXER_SCOPES: Partial<Record<Role, string>> = {
  keyword: 'keyword.control',
  modifier: 'storage.modifier',
  selfRef: 'variable.language',
  macro: 'keyword.preprocessor',
  macroDefinition: 'keyword.preprocessor.definition',
  macroParam: 'variable.parameter.macro',
  formatSpec: 'constant.character.format',
  escape: 'constant.character.escape',
  attribute: 'entity.other.attribute-name',
  pragma: 'comment.other.pragma',
  dpi: 'constant.other.dpi',
  type: 'storage.type',
  typeDeclaration: 'entity.name.type.declaration',
  typeLibrary: 'support.type.library',
  namespace: 'entity.name.namespace',
  function: 'entity.name.function',
  functionDeclaration: 'entity.name.function.declaration',
  functionLibrary: 'support.function.library',
  phase: 'entity.name.function.phase',
  string: 'string.quoted.double',
  number: 'constant.numeric',
  numberXZ: 'constant.numeric.xz',
  constant: 'variable.other.constant',
  nullLiteral: 'constant.language.null',
  verbosityNone: 'constant.other.verbosity.none',
  verbosityLow: 'constant.other.verbosity.low',
  verbosityMedium: 'constant.other.verbosity.medium',
  verbosityHigh: 'constant.other.verbosity.high',
  verbosityFull: 'constant.other.verbosity.full',
  verbosityDebug: 'constant.other.verbosity.debug',
  time: 'keyword.other.timing',
  clock: 'variable.other.clock',
  reset: 'variable.other.reset',
  verification: 'keyword.other.verification',
  verificationName: 'entity.name.label.verification',
  illegalBins: 'keyword.other.verification.illegal',
  ignoreBins: 'keyword.other.verification.ignore',
  severityInfo: 'constant.other.severity.info',
  severityWarning: 'constant.other.severity.warning',
  severityError: 'constant.other.severity.error',
  severityFatal: 'constant.other.severity.fatal',
  tagTodo: 'comment.other.tag.todo',
  tagFixme: 'comment.other.tag.fixme',
  tagNote: 'comment.other.tag.note',
  tagWaive: 'comment.other.tag.waive',
  label: 'entity.name.label',
  port: 'variable.other.port',
  operator: 'keyword.operator',
  punctuation: 'punctuation.separator',
  comment: 'comment.line.double-slash',
  logPass: 'markup.inserted.pass',
  logFail: 'markup.deleted.fail',
  logPath: 'string.other.path',
  logHierarchy: 'entity.name.namespace.hierarchy',
  logHeading: 'markup.heading.summary',
};

/** Extra lexer scopes that share a role but need a different root. */
export const LEXER_EXTRA = {
  timeOperator: 'keyword.operator.timing',
  timeLiteral: 'constant.numeric.time',
  verificationOperator: 'keyword.operator.verification',
  userType: 'entity.name.type',
  blockComment: 'comment.block',
  numberBase: 'constant.numeric.base',
} as const;

/** Full scope name the grammar emits for a role, e.g. keyword -> keyword.control.posedge.systemverilog */
export function lexerScope(role: Role | keyof typeof LEXER_EXTRA, lang: string): string {
  const base = (LEXER_EXTRA as Record<string, string>)[role] ?? LEXER_SCOPES[role as Role];
  if (!base) throw new Error(`No lexer scope for role "${role}"`);
  return `${base}.posedge.${lang}`;
}

/** Selector prefix (without language) that the theme uses for a lexer role. */
const lx = (role: Role | keyof typeof LEXER_EXTRA): string => {
  const base = (LEXER_EXTRA as Record<string, string>)[role] ?? LEXER_SCOPES[role as Role];
  return `${base}.posedge`;
};

/**
 * Theme selectors per role. Posedge lexer scopes come first (exact, used for SV/Verilog/logs/filelists);
 * the generic selectors give every other language (Python, Tcl, Perl, shell, Make, C/C++, JSON, YAML,
 * Markdown, ...) the same color language.
 */
export const THEME_SELECTORS: Record<Role, string[]> = {
  fg: ['source', 'text', 'meta.embedded', 'source.groovy.embedded', 'string meta.image.inline.markdown', 'string.unquoted.path.posedge'],
  comment: [
    lx('comment'), lx('blockComment'), 'comment', 'punctuation.definition.comment', 'string.comment',
  ],
  punctuation: [
    lx('punctuation'), 'punctuation', 'meta.brace', 'punctuation.definition.parameters',
    'punctuation.section', 'punctuation.terminator', 'punctuation.separator',
  ],
  operator: [lx('operator'), 'keyword.operator', 'keyword.operator.word', 'punctuation.accessor'],
  variable: ['variable', 'variable.other', 'variable.other.identifier', 'meta.definition.variable.name', 'support.variable.property'],
  label: [lx('label'), 'entity.name.label', 'entity.name.section', 'entity.name.goto-label'],
  port: [lx('port'), 'variable.other.port'],
  keyword: [
    lx('keyword'), 'keyword', 'keyword.control', 'keyword.other', 'storage.type.function', 'storage.type.class',
    'storage.type.struct', 'storage.type.enum', 'storage.type.interface', 'storage.type.namespace',
    'keyword.declaration', 'keyword.function', 'keyword.class', 'entity.name.tag', 'storage.type.function.python',
    'storage.type.class.python', 'keyword.control.flow', 'keyword.control.import', 'storage.type.js',
    'storage.type.ts', 'storage.type.tsx', 'storage.type.function.arrow',
  ],
  modifier: [lx('modifier'), 'storage.modifier', 'storage.modifier.async', 'keyword.other.modifier'],
  selfRef: [lx('selfRef'), 'variable.language', 'variable.language.this', 'variable.language.self', 'variable.language.special.self.python'],
  macro: [
    lx('macro'), 'meta.preprocessor', 'keyword.control.directive', 'punctuation.definition.directive',
    'entity.name.function.preprocessor', 'meta.preprocessor.macro', 'entity.name.function.macro',
    'entity.name.function.decorator', 'meta.decorator', 'punctuation.definition.decorator', 'keyword.other.directive',
    'support.function.macro.rust', 'entity.name.function.macro.rust',
  ],
  macroDefinition: [lx('macroDefinition'), 'entity.name.function.preprocessor.definition'],
  macroParam: [lx('macroParam'), 'variable.parameter.preprocessor'],
  formatSpec: [lx('formatSpec'), 'constant.character.format', 'constant.other.placeholder', 'constant.character.format.placeholder'],
  attribute: [lx('attribute'), 'entity.other.attribute-name', 'meta.attribute'],
  pragma: [lx('pragma')],
  dpi: [lx('dpi')],
  type: [
    lx('type'), lx('userType'), 'storage.type', 'support.type', 'entity.name.type', 'entity.name.class',
    'support.class', 'storage.type.built-in', 'storage.type.primitive', 'storage.type.built-in.primitive',
    'entity.other.inherited-class', 'entity.name.type.class', 'support.type.primitive',
  ],
  typeDeclaration: [lx('typeDeclaration')],
  typeLibrary: [lx('typeLibrary'), 'support.class.builtin', 'support.type.builtin', 'support.type.python'],
  namespace: [lx('namespace'), 'entity.name.namespace', 'entity.name.type.namespace', 'entity.name.module', 'entity.name.type.module'],
  function: [
    lx('function'), 'entity.name.function', 'support.function', 'meta.function-call', 'meta.function-call.generic',
    'variable.function', 'entity.name.function.member', 'support.function.builtin',
  ],
  functionDeclaration: [lx('functionDeclaration'), 'meta.definition.function entity.name.function', 'entity.name.function.definition'],
  functionLibrary: [lx('functionLibrary'), 'support.function.system', 'support.function.builtin.shell'],
  phase: [lx('phase')],
  string: [lx('string'), 'string', 'string.quoted', 'string.template', 'string.unquoted', 'meta.string', 'punctuation.definition.string'],
  number: [lx('number'), lx('numberBase'), 'constant.numeric', 'constant.language.boolean', 'constant.language'],
  numberXZ: [lx('numberXZ')],
  constant: [
    lx('constant'), 'variable.other.constant', 'constant.other', 'variable.other.enummember', 'support.constant',
    'entity.name.constant', 'variable.other.makefile', 'variable.other.normal.shell', 'variable.other.tcl',
    'variable.other.readwrite.global.perl', 'variable.other.predefined.perl',
  ],
  nullLiteral: [lx('nullLiteral'), 'constant.language.null', 'constant.language.undefined', 'constant.language.none'],
  verbosityNone: [lx('verbosityNone')],
  verbosityLow: [lx('verbosityLow')],
  verbosityMedium: [lx('verbosityMedium')],
  verbosityHigh: [lx('verbosityHigh')],
  verbosityFull: [lx('verbosityFull')],
  verbosityDebug: [lx('verbosityDebug')],
  time: [lx('time'), lx('timeOperator'), lx('timeLiteral'), 'comment log.date', 'log.date'],
  clock: [lx('clock')],
  reset: [lx('reset')],
  verification: [lx('verification'), lx('verificationOperator')],
  verificationName: [lx('verificationName')],
  illegalBins: [lx('illegalBins')],
  ignoreBins: [lx('ignoreBins')],
  severityInfo: [lx('severityInfo'), 'log.info'],
  severityWarning: [lx('severityWarning'), 'log.warning'],
  severityError: [lx('severityError'), 'log.error', 'log.exceptiontype'],
  severityFatal: [lx('severityFatal')],
  tagTodo: [lx('tagTodo')],
  tagFixme: [lx('tagFixme')],
  tagNote: [lx('tagNote')],
  tagWaive: [lx('tagWaive')],
  invalid: ['invalid', 'invalid.illegal'],
  deprecated: ['invalid.deprecated'],
  logPass: [lx('logPass')],
  logFail: [lx('logFail')],
  logPath: [lx('logPath')],
  logHierarchy: [lx('logHierarchy')],
  logHeading: [lx('logHeading')],
  heading: ['markup.heading', 'entity.name.section.markdown', 'markup.heading.setext', 'punctuation.definition.heading.markdown'],
  link: ['markup.underline.link', 'string.other.link', 'meta.link.inline.markdown string.other.link.title.markdown'],
  emphasis: ['markup.italic'],
  strong: ['markup.bold'],
  inlineCode: ['markup.inline.raw', 'markup.raw.block.markdown', 'markup.fenced_code.block.markdown'],
  quote: ['markup.quote'],
  listMarker: ['punctuation.definition.list.begin.markdown', 'markup.list.numbered', 'markup.list.unnumbered', 'beginning.punctuation.definition.list'],
  inserted: ['markup.inserted', 'meta.diff.header.to-file', 'punctuation.definition.inserted'],
  deleted: ['markup.deleted', 'meta.diff.header.from-file', 'punctuation.definition.deleted'],
  changed: ['markup.changed', 'punctuation.definition.changed'],
  key: [
    'support.type.property-name', 'support.type.property-name.json', 'entity.name.tag.yaml',
    'meta.mapping.key', 'keyword.other.definition.ini', 'entity.name.tag.toml', 'support.type.property-name.toml',
  ],
  regexp: ['string.regexp', 'constant.other.character-class.regexp', 'keyword.operator.quantifier.regexp'],
  escape: [lx('escape'), 'constant.character.escape', 'constant.character', 'constant.other.character-class.escape'],
};
