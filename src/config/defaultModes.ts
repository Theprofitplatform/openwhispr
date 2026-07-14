import type { InferenceMode } from "../types/electron";

const INFERENCE_MODES = new Set<InferenceMode>([
  "openwhispr",
  "providers",
  "local",
  "self-hosted",
  "enterprise",
]);

export function getDefaultTranscriptionMode(): InferenceMode {
  return "local";
}

export function getDefaultReasoningMode(): InferenceMode {
  return "local";
}

export function normalizeInferenceMode(
  value: string | null | undefined,
  fallback: InferenceMode
): InferenceMode {
  return value && INFERENCE_MODES.has(value as InferenceMode)
    ? (value as InferenceMode)
    : fallback;
}
