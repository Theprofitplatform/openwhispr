import type { InferenceMode } from "../types/electron";

export interface NotesOnboardingConfig {
  mode: InferenceMode;
  model?: string;
  provider?: string;
  cloudMode?: string;
  remoteUrl?: string;
}

export function resolveNotesOnboardingAvailability(input: {
  useCleanupModel: boolean;
  isSignedIn: boolean;
  config: NotesOnboardingConfig;
}): { isLLMConfigured: boolean; requiresHostedAvailability: boolean } {
  if (!input.useCleanupModel) {
    return { isLLMConfigured: false, requiresHostedAvailability: false };
  }

  if (input.config.mode === "openwhispr") {
    return {
      isLLMConfigured: input.isSignedIn && input.config.cloudMode === "openwhispr",
      requiresHostedAvailability: true,
    };
  }

  if (input.config.mode === "self-hosted") {
    return {
      isLLMConfigured: Boolean(input.config.remoteUrl?.trim() || input.config.model?.trim()),
      requiresHostedAvailability: false,
    };
  }

  if (input.config.mode === "providers") {
    return {
      isLLMConfigured: Boolean(input.config.provider?.trim() && input.config.model?.trim()),
      requiresHostedAvailability: false,
    };
  }

  return {
    isLLMConfigured: Boolean(input.config.model?.trim()),
    requiresHostedAvailability: false,
  };
}
