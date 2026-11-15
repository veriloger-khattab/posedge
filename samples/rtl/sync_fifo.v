// Classic Verilog-2005 synchronous FIFO
`timescale 1ns / 1ps

module sync_fifo #(
  parameter WIDTH = 8,
  parameter DEPTH = 16,
  parameter AW    = 4
) (
  input  wire             clk,
  input  wire             rst_n,
  input  wire             wr_en,
  input  wire             rd_en,
  input  wire [WIDTH-1:0] din,
  output reg  [WIDTH-1:0] dout,
  output wire             full,
  output wire             empty
);
  reg [WIDTH-1:0] mem [0:DEPTH-1];
  reg [AW:0]      wr_ptr, rd_ptr;
  integer         i;

  assign full  = (wr_ptr[AW] != rd_ptr[AW]) && (wr_ptr[AW-1:0] == rd_ptr[AW-1:0]);
  assign empty = (wr_ptr == rd_ptr);

  always @(posedge clk or negedge rst_n) begin
    if (!rst_n) begin
      wr_ptr <= 0;
      rd_ptr <= 0;
      dout   <= {WIDTH{1'bx}};
      for (i = 0; i < DEPTH; i = i + 1) mem[i] <= 8'h00;
    end else begin
      if (wr_en && !full) begin
        mem[wr_ptr[AW-1:0]] <= din;
        wr_ptr <= wr_ptr + 1'b1;
      end
      if (rd_en && !empty) begin
        dout   <= mem[rd_ptr[AW-1:0]];
        rd_ptr <= rd_ptr + 1'b1;
      end
    end
  end
endmodule
