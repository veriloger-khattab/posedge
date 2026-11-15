// Simple APB register slave with 16 x 32-bit registers
module apb_slave #(
  parameter int ADDR_WIDTH = 12,
  parameter int NUM_REGS   = 16
) (
  input  logic                  pclk,
  input  logic                  presetn,
  input  logic                  psel,
  input  logic                  penable,
  input  logic                  pwrite,
  input  logic [ADDR_WIDTH-1:0] paddr,
  input  logic [31:0]           pwdata,
  output logic [31:0]           prdata,
  output logic                  pready,
  output logic                  pslverr
);
  typedef enum logic [1:0] {IDLE, SETUP, ACCESS} state_e;

  state_e      state_q, state_d;
  logic [31:0] regs_q [NUM_REGS];
  wire         access = psel & penable;

  // synopsys translate_off
  initial $display("apb_slave: %0d registers", NUM_REGS);
  // synopsys translate_on

  always_ff @(posedge pclk or negedge presetn) begin : seq_logic
    if (!presetn) begin
      state_q <= IDLE;
      foreach (regs_q[i]) regs_q[i] <= '0;
    end else begin
      state_q <= state_d;
      if (access && pwrite) regs_q[paddr[5:2]] <= pwdata;
    end
  end : seq_logic

  always_comb begin
    state_d = state_q;
    unique case (state_q)
      IDLE:    if (psel)    state_d = SETUP;
      SETUP:                state_d = ACCESS;
      ACCESS:  if (!psel)   state_d = IDLE;
      default:              state_d = state_e'('x);
    endcase
  end

  assign prdata  = (access && !pwrite) ? regs_q[paddr[5:2]] : 32'h0;
  assign pready  = 1'b1;
  assign pslverr = (paddr >= NUM_REGS * 4) ? 1'b1 : 1'bz;

  generate
    for (genvar g = 0; g < NUM_REGS; g++) begin : g_reg_names
      // coverage off
      initial if (g == 0) $info("first register at %0d", g);
      // coverage on
    end
  endgenerate
endmodule : apb_slave
