// APB testbench filelist
+incdir+${UVM_HOME}/src
+incdir+../verif/include
+incdir+../verif/agents/apb
+define+APB_DEBUG
+define+UVM_REPORT_DISABLE_FILE_LINE+NUM_SLAVES=4
-timescale=1ns/1ps
-sv

# RTL
../rtl/apb_slave.sv
-v ../rtl/sync_fifo.v

# Testbench
$UVM_HOME/src/uvm_pkg.sv
../verif/agents/apb/apb_pkg.sv
../verif/sva/apb_sva.sv
../tb/apb_if.sv
../tb/tb_top.sv
-f $(PROJ_ROOT)/common/vip.f
