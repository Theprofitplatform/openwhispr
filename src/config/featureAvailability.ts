import type { InferenceMode } from "../types/electron";

export type FeatureKey =
  | "transcription"
  | "cleanup"
  | "dictationAgent"
  | "chatAgent"
  | "noteFormatting"
  | "meetingTranscription"
  | "uploadTranscription"
  | "semanticSearch"
  | "cloudBackup"
  | "hostedNoteShare"
  | "workspaces"
  | "workspaceApiKeys"
  | "hostedMcp";

export type FeatureRoute =
  | "local"
  | "byok"
  | "self-hosted"
  | "enterprise"
  | "hosted-free-limited"
  | "hosted-paid"
  | "hosted-account-required"
  | "hosted-only";

export type FeatureAvailabilityReason =
  | "local_available"
  | "byok_available"
  | "self_hosted_available"
  | "enterprise_available"
  | "hosted_free_available"
  | "hosted_subscription_available"
  | "hosted_limit_reached"
  | "hosted_large_file_requires_pro"
  | "hosted_file_too_large"
  | "account_required"
  | "hosted_only";

export interface FeatureAvailabilityInput {
  isSignedIn?: boolean;
  isSubscribed?: boolean;
  isTrial?: boolean;
  hostedUsageOverLimit?: boolean;
  uploadSizeBytes?: number;
  modes?: Partial<Record<FeatureKey, InferenceMode>>;
}

export interface FeatureAvailability {
  usable: boolean;
  route: FeatureRoute;
  reason: FeatureAvailabilityReason;
  requiresAccount: boolean;
  requiresHostedSubscription: boolean;
  hasLocalAlternative: boolean;
}

export type FeatureAvailabilityState = Record<FeatureKey, FeatureAvailability>;

const HOSTED_UPLOAD_FREE_MAX_BYTES = 25 * 1024 * 1024;
const HOSTED_UPLOAD_PRO_MAX_BYTES = 500 * 1024 * 1024;

export const HOSTED_ONLY_FEATURES = [
  "cloudBackup",
  "hostedNoteShare",
  "workspaces",
  "workspaceApiKeys",
  "hostedMcp",
] as const satisfies readonly FeatureKey[];

export const LOCAL_CAPABLE_FEATURES = [
  "transcription",
  "cleanup",
  "dictationAgent",
  "chatAgent",
  "noteFormatting",
  "meetingTranscription",
  "uploadTranscription",
  "semanticSearch",
] as const satisfies readonly FeatureKey[];

const ALL_FEATURES = [...LOCAL_CAPABLE_FEATURES, ...HOSTED_ONLY_FEATURES] as const;

export function isLocalCapableFeature(feature: FeatureKey): boolean {
  return (LOCAL_CAPABLE_FEATURES as readonly FeatureKey[]).includes(feature);
}

export function resolveFeatureAvailability(
  input: FeatureAvailabilityInput
): FeatureAvailabilityState {
  const isSignedIn = Boolean(input.isSignedIn);
  const hasHostedSubscription = Boolean(input.isSubscribed || input.isTrial);

  return ALL_FEATURES.reduce((state, feature) => {
    state[feature] = isLocalCapableFeature(feature)
      ? resolveLocalCapableFeature(feature, input, isSignedIn, hasHostedSubscription)
      : resolveHostedOnlyFeature(isSignedIn, hasHostedSubscription);
    return state;
  }, {} as FeatureAvailabilityState);
}

function resolveLocalCapableFeature(
  feature: FeatureKey,
  input: FeatureAvailabilityInput,
  isSignedIn: boolean,
  hasHostedSubscription: boolean
): FeatureAvailability {
  const mode = input.modes?.[feature] || "local";

  if (mode === "local") {
    return available("local", "local_available", false, true);
  }

  if (mode === "providers") {
    return available("byok", "byok_available", false, true);
  }

  if (mode === "self-hosted") {
    return available("self-hosted", "self_hosted_available", false, true);
  }

  if (mode === "enterprise") {
    return available("enterprise", "enterprise_available", false, true);
  }

  if (!isSignedIn) {
    return unavailable("hosted-account-required", "account_required", true, false, true);
  }

  if (feature === "uploadTranscription") {
    const uploadSizeBytes = input.uploadSizeBytes || 0;
    if (uploadSizeBytes > HOSTED_UPLOAD_PRO_MAX_BYTES) {
      return unavailable("hosted-free-limited", "hosted_file_too_large", false, true, true);
    }
    if (uploadSizeBytes > HOSTED_UPLOAD_FREE_MAX_BYTES && !hasHostedSubscription) {
      return unavailable(
        "hosted-free-limited",
        "hosted_large_file_requires_pro",
        false,
        true,
        true
      );
    }
  }

  if (input.hostedUsageOverLimit && !hasHostedSubscription) {
    return unavailable("hosted-free-limited", "hosted_limit_reached", false, true, true);
  }

  return available(
    hasHostedSubscription ? "hosted-paid" : "hosted-free-limited",
    hasHostedSubscription ? "hosted_subscription_available" : "hosted_free_available",
    hasHostedSubscription,
    true
  );
}

function resolveHostedOnlyFeature(
  isSignedIn: boolean,
  hasHostedSubscription: boolean
): FeatureAvailability {
  if (!isSignedIn) {
    return unavailable("hosted-account-required", "account_required", true, true, false);
  }
  if (!hasHostedSubscription) {
    return unavailable("hosted-only", "hosted_only", false, true, false);
  }
  return available("hosted-paid", "hosted_subscription_available", true, false);
}

function available(
  route: FeatureRoute,
  reason: FeatureAvailabilityReason,
  requiresHostedSubscription: boolean,
  hasLocalAlternative: boolean
): FeatureAvailability {
  return {
    usable: true,
    route,
    reason,
    requiresAccount: route.startsWith("hosted"),
    requiresHostedSubscription,
    hasLocalAlternative,
  };
}

function unavailable(
  route: FeatureRoute,
  reason: FeatureAvailabilityReason,
  requiresAccount: boolean,
  requiresHostedSubscription: boolean,
  hasLocalAlternative: boolean
): FeatureAvailability {
  return {
    usable: false,
    route,
    reason,
    requiresAccount,
    requiresHostedSubscription,
    hasLocalAlternative,
  };
}
