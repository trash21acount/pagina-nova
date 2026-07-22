export type DiscussionNode = {
  replies?: DiscussionNode[];
};

export function countDiscussionComments(comments: DiscussionNode[]): number {
  return comments.reduce((total, comment) => total + 1 + countDiscussionComments(comment.replies ?? []), 0);
}
