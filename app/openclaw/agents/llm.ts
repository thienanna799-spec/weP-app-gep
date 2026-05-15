import { logger } from '../runtime/logger.js';

export async function callGemini(
  systemPrompt: string, 
  userMessage: string, 
  apiKey: string,
  options?: { responseSchema?: any, temperature?: number }
): Promise<string> {
  const model = 'gemini-3-flash-preview'; // Or gemini-1.5-pro-latest depending on the key
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  const body: any = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userMessage }] }],
    generationConfig: {
      maxOutputTokens: 2000,
      temperature: options?.temperature ?? 0.4,
    },
  };

  if (options?.responseSchema) {
    body.generationConfig.responseMimeType = "application/json";
    body.generationConfig.responseSchema = options.responseSchema;
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await response.json() as any;

  if (!response.ok) {
    throw new Error(`Gemini API ${response.status}: ${data?.error?.message ?? JSON.stringify(data?.error)}`);
  }

  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error(`Empty Gemini response. FinishReason: ${data.candidates?.[0]?.finishReason}`);
  return text;
}
