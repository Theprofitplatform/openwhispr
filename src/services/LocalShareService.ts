import type { NoteItem } from "../types/electron";

export interface LocalNoteSharePackage {
  filename: string;
  markdown: string;
  metadata: Record<string, unknown>;
}

export async function buildLocalNoteSharePackage(noteId: number): Promise<LocalNoteSharePackage> {
  const note = await window.electronAPI.getNote(noteId);
  if (!note) throw new Error("Note not found");

  const markdown = buildMarkdown(note);
  return {
    filename: `${sanitizeFilename(note.title || `note-${note.id}`)}.md`,
    markdown,
    metadata: {
      noteId: note.id,
      cloudId: note.cloud_id ?? null,
      noteType: note.note_type,
      sourceFile: note.source_file,
      createdAt: note.created_at,
      updatedAt: note.updated_at,
    },
  };
}

function buildMarkdown(note: NoteItem): string {
  const sections = [`# ${note.title || "Untitled Note"}`];
  const body = (note.enhanced_content || note.content || "").trim();
  if (body) sections.push(body);
  const transcript = note.transcript?.trim();
  if (transcript) sections.push(`## Transcript\n\n${transcript}`);
  return `${sections.join("\n\n")}\n`;
}

function sanitizeFilename(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return slug || "note";
}
