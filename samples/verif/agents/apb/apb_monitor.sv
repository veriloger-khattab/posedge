class apb_monitor extends uvm_monitor;
  `uvm_component_utils(apb_monitor)

  virtual apb_if.monitor_mp vif;
  uvm_analysis_port #(apb_seq_item) ap;
  event transfer_done;

  function new(string name, uvm_component parent);
    super.new(name, parent);
    ap = new("ap", this);
  endfunction

  virtual task run_phase(uvm_phase phase);
    apb_seq_item tr;
    forever begin
      @(vif.mon_cb iff (vif.mon_cb.psel && vif.mon_cb.penable && vif.mon_cb.pready));
      tr = apb_seq_item::type_id::create("tr", this);
      tr.addr = vif.mon_cb.paddr;
      tr.kind = vif.mon_cb.pwrite ? APB_WRITE : APB_READ;
      tr.data = tr.kind == APB_WRITE ? vif.mon_cb.pwdata : vif.mon_cb.prdata;
      if ($isunknown(tr.data))
        uvm_report_error("MON_X", $sformatf("X detected on data bus: %h", tr.data));
      -> transfer_done;
      ap.write(tr);
    end
  endtask
endclass
