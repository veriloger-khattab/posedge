// Class icons: a file gets the icon of the class it declares, not of its name.

import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { test } from 'node:test';
import { ROLE_ICONS } from '../design/icons/roles.mts';
import { UVM_BASE_CLASSES, UVM_ROLES } from '../design/uvm.mts';
import { applyClassIcons, mergeClassIcons, type IconTheme } from '../src/explorer/iconMap.mts';
import { classTable, roleForFile, scanSource, stripCommentsAndStrings } from '../src/explorer/svClasses.mts';
import { roleForFileName } from '../src/explorer/uvmRoles.mts';

const ROOT = join(import.meta.dirname, '..');

/** Role of the first file, given the whole project as { file name: source }. */
const roleOf = (project: Record<string, string>): string | undefined => {
  const facts = Object.entries(project).map(([name, text]) => [name, scanSource(text)] as const);
  return roleForFile(facts[0][0], facts[0][1], classTable(facts.map(([, f]) => f)))?.id;
};

function walk(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(join(dir, e.name)) : [join(dir, e.name)]));
}

test('the samples get the icon of the class inside', () => {
  const files = walk(join(ROOT, 'samples')).filter((f) => /\.(sv|svh)$/.test(f));
  const facts = new Map(files.map((f) => [f.split(/[\\/]/).pop()!, scanSource(readFileSync(f, 'utf8'))]));
  const table = classTable(facts.values());
  const expected: Record<string, string | undefined> = {
    'apb_driver.sv': 'driver',
    'apb_monitor.sv': 'monitor',
    'apb_agent.sv': 'agent',
    'apb_scoreboard.sv': 'scoreboard',
    'apb_coverage.sv': 'coverage',
    'apb_rand_seq.sv': 'sequence',
    'apb_seq_item.sv': 'item',
    'apb_env.sv': 'env',
    'apb_base_test.sv': 'test',
    'apb_config.sv': 'config',
    'apb_pkg.sv': 'package',
    'apb_if.sv': 'interface',
    'apb_sva.sv': 'assertion',
    'tb_top.sv': 'top',
    'apb_defines.svh': 'defines',
    'apb_slave.sv': undefined, // plain RTL keeps its SV icon
  };
  for (const [name, role] of Object.entries(expected)) assert.equal(roleForFile(name, facts.get(name)!, table)?.id, role, name);
});

test('the class decides, not the file name', () => {
  assert.equal(roleOf({ 'stuff.sv': 'class stuff extends uvm_monitor; endclass' }), 'monitor');
  assert.equal(roleOf({ 'apb_driver.sv': 'class apb_driver extends uvm_scoreboard; endclass' }), 'scoreboard');
});

test('every UVM base class maps to a known role', () => {
  const ids = new Set(UVM_ROLES.map((r) => r.id));
  for (const [cls, role] of Object.entries(UVM_BASE_CLASSES)) assert.ok(ids.has(role), `${cls} -> ${role}`);
});

test('roles are inherited through project base classes in other files', () => {
  assert.equal(
    roleOf({
      'my_drv.sv': 'class my_drv extends proj_mid;  endclass',
      'proj_mid.sv': 'class proj_mid extends proj_base; endclass',
      'proj_base.sv': 'virtual class proj_base extends uvm_driver #(tx); endclass',
    }),
    'driver',
  );
});

test('base classes outside the workspace fall back to the name', () => {
  assert.equal(roleOf({ 'x.sv': 'class apb_vip_mon extends vendor_base; endclass' }), 'monitor');
  assert.equal(roleOf({ 'x.sv': 'class foo extends vendor_scoreboard; endclass' }), 'scoreboard');
  assert.equal(roleOf({ 'foo.sv': 'class foo extends vendor_base; endclass' }), undefined);
});

test('parameters, package scopes and unusual layouts are parsed', () => {
  const parent = (src: string): string | undefined => scanSource(src).classes[0]?.parent;
  assert.equal(parent('class a #(int W = 8, type T = bit [W-1:0]) extends base #(T);'), 'base');
  assert.equal(parent('class a extends pkg::sub::base #(.N((2+3)*4));'), 'base');
  assert.equal(parent('virtual class a\n  #(type T = int)\n  extends\n  b;'), 'b');
  assert.equal(parent('class automatic a extends b;'), 'b');
  assert.equal(parent('class a;'), undefined);
});

test('forward declarations, comments and strings are not classes', () => {
  assert.deepEqual(scanSource('typedef class apb_driver;').classes, []);
  assert.deepEqual(scanSource('interface class api; endclass').classes, []);
  assert.deepEqual(scanSource('// class a extends uvm_driver;\n/* class b extends uvm_driver; */').classes, []);
  assert.deepEqual(scanSource('string s = "class a extends uvm_driver;";').classes, []);
  assert.equal(stripCommentsAndStrings('a // b\nc').length, 'a // b\nc'.length);
  assert.equal(stripCommentsAndStrings('"a\\"b" c').trim(), 'c');
});

test('a file with a fixed icon does not rewrite the theme on every launch', () => {
  // Each write makes VS Code reload the icon theme, and every icon in the window reloads with it.
  const theme: IconTheme = { fileNames: { 'uvm_pkg.sv': '_uvm' }, light: { fileNames: { 'uvm_pkg.sv': '_uvm_light' } } };
  const icons = { 'uvm_pkg.sv': 'package', 'apb_driver.sv': 'driver' } as const;
  assert.equal(applyClassIcons(theme, icons), true);
  assert.equal(applyClassIcons(theme, icons), false, 'nothing changed, so nothing should be written');
  assert.equal(theme.fileNames['uvm_pkg.sv'], '_uvm', 'the fixed icon still wins');
});

test('a sequencer, its sequences and their items share one color, and no two roles share a drawing', () => {
  for (const id of ['sequencer', 'vsequencer', 'sequence', 'vsequence', 'item'] as const) assert.equal(ROLE_ICONS[id].color, 'data', id);
  const pen = { c: '#111111', tint: '#222222', fg: '#333333', bg: '#444444', red: '#555555', green: '#666666' };
  const seen = new Map<string, string>();
  for (const [id, { draw }] of Object.entries(ROLE_ICONS)) {
    const art = draw(pen);
    assert.ok(!seen.has(art), `${id} draws the same icon as ${seen.get(art)}`);
    seen.set(art, id);
  }
});

test('virtual sequences, virtual sequencers and coverage collectors are told apart', () => {
  assert.equal(roleOf({ 'x.sv': 'class top_vseq extends uvm_sequence; endclass' }), 'vsequence');
  assert.equal(roleOf({ 'x.sv': 'class top_vsqr extends uvm_sequencer; endclass' }), 'vsequencer');
  assert.equal(roleOf({ 'x.sv': 'class s extends uvm_subscriber #(t); endclass' }), 'subscriber');
  assert.equal(roleOf({ 'x.sv': 'class s extends uvm_subscriber #(t); covergroup cg; endgroup endclass' }), 'coverage');
  assert.equal(roleOf({ 'x.sv': 'class s extends uvm_component; covergroup cg; endgroup endclass' }), 'coverage');
  assert.equal(roleOf({ 'x.sv': 'class m extends uvm_monitor; covergroup cg; endgroup endclass' }), 'monitor');
  // A covergroup in a later class says nothing about the first one.
  assert.equal(roleOf({ 'x.sv': 'class s extends uvm_subscriber #(t); endclass class c; covergroup g; endgroup endclass' }), 'subscriber');
});

test('a reset handler is told by its class name, since uvm_component has no role of its own', () => {
  assert.equal(roleOf({ 'apb_reset_handler.sv': 'class apb_reset_handler extends uvm_component; endclass' }), 'reset');
  assert.equal(roleOf({ 'stuff.sv': 'class apb_rst_hdlr extends uvm_component; endclass' }), 'reset');
  assert.equal(roleOf({ 'x.sv': 'class apb_rst_hndlr extends vendor_base; endclass' }), 'reset');
  // Through a project base class in another file.
  assert.equal(
    roleOf({
      'apb_mid.sv': 'class apb_mid extends apb_reset_handler; endclass',
      'apb_reset_handler.sv': 'class apb_reset_handler extends uvm_component; endclass',
    }),
    'reset',
  );
  // A UVM base class with a role of its own still decides.
  assert.equal(roleOf({ 'x.sv': 'class apb_reset_handler extends uvm_driver; endclass' }), 'driver');
});

test('a reset handler is told by its file name when no class says otherwise', () => {
  const role = UVM_ROLES.find((r) => r.id === 'reset')!;
  assert.deepEqual([role.badge, role.label], ['RH', 'Reset handler']);
  // No role earlier in the list may steal any of these names.
  for (const suffix of role.suffixes) {
    assert.equal(roleForFileName(`apb${suffix}.sv`)?.id, 'reset', suffix);
    assert.equal(roleOf({ [`apb${suffix}.svh`]: '' }), 'reset', suffix);
  }
  assert.equal(roleForFileName('APB_RESET_HANDLER.SV')?.id, 'reset');
  assert.equal(roleOf({ 'apb_reset_handler.sv': 'class helper; endclass' }), 'reset');
});

test('files with several classes or no classes', () => {
  assert.equal(roleOf({ 'a_mon.sv': 'class helper extends uvm_object; endclass class a_mon extends uvm_monitor; endclass' }), 'monitor');
  assert.equal(roleOf({ 'lib.sv': 'class plain; endclass class s1 extends uvm_sequence; endclass' }), 'sequence');
  assert.equal(roleOf({ 'p.sv': 'package p; class c extends uvm_driver; endclass endpackage' }), 'package');
  assert.equal(roleOf({ 'dut.sv': 'module dut; assign a = b; endmodule' }), undefined);
  assert.equal(roleOf({ 'x.sv': 'interface bus(input clk); endinterface' }), 'interface');
  assert.equal(roleOf({ 'x.sv': 'class c; virtual interface bus vif; endclass' }), undefined);
  assert.equal(roleOf({ 'x.sv': 'checker c(a); endchecker' }), 'assertion');
  assert.equal(roleOf({ 'x.sv': 'module m(input a); property p; a; endproperty assert property (p); endmodule' }), 'assertion');
  assert.equal(roleOf({ 'x.sv': 'module m(input a); always @(a) b = a; property p; a; endproperty endmodule' }), undefined);
  assert.equal(roleOf({ 'x.svh': '`define WIDTH 8' }), 'defines');
});

test('inheritance cycles do not hang', () => {
  assert.equal(roleOf({ 'a.sv': 'class a extends b; endclass', 'b.sv': 'class b extends a; endclass' }), undefined);
});

const theme = (): IconTheme => ({ fileNames: { makefile: '_file_make', 'uvm_pkg.sv': '_file_uvm' }, light: { fileNames: { makefile: '_file_make_light', 'uvm_pkg.sv': '_file_uvm_light' } } });

test('class icons are added to both tones and can be undone', () => {
  const t = theme();
  assert.equal(applyClassIcons(t, { 'a.sv': 'driver' }), true);
  assert.equal(t.fileNames['a.sv'], '_role_driver');
  assert.equal(t.light.fileNames['a.sv'], '_role_driver_light');
  assert.equal(applyClassIcons(t, { 'a.sv': 'driver' }), false, 'no write when nothing changed');
  applyClassIcons(t, { 'b.sv': 'monitor' });
  assert.equal(t.fileNames['a.sv'], undefined);
  applyClassIcons(t, {});
  assert.deepEqual(t.fileNames, theme().fileNames);
  assert.deepEqual(t.light.fileNames, theme().light.fileNames);
});

test('fixed file names win over class icons', () => {
  const t = theme();
  applyClassIcons(t, { 'uvm_pkg.sv': 'package' });
  assert.equal(t.fileNames['uvm_pkg.sv'], '_file_uvm');
  applyClassIcons(t, {});
  assert.equal(t.fileNames['uvm_pkg.sv'], '_file_uvm', 'undoing must not remove the fixed entry');
});

test('other projects keep their icons, and a file that lost its role loses its icon', () => {
  const merged = mergeClassIcons({ 'other.sv': 'env', 'mine.sv': 'driver', 'gone.sv': 'test' }, ['mine.sv', 'gone.sv'], { 'mine.sv': 'monitor' });
  assert.deepEqual(merged, { 'other.sv': 'env', 'mine.sv': 'monitor' });
});

test('the icon map stays bounded', () => {
  const huge = Object.fromEntries(Array.from({ length: 20001 }, (_, i) => [`f${i}.sv`, 'driver' as const]));
  assert.deepEqual(mergeClassIcons(huge, [], { 'a.sv': 'test' }), { 'a.sv': 'test' });
});

for (const file of ['posedge-icon-theme.json', 'posedge-still-icon-theme.json']) {
  test(`${file}: every role has an icon in both tones`, () => {
    const t = JSON.parse(readFileSync(join(ROOT, 'icons', file), 'utf8'));
    for (const role of UVM_ROLES) {
      for (const [key, dir] of [[`_role_${role.id}`, 'svg/roles'], [`_role_${role.id}_light`, 'svg/light/roles']]) {
        assert.equal(t.iconDefinitions[key]?.iconPath, `./${dir}/${role.id}.svg`);
        assert.ok(existsSync(join(ROOT, 'icons', dir, `${role.id}.svg`)), `${dir}/${role.id}.svg`);
      }
    }
  });
}

test('VS Code is told to reload the icon themes when class icons change', () => {
  const pkg = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8'));
  for (const t of pkg.contributes.iconThemes) assert.equal(t._watch, true, t.id);
  assert.ok(pkg.contributes.configuration.properties?.['posedge.explorer.classIcons'] ?? JSON.stringify(pkg.contributes.configuration).includes('posedge.explorer.classIcons'));
});

test('icons use the room VS Code gives them', () => {
  const svg = (rel: string): string => readFileSync(join(ROOT, 'icons', 'svg', rel), 'utf8');
  for (const rel of ['files/sv.svg', 'light/files/sv.svg', 'files/default.svg']) assert.ok(svg(rel).includes('viewBox="0 0 16 18"'), rel);
  assert.ok(svg('folders/rtl.svg').includes('M.5 3.5'), 'folders reach the edge of the box');
});
