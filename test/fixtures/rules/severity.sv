// Rule #1 fixtures: every message ID takes the color of its severity.
class severity_cases extends uvm_component;
  task run_phase(uvm_phase phase);
    `uvm_info("INFO_ID", "an info message", UVM_LOW)
    `uvm_warning("WARN_ID", "a warning message")
    `uvm_error("ALGORITHM_ISSUE", "The apb virtual interface is not configured before run phase")
    `uvm_fatal("FATAL_ID", "a fatal message")
    `uvm_error(get_type_name(), "the ID is a function call")
    `uvm_error(MY_ID, "the ID is a localparam")
    `uvm_error(`gfn, "a macro ID keeps the macro color")
    `uvm_error(
        "MULTILINE_ID",
        "the ID is on its own line")
    `uvm_info_context("CTX_ID", "context variant", UVM_NONE, this)
    uvm_report_error("FN_ERR_ID", "function form");
    uvm_report_warning("FN_WARN_ID", "function form");
    $error("system task error");
    $fatal(1, "system task fatal");
    $warning("system task warning");
    $info("system task info");
    set_report_severity_action(UVM_ERROR, UVM_DISPLAY | UVM_COUNT);
    set_report_severity_action(UVM_FATAL, UVM_EXIT);
    set_report_severity_action(UVM_WARNING, UVM_DISPLAY);
    set_report_severity_action(UVM_INFO, UVM_DISPLAY);
  endtask
endclass

module verbosity_cases;
  initial begin
    `uvm_info("V0", "always", UVM_NONE)
    `uvm_info("V1", "low", UVM_LOW)
    `uvm_info("V2", "medium", UVM_MEDIUM)
    `uvm_info("V3", "high", UVM_HIGH)
    `uvm_info("V4", "full", UVM_FULL)
    `uvm_info("V5", "debug", UVM_DEBUG)
  end
endmodule

covergroup cg_cases;
  cp: coverpoint x {
    bins         ok    = {[0:3]};
    illegal_bins bad   = {4'b1x0z};
    ignore_bins  skip  = {7};
  }
endgroup
