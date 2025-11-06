import { ModelConfig } from "../types";

const MAX_TOKENS = 16000;

export const MODEL_CONFIGS: ModelConfig[] = [
  {
    name: "GPT-5 Nano",
    provider: "openai",
    modelId: "gpt-5-nano",
    maxTokens: MAX_TOKENS,
    seed: 42,
  },
  {
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    modelId: "claude-sonnet-4-5",
    maxTokens: MAX_TOKENS,
    temperature: 0.0,
  },
  {
    name: "Gemini 2.5 Flash Lite",
    provider: "google",
    modelId: "gemini-2.5-flash-lite",
    maxTokens: MAX_TOKENS,
    temperature: 0.0,
  },
];
