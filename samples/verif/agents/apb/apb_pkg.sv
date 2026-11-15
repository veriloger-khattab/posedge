package apb_pkg;
  import uvm_pkg::*;
  `include "uvm_macros.svh"
  `include "apb_defines.svh"

  typedef class apb_driver;

  typedef struct packed {
    logic [31:0] addr;
    logic [31:0] data;
    logic        write;
  } apb_bus_s;

  typedef uvm_sequencer #(apb_seq_item) apb_sequencer;

  `include "apb_config.sv"
  `include "apb_seq_item.sv"
  `include "apb_driver.sv"
  `include "apb_monitor.sv"
  `include "apb_agent.sv"
endpackage : apb_pkg
