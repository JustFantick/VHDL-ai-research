import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ModelConfig, AnalysisResult, StructuredIssue } from "../types";

export class AIProviderService {
  private openai?: OpenAI;
  private anthropic?: Anthropic;
  private google?: GoogleGenerativeAI;

  constructor() {
    this.initializeProviders();
  }

  private initializeProviders() {
    if (process.env.OPENAI_API_KEY) {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }

    if (process.env.ANTHROPIC_API_KEY) {
      this.anthropic = new Anthropic({
        apiKey: process.env.ANTHROPIC_API_KEY,
      });
    }

    if (process.env.GOOGLE_API_KEY) {
      this.google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
    }
  }

  async analyzeVHDL(
    config: ModelConfig,
    vhdlCode: string
  ): Promise<AnalysisResult> {
    const prompt = this.createVHDLAnalysisPrompt(vhdlCode);

    switch (config.provider) {
      case "openai":
        return this.analyzeWithOpenAI(config, prompt);
      case "anthropic":
        return this.analyzeWithAnthropic(config, prompt);
      case "google":
        return this.analyzeWithGoogle(config, prompt);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  private createVHDLAnalysisPrompt(vhdlCode: string): string {
    return `Analyze the following VHDL code for errors and issues. Report ONLY clear, unambiguous issues that can be objectively verified. Provide your analysis in JSON format with the following EXACT structure:

{
  "issuesFound": [
    {
      "description": "specific issue description",
      "lines": [{"start": 21, "end": 21}],
      "category": "syntax|logic|style|efficiency",
      "severity": "critical|high|medium|low",
      "suggestions": ["specific suggestion to fix this issue"]
    }
  ],
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of your analysis"
}

CATEGORY DEFINITIONS (use exactly these):
- "syntax": Compilation errors that prevent code from compiling (missing semicolons, parentheses, undeclared identifiers, type mismatches)
- "logic": Functional errors that cause incorrect behavior (wrong assignments, missing assignments, incorrect logic expressions, race conditions, unreachable states)
- "style": Code style violations following VHDL conventions (inconsistent capitalization, old-style constructs like 'event instead of rising_edge, missing spaces, naming conventions)
- "efficiency": Suboptimal implementations that waste resources (redundant logic, unnecessary processes for combinational logic, inefficient algorithms)

SEVERITY GUIDELINES:
- "critical": Code will not compile or will cause simulation errors (syntax errors, missing declarations)
- "high": Code compiles but has functional errors that will cause incorrect behavior (wrong logic, missing assignments, unassigned outputs)
- "medium": Code works but has style issues or moderate efficiency problems (old-style constructs, redundant operations, style violations)
- "low": Minor style issues or very minor efficiency improvements (spacing, minor naming inconsistencies)

IMPORTANT RULES:
1. Report ONLY unambiguous issues - if you're unsure, do not report it
2. Each issue must be objectively verifiable (compiler would catch it, or can be verified through code analysis)
3. Do NOT report subjective preferences or optional optimizations unless they are clear issues
4. Use exact category names: "syntax", "logic", "style", "efficiency" (NOT "performance")
5. Line numbers must be accurate (1-indexed, where line 1 is the first line of code)
6. If no issues are found, return empty array: "issuesFound": []
7. Focus on issues that exist, not suggestions for "better" code unless it's a clear problem

For each issue:
- Use precise line numbers (start and end can be the same for single-line issues)
- Choose category that matches the issue type exactly
- Assign severity based on impact (critical > high > medium > low)
- Provide clear, specific description of what is wrong
- Include actionable suggestions to fix the issue

VHDL Code:
\`\`\`vhdl
${vhdlCode}
\`\`\`

Respond ONLY with valid JSON. Do not include any text outside the JSON structure.`;
  }

  private async analyzeWithOpenAI(
    config: ModelConfig,
    prompt: string
  ): Promise<AnalysisResult> {
    if (!this.openai) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await this.openai.chat.completions.create({
      model: config.modelId,
      messages: [{ role: "user", content: prompt }],
      //max_tokens: config.maxTokens, // OpenAI does not support max_tokens
      //temperature: config.temperature, // GPT-5 family models does not support temperature
      //seed: 42,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    return this.parseAIResponse(content);
  }

  private async analyzeWithAnthropic(
    config: ModelConfig,
    prompt: string
  ): Promise<AnalysisResult> {
    if (!this.anthropic) {
      throw new Error("Anthropic API key not configured");
    }

    const response = await this.anthropic.messages.create({
      model: config.modelId,
      max_tokens: config.maxTokens,
      temperature: config.temperature,
      messages: [{ role: "user", content: prompt }],
    });

    const content = response.content[0];
    if (content.type !== "text") {
      throw new Error("Unexpected response type from Anthropic");
    }

    return this.parseAIResponse(content.text);
  }

  private async analyzeWithGoogle(
    config: ModelConfig,
    prompt: string
  ): Promise<AnalysisResult> {
    if (!this.google) {
      throw new Error("Google API key not configured");
    }

    const model = this.google.getGenerativeModel({ model: config.modelId });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error("No response content from Google");
    }

    return this.parseAIResponse(content);
  }

  private parseAIResponse(content: string): AnalysisResult {
    try {
      let cleaned = content
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

      const issuesFound: StructuredIssue[] = (parsed.issuesFound || []).map(
        (issue: any) => ({
          description: issue.description || issue,
          lines: issue.lines || [{ start: 0, end: 0 }],
          category: issue.category || "style",
          severity: issue.severity || "medium",
          suggestions: issue.suggestions || [],
        })
      );

      return {
        issuesFound,
        confidence: parsed.confidence || 0,
        reasoning: parsed.reasoning || "",
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }
}
