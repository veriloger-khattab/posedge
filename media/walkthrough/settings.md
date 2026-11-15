# Recommended editor settings

Posedge does not change your editor settings. These are the ones it is designed around; paste what you
like into your user settings:

```jsonc
{
  "editor.fontFamily": "'JetBrains Mono NL', 'JetBrains Mono', Consolas, monospace",
  "editor.fontSize": 13,
  "editor.lineHeight": 1.55,
  "editor.stickyScroll.enabled": true,      // keeps `class ...` / `task run_phase` visible while scrolling
  "editor.guides.bracketPairs": "active",
  "editor.rulers": [100],
  "workbench.tree.renderIndentGuides": "always", // the active guide lights up in the accent color
  "workbench.tree.indent": 12
}
```

Why **NL** (no ligatures)? In SystemVerilog `<=` is a non-blocking assignment, and a ligature would draw
it as `≤`.

Posedge sets one default for SystemVerilog and Verilog files only: `begin`/`end`, `class`/`endclass`
and friends stay out of bracket coloring, so a keyword always keeps its color. `()`, `[]` and `{}` have
one color at every nesting depth in every language, and turn red only when a bracket has no partner.
