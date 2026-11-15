// Keywords that the Verilog-HDL extension registers as brackets but that are legitimately unpaired
// here. They must keep their color AND must not be bracket tokens (or VS Code paints them red).
package unpaired_pkg;
  typedef class fwd_c;
  typedef interface class fwd_ifc;
  import "DPI-C" context function int c_add(int a, int b);
  import "DPI-C" sv_name = function void c_print(string s);
  export "DPI-C" task sv_task;

  interface class shape_ifc;
    pure virtual function real area();
  endclass

  virtual class base_c;
    extern function void ext_f();
    pure virtual task run_t();
    extern protected virtual function int ext_g(int x);
  endclass

  class user_c;
    virtual interface apb_if vif;
    function virtual interface apb_if vif_get();
    endfunction
    covergroup cg with function sample(bit [3:0] v);
      coverpoint v;
    endgroup
    task t();
      fork
        begin end
      join_none
      disable fork;
      wait fork;
    endtask
  endclass
endpackage

module unpaired_m (input logic clk, input logic a, input logic b);
  default clocking cb @(posedge clk); endclocking
  a_p: assert property (@(posedge clk) a |-> b);
  c_s: cover sequence (a ##1 b);
  assume property (@(posedge clk) !(a && b));
endmodule
