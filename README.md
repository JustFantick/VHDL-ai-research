# VHDL AI Analysis Research Project

Research project evaluating and comparing 9 AI models (OpenAI GPT-5 family, Anthropic Claude 4 family, Google Gemini 2.5 family) in analyzing VHDL hardware description language code.

## Features

- Tests 9 AI models via API (OpenAI, Anthropic, Google)
- Analyzes VHDL code for syntax errors, logic errors, style issues, and efficiency problems
- 25 curated test cases with ground truth annotations
- AI arbiter for semantic evaluation of results
- Detailed metrics: Precision, Recall, F1 Score
- Saves results for comparison and analysis

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment file and add your API keys:

```bash
cp env.example .env
```

Edit `.env` and add your API keys:

- `OPENAI_API_KEY` - for GPT-5, GPT-5 Mini, GPT-5 Nano
- `ANTHROPIC_API_KEY` - for Claude Opus 4.1, Claude Sonnet 4.5, Claude Haiku 4.5
- `GOOGLE_API_KEY` - for Gemini 2.5 Pro, Gemini 2.5 Flash, Gemini 2.5 Flash Lite

3. Build the project:

```bash
npm run build
```

## Usage

Run the main analysis (all 9 models analyze all test files):

```bash
npm start
```

Run the AI arbiter evaluation (semantic comparison against ground truth):

```bash
npm run arbiter
```

## Project Structure

```
├── src/
│   ├── config/
│   │   └── models.ts          # AI model configurations (9 models)
│   ├── services/
│   │   ├── ai-providers.ts    # AI API integration
│   │   └── test-runner.ts     # Test execution logic
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   ├── index.ts               # Main entry point
│   └── arbiter-evaluator.ts   # AI arbiter semantic evaluation
├── test-files/                # 25 VHDL test cases with ground truth
├── results/
│   ├── responses/             # Individual AI model responses (JSON)
│   ├── normalyzed/            # Arbiter evaluation results (CSV)
│   └── reports/               # Summary reports
└── package.json
```
