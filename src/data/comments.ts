import type { OfficialComment } from "@/types/comment";

export const officialComments: OfficialComment[] = [
  {
    id: "official-1",
    paragraphId: "intro-intro-1",
    author: {
      id: "luiz",
      name: "Luiz",
      role: "Editor",
      accent: "border-slate-400/40 text-slate-300",
      badgeLabel: "Editor",
    },
    text: "Mantive este trecho a pedido do Relator, mas ainda quero que a cadência fique mais fluida.",
  },
  {
    id: "official-2",
    paragraphId: "intro-intro-2",
    author: {
      id: "relator",
      name: "Relator",
      role: "Autor",
      accent: "border-sky-400/40 text-sky-300",
      badgeLabel: "Autor",
    },
    text: "Este parágrafo deveria continuar com a mesma sensação de permanência.",
  },
  {
    id: "official-3",
    paragraphId: "reflection-reflection-1",
    author: {
      id: "anomalia-2",
      name: "Anomalia 2",
      role: "Anomalia",
      accent: "border-amber-400/40 text-amber-300",
    },
    text: "A ideia de deslocamento parece estar muito bem alinhada com o restante do texto.",
  },
  {
    id: "official-4",
    paragraphId: "closing-closing-1",
    author: {
      id: "anomalia-4",
      name: "Anomalia 4",
      role: "Anomalia",
      accent: "border-rose-500/40 text-rose-300",
    },
    text: "A conclusão ainda precisa de um acabamento mais tênue.",
  },
];
