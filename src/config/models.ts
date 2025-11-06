import { ModelConfig } from "../types";

const MAX_TOKENS = 16000;

export const MODEL_CONFIGS: ModelConfig[] = [
  {
    name: "GPT-5",
    provider: "openai",
    modelId: "gpt-5",
    maxTokens: MAX_TOKENS,
    seed: 42,
  },
  {
    name: "GPT-5 Mini",
    provider: "openai",
    modelId: "gpt-5-mini",
    maxTokens: MAX_TOKENS,
    seed: 42,
  },
  {
    name: "GPT-5 Nano",
    provider: "openai",
    modelId: "gpt-5-nano",
    maxTokens: MAX_TOKENS,
    seed: 42,
  },
  {
    name: "Claude Opus 4.1",
    provider: "anthropic",
    modelId: "claude-opus-4-1",
    maxTokens: MAX_TOKENS,
    temperature: 0.0,
  },
  {
    name: "Claude Sonnet 4.5",
    provider: "anthropic",
    modelId: "claude-sonnet-4-5",
    maxTokens: MAX_TOKENS,
    temperature: 0.0,
  },
  {
    name: "Claude Haiku 4.5",
    provider: "anthropic",
    modelId: "claude-haiku-4-5",
    maxTokens: MAX_TOKENS,
    temperature: 0.0,
  },
  {
    name: "Gemini 2.5 Pro",
    provider: "google",
    modelId: "gemini-2.5-pro",
    maxTokens: MAX_TOKENS,
    temperature: 0.0,
  },
  {
    name: "Gemini 2.5 Flash",
    provider: "google",
    modelId: "gemini-2.5-flash",
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
