// ============================================================
// OpenClaw – Base Provider Interface
// All AI providers implement this interface
// ============================================================

import type { ProviderRequest, ProviderResponse, ProviderName } from '../runtime/types.js';

export abstract class BaseProvider {
  abstract readonly name: ProviderName;
  abstract readonly defaultModel: string;

  abstract complete(request: ProviderRequest): Promise<ProviderResponse>;

  protected buildHeaders(apiKey: string, extra?: Record<string, string>): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extra,
    };
  }

  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeoutMs = 60000
  ): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...options, signal: controller.signal });
      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  /** Truncate context to fit within token budget */
  protected truncateContext(text: string, maxChars: number): string {
    if (text.length <= maxChars) return text;
    const truncated = text.slice(0, maxChars);
    return truncated + '\n\n[... context truncated for token limit ...]';
  }
}
