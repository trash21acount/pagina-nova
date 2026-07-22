import { EditorNote } from "@/components/document/editor-note";
import type { DocumentItem } from "@/types/document";

type EditorNoteBlockProps = {
  item: DocumentItem;
};

export function EditorNoteBlock({ item }: EditorNoteBlockProps) {
  return <EditorNote content={item.text ?? ""} />;
}
