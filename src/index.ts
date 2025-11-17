import dotenv from "dotenv";
import fs from "fs-extra";
import path from "path";
import { TestRunner } from "./services/test-runner";
import { MODEL_CONFIGS } from "./config/models";
import { TestConfig } from "./types";

dotenv.config();

async function main() {
  const config: TestConfig = {
    models: MODEL_CONFIGS,
    testFiles: [
      "./test-files/1_comparator_golden.vhd",
      "./test-files/2_shift_register_golden.vhd",
      "./test-files/3_moore_fsm_golden.vhd",
      "./test-files/4_viterbi_decoder_golden.vhd",
      "./test-files/5_testbench_moore_golden.vhd",
      "./test-files/6_code_converter_syntax_easy.vhd",
      "./test-files/7_reg_multifunc_syntax_medium.vhd",
      "./test-files/8_generic_counter_syntax_hard.vhd",
      "./test-files/9_comparator_style_medium.vhd",
      "./test-files/10_moore_fsm_style_medium.vhd",
      "./test-files/11_comparator_logic_easy.vhd",
      "./test-files/12_counter_logic_easy.vhd",
      "./test-files/13_reg_multifunc_logic_medium.vhd",
      "./test-files/14_moore_fsm_logic_medium.vhd",
      "./test-files/15_mealy_fsm_logic_hard.vhd",
      "./test-files/16_testbench_moore_logic_hard.vhd",
      "./test-files/17_mux_efficiency_medium.vhd",
      "./test-files/18_viterbi_decoder_efficiency_hard.vhd",
      "./test-files/19_fifo_mixed_medium.vhd",
      "./test-files/20_ALU_mixed_medium.vhd",
      "./test-files/21_mealy_fsm_mixed_hard.vhd",
      "./test-files/22_priority_encoder_mixed_hard.vhd",
      "./test-files/23_bin-to-bcd_converter_mixed_hard.vhd",
      "./test-files/24_ram_controller_mixed_hard.vhd",
      "./test-files/25_viterbi_decoder_mixed_hard.vhd",
    ],
    outputDir: "./results",
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || "9"),
    requestDelayMs: parseInt(process.env.REQUEST_DELAY_MS || "1000"),
    timeoutMs: parseInt(process.env.TIMEOUT_MS || "30000"),
  };

  const runner = new TestRunner(config);
  await runner.runTests();
}

main().catch(console.error);
