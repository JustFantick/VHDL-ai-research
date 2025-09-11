import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ModelConfig, AnalysisResult } from "../types";

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
    return `Analyze the following VHDL code for errors, inefficiencies, and potential improvements. Provide your analysis in JSON format with the following structure:

{
  "issuesFound": ["list of specific issues found"],
  "suggestions": ["list of improvement suggestions"],
  "confidence": 0.85,
  "reasoning": "brief explanation of your analysis"
}

Focus on:
1. Syntax errors
2. Logic errors
3. Performance inefficiencies
4. Code style issues
5. Best practices violations

VHDL Code:
\`\`\`vhdl
${vhdlCode}
\`\`\`

Respond only with valid JSON.`;
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
      max_tokens: config.maxTokens,
      temperature: config.temperature,
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
      const cleaned = content
        .replace(/```json\n?/g, "")
        .replace(/```\n?/g, "")
        .trim();
      const parsed = JSON.parse(cleaned);

      return {
        issuesFound: parsed.issuesFound || [],
        suggestions: parsed.suggestions || [],
        confidence: parsed.confidence || 0,
        reasoning: parsed.reasoning || "",
      };
    } catch (error) {
      throw new Error(`Failed to parse AI response: ${error}`);
    }
  }
}
