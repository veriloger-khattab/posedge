# APB testbench regression makefile
TEST      ?= apb_base_test
SEED      ?= random
VERBOSITY ?= UVM_MEDIUM

compile:
	vcs -full64 -sverilog -ntb_opts uvm-1.2 -f files.f -l compile.log

run: compile
	./simv +UVM_TESTNAME=$(TEST) +ntb_random_seed=$(SEED) +UVM_VERBOSITY=$(VERBOSITY) -l sim.log

clean:
	rm -rf csrc simv simv.daidir *.log *.fsdb ucli.key
