// Prints every token of a file with the scope the Posedge grammars assign, like VS Code's
// "Developer: Inspect Editor Tokens and Scopes" but for a whole file. Handy when adding rules.
//
//   node build/inspect.mts samples/verif/agents/apb/apb_driver.sv [--host-only] [--grep=word]

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { scopeForFile, tokenize } from '../test/lib/textmate.mts';

const args = process.argv.slice(2);
const file = args.find((a) => !a.startsWith('--'));
if (!file) {
  console.error('usage: node build/inspect.mts <file> [--host-only] [--grep=text]');
  process.exit(2);
}
const hostOnly = args.includes('--host-only');
const grep = args.find((a) => a.startsWith('--grep='))?.slice(7);

const t = await tokenize(readFileSync(resolve(file), 'utf8'), scopeForFile(file), { injections: !hostOnly });
let last = -1;
for (const tok of t.tokens) {
  if (!tok.text.trim()) continue;
  if (grep && !tok.text.includes(grep)) continue;
  if (tok.line !== last && !grep) {
    console.log(`\n${String(tok.line + 1).padStart(4)} | ${t.lines[tok.line]}`);
    last = tok.line;
  }
  const inner = tok.scopes.slice(1).filter((s) => !s.startsWith('meta.posedge')).join(' ');
  console.log(`       ${JSON.stringify(tok.text).padEnd(28)} ${inner}`);
}
