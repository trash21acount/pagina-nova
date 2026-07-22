"use client";

import { useState } from "react";
import { BanterLoader } from "./banter-loader";

type RegisterFormProps = {
  onBack: () => void;
  onSwitchToLogin: () => void;
};

export function RegisterForm({ onBack, onSwitchToLogin }: RegisterFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, confirmPassword, reason }),
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error ?? "Falha ao cadastrar.");
      }

      setSuccess("Cadastro realizado. Sua conta está pendente de aprovação.");
      setUsername("");
      setPassword("");
      setConfirmPassword("");
      setReason("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao cadastrar.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative z-[2] flex w-full flex-col">
      <div className="mb-7 text-center">
      <div className="mx-auto mb-4 flex h-[3.2em] w-[3.2em] items-center justify-center">
        <BanterLoader />
      </div>
        <div className="text-[22px] font-medium tracking-[-0.02em] text-white">Criar Conta</div>
        <p className="mt-2 text-[13px] font-normal text-white/60">Preencha os campos para criar sua conta.</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input id="register-username" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="Nome de usuário" className="w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-[1.2em] py-[1.05em] text-[14px] text-white placeholder:text-white/40 outline-none backdrop-blur-[10px] transition-all duration-300 focus:-translate-y-[2px] focus:border-white/25 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(0,170,255,0.18)]" />
        </div>

        <div className="relative">
          <input id="register-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Senha" className="w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-[1.2em] py-[1.05em] text-[14px] text-white placeholder:text-white/40 outline-none backdrop-blur-[10px] transition-all duration-300 focus:-translate-y-[2px] focus:border-white/25 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(0,170,255,0.18)]" />
        </div>

        <div className="relative">
          <input id="register-confirm-password" type="password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} placeholder="Confirmar senha" className="w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-[1.2em] py-[1.05em] text-[14px] text-white placeholder:text-white/40 outline-none backdrop-blur-[10px] transition-all duration-300 focus:-translate-y-[2px] focus:border-white/25 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(0,170,255,0.18)]" />
        </div>

        <div className="relative">
          <textarea id="register-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="Motivo do cadastro" className="min-h-20 w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-[1.2em] py-[1.05em] text-[14px] text-white placeholder:text-white/40 outline-none backdrop-blur-[10px] transition-all duration-300 focus:-translate-y-[2px] focus:border-white/25 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(0,170,255,0.18)]" />
        </div>
      </div>

      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}
      {success ? <p className="mt-2 text-xs text-emerald-300">{success}</p> : null}

      <div className="mt-5 flex flex-col gap-3">
        <button type="button" onClick={handleSubmit} disabled={isSubmitting} className="w-full rounded-[12px] border border-white/20 bg-white/[0.90] px-4 py-[1em] text-[14.5px] font-medium text-[#040405] backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-[2px] hover:bg-white hover:shadow-[0_8px_20px_rgba(255,255,255,0.12)] disabled:opacity-50">
          {isSubmitting ? "Cadastrando..." : "Criar conta"}
        </button>
        <button type="button" onClick={onBack} className="w-full rounded-[12px] border border-white/10 bg-transparent px-4 py-[0.95em] text-[14px] text-white/70 transition-all duration-300 hover:bg-white/[0.04] hover:text-white">
          Voltar
        </button>
      </div>

      <div className="mt-5 text-center text-[13px] text-white/50">
        Já possui conta?
        <button type="button" onClick={onSwitchToLogin} className="ml-1 font-medium text-white transition hover:text-white/80">
          Entrar
        </button>
      </div>
    </div>
  );
}
