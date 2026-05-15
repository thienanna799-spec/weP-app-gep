import { ExecutionTask } from '../kernel/state.js';
import { dependencySensor } from '../sensors/dependency-graph.js';
import { logger } from '../runtime/logger.js';
import { callGemini } from './llm.js';

const GRAPH_AGENT_PROMPT = `You are the CODE GRAPH AGENT for the OpenClaw v4 System.
Your job is to analyze the proposed Execution Plan and identify the Blast Radius (the side effects on other files).

PROPOSED PLAN FILES TO MODIFY:
{FILES_TO_MODIFY}

DEPENDENCY GRAPH (Inverse):
{DEPENDENCY_GRAPH}

Based on the dependency graph, if any file in FILES_TO_MODIFY is imported by other files, those importing files might break if the interface or logic changes.

You must output a JSON object containing the expanded list of files to modify or verify.
Format:
{
  "additionalFiles": ["path/to/file1.ts", "path/to/file2.ts"],
  "reasoning": "Explanation of why these files are affected."
}

Only return raw JSON. No markdown blocks.`;

export class CodeGraphAgent {
  async analyze(plan: Partial<ExecutionTask>, apiKey: string): Promise<Partial<ExecutionTask>> {
    logger.info(`[CodeGraphAgent] Analyzing blast radius for ${plan.spec?.filesToModify?.length || 0} files...`);
    
    const depContext = dependencySensor.getPromptContext();
    if (!depContext || !plan.spec?.filesToModify || plan.spec.filesToModify.length === 0) {
      return plan; // Nothing to do
    }

    const prompt = GRAPH_AGENT_PROMPT
      .replace('{FILES_TO_MODIFY}', JSON.stringify(plan.spec.filesToModify, null, 2))
      .replace('{DEPENDENCY_GRAPH}', depContext);

    try {
      const response = await callGemini(prompt, "Analyze the blast radius.", apiKey);
      const cleanJson = response.replace(/```json\s*[\s\S]*?\s*```/g, (match) => {
        return match.replace(/```json\s*/, '').replace(/\s*```/, '');
      }).trim();
      
      const analysis = JSON.parse(cleanJson);
      
      if (analysis.additionalFiles && analysis.additionalFiles.length > 0) {
        logger.warn(`[CodeGraphAgent] Blast Radius expanded! Added ${analysis.additionalFiles.length} files.`);
        
        // Merge arrays without duplicates
        const mergedFiles = Array.from(new Set([...plan.spec.filesToModify, ...analysis.additionalFiles]));
        plan.spec.filesToModify = mergedFiles;
        
        // Optionally append reasoning to steps
        plan.spec.steps?.push(`[CodeGraph Agent] Note: Ensure you update ${analysis.additionalFiles.join(', ')} to match interface changes. Reason: ${analysis.reasoning}`);
      }
      
      return plan;
    } catch (e) {
      logger.error(`[CodeGraphAgent] Analysis failed, bypassing: ${e}`);
      return plan;
    }
  }
}

export const codeGraphAgent = new CodeGraphAgent();
