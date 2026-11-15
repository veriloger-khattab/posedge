// Semantic token colors, for language servers that provide them (Sigasi, DVT, slang-server,
// Pylance, clangd, ...). They mirror the TextMate roles so switching a server on or off never
// changes the color language.

import type { Roles, Style } from './roles.mts';

type SemanticStyle = { foreground: string; bold?: boolean; italic?: boolean; underline?: boolean; strikethrough?: boolean };

const toSemantic = (st: Style): SemanticStyle => {
  const out: SemanticStyle = { foreground: st.fg };
  if (st.fontStyle.includes('bold')) out.bold = true;
  if (st.fontStyle.includes('italic')) out.italic = true;
  if (st.fontStyle.includes('underline')) out.underline = true;
  if (st.fontStyle.includes('strikethrough')) out.strikethrough = true;
  return out;
};

export function semanticTokenColors(r: Roles): Record<string, SemanticStyle | { strikethrough: boolean }> {
  const typeKinds = ['class', 'type', 'interface', 'struct', 'enum', 'typeParameter'];
  const rules: Record<string, SemanticStyle | { strikethrough: boolean }> = {
    macro: toSemantic(r.macro),
    'macro.declaration': toSemantic(r.macroDefinition),
    decorator: toSemantic(r.macro),
    function: toSemantic(r.function),
    method: toSemantic(r.function),
    'function.declaration': toSemantic(r.functionDeclaration),
    'method.declaration': toSemantic(r.functionDeclaration),
    'function.defaultLibrary': toSemantic(r.functionLibrary),
    'method.defaultLibrary': toSemantic(r.functionLibrary),
    namespace: toSemantic(r.namespace),
    enumMember: toSemantic(r.constant),
    parameter: toSemantic(r.port),
    variable: toSemantic(r.variable),
    property: toSemantic(r.variable),
    keyword: toSemantic(r.keyword),
    modifier: toSemantic(r.modifier),
    comment: toSemantic(r.comment),
    string: toSemantic(r.string),
    number: toSemantic(r.number),
    regexp: toSemantic(r.regexp),
    operator: toSemantic(r.operator),
    event: toSemantic(r.time),
    label: toSemantic(r.label),
    '*.deprecated': { strikethrough: true },
  };
  for (const k of typeKinds) {
    rules[k] = toSemantic(r.type);
    rules[`${k}.declaration`] = toSemantic(r.typeDeclaration);
    rules[`${k}.defaultLibrary`] = toSemantic(r.typeLibrary);
  }
  return rules;
}
