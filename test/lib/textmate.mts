// Test/preview harness: tokenizes text with the real VS Code TextMate engine (vscode-textmate +
// vscode-oniguruma), using a host grammar plus the Posedge injections, optionally with a theme so
// the exact color and font style VS Code would paint can be asserted.

import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import vsctm from 'vscode-textmate';
import oniguruma from 'vscode-oniguruma';

const require = createRequire(import.meta.url);
export const ROOT = join(import.meta.dirname, '..', '..');

const wasm = readFileSync(require.resolve('vscode-oniguruma/release/onig.wasm'));
const onigReady = oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength));
const onigLib = onigReady.then(() => ({
  createOnigScanner: (sources: string[]) => new oniguruma.OnigScanner(sources),
  createOnigString: (s: string) => new oniguruma.OnigString(s),
}));

export const GRAMMAR_FILES: Record<string, string> = {
  'source.systemverilog': 'test/fixtures/hosts/mshr-h/systemverilog.tmLanguage.json',
  'source.verilog': 'test/fixtures/hosts/mshr-h/verilog.tmLanguage.json',
  'source.verilog-filelist': 'test/fixtures/hosts/mshr-h/verilog-filelist.tmLanguage.json',
  'text.log': 'test/fixtures/hosts/vscode-log/log.tmLanguage.json',
  'posedge.injection.systemverilog': 'syntaxes/posedge-systemverilog.injection.json',
  'posedge.injection.verilog': 'syntaxes/posedge-verilog.injection.json',
  'posedge.injection.log': 'syntaxes/posedge-log.injection.json',
  'posedge.injection.verilog-filelist': 'syntaxes/posedge-filelist.injection.json',
};

const INJECTIONS: Record<string, string[]> = {
  'source.systemverilog': ['posedge.injection.systemverilog'],
  'source.verilog': ['posedge.injection.verilog'],
  'source.verilog-filelist': ['posedge.injection.verilog-filelist'],
  'text.log': ['posedge.injection.log'],
};

export interface ThemeJson {
  colors: Record<string, string>;
  tokenColors: Array<{ scope?: string | string[]; settings: { foreground?: string; fontStyle?: string } }>;
}

export function scopeForFile(file: string): string {
  if (/\.(sv|svh|svi|sva)$/i.test(file)) return 'source.systemverilog';
  if (/\.(v|vh)$/i.test(file)) return 'source.verilog';
  if (/\.(f|vc|flist)$/i.test(file)) return 'source.verilog-filelist';
  if (/\.log$|transcript$/i.test(file)) return 'text.log';
  throw new Error(`No grammar for ${file}`);
}

export async function createRegistry(opts: { theme?: ThemeJson; injections?: boolean } = {}) {
  const { theme, injections = true } = opts;
  const registry = new vsctm.Registry({
    onigLib,
    loadGrammar: async (scopeName: string) => {
      const rel = GRAMMAR_FILES[scopeName];
      if (!rel) return null;
      return vsctm.parseRawGrammar(readFileSync(join(ROOT, rel), 'utf8'), join(ROOT, rel));
    },
    getInjections: (scopeName: string) => (injections ? INJECTIONS[scopeName] : undefined),
  });
  if (theme) {
    registry.setTheme({
      name: 'posedge-test',
      settings: [
        { settings: { foreground: theme.colors['editor.foreground'], background: theme.colors['editor.background'] } },
        ...theme.tokenColors,
      ],
    } as never);
  }
  return registry;
}

export interface Token {
  line: number;
  start: number;
  end: number;
  text: string;
  scopes: string[];
}

export interface StyledChar {
  fg: string;
  fontStyle: number; // bitmask: 1 italic, 2 bold, 4 underline, 8 strikethrough
}

export interface Tokenized {
  lines: string[];
  tokens: Token[];
  /** Per line, per character: the color and style VS Code would paint (only when a theme is set). */
  styles: StyledChar[][];
}

export async function tokenize(text: string, scopeName: string, opts: { theme?: ThemeJson; injections?: boolean } = {}) {
  const registry = await createRegistry(opts);
  const grammar = await registry.loadGrammar(scopeName);
  if (!grammar) throw new Error(`Grammar ${scopeName} failed to load`);
  const colorMap = registry.getColorMap();
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const tokens: Token[] = [];
  const styles: StyledChar[][] = [];
  let stack1 = vsctm.INITIAL;
  let stack2 = vsctm.INITIAL;
  lines.forEach((line, i) => {
    const r1 = grammar.tokenizeLine(line, stack1);
    for (const t of r1.tokens) {
      tokens.push({ line: i, start: t.startIndex, end: Math.min(t.endIndex, line.length), text: line.slice(t.startIndex, t.endIndex), scopes: t.scopes });
    }
    stack1 = r1.ruleStack;
    if (opts.theme) {
      const r2 = grammar.tokenizeLine2(line, stack2);
      const row: StyledChar[] = [];
      const bin = r2.tokens;
      for (let k = 0; k < bin.length; k += 2) {
        const start = bin[k];
        const end = k + 2 < bin.length ? bin[k + 2] : line.length;
        const meta = bin[k + 1];
        const fg = colorMap[(meta >>> 15) & 0x1ff].toUpperCase();
        const fontStyle = (meta >>> 11) & 0xf;
        for (let c = start; c < end; c++) row[c] = { fg, fontStyle };
      }
      styles.push(row);
      stack2 = r2.ruleStack;
    }
  });
  return { lines, tokens, styles } as Tokenized;
}

/** Innermost scope of the token covering (line, col). */
export function scopeAt(t: Tokenized, line: number, col: number): string[] {
  const tok = t.tokens.find((x) => x.line === line && x.start <= col && col < x.end);
  return tok ? tok.scopes : [];
}

export function fontStyleName(bits: number): string {
  const parts: string[] = [];
  if (bits & 1) parts.push('italic');
  if (bits & 2) parts.push('bold');
  if (bits & 4) parts.push('underline');
  if (bits & 8) parts.push('strikethrough');
  return parts.join(' ');
}

/** Finds every occurrence of a whole word (SV identifier boundaries) outside comments and strings. */
export function findCodeWords(t: Tokenized, wordRe: RegExp): Array<{ line: number; col: number; word: string }> {
  const hits: Array<{ line: number; col: number; word: string }> = [];
  t.lines.forEach((text, line) => {
    for (const m of text.matchAll(wordRe)) {
      const col = m.index ?? 0;
      const scopes = scopeAt(t, line, col);
      if (scopes.some((s) => s.startsWith('comment') || s.startsWith('string'))) continue;
      hits.push({ line, col, word: m[0] });
    }
  });
  return hits;
}
