"use client";

import { useState } from "react";
import { MarkdownContent } from "@/components/document/markdown-content";

type DocumentCommentReply = {
  author: string;
  text: string;
};

type DocumentCommentProps = {
  author: string;
  content: string;
  likes?: number;
  replies?: DocumentCommentReply[];
  replyCount?: number;
  status?: "approved";
  isOwnComment?: boolean;
};

export function DocumentComment({
  author,
  content,
  likes = 0,
  replies = [],
  replyCount = 0,
  status = "approved",
  isOwnComment = false,
}: DocumentCommentProps) {
  const [isRepliesOpen, setIsRepliesOpen] = useState(false);
  const [isReplyComposerOpen, setIsReplyComposerOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const hasReplies = replies.length > 0;

  return (
    <article className="group my-4 rounded-3xl border border-white/10 bg-zinc-950/70 p-4 shadow-[0_18px_45px_-24px_rgba(0,0,0,0.9)] transition-all duration-200 hover:border-white/15 hover:bg-zinc-950/80 sm:p-5">
      <div className="flex gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-600 text-sm font-semibold text-zinc-100">
          {author.slice(0, 2).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-[0.95rem] font-semibold text-zinc-100">{author}</h4>

          </div>

          <div className="mt-3 text-[0.95rem] leading-8 text-zinc-300">
            <MarkdownContent content={content} />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-400">
            <button type="button" className="rounded-full border border-white/10 bg-zinc-900/70 px-3 py-1.5 transition hover:border-white/20 hover:text-zinc-200">
              👍 {likes}
            </button>

            <button
              type="button"
              className="rounded-full px-2.5 py-1.5 transition hover:bg-zinc-800 hover:text-zinc-200"
              onClick={() => setIsRepliesOpen((current) => !current)}
            >
              Responder {replyCount > 0 ? `(${replyCount})` : ""}
            </button>

            {isOwnComment ? (
              <div className="flex gap-2 text-zinc-400">
                <button type="button" className="rounded-full px-2.5 py-1.5 transition hover:bg-zinc-800 hover:text-zinc-200">
                  Editar
                </button>
                <button type="button" className="rounded-full px-2.5 py-1.5 transition hover:bg-zinc-800 hover:text-zinc-200">
                  Excluir
                </button>
              </div>
            ) : null}
          </div>

          <div className="mt-3">
            <button
              type="button"
              className="rounded-full px-2.5 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200"
              onClick={() => setIsReplyComposerOpen((current) => !current)}
            >
              Responder
            </button>

            {isReplyComposerOpen ? (
              <div className="mt-3 rounded-2xl border border-white/10 bg-zinc-900/80 p-3">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Adicionar comentário"
                  className="min-h-24 w-full resize-none rounded-xl border border-white/10 bg-zinc-950/80 px-3 py-2 text-sm text-zinc-100 outline-none ring-0"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" onClick={() => setIsReplyComposerOpen(false)} className="rounded-full px-3 py-1.5 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-zinc-200">
                    Cancelar
                  </button>
                  <button type="button" className="rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition hover:bg-white">
                    Publicar
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          {hasReplies ? (
            <div className={`mt-4 space-y-3 border-l border-zinc-800 pl-4 transition-all duration-200 ${isRepliesOpen ? "block" : "hidden"}`}>
              {replies.map((reply, index) => (
                <div key={`${reply.author}-${index}`} className="relative rounded-2xl bg-zinc-900/70 p-3 before:absolute before:left-[-17px] before:top-4 before:h-px before:w-4 before:bg-zinc-800">
                  <p className="text-[0.75rem] font-semibold uppercase tracking-[0.22em] text-zinc-500">
                    {reply.author}
                  </p>
                  <div className="mt-2 text-sm leading-7 text-zinc-300">
                    <MarkdownContent content={reply.text} />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
