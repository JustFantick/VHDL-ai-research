# VHDL AI Analysis Research Project - Complete Overview

## Project Purpose

This is a research project evaluating and comparing the performance of 9 different AI models across three major providers (OpenAI, Anthropic, Google) in analyzing VHDL hardware description language code. The goal is to determine how accurately these AI models can identify various types of issues in VHDL code including syntax errors, logic errors, style violations, and efficiency problems.

## Research Methodology

### Test Suite Structure

The research uses a curated test suite of 25 VHDL code samples located in the `test-files/` folder. Each test consists of:

1. **VHDL Source File** (`.vhd`): VHDL code that may contain specific issues or be completely correct
2. **Ground Truth File** (`.json`): Metadata specifying exactly what issues should be found, including:
   - Issue ID and description
   - Exact line numbers where issues occur
   - Category (syntax/logic/style/efficiency/mixed)
   - Severity level (critical/high/medium/low)
   - Reasoning for why it's an issue
   - Suggestions for fixing

### Test Categories

**1. Golden Reference Files (Files 1-5)**

- Naming pattern: `{number}_{name}_golden.vhd`
- Purpose: Test for false positives (AI incorrectly reporting issues where none exist)
- Requirement: Must be completely correct, zero issues
- Ground truth: `"issues": []` and `"category": "golden"`

**2. Syntax Error Tests (Files 6-8)**

- Difficulty: Easy to Hard
- Examples: Missing semicolons, parentheses, incorrect syntax
- Severity: Critical (code won't compile)

**3. Style Issue Tests (Files 9-10)**

- Difficulty: Medium
- Examples: Inconsistent capitalization within same file, missing spaces in lists, old-style constructs
- Severity: Medium/Low
- Note: Consistent uppercase or lowercase is valid - only inconsistencies are issues

**4. Logic Error Tests (Files 11-16)**

- Difficulty: Easy to Hard
- Examples: Incorrect logic, missing assignments, wrong signal connections, naming vs behavior mismatches
- Severity: High (code compiles but behaves incorrectly)

**5. Efficiency Issue Tests (Files 17-18)**

- Difficulty: Medium to Hard
- Examples: Processes for simple combinational logic, inefficient loops, unnecessary operations
- Severity: Medium/High (code works but uses excessive resources)

**6. Mixed Issue Tests (Files 19-27)**

- Difficulty: Medium to Hard
- Combinations of syntax, logic, style, and efficiency issues
- Tests comprehensive analysis capabilities

### Issue Detection Principles

**MUST BE UNAMBIGUOUS:**

- Every issue must be objectively verifiable
- Syntax errors: Would be caught by compiler/parser
- Logic errors: Verifiable through code analysis or simulation
- Style issues: Follow established VHDL style guidelines
- Efficiency issues: Objectively measurable or comparable

**REMOVED FROM SCOPE (Not Issues):**

- Consistent uppercase keywords (ENTITY, PORT, END) - valid VHDL style
- Consistent uppercase port/signal names - IEEE convention
- Spacing variations that are both valid
- Subjective or opinion-based "issues"

## AI Models Being Evaluated

The research evaluates 9 AI models across 3 providers:

### OpenAI Models

**1. GPT-5**

- Model ID: `gpt-5`
- Configuration: `maxTokens: 16000`, `seed: 42`
- Pricing: $1.25/1M input tokens, $10.00/1M output tokens
- Note: Does NOT support temperature, top_p parameters (uses reasoning_effort and verbosity instead)

**2. GPT-5 Mini**

- Model ID: `gpt-5-mini`
- Configuration: `maxTokens: 16000`, `seed: 42`
- Pricing: $0.25/1M input tokens, $2.00/1M output tokens

**3. GPT-5 Nano**

- Model ID: `gpt-5-nano`
- Configuration: `maxTokens: 16000`, `seed: 42`
- Pricing: $0.05/1M input tokens, $0.40/1M output tokens

### Anthropic Models

**4. Claude Opus 4.1**

- Model ID: `claude-opus-4-1`
- Configuration: `maxTokens: 16000`, `temperature: 0.0`
- Pricing: $15.00/1M input tokens, $75.00/1M output tokens

**5. Claude Sonnet 4.5**

- Model ID: `claude-sonnet-4-5`
- Configuration: `maxTokens: 16000`, `temperature: 0.0`
- Pricing: $3.00/1M input tokens, $15.00/1M output tokens
- Note: Also used as the arbiter model for semantic evaluation

**6. Claude Haiku 4.5**

- Model ID: `claude-haiku-4-5`
- Configuration: `maxTokens: 16000`, `temperature: 0.0`
- Pricing: $1.00/1M input tokens, $5.00/1M output tokens

### Google Models

**7. Gemini 2.5 Pro**

- Model ID: `gemini-2.5-pro`
- Configuration: `maxTokens: 16000`, `temperature: 0.0`
- Pricing: $1.25/1M input tokens, $10.00/1M output tokens

**8. Gemini 2.5 Flash**

- Model ID: `gemini-2.5-flash`
- Configuration: `maxTokens: 16000`, `temperature: 0.0`
- Pricing: $0.30/1M input tokens, $2.50/1M output tokens

**9. Gemini 2.5 Flash Lite**

- Model ID: `gemini-2.5-flash-lite`
- Configuration: `maxTokens: 16000`, `temperature: 0.0`
- Pricing: $0.10/1M input tokens, $0.40/1M output tokens

### Parameter Standardization

**Temperature/Randomness:**

- Anthropic & Google models: `temperature: 0.0` (deterministic)
- OpenAI GPT-5 models: cannot set temperature directly, so used `seed: 42` for reproducibility and default values of "reasoning_effort" and "verbosity"

**Key Limitation:**

- GPT-5 family uses fundamentally different parameter model (reasoning_effort, verbosity)
- Cannot directly match temperature/top_p values of other providers
- This limitation is documented in research results

## Evaluation Approach: AI Arbiter (Semantic Matching)

**Location:** `src/arbiter-evaluator.ts`

**Why it's needed:**

AI models might identify the same issue but describe it differently or report slightly different line numbers. Simple line number + category matching would miss these semantic similarities.

The arbiter solves this by understanding semantic similarity rather than requiring exact text or line matches.

**How it works:**

1. **Single-pass evaluation per test file**: One AI call evaluates all models' responses for a given test file
2. **Arbiter model**: Uses Claude Sonnet 4.5 as the judge/arbiter
3. **Input to arbiter**:
   - Ground truth issues from `test-files/*.json`
   - All 9 AI model responses for that test file from `results/responses/*.json`
4. **Arbiter analyzes**: Semantic similarity between ground truth and each model's findings
5. **Arbiter returns structured JSON**:

```json
{
  "modelResults": [
    {
      "model": "Model Name",
      "matches": [
        {
          "groundTruthId": "issue_id",
          "aiIssueIndex": 0,
          "matchType": "exact" | "semantic" | "partial",
          "confidence": 0.95,
          "reasoning": "Brief explanation"
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
```

6. **Metrics calculation**:
   - True Positives (TP): Number of matches found by arbiter
   - False Positives (FP): Issues AI reported that don't exist
   - False Negatives (FN): Real issues AI missed
   - Precision: TP / (TP + FP) × 100
   - Recall: TP / (TP + FN) × 100
   - F1 Score: 2 × (Precision × Recall) / (Precision + Recall)
   - Arbiter Confidence: Average confidence from all matches

**Arbiter evaluation philosophy:**

- Understands semantic similarity (same issue, different wording)
- Line numbers don't need exact match (arbiter uses context)
- Category should generally match, but arbiter can override for strong semantic match
- Focus on accuracy and understanding over strict pattern matching

**Processing flow:**

```
For each test file:
1. Read ground truth (test-files/*.json)
2. Find all AI response files matching that test (results/responses/*.json)
3. Call arbiter with ground truth + all model responses
4. Parse arbiter's JSON response
5. Calculate TP/FP/FN for each model
6. Write statistics to CSV
```

**Output:** `results/normalyzed/arbiter_evaluation.csv`

**CSV columns:**

- Test File, Model, Category, Difficulty
- Ground Truth Issues, AI Found Issues
- True Positives, False Positives, False Negatives
- Precision (%), Recall (%), F1 Score (%)
- Arbiter Confidence (%), Processing Time (ms), Success

## Running the Research

**Main evaluation script:**

```bash
npm start
```

This runs the primary evaluation where all 9 AI models analyze each VHDL test file and generate responses saved to `results/responses/`.

**Arbiter evaluation script:**

```bash
npm run arbiter
```

This runs the AI arbiter to semantically compare all model responses against ground truth and generate evaluation metrics in `results/normalyzed/arbiter_evaluation.csv`.
