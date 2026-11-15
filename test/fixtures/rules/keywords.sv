// Rule #3 fixtures: the same keyword in many different contexts must keep one color.
virtual class base_c;
  pure virtual function void f();
endclass

interface class ifc_c;
  pure virtual task t();
endclass

typedef class fwd_c;
typedef enum logic [1:0] {A, B} e_t;
typedef struct packed { logic signed [7:0] s; bit unsigned u; } s_t;

class child_c extends base_c implements ifc_c;
  static int count;
  local const int unsigned K = 3;
  protected virtual function automatic void f();
    int signed v;
    repeat (3) begin : rpt
      wait (v == 0);
      assert (v == 0) else $error("v");
      assert property (@(posedge clk) a |-> b);
      if (v) begin end else begin end
      fork begin end join_none
      fork : named begin end join_any
      fork begin end join
      foreach (arr[i]) begin end
      return;
    end : rpt
  endfunction : f
  virtual task t(); endtask : t
  extern function void ext();
  function new(); super.new(); endfunction
endclass : child_c

module m #(parameter int W = 8, localparam int D = 2) (input logic clk, output logic signed [W-1:0] q);
  wire signed [W-1:0] w;
  always_ff @(posedge clk) q <= w;
  generate begin : g end endgenerate
  property p; @(posedge clk) a |=> b; endproperty : p
  sequence s; a ##1 b; endsequence : s
  covergroup cg @(posedge clk); coverpoint q; endgroup : cg
  clocking cb @(posedge clk); endclocking : cb
  specify endspecify
  always begin randcase 1: q = 0; endcase end
  initial randsequence (main) main : a; a : { q = 1; }; endsequence
  checker chk; endchecker : chk
endmodule : m

program prg; endprogram : prg
package pkg; endpackage : pkg
config cfg; endconfig
primitive udp (output o, input i); table 0 : 1; endtable endprimitive
