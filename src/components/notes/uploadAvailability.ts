export type UploadAvailabilityMode = "openwhispr" | "providers" | "local" | "self-hosted";

export type UploadAvailabilityReason =
  | "ok"
  | "hosted_large_file_requires_pro"
  | "hosted_file_too_large"
  | "byok_provider_file_too_large"
  | "account_required_for_hosted";

export interface UploadAvailabilityInput {
  fileSizeBytes: number;
  mode: UploadAvailabilityMode;
  provider: string;
  isSignedIn: boolean;
  isProUser: boolean;
}

export interface UploadAvailability {
  canTranscribe: boolean;
  reason: UploadAvailabilityReason;
}

export const BYOK_MAX_FILE_SIZE = 25 * 1024 * 1024;
export const HOSTED_UPLOAD_FREE_MAX_BYTES = 25 * 1024 * 1024;
export const HOSTED_UPLOAD_PRO_MAX_BYTES = 500 * 1024 * 1024;

export function getUploadAvailability(input: UploadAvailabilityInput): UploadAvailability {
  if (input.mode === "local" || input.mode === "self-hosted" || input.provider === "custom") {
    return ok();
  }

  if (input.mode === "providers") {
    return input.fileSizeBytes > BYOK_MAX_FILE_SIZE
      ? unavailable("byok_provider_file_too_large")
      : ok();
  }

  if (!input.isSignedIn) {
    return unavailable("account_required_for_hosted");
  }

  if (input.fileSizeBytes > HOSTED_UPLOAD_PRO_MAX_BYTES) {
    return unavailable("hosted_file_too_large");
  }

  if (!input.isProUser && input.fileSizeBytes > HOSTED_UPLOAD_FREE_MAX_BYTES) {
    return unavailable("hosted_large_file_requires_pro");
  }

  return ok();
}

function ok(): UploadAvailability {
  return { canTranscribe: true, reason: "ok" };
}

function unavailable(reason: Exclude<UploadAvailabilityReason, "ok">): UploadAvailability {
  return { canTranscribe: false, reason };
}
