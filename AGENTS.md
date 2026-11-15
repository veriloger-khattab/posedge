# AGENTS.md

Guide for AI agents working on Posedge: what exists, why it is that way, and how to change it safely.

**Documented version: 0.8.0** (updated 2026-11-15)

## Keep this file current

This is a standing rule from the project owner. **Whenever you add or change a feature, update this file in the same
change**, not later:

1. Update the feature list below, and any rule, limit or trap the work changed.
2. If the version changed, update **Documented version** and add a row to [Version history](#version-history).
3. Add the user-facing change to `CHANGELOG.md`.

`npm test` enforces this: `test/agents-doc.test.mts` fails if the version, or any theme, icon theme, setting, command or
changelog version, is missing here. It cannot check prose, so keep that accurate yourself.

## What Posedge is

A VS Code extension for SystemVerilog/UVM verification engineers: color themes, a syntax lexer, file icons and a status-bar
clock, where every color means something. It is aimed at the Marketplace, so it must be safe for corporate approval and
work on Windows and Linux. The owner develops on Windows 11 and judges results visually: show real renders, not just
numbers.

## Rules from the owner

Do not break these without asking. Most have tests.

- **Colors carry meaning.** One meaning per hue. Red and yellow appear in code only for errors and warnings.
- **A keyword never changes color** (`class`/`endclass`, `begin`/`end`), in any context or nesting depth.
- **Brackets are static.** `()`, `[]` and `{}` have one color at every nesting depth, in every language. No rainbow.
  Only a bracket with no partner changes color, to error red.
- **All macros share one color**, `#FD9720`. Every backtick token.
- **UVM IDs take their severity color:** the ID in `` `uvm_error("ID", ...) `` is red, in `` `uvm_warning `` yellow.
- **Bold means "declared here".** `` `define `` names, class names, and function names at their declaration only. Calls such
  as `super.new(name)` and labels such as `endfunction : build_phase` are plain. The owner called the bold `` `define `` name
  the best thing about the colors.
- **Original color picks are kept:** keywords `#FF6B3A`, macros `#FD9720`, types `#48E0FD`, functions `#2BE98A`, comments
  `#696D70`, backgrounds `#1C1C1C` and `#0F0F0F`.
- **Illumination is an on/off signal, like Ayu's icon theme.** Closed folders are flat, colorless gray and all open folders
  are the same bright amber outline. File icons stay quiet at rest.
- **Safe to approve:** no telemetry, no network access, no child processes, no webviews, no runtime dependencies, an
  unminified bundle. The only writes are the class icon map, inside the extension's own folder, and its copy in VS Code's
  extension state. Update `SECURITY.md` if that ever changes.
- **Every file name in the Explorer is default white.** No Git colors on names. Git letters (`M`, `U`) stay.
- **Posedge is designed by Ahmed Khattab, and says so.** The owner called this the most important thing about the public
  release. The credit is in the store description, at the top of the README and in its Credits section, in the walkthrough,
  the license and the Lite edition (`test/credit.test.mts`). The publisher's display name in both stores is "Ahmed Khattab".
  Spell the name exactly that way.
- **Sequencers, sequences and sequence items share the item's violet** (`data`), virtual versions included. A sequence is
  drawn as three small items side by side, a sequencer as a cannon.
- **Pictograms must read at real size.** Check art as 20×20 device pixels (16 px at the owner's 125% scale), not zoomed in.
  Use solid shapes: a thin outline turns into a scribble. No two roles may share a drawing (tested).

## Tried and rejected

Do not propose these again without a new reason.

- Closed folders that keep their role color: they look half lit.
- A filled background band on open folder rows or on the selected file's row. The owner rejected both.
- A lit indent rail, a left tick and a chip behind the name for open folders. The owner chose a lit name instead.
- Pink for `rand`/`constraint`.
- Coral `#F09172` and steel blue `#A8B8D8` for `virtual`/`super`. Also ruled out for them on real code: orchid (reads pink,
  too close to the violet numbers), indigo (lost between blue and violet), keyword orange (hides the qualifier).
- A thin-outline cannon with a ring wheel: unreadable at 16 px.
- Six balls in a pyramid for a sequence: too many.
- A Pinned section, a separate list of chosen files (0.7.0, removed in 0.7.1). The owner wants order inside each folder of the real
  tree, not a second list. A replacement tree in Posedge was also offered, and the owner chose to patch the real Explorer.
- `*` activation to get class icons sooner: it gains only about 0.15 s (see Startup timing), and VS Code discourages it.
  Stay on `onStartupFinished`.
- A respawn figure inside two arrows for reset: the owner asked for the plain restart sign.
- Rainbow bracket colors, even muted ones.
- Underlining `uvm_fatal` IDs.
- Lighting files open in background tabs: it needs the icon theme rewritten on every tab change, about a second late, and
  windows would overwrite each other. The owner chose to keep files quiet.
- Stronger icon glow: it smears a 16 px icon.

## Layout

```
design/        source of truth, pure data: edit here
  palette.mts    raw colors per variant          roles.mts      role -> color + style, contrast rules, legend
  scopes.mts     roles <-> TextMate scopes       keywords.mts   SV/Verilog keyword families
  uvm.mts        UVM vocabulary and role table   workbench.mts  UI colors, UI contrast pairs
  semantic.mts   semantic token colors           icons/         registry, shapes, role pictograms, dot-matrix font
build/         generators, validator, previews, screenshots, packaging (Node runs .mts directly)
src/           the runtime: clock/ and explorer/ (class icons, role badges), bundled by esbuild
themes/ syntaxes/ icons/ fonts/ media/   generated, committed; never hand-edit generated files
docs/          colors-and-icons.md: every color and icon with its meaning, generated by build/reference.mts
samples/       a small UVM project for tests, previews and screenshots
test/          node:test tests, fixtures, snapshots; host grammars are test-only
tools/         install-local.mts; the owner's private tools also live here, outside Git
docs/publishing.md   how a release reaches the stores
```

`.vscodeignore` is an allowlist, so a new shipped file must be added there.

## Commands

```bash
npm run build       # themes, grammars, icons, legend, color and icon reference, manifest, bundle
npm run typecheck
npm test            # all tests
npm run validate    # contrast, color distance, colour-blindness, workbench color ids, icon references
npm run verify      # fails if generated files are stale
npm run package     # build + verify + dist-vsix/posedge-<version>.vsix
npm run package:lite
npm run install:local # installs the VSIX here and carries the class icon map over
npm run publish:openvsx # uploads the packaged VSIX to Open VSX; needs OVSX_PAT set by the owner
npm run screenshots # previews, galleries, legend PNG (not assets/screenshots/vscode*.png, which are real captures)
```

Refresh token snapshots only after reviewing the diff: `UPDATE_SNAPSHOTS=1 npm test`.

## What is done

**Color themes:** Posedge Graphite (`#1C1C1C`, default), Posedge Midnight (`#0F0F0F`), Posedge Daylight (`#FBFAF7`, light) and
Posedge High Contrast. Each includes full workbench colors, terminal ANSI colors and semantic token colors. Verification
keywords are teal `#5EC4B6`, and qualifiers (`virtual`, `super`, `pure`, `local`, `input`) are wheat `#E3C68F` (bronze
`#6D4204` in Daylight), italic. All six `editorBracketHighlight.foreground*` slots hold the punctuation color, and no
`editorBracketPairGuide.*` color is set, so guides follow it. That is what keeps brackets static, in every language.

**SystemVerilog/UVM lexer:** `syntaxes/*.injection.json` injected over any SV/Verilog grammar. Keyword colors depend on the word
alone. It covers UVM report IDs, severity tasks and enums, a verbosity brightness ramp, SVA, coverage, constraints, X/Z digits,
clocks and resets by name, closing labels and tool pragmas. Per-language defaults keep `begin`/`end` out of bracket coloring,
which is what lets them keep their keyword color, and legitimately unpaired keywords (`disable fork`, `assert property`, `typedef class`) are not painted as unexpected brackets.
Tokenizing stays within 1.5× of the host grammar alone.

**Logs and filelists:** injections for `text.log` (UVM messages, report summary, VCS/Questa/Xcelium/Verilator/Vivado messages,
verdicts) and `.f`/`.vc`/`.flist` files.

**File icons:** icon themes `posedge-icons` (animated) and `posedge-icons-still`, with dark and light sets chosen by VS Code. 29
folder kinds and 77 file kinds. Files use a 16×18 canvas, because VS Code draws icons 16 px wide at most.

**Class icons:** `.sv`, `.svh` and `.svi` files show the icon of the class they declare, for 25 roles. Sequencer = cannon,
sequence = three small items side by side, item = one large cannonball, driver = steering wheel, monitor = eye, agent = person
with headset, coverage = Wi-Fi, scoreboard = box with green and red lights, reset handler = arrow around a circle, interface =
two opposite arrows, adapter = plug. Setting `posedge.explorer.classIcons`, command `posedge.explorer.refreshClassIcons`.
Virtual sequences and sequencers use dashed versions.

**UVM role badges:** two letters beside files (DR, MO, RH, ...). Setting `posedge.explorer.uvmRoleBadges`, command
`posedge.explorer.toggleRoleBadges`.

**Clock:** JetBrains Mono glyphs in the status bar, with time, date, work week and extra time zones. Settings
`posedge.clock.enabled`, `posedge.clock.timeFormat`, `posedge.clock.dateFormat`, `posedge.clock.workWeekStyle`,
`posedge.clock.timeZones`, `posedge.clock.clickAction`, `posedge.clock.alignment`, `posedge.clock.priority`,
`posedge.clock.useGlyphFont`. Commands `posedge.clock.copyTimestamp`, `posedge.clock.insertTimestamp`, `posedge.clock.toggle`,
`posedge.clock.toggleSeconds`.

**Also:** a walkthrough with a legend per light/dark theme, and a code-free Lite VSIX (`npm run package:lite`).

**Color and icon reference:** `docs/colors-and-icons.md` lists every syntax hue, every role in all four themes, the keyword
families, key interface colors, and every folder, file and class icon with its meaning. It is the file to hand to another person
or agent. `build/reference.mts` writes it from `design/` during `npm run build`, and `npm run verify` fails if it is stale.
It refuses to run if a role, icon color or keyword family has no description, so add one there when adding them. Each class
pictogram's `look` in `design/icons/roles.mts` is the text it prints. `node build/reference.mts --html <file>` writes a visual
version with swatches, highlighted code and the icon files.

## Publishing

The extension is `ahmedkhattab.posedge` in both stores, and the Lite edition `ahmedkhattab.posedge-lite`. The publisher ID and the
extension name are permanent: a different value publishes a different extension. Before the first public release the ID was
`posedge.posedge`, which `tools/install-local.mts` removes.

- **Visual Studio Marketplace:** the owner uploads the VSIX by hand at marketplace.visualstudio.com/manage. Azure DevOps personal
  access tokens are retired on 2026-12-01, so do not build on `vsce publish` with a token.
- **Open VSX** serves Cursor, VSCodium, Windsurf and others. `npm run publish:openvsx` uploads the same VSIX; `ovsx` reads the token
  from `OVSX_PAT`, which only the owner sets, in their own terminal.
- **Only the owner** creates accounts, signs agreements, handles tokens and presses publish. Never ask for a token in chat.
- The stores load README images from GitHub: `vsce` rewrites relative paths to `github.com/.../raw/HEAD/...` from `repository` in
  `package.json`. So push before publishing, keep README images as relative PNGs, and never use SVG there.
- A release: bump the version, update `CHANGELOG.md` and this file, `npm run package`, test in a real VS Code, commit and push,
  then publish to both stores. `docs/publishing.md` has every step.

## How the non-obvious parts work

- **Class icons.** Icon themes map by file name and cannot read files. `src/explorer/classIcons.ts` scans the workspace as text,
  `svClasses.mts` follows `extends` chains across files, and `iconMap.mts` writes `fileNames` entries into the *installed* icon
  theme JSON. `_watch: true` in `package.json` makes VS Code reload it, about a second after a save. It only writes in
  Production extension mode, so it never dirties this checkout. A name matches anywhere, so same-named files share an icon.
  Each version has its own folder and starts with an empty map, so `globalState` keeps a copy that `restore()` puts back at
  activation, with no scan. A write reloads the whole icon theme, so `applyClassIcons` must return false when nothing changed.
- **Startup timing** (measured on 1.144 by polling the debug port and capturing painted frames). A normal launch has class
  icons in the Explorer's first frame: they come from the theme file, before any extension runs, and all icons load within
  about 60 ms of the rows, the same as Seti. The first launch of a new version, or of a new project, cannot match that: rows
  at 1.65 s, extension host at 2.0 s, earliest `*` activation 2.9 s, `onStartupFinished` 3.4 s, theme write 0.2 s later, and
  VS Code applies it about 0.3 s after that. No extension can run before the Explorer draws.
- **Lexer takeover.** A never-closing document rule stops the host grammar's top-level rules from running. Injections re-run
  inside captures that have `patterns`, hence `meta.posedge.capture`.
- **Quiet icons.** `fade` in `design/icons/shapes.mts` leans file icon colors toward the background.
- **Validator strictness.** The workbench contrast checks fail only for Daylight. Dark themes predate them and only warn.

## The owner's machine

The owner's own VS Code has extras that are not part of Posedge and not in the public repository: a patched sidebar style and
Move Up / Move Down for files in the Explorer. Their notes are in `AGENTS.local.md` and their tools under `tools/`, both kept out
of Git. If those files are absent, you are in a public clone and none of it applies. Screenshots from the owner's machine can
show these extras, so take store screenshots from an unpatched VS Code.

## Testing in a real VS Code

Always do this for visual changes. Tests cannot judge how something looks.

To judge startup, capture painted frames (`Page.startScreencast`). Computed styles show an icon before it is painted.

1. Package, then install the VSIX into a scratch profile with `code --user-data-dir <dir> --extensions-dir <dir> --install-extension`.
2. Start `Code.exe` with those two options plus `--remote-debugging-port=<port>`, on a **scratch copy** of `samples/`.
3. Read computed styles and take screenshots over the debug port, then close only that instance with `Browser.close`.

Traps, all learned the hard way:

- `--extensionDevelopmentPath` forces the extension's own theme and ignores `workbench.colorTheme`. Test the installed VSIX.
- Never open the repo's `samples/` while typing with automation: a mistimed shortcut typed into a real file's buffer.
- Check the command palette is open before typing. Keys otherwise land in the Explorer.
- A pending VS Code update blocks all new instances until the owner restarts. Do not bypass it. A test window that never opens,
  with `CodeSetup` in `tasklist`, means this. Do not patch an install that is about to be replaced.
- Explorer rows are virtualized, so page order is not screen order, and rows scrolled away do not exist. Sort by `data-index`, or
  check the saved data instead.
- Git Bash rewrites script arguments that start with `/` into Windows paths, which also breaks inline regex literals.
- `Devin.exe` is not isolated (it opens `~/.devin-shared`) and Antigravity is not a VS Code workbench. Do not use them.
- Hover tooltips show local paths: check screenshots before publishing them, and check for unsaved-tab dots.
- Take `assets/screenshots/vscode*.png` from an unpatched VS Code. The owner's patch shows things Posedge does not ship.
  Count `.unexpected-closing-bracket` spans before capturing: a restored tab can show false red (see Known limits).
- Edge's launcher exits before rendering, so wait for the output file.
- Debug-port mouse coordinates need the display scale applied, except in an emulated viewport. `Page.reload` is a reliable
  window reload.

## Editing traps

- Edit regexes in `build/grammars.mts` only with exact-string edits. Shell and scripted edits have mangled backslashes.
- Some files use CRLF, so multi-line matches must allow for it.
- The source is public at github.com/veriloger-khattab/posedge. Everything committed is public: no local paths, tokens or
  private notes. Commits use the owner's GitHub noreply address, set in this repository's own Git config.

## Known limits and open items

- A function name split from `function`/`task` by a line break, or with its `(` on the next line, is not bold.
- After an update, and in a project opened for the first time, `.sv` files show generic icons for about 1.9 s. For the owner's
  own installs, `npm run install:local` removes this by copying the map over before VS Code opens.
- False red in restored tabs: a bracket word in a string (`interface`) shows the unexpected-bracket color, in 6 of 6 launches
  with `editor.experimental.asyncTokenization` on and 0 of 6 with it off. It is not the lexer: an exact copy of the file opened
  fresh was clean, and the string has a plain `string` scope. VS Code builds a tokenless bracket tree until tokens are ready, and
  visible lines can keep it. The setting only works globally (a `[systemverilog]` override had no effect in 3 of 3 launches), so
  Posedge does not set it: that would change a performance feature for every language.
- Scan limits: 5,000 files, and files over 2 MB are skipped.
- `npm run validate` warns about older contrast gaps in the dark themes. The worst is High Contrast's warning status item at 2.85:1.
- The walkthrough legend renders small (about 7 px text).
- Untested: Linux, Remote-SSH, and large real projects.
- Untested in Cursor and other Open VSX editors. Cursor lists extensions from its own mirror of Open VSX, which can lag a new
  release by a day or more.

## Version history

| Version | Date | What it added |
|---|---|---|
| 0.8.0 | 2026-11-15 | First public release: publisher `ahmedkhattab`, credit to Ahmed Khattab, public repository, store-ready package |
| 0.7.1 | 2026-11-02 | Removed the Pinned section |
| 0.7.0 | 2026-11-02 | Pinned section in the Explorer, with drag to reorder |
| 0.6.1 | 2026-11-02 | Icon map survives updates, no startup wait, no needless theme rewrite, three-item sequence |
| 0.6.0 | 2026-11-02 | Wheat qualifiers, static brackets, violet sequence family, solid cannon, six-item sequence, restart arrow, two-arrow interface, plug adapter |
| 0.5.0 | 2026-11-02 | Teal verification, steel qualifiers, no Git name colors, no fatal underline, bold only at declaration, cannon icons, reset handler role |
| 0.4.1 | 2026-11-01 | Selected row amber while focus is in the editor |
| 0.4.0 | 2026-11-01 | Closed folders flat gray, open folders amber outline, quiet file icons, readable sidebar text |
| 0.3.0 | 2026-10-31 | Class icons, larger icon art |
| 0.2.0 | 2026-10-31 | Posedge Daylight, light icon set, workbench readability checks |
| 0.1.0 | 2026-10-18 | First release: three dark themes, lexer, logs, filelists, icons, clock, role badges |

`CHANGELOG.md` has the user-facing detail.
