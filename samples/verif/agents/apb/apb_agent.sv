class apb_agent extends uvm_agent;
  `uvm_component_utils(apb_agent)

  apb_config                     cfg;
  apb_driver                     drv;
  apb_monitor                    mon;
  uvm_sequencer #(apb_seq_item)  sqr;

  function new(string name, uvm_component parent);
    super.new(name, parent);
  endfunction

  virtual function void build_phase(uvm_phase phase);
    if (!uvm_config_db#(apb_config)::get(this, "", "cfg", cfg))
      `uvm_fatal("NOCFG", {"Configuration must be set for: ", get_full_name(), ".cfg"})
    mon = apb_monitor::type_id::create("mon", this);
    if (cfg.is_active == UVM_ACTIVE) begin
      drv = apb_driver::type_id::create("drv", this);
      sqr = uvm_sequencer#(apb_seq_item)::type_id::create("sqr", this);
    end
  endfunction

  virtual function void connect_phase(uvm_phase phase);
    if (cfg.is_active == UVM_ACTIVE)
      drv.seq_item_port.connect(sqr.seq_item_export);
  endfunction
endclass
