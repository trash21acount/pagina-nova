"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useLogin } from "@/hooks/use-login";
import { LoginForm } from "@/components/login/login-form";
import { RegisterForm } from "@/components/login/register-form";
import { useScrollLock } from "@/lib/scroll-lock";

export function LoginModal() {
  const [isMounted, setIsMounted] = useState(false);
  const { userIdInput, passwordInput, setUserIdInput, setPasswordInput, error, isLoginModalOpen, loginMessage, loginModalMode, loginModalOrigin, setLoginModalMode, closeLoginModal, handleLogin } = useLogin();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isLoginModalOpen) {
      return undefined;
    }

    const cleanupScrollLock = useScrollLock(true);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeLoginModal();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      cleanupScrollLock?.();
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [closeLoginModal, isLoginModalOpen]);

  const switchMode = (nextMode: "login" | "register") => {
    if (loginModalMode === nextMode) {
      return;
    }

    setLoginModalMode(nextMode);
  };

  const handleRegisterBack = () => {
    if (loginModalOrigin === "landing") {
      closeLoginModal();
      return;
    }

    switchMode("login");
  };

  const handleSwitchToLogin = () => {
    switchMode("login");
  };

  if (!isMounted) {
    return null;
  }

  return createPortal(
    <>
      <div
        className={`fixed inset-0 z-[999] flex items-center justify-center bg-[rgba(6,6,6,0.72)] px-4 py-8 backdrop-blur-[16px] transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isLoginModalOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
        onMouseDown={closeLoginModal}
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.06),transparent_72%)] opacity-70 blur-[24px]" />
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="login-modal-title"
          className={`relative w-full max-w-[360px] overflow-visible rounded-[28px] border border-white/10 bg-[#040405]/90 p-8 shadow-[0_24px_48px_rgba(0,0,0,0.24),0_8px_16px_rgba(0,0,0,0.16)] transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${isLoginModalOpen ? "scale-100 opacity-100 blur-0" : "scale-[0.96] opacity-0 blur-[14px]"}`}
          onMouseDown={(event) => event.stopPropagation()}
        >
          <div className="absolute top-[-30px] right-[-30px] h-[170px] w-[170px] rounded-full bg-[rgba(0,170,255,0.16)] opacity-70 blur-[48px]" />
          <div className="absolute bottom-[-50px] left-[-50px] h-[210px] w-[210px] rounded-full bg-[rgba(255,255,255,0.08)] opacity-70 blur-[48px]" />
          <div className="absolute inset-0 rounded-[inherit] bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.04)_0%,transparent_72%)]" />
          <div className="relative z-[2]">
            <div className="w-full">
              {loginModalMode === "login" ? (
                <LoginForm
                  title="Entrar"
                  description={loginMessage}
                  userIdInput={userIdInput}
                  passwordInput={passwordInput}
                  error={error}
                  onUsernameChange={setUserIdInput}
                  onPasswordChange={setPasswordInput}
                  onLogin={handleLogin}
                  onClose={closeLoginModal}
                  onSwitchToRegister={() => switchMode("register")}
                />
              ) : (
                <RegisterForm onBack={handleRegisterBack} onSwitchToLogin={handleSwitchToLogin} />
              )}
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
}
