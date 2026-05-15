// ============================================================
// OpenClaw – Model Router
// Routes AI tasks to the right model for accuracy + cost
// Based on: ai/agents/openclaw/responsibilities.md §Model Routing
// ============================================================

import type { ProviderName } from '../runtime/types.js';

export type TaskType =
  | 'governance'      // Governance validation, architecture review → Pro
  | 'risk'            // Risk analysis → Pro
  | 'review'          // Code review, compliance check → Pro
  | 'planning'        // Execution plan generation → Flash
  | 'prompt'          // Builder prompt generation → Flash
  | 'impact'          // Impact analysis → Flash
  | 'sync'            // Memory sync, log formatting → Flash Lite
  | 'formatting'      // Output formatting → Flash Lite
  | 'log';            // Log writing → Flash Lite

// Model assignments per task type
export const MODEL_ROUTING: Record<TaskType, {
  gemini: string;
  openai: string;
  openrouter: string;
  rationale: string;
}> = {
  // 🔴 High-stakes tasks → Gemini 3.1 Pro Preview (Governance / Architecture / Risk)
  governance: {
    gemini: 'gemini-3.1-pro-preview',
    openai: 'gpt-4o',
    openrouter: 'google/gemini-2.5-pro-preview-05-06',
    rationale: 'Governance decisions require highest accuracy. No cost shortcuts.',
  },
  risk: {
    gemini: 'gemini-3.1-pro-preview',
    openai: 'gpt-4o',
    openrouter: 'anthropic/claude-3.5-sonnet',
    rationale: 'Risk misclassification → dangerous builds. Use best model.',
  },
  review: {
    gemini: 'gemini-3.1-pro-preview',
    openai: 'gpt-4o',
    openrouter: 'openai/gpt-4o',
    rationale: 'Code review needs precise pattern detection. Best model.',
  },

  // 🟡 Planning tasks → Gemini 3 Flash Preview (Planning / Execution / Prompt Gen)
  planning: {
    gemini: 'gemini-3-flash-preview',
    openai: 'gpt-4o-mini',
    openrouter: 'google/gemini-2.5-flash-preview',
    rationale: 'Execution planning benefits from speed over cost.',
  },
  impact: {
    gemini: 'gemini-3-flash-preview',
    openai: 'gpt-4o-mini',
    openrouter: 'google/gemini-2.5-flash-preview',
    rationale: 'Impact analysis is structured, Flash handles well.',
  },
  prompt: {
    gemini: 'gemini-3-flash-preview',
    openai: 'gpt-4o-mini',
    openrouter: 'google/gemini-2.5-flash-preview',
    rationale: 'Prompt generation is templated, Flash is sufficient.',
  },

  // 🟢 Lightweight tasks → Gemini 3.1 Flash Lite (Logs / Memory Sync / Formatting)
  sync: {
    gemini: 'gemini-3.1-flash-lite',
    openai: 'gpt-4o-mini',
    openrouter: 'meta-llama/llama-3.3-70b-instruct',
    rationale: 'Memory sync is mechanical pattern matching. Cheapest model.',
  },
  formatting: {
    gemini: 'gemini-3.1-flash-lite',
    openai: 'gpt-4o-mini',
    openrouter: 'meta-llama/llama-3.3-70b-instruct',
    rationale: 'Output formatting is trivial. Cheapest model.',
  },
  log: {
    gemini: 'gemini-3.1-flash-lite',
    openai: 'gpt-4o-mini',
    openrouter: 'meta-llama/llama-3.3-70b-instruct',
    rationale: 'Log writing is structured data. Cheapest model.',
  },
};

export function getModelForTask(
  taskType: TaskType,
  provider: ProviderName
): string {
  const routing = MODEL_ROUTING[taskType];
  return routing[provider];
}

/** Get step-to-task-type mapping for the 11-step pipeline */
export const PIPELINE_STEP_MODELS: Record<number, TaskType> = {
  1: 'sync',        // READ MEMORY (local, no AI)
  2: 'sync',        // BUILD CONTEXT GRAPH (local)
  3: 'impact',      // IMPACT ANALYSIS
  4: 'risk',        // RISK ANALYSIS
  5: 'governance',  // GOVERNANCE VALIDATION
  6: 'planning',    // EXECUTION PLAN
  7: 'prompt',      // PROMPT GENERATION
  8: 'sync',        // CODE GENERATION (delegated, no AI here)
  9: 'review',      // REVIEW OUTPUT
  10: 'sync',       // MEMORY SYNC
  11: 'log',        // GOVERNANCE LOGGING
};
