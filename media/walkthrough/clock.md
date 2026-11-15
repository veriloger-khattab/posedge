# The JetBrains Mono clock

The status bar shows the time and date drawn with JetBrains Mono, for example `14:37   Sun 18 Oct · WW42`.

| Setting | Default | |
|---|---|---|
| `posedge.clock.timeFormat` | `{HH}:{mm}` | add `{ss}` for seconds, `{hh}`/`{A}` for 12-hour |
| `posedge.clock.dateFormat` | `{ddd} {DD} {MMM} · WW{WW}` | empty hides the date |
| `posedge.clock.workWeekStyle` | `iso` | or `sunday` (Intel-style WW) |
| `posedge.clock.timeZones` | `[]` | extra rows in the tooltip, e.g. `{ "label": "Austin", "timeZone": "America/Chicago" }` |
| `posedge.clock.clickAction` | `copyTimestamp` | or `toggleSeconds`, `none` |

Commands: **Posedge: Copy Timestamp**, **Posedge: Insert Timestamp**, **Posedge: Toggle Clock**.
