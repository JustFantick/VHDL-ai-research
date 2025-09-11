import fs from "fs-extra";
import path from "path";
import { AIResponse } from "../types";

export class ReportGenerator {
  private outputDir: string;

  constructor(outputDir: string) {
    this.outputDir = outputDir;
  }

  async generateSummaryReport(): Promise<void> {
    const responsesDir = path.join(this.outputDir, "responses");
    const files = await fs.readdir(responsesDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const allResults: any[] = [];

    for (const file of jsonFiles) {
      const filePath = path.join(responsesDir, file);
      const data = await fs.readJson(filePath);
      allResults.push(data);
    }

    const report = this.createSummaryReport(allResults);
    const reportPath = path.join(
      this.outputDir,
      "reports",
      "summary_report.json"
    );

    await fs.ensureDir(path.dirname(reportPath));
    await fs.writeJson(reportPath, report, { spaces: 2 });

    console.log(`Summary report generated: ${reportPath}`);
  }

  private createSummaryReport(allResults: any[]): any {
    const modelStats = new Map<string, any>();
    const testFileStats = new Map<string, any>();

    allResults.forEach((result) => {
      result.results.forEach((response: AIResponse) => {
        // Model statistics
        if (!modelStats.has(response.model)) {
          modelStats.set(response.model, {
            model: response.model,
            totalTests: 0,
            successful: 0,
            failed: 0,
            totalProcessingTime: 0,
            averageProcessingTime: 0,
          });
        }

        const modelStat = modelStats.get(response.model);
        modelStat.totalTests++;
        if (response.success) {
          modelStat.successful++;
          modelStat.totalProcessingTime += response.processingTimeMs;
        } else {
          modelStat.failed++;
        }

        // Test file statistics
        if (!testFileStats.has(result.testFile.filename)) {
          testFileStats.set(result.testFile.filename, {
            filename: result.testFile.filename,
            category: result.testFile.category,
            difficulty: result.testFile.difficulty,
            totalModels: 0,
            successfulModels: 0,
          });
        }

        const fileStat = testFileStats.get(result.testFile.filename);
        fileStat.totalModels++;
        if (response.success) {
          fileStat.successfulModels++;
        }
      });
    });

    // Calculate averages
    modelStats.forEach((stat) => {
      if (stat.successful > 0) {
        stat.averageProcessingTime = Math.round(
          stat.totalProcessingTime / stat.successful
        );
      }
    });

    return {
      generatedAt: new Date().toISOString(),
      summary: {
        totalTestFiles: testFileStats.size,
        totalTests: allResults.length,
        totalResponses: Array.from(modelStats.values()).reduce(
          (sum, stat) => sum + stat.totalTests,
          0
        ),
      },
      modelPerformance: Array.from(modelStats.values()),
      testFilePerformance: Array.from(testFileStats.values()),
      recommendations: this.generateRecommendations(
        Array.from(modelStats.values())
      ),
    };
  }

  private generateRecommendations(modelStats: any[]): string[] {
    const recommendations: string[] = [];

    const bestModel = modelStats.reduce((best, current) =>
      current.successful > best.successful ? current : best
    );

    const fastestModel = modelStats.reduce((fastest, current) =>
      current.averageProcessingTime < fastest.averageProcessingTime
        ? current
        : fastest
    );

    recommendations.push(
      `Best performing model: ${bestModel.model} (${bestModel.successful}/${bestModel.totalTests} successful)`
    );
    recommendations.push(
      `Fastest model: ${fastestModel.model} (${fastestModel.averageProcessingTime}ms average)`
    );

    const failedModels = modelStats.filter((m) => m.failed > 0);
    if (failedModels.length > 0) {
      recommendations.push(
        `Models with failures: ${failedModels
          .map((m) => `${m.model} (${m.failed} failures)`)
          .join(", ")}`
      );
    }

    return recommendations;
  }
}
