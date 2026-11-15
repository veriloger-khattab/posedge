# Contributing to Posedge

Everything visual in Posedge is **generated from data**. You edit small, readable tables in `design/`, run the build,
and the themes, grammars, icons and manifest regenerate. Tests then check the result with VS Code's own TextMate engine.

## Setup

```bash
npm install        # dev tools only; the extension has no runtime dependencies
npm run build      # themes, grammars, icons, legend, manifest, runtime bundle
npm test           # rules #1/#3/#4, logs, filelists, performance, clock, badges
npm run validate   # WCAG contrast, color distances, colour-blind checks, color ids, icon references
```

Requirements: Node.js ≥ 22.18 (runs the TypeScript build scripts directly). Python + fontTools only if you change the
clock font. Press **F5** in VS Code to start an Extension Development Host on `samples/`.

## Where things live

```
design/            the source of truth (pure data)
  palette.mts      raw colors per variant
  roles.mts        the color language: role -> color + style, contrast rules, legend
  scopes.mts       roles <-> TextMate scopes (lexer output and theme selectors)
  keywords.mts     SystemVerilog/Verilog keyword families (rule #3 lives here)
  uvm.mts          UVM vocabulary: report macros, phases, enums, role suffixes
  workbench.mts    UI colors
  semantic.mts     semantic token colors
  icons/           icon registry, shapes, dot-matrix font and emblems
build/             generators, validators, previews (no runtime dependencies)
src/               the runtime: clock, class icons and UVM role badges
themes/ syntaxes/ icons/ fonts/   generated, committed
samples/           a small UVM project used for tests, previews and screenshots
test/              tests and fixtures (host grammars are test-only, never shipped)
```

## Common changes

- **Change a color**: edit `design/palette.mts` (or a role in `design/roles.mts`), then `npm run build && npm run validate`.
- **Add a keyword or move one to another family**: edit `design/keywords.mts`. A word may appear in only one family, and
  opener/closer pairs must share a family (checked when the module loads).
- **Add a UVM macro, phase or role suffix**: edit `design/uvm.mts`.
- **Add a file or folder icon**: add a line to `design/icons/registry.mts` (pick a color role and a label or emblem),
  then `npm run build:icons && npm run gallery` and open `preview/icons.html`.
- **See exactly how a file is tokenized**: `node build/inspect.mts path/to/file.sv`.

## Before you open a pull request

```bash
npm run build && npm run verify && npm run typecheck && npm test && npm run validate
```

If a lexer change alters tokens on purpose, refresh the snapshots with `UPDATE_SNAPSHOTS=1 npm test` and review the diff
in `test/snapshots/`.

When you add or change a feature, update [AGENTS.md](AGENTS.md) in the same change. `npm test` fails if a new version,
setting, command or theme is missing from it.
