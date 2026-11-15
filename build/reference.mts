// Writes docs/colors-and-icons.md: every color and icon in Posedge, with what it means, read from design/
// so it can never drift from the themes. Meant to be handed to a person or an AI agent as the full reference.
//
//   node build/reference.mts   (part of `npm run build`; `npm run verify` fails if it is stale)

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { renderCode } from './preview.mts';
import { DAYLIGHT_HUES, HUES, VARIANTS, VARIANT_IDS, type SyntaxHues } from '../design/palette.mts';
import { LEGEND, ROLE_NAMES, rolesFor, type Role } from '../design/roles.mts';
import { SV_KEYWORDS, VERILOG_KEYWORDS, type KeywordFamily } from '../design/keywords.mts';
import { UVM_BASE_CLASSES, UVM_ROLES } from '../design/uvm.mts';
import { workbenchColors } from '../design/workbench.mts';
import { FILES, FOLDERS, ICON_COLORS, ICON_COLORS_LIGHT, type IconColor } from '../design/icons/registry.mts';
import { ROLE_ICONS } from '../design/icons/roles.mts';
import { DARK_TONE, LIGHT_TONE } from '../design/icons/shapes.mts';

const ROOT = join(import.meta.dirname, '..');

/** What each color role is for. Every role must be here, so a new one cannot go undocumented. */
const ROLE_INFO: Record<Role, string> = {
  fg: 'Default text: identifiers, signal and variable names',
  comment: 'Comments',
  punctuation: 'Punctuation, and every bracket `()` `[]` `{}` at every nesting depth (static, no rainbow)',
  operator: 'Operators, including word operators `and` `or` `not` `xor` `nand` `nor` `xnor`',
  variable: 'Variables (same as default text)',
  label: 'Block labels, such as `begin : loop` and `end : loop`',
  port: 'Named port connections, such as `.pclk(pclk)`',
  keyword: 'Structure and control keywords: the skeleton of the code (full list below)',
  modifier: 'Qualifiers: `virtual` `local` `protected` `static` `automatic` `const` `extern` `pure` `input` `output` `ref` …',
  selfRef: '`this` and `super`',
  macro: 'Every backtick token: `` `ifdef `` `` `define `` `` `include `` `` `uvm_info `` `` `uvm_component_utils `` …',
  macroDefinition: 'The name being defined after `` `define `` (bold = declared here)',
  macroParam: 'Parameters inside a macro definition',
  formatSpec: 'Format specifiers and escapes inside strings: `%0d` `%h` `%s` `\\n`',
  attribute: 'Attributes: `(* keep *)`',
  pragma: 'Tool pragmas in comments: `synopsys translate_off`, `pragma coverage off`, `verilator lint_off`',
  dpi: 'DPI imports and exports: `import "DPI-C"`',
  type: 'Types: `bit` `logic` `int` `string` `enum` `struct`, and user types such as `apb_item`',
  typeDeclaration: 'A type at its declaration: the class, typedef, struct or enum name being declared (bold)',
  typeLibrary: 'Library types: every `uvm_*` class, `mailbox`, `semaphore`, `process`, `type_id`',
  namespace: 'Package names in `pkg::name` references',
  function: 'Function and task calls, and `new`',
  functionDeclaration: 'A function or task name at its declaration only (bold). Calls such as `super.new(name)` stay plain',
  functionLibrary: 'System tasks and functions: `$display` `$sformatf` `$time` `$urandom` …',
  phase: 'UVM phases (`build_phase` … `final_phase`) and `raise_objection` / `drop_objection` / `set_drain_time`',
  string: 'Strings',
  number: 'Numbers: `32`, `8\'hFF`, `1\'b0`, `10.5`',
  numberXZ: 'X and Z digits in literals: `\'x`, `8\'bxx01`, `\'z` (an unknown value is a problem)',
  constant: 'Constants: parameters, enum members, `UVM_ALL_ON`, `UVM_HEX`',
  nullLiteral: '`null`',
  verbosityNone: '`UVM_NONE`: always prints, so it stands out most (bold)',
  verbosityLow: '`UVM_LOW`',
  verbosityMedium: '`UVM_MEDIUM` (same as numbers)',
  verbosityHigh: '`UVM_HIGH`',
  verbosityFull: '`UVM_FULL`',
  verbosityDebug: '`UVM_DEBUG`: least likely to print, so the least contrast',
  time: 'Time and concurrency: `initial` `always_ff` `fork` `join_none` `wait` `posedge` `@` `#10ns` `##2` `->`',
  clock: 'Clock signals by name: `clk`, `pclk`, `sys_clk`, `clk_i`',
  reset: 'Reset signals by name: `rst_n`, `presetn`, `rst_ni` (calls such as `reset_signals()` are not affected)',
  verification: 'Assertions, coverage, constraints and randomization: `assert` `cover` `property` `covergroup` `bins` `constraint` `rand` `inside` `|->` `|=>`',
  verificationName: 'Names of properties, sequences, covergroups, coverpoints and constraints',
  illegalBins: '`illegal_bins`: hitting one is an error',
  ignoreBins: '`ignore_bins`: dimmed, because ignored',
  severityInfo: 'The ID of `` `uvm_info("ID", …) ``, `uvm_report_info`, `$info` and `UVM_INFO`: neutral on purpose, only problems get color',
  severityWarning: 'The ID of `` `uvm_warning("ID", …) ``, `$warning` and `UVM_WARNING`',
  severityError: 'The ID of `` `uvm_error("ID", …) ``, `$error` and `UVM_ERROR`',
  severityFatal: 'The ID of `` `uvm_fatal("ID", …) ``, `$fatal` and `UVM_FATAL` (bold, not underlined)',
  tagTodo: '`TODO` in comments',
  tagFixme: '`FIXME` and `BUG` in comments',
  tagNote: '`NOTE` in comments',
  tagWaive: '`WAIVE` and `WAIVER` in comments',
  invalid: 'Invalid code',
  deprecated: 'Deprecated code',
  logPass: 'Simulation logs: `TEST PASSED`, and zero counts in the UVM report summary',
  logFail: 'Simulation logs: `TEST FAILED`, and non-zero error counts',
  logPath: 'Simulation logs: file paths',
  logHierarchy: 'Simulation logs: hierarchy such as `uvm_test_top.env.agent`',
  logHeading: 'Simulation logs: report headings',
  heading: 'Markdown headings',
  link: 'Links',
  emphasis: 'Markdown emphasis',
  strong: 'Markdown strong text',
  inlineCode: 'Markdown inline code',
  quote: 'Markdown quotes',
  listMarker: 'Markdown list markers',
  inserted: 'Diffs: added lines',
  deleted: 'Diffs: removed lines',
  changed: 'Diffs: changed lines',
  key: 'Keys in JSON and YAML',
  regexp: 'Regular expressions',
  escape: 'Escape sequences',
};

const HUE_INFO: Record<keyof SyntaxHues, string> = {
  keyword: 'Keywords: the skeleton of the code. Owner\'s pick',
  macro: 'Every macro and directive. Owner\'s pick, also the UI accent',
  type: 'Types. Owner\'s pick',
  function: 'Functions, tasks and UVM phases. Owner\'s pick',
  string: 'Strings',
  number: 'Numbers, constants, `null`, and the UVM verbosity ramp',
  time: 'Time and concurrency, clocks and resets',
  verification: 'Assertions, coverage, constraints, randomization',
  modifier: 'Qualifiers such as `virtual`, and `this` / `super`',
  error: 'Errors only: `uvm_error` / `uvm_fatal` IDs, X/Z digits, `illegal_bins`',
  warning: 'Warnings only: `uvm_warning` IDs, `TODO`',
  ignore: '`ignore_bins`',
};

const FAMILY_INFO: Record<KeywordFamily, string> = {
  keyword: 'Keywords (structure and control)',
  modifier: 'Modifiers (qualifiers)',
  selfRef: 'Self references',
  type: 'Types',
  time: 'Time and concurrency',
  verification: 'Verification',
  illegalBins: 'Illegal bins (error color)',
  ignoreBins: 'Ignore bins (dimmed)',
  operator: 'Word operators (operator color)',
  function: 'Function color',
  null: 'Constant color',
};

const ICON_INFO: Record<IconColor, string> = {
  hdl: 'HDL sources, the same cyan as types in code',
  verification: 'Verification files, the same teal as assertions and coverage',
  time: 'Waves and timing, the same blue as time in code',
  automation: 'Scripts, flows and models, the same green as functions',
  directive: 'Tool configuration, filelists and constraints, the same orange as macros',
  data: 'Memory images, registers, and the sequence family, the same violet as numbers',
  silicon: 'Physical design, netlists and FPGA, the same orange-red as keywords',
  neutral: 'Logs and generic formats',
  docs: 'Documents',
  generated: 'Tool output',
  accent: 'Packaged extensions',
};

const NAMES = Object.fromEntries(VARIANT_IDS.map((id) => [id, VARIANTS[id].name.replace('Posedge ', '')]));
const code = (s: string): string => `\`${s}\``;
const list = (items: string[]): string => items.map(code).join(' ');
const style = (s: string): string => s || 'plain';
const table = (head: string[], rows: string[][]): string =>
  [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map(cell).join(' | ')} |`)].join('\n');
// A | inside a cell (the SVA operators |-> and |=>) would end the cell, so it is escaped.
function cell(text: string): string {
  return text.replace(/\|/g, '\\|').replace(/\n/g, ' ');
}

function check(): void {
  for (const r of ROLE_NAMES) if (!ROLE_INFO[r]) throw new Error(`build/reference.mts: describe the role "${r}"`);
  for (const c of Object.keys(ICON_COLORS)) if (!ICON_INFO[c as IconColor]) throw new Error(`build/reference.mts: describe the icon color "${c}"`);
  for (const f of Object.keys(SV_KEYWORDS)) if (!FAMILY_INFO[f as KeywordFamily]) throw new Error(`build/reference.mts: describe the keyword family "${f}"`);
}

function colorsSection(): string {
  const roles = Object.fromEntries(VARIANT_IDS.map((id) => [id, rolesFor(VARIANTS[id])]));
  const hc = VARIANTS.highContrast.syntax;
  const surfaces = (['editor', 'sidebar', 'chrome', 'widget', 'border', 'lineHighlight', 'selection'] as const).map((k) => [
    k,
    ...VARIANT_IDS.map((id) => code(VARIANTS[id].surface[k])),
  ]);
  const inks = (['fg', 'bright', 'muted', 'comment', 'operator', 'punctuation'] as const).map((k) => [k, ...VARIANT_IDS.map((id) => code(VARIANTS[id].ink[k]))]);
  const ui = [
    ['Accent (cursor, focus, active tab, clock)', ...VARIANT_IDS.map((id) => code(VARIANTS[id].accent))],
    ['Accent fill (buttons, badges, selected rows)', ...VARIANT_IDS.map((id) => code(VARIANTS[id].accentFill))],
    ...(
      [
        ['Status bar background', 'statusBar.background'],
        ['Selected list row', 'list.activeSelectionBackground'],
        ['Clock time', 'posedge.clockForeground'],
        ['Clock date', 'posedge.dateForeground'],
        ['Unmatched bracket', 'editorBracketHighlight.unexpectedBracket.foreground'],
        ['Terminal red', 'terminal.ansiRed'],
        ['Terminal yellow', 'terminal.ansiYellow'],
        ['Terminal green', 'terminal.ansiGreen'],
        ['Terminal blue', 'terminal.ansiBlue'],
        ['Terminal cyan', 'terminal.ansiCyan'],
        ['Terminal magenta', 'terminal.ansiMagenta'],
      ] as const
    ).map(([label, key]) => [`${label} (${code(key)})`, ...VARIANT_IDS.map((id) => code(workbenchColors(VARIANTS[id])[key] ?? '-'))]),
  ];
  const hues = (Object.keys(HUES) as Array<keyof SyntaxHues>).map((k) => [code(k), HUE_INFO[k], code(HUES[k]), code(DAYLIGHT_HUES[k]), code(hc[k])]);
  const roleRows = ROLE_NAMES.map((r) => [code(r), ROLE_INFO[r], style(roles.graphite[r].fontStyle), ...VARIANT_IDS.map((id) => code(roles[id][r].fg))]);

  return `## Color themes

| Theme | Base | Editor background |
|---|---|---|
${VARIANT_IDS.map((id) => `| ${VARIANTS[id].name} | ${VARIANTS[id].type} | ${code(VARIANTS[id].surface.editor)} |`).join('\n')}

Graphite is the default. Graphite and Midnight share every syntax hue; Midnight's background and text are darker, and its
comments use the owner's pick \`#696D70\` (Graphite lifts them to \`#767B80\` for contrast). Daylight is the light theme, with
the same hue families deepened to read on paper. High Contrast has a black background, and every token reaches 7:1 contrast.

### The color language

- **One meaning per hue.** Red and yellow appear in code only for errors and warnings.
- **A keyword never changes color**, in any context or at any nesting depth, and opener/closer pairs (\`class\`/\`endclass\`,
  \`begin\`/\`end\`, \`fork\`/\`join_none\`) always match.
- **Every macro has one color**: every backtick token.
- **UVM message IDs take their severity color**: the ID in \`\` \`uvm_error("ID", …) \`\` is red, in \`\` \`uvm_warning \`\` yellow.
- **Bold means "declared here"**: \`\` \`define \`\` names, class names and function names at their declaration only.
- **Italic marks a qualifier or a library name**: modifiers, \`this\`/\`super\`, UVM and std types, \`$\` system tasks, labels.
- **Brackets are static**: \`()\` \`[]\` \`{}\` keep the punctuation color at every depth, in every language. Only a bracket with
  no partner turns red.
- Semantic tokens from language servers use the same colors.

### Syntax hues

These are the base colors. The roles below are built from them.

${table(['Hue', 'Used for', `${NAMES.graphite} / ${NAMES.midnight}`, NAMES.daylight, NAMES.highContrast], hues)}

### Every role, per theme

Each role is what the lexer marks a piece of code as. Style applies to all themes.

${table(['Role', 'What it colors', 'Style', ...VARIANT_IDS.map((id) => NAMES[id])], roleRows)}

### Keyword families

A word's color depends on the word alone. SystemVerilog uses all of these; Verilog files use only the IEEE 1364-2005 words, so
SystemVerilog-only words such as \`logic\`, \`rand\` and \`bit\` stay plain identifiers there.

${(Object.keys(SV_KEYWORDS) as KeywordFamily[])
  .map((f) => `- **${FAMILY_INFO[f]}** (role ${code(f === 'null' ? 'nullLiteral' : f === 'operator' ? 'operator' : f)}, ${SV_KEYWORDS[f].length} words, ${VERILOG_KEYWORDS[f].length} in Verilog): ${list(SV_KEYWORDS[f])}`)
  .join('\n')}

### Surfaces and text

${table(['Surface', ...VARIANT_IDS.map((id) => NAMES[id])], surfaces)}

${table(['Text', ...VARIANT_IDS.map((id) => NAMES[id])], inks)}

### Key interface colors

${table(['Color', ...VARIANT_IDS.map((id) => NAMES[id])], ui)}

The README legend lists the most important roles: ${LEGEND.map((l) => l.label).join(', ')}.`;
}

function iconsSection(): string {
  const iconColors = (Object.keys(ICON_COLORS) as IconColor[]).map((c) => [code(c), ICON_INFO[c], code(ICON_COLORS[c]), code(ICON_COLORS_LIGHT[c])]);
  const folders = FOLDERS.map((f) => [code(f.id), f.color === 'generated' ? 'gear, dimmer when closed' : f.emblem, list(f.names)]);
  const files = FILES.map((f) => [
    code(f.id),
    f.label ? `page with a ${code(f.label)} tag` : `page with a ${f.emblem} emblem`,
    code(f.color),
    list((f.extensions ?? []).map((e) => `.${e}`)),
    list(f.fileNames ?? []),
  ]);
  const bases = (id: string): string[] => Object.entries(UVM_BASE_CLASSES).filter(([, r]) => r === id).map(([c]) => c);
  const roles = UVM_ROLES.map((r) => [
    `${r.label} (${code(r.id)})`,
    ROLE_ICONS[r.id].look,
    code(ROLE_ICONS[r.id].color),
    code(r.badge),
    list(bases(r.id)) || '-',
    list([...r.suffixes, ...(r.names ?? [])]),
  ]);

  return `## File icons

Two icon themes with the same art: **Posedge Icons** (\`posedge-icons\`), where open folders show a small animated clock
trace, and **Posedge Icons (Still)** (\`posedge-icons-still\`), with no motion. Each has a dark set and a light set, chosen by
VS Code from the color theme's base. File icons are 16 px wide, drawn on a 16×18 canvas. The Explorer's folder arrows are hidden.

### Icon colors

Icons speak the same color language as the code. At rest, file icon colors are faded toward the background (dark set
${Math.round(DARK_TONE.fade * 100)}%, light set ${Math.round(LIGHT_TONE.fade * 100)}%), so nothing competes with an open folder.

${table(['Color', 'Meaning', 'Dark set', 'Light set'], iconColors)}

### Folders: an on/off signal, like Ayu

- **Closed folder:** a flat, colorless gray silhouette (${code(DARK_TONE.off)} dark, ${code(LIGHT_TONE.off)} light) with its
  emblem barely visible. Tool output folders are dimmer still.
- **Open folder:** the same bright amber outline for every kind (${code(DARK_TONE.lit)} dark, ${code(LIGHT_TONE.lit)} light),
  lit from inside, with a clock trace across it and an LED in the corner.
- A folder's kind only changes its emblem. Matching is by exact folder name, case-insensitive.

${table(['Kind', 'Emblem', 'Folder names'], folders)}

### Files

A page with a colored tag band and a dot-matrix label, or a page with an emblem. Any other file gets a plain gray page.

${table(['Kind', 'Icon', 'Color', 'Extensions', 'File names'], files)}

### Class icons for SystemVerilog files

The Posedge extension reads \`.sv\`, \`.svh\` and \`.svi\` files as text and gives each file the pictogram of the class it
declares, following \`extends\` chains across files. When no UVM base class is found, the class name and then the file name
are matched against the suffixes. The same roles give the two-letter badge beside the file name.

${table(['Role', 'Picture', 'Color', 'Badge', 'From base class', 'Or a name ending in'], roles)}`;
}

check();
const doc = `# Posedge: every color and icon

Generated from \`design/\` by \`build/reference.mts\`. Do not edit by hand: run \`npm run build\`. Version ${(await import('../package.json', { with: { type: 'json' } })).default.version}.

Posedge is a VS Code extension for SystemVerilog and UVM verification engineers: four color themes, a lexer that guarantees
consistent colors, two file icon themes, class icons, UVM role badges and a status-bar clock. Every color carries a meaning.

${colorsSection()}

${iconsSection()}

## Where it comes from

| To change | Edit |
|---|---|
| A raw color | \`design/palette.mts\` |
| Which hue and style a role uses, contrast rules | \`design/roles.mts\` |
| Which family a keyword belongs to | \`design/keywords.mts\` |
| UVM names, roles, badges and suffixes | \`design/uvm.mts\` |
| Interface colors | \`design/workbench.mts\` |
| Which files and folders get which icon | \`design/icons/registry.mts\` |
| Class pictograms and their \`look\` | \`design/icons/roles.mts\` |
| Folder and page shapes, fading | \`design/icons/shapes.mts\` |

Then run \`npm run build\`, which also regenerates this file. \`AGENTS.md\` has the rules and the history behind each choice.

## Not part of Posedge

The project owner's own VS Code has extras that other Posedge users do not get, so screenshots from that machine can look
different: JetBrains Mono in the Explorer and on tab names, no filled row backgrounds, the current file and its parent folder
names in orange, open folder names semi-bold, a soft glow on the current file's icon, and Move Up / Move Down to set the order
of files inside a folder. They come from patches to VS Code itself, not from the themes or icons.
`;
mkdirSync(join(ROOT, 'docs'), { recursive: true });
writeFileSync(join(ROOT, 'docs', 'colors-and-icons.md'), doc);
console.log('wrote docs/colors-and-icons.md');

// `--html <file>` also writes a visual version of the same reference: swatches, real highlighted code and the icon files.
const at = process.argv.indexOf('--html');
if (at > 0) {
  writeFileSync(process.argv[at + 1], await htmlPage());
  console.log(`wrote ${process.argv[at + 1]}`);
}

async function htmlPage(): Promise<string> {
  const esc = (s: string): string => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const inline = (md: string): string => esc(md).replace(/``\s?(.+?)\s?``|`([^`]+)`/g, (_, a, b) => `<code>${a ?? b}</code>`);
  const svg = (rel: string): string => `data:image/svg+xml;base64,${readFileSync(join(ROOT, 'icons', 'svg', rel)).toString('base64')}`;
  const pair = (rel: string, alt: string): string =>
    `<span class="tiles"><img class="tile dark" src="${svg(rel)}" alt="${esc(alt)}, dark set" width="20" height="20"><img class="tile light" src="${svg(`light/${rel}`)}" alt="${esc(alt)}, light set" width="20" height="20"></span>`;
  const swatch = (hex: string, label = hex): string => `<span class="sw"><i style="background:${hex}"></i><code>${esc(label)}</code></span>`;
  const roles = Object.fromEntries(VARIANT_IDS.map((id) => [id, rolesFor(VARIANTS[id])]));
  const theme = (id: (typeof VARIANT_IDS)[number]) => JSON.parse(readFileSync(join(ROOT, 'themes', `${VARIANTS[id].file}-color-theme.json`), 'utf8'));
  const sample = 'samples/verif/agents/apb/apb_driver.sv';
  const panel = async (id: (typeof VARIANT_IDS)[number]): Promise<string> => {
    const v = VARIANTS[id];
    return `<figure class="code" style="--cbg:${v.surface.editor};--cno:${v.ink.faint};--cbd:${v.surface.border}"><figcaption>${esc(v.name)}</figcaption><div class="scroll"><div class="lines">${await renderCode(sample, theme(id), { from: 7, to: 30 })}</div></div></figure>`;
  };
  const g = VARIANTS.graphite;
  const d = VARIANTS.daylight;
  const head = (cells: string[]): string => `<thead><tr>${cells.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`;
  const bases = (id: string): string[] => Object.entries(UVM_BASE_CLASSES).filter(([, r]) => r === id).map(([c]) => c);
  const codes = (items: string[]): string => items.map((i) => `<code>${esc(i)}</code>`).join(' ');
  const familyRole: Record<KeywordFamily, Role> = { keyword: 'keyword', modifier: 'modifier', selfRef: 'selfRef', type: 'type', time: 'time', verification: 'verification', illegalBins: 'illegalBins', ignoreBins: 'ignoreBins', operator: 'operator', function: 'function', null: 'nullLiteral' };

  return `<title>Posedge Colors and Icons</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600&family=JetBrains+Mono:wght@400;600&display=swap">
<style>
/* Layout: one reading column for prose; tables and code break out to full width and scroll inside themselves.
   The page wears Posedge itself: Graphite in dark mode, Daylight in light mode. */
:root {
  --bg: ${g.surface.sidebar}; --panel: ${g.surface.editor}; --line: ${g.surface.border}; --fg: ${g.ink.fg}; --muted: ${g.ink.muted};
  --accent: ${g.accent}; --chip: ${g.surface.widget};
  --sans: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif; --mono: "JetBrains Mono", "Cascadia Mono", Consolas, monospace;
  color-scheme: dark;
}
@media (prefers-color-scheme: light) { :root:not([data-theme="dark"]) {
  --bg: ${d.surface.sidebar}; --panel: ${d.surface.editor}; --line: ${d.surface.border}; --fg: ${d.ink.fg}; --muted: ${d.ink.muted};
  --accent: ${d.accent}; --chip: ${d.surface.widget}; color-scheme: light } }
:root[data-theme="light"] {
  --bg: ${d.surface.sidebar}; --panel: ${d.surface.editor}; --line: ${d.surface.border}; --fg: ${d.ink.fg}; --muted: ${d.ink.muted};
  --accent: ${d.accent}; --chip: ${d.surface.widget}; color-scheme: light }
body { background: var(--bg); color: var(--fg); font: 15px/1.6 var(--sans); margin: 0;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); padding-block: 32px 64px }
main { max-width: 1180px; margin: 0 auto; display: grid; gap: 40px }
.prose { max-width: 68ch }
h1, h2, h3 { text-wrap: balance; line-height: 1.25; margin: 0 }
h1 { font-size: 30px; font-weight: 600 } h1 b { color: var(--accent); font-weight: 600 }
h2 { font-size: 21px; font-weight: 600; padding-top: 8px; border-top: 1px solid var(--line) }
h3 { font-size: 16px; font-weight: 600; color: var(--muted); letter-spacing: .04em; text-transform: uppercase }
section { display: grid; gap: 16px; min-width: 0 }
p, ul { margin: 0 } ul { padding-left: 20px; display: grid; gap: 4px }
code { font: 13px var(--mono) } p code, li code, td code { background: var(--chip); padding: 1px 5px; border-radius: 4px }
.lead { color: var(--muted) }
.wrap { overflow-x: auto; border: 1px solid var(--line); border-radius: 8px; background: var(--panel) }
table { border-collapse: collapse; width: 100%; font-size: 13.5px }
th, td { text-align: left; vertical-align: top; padding: 8px 12px; border-bottom: 1px solid var(--line) }
th { font-weight: 600; color: var(--muted); white-space: nowrap; position: sticky; top: 0; background: var(--panel) }
tr:last-child td { border-bottom: 0 }
td.n { white-space: nowrap }
.sw { display: inline-flex; align-items: center; gap: 6px; white-space: nowrap }
.sw i { width: 16px; height: 16px; border-radius: 4px; border: 1px solid #8884; flex: none }
td .sw code { background: none; padding: 0 }
.themes { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px }
.theme { border-radius: 8px; padding: 14px 16px; display: grid; gap: 4px; font: 13px var(--mono); border: 1px solid #8884 }
.theme b { font: 600 15px var(--sans) }
.codes { display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 520px), 1fr)); gap: 12px }
figure.code { margin: 0; background: var(--cbg); border: 1px solid var(--cbd); border-radius: 8px; min-width: 0 }
figure.code figcaption { font: 600 12px var(--sans); color: var(--cno); padding: 8px 12px 0; letter-spacing: .04em; text-transform: uppercase }
figure.code .scroll { overflow-x: auto; padding: 8px 0 12px }
.lines { font: 12.5px/1.55 var(--mono); white-space: pre; width: max-content }
.ln { display: flex } .no { display: inline-block; min-width: 34px; padding-right: 12px; text-align: right; color: var(--cno) }
.tiles { display: inline-flex; gap: 4px } .tile { width: 28px; height: 28px; padding: 4px; border-radius: 6px; box-sizing: border-box; flex: none }
.tile.dark { background: ${g.surface.sidebar}; border: 1px solid #ffffff1f } .tile.light { background: ${d.surface.sidebar}; border: 1px solid #0000001f }
.words code { display: inline-block; margin: 0 4px 4px 0 }
.states { display: flex; flex-wrap: wrap; gap: 16px; align-items: center }
.states figure { margin: 0; display: grid; gap: 6px; justify-items: start; font-size: 13px; color: var(--muted) }
.states .tile { width: 44px; height: 44px; padding: 8px }
:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }
</style>
<main>
<header class="prose" style="display:grid;gap:10px">
  <h1><b>Posedge</b> colors and icons</h1>
  <p class="lead">Every color and icon in the Posedge themes, with what it means. Generated from the design data of version ${esc((JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { version: string }).version)}, the same source the themes are built from. The Markdown version lives in the repository at <code>docs/colors-and-icons.md</code>.</p>
</header>

<section>
  <h2>Four themes</h2>
  <div class="themes">${VARIANT_IDS.map((id) => {
    const v = VARIANTS[id];
    const r = roles[id];
    return `<div class="theme" style="background:${v.surface.editor};color:${v.ink.fg}"><b>${esc(v.name)}</b><span><span style="color:${r.keyword.fg}">class</span> <span style="color:${r.typeDeclaration.fg};font-weight:700">apb_driver</span> <span style="color:${r.keyword.fg}">extends</span> <span style="color:${r.typeLibrary.fg};font-style:italic">uvm_driver</span></span><span style="color:${v.ink.comment}">// ${v.type} · ${v.surface.editor}</span></div>`;
  }).join('')}</div>
  <div class="prose"><ul>
    <li><b>One meaning per hue.</b> Red and yellow appear in code only for errors and warnings.</li>
    <li><b>A keyword never changes color</b>, in any context or nesting depth, and opener/closer pairs always match.</li>
    <li><b>Every macro has one color</b>: every backtick token.</li>
    <li><b>UVM message IDs take their severity color</b>: <code>\`uvm_error("ID", …)</code> red, <code>\`uvm_warning</code> yellow.</li>
    <li><b>Bold means declared here</b>: <code>\`define</code> names, class names and function names at their declaration only.</li>
    <li><b>Italic marks a qualifier or a library name</b>: modifiers, <code>this</code>/<code>super</code>, UVM types, system tasks.</li>
    <li><b>Brackets are static</b>: one color at every depth, in every language. Only a bracket with no partner turns red.</li>
  </ul></div>
</section>

<section>
  <h2>Real code, real colors</h2>
  <p class="prose lead">Highlighted by the Posedge lexer and themes, exactly as VS Code paints it.</p>
  <div class="codes">${await panel('graphite')}${await panel('daylight')}</div>
</section>

<section>
  <h2>Syntax hues</h2>
  <div class="wrap"><table>${head(['Hue', 'Used for', `${NAMES.graphite} / ${NAMES.midnight}`, NAMES.daylight, NAMES.highContrast])}<tbody>${(Object.keys(HUES) as Array<keyof SyntaxHues>)
    .map((k) => `<tr><td class="n"><code>${k}</code></td><td>${inline(HUE_INFO[k])}</td><td>${swatch(HUES[k])}</td><td>${swatch(DAYLIGHT_HUES[k])}</td><td>${swatch(VARIANTS.highContrast.syntax[k])}</td></tr>`)
    .join('')}</tbody></table></div>
</section>

<section>
  <h2>Every role, per theme</h2>
  <p class="prose lead">Each role is what the lexer marks a piece of code as. The style is the same in every theme.</p>
  <div class="wrap"><table>${head(['Role', 'What it colors', 'Style', ...VARIANT_IDS.map((id) => NAMES[id])])}<tbody>${ROLE_NAMES.map(
    (r) => `<tr><td class="n"><code>${r}</code></td><td>${inline(ROLE_INFO[r])}</td><td class="n">${style(roles.graphite[r].fontStyle)}</td>${VARIANT_IDS.map((id) => `<td>${swatch(roles[id][r].fg)}</td>`).join('')}</tr>`,
  ).join('')}</tbody></table></div>
</section>

<section>
  <h2>Keyword families</h2>
  <p class="prose lead">A word's color depends on the word alone. Verilog files use only the IEEE 1364-2005 words, so SystemVerilog-only words such as <code>logic</code> and <code>rand</code> stay plain there. Shown in Graphite.</p>
  <div class="wrap"><table>${head(['Family', 'Words'])}<tbody>${(Object.keys(SV_KEYWORDS) as KeywordFamily[])
    .map((f) => {
      const s = roles.graphite[familyRole[f]];
      const css = `color:${s.fg};${s.fontStyle.includes('italic') ? 'font-style:italic;' : ''}background:${g.surface.editor}`;
      return `<tr><td class="n">${esc(FAMILY_INFO[f])}<br><small>${SV_KEYWORDS[f].length} words</small></td><td class="words">${SV_KEYWORDS[f].map((w) => `<code style="${css}">${w}</code>`).join('')}</td></tr>`;
    })
    .join('')}</tbody></table></div>
</section>

<section>
  <h2>Interface colors</h2>
  <div class="wrap"><table>${head(['Color', ...VARIANT_IDS.map((id) => NAMES[id])])}<tbody>${[
    ['Editor background', (id: (typeof VARIANT_IDS)[number]) => VARIANTS[id].surface.editor],
    ['Sidebar and panel', (id: (typeof VARIANT_IDS)[number]) => VARIANTS[id].surface.sidebar],
    ['Title, activity and status bars', (id: (typeof VARIANT_IDS)[number]) => VARIANTS[id].surface.chrome],
    ['Borders', (id: (typeof VARIANT_IDS)[number]) => VARIANTS[id].surface.border],
    ['Text selection', (id: (typeof VARIANT_IDS)[number]) => VARIANTS[id].surface.selection],
    ['Default text', (id: (typeof VARIANT_IDS)[number]) => VARIANTS[id].ink.fg],
    ['Muted text', (id: (typeof VARIANT_IDS)[number]) => VARIANTS[id].ink.muted],
    ['Accent: cursor, focus, active tab, clock', (id: (typeof VARIANT_IDS)[number]) => VARIANTS[id].accent],
    ['Accent fill: buttons, badges, selected rows', (id: (typeof VARIANT_IDS)[number]) => VARIANTS[id].accentFill],
    ['Clock date', (id: (typeof VARIANT_IDS)[number]) => workbenchColors(VARIANTS[id])['posedge.dateForeground']],
    ['Terminal magenta (tool output only)', (id: (typeof VARIANT_IDS)[number]) => workbenchColors(VARIANTS[id])['terminal.ansiMagenta']],
  ]
    .map(([label, get]) => `<tr><td>${esc(label as string)}</td>${VARIANT_IDS.map((id) => `<td>${swatch((get as (i: typeof id) => string)(id))}</td>`).join('')}</tr>`)
    .join('')}</tbody></table></div>
  <p class="prose lead">Terminal red, yellow, green, blue and cyan are the error, warning, function, time and type hues.</p>
</section>

<section>
  <h2>Folders: on or off</h2>
  <p class="prose">Like Ayu's icon theme, a folder is a lamp. Every closed folder is the same flat, colorless gray, and every open folder is the same bright amber outline with a small clock trace running inside (frozen in <b>Posedge Icons (Still)</b>). A folder's kind only changes its faint emblem. Each pair shows the dark set, then the light set.</p>
  <div class="states">
    <figure>${pair('folders/rtl.svg', 'Closed rtl folder')}<span>Closed</span></figure>
    <figure>${pair('folders-open-still/open.svg', 'Open folder')}<span>Open, every kind</span></figure>
    <figure>${pair('folders/generated.svg', 'Closed tool output folder')}<span>Tool output, closed</span></figure>
  </div>
  <div class="wrap"><table>${head(['Closed icon', 'Kind', 'Emblem', 'Folder names (exact, any case)'])}<tbody>${FOLDERS.map(
    (f) => `<tr><td>${pair(`folders/${f.id}.svg`, `${f.id} folder`)}</td><td class="n"><code>${f.id}</code></td><td class="n">${esc(f.emblem)}</td><td>${codes(f.names)}</td></tr>`,
  ).join('')}</tbody></table></div>
</section>

<section>
  <h2>Files</h2>
  <p class="prose">A page with a colored tag and a dot-matrix label, or with an emblem. Colors follow the code: HDL is cyan like types, scripts green like functions, tool configuration orange like macros, waves blue like time. At rest they are faded toward the background so an open folder stands out. Anything else gets a plain gray page ${pair('files/default.svg', 'Plain file')}.</p>
  <div class="wrap"><table>${head(['Icon', 'Kind', 'Color', 'Extensions', 'File names'])}<tbody>${FILES.map(
    (f) => `<tr><td>${pair(`files/${f.id}.svg`, `${f.id} file`)}</td><td class="n"><code>${f.id}</code></td><td class="n">${swatch(ICON_COLORS[f.color], f.color)}</td><td>${codes((f.extensions ?? []).map((e) => `.${e}`))}</td><td>${codes(f.fileNames ?? [])}</td></tr>`,
  ).join('')}</tbody></table></div>
</section>

<section>
  <h2>Class icons for SystemVerilog files</h2>
  <p class="prose">Posedge reads <code>.sv</code>, <code>.svh</code> and <code>.svi</code> files and shows the picture of the class each one declares, following <code>extends</code> chains across files. Without a UVM base class it matches the class name, then the file name, against the suffixes. The same roles give the two-letter badge beside the file name.</p>
  <div class="wrap"><table>${head(['Icon', 'Role', 'Picture', 'Badge', 'From base class', 'Or a name ending in'])}<tbody>${UVM_ROLES.map(
    (r) => `<tr><td>${pair(`roles/${r.id}.svg`, r.label)}</td><td>${esc(r.label)}<br>${swatch(ICON_COLORS[ROLE_ICONS[r.id].color], ROLE_ICONS[r.id].color)}</td><td>${esc(ROLE_ICONS[r.id].look)}</td><td class="n"><code>${r.badge}</code></td><td>${codes(bases(r.id)) || '-'}</td><td>${codes([...r.suffixes, ...(r.names ?? [])])}</td></tr>`,
  ).join('')}</tbody></table></div>
</section>

<section class="prose">
  <h2>Not part of Posedge</h2>
  <p>The project owner's own VS Code adds JetBrains Mono in the Explorer and on tabs, no filled row backgrounds, the current file and its parent folder in orange, semi-bold open folder names, a glow on the current file's icon, and Move Up / Move Down for files inside a folder. Those come from patches to VS Code itself, not from these themes and icons, so other Posedge users do not have them.</p>
</section>
</main>`;
}
