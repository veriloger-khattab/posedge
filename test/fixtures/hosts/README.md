# Host grammars (test fixtures only)

Posedge's grammars are *injections*: VS Code applies them on top of whatever grammar another
extension provides for SystemVerilog, Verilog, filelists and logs. The tests tokenize real files
with these host grammars plus the Posedge injections, exactly as VS Code does.

| Folder | Source | License |
|---|---|---|
| `mshr-h/` | Verilog-HDL/SystemVerilog extension by Masahiro H (mshr-h.veriloghdl 1.29.0), grammar derived from eirikpre/VSCode-SystemVerilog | MIT (see `mshr-h/LICENSE.txt`) |
| `vscode-log/` | VS Code's built-in Log grammar, converted from emilast/vscode-logfile-highlighter | MIT |

These files are never shipped in the VSIX.
