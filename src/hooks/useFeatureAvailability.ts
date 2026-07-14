import { useMemo } from "react";
import { useShallow } from "zustand/react/shallow";
import {
  resolveFeatureAvailability,
  type FeatureAvailabilityState,
} from "../config/featureAvailability";
import { useAuth } from "./useAuth";
import { useUsage } from "./useUsage";
import { useSettingsStore } from "../stores/settingsStore";

interface UseFeatureAvailabilityOptions {
  uploadSizeBytes?: number;
}

export function useFeatureAvailability(
  options: UseFeatureAvailabilityOptions = {}
): FeatureAvailabilityState & { usageLoading: boolean } {
  const { isSignedIn } = useAuth();
  const usage = useUsage();
  const modes = useSettingsStore(
    useShallow((state) => ({
      transcription: state.transcriptionMode,
      cleanup: state.cleanupMode,
      dictationAgent: state.dictationAgentMode,
      chatAgent: state.chatAgentMode,
      noteFormatting: state.noteFormattingMode,
      meetingTranscription: state.meetingTranscriptionMode,
      uploadTranscription: state.uploadTranscriptionMode,
    }))
  );

  const isSubscribed = Boolean(usage?.isSubscribed);
  const isTrial = Boolean(usage?.isTrial);
  const usageLoading = Boolean(usage && !usage.hasLoaded);

  const availability = useMemo(
    () =>
      resolveFeatureAvailability({
        isSignedIn,
        isSubscribed,
        isTrial,
        hostedUsageOverLimit: Boolean(usage?.isOverLimit),
        uploadSizeBytes: options.uploadSizeBytes,
        modes,
      }),
    [
      isSignedIn,
      isSubscribed,
      isTrial,
      usage?.isOverLimit,
      options.uploadSizeBytes,
      modes,
    ]
  );

  return { ...availability, usageLoading };
}
