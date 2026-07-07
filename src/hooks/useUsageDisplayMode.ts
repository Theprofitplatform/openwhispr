import type { FeatureRoute } from "../config/featureAvailability";

export type UsageDisplayMode =
  | "local"
  | "byok"
  | "self-hosted"
  | "enterprise"
  | "hosted-upgrade"
  | "hosted-ok";

export function summariseUsageDisplayMode(input: {
  activeRoute: FeatureRoute;
  isOverLimit: boolean;
}): UsageDisplayMode {
  switch (input.activeRoute) {
    case "local":
    case "byok":
    case "self-hosted":
    case "enterprise":
      return input.activeRoute;
    case "hosted-paid":
      return "hosted-ok";
    default:
      return input.isOverLimit ? "hosted-upgrade" : "hosted-ok";
  }
}

export function shouldShowHostedUpgradePrompt(mode: UsageDisplayMode): boolean {
  return mode === "hosted-ok" || mode === "hosted-upgrade";
}
