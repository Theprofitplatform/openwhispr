import { resolvePrompt } from "./prompts/index";
import type { AppContext } from "../types/electron";

// Builds the optional "Context" section injected into the cleanup system prompt
// when IDE context awareness is enabled and a capture is available. Returns "" if
// there is no usable context, so callers can always concatenate unconditionally.
function buildAppContextSection(appContext?: AppContext | null): string {
  if (!appContext?.appName) return "";
  let contextSection = `\nContext (the user is currently working in):\nApp: ${appContext.appName}`;
  if (appContext.projectName) {
    contextSection += `\nProject: ${appContext.projectName}`;
  }
  if (appContext.fileName) {
    contextSection += `\nFile: ${appContext.fileName}`;
  }
  if (appContext.openTabs && appContext.openTabs.length > 0) {
    contextSection += `\nOpen tabs: ${appContext.openTabs.join(", ")}`;
  }
  if (appContext.projectFiles && appContext.projectFiles.length > 0) {
    contextSection += `\nProject files: ${appContext.projectFiles.slice(0, 50).join(", ")}`;
  }
  if (appContext.projectName) {
    contextSection += `\nWhen the user references a file from this project, format it as @${appContext.projectName}/filename.`;
  }
  return "\n" + contextSection;
}

export {
  resolvePrompt,
  getDefaultPromptText,
  appendDictionarySuffix,
  wrapCleanupTranscript,
} from "./prompts/index";
export { PROMPT_KINDS, PROMPT_KIND_LIST, type PromptKind } from "./prompts/registry";
export { detectAgentName } from "./agentDetection";

export function getCleanupSystemPrompt(
  agentName: string | null,
  customDictionary?: string[],
  language?: string,
  uiLanguage?: string,
  appContext?: AppContext | null
): string {
  const prompt = resolvePrompt("cleanup", { agentName, language, customDictionary, uiLanguage });
  return prompt + buildAppContextSection(appContext);
}

export function getWordBoost(customDictionary?: string[]): string[] {
  if (!customDictionary || customDictionary.length === 0) return [];
  return customDictionary.filter((w) => w.trim());
}

const TOOL_INSTRUCTIONS: Record<string, string> = {
  search_notes:
    "Use search_notes to find information from the user's past meetings, discussions, or personal notes before answering from memory.",
  get_note:
    "Use get_note to fetch the full content of a specific note by ID. If the current note's ID is provided in the context, use it directly. Otherwise, use search_notes first to find the note ID.",
  create_note:
    "Use create_note when the user asks you to create, write, or draft a new note. Whenever the note will go into a folder, call list_folders first and reuse an existing folder whose name is a reasonable fit for the note's topic (e.g. a new story belongs in an existing 'Stories' folder) — do this even when the user didn't name a folder but the content clearly fits one. Only pass a new folder name when nothing existing fits. Be tolerant of case, plurals, and typos.",
  update_note:
    "Use update_note to modify an existing note's title, content, or move it to a different folder. If the current note's ID is provided in the context, use it directly. Otherwise, use search_notes first to find the note ID. When moving to a folder, call list_folders first and reuse an existing folder whose name fits the note's topic; only create a new folder when nothing existing fits.",
  list_folders:
    "Use list_folders before create_note or update_note whenever a note is going into a folder, so you can reuse an existing folder whose name fits the note's topic instead of creating a near-duplicate.",
  web_search:
    "Use web_search for questions about current events, facts you're unsure about, or anything requiring up-to-date information.",
  copy_to_clipboard:
    "Use copy_to_clipboard when the user asks you to copy something to their clipboard.",
  get_calendar_events:
    "Use get_calendar_events to check the user's schedule, upcoming meetings, or calendar events.",
};

export function getAgentSystemPrompt(availableTools?: string[], noteContext?: string): string {
  let prompt = resolvePrompt("chatAgent", { agentName: null });

  if (availableTools && availableTools.length > 0) {
    const toolLines = availableTools.map((name) => TOOL_INSTRUCTIONS[name]).filter(Boolean);
    if (toolLines.length > 0) {
      prompt += "\n\nYou have access to tools. " + toolLines.join(" ");
    }
  }

  if (noteContext) {
    prompt +=
      "\n\nBelow are notes from the user's library that may be relevant. " +
      "Reference them naturally if they help answer the question.\n\n" +
      noteContext;
  }

  return prompt;
}
