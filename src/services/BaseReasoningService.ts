import { getCleanupSystemPrompt } from "../config/prompts";
import { getSettings } from "../stores/settingsStore";
import { getDictionaryHintWords } from "../utils/snippets";
import type { AppContext } from "../types/electron";

export interface ReasoningConfig {
  maxTokens?: number;
  temperature?: number;
  contextSize?: number;
  systemPrompt?: string;
  appContext?: AppContext | null;
  lanUrl?: string;
  baseUrl?: string;
  customApiKey?: string;
  provider?: string;
  disableThinking?: boolean;
}

export abstract class BaseReasoningService {
  protected isProcessing = false;

  protected getCustomDictionary(): string[] {
    return getDictionaryHintWords(getSettings());
  }

  protected getPreferredLanguage(): string {
    return getSettings().preferredLanguage || "auto";
  }

  protected getUiLanguage(): string {
    return getSettings().uiLanguage || "en";
  }

  protected getSystemPrompt(agentName: string | null, appContext?: AppContext | null): string {
    return getCleanupSystemPrompt(
      agentName,
      this.getCustomDictionary(),
      this.getPreferredLanguage(),
      this.getUiLanguage(),
      appContext
    );
  }

  protected calculateMaxTokens(
    textLength: number,
    minTokens = 100,
    maxTokens = 2048,
    multiplier = 2
  ): number {
    return Math.max(minTokens, Math.min(textLength * multiplier, maxTokens));
  }

  abstract isAvailable(): Promise<boolean>;

  abstract processText(
    text: string,
    modelId: string,
    agentName?: string | null,
    config?: ReasoningConfig
  ): Promise<string>;
}
