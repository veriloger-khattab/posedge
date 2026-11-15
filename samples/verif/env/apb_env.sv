class apb_env extends uvm_env;
  `uvm_component_utils(apb_env)

  apb_agent      agent;
  apb_scoreboard sb;
  apb_coverage   cov;
  apb_reg_block  regmodel;

  function new(string name, uvm_component parent);
    super.new(name, parent);
  endfunction

  virtual function void build_phase(uvm_phase phase);
    agent = apb_agent::type_id::create("agent", this);
    sb    = apb_scoreboard::type_id::create("sb", this);
    cov   = apb_coverage::type_id::create("cov", this);
    uvm_config_db#(int)::set(this, "agent.*", "num_slaves", 4);
  endfunction

  virtual function void connect_phase(uvm_phase phase);
    agent.mon.ap.connect(sb.act_imp);
    agent.mon.ap.connect(cov.analysis_export);
  endfunction

  virtual function void end_of_elaboration_phase(uvm_phase phase);
    uvm_top.print_topology();
  endfunction
endclass : apb_env
