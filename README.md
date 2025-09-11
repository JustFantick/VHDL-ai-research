# VHDL AI Analysis Research Project

This project tests how well different AI models can analyze VHDL code for errors and efficiency problems.

## Features

- Tests multiple AI models via API (OpenAI, Anthropic, Google)
- Analyzes VHDL code for syntax errors, logic errors, and efficiency issues
- Saves detailed results for comparison
- Configurable test parameters

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

- `OPENAI_API_KEY` - for GPT-4o Mini
- `ANTHROPIC_API_KEY` - for Claude Sonnet 4
- `GOOGLE_API_KEY` - for Gemini 2.0 Flash

3. Build the project:

```bash
npm run build
```

## Usage

Run the analysis:

```bash
npm start
```

Or run in development mode:

```bash
npm run dev
```

## Project Structure

```
├── src/
│   ├── config/
│   │   └── models.ts          # AI model configurations
│   ├── services/
│   │   ├── ai-providers.ts    # AI API integration
│   │   └── test-runner.ts     # Test execution logic
│   ├── types/
│   │   └── index.ts           # TypeScript type definitions
│   └── index.ts               # Main entry point
├── test-files/                # VHDL test cases
├── results/                   # Generated analysis results
│   ├── responses/             # Individual AI responses
│   └── reports/               # Summary reports
└── package.json
```

## Test Files

The project includes sample VHDL files with different types of issues:

- `syntax_error.vhd` - Syntax errors
- `logic_error.vhd` - Logic problems
- `inefficient_code.vhd` - Performance issues
- `style_issues.vhd` - Code style problems
- `complex_design.vhd` - Complex mixed issues

## Results

Results are saved in JSON format with:

- AI model responses
- Processing times
- Success/failure status
- Analysis confidence scores
- Detailed issue reports

## Configuration

Modify `src/config/models.ts` to add/remove AI models or adjust parameters.
