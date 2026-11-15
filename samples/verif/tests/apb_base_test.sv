class apb_base_test extends uvm_test;
  `uvm_component_utils(apb_base_test)

  apb_env    env;
  apb_config cfg;

  function new(string name = "apb_base_test", uvm_component parent = null);
    super.new(name, parent);
  endfunction

  virtual function void build_phase(uvm_phase phase);
    super.build_phase(phase);
    cfg = apb_config::type_id::create("cfg");
    if (!cfg.randomize() with { timeout_ns inside {[100:1000]}; })
      `uvm_fatal("RANDFAIL", "Could not randomize the APB configuration")
    uvm_config_db#(apb_config)::set(this, "env.agent*", "cfg", cfg);
    env = apb_env::type_id::create("env", this);
    set_report_verbosity_level_hier(UVM_MEDIUM);
    set_report_severity_action_hier(UVM_WARNING, UVM_DISPLAY | UVM_COUNT);
  endfunction

  virtual task run_phase(uvm_phase phase);
    apb_rand_seq seq = apb_rand_seq::type_id::create("seq");
    phase.raise_objection(this, "Starting the main sequence");
    seq.start(env.agent.sqr);
    #1us;
    phase.drop_objection(this);
  endtask

  virtual function void final_phase(uvm_phase phase);
    uvm_report_server svr = uvm_report_server::get_server();
    if (svr.get_severity_count(UVM_FATAL) + svr.get_severity_count(UVM_ERROR) > 0)
      $display("*** TEST FAILED ***");
    else
      $display("*** TEST PASSED ***");
  endfunction
endclass : apb_base_test
