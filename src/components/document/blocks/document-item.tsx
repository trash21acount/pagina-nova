import { DividerBlock } from "@/components/document/blocks/divider-block";
import { DocumentCommentBlock } from "@/components/document/blocks/document-comment-block";
import { EditorNoteBlock } from "@/components/document/blocks/editor-note-block";
import { ParagraphBlock } from "@/components/document/blocks/paragraph-block";
import { DefaultBlock } from "@/components/document/blocks/default-block";
import { RemovedBlock } from "@/components/document/removed-block";
import { AnomalyDiscussionBlock } from "@/components/document/blocks/anomaly-discussion-block";
import type { DocumentItem } from "@/types/document";

type DocumentItemProps = {
  blockId: string;
  item: DocumentItem;
};

export function DocumentItemRenderer({ blockId, item }: DocumentItemProps) {
  switch (item.type) {
    case "paragraph":
      return <ParagraphBlock blockId={blockId} item={item} />;
    case "editor-note":
      return <EditorNoteBlock item={item} />;
    case "comment":
    case "reply":
      return <DocumentCommentBlock blockId={blockId} item={item} />;
    case "removed":
      return <RemovedBlock />;
    case "anomaly-discussion":
      return <AnomalyDiscussionBlock item={item} />;
    case "divider":
      return <DividerBlock />;
    case "title":
      return <h2 className="text-2xl font-semibold text-white">{item.text}</h2>;
    case "subtitle":
      return <p className="text-lg leading-8 text-zinc-300">{item.text}</p>;
    case "official-comment":
      return <DefaultBlock item={{ ...item, text: item.text ?? "Comentário oficial" }} />;
    case "removed-comment":
      return <DefaultBlock item={{ ...item, text: item.text ?? "Comentário removido" }} />;
    case "chat":
      return <DefaultBlock item={{ ...item, text: item.speaker ? `${item.speaker}: ${item.text}` : item.text ?? "Conversa" }} />;
    case "excerpt":
      return <DefaultBlock item={{ ...item, text: item.text ?? "Trecho preservado" }} />;
    default:
      return <DefaultBlock item={item} />;
  }
}
