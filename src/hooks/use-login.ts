"use client";

import { useCallback, useEffect, useMemo, useSyncExternalStore } from "react";
import { clearStoredUserName, getStoredUserName, setStoredUserName } from "@/lib/storage";
import type { User } from "@/types/user";

type PendingLoginAction = {
  run: () => void;
};

export type LoadingPhase = "landing" | "loading" | "document";

type AuthStoreState = {
  user: User | null;
  userIdInput: string;
  passwordInput: string;
  error: string;
  isLoginModalOpen: boolean;
  phase: LoadingPhase;
  loginMessage: string;
  loginModalMode: "login" | "register";
  loginModalOrigin: "login" | "landing" | null;
  pendingLoginAction: PendingLoginAction | null;
  listeners: Set<() => void>;
};

type AuthSnapshot = {
  user: User | null;
  userIdInput: string;
  passwordInput: string;
  error: string;
  isLoginModalOpen: boolean;
  phase: LoadingPhase;
  loginMessage: string;
  loginModalMode: "login" | "register";
  loginModalOrigin: "login" | "landing" | null;
  pendingLoginAction: PendingLoginAction | null;
};

const authStore: AuthStoreState & { snapshot: AuthSnapshot } = {
  user: null,
  userIdInput: "",
  passwordInput: "",
  error: "",
  isLoginModalOpen: false,
  phase: "landing",
  loginMessage: "Você precisa estar conectado para continuar.",
  loginModalMode: "login",
  loginModalOrigin: null,
  pendingLoginAction: null,
  listeners: new Set(),
  snapshot: {
    user: null,
    userIdInput: "",
    passwordInput: "",
    error: "",
    isLoginModalOpen: false,
    phase: "landing",
    loginMessage: "Você precisa estar conectado para continuar.",
    loginModalMode: "login",
    loginModalOrigin: null,
    pendingLoginAction: null,
  },
};

let hasHydrated = false;

function syncAuthSnapshot() {
  authStore.snapshot = {
    user: authStore.user,
    userIdInput: authStore.userIdInput,
    passwordInput: authStore.passwordInput,
    error: authStore.error,
    isLoginModalOpen: authStore.isLoginModalOpen,
    phase: authStore.phase,
    loginMessage: authStore.loginMessage,
    loginModalMode: authStore.loginModalMode,
    loginModalOrigin: authStore.loginModalOrigin,
    pendingLoginAction: authStore.pendingLoginAction,
  };
}

function emitAuthChange() {
  syncAuthSnapshot();
  for (const listener of authStore.listeners) {
    listener();
  }
}

function getAuthSnapshot() {
  return authStore.snapshot;
}

function subscribeAuth(listener: () => void) {
  authStore.listeners.add(listener);
  return () => authStore.listeners.delete(listener);
}

function updateAuthStore(patch: Partial<Omit<AuthStoreState, "listeners">>) {
  Object.assign(authStore, patch);
  emitAuthChange();
}

function setAuthUser(nextUser: User | null) {
  updateAuthStore({ user: nextUser });
}

function setUserIdInput(nextValue: string) {
  updateAuthStore({ userIdInput: nextValue });
}

function setPasswordInput(nextValue: string) {
  updateAuthStore({ passwordInput: nextValue });
}

function setError(nextValue: string) {
  updateAuthStore({ error: nextValue });
}

function setLoginModalOpen(nextValue: boolean) {
  updateAuthStore({ isLoginModalOpen: nextValue });
}

function setPhase(nextValue: LoadingPhase) {
  updateAuthStore({ phase: nextValue });
}

function setLoginMessage(nextValue: string) {
  updateAuthStore({ loginMessage: nextValue });
}

function setLoginModalMode(nextValue: "login" | "register") {
  updateAuthStore({ loginModalMode: nextValue });
}

function setLoginModalOrigin(nextValue: "login" | "landing" | null) {
  updateAuthStore({ loginModalOrigin: nextValue });
}

function setPendingLoginAction(nextAction: PendingLoginAction | null) {
  updateAuthStore({ pendingLoginAction: nextAction });
}

async function hydrateAuthFromServer() {
  try {
    const response = await fetch("/api/login", { method: "GET" });
    if (!response.ok) {
      return null;
    }

    const payload = await response.json().catch(() => ({}));
    if (!payload?.user) {
      return null;
    }

    return payload.user as User;
  } catch {
    return null;
  }
}

function hydrateAuthFromStorage() {
  const storedUserName = getStoredUserName();

  if (!storedUserName) {
    setAuthUser(null);
    setUserIdInput("");
    setPasswordInput("");
    setError("");
    setLoginModalOpen(false);
    setLoginMessage("Você precisa estar conectado para continuar.");
    setLoginModalOrigin(null);
    setPendingLoginAction(null);
    return;
  }

  setAuthUser({ name: storedUserName, permissions: [] });
}

function resetPhaseToLanding() {
  setPhase("landing");
}

function beginLoadingPhase() {
  setPhase("loading");
}

function completeLoadingPhase() {
  setPhase("document");
}

async function ensureHydrated() {
  if (hasHydrated) {
    return;
  }

  hasHydrated = true;

  const serverUser = await hydrateAuthFromServer();

  if (serverUser) {
    setStoredUserName(serverUser.name);
    setAuthUser(serverUser);
    setUserIdInput("");
    setPasswordInput("");
    setError("");
    setLoginModalOpen(false);
    setLoginMessage("Você precisa estar conectado para continuar.");
    setLoginModalOrigin(null);
    setPendingLoginAction(null);
    return;
  }

  hydrateAuthFromStorage();
}

export function useLogin() {
  const authState = useSyncExternalStore(subscribeAuth, getAuthSnapshot, getAuthSnapshot);
  const user = authState.user;
  const userIdInput = authState.userIdInput;
  const passwordInput = authState.passwordInput;
  const error = authState.error;
  const isLoginModalOpen = authState.isLoginModalOpen;
  const phase = authState.phase;
  const loginMessage = authState.loginMessage;
  const loginModalMode = authState.loginModalMode;
  const loginModalOrigin = authState.loginModalOrigin;
  const pendingLoginAction = authState.pendingLoginAction;

  useEffect(() => {
    void ensureHydrated();
  }, []);

  const isAuthenticated = useMemo(() => Boolean(user), [user]);

  const openLoginModal = useCallback((onSuccess?: () => void, message = "Você precisa estar conectado para continuar.", initialMode: "login" | "register" = "login", origin: "login" | "landing" = "login") => {
    setLoginMessage(message);
    setPendingLoginAction(onSuccess ? { run: onSuccess } : null);
    setLoginModalMode(initialMode);
    setLoginModalOrigin(origin);
    setLoginModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setLoginModalOpen(false);
    setPendingLoginAction(null);
    setLoginMessage("Você precisa estar conectado para continuar.");
    setLoginModalOrigin(null);
    setError("");
  }, []);

  const openLoadingExperience = useCallback(() => {
    beginLoadingPhase();
  }, []);

  const requestLogin = useCallback((onSuccess: () => void, message = "Você precisa estar conectado para continuar.") => {
    openLoginModal(onSuccess, message);
  }, [openLoginModal]);

  const handleLogin = useCallback(async () => {
    const normalizedUsername = userIdInput.trim();
    const normalizedPassword = passwordInput.trim();

    if (!normalizedUsername || !normalizedPassword) {
      setError("Informe usuário e senha.");
      return;
    }

    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username: normalizedUsername, password: normalizedPassword }),
    });

    const payload = await response.json().catch(() => ({}));

    if (!response.ok) {
      setError(payload.error ?? "Credenciais inválidas.");
      return;
    }

    const nextUser = payload.user as User;
    setStoredUserName(nextUser.name);
    setAuthUser(nextUser);
    setError("");
    setUserIdInput("");
    setPasswordInput("");
    setLoginModalOpen(false);
    setLoginModalOrigin(null);
    beginLoadingPhase();

    const currentPendingAction = pendingLoginAction;
    setPendingLoginAction(null);

    if (currentPendingAction) {
      currentPendingAction.run();
    }
  }, [passwordInput, pendingLoginAction, userIdInput]);

  const handleLogout = useCallback(async () => {
    try {
      await fetch("/api/login", { method: "DELETE" });
    } catch {
      // Ignore logout errors and keep the UI consistent.
    }

    clearStoredUserName();
    setAuthUser(null);
    setError("");
    setUserIdInput("");
    setPasswordInput("");
    setLoginModalOpen(false);
    setLoginModalOrigin(null);
    resetPhaseToLanding();
    setPendingLoginAction(null);
  }, []);

  const setInputValue = useCallback((nextValue: string) => {
    setUserIdInput(nextValue);
  }, []);

  const setPasswordValue = useCallback((nextValue: string) => {
    setPasswordInput(nextValue);
  }, []);

  const updateUserDisplayName = useCallback((nextName: string) => {
    if (!user) {
      return;
    }

    setAuthUser({ ...user, name: nextName });
  }, [user]);

  return {
    user,
    userIdInput,
    passwordInput,
    setUserIdInput: setInputValue,
    setPasswordInput: setPasswordValue,
    updateUserDisplayName,
    error,
    isAuthenticated,
    isLoginModalOpen,
    phase,
    loginMessage,
    loginModalMode,
    loginModalOrigin,
    setLoginModalMode,
    openLoginModal,
    closeLoginModal,
    openLoadingExperience,
    markLoadingComplete: completeLoadingPhase,
    markDocumentReady: completeLoadingPhase,
    markTransitionDone: completeLoadingPhase,
    requestLogin,
    handleLogin,
    handleLogout,
  };
}
