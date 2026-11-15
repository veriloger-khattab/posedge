# Changelog

## 0.8.0 — 2026-11-15

First public release, on the Visual Studio Marketplace and on Open VSX (for Cursor, VSCodium and other editors).

- The extension's ID is now `ahmedkhattab.posedge`. If you installed an earlier `.vsix` by hand, uninstall
  `posedge.posedge` so the themes are not listed twice.
- Designed by Ahmed Khattab: the credit is in the listing, the README and the walkthrough.
- The source is public at [github.com/veriloger-khattab/posedge](https://github.com/veriloger-khattab/posedge), with an
  issue tracker and private vulnerability reporting.

## 0.7.1 — 2026-11-02

- Removed the Pinned section added in 0.7.0. It was a separate list, not a way to order files inside their folders.

## 0.7.0 — 2026-11-02

### Pinned files
- A new Pinned section in the Explorer keeps the files you choose in the order you choose, per workspace, with their class
  icons, badges and Git letters. VS Code cannot reorder the file tree itself, so this is a separate list.
- Right-click a file or a tab and choose **Pin File**, or drag a file in from the Explorer. Drag rows to reorder them, or use
  **Move Up** and **Move Down**.
- Pins follow renames and moves, and go away when you delete the file. If a file disappears some other way, such as a Git
  branch switch, its pin comes back with the file.
- The section stays hidden until you pin your first file. It stores a list of file paths in VS Code's workspace state, and
  nothing else.

## 0.6.1 — 2026-11-02

### Faster icons
- Class icons are ready sooner after an update and in a project opened for the first time: about 1.9 s after the Explorer
  appears instead of 3.5 s. Normal launches already show them with the Explorer's first frame.
- The icon map now survives updates, so a large project no longer has to be scanned again before its icons return. This
  adds a copy of the list of file names and roles to VS Code's extension state.
- Fixed: a project containing a file with a fixed icon, such as `uvm_pkg.sv`, rewrote the icon theme on every launch, and
  every icon in the window reloaded.

### Icons
- A sequence is now three small sequence items sitting side by side.

## 0.6.0 — 2026-11-02

### Colors
- `virtual`, `pure`, `super`, `local`, `input` and other qualifiers move from steel blue to warm wheat `#E3C68F`, still
  italic. In Daylight they are bronze `#6D4204`.
- Brackets are static: `()`, `[]` and `{}` keep the punctuation color at every nesting depth, in every language, and
  bracket pair guides follow them. A bracket with no partner still turns red.

### Icons
- Sequencers, sequences and sequence items now share one violet, including the virtual versions.
- The sequencer is redrawn as a solid cannon that holds up at 16 px, and a sequence is a pyramid of six small sequence
  items.
- The reset handler is one arrow going around a circle.
- Interfaces are two arrows, one above the other, pointing in opposite directions.
- `uvm_reg_adapter` becomes a plug, because it used to be those two arrows.

## 0.5.0 — 2026-11-02

### Colors
- `rand`, `constraint`, `assert`, `cover` and the rest of the verification family move from pink to teal `#5EC4B6`.
- `virtual`, `pure`, `super`, `local`, `input` and other qualifiers get their own calm steel blue `#A8B8D8`, still italic.
- File names no longer change color with Git status, in the Explorer and on tabs. Git's letters stay.
- `uvm_fatal` IDs and `$fatal` are bold red, no longer underlined.

### One rule for bold
- A function or task name is bold only where it is declared. `super.new(name)`, `super.build_phase(phase)` and
  `endfunction : build_phase` are plain.

### Icons
- Sequencers are a cannon, sequences a stack of cannonballs, and a sequence item a single cannonball.
- New reset handler role with a respawn icon and the badge `RH`.

## 0.4.1 — 2026-11-01

- The selected file's row now glows amber in the Explorer and other lists, also while focus is in the editor, where it
  used to fall back to a faint gray.

## 0.4.0 — 2026-11-01

### Folders you can read at a glance
- Closed folders are now one flat gray silhouette with no color, and open folders are a bright amber outline, lit from
  inside, with the clock trace running in it. Before, closed folders kept their color and looked half lit.
- Every kind of open folder shares that one lit icon, so the kind of folder shows only in a closed folder's faint emblem.
- File icons are quieter at rest, so they no longer compete with lit folders.

### Readable sidebar
- Sidebar text now uses the main text color in every theme (12:1 in Graphite and Midnight, up from about 7:1).
- Git-ignored files and folders are readable (6.7:1 in Graphite, up from 2.3:1).

## 0.3.0 — 2026-10-31

### Class icons
- `.sv`, `.svh` and `.svi` files now show the icon of the class they declare: an eye for a monitor, a steering wheel for a
  driver, a person with a headset for an agent, a Wi-Fi signal for coverage, a box with green and red lights for a
  scoreboard, and 24 roles in all, in dark and light sets.
- Roles come from the UVM base class, followed through project base classes across files, and fall back to the class or
  file name. Icons update about a second after you save, without a reload.
- Role badges use the same detection, so they no longer depend on the file name alone.
- New setting `posedge.explorer.classIcons` and command **Posedge: Refresh Class Icons**.
- **Security note:** to do this the extension now reads SystemVerilog files as plain text and writes file and role names
  into its own icon theme files, inside its own extension folder. See SECURITY.md. Lite is unchanged and has no code.

### Bigger icons
- File icons are drawn on a 16×18 canvas and folders reach the edge of the box, about 15–20% larger. That is close to the
  maximum: VS Code draws file icons 16 px wide.

## 0.2.0 — 2026-10-31

### Posedge Daylight
- **Posedge Daylight** (`#FBFAF7`), a light color theme with the same color language: every hue stays in its family,
  deepened to at least 4.5:1 on warm paper. Comments keep `#696D70`.
- Warning is a dark gold, bold, because true yellow cannot be read on paper. The verbosity ramp runs the other way
  (`UVM_NONE` deepest, `UVM_DEBUG` faintest).
- Full workbench theming: `#FD9720` fills buttons, badges and selected rows, and a deeper `#9F5400` draws the cursor,
  focus rings and clock. Terminal ANSI colors stay readable on paper.
- **Posedge Icons** and **Posedge Icons (Still)** now include a complete light set that VS Code selects by itself
  on light color themes.
- The walkthrough's color legend follows the color theme.

### Build
- `npm run validate` now checks 51 workbench text and surface pairs, tokens over the selection, the verbosity ramp and
  the light icon colors. These checks fail the build for Daylight and only warn for the dark themes.
- `npm run screenshots` no longer reports success when the browser wrote no image.

## 0.1.0 — 2026-10-18

First release.

### Color themes
- **Posedge Graphite** (`#1C1C1C`), **Posedge Midnight** (`#0F0F0F`) and **Posedge High Contrast** (WCAG AAA).
- A color language for SystemVerilog and UVM: keywords, modifiers, macros, types, functions, strings, numbers,
  time and concurrency, verification, and reserved severity colors (error, fatal, warning, info).
- Full workbench theming: bordered graphite chrome, one warm accent, terminal ANSI colors, diagnostics, git, diff,
  testing, debugging and Outline symbols all follow the same roles.
- Semantic token colors for language servers (Sigasi, DVT, slang, Pylance, clangd, …).

### SystemVerilog / UVM lexer
- Injected on top of any SystemVerilog/Verilog grammar; a keyword's color depends on the word alone (rule-tested).
- Every backtick token in one macro color.
- UVM report IDs colored by severity (`` `uvm_info/warning/error/fatal ``, `_context`, `_begin`, `uvm_report_*()`),
  `$error`/`$fatal`/`$warning`/`$info`, `UVM_ERROR`-style enums, a verbosity brightness ramp, bold phase methods.
- SVA, coverage (`illegal_bins` red, `ignore_bins` dimmed), constraints (`->` as implication), X/Z digits,
  clocks and resets by name, closing labels in the color of what they close, tool pragmas in comments.
- Per-language default that keeps `begin`/`end` and other keyword pairs out of rainbow bracket coloring.
- Keywords the host registers as brackets but that are legitimately unpaired (`disable fork`, `wait fork`,
  `assert property`, `typedef class`, `extern`/`pure virtual` prototypes, DPI imports, `virtual interface`,
  `with function sample`) are no longer painted red as "unexpected brackets"; real blocks keep bracket matching.
- Tokenization cost ≤ 1.5× the host grammar alone (benchmarked on a 14k-line register model).

### Simulation logs and filelists
- UVM messages, report summary, VCS/Questa/Xcelium/Verilator/Vivado messages, SVA failures, pass/fail verdicts.
- Filelists: `+define+` names in the macro color, options, environment variables.

### File icons
- **Posedge Icons** (animated) and **Posedge Icons (Still)**: 29 folder kinds and 77 file kinds for verification
  projects; open folders light up with an LED and a clock trace; generated tool folders are dimmed.

### Runtime
- JetBrains Mono status-bar clock: time, date, ISO or Sunday-start work week, extra time zones, copy/insert timestamp.
- UVM role badges in the Explorer (DR, MO, AG, SQ, SE, TX, SB, EN, TS, …).
- Zero dependencies, no telemetry, no network access; works on desktop and in the browser.
