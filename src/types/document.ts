export type DocumentItemType =
  | "paragraph"
  | "editor-note"
  | "comment"
  | "reply"
  | "removed"
  | "anomaly-discussion"
  | "official-comment"
  | "removed-comment"
  | "chat"
  | "excerpt"
  | "divider"
  | "title"
  | "subtitle";

export type DocumentItem = {
  id: string;
  type: DocumentItemType;
  text?: string;
  speaker?: string;
  author?: string;
  likes?: number;
  likedBy?: string[];
  edited?: boolean;
  editedBy?: string;
  editorLocked?: boolean;
  originalContent?: string | null;
  deletedAt?: string;
  deletedBy?: string;
  title?: string;
  description?: string;
  comments?: DocumentItem[];
  replies?: DocumentItem[];
  replyTo?: string;
  status?: "approved" | "deleted" | "deleted-by-editor";
  isOwnComment?: boolean;
};

export type DocumentBlock = {
  id: string;
  title?: string;
  items: DocumentItem[];
};

export type DocumentContent = {
  title: string;
  subtitle: string;
  author: string;
  date: string;
  blocks: DocumentBlock[];
};
