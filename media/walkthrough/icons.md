# Turn on Posedge Icons

- **Posedge Icons**: closed folders stay dark; open folders light up amber with a tiny clock trace running inside.
- **Posedge Icons (Still)**: the same art without motion, for remote desktops, VDI and reduced-motion setups.

File icon colors follow the code colors: cyan for HDL sources, teal for verification, blue for waves and
timing, green for scripts, orange for tool configuration and filelists, purple for data and registers.
Closed tool-generated folders (`csrc`, `xcelium.d`, `work`, `simv.daidir`, …) are dimmer still, so you know not to edit them.

**Class icons**: `.sv`, `.svh` and `.svi` files show the class they declare. A driver gets a steering wheel, a monitor an
eye, an agent a person with a headset, coverage a Wi-Fi signal, a scoreboard a box with green and red lights
(turn off with `posedge.explorer.classIcons`).

UVM files also get a role badge in the Explorer: **DR** driver, **MO** monitor, **SB** scoreboard,
**SE** sequence, **TX** item, **EN** environment, **TS** test … (toggle with *Posedge: Toggle UVM Role Badges*).
