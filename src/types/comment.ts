export type PendingComment = {
  id: string;
  paragraphId: string;
  authorName: string;
  text: string;
  createdAt: number;
};

export type OfficialComment = {
  id: string;
  paragraphId: string;
  author: {
    id: string;
    name: string;
    role: string;
    accent: string;
    badgeLabel?: string;
  };
  text: string;
};
