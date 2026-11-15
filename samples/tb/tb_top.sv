`include "uvm_macros.svh"

module tb_top;
  import uvm_pkg::*;
  import apb_pkg::*;

  timeunit 1ns;
  timeprecision 1ps;

  logic pclk = 1'b0;
  logic presetn;

  always #5ns pclk = ~pclk;

  initial begin
    presetn = 1'b0;
    repeat (5) @(posedge pclk);
    presetn <= 1'b1;
  end

  apb_if #(.ADDR_WIDTH(12)) apb_vif (.pclk(pclk), .presetn(presetn));

  apb_slave #(.ADDR_WIDTH(12), .NUM_REGS(16)) u_dut (
    .pclk    (pclk),
    .presetn (presetn),
    .psel    (apb_vif.psel),
    .penable (apb_vif.penable),
    .pwrite  (apb_vif.pwrite),
    .paddr   (apb_vif.paddr),
    .pwdata  (apb_vif.pwdata),
    .prdata  (apb_vif.prdata),
    .pready  (apb_vif.pready),
    .pslverr ()
  );

  initial begin
    uvm_config_db#(virtual apb_if)::set(null, "uvm_test_top.env.agent*", "vif", apb_vif);
    $fsdbDumpfile("waves.fsdb");
    $fsdbDumpvars(0, tb_top);
    run_test("apb_base_test");
  end

  final $display("Simulation finished at %0t", $realtime);
endmodule : tb_top
