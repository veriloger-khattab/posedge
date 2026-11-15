// UVM (IEEE 1800.2) and verification vocabulary used by the lexer (rule #1) and the Explorer badges.
// Pure data; also bundled into the runtime extension, so it must not import Node modules.

export type Severity = 'info' | 'warning' | 'error' | 'fatal';
export const SEVERITIES: Severity[] = ['info', 'warning', 'error', 'fatal'];

/** Report macros whose FIRST argument is the message ID, colored by severity. */
export const REPORT_MACROS: Record<Severity, string[]> = {
  info: ['uvm_info', 'uvm_info_context', 'uvm_info_begin'],
  warning: ['uvm_warning', 'uvm_warning_context', 'uvm_warning_begin'],
  error: ['uvm_error', 'uvm_error_context', 'uvm_error_begin'],
  fatal: ['uvm_fatal', 'uvm_fatal_context', 'uvm_fatal_begin'],
};

/** Report functions whose first argument is the message ID. */
export const REPORT_FUNCTIONS: Record<Severity, string[]> = {
  info: ['uvm_report_info'],
  warning: ['uvm_report_warning'],
  error: ['uvm_report_error'],
  fatal: ['uvm_report_fatal'],
};

/** SystemVerilog severity system tasks. */
export const SEVERITY_TASKS: Record<Severity, string> = {
  info: '$info',
  warning: '$warning',
  error: '$error',
  fatal: '$fatal',
};

/** uvm_severity enum values. */
export const SEVERITY_ENUMS: Record<Severity, string> = {
  info: 'UVM_INFO',
  warning: 'UVM_WARNING',
  error: 'UVM_ERROR',
  fatal: 'UVM_FATAL',
};

/** uvm_verbosity values, most important (always printed) first. */
export const VERBOSITY = ['UVM_NONE', 'UVM_LOW', 'UVM_MEDIUM', 'UVM_HIGH', 'UVM_FULL', 'UVM_DEBUG'] as const;

/** Standard phase methods plus objection control: the landmarks of every UVM component. */
export const PHASE_METHODS = [
  'build_phase', 'connect_phase', 'end_of_elaboration_phase', 'start_of_simulation_phase', 'run_phase',
  'pre_reset_phase', 'reset_phase', 'post_reset_phase', 'pre_configure_phase', 'configure_phase',
  'post_configure_phase', 'pre_main_phase', 'main_phase', 'post_main_phase', 'pre_shutdown_phase',
  'shutdown_phase', 'post_shutdown_phase', 'extract_phase', 'check_phase', 'report_phase', 'final_phase',
  'raise_objection', 'drop_objection', 'set_drain_time',
];

/** Macros whose first argument is a class/type name, e.g. `uvm_component_utils(apb_driver). */
export const TYPE_ARG_MACROS = [
  'uvm_component_utils', 'uvm_component_utils_begin', 'uvm_component_param_utils',
  'uvm_component_param_utils_begin', 'uvm_component_abstract_utils', 'uvm_component_abstract_utils_begin',
  'uvm_component_abstract_param_utils', 'uvm_component_abstract_param_utils_begin', 'uvm_object_utils',
  'uvm_object_utils_begin', 'uvm_object_param_utils', 'uvm_object_param_utils_begin',
  'uvm_object_abstract_utils', 'uvm_object_abstract_utils_begin', 'uvm_object_abstract_param_utils',
  'uvm_object_abstract_param_utils_begin', 'uvm_declare_p_sequencer', 'uvm_sequence_utils',
  'uvm_sequencer_utils', 'uvm_field_enum', 'uvm_field_sarray_enum', 'uvm_field_array_enum',
  'uvm_field_queue_enum', 'uvm_pack_enum', 'uvm_unpack_enum',
];

/** Macros whose first TWO arguments are types, e.g. `uvm_register_cb(apb_driver, apb_driver_cb). */
export const TWO_TYPE_ARG_MACROS = ['uvm_register_cb', 'uvm_set_super_type'];

/** Library classes that do not start with uvm_ (std package and friends). */
export const LIBRARY_TYPES = ['process', 'mailbox', 'semaphore', 'type_id'];

/** Covergroup option members: `option.per_instance`, `type_option.weight`. */
export const COVER_OPTIONS = ['option', 'type_option'];

/** Every role has one pictogram in design/icons/roles.mts. */
export type RoleId =
  | 'vsequence'
  | 'vsequencer'
  | 'item'
  | 'sequencer'
  | 'sequence'
  | 'driver'
  | 'monitor'
  | 'agent'
  | 'reset'
  | 'scoreboard'
  | 'predictor'
  | 'adapter'
  | 'regmodel'
  | 'coverage'
  | 'subscriber'
  | 'callback'
  | 'assertion'
  | 'env'
  | 'config'
  | 'test'
  | 'interface'
  | 'bind'
  | 'package'
  | 'defines'
  | 'top';

/**
 * UVM component roles. Class icons and Explorer badges identify a role from the class a file declares
 * and fall back to the name suffix (class name, then file name, before the extension).
 * Order matters: the first match wins.
 */
export interface UvmRole {
  id: RoleId;
  badge: string;
  label: string;
  suffixes: string[];
  /** Whole file names (without extension) that also map to this role. */
  names?: string[];
}

export const UVM_ROLES: UvmRole[] = [
  { id: 'vsequence', badge: 'VS', label: 'UVM virtual sequence', suffixes: ['_vseq', '_virtual_seq', '_virtual_sequence', '_vseq_lib'] },
  { id: 'vsequencer', badge: 'VQ', label: 'UVM virtual sequencer', suffixes: ['_vsqr', '_vseqr', '_virtual_sequencer', '_vsequencer'] },
  { id: 'item', badge: 'TX', label: 'UVM sequence item', suffixes: ['_seq_item', '_item', '_txn', '_trans', '_transaction', '_tr', '_pkt', '_packet'] },
  { id: 'sequencer', badge: 'SQ', label: 'UVM sequencer', suffixes: ['_sqr', '_seqr', '_sequencer'] },
  { id: 'sequence', badge: 'SE', label: 'UVM sequence', suffixes: ['_seq', '_seqs', '_sequence', '_sequences', '_seq_lib', '_sequence_lib'] },
  { id: 'driver', badge: 'DR', label: 'UVM driver', suffixes: ['_drv', '_driver', '_bfm'] },
  { id: 'monitor', badge: 'MO', label: 'UVM monitor', suffixes: ['_mon', '_monitor'] },
  { id: 'agent', badge: 'AG', label: 'UVM agent', suffixes: ['_agt', '_agent'] },
  { id: 'reset', badge: 'RH', label: 'Reset handler', suffixes: ['_reset_handler', '_rst_handler', '_reset_hdlr', '_rst_hdlr', '_reset_hndlr', '_rst_hndlr'], names: ['reset_handler', 'rst_handler'] },
  { id: 'scoreboard', badge: 'SB', label: 'UVM scoreboard', suffixes: ['_sb', '_scb', '_scbd', '_scoreboard'] },
  { id: 'predictor', badge: 'PR', label: 'UVM predictor / reference model', suffixes: ['_predictor', '_pred', '_ref_model', '_refmodel', '_model'] },
  { id: 'adapter', badge: 'AD', label: 'UVM register adapter', suffixes: ['_adapter', '_reg_adapter', '_reg2bus'] },
  { id: 'regmodel', badge: 'RG', label: 'UVM register model', suffixes: ['_reg_block', '_regblock', '_reg_model', '_regmodel', '_ral', '_regs', '_reg_pkg'] },
  { id: 'coverage', badge: 'CV', label: 'Functional coverage', suffixes: ['_cov', '_coverage', '_cg', '_covergroup', '_fcov'] },
  { id: 'subscriber', badge: 'SU', label: 'UVM subscriber', suffixes: ['_subscriber'] },
  { id: 'callback', badge: 'CB', label: 'UVM callback', suffixes: ['_cb', '_cbs', '_callback', '_callbacks'] },
  { id: 'assertion', badge: 'AS', label: 'Assertions / checker', suffixes: ['_sva', '_assert', '_assertions', '_checker', '_props', '_properties', '_chk'] },
  { id: 'env', badge: 'EN', label: 'UVM environment', suffixes: ['_env', '_environment'] },
  { id: 'config', badge: 'CF', label: 'Configuration object', suffixes: ['_cfg', '_config', '_configuration'] },
  { id: 'test', badge: 'TS', label: 'UVM test', suffixes: ['_test', '_tests', '_test_lib', '_base_test'] },
  { id: 'interface', badge: 'IF', label: 'Interface', suffixes: ['_if', '_intf', '_interface', '_vif'] },
  { id: 'bind', badge: 'BD', label: 'Bind file', suffixes: ['_bind', '_binds'] },
  { id: 'package', badge: 'PK', label: 'Package', suffixes: ['_pkg', '_package'] },
  { id: 'defines', badge: 'DF', label: 'Defines / macros / types', suffixes: ['_defines', '_define', '_defs', '_macros', '_macro', '_params', '_types', '_typedefs'] },
  { id: 'top', badge: 'TB', label: 'Testbench top', suffixes: ['_tb_top', '_tb', '_top', '_harness', '_th'], names: ['tb_top', 'tb', 'top', 'testbench', 'harness', 'hdl_top', 'hvl_top'] },
];

/** UVM library base classes and the role a class inherits from them. */
export const UVM_BASE_CLASSES: Readonly<Record<string, RoleId>> = {
  uvm_driver: 'driver',
  uvm_push_driver: 'driver',
  uvm_monitor: 'monitor',
  uvm_agent: 'agent',
  uvm_scoreboard: 'scoreboard',
  uvm_subscriber: 'subscriber',
  uvm_env: 'env',
  uvm_test: 'test',
  uvm_sequencer: 'sequencer',
  uvm_sequencer_base: 'sequencer',
  uvm_sequencer_param_base: 'sequencer',
  uvm_push_sequencer: 'sequencer',
  uvm_sequence: 'sequence',
  uvm_sequence_base: 'sequence',
  uvm_reg_sequence: 'sequence',
  uvm_sequence_item: 'item',
  uvm_callback: 'callback',
  uvm_reg_block: 'regmodel',
  uvm_reg: 'regmodel',
  uvm_reg_file: 'regmodel',
  uvm_mem: 'regmodel',
  uvm_reg_adapter: 'adapter',
  uvm_reg_predictor: 'predictor',
};

/** File extensions that get UVM role badges. */
export const BADGE_EXTENSIONS = ['.sv', '.svh', '.svi', '.sva', '.v', '.vh'];

/** File extensions scanned for the classes they declare. */
export const CLASS_ICON_EXTENSIONS = ['sv', 'svh', 'svi'];
