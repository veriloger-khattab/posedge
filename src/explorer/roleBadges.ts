// Explorer badges for UVM roles: DR driver, MO monitor, SB scoreboard, ... next to SystemVerilog
// files. Badges never set a color.

import * as vscode from 'vscode';
import type { ClassIcons } from './classIcons.ts';
import { roleForFileName } from './uvmRoles.mts';

export class UvmRoleBadges implements vscode.FileDecorationProvider, vscode.Disposable {
  private readonly changed = new vscode.EventEmitter<undefined>();
  readonly onDidChangeFileDecorations = this.changed.event;
  private enabled = this.readEnabled();
  private readonly subscription = vscode.workspace.onDidChangeConfiguration((e) => {
    if (e.affectsConfiguration('posedge.explorer.uvmRoleBadges')) {
      this.enabled = this.readEnabled();
      this.changed.fire(undefined);
    }
  });
  private readonly classSubscription: vscode.Disposable;

  constructor(private readonly classes: ClassIcons) {
    this.classSubscription = classes.onDidChange(() => this.changed.fire(undefined));
  }

  private readEnabled(): boolean {
    return vscode.workspace.getConfiguration('posedge.explorer').get('uvmRoleBadges', true);
  }

  provideFileDecoration(uri: vscode.Uri): vscode.FileDecoration | undefined {
    if (!this.enabled) return undefined;
    const name = uri.path.slice(uri.path.lastIndexOf('/') + 1);
    const role = this.classes.roleFor(uri) ?? roleForFileName(name);
    return role ? new vscode.FileDecoration(role.badge, role.label) : undefined;
  }

  dispose(): void {
    this.subscription.dispose();
    this.classSubscription.dispose();
    this.changed.dispose();
  }
}
