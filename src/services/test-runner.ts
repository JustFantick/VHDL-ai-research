import fs from "fs-extra";
import path from "path";
import { AIProviderService } from "./ai-providers";
import {
  VHDLTestFile,
  AIResponse,
  ModelConfig,
  TestConfig,
  AnalysisResult,
} from "../types";

export class TestRunner {
  private aiService: AIProviderService;
  private config: TestConfig;

  constructor(config: TestConfig) {
    this.aiService = new AIProviderService();
    this.config = config;
  }

  async runTests(): Promise<void> {
    console.log("Starting VHDL AI Analysis Tests...");

    await this.ensureOutputDirectory();
    const testFiles = await this.loadTestFiles();

    for (const testFile of testFiles) {
      console.log(`\nTesting file: ${testFile.filename}`);
      await this.runTestForFile(testFile);
    }

    console.log("\nAll tests completed!");
  }

  private async ensureOutputDirectory(): Promise<void> {
    await fs.ensureDir(this.config.outputDir);
    await fs.ensureDir(path.join(this.config.outputDir, "responses"));
    await fs.ensureDir(path.join(this.config.outputDir, "reports"));
  }

  private async loadTestFiles(): Promise<VHDLTestFile[]> {
    const testFiles: VHDLTestFile[] = [];

    for (const filePath of this.config.testFiles) {
      if (await fs.pathExists(filePath)) {
        const content = await fs.readFile(filePath, "utf-8");
        const filename = path.basename(filePath);

        testFiles.push({
          id: this.generateFileId(filename),
          filename,
          content,
          category: this.detectCategory(filename),
          difficulty: this.detectDifficulty(content),
        });
      } else {
        console.warn(`Test file not found: ${filePath}`);
      }
    }

    return testFiles;
  }

  private async runTestForFile(testFile: VHDLTestFile): Promise<void> {
    const results: AIResponse[] = [];

    for (const modelConfig of this.config.models) {
      try {
        console.log(`  Testing with ${modelConfig.name}...`);

        const startTime = Date.now();
        const analysis = await this.aiService.analyzeVHDL(
          modelConfig,
          testFile.content
        );
        const processingTime = Date.now() - startTime;

        const response: AIResponse = {
          model: modelConfig.name,
          timestamp: new Date(),
          testFileId: testFile.id,
          response: analysis,
          processingTimeMs: processingTime,
          success: true,
        };

        results.push(response);
        console.log(`    ✓ Completed in ${processingTime}ms`);

        await this.delay(this.config.requestDelayMs);
      } catch (error) {
        console.error(`    ✗ Error with ${modelConfig.name}:`, error);

        const errorResponse: AIResponse = {
          model: modelConfig.name,
          timestamp: new Date(),
          testFileId: testFile.id,
          response: {
            issuesFound: [],
            confidence: 0,
            reasoning: error instanceof Error ? error.message : "Unknown error",
          },
          processingTimeMs: 0,
          success: false,
          error: error instanceof Error ? error.message : "Unknown error",
        };

        results.push(errorResponse);
      }
    }

    await this.saveResults(testFile, results);
  }

  private async saveResults(
    testFile: VHDLTestFile,
    results: AIResponse[]
  ): Promise<void> {
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `${testFile.id}_${timestamp}.json`;
    const filepath = path.join(this.config.outputDir, "responses", filename);

    const testResult = {
      testFile: {
        id: testFile.id,
        filename: testFile.filename,
        category: testFile.category,
        difficulty: testFile.difficulty,
      },
      results,
      summary: this.generateSummary(results),
    };

    await fs.writeJson(filepath, testResult, { spaces: 2 });
    console.log(`  Results saved to: ${filename}`);
  }

  private generateSummary(results: AIResponse[]): any {
    const successful = results.filter((r) => r.success);
    const failed = results.filter((r) => !r.success);

    return {
      totalTests: results.length,
      successful: successful.length,
      failed: failed.length,
      averageProcessingTime:
        successful.length > 0
          ? Math.round(
              successful.reduce((sum, r) => sum + r.processingTimeMs, 0) /
                successful.length
            )
          : 0,
      models: results.map((r) => ({
        model: r.model,
        success: r.success,
        processingTime: r.processingTimeMs,
      })),
    };
  }

  private generateFileId(filename: string): string {
    return filename.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
  }

  private detectCategory(filename: string): VHDLTestFile["category"] {
    const lower = filename.toLowerCase();
    if (lower.includes("syntax")) return "syntax";
    if (lower.includes("logic")) return "logic";
    if (lower.includes("efficiency")) return "efficiency";
    if (lower.includes("style")) return "style";
    return "mixed";
  }

  private detectDifficulty(content: string): VHDLTestFile["difficulty"] {
    const lines = content.split("\n").length;
    const complexity = content.split(
      /\b(if|case|for|while|process|entity|architecture)\b/gi
    ).length;

    if (lines > 100 || complexity > 20) return "hard";
    if (lines > 50 || complexity > 10) return "medium";
    return "easy";
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
