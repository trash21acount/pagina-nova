"use client";

import { useEffect, useState, type ReactNode } from "react";
import { LoadingExperience } from "@/components/loading/LoadingExperience";
import { runDocumentLoad } from "@/hooks/use-document-load";
import { useLogin } from "@/hooks/use-login";

type HomeShellProps = {
  landingContent: ReactNode;
  documentContent: ReactNode;
  loadingContent?: ReactNode;
};

type LoadingViewState = "hidden" | "visible" | "fading";

export function HomeShell({ landingContent, documentContent, loadingContent = null }: HomeShellProps) {
  const { phase, markLoadingComplete } = useLogin();
  const [loadingState, setLoadingState] = useState<LoadingViewState>(phase === "loading" ? "visible" : "hidden");
  const [progress, setProgress] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (phase === "loading") {
      setLoadingState("visible");
      setProgress(0);
      setActiveIndex(0);

      let isCancelled = false;

      const tasks = [
        {
          label: "Sincronizando anotações...",
          weight: 28,
          run: async () => {
            try {
              await fetch("/api/login", { method: "GET" });
            } catch {
              // Keep the loading flow resilient even if the session check is slow or fails.
            }
          },
        },
        {
          label: "Carregando comentários...",
          weight: 34,
          run: async () => {
            try {
              await fetch("/api/comments?paragraphId=intro-intro-1");
            } catch {
              // Keep the loading flow resilient even if the comments request fails.
            }
          },
        },
        {
          label: "Reconstruindo contexto...",
          weight: 24,
          run: async () => {
            await new Promise((resolve) => {
              requestAnimationFrame(() => {
                requestAnimationFrame(resolve);
              });
            });
          },
        },
        {
          label: "Documento pronto.",
          weight: 14,
          run: async () => {
            await new Promise((resolve) => setTimeout(resolve, 60));
          },
        },
      ];

      void runDocumentLoad(
        tasks,
        (nextProgress, label) => {
          if (isCancelled) {
            return;
          }

          setProgress(nextProgress);
          if (label === "Sincronizando anotações...") {
            setActiveIndex(0);
          } else if (label === "Carregando comentários...") {
            setActiveIndex(1);
          } else if (label === "Reconstruindo contexto...") {
            setActiveIndex(2);
          } else {
            setActiveIndex(3);
          }
        },
        2600,
      )
        .then(() => {
          if (!isCancelled) {
            markLoadingComplete();
          }
        })
        .catch(() => {
          if (!isCancelled) {
            markLoadingComplete();
          }
        });

      return () => {
        isCancelled = true;
      };
    }

    if (phase === "document") {
      setLoadingState("fading");
      return;
    }

    setLoadingState("hidden");
  }, [markLoadingComplete, phase]);

  const isLandingVisible = phase === "landing";
  const isDocumentVisible = phase === "document";

  return (
    <div className="relative isolate min-h-screen overflow-hidden bg-[#040405]">
      <div
        data-testid="home-shell-landing-layer"
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: isLandingVisible ? 1 : 0,
          pointerEvents: isLandingVisible ? "auto" : "none",
        }}
      >
        {landingContent}
      </div>

      {loadingState !== "hidden" ? (
        <div>
          <LoadingExperience
            progress={loadingState === "fading" ? 100 : progress}
            activeIndex={loadingState === "fading" ? 3 : activeIndex}
            isVisible={loadingState === "visible"}
            onExited={() => setLoadingState("hidden")}
          />
          {loadingContent ? <div className="sr-only">{loadingContent}</div> : null}
        </div>
      ) : null}

      <div
        data-testid="home-shell-document-layer"
        className="absolute inset-0 z-10 overflow-y-auto transition-opacity duration-500 [scrollbar-gutter:stable] [webkit-overflow-scrolling:touch]"
        style={{
          opacity: isDocumentVisible ? 1 : 0,
          pointerEvents: isDocumentVisible ? "auto" : "none",
        }}
      >
        {documentContent}
      </div>
    </div>
  );
}
