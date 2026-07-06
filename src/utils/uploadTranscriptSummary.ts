import type { InferenceMode } from "../types/electron";
import type { ReasoningConfig } from "../services/BaseReasoningService";

export const UPLOAD_SUMMARY_SYSTEM_PROMPT = `You summarize uploaded audio and video transcripts for OpenWhispr notes.

Return only the summary text in clean markdown. Do not include a title, preamble, or a "Summary" heading.
Focus on the main points, decisions, useful details, and any clear action items.
Keep it concise, but preserve specific names, tools, dates, numbers, and links when they matter.`;

export interface UploadSummaryFormattingConfig {
  mode: InferenceMode;
  provider: string;
  model: string;
  cloudBaseUrl?: string;
  remoteUrl?: string;
  customApiKey?: string;
  disableThinking: boolean;
}

export interface UploadSummaryReasoning {
  modelId: string;
  config: ReasoningConfig;
}

const REMOTE_REASONING_PROVIDERS = new Set([
  "",
  "openai",
  "anthropic",
  "gemini",
  "groq",
  "custom",
  "bedrock",
  "azure",
  "vertex",
  "openwhispr",
]);

function isLocalReasoningSelection(formatting: UploadSummaryFormattingConfig): boolean {
  return (
    formatting.mode === "local" ||
    (!!formatting.model.trim() && !REMOTE_REASONING_PROVIDERS.has(formatting.provider))
  );
}

export function buildUploadEnhancedContent({
  summary,
  transcript,
}: {
  summary: string;
  transcript: string;
}): string {
  return `## Summary\n\n${summary.trim()}\n\n## Full Transcript\n\n${transcript.trim()}`;
}

export function makeUploadContentHash(transcript: string): string {
  return `${transcript.length}-${transcript.slice(0, 50)}-${transcript.slice(-50)}`;
}

export function resolveUploadSummaryReasoning(
  formatting: UploadSummaryFormattingConfig
): UploadSummaryReasoning | null {
  const modelId = formatting.model.trim();

  if (isLocalReasoningSelection(formatting)) {
    if (!modelId) return null;
    return {
      modelId,
      config: {
        provider: "local",
        disableThinking: formatting.disableThinking,
      },
    };
  }

  if (formatting.mode === "openwhispr") {
    return {
      modelId: "",
      config: {
        provider: "openwhispr",
        disableThinking: formatting.disableThinking,
      },
    };
  }

  if (formatting.mode === "self-hosted") {
    const lanUrl = formatting.remoteUrl?.trim();
    if (!lanUrl) return null;
    return {
      modelId: formatting.model.trim() || "default",
      config: {
        provider: "lan",
        lanUrl,
        customApiKey: formatting.customApiKey,
        disableThinking: formatting.disableThinking,
      },
    };
  }

  if (!modelId) return null;

  return {
    modelId,
    config: {
      provider: formatting.provider || undefined,
      ...(formatting.provider === "custom"
        ? {
            baseUrl: formatting.cloudBaseUrl,
            customApiKey: formatting.customApiKey,
          }
        : {}),
      disableThinking: formatting.disableThinking,
    },
  };
}
