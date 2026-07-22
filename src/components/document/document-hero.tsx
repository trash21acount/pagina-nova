import Link from "next/link";
import { documentMeta } from "@/data/document";
import { PanelCard } from "@/components/ui/panel-card";

export function DocumentHero() {
  return (
    <PanelCard className="w-full max-w-xl text-center">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-zinc-500">
        Documento narrado
      </p>

      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        {documentMeta.title}
      </h1>

      <p className="mt-4 text-base leading-7 text-zinc-300 sm:text-lg">
        {documentMeta.description}
      </p>

      <div className="mt-8 flex justify-center">
        <Link
          href="/documento"
          className="rounded-full border border-zinc-700 bg-zinc-100 px-6 py-3 text-sm font-medium text-zinc-900 transition duration-200 hover:-translate-y-0.5 hover:bg-white"
        >
          Abrir documento
        </Link>
      </div>
    </PanelCard>
  );
}
