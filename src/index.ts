import dotenv from "dotenv";
import { TestRunner } from "./services/test-runner";
import { MODEL_CONFIGS } from "./config/models";
import { TestConfig } from "./types";

dotenv.config();

async function main() {
  const config: TestConfig = {
    models: MODEL_CONFIGS,
    testFiles: [
      "./test-files/syntax_error.vhd",
      "./test-files/logic_error.vhd",
      "./test-files/inefficient_code.vhd",
      "./test-files/style_issues.vhd",
      "./test-files/complex_design.vhd",
    ],
    outputDir: "./results",
    maxConcurrentRequests: parseInt(process.env.MAX_CONCURRENT_REQUESTS || "3"),
    requestDelayMs: parseInt(process.env.REQUEST_DELAY_MS || "1000"),
    timeoutMs: parseInt(process.env.TIMEOUT_MS || "30000"),
  };

  const runner = new TestRunner(config);
  await runner.runTests();
}

main().catch(console.error);
