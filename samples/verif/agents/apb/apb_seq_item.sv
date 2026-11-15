// APB sequence item: one read or write transfer
typedef enum bit { APB_READ = 1'b0, APB_WRITE = 1'b1 } apb_kind_e;

class apb_seq_item extends uvm_sequence_item;
  rand apb_kind_e        kind;
  rand bit [31:0]        addr;
  rand bit [31:0]        data;
  rand bit [3:0]         strb;
  randc bit [1:0]        slave_id;
       int unsigned      delay_cycles;

  constraint c_addr_aligned { addr[1:0] == 2'b00; }

  constraint c_addr_range {
    soft addr inside {[32'h0000_0000 : 32'h0000_0FFF]};
    kind == APB_READ -> strb == 4'b0000;
    solve kind before strb;
  }

  constraint c_delay_dist {
    delay_cycles dist { 0 := 60, [1:3] :/ 30, [4:15] :/ 10 };
  }

  `uvm_object_utils_begin(apb_seq_item)
    `uvm_field_enum(apb_kind_e, kind, UVM_ALL_ON)
    `uvm_field_int(addr, UVM_ALL_ON | UVM_HEX)
    `uvm_field_int(data, UVM_ALL_ON | UVM_HEX)
    `uvm_field_int(strb, UVM_DEFAULT | UVM_NOCOMPARE)
  `uvm_object_utils_end

  function new(string name = "apb_seq_item");
    super.new(name);
  endfunction

  virtual function string convert2string();
    return $sformatf("%s addr=0x%08h data=0x%08h strb=%04b", kind.name(), addr, data, strb);
  endfunction

  function void post_randomize();
    if (kind == APB_WRITE && strb == 0) strb = 4'hF;
  endfunction
endclass : apb_seq_item
