import { useState, useCallback } from "react";
import { useSettingsStore, selectResolvedLLMConfig } from "../stores/settingsStore";
import { useUsage } from "./useUsage";
import { resolveNotesOnboardingAvailability } from "./notesOnboardingAvailability";

interface UseNotesOnboardingReturn {
  isComplete: boolean;
  isProUser: boolean;
  isProLoading: boolean;
  isLLMConfigured: boolean;
  complete: () => void;
}

export function useNotesOnboarding(): UseNotesOnboardingReturn {
  const usage = useUsage();
  const isProUser = !!(usage?.isSubscribed || usage?.isTrial);
  const isProLoading = usage !== null && !usage.hasLoaded;
  const useCleanupModel = useSettingsStore((s) => s.useCleanupModel);
  const isSignedIn = useSettingsStore((s) => s.isSignedIn);
  const noteFormatting = useSettingsStore((s) => selectResolvedLLMConfig(s, "noteFormatting"));

  const [isComplete, setIsComplete] = useState(
    () => localStorage.getItem("notesOnboardingComplete") === "true"
  );

  const { isLLMConfigured } = resolveNotesOnboardingAvailability({
    useCleanupModel,
    isSignedIn,
    config: noteFormatting,
  });

  const complete = useCallback(() => {
    localStorage.setItem("notesOnboardingComplete", "true");
    setIsComplete(true);
  }, []);

  return { isComplete, isProUser, isProLoading, isLLMConfigured, complete };
}
