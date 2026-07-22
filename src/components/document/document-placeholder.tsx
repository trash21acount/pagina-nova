import { PanelCard } from "@/components/ui/panel-card";

export function DocumentPlaceholder() {
  return (
    <PanelCard className="w-full max-w-2xl text-center">
      <p className="text-[0.7rem] font-semibold uppercase tracking-[0.35em] text-zinc-500">
        Em desenvolvimento
      </p>

      <h1 className="mt-5 text-3xl font-semibold tracking-tight text-white sm:text-4xl">
        TEXTO EM DESENVOLVIMENTO
      </h1>

      <p className="mt-4 text-base leading-7 text-zinc-300 sm:text-lg">
        O documento narrado será implementado nas próximas etapas com uma leitura mais rica e envolvente.
      </p>
    </PanelCard>
  );
}
