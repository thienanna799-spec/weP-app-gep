// ============================================================
// OpenClaw – Main Config Loader
// Reads .env and builds typed runtime configuration
// ============================================================

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

// Load .env from openclaw directory
const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '../.env') });

export type ProviderName = 'gemini' | 'openai' | 'openrouter';
export type GovernanceMode = 'strict' | 'standard' | 'permissive';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface OpenClawConfig {
  // AI Provider
  provider: {
    default: ProviderName;
    geminiApiKey?: string;
    openaiApiKey?: string;
    openrouterApiKey?: string;
  };
  // Memory paths
  memory: {
    aiPath: string;      // Absolute path to ai/ directory
    gepRootPath: string; // Absolute path to GEP codebase root
    queuePath: string;   // Absolute path to the execution queue database
  };
  // Telegram
  telegram: {
    enabled: boolean;
    botToken?: string;
    adminChatId?: string;
  };
  // Logging
  logging: {
    level: LogLevel;
    dir: string;
  };
  // Runtime behavior
  runtime: {
    autoConfirm: boolean;
    maxContextTokens: number;
    governanceMode: GovernanceMode;
  };
}

function resolveMemoryPath(envPath: string, defaultRelative: string): string {
  if (envPath) return resolve(envPath);
  return resolve(__dirname, '..', defaultRelative);
}

export const openclawConfig: OpenClawConfig = {
  provider: {
    default: (process.env.OPENCLAW_DEFAULT_PROVIDER as ProviderName) ?? 'gemini',
    geminiApiKey: process.env.GEMINI_API_KEY,
    openaiApiKey: process.env.OPENAI_API_KEY,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
  },
  memory: {
    aiPath: resolveMemoryPath(process.env.AI_MEMORY_PATH ?? '', '../ai'),
    gepRootPath: resolveMemoryPath(process.env.GEP_ROOT_PATH ?? '', '../'),
    queuePath: resolveMemoryPath(process.env.QUEUE_PATH ?? '', '../openclaw/data/queue.json'),
  },
  telegram: {
    enabled: process.env.TELEGRAM_ENABLED === 'true',
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    adminChatId: process.env.TELEGRAM_ADMIN_CHAT_ID,
  },
  logging: {
    level: (process.env.LOG_LEVEL as LogLevel) ?? 'info',
    dir: resolve(__dirname, '..', process.env.LOG_DIR ?? 'logs'),
  },
  runtime: {
    autoConfirm: process.env.OPENCLAW_AUTO_CONFIRM === 'true',
    maxContextTokens: parseInt(process.env.OPENCLAW_MAX_CONTEXT_TOKENS ?? '100000'),
    governanceMode: (process.env.OPENCLAW_GOVERNANCE_MODE as GovernanceMode) ?? 'strict',
  },
};

// Validate required config
export function validateConfig(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const { provider } = openclawConfig;

  const hasProvider =
    provider.geminiApiKey || provider.openaiApiKey || provider.openrouterApiKey;

  if (!hasProvider) {
    errors.push(
      'No AI provider configured. Set at least one of: GEMINI_API_KEY, OPENAI_API_KEY, OPENROUTER_API_KEY'
    );
  }

  if (
    provider.default === 'gemini' && !provider.geminiApiKey
  ) {
    errors.push('Default provider is gemini but GEMINI_API_KEY is not set');
  }

  if (
    openclawConfig.telegram.enabled &&
    (!openclawConfig.telegram.botToken || !openclawConfig.telegram.adminChatId)
  ) {
    errors.push('TELEGRAM_ENABLED=true but TELEGRAM_BOT_TOKEN or TELEGRAM_ADMIN_CHAT_ID missing');
  }

  return { valid: errors.length === 0, errors };
}
