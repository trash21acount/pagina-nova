"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { useLogin } from "@/hooks/use-login";

type AppView = "landing" | "document" | "loading" | "unknown";

type AppShellContextValue = {
  currentView: AppView;
  isLandingView: boolean;
  isDocumentView: boolean;
  isLoadingView: boolean;
  setView: (view: AppView) => void;
};

type AppShellProps = {
  children: ReactNode;
  className?: string;
};

const AppShellContext = createContext<AppShellContextValue | null>(null);

export function AppShell({ children, className = "" }: AppShellProps) {
  const { isAuthenticated, phase } = useLogin();

  const currentView = useMemo<AppView>(() => {
    if (phase === "loading") {
      return "loading";
    }

    if (phase === "document" || isAuthenticated) {
      return "document";
    }

    return "landing";
  }, [isAuthenticated, phase]);

  const value = useMemo<AppShellContextValue>(() => ({
    currentView,
    isLandingView: currentView === "landing",
    isDocumentView: currentView === "document",
    isLoadingView: currentView === "loading",
    setView: () => undefined,
  }), [currentView]);

  return (
    <AppShellContext.Provider value={value}>
      <div className={`contents ${className}`.trim()} data-app-shell="true" data-view={currentView}>
        {children}
      </div>
    </AppShellContext.Provider>
  );
}

export function useAppShell() {
  const context = useContext(AppShellContext);

  if (!context) {
    return {
      currentView: "unknown" as AppView,
      isLandingView: false,
      isDocumentView: false,
      isLoadingView: false,
      setView: () => undefined,
    };
  }

  return context;
}
