`uvm_analysis_imp_decl(_expected)
`uvm_analysis_imp_decl(_actual)

class apb_scoreboard extends uvm_scoreboard;
  `uvm_component_utils(apb_scoreboard)

  uvm_analysis_imp_expected #(apb_seq_item, apb_scoreboard) exp_imp;
  uvm_analysis_imp_actual   #(apb_seq_item, apb_scoreboard) act_imp;

  protected apb_seq_item m_expected[$];
  protected int unsigned m_matches, m_mismatches;

  function new(string name, uvm_component parent);
    super.new(name, parent);
    exp_imp = new("exp_imp", this);
    act_imp = new("act_imp", this);
  endfunction

  function void write_expected(apb_seq_item tr);
    m_expected.push_back(tr);
  endfunction

  function void write_actual(apb_seq_item tr);
    apb_seq_item exp;
    if (m_expected.size() == 0) begin
      `uvm_error("SB_UNEXPECTED", $sformatf("Unexpected transfer: %s", tr.convert2string()))
      return;
    end
    exp = m_expected.pop_front();
    if (!exp.compare(tr)) begin
      m_mismatches++;
      `uvm_error("SB_MISMATCH",
                 $sformatf("Expected %s\n  got      %s", exp.convert2string(), tr.convert2string()))
    end
    else m_matches++;
  endfunction

  virtual function void check_phase(uvm_phase phase);
    if (m_expected.size() != 0)
      `uvm_error(get_type_name(), $sformatf("%0d expected transfers never arrived", m_expected.size()))
  endfunction

  virtual function void report_phase(uvm_phase phase);
    `uvm_info("SB_SUMMARY", $sformatf("matches=%0d mismatches=%0d", m_matches, m_mismatches), UVM_NONE)
  endfunction
endclass : apb_scoreboard
