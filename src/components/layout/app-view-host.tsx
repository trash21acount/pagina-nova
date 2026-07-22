"use client";

import { memo, type ReactNode } from "react";
import { useAppShell } from "./app-shell";

type AppViewHostProps = {
  children: ReactNode;
  view?: "landing" | "document" | "loading" | "unknown";
  className?: string;
};

export const AppViewHost = memo(function AppViewHost({ children, view, className = "" }: AppViewHostProps) {
  const { currentView } = useAppShell();
  const resolvedView = view ?? currentView;

  return (
    <div className={`contents ${className}`.trim()} data-view={resolvedView}>
      {children}
    </div>
  );
});
