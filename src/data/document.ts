import type { DocumentContent } from "@/types/document";

export const documentMeta = {
  title: "O Documento",
  description:
    "Uma leitura contemplativa, organizada para crescer em camadas ao longo das próximas etapas.",
};

export const documentContent: DocumentContent = {
  title: "A Casa da Memória",
  subtitle: "Um documento em construção para uma leitura contemplativa",
  author: "Luiz",
  date: "11 de julho de 2026",
  blocks: [
    {
      id: "intro",
      items: [
        {
          id: "intro-1",
          type: "paragraph",
          text:
            "Há um tipo de silêncio que não se parece com o silêncio comum. Ele não é ausência de som, mas presença de pensamento, como se o mundo tivesse decidido respirar mais fundo antes de continuar.",
        },
        {
          id: "intro-2",
          type: "paragraph",
          text:
            "Neste espaço, a leitura se torna uma forma de permanência. Cada parágrafo é um gesto delicado, e cada bloco é uma etapa de uma memória que ainda não terminou de se dizer.",
        },
      ],
    },
    {
      id: "reflection",
      title: "Reflexão",
      items: [
        {
          id: "reflection-1",
          type: "paragraph",
          text:
            "O que se mantém, mesmo quando tudo parece se deslocar, não é apenas a lembrança, mas a maneira como ela se organiza dentro de nós. A estrutura do texto, como a estrutura do tempo, não precisa ser imediata para ser verdadeira.",
        },
        {
          id: "reflection-2",
          type: "paragraph",
          text:
            "Por isso, o documento não busca apenas informar. Ele se propõe a permanecer, como um objeto leve que pode ser revisitado sem perder sua forma original.",
        },
      ],
    },
    {
      id: "closing",
      title: "Encerramento",
      items: [
        {
          id: "closing-1",
          type: "paragraph",
          text:
            "O leitor que chegar até aqui encontrará um texto preparado para crescer. Cada nova etapa poderá acrescentar camadas, conexões e vozes sem quebrar o que já existe.",
        },
      ],
    },
  ],
};
