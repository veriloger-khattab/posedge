// Bold marks where a function or task is declared, and nowhere else (tags: see function-names.sv).
`define MY_LIMIT 4                                  // keep: MY_LIMIT

module names_v;                                     // keep: names_v
  reg [7:0] state;

  function [7:0] next_state;                        // decl: next_state
    input [7:0] cur;
    next_state = cur + 1;
  endfunction

  function [7:0] add_one(input [7:0] a);            // decl: add_one
    add_one = a + 1;
  endfunction

  function automatic [31:0] auto_range(input a);    // decl: auto_range
    auto_range = a;
  endfunction

  function signed [7:0] signed_range;               // decl: signed_range
    input a;
    signed_range = a;
  endfunction

  function integer clog2;                           // decl: clog2
    input integer depth;
    clog2 = depth;
  endfunction

  function automatic integer auto_int(input a);     // decl: auto_int
    auto_int = clog2(a);                            // use: clog2
  endfunction

  function real half(input real r);                 // decl: half
    half = r / 2;
  endfunction

  function plain_bit;                               // decl: plain_bit
    input a;
    plain_bit = a;
  endfunction

  task reset_all;                                   // decl: reset_all
    state = 0;
  endtask

  task automatic wait_cycles(input integer n);      // decl: wait_cycles
    wait_cycles(n - 1);                             // use: wait_cycles
  endtask

  // SystemVerilog code in a .v file resolves the same way
  function void build_phase(uvm_phase phase);       // decl: build_phase
    super.build_phase(phase);                       // use: build_phase
  endfunction : build_phase                         // use: build_phase

  task run_phase(uvm_phase phase);                  // decl: run_phase
    phase.raise_objection(this);                    // use: raise_objection
    super.new(name);                                // use: new
  endtask : run_phase                               // use: run_phase

  initial begin
    state = add_one(state);                         // use: add_one
    $display("%0d", state);                         // use: $display
    u_dut.write(1);                                 // use: write
  end
endmodule
