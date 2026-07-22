import { DocumentBlock } from "@/components/document/document-block";
import type { DocumentContent } from "@/types/document";

type DocumentBodyProps = {
  content: DocumentContent;
};

export function DocumentBody({ content }: DocumentBodyProps) {
  return (
    <div className="space-y-2">
      {content.blocks.map((block) => (
        <DocumentBlock key={block.id} block={block} />
      ))}
    </div>
  );
}
