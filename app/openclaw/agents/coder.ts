import { callGemini } from './llm.js';
import { ExecutionTask } from '../kernel/state.js';
import { logger } from '../runtime/logger.js';
import { promises as fs } from 'fs';
import { join } from 'path';

const CODER_PROMPT = `You are the CODER AGENT for the OpenClaw v4 System.
Your job is to write high-quality, production-ready code based on the Execution Task.

TASK:
Action: {ACTION}
Domain: {DOMAIN}
Steps:
{STEPS}

PREVIOUS REVIEWER FEEDBACK (If any):
{FEEDBACK}

CURRENT FILE CONTENTS:
{FILE_CONTENTS}

CRITICAL RULES:
1. You must output a JSON object mapping file paths to their NEW complete source code.
2. Ensure you fix ALL issues raised by the Reviewer Agent if there is feedback.
3. Follow the GEP ERP Tech Stack rules (Prisma transactions, try/catch, etc).
4. Output format MUST be strictly:
{
  "files": [
    {
      "path": "server/src/services/finance.service.ts",
      "content": "import { ... }\\n..."
    }
  ]
}

Only return the raw JSON object. No markdown blocks.`;

export class CoderAgent {
  /**
   * Executes the coding task. 
   * Reads files from sandbox, sends to LLM, and writes new content back to sandbox.
   */
  async execute(sandboxPath: string, task: ExecutionTask, feedback: string = '', apiKey: string): Promise<void> {
    logger.info(`[CoderAgent] Generating code for task ${task.id}...`);

    const filesToModify = task.spec.filesToModify || [];
    const filesToCreate = task.spec.filesToCreate || [];
    const allFiles = [...new Set([...filesToModify, ...filesToCreate])];

    // Read current contents
    let fileContentsDump = '';
    for (const file of allFiles) {
      const fullPath = join(sandboxPath, file);
      try {
        const content = await fs.readFile(fullPath, 'utf-8');
        fileContentsDump += `\n--- START FILE: ${file} ---\n${content}\n--- END FILE: ${file} ---\n`;
      } catch (e) {
        fileContentsDump += `\n--- START FILE: ${file} ---\n// File does not exist yet.\n--- END FILE: ${file} ---\n`;
      }
    }

    const stepsStr = task.spec.steps ? task.spec.steps.map((s: string) => `- ${s}`).join('\n') : 'No steps provided.';

    const prompt = CODER_PROMPT
      .replace('{ACTION}', task.action)
      .replace('{DOMAIN}', task.domain)
      .replace('{STEPS}', stepsStr)
      .replace('{FEEDBACK}', feedback ? `THE REVIEWER REJECTED YOUR LAST ATTEMPT. FIX THESE ISSUES:\n${feedback}` : 'None. This is the first attempt.')
      .replace('{FILE_CONTENTS}', fileContentsDump);

    const response = await callGemini(prompt, "Please write the code.", apiKey);

    // Clean JSON
    const cleanJson = response.replace(/```json\s*[\s\S]*?\s*```/g, (match) => {
      return match.replace(/```json\s*/, '').replace(/\s*```/, '');
    }).trim();

    try {
      const result = JSON.parse(cleanJson);
      if (!result.files || !Array.isArray(result.files)) {
        throw new Error('Invalid output format from Coder Agent.');
      }

      // Write files to sandbox
      for (const fileObj of result.files) {
        if (!fileObj.path || !fileObj.content) continue;
        const outPath = join(sandboxPath, fileObj.path);
        
        // Ensure directory exists
        await fs.mkdir(join(outPath, '..'), { recursive: true });
        await fs.writeFile(outPath, fileObj.content, 'utf-8');
        logger.info(`[CoderAgent] Wrote modified file: ${fileObj.path}`);
      }
    } catch (e) {
      logger.error(`[CoderAgent] Failed to parse or write code: ${e}`);
      throw new Error(`Coder Agent failed: ${e}`);
    }
  }
}

export const coderAgent = new CoderAgent();
