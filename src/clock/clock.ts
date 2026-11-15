// The status-bar clock: time (accent color) and date (dimmer), drawn with the JetBrains Mono glyph
// font. It wakes once a minute, aligned to :00 (every second only if the format shows seconds), and
// never touches the network, the file system or any other process.

import * as vscode from 'vscode';
import { DAYS, MONTHS, dayOfYear, formatClock, hasSeconds, isoTimestamp, toGlyphText, toPlainText } from './format.mts';
import { isoWeek, sundayWeek, type WorkWeekStyle } from './workweek.mts';

interface ClockConfig {
  enabled: boolean;
  timeFormat: string;
  dateFormat: string;
  workWeekStyle: WorkWeekStyle;
  timeZones: Array<{ label: string; timeZone: string }>;
  clickAction: 'copyTimestamp' | 'toggleSeconds' | 'none';
  alignment: 'left' | 'right';
  priority: number;
  useGlyphFont: boolean;
}

function readConfig(): ClockConfig {
  const c = vscode.workspace.getConfiguration('posedge.clock');
  return {
    enabled: c.get('enabled', true),
    timeFormat: c.get('timeFormat', '{HH}:{mm}'),
    dateFormat: c.get('dateFormat', '{ddd} {DD} {MMM} · WW{WW}'),
    workWeekStyle: c.get('workWeekStyle', 'iso'),
    timeZones: c.get('timeZones', []),
    clickAction: c.get('clickAction', 'copyTimestamp'),
    alignment: c.get('alignment', 'right'),
    priority: c.get('priority', -1000),
    useGlyphFont: c.get('useGlyphFont', true),
  };
}

const CLICK_COMMANDS: Record<ClockConfig['clickAction'], string | undefined> = {
  copyTimestamp: 'posedge.clock.copyTimestamp',
  toggleSeconds: 'posedge.clock.toggleSeconds',
  none: undefined,
};

export class Clock implements vscode.Disposable {
  private config = readConfig();
  private timeItem?: vscode.StatusBarItem;
  private dateItem?: vscode.StatusBarItem;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private readonly subscription: vscode.Disposable;

  constructor() {
    this.subscription = vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration('posedge.clock')) this.restart();
    });
    this.restart();
  }

  private restart(): void {
    this.stop();
    this.config = readConfig();
    if (!this.config.enabled) return;
    const alignment = this.config.alignment === 'left' ? vscode.StatusBarAlignment.Left : vscode.StatusBarAlignment.Right;
    // Higher priority = further left; keep the time to the left of the date.
    this.timeItem = vscode.window.createStatusBarItem('posedge.clock.time', alignment, this.config.priority + 1);
    this.timeItem.name = 'Posedge Clock';
    this.timeItem.color = new vscode.ThemeColor('posedge.clockForeground');
    this.timeItem.command = CLICK_COMMANDS[this.config.clickAction];
    this.dateItem = vscode.window.createStatusBarItem('posedge.clock.date', alignment, this.config.priority);
    this.dateItem.name = 'Posedge Date';
    this.dateItem.color = new vscode.ThemeColor('posedge.dateForeground');
    this.dateItem.command = CLICK_COMMANDS[this.config.clickAction];
    this.tick();
  }

  private tick(): void {
    const now = new Date();
    this.render(now);
    const step = hasSeconds(this.config.timeFormat) ? 1000 : 60_000;
    const wait = step - (now.getTime() % step) + 15; // wake just after the boundary
    this.timer = setTimeout(() => this.tick(), wait);
  }

  private render(now: Date): void {
    const { timeFormat, dateFormat, workWeekStyle, useGlyphFont } = this.config;
    const draw = useGlyphFont ? toGlyphText : toPlainText;
    const time = formatClock(timeFormat, now, workWeekStyle);
    const date = formatClock(dateFormat, now, workWeekStyle);
    const tooltip = this.tooltip(now);
    const label = `${DAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}, ${time}`;
    for (const [item, text] of [
      [this.timeItem, time],
      [this.dateItem, date],
    ] as const) {
      if (!item) continue;
      if (!text.trim()) {
        item.hide();
        continue;
      }
      item.text = draw(text);
      item.tooltip = tooltip;
      item.accessibilityInformation = { label, role: 'button' };
      item.show();
    }
  }

  private tooltip(now: Date): vscode.MarkdownString {
    const iso = isoWeek(now);
    const sun = sundayWeek(now);
    const pad = (n: number): string => String(n).padStart(2, '0');
    const rows: string[] = [
      `| | |`,
      `|:--|:--|`,
      `| ISO week | ${iso.year}-W${pad(iso.week)}, day ${iso.day} |`,
      `| Work week (Sunday start) | WW${pad(sun.week)}.${sun.day} |`,
      `| Day of year | ${dayOfYear(now)} · Q${Math.floor(now.getMonth() / 3) + 1} |`,
    ];
    const zones = [{ label: 'UTC', timeZone: 'UTC' }, ...this.config.timeZones];
    for (const z of zones) {
      try {
        const t = new Intl.DateTimeFormat('en-GB', {
          timeZone: z.timeZone,
          hour: '2-digit',
          minute: '2-digit',
          weekday: 'short',
          hourCycle: 'h23',
        }).format(now);
        rows.push(`| ${z.label} | ${t} |`);
      } catch {
        rows.push(`| ${z.label} | unknown time zone "${z.timeZone}" |`);
      }
    }
    const md = new vscode.MarkdownString(
      `**${formatClock('{HH}:{mm}:{ss}', now)}** · ${formatClock('{dddd} {D} {MMMM} {YYYY}', now)}\n\n${rows.join('\n')}`,
    );
    if (this.config.clickAction === 'copyTimestamp') md.appendMarkdown(`\n\nClick to copy \`${isoTimestamp(now)}\``);
    return md;
  }

  private stop(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = undefined;
    this.timeItem?.dispose();
    this.dateItem?.dispose();
    this.timeItem = this.dateItem = undefined;
  }

  dispose(): void {
    this.stop();
    this.subscription.dispose();
  }
}
