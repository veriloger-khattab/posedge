class apb_rand_seq extends uvm_sequence #(apb_seq_item);
  `uvm_object_utils(apb_rand_seq)
  `uvm_declare_p_sequencer(apb_sequencer)

  rand int unsigned num_items;
  constraint c_num { num_items inside {[8:32]}; }

  function new(string name = "apb_rand_seq");
    super.new(name);
  endfunction

  virtual task body();
    repeat (num_items) begin
      req = apb_seq_item::type_id::create("req");
      start_item(req);
      if (!req.randomize() with { kind == APB_WRITE -> addr < 32'h100; })
        `uvm_error("RAND", "Randomization of the APB item failed")
      finish_item(req);
      get_response(rsp);
    end
    `uvm_do_with(req, { addr == 32'h10; kind == APB_READ; })
  endtask
endclass : apb_rand_seq
