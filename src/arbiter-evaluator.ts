import * as fs from "fs-extra";
import * as path from "path";
import { AIProviderService } from "./services/ai-providers";
import { MODEL_CONFIGS } from "./config/models";
import { Issue, AIResponse } from "./types";
import dotenv from "dotenv";

dotenv.config();

interface GroundTruthFile {
  testFile: {
    id: string;
    filename: string;
    category: string;
    difficulty: string;
  };
  groundTruth: {
    issues: Issue[];
  };
}

interface ResponseFile {
  testFile: {
    id: string;
    filename: string;
  };
  results: AIResponse[];
}

interface ArbiterMatch {
  groundTruthId: string;
  aiIssueIndex: number;
  matchType: "exact" | "semantic" | "partial";
  confidence: number;
  reasoning: string;
}

interface ArbiterFalsePositive {
  aiIssueIndex: number;
  reasoning: string;
}

interface ArbiterFalseNegative {
  groundTruthId: string;
  reasoning: string;
}

interface ArbiterModelResult {
  model: string;
  matches: ArbiterMatch[];
  falsePositives: ArbiterFalsePositive[];
  falseNegatives: ArbiterFalseNegative[];
}

interface ArbiterResponse {
  modelResults: ArbiterModelResult[];
}

interface EvaluationResult {
  testFile: string;
  model: string;
  category: string;
  difficulty: string;
  groundTruthIssues: number;
  aiFoundIssues: number;
  truePositives: number;
  falsePositives: number;
  falseNegatives: number;
  precision: number;
  recall: number;
  f1Score: number;
  arbiterConfidence: number;
  processingTimeMs: number;
  success: boolean;
}

class ArbiterEvaluator {
  private aiService: AIProviderService;
  private arbiterConfig = MODEL_CONFIGS.find(
    (m) => m.name === "Claude Sonnet 4.5"
  )!;
  private testFilesDir = path.join(process.cwd(), "test-files");
  private responsesDir = path.join(process.cwd(), "results", "responses");
  private outputDir = path.join(process.cwd(), "results", "normalyzed");
  private results: EvaluationResult[] = [];

  constructor() {
    this.aiService = new AIProviderService();
  }

  async run() {
    console.log("🔍 Starting arbiter evaluation...\n");

    const groundTruthFiles = await this.loadGroundTruthFiles();
    const responseFilesByTest = await this.loadAndGroupResponseFiles();

    let successCount = 0;
    let failureCount = 0;

    for (const gtFile of groundTruthFiles) {
      const testFileName = gtFile.testFile.filename;
      const responseFiles = responseFilesByTest.get(testFileName);

      if (!responseFiles || responseFiles.length === 0) {
        console.log(`⚠️  No responses found for ${testFileName}, skipping...`);
        continue;
      }

      console.log(`\n📝 Evaluating: ${testFileName}`);
      console.log(
        `   Ground truth issues: ${gtFile.groundTruth.issues.length}`
      );
      console.log(`   Response files: ${responseFiles.length}`);

      try {
        const startTime = Date.now();
        const arbiterResult = await this.evaluateWithArbiter(
          gtFile,
          responseFiles
        );
        const processingTime = Date.now() - startTime;

        this.processArbiterResult(
          testFileName,
          gtFile,
          responseFiles,
          arbiterResult,
          processingTime
        );

        successCount++;
        console.log(`   ✅ Success (${processingTime}ms)`);
      } catch (error) {
        failureCount++;
        console.error(
          `   ❌ Error: ${error instanceof Error ? error.message : error}`
        );

        this.addFailedResults(testFileName, gtFile, responseFiles);
      }

      await this.delay(1000);
    }

    await this.saveResultsToCsv();

    console.log(`\n\n📊 Evaluation Complete!`);
    console.log(`   Total test files: ${groundTruthFiles.length}`);
    console.log(`   Successful: ${successCount}`);
    console.log(`   Failed: ${failureCount}`);
    console.log(`   Output: results/normalyzed/arbiter_evaluation.csv\n`);
  }

  private async loadGroundTruthFiles(): Promise<GroundTruthFile[]> {
    const files = await fs.readdir(this.testFilesDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const groundTruthFiles: GroundTruthFile[] = [];

    for (const file of jsonFiles) {
      const filePath = path.join(this.testFilesDir, file);
      const data = await fs.readJson(filePath);
      groundTruthFiles.push(data);
    }

    return groundTruthFiles;
  }

  private async loadAndGroupResponseFiles(): Promise<
    Map<string, ResponseFile[]>
  > {
    const files = await fs.readdir(this.responsesDir);
    const jsonFiles = files.filter((f) => f.endsWith(".json"));

    const grouped = new Map<string, ResponseFile[]>();

    for (const file of jsonFiles) {
      const filePath = path.join(this.responsesDir, file);
      const data: ResponseFile = await fs.readJson(filePath);

      const testFileName = data.testFile.filename;

      if (!grouped.has(testFileName)) {
        grouped.set(testFileName, []);
      }
      grouped.get(testFileName)!.push(data);
    }

    return grouped;
  }

  private async evaluateWithArbiter(
    groundTruth: GroundTruthFile,
    responseFiles: ResponseFile[]
  ): Promise<ArbiterResponse> {
    const prompt = this.createArbiterPrompt(groundTruth, responseFiles);

    const response = await this.callArbiter(prompt);

    return this.parseArbiterResponse(response);
  }

  private createArbiterPrompt(
    groundTruth: GroundTruthFile,
    responseFiles: ResponseFile[]
  ): string {
    const gtIssuesSection = groundTruth.groundTruth.issues
      .map(
        (issue) => `
ID: ${issue.id}
Description: ${issue.description}
Lines: ${JSON.stringify(issue.lines)}
Category: ${issue.category}
Severity: ${issue.severity}
Reasoning: ${issue.reasoning}
`
      )
      .join("\n---\n");

    const modelResponsesSection = responseFiles
      .map((rf) =>
        rf.results
          .map(
            (result) => `
Model: ${result.model}
Issues Found (${result.response.issuesFound.length} total):
${result.response.issuesFound
  .map(
    (issue, idx) => `
[${idx}] Description: ${issue.description}
    Lines: ${JSON.stringify(issue.lines)}
    Category: ${issue.category}
    Severity: ${issue.severity}
`
  )
  .join("")}
`
          )
          .join("\n")
      )
      .join("\n");

    return `You are an expert VHDL code reviewer evaluating how well AI models identified issues in VHDL code.

GROUND TRUTH ISSUES (expected issues):
${gtIssuesSection}

AI MODEL RESPONSES:
${modelResponsesSection}

TASK:
For each AI model, determine which of their found issues match the ground truth issues.
Consider semantic similarity - issues can be described differently but refer to the same problem.

You must respond with ONLY valid JSON in this exact format:
{
  "modelResults": [
    {
      "model": "Model Name",
      "matches": [
        {
          "groundTruthId": "issue_id_from_ground_truth",
          "aiIssueIndex": 0,
          "matchType": "exact" | "semantic" | "partial",
          "confidence": 0.0-1.0,
          "reasoning": "Brief explanation of why this matches"
        }
      ],
      "falsePositives": [
        {
          "aiIssueIndex": 2,
          "reasoning": "Why this is not a real issue"
        }
      ],
      "falseNegatives": [
        {
          "groundTruthId": "issue_id",
          "reasoning": "Why AI missed this issue"
        }
      ]
    }
  ]
}

Respond ONLY with valid JSON. Do not include any text outside the JSON structure.`;
  }

  private async callArbiter(prompt: string): Promise<string> {
    if (!this.arbiterConfig) {
      throw new Error("Arbiter model (Claude Sonnet 4.5) not found in config");
    }

    const response = await this.aiService.sendPrompt(
      this.arbiterConfig,
      prompt
    );

    return response;
  }

  private parseArbiterResponse(response: string): ArbiterResponse {
    try {
      let cleaned = response
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();

      const firstBrace = cleaned.indexOf("{");
      if (firstBrace === -1) {
        throw new Error("No JSON object found in response");
      }

      let braceCount = 0;
      let jsonEnd = -1;
      for (let i = firstBrace; i < cleaned.length; i++) {
        if (cleaned[i] === "{") {
          braceCount++;
        } else if (cleaned[i] === "}") {
          braceCount--;
          if (braceCount === 0) {
            jsonEnd = i + 1;
            break;
          }
        }
      }

      if (jsonEnd === -1) {
        throw new Error("Incomplete JSON object in response");
      }

      const jsonString = cleaned.substring(firstBrace, jsonEnd);
      const parsed = JSON.parse(jsonString);

      if (!parsed.modelResults) {
        throw new Error("Response does not contain modelResults");
      }

      return parsed as ArbiterResponse;
    } catch (error) {
      throw new Error(
        `Failed to parse arbiter response: ${
          error instanceof Error ? error.message : error
        }`
      );
    }
  }

  private processArbiterResult(
    testFileName: string,
    groundTruth: GroundTruthFile,
    responseFiles: ResponseFile[],
    arbiterResult: ArbiterResponse,
    processingTime: number
  ) {
    const allModelResponses = new Map<string, AIResponse>();

    for (const rf of responseFiles) {
      for (const result of rf.results) {
        allModelResponses.set(result.model, result);
      }
    }

    for (const modelResult of arbiterResult.modelResults) {
      const modelResponse = allModelResponses.get(modelResult.model);

      if (!modelResponse) {
        console.warn(
          `   ⚠️  Model ${modelResult.model} not found in responses`
        );
        continue;
      }

      const truePositives = modelResult.matches.length;
      const falsePositives = modelResult.falsePositives.length;
      const falseNegatives = modelResult.falseNegatives.length;

      const precision =
        truePositives + falsePositives > 0
          ? (truePositives / (truePositives + falsePositives)) * 100
          : 0;

      const recall =
        truePositives + falseNegatives > 0
          ? (truePositives / (truePositives + falseNegatives)) * 100
          : 0;

      const f1Score =
        precision + recall > 0
          ? 2 * ((precision * recall) / (precision + recall))
          : 0;

      const avgConfidence =
        modelResult.matches.length > 0
          ? modelResult.matches.reduce((sum, m) => sum + m.confidence, 0) /
            modelResult.matches.length
          : 0;

      this.results.push({
        testFile: testFileName,
        model: modelResult.model,
        category: groundTruth.testFile.category,
        difficulty: groundTruth.testFile.difficulty,
        groundTruthIssues: groundTruth.groundTruth.issues.length,
        aiFoundIssues: modelResponse.response.issuesFound.length,
        truePositives,
        falsePositives,
        falseNegatives,
        precision,
        recall,
        f1Score,
        arbiterConfidence: avgConfidence * 100,
        processingTimeMs: processingTime,
        success: true,
      });
    }
  }

  private addFailedResults(
    testFileName: string,
    groundTruth: GroundTruthFile,
    responseFiles: ResponseFile[]
  ) {
    for (const rf of responseFiles) {
      for (const result of rf.results) {
        this.results.push({
          testFile: testFileName,
          model: result.model,
          category: groundTruth.testFile.category,
          difficulty: groundTruth.testFile.difficulty,
          groundTruthIssues: groundTruth.groundTruth.issues.length,
          aiFoundIssues: result.response.issuesFound.length,
          truePositives: 0,
          falsePositives: 0,
          falseNegatives: 0,
          precision: 0,
          recall: 0,
          f1Score: 0,
          arbiterConfidence: 0,
          processingTimeMs: 0,
          success: false,
        });
      }
    }
  }

  private async saveResultsToCsv() {
    await fs.ensureDir(this.outputDir);

    const csvPath = path.join(this.outputDir, "arbiter_evaluation.csv");

    const header = [
      "Test File",
      "Model",
      "Category",
      "Difficulty",
      "Ground Truth Issues",
      "AI Found Issues",
      "True Positives",
      "False Positives",
      "False Negatives",
      "Precision (%)",
      "Recall (%)",
      "F1 Score (%)",
      "Arbiter Confidence (%)",
      "Processing Time (ms)",
      "Success",
    ].join(",");

    const rows = this.results.map((r) =>
      [
        r.testFile,
        r.model,
        r.category,
        r.difficulty,
        r.groundTruthIssues,
        r.aiFoundIssues,
        r.truePositives,
        r.falsePositives,
        r.falseNegatives,
        r.precision.toFixed(2),
        r.recall.toFixed(2),
        r.f1Score.toFixed(2),
        r.arbiterConfidence.toFixed(2),
        r.processingTimeMs,
        r.success,
      ].join(",")
    );

    const csv = [header, ...rows].join("\n");

    await fs.writeFile(csvPath, csv, "utf-8");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

async function main() {
  try {
    const evaluator = new ArbiterEvaluator();
    await evaluator.run();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
