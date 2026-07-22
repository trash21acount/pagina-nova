import { BanterLoader } from "./banter-loader";

type LoginFormProps = {
  title: string;
  description: string;
  userIdInput: string;
  passwordInput: string;
  error: string;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: () => void;
  onClose: () => void;
  onSwitchToRegister: () => void;
};

export function LoginForm({ title, description, userIdInput, passwordInput, error, onUsernameChange, onPasswordChange, onLogin, onClose, onSwitchToRegister }: LoginFormProps) {
  return (
    <div className="relative z-[2] flex w-full flex-col">
      <div className="mb-7 text-center">
      <div className="mx-auto mb-4 flex h-[3.2em] w-[3.2em] items-center justify-center">
        <BanterLoader />
      </div>
        <div className="text-[22px] font-medium tracking-[-0.02em] text-white">{title}</div>
        <p className="mt-2 text-[13px] font-normal text-white/60">{description}</p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            id="username"
            type="text"
            placeholder="Usuário"
            value={userIdInput}
            onChange={(event) => onUsernameChange(event.target.value)}
            className="w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-[1.2em] py-[1.05em] text-[14px] text-white placeholder:text-white/40 outline-none backdrop-blur-[10px] transition-all duration-300 focus:-translate-y-[2px] focus:border-white/25 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(0,170,255,0.18)]"
          />
        </div>

        <div className="relative">
          <input
            id="password"
            type="password"
            placeholder="Senha"
            value={passwordInput}
            onChange={(event) => onPasswordChange(event.target.value)}
            className="w-full rounded-[12px] border border-white/10 bg-white/[0.03] px-[1.2em] py-[1.05em] text-[14px] text-white placeholder:text-white/40 outline-none backdrop-blur-[10px] transition-all duration-300 focus:-translate-y-[2px] focus:border-white/25 focus:bg-white/[0.06] focus:shadow-[0_0_20px_rgba(0,170,255,0.18)]"
          />
        </div>
      </div>

      <div className="mt-5 flex justify-end">
        <div className="group relative z-[60] inline-flex">
          <button type="button" className="relative z-[61] text-[12px] text-white/60 transition hover:text-white">
            Esqueceu sua senha?
          </button>
          <span className="pointer-events-none absolute left-1/2 top-full z-[62] mt-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-white/10 bg-[#040405]/95 px-3 py-1.5 text-[11px] text-white/70 shadow-[0_8px_20px_rgba(0,0,0,0.35)] opacity-0 translate-y-1 transition-all duration-200 group-hover:opacity-100 group-hover:translate-y-0">
            Esqueceu? Ué, problema seu! kkkk
          </span>
        </div>
      </div>

      {error ? <p className="mt-2 text-xs text-rose-300">{error}</p> : null}

      <div className="mt-5 flex flex-col gap-3">
        <button type="button" onClick={onLogin} className="w-full rounded-[12px] border border-white/20 bg-white/[0.90] px-4 py-[1em] text-[14.5px] font-medium text-[#040405] backdrop-blur-[10px] transition-all duration-300 hover:-translate-y-[2px] hover:bg-white hover:shadow-[0_8px_20px_rgba(255,255,255,0.12)]">
          Entrar
        </button>
        <button type="button" onClick={onClose} className="w-full rounded-[12px] border border-white/10 bg-transparent px-4 py-[0.95em] text-[14px] text-white/70 transition-all duration-300 hover:bg-white/[0.04] hover:text-white">
          Cancelar
        </button>
      </div>

      <div className="mt-5 text-center text-[13px] text-white/50">
        Não tem conta?
        <button type="button" onClick={onSwitchToRegister} className="ml-1 font-medium text-white transition hover:text-white/80">
          Criar conta
        </button>
      </div>
    </div>
  );
}
