import { OfficialComment } from "@/components/document/official-comment";
import type { OfficialComment as OfficialCommentType } from "@/types/comment";

type OfficialCommentsListProps = {
  comments: OfficialCommentType[];
};

export function OfficialCommentsList({ comments }: OfficialCommentsListProps) {
  if (!comments.length) {
    return null;
  }

  return (
    <div className="mt-4 space-y-3">
      {comments.map((comment) => (
        <OfficialComment key={comment.id} comment={comment} />
      ))}
    </div>
  );
}
