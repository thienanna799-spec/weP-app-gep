// ============================================================
// OpenClaw – Provider Factory
// Instantiates the correct provider based on config + task type
// ============================================================

import type { ProviderName } from '../runtime/types.js';
import { BaseProvider } from './base.provider.js';
import { GeminiProvider } from './gemini.provider.js';
import { OpenAIProvider } from './openai.provider.js';
import { OpenRouterProvider } from './openrouter.provider.js';
import { openclawConfig } from '../configs/openclaw.config.js';
import { getModelForTask, type TaskType } from '../configs/model-routing.config.js';
import { logger } from '../runtime/logger.js';

let _providers: Map<ProviderName, BaseProvider> | null = null;

function initProviders(): Map<ProviderName, BaseProvider> {
  if (_providers) return _providers;

  _providers = new Map();
  const { provider } = openclawConfig;
  logger.debug(`Providers initializing — gemini: ${!!provider.geminiApiKey}, openai: ${!!provider.openaiApiKey}`);

  if (provider.geminiApiKey) {
    _providers.set('gemini', new GeminiProvider(provider.geminiApiKey));
    logger.debug('Provider initialized: Gemini');
  }
  if (provider.openaiApiKey) {
    _providers.set('openai', new OpenAIProvider(provider.openaiApiKey));
    logger.debug('Provider initialized: OpenAI');
  }
  if (provider.openrouterApiKey) {
    _providers.set('openrouter', new OpenRouterProvider(provider.openrouterApiKey));
    logger.debug('Provider initialized: OpenRouter');
  }

  return _providers;
}

/** Get the best available provider for a given task */
export function getProviderForTask(taskType: TaskType): {
  provider: BaseProvider;
  model: string;
  providerName: ProviderName;
} {
  const providers = initProviders();

  // Priority order based on task type
  const priority: ProviderName[] = (() => {
    switch (taskType) {
      case 'governance':
      case 'risk':
      case 'review':
        // High-stakes → prefer Gemini Pro, fallback OpenRouter, then OpenAI
        return ['gemini', 'openrouter', 'openai'];
      case 'planning':
      case 'impact':
      case 'prompt':
        // Planning → prefer Gemini Flash, fallback chain
        return ['gemini', 'openrouter', 'openai'];
      case 'sync':
      case 'formatting':
      case 'log':
        // Lightweight → any provider, cheapest
        return ['gemini', 'openai', 'openrouter'];
    }
  })();

  for (const name of priority) {
    const p = providers.get(name);
    if (p) {
      const model = getModelForTask(taskType, name);
      return { provider: p, model, providerName: name };
    }
  }

  throw new Error(
    `No AI provider available for task "${taskType}". ` +
    `Configure at least one of: GEMINI_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY`
  );
}

/** Check if any provider is available */
export function hasProvider(): boolean {
  try {
    const providers = initProviders();
    return providers.size > 0;
  } catch (err) {
    console.error('Error in initProviders:', err);
    return false;
  }
}

/** List available providers */
export function listProviders(): string[] {
  const providers = initProviders();
  return Array.from(providers.keys());
}
