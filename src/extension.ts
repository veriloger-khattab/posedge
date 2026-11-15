// Posedge runtime: the status-bar clock, class icons and UVM role badges. Everything else in the
// extension (color themes, icon themes, grammars) is declarative and needs no code.
//
// Safety: no network access, no child processes, no telemetry, no webviews. It reads SystemVerilog
// source as plain text for class icons and writes only its own icon theme files, inside its own
// extension folder, plus a copy of that list in VS Code's extension state (posedge.explorer.classIcons
// turns both off). The only settings it ever writes are its own (posedge.*), and only when you run a
// toggle command.

import * as vscode from 'vscode';
import { Clock } from './clock/clock.ts';
import { isoTimestamp, toggleSeconds } from './clock/format.mts';
import { ClassIcons } from './explorer/classIcons.ts';
import { UvmRoleBadges } from './explorer/roleBadges.ts';

export function activate(context: vscode.ExtensionContext): void {
  const classes = new ClassIcons(context);
  const badges = new UvmRoleBadges(classes);
  context.subscriptions.push(new Clock(), classes, badges, vscode.window.registerFileDecorationProvider(badges));

  const command = (id: string, run: () => unknown): void => {
    context.subscriptions.push(vscode.commands.registerCommand(id, run));
  };

  command('posedge.clock.copyTimestamp', async () => {
    const stamp = isoTimestamp(new Date());
    await vscode.env.clipboard.writeText(stamp);
    vscode.window.setStatusBarMessage(`$(check) Copied ${stamp}`, 2500);
  });

  command('posedge.clock.insertTimestamp', async () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) return;
    const stamp = isoTimestamp(new Date());
    await editor.edit((edit) => {
      for (const sel of editor.selections) edit.replace(sel, stamp);
    });
  });

  command('posedge.clock.toggle', async () => {
    const cfg = vscode.workspace.getConfiguration('posedge.clock');
    await cfg.update('enabled', !cfg.get('enabled', true), vscode.ConfigurationTarget.Global);
  });

  command('posedge.clock.toggleSeconds', async () => {
    const cfg = vscode.workspace.getConfiguration('posedge.clock');
    await cfg.update('timeFormat', toggleSeconds(cfg.get('timeFormat', '{HH}:{mm}')), vscode.ConfigurationTarget.Global);
  });

  command('posedge.explorer.toggleRoleBadges', async () => {
    const cfg = vscode.workspace.getConfiguration('posedge.explorer');
    await cfg.update('uvmRoleBadges', !cfg.get('uvmRoleBadges', true), vscode.ConfigurationTarget.Global);
  });

  command('posedge.explorer.refreshClassIcons', () => classes.rescan());
}

export function deactivate(): void {
  // Everything is disposed through context.subscriptions.
}
