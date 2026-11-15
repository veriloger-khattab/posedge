# Questa run script
vlib work
vlog -sv -f files.f +define+APB_DEBUG
vsim -c tb_top +UVM_TESTNAME=apb_base_test -do "run -all; quit -f"
