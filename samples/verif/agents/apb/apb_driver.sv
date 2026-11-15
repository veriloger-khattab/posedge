//------------------------------------------------------------------------------
// apb_driver.sv : drives APB transfers from the sequencer onto the bus
//------------------------------------------------------------------------------
`ifndef APB_DRIVER_SV
`define APB_DRIVER_SV

// TODO: add a configurable PREADY timeout per slave
class apb_driver extends uvm_driver #(apb_seq_item);
  `uvm_component_utils(apb_driver)

  virtual apb_if vif;
  apb_config     cfg;
  local int unsigned m_num_sent;

  function new(string name = "apb_driver", uvm_component parent = null);
    super.new(name, parent);
  endfunction : new

  virtual function void build_phase(uvm_phase phase);
    super.build_phase(phase);
    if (!uvm_config_db#(virtual apb_if)::get(this, "", "vif", vif))
      `uvm_fatal("NOVIF", "Virtual interface must be set for: apb_driver.vif")
    if (!uvm_config_db#(apb_config)::get(this, "", "cfg", cfg))
      `uvm_error("ALGORITHM_ISSUE", "The apb virtual interface is not configured before run phase")
  endfunction : build_phase

  virtual task run_phase(uvm_phase phase);
    reset_signals();
    wait (vif.presetn === 1'b1);
    forever begin
      seq_item_port.get_next_item(req);
      `uvm_info(get_type_name(), $sformatf("Driving %s", req.convert2string()), UVM_HIGH)
      fork : drive_with_timeout
        drive_transfer(req);
        begin
          #(cfg.timeout_ns * 1ns);
          `uvm_warning("APB_TIMEOUT", $sformatf("No PREADY after %0d ns at %0t", cfg.timeout_ns, $time))
        end
      join_any
      disable fork;
      m_num_sent++;
      seq_item_port.item_done();
    end
  endtask : run_phase

  protected task drive_transfer(apb_seq_item tr);
    @(posedge vif.pclk);
    vif.paddr   <= tr.addr;
    vif.pwrite  <= (tr.kind == APB_WRITE);
    vif.pwdata  <= tr.data;
    vif.psel    <= 1'b1;
    vif.penable <= 1'b0;
    @(posedge vif.pclk);
    vif.penable <= 1'b1;
    do @(posedge vif.pclk); while (!vif.pready);
    if (tr.kind == APB_READ) tr.data = vif.prdata;
    vif.psel    <= 1'b0;
    vif.penable <= 1'b0;
  endtask : drive_transfer

  protected task reset_signals();
    vif.psel    <= '0;
    vif.penable <= '0;
    vif.paddr   <= 'x;
    vif.pwdata  <= 32'hDEAD_BEEF;
  endtask

  virtual function void report_phase(uvm_phase phase);
    `uvm_info("DRV", $sformatf("Sent %0d transfers", m_num_sent), UVM_LOW)
  endfunction
endclass : apb_driver

`endif // APB_DRIVER_SV
