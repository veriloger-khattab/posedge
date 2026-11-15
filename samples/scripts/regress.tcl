# Nightly regression launcher
set tests {apb_base_test apb_rand_test apb_error_test}
foreach t $tests {
    puts "Launching $t"
    exec make -C ../sim run TEST=$t SEED=random
}
