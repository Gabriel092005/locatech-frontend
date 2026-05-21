import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/lib/axios";
import { usuarioAutenticado } from "@/lib/auth";

type LoginStatus = "idle" | "loading" | "error";

function ISpinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeDasharray="30 10" />
    </svg>
  );
}

function IEye({ className = "w-4 h-4", open = true }: { className?: string; open?: boolean }) {
  return open ? (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

function ILock({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

function IMail({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}

function LocaTechLogo() {
  return (
    <div className="flex flex-col items-center gap-1 select-none">
      <div className="relative w-12 h-12 sm:w-14 sm:h-14 bg-[#0d1b3e] rounded-2xl flex items-center justify-center shadow-lg shadow-[#0d1b3e]/30">
        <svg viewBox="0 0 32 32" className="w-7 h-7 sm:w-8 sm:h-8 fill-white">
          <path d="M16 3 C16 3 7 14 7 20 C7 24.97 11.03 29 16 29 C20.97 29 25 24.97 25 20 C25 14 16 3 16 3Z" />
          <circle cx="22" cy="11" r="3" className="fill-[#edf0f4]/40" />
        </svg>
      </div>
      <div className="text-center">
        <p className="font-black text-xl sm:text-2xl text-[#0d1b3e] tracking-tight leading-none">
          Loca<span className="text-[#2d3d6b]">Tech</span>
        </p>
        <p className="text-[9px] sm:text-[10px] font-semibold text-slate-400 tracking-widest uppercase mt-0.5">
          Combustível &amp; Gás
        </p>
      </div>
    </div>
  );
}

function Field({
  icon,
  label,
  name,
  type,
  placeholder,
  value,
  onChange,
  suffix,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  name: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  suffix?: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] sm:text-[12px] font-bold text-slate-500 uppercase tracking-wider pl-1">
        {label}
      </label>
      <div className="relative">
        <span className="absolute left-3 sm:left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
          {icon}
        </span>
        <input
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          disabled={disabled}
          className="w-full bg-white border border-slate-200 rounded-xl pl-9 sm:pl-10 pr-9 sm:pr-10 py-3
                     text-[13px] sm:text-[13.5px] text-slate-700 placeholder-slate-400
                     outline-none focus:border-[#0d1b3e] focus:ring-2 focus:ring-[#0d1b3e]/10
                     disabled:opacity-60 transition-all"
        />
        {suffix && (
          <span className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPass, setShowPass] = useState(false);
  const [status, setStatus] = useState<LoginStatus>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [jaAutenticado, setJaAutenticado] = useState(false);

  useEffect(() => {
    setJaAutenticado(usuarioAutenticado());
  }, []);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!form.email.trim() || !form.password.trim()) {
      setErrorMsg("Preenche todos os campos.");
      setStatus("error");
      return;
    }
    setStatus("loading");
    setErrorMsg("");
    try {
      const { data } = await api.post("/sessions", {
        email: form.email.trim(),
        password: form.password,
      });
      localStorage.setItem("token", data.token);
      
      // Decodificar o token para obter a role
      try {
        const payload = JSON.parse(atob(data.token.split('.')[1]));
        const role = payload.role;
        
        // Todos redirecionam para /dashboard (unificado)
        window.location.href = "/dashboard";
      } catch {
        window.location.href = "/dashboard";
      }
    } catch (err: any) {
      setStatus("error");
      setErrorMsg(
        err?.response?.data?.message ?? "E-mail ou palavra-passe incorrectos."
      );
    }
  }

  const isLoading = status === "loading";

  if (jaAutenticado) {
    return (
      <div className="min-h-screen bg-[#edf0f4] flex flex-col">
        <div className="h-1.5 bg-gradient-to-r from-[#0d1b3e] via-[#2d3d6b] to-[#0d1b3e]" />
        <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
          <div className="w-full max-w-[400px] flex flex-col items-center gap-6 text-center">
            <LocaTechLogo />
            <div className="bg-[#dde1e7] rounded-2xl px-8 py-10 shadow-sm flex flex-col items-center gap-5 w-full">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <h1 className="font-black text-xl sm:text-2xl text-slate-900">
                Já estás autenticado
              </h1>
              <p className="text-sm text-slate-500">
                A tua sessão ainda está ativa. Podes ir directamente para o painel.
              </p>
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full bg-[#0d1b3e] hover:bg-[#162251] text-white font-bold text-[13px] sm:text-[14px] py-3 sm:py-3.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-[0.99] shadow-md shadow-[#0d1b3e]/20"
              >
                Ir para o Dashboard
              </button>
              <button
                onClick={() => { localStorage.removeItem('token'); window.location.href = '/'; }}
                className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2 transition-colors"
              >
                Usar outra conta
              </button>
            </div>
          </div>
        </div>
        <footer className="bg-[#0d1b3e] h-10 sm:h-11 flex items-center justify-center px-2">
          <p className="text-white/40 text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-center">
            © 2026 LocaTech – Informação Certa Combustível e Gás Sem Stress
          </p>
        </footer>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf0f4] flex flex-col">

      <div className="h-1.5 bg-gradient-to-r from-[#0d1b3e] via-[#2d3d6b] to-[#0d1b3e]" />

      <div className="flex-1 flex items-center justify-center px-3 sm:px-4 py-8 sm:py-12">
        <div className="w-full max-w-[380px] sm:max-w-sm flex flex-col gap-5 sm:gap-6">

          <div className="flex justify-center">
            <LocaTechLogo />
          </div>

          <div className="bg-[#dde1e7] rounded-2xl px-6 sm:px-8 py-6 sm:py-8 shadow-sm flex flex-col gap-4 sm:gap-5">
            <div className="text-center -mb-0.5 sm:-mb-1">
              <h1 className="font-black text-lg sm:text-[22px] text-slate-900 tracking-tight leading-tight">
                Bem-vindo de volta
              </h1>
              <p className="text-[12px] sm:text-[12.5px] text-slate-400 font-medium mt-1">
                Entra na tua conta para continuar
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:gap-4">
              <Field
                icon={<IMail className="w-4 h-4" />}
                label="E-mail"
                name="email"
                type="email"
                placeholder="o.teu@email.com"
                value={form.email}
                onChange={handleChange}
                disabled={isLoading}
              />

              <Field
                icon={<ILock className="w-4 h-4" />}
                label="Palavra-Passe"
                name="password"
                type={showPass ? "text" : "password"}
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                disabled={isLoading}
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPass((v) => !v)}
                    className="text-slate-400 hover:text-slate-600 transition-colors"
                    tabIndex={-1}
                  >
                    <IEye className="w-4 h-4" open={showPass} />
                  </button>
                }
              />

              {status === "error" && errorMsg && (
                <div className="bg-red-50 border border-red-200 text-red-600 text-[12px] sm:text-[12.5px] font-semibold px-3 sm:px-4 py-2 sm:py-2.5 rounded-xl text-center">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#0d1b3e] hover:bg-[#162251] disabled:opacity-60
                           text-white font-bold text-[13px] sm:text-[14px] py-3 sm:py-3.5 rounded-xl mt-0.5 sm:mt-1
                           transition-all hover:-translate-y-0.5 active:scale-[0.99]
                           flex items-center justify-center gap-2 shadow-md shadow-[#0d1b3e]/20"
              >
                {isLoading ? (
                  <><ISpinner /> A entrar…</>
                ) : (
                  "Entrar na Conta"
                )}
              </button>
            </form>

            <div className="flex items-center gap-2 sm:gap-3 -my-0.5 sm:-my-1">
              <div className="flex-1 h-px bg-slate-300" />
              <span className="text-[10px] sm:text-[11px] text-slate-400 font-semibold">ou</span>
              <div className="flex-1 h-px bg-slate-300" />
            </div>

            <p className="text-center text-[12px] sm:text-[12.5px] text-slate-500">
              Não tens conta?{" "}
              <a
                href="/sign-up-gestor"
                className="font-bold text-[#0d1b3e] hover:text-[#2d3d6b] underline underline-offset-2 transition-colors"
              >
                Registar como Gestor
              </a>
            </p>
          </div>

          <p className="text-center text-[10px] sm:text-[11px] text-slate-400 font-medium px-2">
            Ao entrar aceitas os termos de uso da plataforma LocaTech.
          </p>
        </div>
      </div>

      <footer className="bg-[#0d1b3e] h-10 sm:h-11 flex items-center justify-center px-2">
        <p className="text-white/40 text-[10px] sm:text-[11px] font-semibold tracking-widest uppercase text-center">
          © 2026 LocaTech – Informação Certa Combustível e Gás Sem Stress
        </p>
      </footer>

    </div>
  );
}