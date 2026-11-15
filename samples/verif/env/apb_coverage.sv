class apb_coverage extends uvm_subscriber #(apb_seq_item);
  `uvm_component_utils(apb_coverage)

  apb_seq_item tr;

  covergroup cg_apb;
    option.per_instance = 1;
    option.comment      = "APB transfer coverage";
    type_option.weight  = 2;

    cp_kind: coverpoint tr.kind;

    cp_addr: coverpoint tr.addr[11:0] {
      bins         low     = {[12'h000 : 12'h0FF]};
      bins         mid[4]  = {[12'h100 : 12'hEFF]};
      bins         high    = {[12'hF00 : 12'hFFF]};
      illegal_bins misalign = {[0:$]} with (item % 4 != 0);
    }

    cp_strb: coverpoint tr.strb {
      wildcard bins byte0 = {4'b???1};
      ignore_bins   none  = {4'b0000};
      illegal_bins  bad   = {4'b1x0z};
    }

    cx_kind_addr: cross cp_kind, cp_addr {
      ignore_bins reads_high = binsof(cp_kind) intersect {APB_READ} && binsof(cp_addr.high);
    }
  endgroup : cg_apb

  function new(string name, uvm_component parent);
    super.new(name, parent);
    cg_apb = new();
  endfunction

  virtual function void write(apb_seq_item t);
    tr = t;
    cg_apb.sample();
  endfunction
endclass
