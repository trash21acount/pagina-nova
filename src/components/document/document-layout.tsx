"use client";

import { LoginCard } from "@/components/login/login-card";
import { DocumentHeader } from "@/components/document/document-header";
import { DocumentBody } from "@/components/document/document-body";
import type { DocumentContent } from "@/types/document";

type DocumentLayoutProps = {
  content: DocumentContent;
};

export function DocumentLayout({ content }: DocumentLayoutProps) {
  return (
    <div className="document-texture-surface relative isolate min-h-screen bg-transparent text-zinc-100">
      <header className="relative z-20 border-b border-white/10 bg-black/70 backdrop-blur-xl">
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-x-0 top-0 h-full bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.04),transparent_70%)] blur-[40px]" />
        </div>
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-sm font-medium tracking-[0.25em] text-zinc-400 uppercase">
            Projeto Documento
          </div>
          <div className="flex justify-end">
            <LoginCard />
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-4xl flex-col px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <DocumentHeader content={content} />
        <DocumentBody content={content} />
      </main>
    </div>
  );
}
