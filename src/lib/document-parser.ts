import { readFileSync } from "node:fs";
import path from "node:path";
import type { DocumentBlock, DocumentContent, DocumentItem } from "@/types/document";

const DOCUMENT_PATH = path.join(process.cwd(), "src/content/documento.md");

function createBlock(id: string, title?: string): DocumentBlock {
  return { id, title, items: [] };
}

function normalizeText(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function normalizeBlockText(lines: string[]) {
  return lines
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .join("\n");
}

function parseAttributes(lines: string[]) {
  const attributes: Record<string, string | string[]> = {};
  let pendingListKey: string | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed === "---") {
      pendingListKey = null;
      continue;
    }

    if (trimmed.startsWith("- ")) {
      const listKey = pendingListKey ?? Object.keys(attributes).pop() ?? null;
      if (listKey) {
        const current = Array.isArray(attributes[listKey]) ? attributes[listKey] : [];
        attributes[listKey] = [...current, trimmed.replace(/^-\s*/, "")];
      }
      continue;
    }

    const match = trimmed.match(/^([a-zA-Z0-9_-]+)\s*:\s*(.*)$/);
    if (!match) {
      pendingListKey = null;
      continue;
    }

    const key = match[1].toLowerCase();
    const value = match[2].trim();

    if (value === "") {
      attributes[key] = [];
      pendingListKey = key;
      continue;
    }

    attributes[key] = value;
    pendingListKey = null;
  }

  return attributes;
}

function safeNumber(value: string | string[] | undefined, fallback = 0) {
  const numericValue = Number(value ?? fallback);
  return Number.isFinite(numericValue) ? numericValue : fallback;
}

function getStringAttribute(attributes: Record<string, string | string[]>, key: string, fallback = "") {
  const value = attributes[key];
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value) && value.length > 0) {
    return value[0];
  }

  return fallback;
}

function getStringArrayAttribute(attributes: Record<string, string | string[]>, key: string) {
  const value = attributes[key];
  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === "string") {
    return [value];
  }

  return [];
}

function parseBlock(
  lines: string[],
  startIndex: number,
  parentAuthor = "",
  parentType: "comment" | "reply" | null = null,
): { item: DocumentItem | null; nextIndex: number } {
  const opening = lines[startIndex]?.trim();
  const markerMatch = opening?.match(/^:::(comment|reply|editor-note|removed|anomaly-discussion)$/i);

  if (!markerMatch) {
    return { item: null, nextIndex: startIndex + 1 };
  }

  const kind = markerMatch[1].toLowerCase();
  let index = startIndex + 1;
  const metadataLines: string[] = [];

  if (index < lines.length && lines[index].trim() === "---") {
    index += 1;
    while (index < lines.length && lines[index].trim() !== "---") {
      metadataLines.push(lines[index]);
      index += 1;
    }

    if (index < lines.length && lines[index].trim() === "---") {
      index += 1;
    }
  }

  const attributes = parseAttributes(metadataLines);
  const bodyLines: string[] = [];
  const childItems: DocumentItem[] = [];
  const currentAuthor = getStringAttribute(attributes, "author", kind === "reply" ? "Resposta" : "Comentário");

  while (index < lines.length) {
    const trimmed = lines[index].trim();

    if (trimmed === ":::") {
      break;
    }

    const nestedMatch = trimmed.match(/^:::(comment|reply|editor-note|removed|anomaly-discussion)$/i);
    if (nestedMatch) {
      const nestedKind = nestedMatch[1].toLowerCase();
      const nested = parseBlock(lines, index, currentAuthor, kind === "reply" ? "reply" : "comment");
      if (nested.item) {
        if (kind === "anomaly-discussion" && nestedKind === "comment") {
          childItems.push(nested.item);
        } else if ((kind === "comment" || kind === "reply") && (nestedKind === "comment" || nestedKind === "reply")) {
          childItems.push(nested.item);
        }
      }
      index = nested.nextIndex;
      continue;
    }

    bodyLines.push(lines[index]);
    index += 1;
  }

  const text = normalizeBlockText(bodyLines);

  let item: DocumentItem;

  switch (kind) {
    case "editor-note":
      item = {
        id: "",
        type: "editor-note",
        text,
      };
      break;
    case "removed":
      item = {
        id: "",
        type: "removed",
      };
      break;
    case "comment":
    case "reply":
      item = {
        id: "",
        type: kind === "reply" ? "reply" : "comment",
        text,
        author: currentAuthor,
        likes: safeNumber(getStringAttribute(attributes, "likes", "0")),
        likedBy: getStringArrayAttribute(attributes, "likedby"),
        edited: getStringAttribute(attributes, "edited", "false") === "true",
        editedBy: getStringAttribute(attributes, "editedby", "") || undefined,
        replies: childItems,
        replyTo: kind === "reply" && parentType === "reply" ? parentAuthor : undefined,
        status: getStringAttribute(attributes, "status") === "deleted" ? "deleted" : getStringAttribute(attributes, "status") === "deleted-by-editor" ? "deleted-by-editor" : "approved",
        isOwnComment: currentAuthor.toLowerCase() === "relator",
      };
      break;
    case "anomaly-discussion":
      item = {
        id: "",
        type: "anomaly-discussion",
        title: getStringAttribute(attributes, "title", "Discussão"),
        description: getStringAttribute(attributes, "description", ""),
        comments: childItems,
      };
      break;
    default:
      item = {
        id: "",
        type: "paragraph",
        text,
      };
  }

  return {
    item,
    nextIndex: index + 1,
  };
}

function findLastCommentItem(items: DocumentItem[]): DocumentItem | null {
  for (let index = items.length - 1; index >= 0; index -= 1) {
    const item = items[index];
    if (item.type === "comment") {
      return item;
    }
  }

  return null;
}

function assignNestedIds(node: DocumentItem, baseId: string) {
  if (!node.replies || !node.replies.length) {
    return;
  }

  for (let i = 0; i < node.replies.length; i += 1) {
    const child = node.replies[i];
    const childId = `${baseId}-r${i + 1}`;
    child.id = childId;
    assignNestedIds(child, childId);
  }
}

export function parseDocumentMarkdown(sourceText?: string): DocumentContent {
  const source = sourceText ?? readFileSync(DOCUMENT_PATH, "utf8");
  const lines = source.split(/\r?\n/);

  const blocks: DocumentBlock[] = [];
  let currentBlock = createBlock("document-body");
  let pendingParagraph: string[] = [];

  const flushParagraph = () => {
    if (!pendingParagraph.length) {
      return;
    }

    currentBlock.items.push({
      id: `${currentBlock.id}-${currentBlock.items.length + 1}`,
      type: "paragraph",
      text: normalizeText(pendingParagraph.join(" ")),
    });
    pendingParagraph = [];
  };

  const pushBlock = () => {
    if (!currentBlock.items.length) {
      return;
    }

    blocks.push(currentBlock);
    currentBlock = createBlock(`document-block-${blocks.length + 1}`);
  };

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];
    const trimmed = line.trim();

    if (!trimmed) {
      flushParagraph();
      continue;
    }

    if (/^#{1,6}\s+/.test(trimmed)) {
      flushParagraph();
      const title = trimmed.replace(/^#{1,6}\s+/, "");
      pushBlock();
      currentBlock = createBlock(`document-block-${blocks.length + 1}`, title);
      continue;
    }

    if (trimmed === "---") {
      flushParagraph();
      currentBlock.items.push({
        id: `${currentBlock.id}-${currentBlock.items.length + 1}`,
        type: "divider",
      });
      continue;
    }

    const topLevelReplyMatch = trimmed.match(/^:::(reply)$/i);
    if (topLevelReplyMatch) {
      flushParagraph();
      const parsed = parseBlock(lines, index);
      if (parsed.item?.type === "reply") {
        const assignedId = `${currentBlock.id}-${currentBlock.items.length + 1}`;
        const withId = { ...parsed.item, id: assignedId };
        assignNestedIds(withId, assignedId);

        const parentComment = findLastCommentItem(currentBlock.items);
        if (parentComment) {
          parentComment.replies = [...(parentComment.replies ?? []), withId];
        } else {
          currentBlock.items.push(withId);
        }

        index = parsed.nextIndex - 1;
      }
      continue;
    }

    const blockMatch = trimmed.match(/^:::(comment|editor-note|removed|anomaly-discussion)$/i);
    if (blockMatch) {
      flushParagraph();
      const parsed = parseBlock(lines, index);
      if (parsed.item) {
        const assignedId = `${currentBlock.id}-${currentBlock.items.length + 1}`;
        const withId = { ...parsed.item, id: assignedId };
        assignNestedIds(withId, assignedId);
        currentBlock.items.push(withId);
        index = parsed.nextIndex - 1;
      }
      continue;
    }

    pendingParagraph.push(normalizeText(trimmed));
  }

  flushParagraph();
  pushBlock();

  return {
    title: "A Casa da Memória",
    subtitle: "Um documento em construção para uma leitura contemplativa",
    author: "Luiz",
    date: "11 de julho de 2026",
    blocks: blocks.length ? blocks : [createBlock("document-body")],
  };
}
