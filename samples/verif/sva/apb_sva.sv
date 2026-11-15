// Protocol checks for the APB bus, bound to every apb_if instance
module apb_sva (
  input logic        pclk,
  input logic        presetn,
  input logic        psel,
  input logic        penable,
  input logic        pready,
  input logic [31:0] paddr
);
  default clocking cb @(posedge pclk); endclocking
  default disable iff (!presetn);

  property p_setup_then_access;
    psel && !penable |=> psel && penable;
  endproperty : p_setup_then_access

  sequence s_wait_ready(int max_cycles);
    penable ##[1:max_cycles] pready;
  endsequence

  property p_addr_stable;
    psel && !pready |=> $stable(paddr);
  endproperty

  a_setup_access: assert property (p_setup_then_access)
    else $error("APB access phase did not follow the setup phase");

  a_addr_stable: assert property (p_addr_stable)
    else `uvm_error("SVA_ADDR", $sformatf("PADDR changed while waiting: %h", paddr))

  a_no_x: assert property (@(posedge pclk) disable iff (!presetn) psel |-> !$isunknown(paddr))
    else $fatal(1, "X on PADDR during a transfer");

  c_back_to_back: cover property (psel && penable && pready ##1 psel && !penable);

  initial assert (8 == $bits(byte)) else $warning("Unexpected byte width");
endmodule : apb_sva

bind apb_if apb_sva u_apb_sva (.*);
