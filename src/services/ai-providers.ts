import OpenAI from "openai";
import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import {
  ModelConfig,
  AnalysisResult,
  StructuredIssue,
  TokenUsage,
} from "../types";

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

  async analyzeVHDLWithUsage(
    config: ModelConfig,
    vhdlCode: string
  ): Promise<{ analysis: AnalysisResult; usage: TokenUsage }> {
    const prompt = this.createVHDLAnalysisPrompt(vhdlCode);

    const { content, usage } = await this.sendPromptWithUsage(config, prompt);
    const analysis = this.parseAIResponse(content);

    return { analysis, usage };
  }

  async sendPrompt(config: ModelConfig, prompt: string): Promise<string> {
    switch (config.provider) {
      case "openai":
        return this.sendPromptOpenAI(config, prompt);
      case "anthropic":
        return this.sendPromptAnthropic(config, prompt);
      case "google":
        return this.sendPromptGoogle(config, prompt);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  async sendPromptWithUsage(
    config: ModelConfig,
    prompt: string
  ): Promise<{ content: string; usage: TokenUsage }> {
    switch (config.provider) {
      case "openai":
        return this.sendPromptOpenAIWithUsage(config, prompt);
      case "anthropic":
        return this.sendPromptAnthropicWithUsage(config, prompt);
      case "google":
        return this.sendPromptGoogleWithUsage(config, prompt);
      default:
        throw new Error(`Unsupported provider: ${config.provider}`);
    }
  }

  private createVHDLAnalysisPrompt(vhdlCode: string): string {
    return `Analyze the following VHDL code for errors and issues. Report all issues you can identify with appropriate confidence levels. Critical and high severity issues should be reported if 90%+ confident. Medium and low severity issues should be reported if 70%+ confident.

Provide your analysis in JSON format with the following EXACT structure:

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
- "style": Code style violations following VHDL conventions. MUST check for: (1) Inconsistent capitalization (library names like "IEEE" vs "ieee", signal names like "CLK" vs "clk", package names like "STD_LOGIC_1164" vs "std_logic_1164"), (2) Missing whitespaces (no spaces around assignment operators like "<=", no spaces in sensitivity lists like "process(x0,x1)" vs "process(x0, x1)"), (3) Old-style constructs (CLK'event instead of rising_edge/falling_edge), (4) Naming convention violations (intentional uppercase acronyms such as "SI"/"SO" alongside lowercase names are acceptable and should not be flagged)
- "efficiency": Suboptimal implementations that waste resources (redundant logic, unnecessary processes for combinational logic, inefficient algorithms)

EFFICIENCY - CONCRETE PATTERNS TO CHECK:
1. Process with only combinational assignments → suggest concurrent assignment or with-select statement
   Example: process(sel, a, b) with only if-elsif-else assigning output should use "output <= a when sel='0' else b;"
2. For loop with if checking loop variable = constant → direct indexed access
   Example: "for i in 0 to counter loop if i = counter then array(i) <= value; end if; end loop;" should be "array(counter) <= value;"
3. Else clause after exhaustive if-elsif covering all bit combinations
   Example: 2-bit select has 4 cases (00,01,10,11); if all covered by if-elsif, else is unreachable redundant code
4. While loop with manual counter for fixed iterations → use for loop
   Example: "i := 0; while i < 8 loop ... i := i + 1; end loop;" should be "for i in 0 to 7 loop ... end loop;"
   For loops are more synthesizer-friendly and eliminate manual counter management
5. Loop to initialize/reset array → use aggregate assignment
   Example: "for i in array'range loop array(i) := 0; end loop;" should be "array := (others => 0);"
6. Multiple intermediate signals for simple expressions that could be computed directly
7. Unnecessary type conversions in a chain

LOGIC - SEMANTIC REASONING (check naming vs behavior):
1. Signal names ending in "_up", "_inc", "counter_up" suggest increment → should use + operator
2. Signal names ending in "_down", "_dec" suggest decrement → should use - operator
3. Generic name "counter" without qualifier typically means up-counter → should increment
4. Entity/signal name contradicts actual operation (e.g., "comparator" but performs arithmetic)

SEVERITY GUIDELINES (use these exact mappings):
- "critical": Code will NOT compile or will cause immediate simulation errors. Examples: missing semicolons, undeclared identifiers, syntax errors that prevent parsing
- "high": Code compiles but has functional errors causing incorrect behavior. Examples: wrong logic expressions, missing assignments to output ports, duplicate assignments to same signal, unassigned outputs
- "medium": Code works correctly but has style violations or moderate efficiency issues. Examples: old-style constructs (CLK'event), redundant operations, style violations (missing spaces around operators, missing spaces in lists, inconsistent capitalization of library/package/signal names)
- "low": Minor style issues with minimal impact. Examples: spacing inconsistencies, minor naming variations

IMPORTANT: Multiple assignments to the same signal = "high" (not critical, code may compile but behave incorrectly). Unassigned output ports = "high" (not critical, code compiles but output is undefined).

LINE NUMBER ACCURACY REQUIREMENTS:
1. Line numbers are 1-indexed (first line of VHDL code is line 1)
2. Count ALL lines including blank lines in the code block
3. For multi-line issues, use the exact start and end line numbers
4. For single-line issues, start and end should be the same number
5. Before reporting, verify line numbers by counting from the first line of the VHDL code block
6. Double-check line numbers match the actual code structure

ISSUE DETECTION CHECKLIST (verify these systematically):
1. Output ports: Check every "out" port has at least one assignment statement
2. Signal assignments: Check for duplicate assignments to the same signal in the same scope
3. Syntax: Check for missing semicolons, parentheses, proper statement termination
4. Declarations: Verify all signals/variables used are declared
5. Style: Check capitalization, whitespaces, and old-style constructs (see STYLE ISSUE DETECTION section below)
6. Logic: Verify assignments make logical sense (no obvious contradictions)

ISSUE GROUPING RULES (IMPORTANT - applies to ALL categories):
- ALWAYS group similar issues of the same type together into a single issue entry with multiple line references
- This rule applies to ALL categories: syntax, logic, style, and efficiency
- Examples of issues that should be grouped (across all categories):
  * Syntax: Multiple missing semicolons → one issue with all affected lines
  * Logic: Multiple unassigned output ports → one issue with all affected lines
  * Logic: Multiple duplicate assignments to different signals → separate issues (different signals), but if same signal has multiple duplicate assignments → one issue
  * Style: Multiple missing spaces of the same type (e.g., all missing spaces before "<=" operators) → one issue with all affected lines
  * Style: Multiple capitalization inconsistencies of the same type (e.g., all uppercase library names) → one issue with all affected lines
  * Efficiency: Multiple redundant operations of the same type → one issue with all affected lines
- Use the "lines" array to include all line numbers where the same issue occurs
- For consecutive lines with the same issue, use a single range object: {"start": 41, "end": 45} instead of multiple individual entries
- For non-consecutive lines, use separate entries: [{"start": 10, "end": 10}, {"start": 25, "end": 25}]
- Only create separate issues if they are fundamentally different problems (e.g., missing spaces vs capitalization vs old-style constructs, or syntax errors vs logic errors)
- Examples:
  * If lines 41, 42, 43, 44, 45 (consecutive) all have "missing space before <=", report ONE issue with lines: [{"start": 41, "end": 45}]
  * If lines 10, 15, 20 (non-consecutive) all have "missing space before <=", report ONE issue with lines: [{"start": 10, "end": 10}, {"start": 15, "end": 15}, {"start": 20, "end": 20}]
  * If lines 5-8 and 12-15 (two consecutive ranges) have the same issue, report ONE issue with lines: [{"start": 5, "end": 8}, {"start": 12, "end": 15}]

ISSUE REPORTING GUIDELINES:
1. Report clear compilation errors, functional bugs, and efficiency issues with appropriate confidence
2. For semantic logic issues (e.g., counter_up using - instead of +), explain the naming-behavior mismatch
3. Report efficiency issues if they have measurable synthesis/resource impact (redundant logic, unnecessary processes)
4. For style issues, only report inconsistencies within the same file or old-style constructs
5. Do NOT report issues that require simulation to verify (timing, race conditions without clear evidence)
6. Do NOT report valid style choices (uppercase keywords, uppercase port names, spacing variations if consistent)
7. If code appears correct with no identifiable issues, return empty array: "issuesFound": []

STYLE ISSUE DETECTION (MANDATORY CHECKS - verify ALL of these):
1. CAPITALIZATION CONSISTENCY (ONLY report if INCONSISTENT within same file):
   - Library names: If code mixes "library IEEE;" and "library ieee;" in same file → report inconsistency
   - Package names: If code mixes "IEEE.STD_LOGIC_1164" and "ieee.std_logic_1164" in same file → report inconsistency
   - Signal/port names: If code mixes "CLK" and "clk" for similar signals in same file → report inconsistency
   - DO NOT report if file consistently uses one style (all uppercase keywords OR all lowercase is both valid)
   - Report as "style" category, "medium" severity ONLY if mixed/inconsistent within same file

2. WHITESPACE REQUIREMENTS:
   - Sensitivity lists: Check for missing spaces after commas (e.g., "process(a,b,c)" should be "process(a, b, c)")
   - Report as "style" category, "medium" severity if whitespaces are missing in comma-separated lists

3. OLD-STYLE CONSTRUCTS:
   - Clock edge detection: Check for "CLK'event and CLK='0'" or "CLK'event and CLK='1'" instead of "falling_edge(CLK)" or "rising_edge(CLK)"
   - Report as "style" category, "medium" severity for old-style clock edge detection

STYLE - DO NOT REPORT THESE (both are valid VHDL styles):
- Consistent uppercase keywords (ENTITY, PORT, END) - this is a valid style choice
- Consistent uppercase port/signal names - this is IEEE convention, perfectly acceptable
- Space before "<=" operator - both "signal<=value" and "signal <= value" are acceptable
- Spaces around logical operators (and, or, not) - spacing variations are acceptable
- Consistent all-uppercase or all-lowercase library names (if not mixed in same file)

AMBIGUOUS CASES (DO NOT REPORT):
- Uppercase acronyms intentionally preserved for ports or signals (e.g., "SI", "SO") mixed with lowercase names
- Spacing around colons in port declarations (e.g., "a:in" vs "a : in")

STRUCTURED VALIDATION (before finalizing response, verify):
1. Each issue category matches the issue type exactly (syntax/logic/style/efficiency)
2. Line numbers are accurate and correspond to actual code lines
3. Severity level matches the impact (critical = won't compile, high = functional error, medium = style/efficiency, low = minor style)
4. Similar issues are grouped together (e.g., all missing spaces in sensitivity lists in one issue with multiple line references)
5. Each reported issue can be verified by reading the code at the specified line numbers
6. For efficiency issues: Have you checked for redundant else, unnecessary process, inefficient loops, redundant logic?
7. For logic issues: Have you checked naming vs behavior (counter_up should increment), semantic correctness?
8. For style issues: Have you checked ONLY for inconsistencies within same file and old-style constructs?
9. If no clear issues exist, issuesFound array is empty

BALANCED REPORTING GUIDELINES:
- Report all identifiable issues with appropriate confidence levels
- Critical/high severity: Report if 90%+ confident (compilation/functional errors)
- Medium/low severity: Report if 70%+ confident (efficiency/style issues)
- Use the confidence field to indicate your certainty about the analysis
- For semantic issues (naming vs behavior), explain reasoning clearly
- For efficiency issues, explain why the alternative is better (resource usage, synthesis impact)
- Avoid reporting style preferences that are both valid in VHDL standards

For each issue:
- Use precise, verified line numbers (count carefully from line 1)
- Choose category that matches the issue type exactly
- Assign severity using the exact guidelines above
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
      seed: config.seed,
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

    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
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
      } catch (error: any) {
        lastError = error;

        if (error.status === 529 || error.status === 503) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(
            `  ⚠️  Anthropic overloaded, retrying in ${delay}ms (attempt ${
              attempt + 1
            }/${maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError || new Error("Failed after retries");
  }

  private async analyzeWithGoogle(
    config: ModelConfig,
    prompt: string
  ): Promise<AnalysisResult> {
    if (!this.google) {
      throw new Error("Google API key not configured");
    }

    const model = this.google.getGenerativeModel({ model: config.modelId });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      },
    });
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

      let jsonString = cleaned.substring(firstBrace, jsonEnd);

      try {
        var parsed = JSON.parse(jsonString);
      } catch (parseError) {
        jsonString = jsonString
          .replace(/\\([^"\\\/bfnrtu])/g, "\\\\$1")
          .replace(/[\x00-\x1F\x7F]/g, (char) => {
            const hex = char.charCodeAt(0).toString(16).padStart(2, "0");
            return `\\u00${hex}`;
          });
        var parsed = JSON.parse(jsonString);
      }

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

  private async sendPromptOpenAI(
    config: ModelConfig,
    prompt: string
  ): Promise<string> {
    if (!this.openai) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await this.openai.chat.completions.create({
      model: config.modelId,
      messages: [{ role: "user", content: prompt }],
      seed: config.seed,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    return content;
  }

  private async sendPromptAnthropic(
    config: ModelConfig,
    prompt: string
  ): Promise<string> {
    if (!this.anthropic) {
      throw new Error("Anthropic API key not configured");
    }

    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
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

        return content.text;
      } catch (error: any) {
        lastError = error;

        if (error.status === 529 || error.status === 503) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(
            `  ⚠️  Anthropic overloaded, retrying in ${delay}ms (attempt ${
              attempt + 1
            }/${maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError || new Error("Failed after retries");
  }

  private async sendPromptGoogle(
    config: ModelConfig,
    prompt: string
  ): Promise<string> {
    if (!this.google) {
      throw new Error("Google API key not configured");
    }

    const model = this.google.getGenerativeModel({ model: config.modelId });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      },
    });
    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error("No response content from Google");
    }

    return content;
  }

  private async sendPromptOpenAIWithUsage(
    config: ModelConfig,
    prompt: string
  ): Promise<{ content: string; usage: TokenUsage }> {
    if (!this.openai) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await this.openai.chat.completions.create({
      model: config.modelId,
      messages: [{ role: "user", content: prompt }],
      seed: config.seed,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No response content from OpenAI");
    }

    const usage: TokenUsage = {
      inputTokens: response.usage?.prompt_tokens || 0,
      outputTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    };

    return { content, usage };
  }

  private async sendPromptAnthropicWithUsage(
    config: ModelConfig,
    prompt: string
  ): Promise<{ content: string; usage: TokenUsage }> {
    if (!this.anthropic) {
      throw new Error("Anthropic API key not configured");
    }

    const maxRetries = 3;
    let lastError: Error | undefined;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
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

        const usage: TokenUsage = {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens,
          totalTokens:
            response.usage.input_tokens + response.usage.output_tokens,
        };

        return { content: content.text, usage };
      } catch (error: any) {
        lastError = error;

        if (error.status === 529 || error.status === 503) {
          const delay = Math.pow(2, attempt) * 1000;
          console.log(
            `  ⚠️  Anthropic overloaded, retrying in ${delay}ms (attempt ${
              attempt + 1
            }/${maxRetries})...`
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }

        throw error;
      }
    }

    throw lastError || new Error("Failed after retries");
  }

  private async sendPromptGoogleWithUsage(
    config: ModelConfig,
    prompt: string
  ): Promise<{ content: string; usage: TokenUsage }> {
    if (!this.google) {
      throw new Error("Google API key not configured");
    }

    const model = this.google.getGenerativeModel({ model: config.modelId });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: config.temperature,
        maxOutputTokens: config.maxTokens,
      },
    });
    const response = await result.response;
    const content = response.text();

    if (!content) {
      throw new Error("No response content from Google");
    }

    const usageMetadata = response.usageMetadata;
    const usage: TokenUsage = {
      inputTokens: usageMetadata?.promptTokenCount || 0,
      outputTokens: usageMetadata?.candidatesTokenCount || 0,
      totalTokens: usageMetadata?.totalTokenCount || 0,
    };

    return { content, usage };
  }
}
