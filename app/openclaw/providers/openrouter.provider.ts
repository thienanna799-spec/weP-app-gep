// ============================================================
// OpenClaw – OpenRouter Provider
// Multi-model adapter via OpenRouter.ai
// ============================================================

import type { ProviderRequest, ProviderResponse } from '../runtime/types.js';
import { BaseProvider } from './base.provider.js';
import { logger } from '../runtime/logger.js';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Recommended models for different task types
export const OPENROUTER_MODELS = {
  planning:  'anthropic/claude-sonnet-4-5',
  review:    'openai/gpt-4o',
  fast:      'google/gemini-2.0-flash-001',
  cheap:     'meta-llama/llama-3.3-70b-instruct',
  default:   'google/gemini-2.5-pro-preview-05-06',
};

export class OpenRouterProvider extends BaseProvider {
  readonly name = 'openrouter' as const;
  readonly defaultModel = OPENROUTER_MODELS.default;

  private apiKey: string;
  private siteUrl?: string;
  private siteName?: string;

  constructor(apiKey: string, siteUrl?: string, siteName?: string) {
    super();
    this.apiKey = apiKey;
    this.siteUrl = siteUrl ?? 'https://gepoder.click';
    this.siteName = siteName ?? 'OpenClaw GEP';
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const model = request.model ?? this.defaultModel;
    const url = `${OPENROUTER_BASE_URL}/chat/completions`;

    const body = {
      model,
      messages: request.messages,
      max_tokens: request.maxTokens ?? 4096,
      temperature: request.temperature ?? 0.2,
      ...(request.responseFormat === 'json' && {
        response_format: { type: 'json_object' },
      }),
    };

    const startTime = Date.now();
    logger.debug(`OpenRouter request: model=${model}, messages=${request.messages.length}`);

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: {
        ...this.buildHeaders(this.apiKey),
        'HTTP-Referer': this.siteUrl ?? '',
        'X-Title': this.siteName ?? '',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenRouter API error ${response.status}: ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      model: string;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    const content = data.choices?.[0]?.message?.content ?? '';
    const latencyMs = Date.now() - startTime;

    logger.debug(`OpenRouter response: model=${data.model}, ${content.length} chars, ${latencyMs}ms`);

    return {
      content,
      model: data.model,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      provider: 'openrouter',
      latencyMs,
    };
  }
}
