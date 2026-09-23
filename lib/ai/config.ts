import { getEnv } from '@/lib/utils/env';

// Single place where the model name lives.
// Override via ANTHROPIC_MODEL env var.
export function getModelId(): string {
  return getEnv().anthropicModel;
}

export const DEFAULT_HAIKU_MODEL = 'claude-haiku-4-5-20251001';
