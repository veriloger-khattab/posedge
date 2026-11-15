# Third-party notices

## Shipped in the extension

**JetBrains Mono** — the clock glyph font `fonts/posedge-clock.woff` is a modified subset of JetBrains Mono Bold.
Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono).
Licensed under the SIL Open Font License 1.1 — see `fonts/OFL.txt`.

All other artwork (icons, emblems, the dot-matrix micro-font, the marketplace icon) is original and MIT licensed.

## Repository only (test fixtures, never shipped)

- `test/fixtures/hosts/mshr-h/` — grammars from the Verilog-HDL/SystemVerilog extension by Masahiro H,
  derived from eirikpre/VSCode-SystemVerilog. MIT License (see the folder's `LICENSE.txt`).
- `test/fixtures/hosts/vscode-log/` — VS Code's built-in Log grammar, converted from emilast/vscode-logfile-highlighter.
  MIT License.

## Development tools (not shipped)

TypeScript, esbuild, @vscode/vsce, vscode-textmate and vscode-oniguruma (MIT), and fontTools (MIT), used only to build
and test.
