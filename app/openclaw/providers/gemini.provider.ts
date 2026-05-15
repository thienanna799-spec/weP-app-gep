// ============================================================
// OpenClaw – Gemini Provider
// Google Gemini 2.5 Pro adapter
// ============================================================

import type { ProviderRequest, ProviderResponse } from '../runtime/types.js';
import { BaseProvider } from './base.provider.js';
import { logger } from '../runtime/logger.js';

const GEMINI_BASE_URL = 'https://generativelanguage.googleapis.com/v1beta';

export class GeminiProvider extends BaseProvider {
  readonly name = 'gemini' as const;
  readonly defaultModel = 'gemini-2.5-pro-preview-05-06';

  private apiKey: string;

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async complete(request: ProviderRequest): Promise<ProviderResponse> {
    const model = request.model ?? this.defaultModel;
    const url = `${GEMINI_BASE_URL}/models/${model}:generateContent?key=${this.apiKey}`;

    // Build Gemini content format
    const contents = request.messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }));

    // Extract system instruction
    const systemMsg = request.messages.find(m => m.role === 'system');
    const systemInstruction = systemMsg
      ? { parts: [{ text: systemMsg.content }] }
      : undefined;

    const body = {
      contents,
      ...(systemInstruction && { systemInstruction }),
      generationConfig: {
        maxOutputTokens: request.maxTokens ?? 8192,
        temperature: request.temperature ?? 0.2,
        ...(request.responseFormat === 'json' && { responseMimeType: 'application/json' }),
      },
    };

    const startTime = Date.now();
    logger.debug(`Gemini request: model=${model}, messages=${request.messages.length}`);

    const response = await this.fetchWithTimeout(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Gemini API error ${response.status}: ${error}`);
    }

    const data = await response.json() as {
      candidates: Array<{ content: { parts: Array<{ text: string }> } }>;
      usageMetadata?: { promptTokenCount: number; candidatesTokenCount: number };
    };

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
    const latencyMs = Date.now() - startTime;

    logger.debug(`Gemini response: ${content.length} chars, ${latencyMs}ms`);

    return {
      content,
      model,
      inputTokens: data.usageMetadata?.promptTokenCount ?? 0,
      outputTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
      provider: 'gemini',
      latencyMs,
    };
  }
}
