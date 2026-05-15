// ============================================================
// OpenClaw – OpenAI Provider
// GPT-4o / GPT-4o-mini adapter
// ============================================================

import type { ProviderRequest, ProviderResponse } from '../runtime/types.js';
import { BaseProvider } from './base.provider.js';
import { logger } from '../runtime/logger.js';

const OPENAI_BASE_URL = 'https://api.openai.com/v1';

export class OpenAIProvider extends BaseProvider {
  readonly name = 'openai' as const;
  readonly defaultModel = 'gpt-4o';

  private apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const model = request.model ?? this.defaultModel;
    const url = `${OPENAI_BASE_URL}/chat/completions`;

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
    logger.debug(`OpenAI request: model=${model}, messages=${request.messages.length}`);

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: this.buildHeaders(this.apiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`OpenAI API error ${response.status}: ${error}`);
    }

    const data = await response.json() as {
      choices: Array<{ message: { content: string } }>;
      model: string;
      usage?: { prompt_tokens: number; completion_tokens: number };
    };

    const content = data.choices?.[0]?.message?.content ?? '';
    const latencyMs = Date.now() - startTime;

    logger.debug(`OpenAI response: ${content.length} chars, ${latencyMs}ms`);

    return {
      content,
      model: data.model,
      inputTokens: data.usage?.prompt_tokens ?? 0,
      outputTokens: data.usage?.completion_tokens ?? 0,
      provider: 'openai',
      latencyMs,
    };
  }
}
