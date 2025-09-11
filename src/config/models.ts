import { ModelConfig } from "../types";

export const MODEL_CONFIGS: ModelConfig[] = [
  {
    name: "GPT-4o Mini",
    provider: "openai",
    modelId: "gpt-4o-mini",
    maxTokens: 4000,
    temperature: 0.1,
  },
  /*{
    name: "Claude Sonnet 4",
    provider: "anthropic",
    modelId: "claude-3-5-sonnet-20241022",
    maxTokens: 4000,
    temperature: 0.1,
  },*/
  {
    name: "Gemini 2.0 Flash",
    provider: "google",
    modelId: "gemini-2.0-flash-exp",
    maxTokens: 4000,
    temperature: 0.1,
  },
];
