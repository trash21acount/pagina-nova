"use client";

import { DocumentItemRenderer } from "@/components/document/blocks/document-item";
import type { DocumentBlock as DocumentBlockType } from "@/types/document";

type DocumentBlockProps = {
  block: DocumentBlockType;
};

export function DocumentBlock({ block }: DocumentBlockProps) {
  return (
    <section className="mb-10" id={block.id}>
      {block.title ? (
        <h2 className="mb-5 text-2xl font-semibold text-white">{block.title}</h2>
      ) : null}

      <div className="space-y-5">
        {block.items.map((item) => (
          <div key={item.id}>
            <DocumentItemRenderer blockId={block.id} item={item} />
          </div>
        ))}
      </div>
    </section>
  );
}
