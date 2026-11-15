// What every folder and file maps to. Add a line here, run `npm run build:icons`, done.
//
// File icon colors speak the same language as the code colors (at rest they are faded, see shapes.mts).
// Closed folders have no color and open ones are all amber, so a folder's color only marks it as generated.
//   hdl (cyan)          HDL sources                 = types in code
//   verification (teal) verification artifacts       = assert/cover/constraint in code
//   time (blue)         waves and timing             = @/#/posedge/fork in code
//   automation (green)  scripts, flows, models       = functions in code
//   directive (orange)  tool config, filelists, constraints = macros/directives in code
//   data (purple)       memory images, registers     = numbers in code
//   silicon (orange-red) physical, netlists, FPGA    = the structural keyword hue
//   neutral / docs / generated (grays)

import { ACCENT, DAYLIGHT_ACCENT, DAYLIGHT_HUES, HUES } from '../palette.mts';

export type IconColor =
  | 'hdl'
  | 'verification'
  | 'time'
  | 'automation'
  | 'directive'
  | 'data'
  | 'silicon'
  | 'neutral'
  | 'docs'
  | 'generated'
  | 'accent';

export const ICON_COLORS: Record<IconColor, string> = {
  hdl: HUES.type,
  verification: HUES.verification,
  time: HUES.time,
  automation: HUES.function,
  directive: HUES.macro,
  data: HUES.number,
  silicon: HUES.keyword,
  neutral: '#9AA0A6',
  docs: '#B5BAC0',
  generated: '#5F646A',
  accent: ACCENT,
};

/** The same language on paper: Daylight's deepened hues, with the gray ramp inverted. */
export const ICON_COLORS_LIGHT: Record<IconColor, string> = {
  hdl: DAYLIGHT_HUES.type,
  verification: DAYLIGHT_HUES.verification,
  time: DAYLIGHT_HUES.time,
  automation: DAYLIGHT_HUES.function,
  directive: DAYLIGHT_HUES.macro,
  data: DAYLIGHT_HUES.number,
  silicon: DAYLIGHT_HUES.keyword,
  neutral: '#6E7378',
  docs: '#565B61',
  generated: '#ACB0B5',
  accent: DAYLIGHT_ACCENT,
};

export interface FolderKind {
  id: string;
  color: IconColor;
  emblem: string;
  names: string[];
}

export interface FileKind {
  id: string;
  color: IconColor;
  /** Up to 3 characters drawn in the dot-matrix font on a tag band. */
  label?: string;
  /** Or a 5x5 emblem drawn inside the page. */
  emblem?: string;
  extensions?: string[];
  fileNames?: string[];
  languageIds?: string[];
}

export const FOLDERS: FolderKind[] = [
  { id: 'rtl', color: 'hdl', emblem: 'chip', names: ['rtl', 'design', 'hdl', 'src', 'source', 'hw', 'hardware', 'ip', 'ips', 'core', 'cores', 'logic', 'verilog', 'systemverilog', 'vhdl'] },
  { id: 'top', color: 'hdl', emblem: 'crown', names: ['top', 'tb_top', 'harness', 'testharness', 'hdl_top', 'hvl_top', 'chip_top', 'soc', 'soc_top'] },
  { id: 'intf', color: 'hdl', emblem: 'plug', names: ['if', 'intf', 'intfs', 'interface', 'interfaces', 'vif', 'bus', 'buses'] },
  { id: 'include', color: 'hdl', emblem: 'box', names: ['include', 'inc', 'includes', 'common', 'pkg', 'pkgs', 'package', 'packages', 'lib', 'libs', 'library', 'libraries', 'defines', 'headers', 'shared'] },
  { id: 'tb', color: 'verification', emblem: 'flask', names: ['tb', 'testbench', 'testbenches', 'bench', 'verif', 'verification', 'dv', 'uvm', 'ver', 'validation'] },
  { id: 'env', color: 'verification', emblem: 'layers', names: ['env', 'envs', 'environment', 'environments'] },
  { id: 'agent', color: 'verification', emblem: 'agent', names: ['agent', 'agents', 'vip', 'vips', 'uvc', 'uvcs', 'bfm', 'bfms', 'monitors', 'drivers'] },
  { id: 'seq', color: 'verification', emblem: 'chevrons', names: ['seq', 'seqs', 'sequence', 'sequences', 'seq_lib', 'seqlib', 'sequence_lib', 'vseq', 'vseqs', 'stimulus', 'stim'] },
  { id: 'tests', color: 'verification', emblem: 'check', names: ['test', 'tests', 'testcase', 'testcases', 'tc', 'tcs', 'test_lib', 'testlist', 'testlists'] },
  { id: 'sva', color: 'verification', emblem: 'shield', names: ['sva', 'assertion', 'assertions', 'asserts', 'checker', 'checkers', 'props', 'properties', 'bind', 'binds'] },
  { id: 'cov', color: 'verification', emblem: 'target', names: ['cov', 'coverage', 'fcov', 'func_cov', 'functional_coverage', 'cover', 'covergroups', 'vplan', 'vplans'] },
  { id: 'formal', color: 'verification', emblem: 'sigma', names: ['formal', 'fv', 'fpv', 'jg', 'jasper', 'jaspergold', 'sby', 'proof', 'proofs', 'lec', 'equivalence'] },
  { id: 'scoreboard', color: 'verification', emblem: 'eye', names: ['scoreboard', 'scoreboards', 'sb', 'checkers_sb', 'predictor', 'predictors'] },
  { id: 'ral', color: 'data', emblem: 'grid', names: ['ral', 'regmodel', 'reg_model', 'regs', 'registers', 'register', 'csr', 'csrs', 'rdl', 'regblock', 'reg', 'ipxact'] },
  { id: 'fw', color: 'data', emblem: 'binary', names: ['fw', 'firmware', 'sw', 'software', 'asm', 'boot', 'bootrom', 'rom', 'mem', 'memory', 'hex'] },
  { id: 'waves', color: 'time', emblem: 'pulse', names: ['waves', 'wave', 'waveform', 'waveforms', 'dump', 'dumps', 'fsdb', 'vcd', 'vpd', 'shm', 'wlf'] },
  { id: 'timing', color: 'time', emblem: 'clock', names: ['timing', 'sta', 'sdc', 'clocks', 'clock', 'cdc'] },
  { id: 'sim', color: 'automation', emblem: 'play', names: ['sim', 'sims', 'simulation', 'run', 'runs', 'build', 'regression', 'regressions', 'regr', 'nightly', 'results', 'result', 'out', 'output', 'scratch'] },
  { id: 'scripts', color: 'automation', emblem: 'terminal', names: ['scripts', 'script', 'tcl', 'bin', 'tools', 'tool', 'utils', 'util', 'flow', 'flows', 'make', 'py', 'python', 'perl', 'shell', 'automation', 'ci'] },
  { id: 'model', color: 'automation', emblem: 'cube', names: ['model', 'models', 'ref_model', 'refmodel', 'golden', 'c_model', 'cmodel', 'dpi', 'c', 'cpp', 'sc', 'systemc', 'reference', 'cocotb'] },
  { id: 'config', color: 'directive', emblem: 'gear', names: ['config', 'configs', 'cfg', 'cfgs', 'configuration', 'settings', 'setup', '.vscode', '.idea'] },
  { id: 'filelists', color: 'directive', emblem: 'lines', names: ['filelist', 'filelists', 'flist', 'flists', 'files', 'manifest', 'manifests'] },
  { id: 'lint', color: 'directive', emblem: 'magnifier', names: ['lint', 'linting', 'spyglass', 'rdc', 'ascent', 'verilator', 'waivers', 'waiver', 'quality'] },
  { id: 'syn', color: 'silicon', emblem: 'gate', names: ['syn', 'synth', 'synthesis', 'netlist', 'netlists', 'gls', 'gate', 'gates', 'pnr', 'layout', 'dft', 'power', 'upf', 'constraints', 'implementation', 'impl'] },
  { id: 'fpga', color: 'silicon', emblem: 'board', names: ['fpga', 'emu', 'emulation', 'zebu', 'palladium', 'proto', 'prototype', 'prototyping', 'board', 'boards', 'vivado', 'quartus'] },
  { id: 'logs', color: 'neutral', emblem: 'lines', names: ['log', 'logs', 'report', 'reports', 'rpt', 'transcripts'] },
  { id: 'docs', color: 'docs', emblem: 'book', names: ['doc', 'docs', 'documentation', 'spec', 'specs', 'specification', 'manual', 'manuals', 'notes', 'plan', 'plans'] },
  { id: 'git', color: 'neutral', emblem: 'branch', names: ['.git', '.github', '.gitlab', '.gitea'] },
  {
    id: 'generated',
    color: 'generated',
    emblem: 'gear',
    names: [
      'csrc', 'simv.daidir', 'simv.vdb', 'xcelium.d', 'inca_libs', 'work', 'dvefiles', 'verdilog', 'verdi_log', 'novas',
      'urgreport', 'cov_work', 'covhtmlreport', 'xsim.dir', '.xil', 'obj_dir', 'sim_build', 'waves.shm', '.simvision',
      'ucli.key.d', '__pycache__', '.pytest_cache', 'node_modules', 'dist', '.cache', '.mypy_cache', '.tox',
    ],
  },
];

export const FILES: FileKind[] = [
  // ---- HDL sources (cyan)
  { id: 'sv', color: 'hdl', label: 'SV', extensions: ['sv'], languageIds: ['systemverilog'] },
  { id: 'svh', color: 'hdl', label: 'SVH', extensions: ['svh'] },
  { id: 'svi', color: 'hdl', label: 'SVI', extensions: ['svi'] },
  { id: 'v', color: 'hdl', label: 'V', extensions: ['v', 'vl', 'vlib'], languageIds: ['verilog'] },
  { id: 'vh', color: 'hdl', label: 'VH', extensions: ['vh'] },
  { id: 'vhdl', color: 'hdl', label: 'VHD', extensions: ['vhd', 'vhdl', 'vho'], languageIds: ['vhdl'] },
  { id: 'vams', color: 'hdl', label: 'AMS', extensions: ['vams', 'va'], languageIds: ['verilogams'] },
  // ---- verification (pink)
  { id: 'sva', color: 'verification', label: 'SVA', extensions: ['sva'] },
  { id: 'uvm', color: 'verification', label: 'UVM', fileNames: ['uvm_pkg.sv', 'uvm_macros.svh', 'uvm.sv', 'uvm_pkg.svh'] },
  { id: 'pss', color: 'verification', label: 'PSS', extensions: ['pss'] },
  { id: 'specman', color: 'verification', label: 'E', extensions: ['e'] },
  { id: 'vera', color: 'verification', label: 'VR', extensions: ['vr', 'vrh', 'vri'] },
  { id: 'psl', color: 'verification', label: 'PSL', extensions: ['psl'] },
  { id: 'coverage', color: 'verification', emblem: 'target', extensions: ['ucdb', 'ucd', 'ucm', 'vdb', 'cov', 'covdb', 'exclude', 'el.exclude'] },
  { id: 'vplan', color: 'verification', emblem: 'check', extensions: ['hvp', 'vplan', 'vplanx', 'vsif', 'vsof'] },
  { id: 'sby', color: 'verification', emblem: 'sigma', extensions: ['sby'] },
  // ---- waves and timing (blue)
  { id: 'waves', color: 'time', emblem: 'pulse', extensions: ['vcd', 'evcd', 'fsdb', 'vpd', 'wlf', 'fst', 'ghw', 'lxt', 'lxt2', 'trn', 'dsn', 'saif', 'wdb', 'shm', 'vcd.gz', 'fsdb.gz'] },
  { id: 'wavecfg', color: 'time', emblem: 'clock', extensions: ['wcfg', 'gtkw', 'svcf', 'rc', 'ses', 'wave.do'] },
  { id: 'sdf', color: 'time', label: 'SDF', extensions: ['sdf', 'sdf.gz'] },
  // ---- scripts and automation (green)
  { id: 'tcl', color: 'automation', label: 'TCL', extensions: ['tcl', 'tk', 'tm', 'jou'] },
  { id: 'do', color: 'automation', label: 'DO', extensions: ['do'] },
  { id: 'python', color: 'automation', label: 'PY', extensions: ['py', 'pyw', 'pyi', 'ipynb'], languageIds: ['python'] },
  { id: 'perl', color: 'automation', label: 'PL', extensions: ['pl', 'pm', 'pod', 't'], languageIds: ['perl'] },
  { id: 'shell', color: 'automation', label: 'SH', extensions: ['sh', 'bash', 'zsh', 'ksh', 'csh', 'tcsh'], fileNames: ['.bashrc', '.cshrc', '.tcshrc', '.zshrc', '.profile', '.login', '.envrc', 'sourceme', 'setup', 'modulefile'], languageIds: ['shellscript'] },
  { id: 'make', color: 'automation', label: 'MK', extensions: ['mk', 'make', 'mak'], fileNames: ['makefile', 'gnumakefile', 'makefile.inc', 'rules.mk'], languageIds: ['makefile'] },
  { id: 'yosys', color: 'automation', label: 'YS', extensions: ['ys'] },
  { id: 'c', color: 'automation', label: 'C', extensions: ['c'], languageIds: ['c'] },
  { id: 'cpp', color: 'automation', label: 'CPP', extensions: ['cpp', 'cc', 'cxx', 'c++'], languageIds: ['cpp'] },
  { id: 'h', color: 'automation', label: 'H', extensions: ['h'] },
  { id: 'hpp', color: 'automation', label: 'HPP', extensions: ['hpp', 'hh', 'hxx'] },
  // ---- tool config, filelists, constraints (orange)
  { id: 'filelist', color: 'directive', label: 'F', extensions: ['f', 'vc', 'flist', 'filelist'], languageIds: ['verilog-filelist'] },
  { id: 'args', color: 'directive', label: 'ARG', extensions: ['args', 'opts'] },
  {
    id: 'toolcfg',
    color: 'directive',
    emblem: 'gear',
    extensions: ['vlt', 'sgdc', 'awl', 'swl', 'waiver', 'prj', 'xpe'],
    fileNames: ['cds.lib', 'hdl.var', 'modelsim.ini', 'synopsys_sim.setup', '.synopsys_dc.setup', '.synopsys_vcs.setup', 'xsim.ini', 'novas.rc', 'verdi.cmd', '.simvisionrc', 'ucli.key', '.xrunrc'],
  },
  { id: 'sdc', color: 'directive', label: 'SDC', extensions: ['sdc'], languageIds: ['sdc'] },
  { id: 'xdc', color: 'directive', label: 'XDC', extensions: ['xdc'], languageIds: ['xdc'] },
  { id: 'ucf', color: 'directive', label: 'UCF', extensions: ['ucf'], languageIds: ['ucf'] },
  { id: 'qsf', color: 'directive', label: 'QSF', extensions: ['qsf'] },
  { id: 'pinmap', color: 'directive', label: 'PCF', extensions: ['pcf', 'lpf'] },
  { id: 'power', color: 'directive', emblem: 'bolt', extensions: ['upf', 'cpf'], languageIds: ['upf'] },
  // ---- physical, netlists, FPGA (orange-red)
  { id: 'netlist', color: 'silicon', emblem: 'gate', extensions: ['vg', 'vm', 'vo', 'edf', 'edif', 'edn', 'netlist', 'ngc', 'v.gz'] },
  { id: 'spice', color: 'silicon', label: 'SP', extensions: ['sp', 'spi', 'spice', 'cdl', 'cir', 'scs'] },
  { id: 'liberty', color: 'silicon', label: 'LIB', extensions: ['lib', 'lib.gz'] },
  { id: 'db', color: 'silicon', label: 'DB', extensions: ['db', 'ndm'] },
  { id: 'lef', color: 'silicon', label: 'LEF', extensions: ['lef'] },
  { id: 'def', color: 'silicon', label: 'DEF', extensions: ['def', 'def.gz'] },
  { id: 'gds', color: 'silicon', label: 'GDS', extensions: ['gds', 'gds2', 'gdsii', 'oas', 'oasis'] },
  { id: 'spef', color: 'silicon', label: 'SPF', extensions: ['spef', 'spef.gz', 'dspf'] },
  { id: 'fpgaproj', color: 'silicon', emblem: 'board', extensions: ['xpr', 'qpf', 'xci', 'bd', 'dcp', 'xise', 'qsys', 'ip'] },
  { id: 'bitstream', color: 'silicon', label: 'BIT', extensions: ['bit', 'sof', 'pof', 'mcs', 'jic', 'bin.bit'] },
  { id: 'protected', color: 'silicon', emblem: 'lock', extensions: ['svp', 'vp', 'svhp', 'vhdp', 'vhdlp', 'enc', 'protected'] },
  // ---- data and registers (purple)
  { id: 'mem', color: 'data', emblem: 'binary', extensions: ['hex', 'mem', 'mif', 'coe', 'dat', 'vmem', 'srec', 'ihex', 'bin', 'img'] },
  { id: 'elf', color: 'data', label: 'ELF', extensions: ['elf', 'axf', 'o'] },
  { id: 'regs', color: 'data', emblem: 'grid', extensions: ['rdl', 'ralf', 'ipxact', 'hjson', 'regs', 'csr'] },
  // ---- logs and documents (gray)
  { id: 'log', color: 'neutral', emblem: 'lines', extensions: ['log', 'rpt', 'sum', 'out'], fileNames: ['transcript'], languageIds: ['log'] },
  { id: 'markdown', color: 'docs', label: 'MD', extensions: ['md', 'markdown', 'mdx'], languageIds: ['markdown'] },
  { id: 'text', color: 'docs', label: 'TXT', extensions: ['txt', 'text'] },
  { id: 'rst', color: 'docs', label: 'RST', extensions: ['rst', 'adoc', 'asciidoc'] },
  { id: 'pdf', color: 'docs', label: 'PDF', extensions: ['pdf'] },
  { id: 'doc', color: 'docs', label: 'DOC', extensions: ['doc', 'docx', 'odt', 'rtf'] },
  { id: 'sheet', color: 'docs', label: 'XLS', extensions: ['xls', 'xlsx', 'xlsm', 'ods'] },
  { id: 'csv', color: 'docs', label: 'CSV', extensions: ['csv', 'tsv'] },
  { id: 'license', color: 'docs', label: 'LIC', fileNames: ['license', 'license.md', 'license.txt', 'copying', 'notice', 'third_party_notices.md'] },
  { id: 'readme', color: 'docs', label: 'RD', fileNames: ['readme', 'readme.md', 'readme.txt', 'readme.rst'] },
  { id: 'changelog', color: 'docs', label: 'CHG', fileNames: ['changelog', 'changelog.md', 'changes.md', 'history.md'] },
  // ---- generic formats (gray)
  { id: 'json', color: 'neutral', emblem: 'braces', extensions: ['json', 'jsonc', 'json5'], languageIds: ['json', 'jsonc'] },
  { id: 'yaml', color: 'neutral', label: 'YML', extensions: ['yml', 'yaml'], languageIds: ['yaml'] },
  { id: 'toml', color: 'neutral', label: 'TML', extensions: ['toml'] },
  { id: 'xml', color: 'neutral', label: 'XML', extensions: ['xml', 'xsd', 'xsl'], languageIds: ['xml'] },
  { id: 'ini', color: 'neutral', label: 'INI', extensions: ['ini', 'cfg', 'conf', 'properties', 'env'] },
  { id: 'git', color: 'neutral', emblem: 'branch', fileNames: ['.gitignore', '.gitattributes', '.gitmodules', '.gitkeep'] },
  { id: 'docker', color: 'neutral', label: 'DKR', fileNames: ['dockerfile', 'containerfile', 'docker-compose.yml'] },
  { id: 'image', color: 'neutral', emblem: 'picture', extensions: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'bmp', 'ico', 'webp', 'drawio'] },
  { id: 'archive', color: 'neutral', emblem: 'archive', extensions: ['zip', 'tar', 'gz', 'tgz', 'bz2', 'xz', '7z', 'rar'] },
  { id: 'js', color: 'neutral', label: 'JS', extensions: ['js', 'mjs', 'cjs'], languageIds: ['javascript'] },
  { id: 'ts', color: 'neutral', label: 'TS', extensions: ['ts', 'mts', 'cts'], languageIds: ['typescript'] },
  { id: 'html', color: 'neutral', label: 'HTM', extensions: ['html', 'htm'], languageIds: ['html'] },
  { id: 'vsix', color: 'accent', emblem: 'box', extensions: ['vsix'] },
];
