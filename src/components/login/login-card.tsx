"use client";

import { useEffect } from "react";
import { useLogin } from "@/hooks/use-login";
import { UserStatus } from "@/components/login/user-status";
import { subscribeToLoginFocus } from "@/lib/login-focus";

export function LoginCard() {
  const { user, isAuthenticated, openLoginModal, handleLogout } = useLogin();
  const isAdmin = Boolean(user?.permissions?.includes("admin:access"));

  useEffect(() => {
    const unsubscribe = subscribeToLoginFocus(() => {
      openLoginModal();
    });

    return unsubscribe;
  }, [openLoginModal]);

  if (isAuthenticated && user) {
    return <UserStatus name={user.name} onLogout={handleLogout} isAdmin={isAdmin} />;
  }

  return (
    <div className="flex min-h-[7.5rem] w-full max-w-[270px] flex-col justify-between rounded-[1.4rem] border border-white/10 bg-zinc-950/85 p-4 shadow-[0_16px_50px_rgba(0,0,0,0.24)] backdrop-blur">
      <button
        type="button"
        onClick={() => openLoginModal()}
        className="mt-4 rounded-full border border-zinc-700 px-4 py-2 text-sm font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-900"
      >
        Fazer login
      </button>
    </div>
  );
}
