export interface VHDLTestFile {
  id: string;
  filename: string;
  content: string;
  expectedIssues?: string[];
  category: "syntax" | "logic" | "efficiency" | "style" | "mixed";
  difficulty: "easy" | "medium" | "hard";
}

export interface AIResponse {
  model: string;
  timestamp: Date;
  testFileId: string;
  response: string;
  processingTimeMs: number;
  success: boolean;
  error?: string;
}

export interface AnalysisResult {
  issuesFound: string[];
  suggestions: string[];
  confidence: number;
  reasoning: string;
}

export interface ModelConfig {
  name: string;
  provider: "openai" | "anthropic" | "google";
  modelId: string;
  maxTokens: number;
  temperature: number;
}

export interface TestConfig {
  models: ModelConfig[];
  testFiles: string[];
  outputDir: string;
  maxConcurrentRequests: number;
  requestDelayMs: number;
  timeoutMs: number;
}
