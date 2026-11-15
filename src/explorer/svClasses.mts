// Works out a SystemVerilog file's role from what it declares: `class x extends uvm_driver` is a
// driver, even through project base classes in other files. Pure text analysis (nothing is compiled
// or executed), so it is unit-tested without VS Code.

import { UVM_BASE_CLASSES, UVM_ROLES, type RoleId, type UvmRole } from '../../design/uvm.mts';
import { roleForFileName } from './uvmRoles.mts';

export interface SvClass {
  name: string;
  parent?: string;
  covergroup: boolean;
}

export interface SvFacts {
  classes: SvClass[];
  package: boolean;
  interface: boolean;
  checker: boolean;
  /** Declares properties but no logic of its own, like a bound assertion module. */
  assertions: boolean;
  /** Only `define directives, no design units. */
  definesOnly: boolean;
}

/** Blanks comments and string contents (keeping offsets), so nothing inside them is taken for code. */
export function stripCommentsAndStrings(text: string): string {
  let out = '';
  let i = 0;
  while (i < text.length) {
    const c = text[i];
    const next = text[i + 1];
    if (c === '/' && next === '/') {
      const end = text.indexOf('\n', i);
      const stop = end < 0 ? text.length : end;
      out += ' '.repeat(stop - i);
      i = stop;
    } else if (c === '/' && next === '*') {
      const end = text.indexOf('*/', i + 2);
      const stop = end < 0 ? text.length : end + 2;
      out += text.slice(i, stop).replace(/[^\n]/g, ' ');
      i = stop;
    } else if (c === '"') {
      let j = i + 1;
      while (j < text.length && text[j] !== '"' && text[j] !== '\n') j += text[j] === '\\' ? 2 : 1;
      out += ' '.repeat(Math.min(j + 1, text.length) - i);
      i = j + 1;
    } else {
      out += c;
      i++;
    }
  }
  return out;
}

/** Returns the offset just past a `#( ... )` parameter list starting at or after `from`, if any. */
function skipParameters(code: string, from: number): number {
  const head = /\s*#\s*\(/y;
  head.lastIndex = from;
  if (!head.test(code)) return from;
  let depth = 1;
  let i = head.lastIndex;
  while (i < code.length && depth > 0) {
    if (code[i] === '(') depth++;
    else if (code[i] === ')') depth--;
    i++;
  }
  return i;
}

const CLASS = /(?<![\w$])(?<!\btypedef\s+)(?<!\binterface\s+)class\s+(?:(?:static|automatic)\s+)?([A-Za-z_][\w$]*)/g;
const EXTENDS = /\s*extends\s+(?:[A-Za-z_][\w$]*::)*([A-Za-z_][\w$]*)/y;

export function scanSource(text: string): SvFacts {
  const code = stripCommentsAndStrings(text);
  const classes: SvClass[] = [];
  for (const m of code.matchAll(CLASS)) {
    EXTENDS.lastIndex = skipParameters(code, m.index + m[0].length);
    const parent = EXTENDS.exec(code)?.[1];
    const end = code.indexOf('endclass', m.index);
    const body = code.slice(m.index, end < 0 ? code.length : end);
    classes.push({ name: m[1], parent, covergroup: /(?<![\w$])covergroup\s/.test(body) });
  }
  const has = (re: RegExp): boolean => re.test(code);
  const unit = has(/(?<![\w$])(?:module|macromodule|program|interface|package|checker)\s/);
  return {
    classes,
    package: has(/(?<![\w$])package\s+[A-Za-z_]/),
    interface: has(/(?<![\w$])(?<!\bvirtual\s+)interface\s+(?!class\b)[A-Za-z_]/),
    checker: has(/(?<![\w$])checker\s+[A-Za-z_]/),
    assertions: has(/(?<![\w$])property\s+[A-Za-z_]/) && !has(/(?<![\w$])(?:always|always_ff|always_comb|always_latch|assign)(?![\w$])/),
    definesOnly: !classes.length && !unit && has(/`define\s/),
  };
}

/** Class name -> parent class, across every scanned file. */
export type ClassTable = ReadonlyMap<string, string | undefined>;

export function classTable(files: Iterable<SvFacts>): Map<string, string | undefined> {
  const table = new Map<string, string | undefined>();
  for (const facts of files) for (const c of facts.classes) table.set(c.name, c.parent);
  return table;
}

const roleById = (id: RoleId): UvmRole => UVM_ROLES.find((r) => r.id === id)!;

function roleForName(name: string): UvmRole | undefined {
  const lower = name.toLowerCase();
  return UVM_ROLES.find((r) => r.suffixes.some((s) => lower.endsWith(s) && lower.length > s.length));
}

/** Walks a class up its `extends` chain. The UVM base class decides; names break the ties it leaves open. */
export function roleForClass(c: SvClass, table: ClassTable): UvmRole | undefined {
  let base: RoleId | undefined;
  let named: UvmRole | undefined;
  const seen = new Set<string>();
  let name: string | undefined = c.name;
  while (name && !seen.has(name)) {
    seen.add(name);
    base = UVM_BASE_CLASSES[name];
    if (base) break;
    named ??= roleForName(name);
    name = name === c.name ? c.parent : table.get(name);
  }
  // A UVM base class cannot tell a virtual sequence from a sequence; the name can.
  if (base === 'sequence' && named?.id === 'vsequence') return named;
  if (base === 'sequencer' && named?.id === 'vsequencer') return named;
  // A subscriber or plain component holding a covergroup exists to collect coverage.
  if (c.covergroup && (!base || base === 'subscriber')) return roleById('coverage');
  return base ? roleById(base) : named;
}

/** The role of a file: the class named after it, else its first recognised class, else what it declares. */
export function roleForFile(fileName: string, facts: SvFacts, table: ClassTable): UvmRole | undefined {
  const stem = fileName.toLowerCase().replace(/\.[^.]+$/, '');
  const own = facts.classes.find((c) => c.name.toLowerCase() === stem);
  if (own) return roleForClass(own, table) ?? roleForFileName(fileName);
  if (facts.package) return roleById('package');
  for (const c of facts.classes) {
    const role = roleForClass(c, table);
    if (role) return role;
  }
  if (facts.interface) return roleById('interface');
  if (facts.checker || facts.assertions) return roleById('assertion');
  return roleForFileName(fileName) ?? (facts.definesOnly ? roleById('defines') : undefined);
}
