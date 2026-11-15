// Bold marks where a function or task is declared, and nowhere else.
// A trailing tag names the word to check on its line:
//   decl: NAME   declared here: bold
//   use: NAME    merely used here: not bold
//   keep: NAME   not a function: keeps its own bold
`define MY_LIMIT 4                                          // keep: MY_LIMIT

package names_pkg;                                          // keep: names_pkg

typedef int my_t;

class my_class #(type T = int) extends uvm_component;       // keep: my_class

  // the owner's example
  function new(string name = "");                           // decl: new
    super.new(name);                                        // use: new
  endfunction

  // constructors
  extern function new(string name, uvm_component parent);   // decl: new
  function new(string name, uvm_component parent = null);   // decl: new
    super.new(name, parent);                                // use: new
  endfunction : new                                         // use: new

  // UVM phases: bold only at the declaration
  virtual function void build_phase(uvm_phase phase);       // decl: build_phase
    super.build_phase(phase);                               // use: build_phase
  endfunction : build_phase                                 // use: build_phase

  virtual function void connect_phase(uvm_phase phase);     // decl: connect_phase
    super.connect_phase(phase);                             // use: connect_phase
  endfunction

  task run_phase(uvm_phase phase);                          // decl: run_phase
    phase.raise_objection(this);                            // use: raise_objection
    foo();                                                  // use: foo
    phase.drop_objection(this);                             // use: drop_objection
  endtask : run_phase                                       // use: run_phase

  virtual task main_phase(uvm_phase phase);                 // decl: main_phase
    super.main_phase(phase);                                // use: main_phase
    raise_objection(this);                                  // use: raise_objection
  endtask

  // qualifiers in front of the keyword and between it and the name
  function automatic int foo(int a);                        // decl: foo
    obj.get_next_item(req);                                 // use: get_next_item
    a_seq = my_seq::type_id::create("a_seq");               // use: create
    drv = type_id::create("x", this);                       // use: create
    $display("%0d", a);                                     // use: $display
    uvm_config_db#(int)::get(this, "", "a", a);             // use: get
    c = new();                                              // use: new
    d = new[4];                                             // use: new
    return foo(a);                                          // use: foo
  endfunction : foo                                         // use: foo
  function static int s_fn();                               // decl: s_fn
  endfunction
  task automatic a_task(int n);                             // decl: a_task
    a_task(n - 1);                                          // use: a_task
  endtask : a_task                                          // use: a_task
  static function void st_fn();                             // decl: st_fn
  endfunction
  local function void lo_fn();                              // decl: lo_fn
  endfunction
  protected virtual task pv_task();                         // decl: pv_task
  endtask

  // prototypes
  extern function void ext_fn();                            // decl: ext_fn
  extern virtual task ext_task(int n);                      // decl: ext_task
  extern protected virtual function int ext_prot(int x);    // decl: ext_prot
  extern function void build_phase(uvm_phase phase);        // decl: build_phase
  pure virtual function void pure_fn();                     // decl: pure_fn
  pure virtual task pure_task();                            // decl: pure_task

  // return types
  function void by_semicolon;                               // decl: by_semicolon
  endfunction
  function int unsigned ret_unsigned();                     // decl: ret_unsigned
  endfunction
  function bit [7:0] ret_range();                           // decl: ret_range
  endfunction
  function logic signed [7:0][3:0] ret_packed();            // decl: ret_packed
  endfunction
  function names_pkg::my_t ret_scoped();                    // decl: ret_scoped
  endfunction
  function uvm_queue#(int) ret_param();                     // decl: ret_param
  endfunction
  function uvm_queue#(my_class#(8)) ret_nested();           // decl: ret_nested
  endfunction
  function my_class#(T)::my_t ret_param_scope();            // decl: ret_param_scope
  endfunction
  function virtual apb_if ret_vif();                        // decl: ret_vif
  endfunction
  function virtual interface apb_if ret_vif_kw();           // decl: ret_vif_kw
  endfunction
  function [7:0] ret_implicit(int a);                       // decl: ret_implicit
  endfunction
  function [7:0] ret_implicit_semi;                         // decl: ret_implicit_semi
  endfunction
  function automatic [T-1:0] ret_implicit_auto();           // decl: ret_implicit_auto
  endfunction
  function [7:0]ret_implicit_tight();                       // decl: ret_implicit_tight
  endfunction

  covergroup cg with function sample(bit v);                // decl: sample
  endgroup
endclass : my_class

// out of block
function void my_class::oob_fn();                           // decl: oob_fn
  oob_fn();                                                 // use: oob_fn
endfunction : oob_fn                                        // use: oob_fn
task my_class::oob_task();                                  // decl: oob_task
endtask
function my_class::new(string name);                        // decl: new
  super.new(name);                                          // use: new
endfunction
function void my_class::build_phase(uvm_phase phase);       // decl: build_phase
  super.build_phase(phase);                                 // use: build_phase
endfunction
function void my_class#(T)::oob_param();                    // decl: oob_param
endfunction
function my_class#(T)::new(string name);                    // decl: new
endfunction
task my_class#(T, 8)::run_phase(uvm_phase phase);           // decl: run_phase
endtask
function void outer::inner::oob_nested();                   // decl: oob_nested
endfunction
function my_class#(T)::my_t my_class#(T)::oob_both();       // decl: oob_both
endfunction

// DPI
import "DPI-C" function int c_fn(int a);                    // decl: c_fn
export "DPI-C" function e_fn;                               // decl: e_fn

endpackage : names_pkg

// other bold, untouched by any of the above
module names_top;                                           // keep: names_top
  initial begin
    `uvm_error("MY_ID", "message")                          // keep: MY_ID
    uvm_report_info("I", "message");                        // use: uvm_report_info
  end
endmodule
