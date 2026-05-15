import { callGemini } from './llm.js';
import { ExecutionTask } from '../kernel/state.js';
import { logger } from '../runtime/logger.js';

const PLANNER_PROMPT = `You are the PLANNER AGENT for the OpenClaw v4 System.
Your ONLY job is to take a user request and break it down into a structured execution plan.
You DO NOT write code. You DO NOT execute commands.
You MUST output a JSON object matching the ExecutionTask spec.

CRITICAL RULES:
1. If the user is just asking a question or chatting, DO NOT output JSON. Just reply with helpful text like a Senior Engineer.
2. If the user is asking to build or modify a feature, you MUST output a JSON object matching the ExecutionTask spec.
3. "filesToModify": List ALL files that need to be created or modified to fulfill the requirement. Provide path relative to project root.
4. "domain": Must be one of the registered domains.
5. "riskLevel": Must be LOW, MEDIUM, HIGH, or CRITICAL.
6. "action": A concise description of the task.
7. "steps": Step by step English description of what the Coder Agent should do.
8. "estimatedLOC": Integer estimate of total lines of code to write.

CONTEXT (Schema):
{SCHEMA_CONTEXT}

You must return ONLY the raw JSON object. No markdown blocks, no \`\`\`json.`;

export class PlannerAgent {
  async plan(userMessage: string, schemaContext: string, apiKey: string): Promise<Partial<ExecutionTask> | string> {
    const prompt = PLANNER_PROMPT.replace('{SCHEMA_CONTEXT}', schemaContext);
    
    logger.info(`[PlannerAgent] Analyzing request...`);
    const response = await callGemini(prompt, userMessage, apiKey);
    
    // Check if it looks like JSON
    if (response.includes('{') && response.includes('}')) {
      const cleanJson = response.replace(/```json\s*[\s\S]*?\s*```/g, (match) => {
        return match.replace(/```json\s*/, '').replace(/\s*```/, '');
      }).trim();

      try {
        // Try parsing as task
        const plan = JSON.parse(cleanJson);
        if (plan.action && plan.domain) {
          return plan;
        }
      } catch (e) {
        // Ignore parse error, treat as chat
      }
    }
    
    // Fallback to plain text chat
    return response;
  }
}

export const plannerAgent = new PlannerAgent();
