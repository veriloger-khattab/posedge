interface apb_if #(parameter int ADDR_WIDTH = 12) (input logic pclk, input logic presetn);
  logic                  psel;
  logic                  penable;
  logic                  pwrite;
  logic [ADDR_WIDTH-1:0] paddr;
  logic [31:0]           pwdata;
  logic [31:0]           prdata;
  logic                  pready;

  clocking drv_cb @(posedge pclk);
    default input #1step output #1ns;
    output psel, penable, pwrite, paddr, pwdata;
    input  prdata, pready;
  endclocking : drv_cb

  clocking mon_cb @(posedge pclk);
    input psel, penable, pwrite, paddr, pwdata, prdata, pready;
  endclocking

  modport driver_mp  (clocking drv_cb, input presetn);
  modport monitor_mp (clocking mon_cb, input presetn);

  task automatic wait_reset_release();
    @(posedge presetn);
    repeat (2) @(posedge pclk);
  endtask
endinterface : apb_if
