export interface LineReference {
  start: number;
  end: number;
}

export interface Issue {
  id: string;
  description: string;
  lines: LineReference[];
  category: "syntax" | "logic" | "style" | "efficiency";
  severity: "critical" | "high" | "medium" | "low";
  suggestions: string[];
  reasoning: string;
}

export interface VHDLTestFile {
  id: string;
  filename: string;
  content: string;
  category: "syntax" | "logic" | "efficiency" | "style" | "mixed";
  difficulty: "easy" | "medium" | "hard";
}

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AIResponse {
  model: string;
  timestamp: Date;
  testFileId: string;
  response: AnalysisResult;
  processingTimeMs: number;
  success: boolean;
  error?: string;
  tokensUsed?: TokenUsage;
}

export interface StructuredIssue {
  description: string;
  lines: LineReference[];
  category: "syntax" | "logic" | "style" | "efficiency";
  severity: "critical" | "high" | "medium" | "low";
  suggestions: string[];
}

export interface AnalysisResult {
  issuesFound: StructuredIssue[];
  confidence: number;
  reasoning: string;
}

export interface ModelPricing {
  inputPer1M: number;
  outputPer1M: number;
}

export interface ModelConfig {
  name: string;
  provider: "openai" | "anthropic" | "google";
  modelId: string;
  maxTokens: number;
  temperature?: number;
  seed?: number;
  pricing?: ModelPricing;
}

export interface TestConfig {
  models: ModelConfig[];
  testFiles: string[];
  outputDir: string;
  maxConcurrentRequests: number;
  requestDelayMs: number;
  timeoutMs: number;
}
