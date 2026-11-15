class apb_config extends uvm_object;
  `uvm_object_utils(apb_config)

  uvm_active_passive_enum is_active = UVM_ACTIVE;
  rand int unsigned       timeout_ns;
  rand bit [3:0]          slave_mask;
  bit                     has_coverage = 1;

  constraint c_timeout { timeout_ns inside {[50:5000]}; }

  function new(string name = "apb_config");
    super.new(name);
  endfunction
endclass : apb_config
