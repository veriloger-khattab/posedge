# Security

Posedge is designed to be easy for security teams to approve.

## What the extension contains

| Part | Kind | Runs code? |
|---|---|---|
| Color themes (`themes/*.json`) | declarative JSON | no |
| File icon themes (`icons/*.json`, `icons/svg/**`) | declarative JSON + SVG images (no scripts) | no |
| Grammars (`syntaxes/*.json`) | declarative TextMate injections | no |
| Clock glyph font (`fonts/posedge-clock.woff`) | font file | no |
| Runtime (`dist/extension.js`, `dist/web/extension.js`) | ~28 KB JavaScript, **not minified** | yes |

## What the runtime does

- Shows a clock in the status bar and adds two-letter UVM role badges to files in the Explorer.
- Gives SystemVerilog files the icon of the class they declare (`posedge.explorer.classIcons`, on by default):
  - **Reads** `*.sv`, `*.svh` and `*.svi` files in the open workspace as plain text, through VS Code's file API.
  - **Writes** only `icons/posedge-icon-theme.json` and `icons/posedge-still-icon-theme.json` inside its own extension
    folder, and only file names and role names (`apb_driver.sv: driver`). No source code, classes or paths are stored.
  - **Keeps** a copy of that same list in VS Code's own extension state (`globalState`), because an update replaces the
    extension folder. It is not synced between machines.
  - Stops writing when the setting is off, and removes what it added. If the folder is read-only, it does nothing.
- Registers six commands (copy/insert timestamp, toggle clock, toggle seconds, toggle badges, refresh class icons).
- Reads its own settings (`posedge.*`) and writes them only when you run a toggle command.

## What it never does

- No network access, no telemetry, no analytics.
- No writes to your workspace, or anywhere outside its own extension folder and VS Code's extension state.
- No child processes, no webviews, no `eval`.
- No runtime dependencies (`npm ls --omit=dev` is empty); the bundle is built from `src/` with esbuild.

It declares support for untrusted and virtual workspaces because it never executes workspace content.

A **Lite** edition without any JavaScript (themes and icons only) can be built with `npm run package:lite`.

## Reporting a vulnerability

Please report security issues privately through
[GitHub's vulnerability reporting](https://github.com/veriloger-khattab/posedge/security/advisories/new) instead of opening
a public issue. You will get an acknowledgement within a few days.
