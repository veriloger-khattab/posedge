`ifndef APB_DEFINES_SVH
`define APB_DEFINES_SVH

`timescale 1ns/1ps
`default_nettype none

`define APB_ADDR_WIDTH 32
`define APB_DATA_WIDTH 32

// Wraps a sequence start with the standard objection handling
`define APB_START_SEQ(SEQ, SQR) \
  begin \
    phase.raise_objection(this); \
    SEQ.start(SQR); \
    phase.drop_objection(this); \
  end

`define APB_ASSERT_KNOWN(NAME, SIG) \
  NAME: assert property (@(posedge pclk) !$isunknown(SIG)) \
    else `uvm_error(`"NAME`", "signal is X")

`ifdef APB_DEBUG
  `define APB_VERBOSITY UVM_DEBUG
`elsif APB_QUIET
  `define APB_VERBOSITY UVM_NONE
`else
  `define APB_VERBOSITY UVM_MEDIUM
`endif

`endif // APB_DEFINES_SVH
