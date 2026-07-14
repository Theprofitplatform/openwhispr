import type { LocalTranscriptionProvider } from "../../types/electron";

type TranscriptionResult = { success: boolean; text?: string; error?: string; code?: string };

export interface UploadTranscriptionApi {
  transcribeAudioFile: (
    filePath: string,
    options: { provider: "whisper" | "nvidia"; model: string }
  ) => Promise<TranscriptionResult>;
  transcribeAudioFileCloud?: (filePath: string) => Promise<TranscriptionResult>;
  transcribeAudioFileByok?: (options: {
    filePath: string;
    apiKey: string;
    baseUrl: string;
    model: string;
    provider: string;
    language: string;
    environment: string;
    tenant: string;
  }) => Promise<TranscriptionResult>;
}

export interface UploadTranscriptionRequest {
  filePath: string;
  useLocalWhisper: boolean;
  localTranscriptionProvider: LocalTranscriptionProvider;
  parakeetModel: string;
  whisperModel: string;
  cloudTranscriptionMode: string;
  cloudTranscriptionProvider: string;
  cloudTranscriptionBaseUrl: string;
  cloudTranscriptionModel: string;
  apiKey: string;
  language: string;
  environment: string;
  tenant: string;
}

type SessionRefresh = <T>(fn: () => Promise<T>) => Promise<T>;

export async function transcribeUploadedAudioFile(
  api: UploadTranscriptionApi,
  request: UploadTranscriptionRequest,
  withHostedSessionRefresh: SessionRefresh = (fn) => fn()
): Promise<TranscriptionResult> {
  if (request.useLocalWhisper) {
    return api.transcribeAudioFile(request.filePath, {
      provider: request.localTranscriptionProvider as "whisper" | "nvidia",
      model:
        request.localTranscriptionProvider === "nvidia"
          ? request.parakeetModel
          : request.whisperModel,
    });
  }

  if (request.cloudTranscriptionMode === "openwhispr") {
    if (!api.transcribeAudioFileCloud) {
      return { success: false, error: "Hosted transcription is not available." };
    }
    return withHostedSessionRefresh(async () => {
      const result = await api.transcribeAudioFileCloud!(request.filePath);
      if (!result.success && result.code) {
        throw Object.assign(new Error(result.error || "Cloud transcription failed"), {
          code: result.code,
        });
      }
      return result;
    });
  }

  if (!api.transcribeAudioFileByok) {
    return { success: false, error: "BYOK transcription is not available." };
  }

  return api.transcribeAudioFileByok({
    filePath: request.filePath,
    apiKey: request.apiKey,
    baseUrl: request.cloudTranscriptionBaseUrl || "",
    model: request.cloudTranscriptionModel,
    provider: request.cloudTranscriptionProvider,
    language: request.language,
    environment: request.environment,
    tenant: request.tenant,
  });
}
