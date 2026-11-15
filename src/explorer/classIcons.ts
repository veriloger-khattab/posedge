// Gives each SystemVerilog file the icon of the class it declares: an eye for a monitor, a steering
// wheel for a driver, ... VS Code icon themes cannot read files, so this scans the workspace as text
// and records the result in Posedge's own icon theme files (see iconMap.mts). VS Code reads those at
// startup, so known files have the right icon before any of this code runs.
//
// Each version of an extension gets a new folder, so an update would start with empty theme files and
// show generic icons until a scan finished. The map is therefore also kept in VS Code's extension state,
// which survives updates, and put back as soon as the extension starts.
//
// It reads *.sv, *.svh and *.svi files, and writes only inside its own extension folder and state.

import * as vscode from 'vscode';
import { CLASS_ICON_EXTENSIONS, type UvmRole } from '../../design/uvm.mts';
import { applyClassIcons, mergeClassIcons, sameIcons, type ClassIcons as IconMap, type IconTheme } from './iconMap.mts';
import { classTable, roleForFile, scanSource, type SvFacts } from './svClasses.mts';

const GLOB = `**/*.{${CLASS_ICON_EXTENSIONS.join(',')}}`;
// Tool output and dependencies: never worth scanning, and often huge.
const EXCLUDE = '**/{node_modules,.git,csrc,xcelium.d,INCA_libs,simv.daidir,simv.vdb,work,obj_dir,sim_build,.Xil,xsim.dir}/**';
const MAX_FILES = 5000;
const MAX_BYTES = 2_000_000; // generated register models: the file name is enough for those
const THEMES = ['icons/posedge-icon-theme.json', 'icons/posedge-still-icon-theme.json'];
const OUR_ICON_THEMES = ['posedge-icons', 'posedge-icons-still'];
const SAVED_MAP = 'classIcons'; // key in the extension's global state

const baseName = (uri: vscode.Uri): string => uri.path.slice(uri.path.lastIndexOf('/') + 1);

export class ClassIcons implements vscode.Disposable {
  private readonly changed = new vscode.EventEmitter<void>();
  /** Fires when the role of a file may have changed. */
  readonly onDidChange = this.changed.event;

  private readonly facts = new Map<string, { name: string; facts: SvFacts }>();
  private roles = new Map<string, UvmRole>();
  private readonly disposables: vscode.Disposable[] = [];
  private timer: ReturnType<typeof setTimeout> | undefined;
  private publishing: Promise<void> = Promise.resolve();

  constructor(private readonly context: vscode.ExtensionContext) {
    const watcher = vscode.workspace.createFileSystemWatcher(GLOB);
    this.disposables.push(
      watcher,
      watcher.onDidCreate((uri) => void this.refreshFile(uri)),
      watcher.onDidChange((uri) => void this.refreshFile(uri)),
      watcher.onDidDelete((uri) => {
        this.facts.delete(uri.toString());
        this.schedule();
      }),
      vscode.workspace.onDidChangeWorkspaceFolders(() => void this.rescan()),
      vscode.workspace.onDidChangeConfiguration((e) => {
        if (e.affectsConfiguration('posedge.explorer.classIcons')) void this.rescan();
        else if (e.affectsConfiguration('workbench.iconTheme')) this.schedule();
      }),
    );
    // The scan runs outside the window's own thread, so it need not wait for the window to settle.
    this.publishing = this.restore();
    void this.rescan();
  }

  private get enabled(): boolean {
    return vscode.workspace.getConfiguration('posedge.explorer').get('classIcons', true);
  }

  /** The role of a file from the classes it declares, if it has been scanned. */
  roleFor(uri: vscode.Uri): UvmRole | undefined {
    return this.roles.get(uri.toString());
  }

  async rescan(): Promise<void> {
    this.facts.clear();
    if (this.enabled) {
      const files = await vscode.workspace.findFiles(GLOB, EXCLUDE, MAX_FILES);
      // A few at a time: on a network drive, thousands of parallel reads hurt everything else.
      for (let i = 0; i < files.length; i += 16) await Promise.all(files.slice(i, i + 16).map((uri) => this.read(uri)));
    }
    this.update();
  }

  private async read(uri: vscode.Uri): Promise<void> {
    try {
      const { size } = await vscode.workspace.fs.stat(uri);
      if (size > MAX_BYTES) return;
      const text = new TextDecoder().decode(await vscode.workspace.fs.readFile(uri));
      this.facts.set(uri.toString(), { name: baseName(uri), facts: scanSource(text) });
    } catch {
      this.facts.delete(uri.toString()); // gone or unreadable: the file name still gives a badge
    }
  }

  private async refreshFile(uri: vscode.Uri): Promise<void> {
    if (!this.enabled || /\/(?:node_modules|\.git)\//.test(uri.path)) return;
    await this.read(uri);
    this.schedule();
  }

  private schedule(): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.update(), 800);
  }

  private update(): void {
    const table = classTable([...this.facts.values()].map((f) => f.facts));
    const roles = new Map<string, UvmRole>();
    const found: IconMap = {};
    for (const [key, file] of this.facts) {
      const role = roleForFile(file.name, file.facts, table);
      if (!role) continue;
      roles.set(key, role);
      found[file.name.toLowerCase()] = role.id;
    }
    this.roles = roles;
    this.changed.fire();
    const scanned = [...this.facts.values()].map((f) => f.name.toLowerCase());
    this.publishing = this.publishing.then(() => this.publish((current) => (this.enabled ? mergeClassIcons(current, scanned, found) : {})));
  }

  /** After an update the theme files are empty: fill them from the saved map, with no scan to wait for. */
  private async restore(): Promise<void> {
    const saved = this.context.globalState.get<IconMap>(SAVED_MAP);
    if (saved && this.enabled) await this.publish((current) => (Object.keys(current).length ? current : saved));
  }

  /** Writes the icon map into Posedge's own icon themes. Failing is fine: the fixed icons still work. */
  private async publish(next: (current: IconMap) => IconMap): Promise<void> {
    // Keeps a development checkout's generated files clean.
    if (this.context.extensionMode !== vscode.ExtensionMode.Production) return;
    const iconTheme = vscode.workspace.getConfiguration('workbench').get<string>('iconTheme') ?? '';
    if (this.enabled && !OUR_ICON_THEMES.includes(iconTheme)) return;
    try {
      let applied: IconMap = {};
      for (const path of THEMES) {
        const uri = vscode.Uri.joinPath(this.context.extensionUri, path);
        const theme = JSON.parse(new TextDecoder().decode(await vscode.workspace.fs.readFile(uri))) as IconTheme;
        if (applyClassIcons(theme, next(theme.posedgeClassIcons ?? {}))) await vscode.workspace.fs.writeFile(uri, new TextEncoder().encode(`${JSON.stringify(theme, null, 2)}\n`));
        applied = theme.posedgeClassIcons ?? {};
      }
      if (!sameIcons(applied, this.context.globalState.get<IconMap>(SAVED_MAP) ?? {})) await this.context.globalState.update(SAVED_MAP, applied);
    } catch (error) {
      console.warn('Posedge: could not update the class icons', error); // e.g. a read-only extensions folder
    }
  }

  dispose(): void {
    if (this.timer) clearTimeout(this.timer);
    this.changed.dispose();
    for (const d of this.disposables) d.dispose();
  }
}
