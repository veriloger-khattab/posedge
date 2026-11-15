// Grammar tests. They tokenize real files with the Verilog-HDL host grammar plus the Posedge
// injections (exactly what VS Code does), then check the colors VS Code would actually paint.
//
//   rule #1  severity colors for UVM message IDs and friends
//   rule #3  a keyword never changes color, and opener/closer pairs share one color
//   rule #4  every macro / directive token has the macro color

import assert from 'node:assert/strict';
import { readdirSync, readFileSync, statSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { test } from 'node:test';
import oniguruma from 'vscode-oniguruma';
import { ROOT, findCodeWords, fontStyleName, scopeAt, scopeForFile, tokenize, type ThemeJson, type Tokenized } from './lib/textmate.mts';
import { SV_KEYWORDS, SV_BRACKET_PAIRS, VERILOG_KEYWORDS, type KeywordFamily } from '../design/keywords.mts';
import { VARIANTS, VARIANT_IDS } from '../design/palette.mts';
import { rolesFor, type Role } from '../design/roles.mts';

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

const STYLE_BITS: Record<string, number> = { italic: 1, bold: 2, underline: 4, strikethrough: 8 };
const styleBits = (fontStyle: string): number =>
  fontStyle.split(' ').filter(Boolean).reduce((acc, s) => acc | STYLE_BITS[s], 0);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

const HDL_FILES = [...walk(join(ROOT, 'samples')), ...walk(join(ROOT, 'test', 'fixtures', 'rules'))].filter((f) =>
  /\.(sv|svh|v)$/.test(f),
);

const themes: Record<string, ThemeJson> = Object.fromEntries(
  VARIANT_IDS.map((id) => [id, JSON.parse(readFileSync(join(ROOT, 'themes', `${VARIANTS[id].file}-color-theme.json`), 'utf8'))]),
);

const cache = new Map<string, Tokenized>();
async function styled(file: string, variant: string): Promise<Tokenized> {
  const key = `${file}|${variant}`;
  if (!cache.has(key)) cache.set(key, await tokenize(readFileSync(file, 'utf8'), scopeForFile(file), { theme: themes[variant] }));
  return cache.get(key)!;
}

// ---------------------------------------------------------------- regex compile check
test('every regex in the generated grammars compiles in Oniguruma', async () => {
  const wasm = readFileSync(join(ROOT, 'node_modules', 'vscode-oniguruma', 'release', 'onig.wasm'));
  await oniguruma.loadWASM(wasm.buffer.slice(wasm.byteOffset, wasm.byteOffset + wasm.byteLength)).catch(() => undefined);
  const dir = join(ROOT, 'syntaxes');
  let count = 0;
  for (const file of readdirSync(dir)) {
    const grammar = JSON.parse(readFileSync(join(dir, file), 'utf8'));
    const visit = (node: unknown): void => {
      if (!node || typeof node !== 'object') return;
      for (const [k, v] of Object.entries(node)) {
        if ((k === 'match' || k === 'begin' || k === 'end') && typeof v === 'string') {
          assert.doesNotThrow(() => new oniguruma.OnigScanner([v]), `${file}: bad regex ${v.slice(0, 120)}`);
          count++;
        } else visit(v);
      }
    };
    visit(grammar);
  }
  assert.ok(count > 100, `expected many regexes, found ${count}`);
});

// ---------------------------------------------------------------- rule #3
for (const variant of VARIANT_IDS) {
  test(`rule #3 [${VARIANTS[variant].name}]: every keyword keeps one color in every context`, async () => {
    const roles = rolesFor(VARIANTS[variant]);
    const seen = new Map<string, Map<string, string>>(); // word -> style -> first location
    for (const file of HDL_FILES) {
      const table = file.endsWith('.v') ? VERILOG_KEYWORDS : SV_KEYWORDS;
      const t = await styled(file, variant);
      for (const [family, words] of Object.entries(table) as Array<[KeywordFamily, string[]]>) {
        if (!words.length) continue;
        const re = new RegExp(`(?<![\\w$\`])(?:${words.join('|')})(?![\\w$])`, 'g');
        for (const hit of findCodeWords(t, re)) {
          const st = t.styles[hit.line][hit.col];
          const key = `${st.fg} ${fontStyleName(st.fontStyle)}`;
          const where = `${relative(ROOT, file)}:${hit.line + 1}:${hit.col + 1}`;
          // The one exception to "one look": `new` is also a declared name, so in a function header
          // it takes the bold of a declaration. Its color may not change, and it is checked below.
          const declaredNew = hit.word === 'new' && /\bfunction\b[^;]*$/.test(t.lines[hit.line].slice(0, hit.col));
          if (!declaredNew) {
            if (!seen.has(hit.word)) seen.set(hit.word, new Map());
            if (!seen.get(hit.word)!.has(key)) seen.get(hit.word)!.set(key, where);
          }
          // ...and it is the color of its family
          const want = roles[FAMILY_ROLE[family]];
          const wantStyle = declaredNew ? roles.functionDeclaration.fontStyle : want.fontStyle;
          assert.equal(st.fg, want.fg.toUpperCase(), `${hit.word} at ${where} should be ${family} ${want.fg}, got ${st.fg}`);
          assert.equal(st.fontStyle, styleBits(wantStyle), `${hit.word} at ${where} has style "${fontStyleName(st.fontStyle)}"`);
        }
      }
    }
    for (const [word, styles] of seen) {
      assert.equal(styles.size, 1, `"${word}" has ${styles.size} different looks: ${[...styles].map(([k, w]) => `${k} @ ${w}`).join(' | ')}`);
    }
    assert.ok(seen.size > 120, `only ${seen.size} distinct keywords were exercised`);
  });

  test(`rule #3 [${VARIANTS[variant].name}]: opener/closer pairs share one color`, async () => {
    const look = new Map<string, string>();
    for (const file of HDL_FILES.filter((f) => !f.endsWith('.v'))) {
      const t = await styled(file, variant);
      const words = [...new Set(SV_BRACKET_PAIRS.flat())];
      for (const hit of findCodeWords(t, new RegExp(`(?<![\\w$\`])(?:${words.join('|')})(?![\\w$])`, 'g'))) {
        const st = t.styles[hit.line][hit.col];
        look.set(hit.word, `${st.fg} ${st.fontStyle}`);
      }
    }
    for (const [open, close] of SV_BRACKET_PAIRS) {
      if (look.has(open) && look.has(close)) assert.equal(look.get(open), look.get(close), `${open}/${close} differ`);
    }
  });

  // ---------------------------------------------------------------- rule #4
  test(`rule #4 [${VARIANTS[variant].name}]: every macro and directive has the macro color`, async () => {
    const macro = rolesFor(VARIANTS[variant]).macro;
    let count = 0;
    for (const file of HDL_FILES) {
      const t = await styled(file, variant);
      for (const hit of findCodeWords(t, /`[A-Za-z_][\w$]*/g)) {
        const st = t.styles[hit.line][hit.col];
        const where = `${relative(ROOT, file)}:${hit.line + 1}`;
        assert.equal(st.fg, macro.fg.toUpperCase(), `${hit.word} at ${where} is ${st.fg}`);
        assert.equal(st.fontStyle, 0, `${hit.word} at ${where} should not be styled`);
        // the whole token, not only the backtick
        const end = t.styles[hit.line][hit.col + hit.word.length - 1];
        assert.equal(end.fg, macro.fg.toUpperCase(), `tail of ${hit.word} at ${where}`);
        count++;
      }
    }
    assert.ok(count > 60, `only ${count} macro tokens checked`);
  });
}

// ---------------------------------------------------------------- rule #1
test('rule #1: UVM message IDs, severity tasks and enums take their severity color', async () => {
  const file = join(ROOT, 'test', 'fixtures', 'rules', 'severity.sv');
  for (const variant of VARIANT_IDS) {
    const r = rolesFor(VARIANTS[variant]);
    const t = await styled(file, variant);
    const at = (needle: string, nth = 0): { fg: string; fontStyle: number } => {
      let n = 0;
      for (let i = 0; i < t.lines.length; i++) {
        let col = t.lines[i].indexOf(needle);
        while (col >= 0) {
          if (n++ === nth) return t.styles[i][col];
          col = t.lines[i].indexOf(needle, col + 1);
        }
      }
      throw new Error(`"${needle}" not found`);
    };
    const expect = (needle: string, role: Role, nth = 0): void => {
      const got = at(needle, nth);
      assert.equal(got.fg, r[role].fg.toUpperCase(), `[${variant}] ${needle} should be ${role}`);
      assert.equal(got.fontStyle, styleBits(r[role].fontStyle), `[${variant}] ${needle} style should be "${r[role].fontStyle}"`);
    };
    expect('"ALGORITHM_ISSUE"', 'severityError');
    expect('ALGORITHM_ISSUE', 'severityError');
    expect('"INFO_ID"', 'severityInfo');
    expect('"WARN_ID"', 'severityWarning');
    expect('"FATAL_ID"', 'severityFatal');
    expect('get_type_name', 'severityError');
    expect('MY_ID', 'severityError');
    expect('`gfn', 'macro');
    expect('"MULTILINE_ID"', 'severityError');
    expect('"CTX_ID"', 'severityInfo');
    expect('"FN_ERR_ID"', 'severityError');
    expect('"FN_WARN_ID"', 'severityWarning');
    expect('$error', 'severityError');
    expect('$fatal', 'severityFatal');
    expect('$warning', 'severityWarning');
    expect('$info', 'severityInfo');
    expect('UVM_ERROR', 'severityError');
    expect('UVM_FATAL', 'severityFatal');
    expect('UVM_WARNING', 'severityWarning');
    expect('UVM_INFO', 'severityInfo');
    expect('"an info message"', 'string');
    expect('"The apb virtual interface', 'string');
    expect('UVM_NONE', 'verbosityNone', 1);
    expect('UVM_LOW', 'verbosityLow');
    expect('UVM_MEDIUM', 'verbosityMedium');
    expect('UVM_HIGH', 'verbosityHigh');
    expect('UVM_FULL', 'verbosityFull');
    expect('UVM_DEBUG', 'verbosityDebug');
    expect('illegal_bins', 'illegalBins');
    expect('ignore_bins', 'ignoreBins');
    expect('x0z', 'numberXZ');
  }
});

// ---------------------------------------------------------------- bold marks a declaration
// Each line of these fixtures can end in a tag naming a word on it: `decl: x` is declared there,
// `use: x` is merely used there, `keep: x` is not a function and keeps its own bold.
for (const fixture of ['function-names.sv', 'function-names.v']) {
  test(`a function or task name is bold only where it is declared (${fixture})`, async () => {
    const file = join(ROOT, 'test', 'fixtures', 'rules', fixture);
    for (const variant of VARIANT_IDS) {
      const r = rolesFor(VARIANTS[variant]);
      const t = await styled(file, variant);
      const counts = { decl: 0, use: 0, keep: 0 };
      t.lines.forEach((text, line) => {
        const tag = /^(.*\S)\s+\/\/ (decl|use|keep): ([\w$]+)$/.exec(text);
        if (!tag) return;
        const [, code, kind, name] = tag as unknown as [string, string, keyof typeof counts, string];
        const col = code.search(new RegExp(`(?<![\\w$])${name.replace('$', '\\$')}(?![\\w$])`));
        const where = `[${variant}] ${fixture}:${line + 1} ${name}`;
        assert.ok(col >= 0, `${where} is not on the line`);
        const st = t.styles[line][col];
        const bold = (st.fontStyle & STYLE_BITS.bold) !== 0;
        if (kind === 'decl') {
          assert.ok(bold, `${where} is declared here and must be bold`);
          assert.equal(st.fg, r.functionDeclaration.fg.toUpperCase(), `${where} should have the declaration color`);
          assert.ok(
            scopeAt(t, line, col).some((s) => s.startsWith('entity.name.function.declaration.posedge')),
            `${where} should have the functionDeclaration role`,
          );
        } else if (kind === 'use') {
          assert.ok(!bold, `${where} is only used here and must not be bold`);
          const allowed = [r.function, r.functionLibrary, r.phase].map((x) => x.fg.toUpperCase());
          assert.ok(allowed.includes(st.fg), `${where} should keep a function color, got ${st.fg}`);
        } else {
          assert.ok(bold, `${where} is not a function and must keep its bold`);
        }
        counts[kind]++;
      });
      assert.ok(counts.decl >= 10 && counts.use >= 5, `only ${counts.decl} declarations and ${counts.use} uses checked`);
    }
  });
}

// ---------------------------------------------------------------- host independence
test('the lexer takes over completely: a minimal host grammar gives identical scopes', async () => {
  const file = join(ROOT, 'samples', 'verif', 'agents', 'apb', 'apb_driver.sv');
  const text = readFileSync(file, 'utf8');
  const withHost = await tokenize(text, 'source.systemverilog');
  // Swap the host for a grammar that knows nothing except comments.
  const minimal = join(ROOT, 'test', 'fixtures', 'hosts', 'minimal-systemverilog.json');
  const { GRAMMAR_FILES } = await import('./lib/textmate.mts');
  const original = GRAMMAR_FILES['source.systemverilog'];
  GRAMMAR_FILES['source.systemverilog'] = relative(ROOT, minimal);
  try {
    const withMinimal = await tokenize(text, 'source.systemverilog');
    const sig = (t: Tokenized): string[] => t.tokens.map((x) => `${x.line}:${x.start}:${x.scopes.slice(1).join(' ')}`);
    assert.deepEqual(sig(withMinimal), sig(withHost));
  } finally {
    GRAMMAR_FILES['source.systemverilog'] = original;
  }
});

// ---------------------------------------------------------------- snapshots
test('token snapshots match (UPDATE_SNAPSHOTS=1 to accept changes)', async () => {
  const dir = join(ROOT, 'test', 'snapshots');
  mkdirSync(dir, { recursive: true });
  const update = process.env.UPDATE_SNAPSHOTS === '1';
  for (const file of HDL_FILES) {
    const t = await tokenize(readFileSync(file, 'utf8'), scopeForFile(file));
    const body = t.tokens
      .filter((x) => x.text.trim())
      .map((x) => `${x.line + 1}:${x.start + 1}\t${JSON.stringify(x.text)}\t${x.scopes.slice(1).filter((s) => !s.startsWith('meta.')).join(' ')}`)
      .join('\n');
    const snap = join(dir, `${relative(ROOT, file).replace(/[\\/]/g, '__')}.snap`);
    if (update || !existsSync(snap)) writeFileSync(snap, `${body}\n`);
    else assert.equal(`${body}\n`, readFileSync(snap, 'utf8'), `snapshot changed: ${relative(ROOT, file)}`);
  }
});
