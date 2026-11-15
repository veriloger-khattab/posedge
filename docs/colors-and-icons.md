# Posedge: every color and icon

Generated from `design/` by `build/reference.mts`. Do not edit by hand: run `npm run build`. Version 0.8.0.

Posedge is a VS Code extension for SystemVerilog and UVM verification engineers: four color themes, a lexer that guarantees
consistent colors, two file icon themes, class icons, UVM role badges and a status-bar clock. Every color carries a meaning.

## Color themes

| Theme | Base | Editor background |
|---|---|---|
| Posedge Graphite | dark | `#1C1C1C` |
| Posedge Midnight | dark | `#0F0F0F` |
| Posedge Daylight | light | `#FBFAF7` |
| Posedge High Contrast | hc | `#000000` |

Graphite is the default. Graphite and Midnight share every syntax hue; Midnight's background and text are darker, and its
comments use the owner's pick `#696D70` (Graphite lifts them to `#767B80` for contrast). Daylight is the light theme, with
the same hue families deepened to read on paper. High Contrast has a black background, and every token reaches 7:1 contrast.

### The color language

- **One meaning per hue.** Red and yellow appear in code only for errors and warnings.
- **A keyword never changes color**, in any context or at any nesting depth, and opener/closer pairs (`class`/`endclass`,
  `begin`/`end`, `fork`/`join_none`) always match.
- **Every macro has one color**: every backtick token.
- **UVM message IDs take their severity color**: the ID in `` `uvm_error("ID", …) `` is red, in `` `uvm_warning `` yellow.
- **Bold means "declared here"**: `` `define `` names, class names and function names at their declaration only.
- **Italic marks a qualifier or a library name**: modifiers, `this`/`super`, UVM and std types, `$` system tasks, labels.
- **Brackets are static**: `()` `[]` `{}` keep the punctuation color at every depth, in every language. Only a bracket with
  no partner turns red.
- Semantic tokens from language servers use the same colors.

### Syntax hues

These are the base colors. The roles below are built from them.

| Hue | Used for | Graphite / Midnight | Daylight | High Contrast |
|---|---|---|---|---|
| `keyword` | Keywords: the skeleton of the code. Owner's pick | `#FF6B3A` | `#D02A10` | `#FF6B3A` |
| `macro` | Every macro and directive. Owner's pick, also the UI accent | `#FD9720` | `#AF5A00` | `#FD9720` |
| `type` | Types. Owner's pick | `#48E0FD` | `#027897` | `#48E0FD` |
| `function` | Functions, tasks and UVM phases. Owner's pick | `#2BE98A` | `#157648` | `#2BE98A` |
| `string` | Strings | `#AEC359` | `#424D00` | `#AEC359` |
| `number` | Numbers, constants, `null`, and the UVM verbosity ramp | `#BD93F9` | `#844AD3` | `#BD93F9` |
| `time` | Time and concurrency, clocks and resets | `#5C9DFF` | `#1A5CD0` | `#5C9DFF` |
| `verification` | Assertions, coverage, constraints, randomization | `#5EC4B6` | `#045255` | `#5EC4B6` |
| `modifier` | Qualifiers such as `virtual`, and `this` / `super` | `#E3C68F` | `#6D4204` | `#E3C68F` |
| `error` | Errors only: `uvm_error` / `uvm_fatal` IDs, X/Z digits, `illegal_bins` | `#FD3974` | `#D3206A` | `#FF5D84` |
| `warning` | Warnings only: `uvm_warning` IDs, `TODO` | `#FFD23F` | `#7B6300` | `#FFD23F` |
| `ignore` | `ignore_bins` | `#7FA8A2` | `#4F7673` | `#A6CFC9` |

### Every role, per theme

Each role is what the lexer marks a piece of code as. Style applies to all themes.

| Role | What it colors | Style | Graphite | Midnight | Daylight | High Contrast |
|---|---|---|---|---|---|---|
| `fg` | Default text: identifiers, signal and variable names | plain | `#D4D7DB` | `#CDD0D4` | `#25282C` | `#FFFFFF` |
| `comment` | Comments | plain | `#767B80` | `#696D70` | `#696D70` | `#9DA3A9` |
| `punctuation` | Punctuation, and every bracket `()` `[]` `{}` at every nesting depth (static, no rainbow) | plain | `#8E949A` | `#858B91` | `#62676D` | `#C9CED3` |
| `operator` | Operators, including word operators `and` `or` `not` `xor` `nand` `nor` `xnor` | plain | `#B0B6BD` | `#A8AEB5` | `#484D53` | `#E6E9EC` |
| `variable` | Variables (same as default text) | plain | `#D4D7DB` | `#CDD0D4` | `#25282C` | `#FFFFFF` |
| `label` | Block labels, such as `begin : loop` and `end : loop` | italic | `#B5BAC0` | `#ADB2B8` | `#474C52` | `#D6DADE` |
| `port` | Named port connections, such as `.pclk(pclk)` | italic | `#D4D7DB` | `#CDD0D4` | `#25282C` | `#FFFFFF` |
| `keyword` | Structure and control keywords: the skeleton of the code (full list below) | plain | `#FF6B3A` | `#FF6B3A` | `#D02A10` | `#FF6B3A` |
| `modifier` | Qualifiers: `virtual` `local` `protected` `static` `automatic` `const` `extern` `pure` `input` `output` `ref` … | italic | `#E3C68F` | `#E3C68F` | `#6D4204` | `#E3C68F` |
| `selfRef` | `this` and `super` | italic | `#E3C68F` | `#E3C68F` | `#6D4204` | `#E3C68F` |
| `macro` | Every backtick token: `` `ifdef `` `` `define `` `` `include `` `` `uvm_info `` `` `uvm_component_utils `` … | plain | `#FD9720` | `#FD9720` | `#AF5A00` | `#FD9720` |
| `macroDefinition` | The name being defined after `` `define `` (bold = declared here) | bold | `#FD9720` | `#FD9720` | `#AF5A00` | `#FD9720` |
| `macroParam` | Parameters inside a macro definition | italic | `#D4D7DB` | `#CDD0D4` | `#25282C` | `#FFFFFF` |
| `formatSpec` | Format specifiers and escapes inside strings: `%0d` `%h` `%s` `\n` | plain | `#FD9720` | `#FD9720` | `#AF5A00` | `#FD9720` |
| `attribute` | Attributes: `(* keep *)` | italic | `#FD9720` | `#FD9720` | `#AF5A00` | `#FD9720` |
| `pragma` | Tool pragmas in comments: `synopsys translate_off`, `pragma coverage off`, `verilator lint_off` | italic | `#FD9720` | `#FD9720` | `#AF5A00` | `#FD9720` |
| `dpi` | DPI imports and exports: `import "DPI-C"` | plain | `#FD9720` | `#FD9720` | `#AF5A00` | `#FD9720` |
| `type` | Types: `bit` `logic` `int` `string` `enum` `struct`, and user types such as `apb_item` | plain | `#48E0FD` | `#48E0FD` | `#027897` | `#48E0FD` |
| `typeDeclaration` | A type at its declaration: the class, typedef, struct or enum name being declared (bold) | bold | `#48E0FD` | `#48E0FD` | `#027897` | `#48E0FD` |
| `typeLibrary` | Library types: every `uvm_*` class, `mailbox`, `semaphore`, `process`, `type_id` | italic | `#48E0FD` | `#48E0FD` | `#027897` | `#48E0FD` |
| `namespace` | Package names in `pkg::name` references | italic | `#48E0FD` | `#48E0FD` | `#027897` | `#48E0FD` |
| `function` | Function and task calls, and `new` | plain | `#2BE98A` | `#2BE98A` | `#157648` | `#2BE98A` |
| `functionDeclaration` | A function or task name at its declaration only (bold). Calls such as `super.new(name)` stay plain | bold | `#2BE98A` | `#2BE98A` | `#157648` | `#2BE98A` |
| `functionLibrary` | System tasks and functions: `$display` `$sformatf` `$time` `$urandom` … | italic | `#2BE98A` | `#2BE98A` | `#157648` | `#2BE98A` |
| `phase` | UVM phases (`build_phase` … `final_phase`) and `raise_objection` / `drop_objection` / `set_drain_time` | plain | `#2BE98A` | `#2BE98A` | `#157648` | `#2BE98A` |
| `string` | Strings | plain | `#AEC359` | `#AEC359` | `#424D00` | `#AEC359` |
| `number` | Numbers: `32`, `8'hFF`, `1'b0`, `10.5` | plain | `#BD93F9` | `#BD93F9` | `#844AD3` | `#BD93F9` |
| `numberXZ` | X and Z digits in literals: `'x`, `8'bxx01`, `'z` (an unknown value is a problem) | plain | `#FD3974` | `#FD3974` | `#D3206A` | `#FF5D84` |
| `constant` | Constants: parameters, enum members, `UVM_ALL_ON`, `UVM_HEX` | plain | `#BD93F9` | `#BD93F9` | `#844AD3` | `#BD93F9` |
| `nullLiteral` | `null` | plain | `#BD93F9` | `#BD93F9` | `#844AD3` | `#BD93F9` |
| `verbosityNone` | `UVM_NONE`: always prints, so it stands out most (bold) | bold | `#EADEFF` | `#EADEFF` | `#420778` | `#F5F5F5` |
| `verbosityLow` | `UVM_LOW` | plain | `#D5BCFE` | `#D5BCFE` | `#6320AB` | `#E4D6FE` |
| `verbosityMedium` | `UVM_MEDIUM` (same as numbers) | plain | `#BD93F9` | `#BD93F9` | `#844AD3` | `#BD93F9` |
| `verbosityHigh` | `UVM_HIGH` | plain | `#A37ADD` | `#A37ADD` | `#935BE5` | `#B68CF1` |
| `verbosityFull` | `UVM_FULL` | plain | `#8E64C6` | `#8E64C6` | `#9F68F3` | `#A076DA` |
| `verbosityDebug` | `UVM_DEBUG`: least likely to print, so the least contrast | plain | `#7C52B2` | `#7C52B2` | `#A871FD` | `#8E64C6` |
| `time` | Time and concurrency: `initial` `always_ff` `fork` `join_none` `wait` `posedge` `@` `#10ns` `##2` `->` | plain | `#5C9DFF` | `#5C9DFF` | `#1A5CD0` | `#5C9DFF` |
| `clock` | Clock signals by name: `clk`, `pclk`, `sys_clk`, `clk_i` | plain | `#5C9DFF` | `#5C9DFF` | `#1A5CD0` | `#5C9DFF` |
| `reset` | Reset signals by name: `rst_n`, `presetn`, `rst_ni` (calls such as `reset_signals()` are not affected) | italic | `#5C9DFF` | `#5C9DFF` | `#1A5CD0` | `#5C9DFF` |
| `verification` | Assertions, coverage, constraints and randomization: `assert` `cover` `property` `covergroup` `bins` `constraint` `rand` `inside` `\|->` `\|=>` | plain | `#5EC4B6` | `#5EC4B6` | `#045255` | `#5EC4B6` |
| `verificationName` | Names of properties, sequences, covergroups, coverpoints and constraints | italic | `#5EC4B6` | `#5EC4B6` | `#045255` | `#5EC4B6` |
| `illegalBins` | `illegal_bins`: hitting one is an error | plain | `#FD3974` | `#FD3974` | `#D3206A` | `#FF5D84` |
| `ignoreBins` | `ignore_bins`: dimmed, because ignored | italic | `#7FA8A2` | `#7FA8A2` | `#4F7673` | `#A6CFC9` |
| `severityInfo` | The ID of `` `uvm_info("ID", …) ``, `uvm_report_info`, `$info` and `UVM_INFO`: neutral on purpose, only problems get color | bold | `#D4D7DB` | `#CDD0D4` | `#25282C` | `#FFFFFF` |
| `severityWarning` | The ID of `` `uvm_warning("ID", …) ``, `$warning` and `UVM_WARNING` | bold | `#FFD23F` | `#FFD23F` | `#7B6300` | `#FFD23F` |
| `severityError` | The ID of `` `uvm_error("ID", …) ``, `$error` and `UVM_ERROR` | bold | `#FD3974` | `#FD3974` | `#D3206A` | `#FF5D84` |
| `severityFatal` | The ID of `` `uvm_fatal("ID", …) ``, `$fatal` and `UVM_FATAL` (bold, not underlined) | bold | `#FD3974` | `#FD3974` | `#D3206A` | `#FF5D84` |
| `tagTodo` | `TODO` in comments | bold | `#FFD23F` | `#FFD23F` | `#7B6300` | `#FFD23F` |
| `tagFixme` | `FIXME` and `BUG` in comments | bold | `#FD3974` | `#FD3974` | `#D3206A` | `#FF5D84` |
| `tagNote` | `NOTE` in comments | bold | `#D4D7DB` | `#CDD0D4` | `#25282C` | `#FFFFFF` |
| `tagWaive` | `WAIVE` and `WAIVER` in comments | bold | `#5EC4B6` | `#5EC4B6` | `#045255` | `#5EC4B6` |
| `invalid` | Invalid code | underline | `#FD3974` | `#FD3974` | `#D3206A` | `#FF5D84` |
| `deprecated` | Deprecated code | strikethrough | `#9AA0A6` | `#959BA1` | `#565B61` | `#D0D4D8` |
| `logPass` | Simulation logs: `TEST PASSED`, and zero counts in the UVM report summary | bold | `#2BE98A` | `#2BE98A` | `#157648` | `#2BE98A` |
| `logFail` | Simulation logs: `TEST FAILED`, and non-zero error counts | bold | `#FD3974` | `#FD3974` | `#D3206A` | `#FF5D84` |
| `logPath` | Simulation logs: file paths | italic | `#9AA0A6` | `#959BA1` | `#565B61` | `#D0D4D8` |
| `logHierarchy` | Simulation logs: hierarchy such as `uvm_test_top.env.agent` | plain | `#D4D7DB` | `#CDD0D4` | `#25282C` | `#FFFFFF` |
| `logHeading` | Simulation logs: report headings | bold | `#FF6B3A` | `#FF6B3A` | `#D02A10` | `#FF6B3A` |
| `heading` | Markdown headings | bold | `#FF6B3A` | `#FF6B3A` | `#D02A10` | `#FF6B3A` |
| `link` | Links | underline | `#5C9DFF` | `#5C9DFF` | `#1A5CD0` | `#5C9DFF` |
| `emphasis` | Markdown emphasis | italic | `#D4D7DB` | `#CDD0D4` | `#25282C` | `#FFFFFF` |
| `strong` | Markdown strong text | bold | `#F0F2F4` | `#ECEEF0` | `#0F1113` | `#FFFFFF` |
| `inlineCode` | Markdown inline code | plain | `#FD9720` | `#FD9720` | `#AF5A00` | `#FD9720` |
| `quote` | Markdown quotes | italic | `#767B80` | `#696D70` | `#696D70` | `#9DA3A9` |
| `listMarker` | Markdown list markers | plain | `#FD9720` | `#FD9720` | `#AF5A00` | `#FD9720` |
| `inserted` | Diffs: added lines | plain | `#2BE98A` | `#2BE98A` | `#157648` | `#2BE98A` |
| `deleted` | Diffs: removed lines | plain | `#FD3974` | `#FD3974` | `#D3206A` | `#FF5D84` |
| `changed` | Diffs: changed lines | plain | `#FFD23F` | `#FFD23F` | `#7B6300` | `#FFD23F` |
| `key` | Keys in JSON and YAML | plain | `#48E0FD` | `#48E0FD` | `#027897` | `#48E0FD` |
| `regexp` | Regular expressions | plain | `#FD9720` | `#FD9720` | `#AF5A00` | `#FD9720` |
| `escape` | Escape sequences | plain | `#FD9720` | `#FD9720` | `#AF5A00` | `#FD9720` |

### Keyword families

A word's color depends on the word alone. SystemVerilog uses all of these; Verilog files use only the IEEE 1364-2005 words, so
SystemVerilog-only words such as `logic`, `rand` and `bit` stay plain identifiers there.

- **Keywords (structure and control)** (role `keyword`, 87 words, 59 in Verilog): `alias` `begin` `bind` `break` `buf` `bufif0` `bufif1` `case` `casex` `casez` `cell` `class` `cmos` `config` `continue` `default` `defparam` `design` `do` `else` `end` `endcase` `endclass` `endconfig` `endfunction` `endgenerate` `endinterface` `endmodule` `endpackage` `endprimitive` `endprogram` `endtable` `endtask` `export` `extends` `for` `foreach` `forever` `function` `generate` `if` `implements` `import` `incdir` `include` `instance` `interface` `let` `liblist` `library` `localparam` `macromodule` `matches` `modport` `module` `nettype` `nmos` `notif0` `notif1` `package` `parameter` `pmos` `primitive` `priority` `program` `pulldown` `pullup` `randcase` `rcmos` `repeat` `return` `rnmos` `rpmos` `rtran` `rtranif0` `rtranif1` `specparam` `table` `task` `tran` `tranif0` `tranif1` `typedef` `unique` `unique0` `use` `while`
- **Modifiers (qualifiers)** (role `modifier`, 27 words, 17 in Verilog): `automatic` `const` `context` `extern` `highz0` `highz1` `inout` `input` `large` `local` `medium` `output` `protected` `pull0` `pull1` `pure` `ref` `scalared` `small` `static` `strong0` `strong1` `var` `vectored` `virtual` `weak0` `weak1`
- **Self references** (role `selfRef`, 2 words, 0 in Verilog): `this` `super`
- **Types** (role `type`, 39 words, 21 in Verilog): `bit` `byte` `chandle` `enum` `event` `genvar` `int` `integer` `interconnect` `logic` `longint` `packed` `real` `realtime` `reg` `shortint` `shortreal` `signed` `string` `struct` `supply0` `supply1` `tagged` `time` `tri` `tri0` `tri1` `triand` `trior` `trireg` `type` `union` `unsigned` `untyped` `uwire` `void` `wand` `wire` `wor`
- **Time and concurrency** (role `time`, 33 words, 20 in Verilog): `always` `always_comb` `always_ff` `always_latch` `assign` `clocking` `deassign` `disable` `edge` `endclocking` `endspecify` `final` `force` `fork` `forkjoin` `global` `ifnone` `initial` `join` `join_any` `join_none` `negedge` `noshowcancelled` `posedge` `pulsestyle_ondetect` `pulsestyle_onevent` `release` `showcancelled` `specify` `timeprecision` `timeunit` `wait` `wait_order`
- **Verification** (role `verification`, 49 words, 0 in Verilog): `accept_on` `assert` `assume` `before` `bins` `binsof` `checker` `constraint` `cover` `covergroup` `coverpoint` `cross` `dist` `endchecker` `endgroup` `endproperty` `endsequence` `eventually` `expect` `first_match` `iff` `implies` `inside` `intersect` `nexttime` `property` `rand` `randc` `randsequence` `reject_on` `restrict` `s_always` `s_eventually` `s_nexttime` `s_until` `s_until_with` `sequence` `soft` `solve` `strong` `sync_accept_on` `sync_reject_on` `throughout` `until` `until_with` `weak` `wildcard` `with` `within`
- **Illegal bins (error color)** (role `illegalBins`, 1 words, 0 in Verilog): `illegal_bins`
- **Ignore bins (dimmed)** (role `ignoreBins`, 1 words, 0 in Verilog): `ignore_bins`
- **Word operators (operator color)** (role `operator`, 7 words, 7 in Verilog): `and` `nand` `nor` `not` `or` `xnor` `xor`
- **Function color** (role `function`, 1 words, 0 in Verilog): `new`
- **Constant color** (role `nullLiteral`, 1 words, 0 in Verilog): `null`

### Surfaces and text

| Surface | Graphite | Midnight | Daylight | High Contrast |
|---|---|---|---|---|
| editor | `#1C1C1C` | `#0F0F0F` | `#FBFAF7` | `#000000` |
| sidebar | `#181818` | `#0B0B0B` | `#F5F4F0` | `#000000` |
| chrome | `#141414` | `#080808` | `#EDECE7` | `#000000` |
| widget | `#202020` | `#161616` | `#FFFFFF` | `#0A0A0A` |
| border | `#2A2A2A` | `#222222` | `#E0DFD9` | `#6E7378` |
| lineHighlight | `#232323` | `#171717` | `#F3F2ED` | `#000000` |
| selection | `#2B4A6A` | `#233F5C` | `#C8DDF5` | `#1E5A8C` |

| Text | Graphite | Midnight | Daylight | High Contrast |
|---|---|---|---|---|
| fg | `#D4D7DB` | `#CDD0D4` | `#25282C` | `#FFFFFF` |
| bright | `#F0F2F4` | `#ECEEF0` | `#0F1113` | `#FFFFFF` |
| muted | `#9AA0A6` | `#959BA1` | `#565B61` | `#D0D4D8` |
| comment | `#767B80` | `#696D70` | `#696D70` | `#9DA3A9` |
| operator | `#B0B6BD` | `#A8AEB5` | `#484D53` | `#E6E9EC` |
| punctuation | `#8E949A` | `#858B91` | `#62676D` | `#C9CED3` |

### Key interface colors

| Color | Graphite | Midnight | Daylight | High Contrast |
|---|---|---|---|---|
| Accent (cursor, focus, active tab, clock) | `#FD9720` | `#FD9720` | `#9F5400` | `#FD9720` |
| Accent fill (buttons, badges, selected rows) | `#FD9720` | `#FD9720` | `#FD9720` | `#FD9720` |
| Status bar background (`statusBar.background`) | `#141414` | `#080808` | `#EDECE7` | `#000000` |
| Selected list row (`list.activeSelectionBackground`) | `#FD97204D` | `#FD97204D` | `#FD97204D` | `#000000` |
| Clock time (`posedge.clockForeground`) | `#FD9720` | `#FD9720` | `#9F5400` | `#FD9720` |
| Clock date (`posedge.dateForeground`) | `#9AA0A6` | `#959BA1` | `#565B61` | `#D0D4D8` |
| Unmatched bracket (`editorBracketHighlight.unexpectedBracket.foreground`) | `#FD3974` | `#FD3974` | `#D3206A` | `#FF5D84` |
| Terminal red (`terminal.ansiRed`) | `#FD3974` | `#FD3974` | `#D3206A` | `#FF5D84` |
| Terminal yellow (`terminal.ansiYellow`) | `#FFD23F` | `#FFD23F` | `#7B6300` | `#FFD23F` |
| Terminal green (`terminal.ansiGreen`) | `#2BE98A` | `#2BE98A` | `#157648` | `#2BE98A` |
| Terminal blue (`terminal.ansiBlue`) | `#5C9DFF` | `#5C9DFF` | `#1A5CD0` | `#5C9DFF` |
| Terminal cyan (`terminal.ansiCyan`) | `#48E0FD` | `#48E0FD` | `#027897` | `#48E0FD` |
| Terminal magenta (`terminal.ansiMagenta`) | `#FF7AC6` | `#FF7AC6` | `#B82B96` | `#FF7AC6` |

The README legend lists the most important roles: Keywords, Modifiers (italic), Macros and directives, Types, Functions and tasks, Strings, Numbers and constants, Time and concurrency, Verification, Error (bold), Fatal (bold), Warning (bold), Info (bold, neutral), Comments.

## File icons

Two icon themes with the same art: **Posedge Icons** (`posedge-icons`), where open folders show a small animated clock
trace, and **Posedge Icons (Still)** (`posedge-icons-still`), with no motion. Each has a dark set and a light set, chosen by
VS Code from the color theme's base. File icons are 16 px wide, drawn on a 16×18 canvas. The Explorer's folder arrows are hidden.

### Icon colors

Icons speak the same color language as the code. At rest, file icon colors are faded toward the background (dark set
32%, light set 30%), so nothing competes with an open folder.

| Color | Meaning | Dark set | Light set |
|---|---|---|---|
| `hdl` | HDL sources, the same cyan as types in code | `#48E0FD` | `#027897` |
| `verification` | Verification files, the same teal as assertions and coverage | `#5EC4B6` | `#045255` |
| `time` | Waves and timing, the same blue as time in code | `#5C9DFF` | `#1A5CD0` |
| `automation` | Scripts, flows and models, the same green as functions | `#2BE98A` | `#157648` |
| `directive` | Tool configuration, filelists and constraints, the same orange as macros | `#FD9720` | `#AF5A00` |
| `data` | Memory images, registers, and the sequence family, the same violet as numbers | `#BD93F9` | `#844AD3` |
| `silicon` | Physical design, netlists and FPGA, the same orange-red as keywords | `#FF6B3A` | `#D02A10` |
| `neutral` | Logs and generic formats | `#9AA0A6` | `#6E7378` |
| `docs` | Documents | `#B5BAC0` | `#565B61` |
| `generated` | Tool output | `#5F646A` | `#ACB0B5` |
| `accent` | Packaged extensions | `#FD9720` | `#9F5400` |

### Folders: an on/off signal, like Ayu

- **Closed folder:** a flat, colorless gray silhouette (`#3A3F46` dark, `#C4C5C2` light) with its
  emblem barely visible. Tool output folders are dimmer still.
- **Open folder:** the same bright amber outline for every kind (`#FFB02E` dark, `#C87000` light),
  lit from inside, with a clock trace across it and an LED in the corner.
- A folder's kind only changes its emblem. Matching is by exact folder name, case-insensitive.

| Kind | Emblem | Folder names |
|---|---|---|
| `rtl` | chip | `rtl` `design` `hdl` `src` `source` `hw` `hardware` `ip` `ips` `core` `cores` `logic` `verilog` `systemverilog` `vhdl` |
| `top` | crown | `top` `tb_top` `harness` `testharness` `hdl_top` `hvl_top` `chip_top` `soc` `soc_top` |
| `intf` | plug | `if` `intf` `intfs` `interface` `interfaces` `vif` `bus` `buses` |
| `include` | box | `include` `inc` `includes` `common` `pkg` `pkgs` `package` `packages` `lib` `libs` `library` `libraries` `defines` `headers` `shared` |
| `tb` | flask | `tb` `testbench` `testbenches` `bench` `verif` `verification` `dv` `uvm` `ver` `validation` |
| `env` | layers | `env` `envs` `environment` `environments` |
| `agent` | agent | `agent` `agents` `vip` `vips` `uvc` `uvcs` `bfm` `bfms` `monitors` `drivers` |
| `seq` | chevrons | `seq` `seqs` `sequence` `sequences` `seq_lib` `seqlib` `sequence_lib` `vseq` `vseqs` `stimulus` `stim` |
| `tests` | check | `test` `tests` `testcase` `testcases` `tc` `tcs` `test_lib` `testlist` `testlists` |
| `sva` | shield | `sva` `assertion` `assertions` `asserts` `checker` `checkers` `props` `properties` `bind` `binds` |
| `cov` | target | `cov` `coverage` `fcov` `func_cov` `functional_coverage` `cover` `covergroups` `vplan` `vplans` |
| `formal` | sigma | `formal` `fv` `fpv` `jg` `jasper` `jaspergold` `sby` `proof` `proofs` `lec` `equivalence` |
| `scoreboard` | eye | `scoreboard` `scoreboards` `sb` `checkers_sb` `predictor` `predictors` |
| `ral` | grid | `ral` `regmodel` `reg_model` `regs` `registers` `register` `csr` `csrs` `rdl` `regblock` `reg` `ipxact` |
| `fw` | binary | `fw` `firmware` `sw` `software` `asm` `boot` `bootrom` `rom` `mem` `memory` `hex` |
| `waves` | pulse | `waves` `wave` `waveform` `waveforms` `dump` `dumps` `fsdb` `vcd` `vpd` `shm` `wlf` |
| `timing` | clock | `timing` `sta` `sdc` `clocks` `clock` `cdc` |
| `sim` | play | `sim` `sims` `simulation` `run` `runs` `build` `regression` `regressions` `regr` `nightly` `results` `result` `out` `output` `scratch` |
| `scripts` | terminal | `scripts` `script` `tcl` `bin` `tools` `tool` `utils` `util` `flow` `flows` `make` `py` `python` `perl` `shell` `automation` `ci` |
| `model` | cube | `model` `models` `ref_model` `refmodel` `golden` `c_model` `cmodel` `dpi` `c` `cpp` `sc` `systemc` `reference` `cocotb` |
| `config` | gear | `config` `configs` `cfg` `cfgs` `configuration` `settings` `setup` `.vscode` `.idea` |
| `filelists` | lines | `filelist` `filelists` `flist` `flists` `files` `manifest` `manifests` |
| `lint` | magnifier | `lint` `linting` `spyglass` `rdc` `ascent` `verilator` `waivers` `waiver` `quality` |
| `syn` | gate | `syn` `synth` `synthesis` `netlist` `netlists` `gls` `gate` `gates` `pnr` `layout` `dft` `power` `upf` `constraints` `implementation` `impl` |
| `fpga` | board | `fpga` `emu` `emulation` `zebu` `palladium` `proto` `prototype` `prototyping` `board` `boards` `vivado` `quartus` |
| `logs` | lines | `log` `logs` `report` `reports` `rpt` `transcripts` |
| `docs` | book | `doc` `docs` `documentation` `spec` `specs` `specification` `manual` `manuals` `notes` `plan` `plans` |
| `git` | branch | `.git` `.github` `.gitlab` `.gitea` |
| `generated` | gear, dimmer when closed | `csrc` `simv.daidir` `simv.vdb` `xcelium.d` `inca_libs` `work` `dvefiles` `verdilog` `verdi_log` `novas` `urgreport` `cov_work` `covhtmlreport` `xsim.dir` `.xil` `obj_dir` `sim_build` `waves.shm` `.simvision` `ucli.key.d` `__pycache__` `.pytest_cache` `node_modules` `dist` `.cache` `.mypy_cache` `.tox` |

### Files

A page with a colored tag band and a dot-matrix label, or a page with an emblem. Any other file gets a plain gray page.

| Kind | Icon | Color | Extensions | File names |
|---|---|---|---|---|
| `sv` | page with a `SV` tag | `hdl` | `.sv` |  |
| `svh` | page with a `SVH` tag | `hdl` | `.svh` |  |
| `svi` | page with a `SVI` tag | `hdl` | `.svi` |  |
| `v` | page with a `V` tag | `hdl` | `.v` `.vl` `.vlib` |  |
| `vh` | page with a `VH` tag | `hdl` | `.vh` |  |
| `vhdl` | page with a `VHD` tag | `hdl` | `.vhd` `.vhdl` `.vho` |  |
| `vams` | page with a `AMS` tag | `hdl` | `.vams` `.va` |  |
| `sva` | page with a `SVA` tag | `verification` | `.sva` |  |
| `uvm` | page with a `UVM` tag | `verification` |  | `uvm_pkg.sv` `uvm_macros.svh` `uvm.sv` `uvm_pkg.svh` |
| `pss` | page with a `PSS` tag | `verification` | `.pss` |  |
| `specman` | page with a `E` tag | `verification` | `.e` |  |
| `vera` | page with a `VR` tag | `verification` | `.vr` `.vrh` `.vri` |  |
| `psl` | page with a `PSL` tag | `verification` | `.psl` |  |
| `coverage` | page with a target emblem | `verification` | `.ucdb` `.ucd` `.ucm` `.vdb` `.cov` `.covdb` `.exclude` `.el.exclude` |  |
| `vplan` | page with a check emblem | `verification` | `.hvp` `.vplan` `.vplanx` `.vsif` `.vsof` |  |
| `sby` | page with a sigma emblem | `verification` | `.sby` |  |
| `waves` | page with a pulse emblem | `time` | `.vcd` `.evcd` `.fsdb` `.vpd` `.wlf` `.fst` `.ghw` `.lxt` `.lxt2` `.trn` `.dsn` `.saif` `.wdb` `.shm` `.vcd.gz` `.fsdb.gz` |  |
| `wavecfg` | page with a clock emblem | `time` | `.wcfg` `.gtkw` `.svcf` `.rc` `.ses` `.wave.do` |  |
| `sdf` | page with a `SDF` tag | `time` | `.sdf` `.sdf.gz` |  |
| `tcl` | page with a `TCL` tag | `automation` | `.tcl` `.tk` `.tm` `.jou` |  |
| `do` | page with a `DO` tag | `automation` | `.do` |  |
| `python` | page with a `PY` tag | `automation` | `.py` `.pyw` `.pyi` `.ipynb` |  |
| `perl` | page with a `PL` tag | `automation` | `.pl` `.pm` `.pod` `.t` |  |
| `shell` | page with a `SH` tag | `automation` | `.sh` `.bash` `.zsh` `.ksh` `.csh` `.tcsh` | `.bashrc` `.cshrc` `.tcshrc` `.zshrc` `.profile` `.login` `.envrc` `sourceme` `setup` `modulefile` |
| `make` | page with a `MK` tag | `automation` | `.mk` `.make` `.mak` | `makefile` `gnumakefile` `makefile.inc` `rules.mk` |
| `yosys` | page with a `YS` tag | `automation` | `.ys` |  |
| `c` | page with a `C` tag | `automation` | `.c` |  |
| `cpp` | page with a `CPP` tag | `automation` | `.cpp` `.cc` `.cxx` `.c++` |  |
| `h` | page with a `H` tag | `automation` | `.h` |  |
| `hpp` | page with a `HPP` tag | `automation` | `.hpp` `.hh` `.hxx` |  |
| `filelist` | page with a `F` tag | `directive` | `.f` `.vc` `.flist` `.filelist` |  |
| `args` | page with a `ARG` tag | `directive` | `.args` `.opts` |  |
| `toolcfg` | page with a gear emblem | `directive` | `.vlt` `.sgdc` `.awl` `.swl` `.waiver` `.prj` `.xpe` | `cds.lib` `hdl.var` `modelsim.ini` `synopsys_sim.setup` `.synopsys_dc.setup` `.synopsys_vcs.setup` `xsim.ini` `novas.rc` `verdi.cmd` `.simvisionrc` `ucli.key` `.xrunrc` |
| `sdc` | page with a `SDC` tag | `directive` | `.sdc` |  |
| `xdc` | page with a `XDC` tag | `directive` | `.xdc` |  |
| `ucf` | page with a `UCF` tag | `directive` | `.ucf` |  |
| `qsf` | page with a `QSF` tag | `directive` | `.qsf` |  |
| `pinmap` | page with a `PCF` tag | `directive` | `.pcf` `.lpf` |  |
| `power` | page with a bolt emblem | `directive` | `.upf` `.cpf` |  |
| `netlist` | page with a gate emblem | `silicon` | `.vg` `.vm` `.vo` `.edf` `.edif` `.edn` `.netlist` `.ngc` `.v.gz` |  |
| `spice` | page with a `SP` tag | `silicon` | `.sp` `.spi` `.spice` `.cdl` `.cir` `.scs` |  |
| `liberty` | page with a `LIB` tag | `silicon` | `.lib` `.lib.gz` |  |
| `db` | page with a `DB` tag | `silicon` | `.db` `.ndm` |  |
| `lef` | page with a `LEF` tag | `silicon` | `.lef` |  |
| `def` | page with a `DEF` tag | `silicon` | `.def` `.def.gz` |  |
| `gds` | page with a `GDS` tag | `silicon` | `.gds` `.gds2` `.gdsii` `.oas` `.oasis` |  |
| `spef` | page with a `SPF` tag | `silicon` | `.spef` `.spef.gz` `.dspf` |  |
| `fpgaproj` | page with a board emblem | `silicon` | `.xpr` `.qpf` `.xci` `.bd` `.dcp` `.xise` `.qsys` `.ip` |  |
| `bitstream` | page with a `BIT` tag | `silicon` | `.bit` `.sof` `.pof` `.mcs` `.jic` `.bin.bit` |  |
| `protected` | page with a lock emblem | `silicon` | `.svp` `.vp` `.svhp` `.vhdp` `.vhdlp` `.enc` `.protected` |  |
| `mem` | page with a binary emblem | `data` | `.hex` `.mem` `.mif` `.coe` `.dat` `.vmem` `.srec` `.ihex` `.bin` `.img` |  |
| `elf` | page with a `ELF` tag | `data` | `.elf` `.axf` `.o` |  |
| `regs` | page with a grid emblem | `data` | `.rdl` `.ralf` `.ipxact` `.hjson` `.regs` `.csr` |  |
| `log` | page with a lines emblem | `neutral` | `.log` `.rpt` `.sum` `.out` | `transcript` |
| `markdown` | page with a `MD` tag | `docs` | `.md` `.markdown` `.mdx` |  |
| `text` | page with a `TXT` tag | `docs` | `.txt` `.text` |  |
| `rst` | page with a `RST` tag | `docs` | `.rst` `.adoc` `.asciidoc` |  |
| `pdf` | page with a `PDF` tag | `docs` | `.pdf` |  |
| `doc` | page with a `DOC` tag | `docs` | `.doc` `.docx` `.odt` `.rtf` |  |
| `sheet` | page with a `XLS` tag | `docs` | `.xls` `.xlsx` `.xlsm` `.ods` |  |
| `csv` | page with a `CSV` tag | `docs` | `.csv` `.tsv` |  |
| `license` | page with a `LIC` tag | `docs` |  | `license` `license.md` `license.txt` `copying` `notice` `third_party_notices.md` |
| `readme` | page with a `RD` tag | `docs` |  | `readme` `readme.md` `readme.txt` `readme.rst` |
| `changelog` | page with a `CHG` tag | `docs` |  | `changelog` `changelog.md` `changes.md` `history.md` |
| `json` | page with a braces emblem | `neutral` | `.json` `.jsonc` `.json5` |  |
| `yaml` | page with a `YML` tag | `neutral` | `.yml` `.yaml` |  |
| `toml` | page with a `TML` tag | `neutral` | `.toml` |  |
| `xml` | page with a `XML` tag | `neutral` | `.xml` `.xsd` `.xsl` |  |
| `ini` | page with a `INI` tag | `neutral` | `.ini` `.cfg` `.conf` `.properties` `.env` |  |
| `git` | page with a branch emblem | `neutral` |  | `.gitignore` `.gitattributes` `.gitmodules` `.gitkeep` |
| `docker` | page with a `DKR` tag | `neutral` |  | `dockerfile` `containerfile` `docker-compose.yml` |
| `image` | page with a picture emblem | `neutral` | `.png` `.jpg` `.jpeg` `.gif` `.svg` `.bmp` `.ico` `.webp` `.drawio` |  |
| `archive` | page with a archive emblem | `neutral` | `.zip` `.tar` `.gz` `.tgz` `.bz2` `.xz` `.7z` `.rar` |  |
| `js` | page with a `JS` tag | `neutral` | `.js` `.mjs` `.cjs` |  |
| `ts` | page with a `TS` tag | `neutral` | `.ts` `.mts` `.cts` |  |
| `html` | page with a `HTM` tag | `neutral` | `.html` `.htm` |  |
| `vsix` | page with a box emblem | `accent` | `.vsix` |  |

### Class icons for SystemVerilog files

The Posedge extension reads `.sv`, `.svh` and `.svi` files as text and gives each file the pictogram of the class it
declares, following `extends` chains across files. When no UVM base class is found, the class name and then the file name
are matched against the suffixes. The same roles give the two-letter badge beside the file name.

| Role | Picture | Color | Badge | From base class | Or a name ending in |
|---|---|---|---|---|---|
| UVM virtual sequence (`vsequence`) | Three smaller items in a dashed frame: virtual, it only starts other sequences. | `data` | `VS` | - | `_vseq` `_virtual_seq` `_virtual_sequence` `_vseq_lib` |
| UVM virtual sequencer (`vsequencer`) | The same cannon with a dashed barrel: virtual, it holds no shot of its own. | `data` | `VQ` | - | `_vsqr` `_vseqr` `_virtual_sequencer` `_vsequencer` |
| UVM sequence item (`item`) | One large item, which is what a sequence is made of: one transaction. | `data` | `TX` | `uvm_sequence_item` | `_seq_item` `_item` `_txn` `_trans` `_transaction` `_tr` `_pkt` `_packet` |
| UVM sequencer (`sequencer`) | A cannon on its wheel, barrel up and to the right: it fires what the sequences load. | `data` | `SQ` | `uvm_sequencer` `uvm_sequencer_base` `uvm_sequencer_param_base` `uvm_push_sequencer` | `_sqr` `_seqr` `_sequencer` |
| UVM sequence (`sequence`) | Three small items sitting side by side, ready to fire. | `data` | `SE` | `uvm_sequence` `uvm_sequence_base` `uvm_reg_sequence` | `_seq` `_seqs` `_sequence` `_sequences` `_seq_lib` `_sequence_lib` |
| UVM driver (`driver`) | A steering wheel: rim, hub and three spokes. | `automation` | `DR` | `uvm_driver` `uvm_push_driver` | `_drv` `_driver` `_bfm` |
| UVM monitor (`monitor`) | An eye. | `verification` | `MO` | `uvm_monitor` | `_mon` `_monitor` |
| UVM agent (`agent`) | A person wearing a headset with a boom microphone. | `silicon` | `AG` | `uvm_agent` | `_agt` `_agent` |
| Reset handler (`reset`) | One arrow going around a circle, the sign for restart: everything returns to its initial state. | `time` | `RH` | - | `_reset_handler` `_rst_handler` `_reset_hdlr` `_rst_hdlr` `_reset_hndlr` `_rst_hndlr` `reset_handler` `rst_handler` |
| UVM scoreboard (`scoreboard`) | A box with a green (match) and a red (mismatch) light. | `neutral` | `SB` | `uvm_scoreboard` | `_sb` `_scb` `_scbd` `_scoreboard` |
| UVM predictor / reference model (`predictor`) | A crystal ball: the reference model predicts the expected result. | `verification` | `PR` | `uvm_reg_predictor` | `_predictor` `_pred` `_ref_model` `_refmodel` `_model` |
| UVM register adapter (`adapter`) | A plug: it makes register operations fit the bus. | `data` | `AD` | `uvm_reg_adapter` | `_adapter` `_reg_adapter` `_reg2bus` |
| UVM register model (`regmodel`) | A register map with one field selected. | `data` | `RG` | `uvm_reg_block` `uvm_reg` `uvm_reg_file` `uvm_mem` | `_reg_block` `_regblock` `_reg_model` `_regmodel` `_ral` `_regs` `_reg_pkg` |
| Functional coverage (`coverage`) | A Wi-Fi signal: how much of the space has been reached. | `verification` | `CV` | - | `_cov` `_coverage` `_cg` `_covergroup` `_fcov` |
| UVM subscriber (`subscriber`) | An inbox: a subscriber receives what is broadcast. | `verification` | `SU` | `uvm_subscriber` | `_subscriber` |
| UVM callback (`callback`) | An arrow turning back. | `data` | `CB` | `uvm_callback` | `_cb` `_cbs` `_callback` `_callbacks` |
| Assertions / checker (`assertion`) | A shield with a check mark. | `verification` | `AS` | - | `_sva` `_assert` `_assertions` `_checker` `_props` `_properties` `_chk` |
| UVM environment (`env`) | A hierarchy: the environment contains the agents. | `silicon` | `EN` | `uvm_env` | `_env` `_environment` |
| Configuration object (`config`) | Two sliders. | `data` | `CF` | - | `_cfg` `_config` `_configuration` |
| UVM test (`test`) | A lab flask. | `silicon` | `TS` | `uvm_test` | `_test` `_tests` `_test_lib` `_base_test` |
| Interface (`interface`) | Two arrows, one above the other, pointing in opposite directions: signals cross it both ways. | `hdl` | `IF` | - | `_if` `_intf` `_interface` `_vif` |
| Bind file (`bind`) | Two chain links. | `hdl` | `BD` | - | `_bind` `_binds` |
| Package (`package`) | A parcel. | `hdl` | `PK` | - | `_pkg` `_package` |
| Defines / macros / types (`defines`) | A hash sign. | `directive` | `DF` | - | `_defines` `_define` `_defs` `_macros` `_macro` `_params` `_types` `_typedefs` |
| Testbench top (`top`) | A chip: the top level that holds the design. | `hdl` | `TB` | - | `_tb_top` `_tb` `_top` `_harness` `_th` `tb_top` `tb` `top` `testbench` `harness` `hdl_top` `hvl_top` |

## Where it comes from

| To change | Edit |
|---|---|
| A raw color | `design/palette.mts` |
| Which hue and style a role uses, contrast rules | `design/roles.mts` |
| Which family a keyword belongs to | `design/keywords.mts` |
| UVM names, roles, badges and suffixes | `design/uvm.mts` |
| Interface colors | `design/workbench.mts` |
| Which files and folders get which icon | `design/icons/registry.mts` |
| Class pictograms and their `look` | `design/icons/roles.mts` |
| Folder and page shapes, fading | `design/icons/shapes.mts` |

Then run `npm run build`, which also regenerates this file. `AGENTS.md` has the rules and the history behind each choice.

## Not part of Posedge

The project owner's own VS Code has extras that other Posedge users do not get, so screenshots from that machine can look
different: JetBrains Mono in the Explorer and on tab names, no filled row backgrounds, the current file and its parent folder
names in orange, open folder names semi-bold, a soft glow on the current file's icon, and Move Up / Move Down to set the order
of files inside a folder. They come from patches to VS Code itself, not from the themes or icons.
