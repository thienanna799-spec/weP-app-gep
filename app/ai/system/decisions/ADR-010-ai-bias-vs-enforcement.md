# ADR 010: AI Context Bias vs Physical Enforcement Engine

## Context
When building the "Self-Documenting AI Code OS", a critical architectural distinction must be made regarding how AI agents are governed and restricted from making destructive changes. Initially, there was a misconception that injecting `.cursorrules` or `CLAUDE.md` into the AI's environment acts as a "kernel-level injection" or a hard enforcement rule that the AI cannot physically violate.

## Analysis
Large Language Models (LLMs) are probabilistic engines. They do not possess a true "kernel" or physical memory that can be hard-locked.
1. **Instruction Bias (The `.cursorrules` approach):**
   When an IDE (Cursor, Cline, Windsurf) bootstraps a session, it reads `.cursorrules` and prepends it into the System Prompt. This creates an **Attention Mechanism Bias**. The LLM assigns higher mathematical weight to these tokens, guiding its output to comply with the rules. However, if the context window is too long or the user prompt directly contradicts the rules, the LLM can still "hallucinate" or violate the constraints. It is a psychological shield, not a physical one.
2. **Rule Enforcement (The `9_guard` approach):**
   To achieve true system-level governance, an external interceptor is required. This is the **Execution Guard (Layer 9)**. Before any AI-generated code is committed to disk or merged, the Guard must intercept the AST output, compare it against the Graph (Memgraph truth), and physically reject/block the write operation if an architectural violation (e.g., Service calling Controller) is detected.

## Decision
1. We will maintain `.cursorrules` at the repository root to serve strictly as a **Context-Based Instruction Bias System** (The Governance Layer). It acts to steer the AI's probabilistic generation towards updating documentation and adhering to the Consistency Triangle (Code ↔ Graph ↔ Markdown).
2. We explicitly recognize that `.cursorrules` is NOT an enforcement engine.
3. For hard governance, we will continue developing **Layer 9 (Execution Guard)** in the `graph-engine` pipeline. This Guard acts as the true Enforcement Engine, validating Graph synchronization and blocking inconsistent code at runtime.

## Consequences
- AI Agents will proactively log their changes and update `.md` files 95% of the time due to Attention Bias.
- The remaining 5% of hallucinated or destructive changes will be caught and physically blocked by the Layer 9 Execution Guard.
- This creates a two-tiered security model: Soft Guidance (Prompt Bias) + Hard Enforcement (AST Validation).
