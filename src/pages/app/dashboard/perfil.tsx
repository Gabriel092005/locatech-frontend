import { useRef, useState, useEffect, ChangeEvent } from "react";
import { api } from "@/lib/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fazerLogout } from "@/lib/auth";

// ── Types ─────────────────────────────────────────────────────────────────────

interface UserMe {
  id: number;
  nome: string;
  email: string;
  phone: string | null;
  role: string;
  image_path: string | null;
  isAlive: boolean;
  created_at: string;
}

type UpdateStatus = "idle" | "loading" | "success" | "error";

// ── Icons ─────────────────────────────────────────────────────────────────────

function IUser({ className = "w-12 h-12" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}
function ISpinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10" strokeDasharray="30 10" />
    </svg>
  );
}
function ICheck({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}
function ILogout({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}
function ICamera({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}
function ITrash({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function avatarUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  // O backend salva apenas o filename, ex: "1777404946113-xxx.png"
  // O backend serve em http://localhost:3001/uploads/
  return `http://localhost:3001/uploads/${path}`;
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-300/60 rounded-xl ${className}`} />;
}

// ── Confirm Dialog ────────────────────────────────────────────────────────────

function ConfirmDialog({
  message,
  onConfirm,
  onCancel,
  danger = false,
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative z-10 bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm text-center">
        <p className="text-slate-800 font-semibold text-sm leading-relaxed mb-5">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 ${
              danger ? "bg-red-500 hover:bg-red-600" : "bg-[#0d1b3e] hover:bg-[#162251]"
            }`}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Toast ─────────────────────────────────────────────────────────────────────

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 ${
        type === "success" ? "bg-green-500 text-white" : "bg-red-500 text-white"
      }`}
    >
      {type === "success" && <ICheck className="w-4 h-4" />}
      {message}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function PerfilPage() {
  const fileRef     = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // ── React Query — /me ──────────────────────────────────────────────────────
  const {
    data: user,
    isLoading: loadingUser,
  } = useQuery<UserMe>({
    queryKey: ["user-me"],
    queryFn: async () => {
      const { data } = await api.get<UserMe>("/me");
      return data;
    },
    staleTime: 1000 * 60 * 5, // 5 min
  });

  console.log('fff',user)

  // ── State ──────────────────────────────────────────────────────────────────
  const [preview,      setPreview]      = useState<string | null>(null);
  const [avatarFile,   setAvatarFile]   = useState<File | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<UpdateStatus>("idle");

  const [form, setForm] = useState({
    nome:        "",
    email:       "",
    phone:       "",
    oldPassword: "",
    newPassword: "",
  });

  const [updateStatus, setUpdateStatus] = useState<UpdateStatus>("idle");
  const [toast,        setToast]        = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  // ── Preenche o formulário quando o user carrega ────────────────────────────
  useEffect(() => {
    if (!user) return;
    setForm({
      nome:        user.nome  ?? "",
      email:       user.email ?? "",
      phone:       user.phone ?? "",
      oldPassword: "",
      newPassword: "",
    });
  }, [user]);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  // ── Avatar ─────────────────────────────────────────────────────────────────
  function handleFileSelect(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setAvatarFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleAvatarUpload() {
    if (!avatarFile) return;
    setAvatarStatus("loading");
    try {
      const body = new FormData();
      body.append("image", avatarFile);
      // Não definir Content-Type manualmente - o browser define com boundary correto
      const { data } = await api.patch("/me/avatar", body);
      
      console.log('[Frontend] Resposta upload avatar:', data);
      
      // Invalida o cache para re-buscar o user com a nova foto
      await queryClient.invalidateQueries({ queryKey: ["user-me"] });
      
      // Força recarregamento imediato do user
      const { data: userData } = await api.get<UserMe>("/me");
      console.log('[Frontend] User após upload:', userData);
      
      setAvatarFile(null);
      setPreview(null);
      setAvatarStatus("success");
      showToast("Foto actualizada com sucesso!", "success");
    } catch (err: any) {
      console.error('[Frontend] Erro upload:', err.response?.data || err);
      setAvatarStatus("error");
      showToast(err?.response?.data?.message ?? "Erro ao actualizar foto.", "error");
    } finally {
      setTimeout(() => setAvatarStatus("idle"), 2000);
    }
  }

  // ── Update info ────────────────────────────────────────────────────────────
  async function handleUpdate() {
    setUpdateStatus("loading");
    try {
      const payload: Record<string, string> = {};
      if (form.nome.trim()     && form.nome     !== user?.nome)  payload.nome  = form.nome.trim();
      if (form.email.trim()    && form.email    !== user?.email) payload.email = form.email.trim();
      if (form.phone.trim()    && form.phone    !== user?.phone) payload.phone = form.phone.trim();
      if (form.newPassword.trim()) {
        if (!form.oldPassword.trim()) {
          showToast("Preenche a palavra-passe antiga.", "error");
          setUpdateStatus("idle");
          return;
        }
        payload.oldPassword = form.oldPassword.trim();
        payload.newPassword = form.newPassword.trim();
      }

      await api.put<UserMe>("/me", payload);
      await queryClient.invalidateQueries({ queryKey: ["user-me"] });
      setForm((prev) => ({ ...prev, oldPassword: "", newPassword: "" }));
      setUpdateStatus("success");
      showToast("Informações actualizadas!", "success");
    } catch (err: any) {
      setUpdateStatus("error");
      showToast(err?.response?.data?.message ?? "Erro ao actualizar.", "error");
    } finally {
      setTimeout(() => setUpdateStatus("idle"), 2000);
    }
  }

  // ── Logout ─────────────────────────────────────────────────────────────────
  function handleLogout() {
    fazerLogout();
  }

  // ── Delete account ─────────────────────────────────────────────────────────
  async function handleDeleteAccount() {
    try {
      await api.delete("/me");
      fazerLogout();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Erro ao excluir conta.", "error");
    }
  }

  // ── Avatar src ─────────────────────────────────────────────────────────────
  const imgSrc = preview ?? avatarUrl(user?.image_path ?? null);
  console.log('Avatar debug - image_path:', user?.image_path, '| imgSrc:', imgSrc);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-full bg-[#edf0f4] flex flex-col">

      {/* Header actions */}
      <div className="flex justify-end px-8 pt-6">
        <button
          onClick={() => setConfirmLogout(true)}
          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 active:scale-95
                     text-white font-bold text-[13px] px-5 py-2.5 rounded-full
                     shadow-md shadow-red-500/30 transition-all hover:-translate-y-0.5"
        >
          <ILogout /> Sair da conta
        </button>
      </div>

      <div className="flex-1 px-8 pb-8 pt-4 flex flex-col gap-5">

        {/* Card – Avatar */}
        <div className="bg-[#dde1e7] rounded-2xl px-8 py-6 flex items-center gap-6 shadow-sm">
          <div className="relative w-20 h-20 shrink-0 group">
             <div className="w-20 h-20 rounded-full bg-slate-800 overflow-hidden flex items-center justify-center text-white">
               {imgSrc
                 ? <img 
                     src={imgSrc} 
                     alt="avatar" 
                     className="w-full h-full object-cover" 
                     onError={(e) => console.error('Erro ao carregar imagem:', imgSrc, e)}
                   />
                 : loadingUser
                   ? <div className="w-full h-full animate-pulse bg-slate-600 rounded-full" />
                   : <IUser />
               }
             </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <ICamera className="w-5 h-5 text-white" />
            </button>
          </div>

          <div className="flex-1 min-w-0">
            {loadingUser
              ? <Skeleton className="h-5 w-40 mb-2" />
              : <span className="font-black text-xl text-slate-900 tracking-tight block truncate">{user?.nome}</span>
            }
            {loadingUser
              ? <Skeleton className="h-3 w-28" />
              : <span className="text-xs text-slate-400 font-medium">{user?.role}</span>
            }
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

          <button
            onClick={avatarFile ? handleAvatarUpload : () => fileRef.current?.click()}
            disabled={avatarStatus === "loading"}
            className="bg-[#0d1b3e] hover:bg-[#162251] disabled:opacity-60 text-white font-bold
                       text-[13px] px-6 py-2.5 rounded-xl transition-all hover:-translate-y-0.5
                       active:scale-95 shadow-md flex items-center gap-2 shrink-0"
          >
            {avatarStatus === "loading" ? <><ISpinner /> A enviar…</>  :
             avatarStatus === "success"  ? <><ICheck />  Guardado!</>   :
             avatarFile                  ? <><ICheck className="w-3.5 h-3.5" /> Confirmar</> :
                                           <><ICamera className="w-3.5 h-3.5" /> Actualizar</>}
          </button>
        </div>

        {/* Card – Form */}
        <div className="bg-[#dde1e7] rounded-2xl px-10 py-8 shadow-sm flex flex-col gap-6">
          <h2 className="font-black text-[20px] text-slate-900 tracking-tight text-center">
            Trocar as informações do utilizador
          </h2>

          {loadingUser ? (
            <div className="grid grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {(
                [
                  { name: "nome",        placeholder: "Nome Completo",         type: "text"     },
                  { name: "email",       placeholder: "E-mail",                type: "email"    },
                  { name: "phone",       placeholder: "Contacto",              type: "tel"      },
                  { name: "oldPassword", placeholder: "Palavra-Passe Antiga",  type: "password" },
                  { name: "newPassword", placeholder: "Nova Palavra-Passe",    type: "password" },
                ] as const
              ).map(({ name, placeholder, type }) => (
                <input
                  key={name}
                  name={name}
                  type={type}
                  placeholder={placeholder}
                  value={form[name]}
                  onChange={handleChange}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-3
                             text-[13.5px] text-slate-700 placeholder-slate-400
                             outline-none focus:border-[#0d1b3e] focus:ring-2
                             focus:ring-[#0d1b3e]/10 transition-all"
                />
              ))}
            </div>
          )}

          {/* Metadata */}
          {!loadingUser && user && (
            <div className="flex items-center gap-6 text-[11px] text-slate-400 font-medium -mt-2">
              <span>ID: <strong className="text-slate-600">#{user.id}</strong></span>
              <span>
                Membro desde:{" "}
                <strong className="text-slate-600">
                  {new Date(user.created_at).toLocaleDateString("pt-AO", {
                    day: "2-digit", month: "short", year: "numeric",
                  })}
                </strong>
              </span>
              <span className="flex items-center gap-1">
                Estado:
                <span className={`w-1.5 h-1.5 rounded-full inline-block ${user.isAlive ? "bg-green-500" : "bg-red-400"}`} />
                <strong className={user.isAlive ? "text-green-600" : "text-red-500"}>
                  {user.isAlive ? "Activo" : "Inactivo"}
                </strong>
              </span>
            </div>
          )}

          {/* Update button */}
          <button
            onClick={handleUpdate}
            disabled={updateStatus === "loading" || loadingUser}
            className="w-full bg-[#2d3d6b] hover:bg-[#354880] disabled:opacity-50
                       text-white font-semibold text-[14px] py-3.5 rounded-xl
                       transition-all active:scale-[0.99] flex items-center justify-center gap-2"
          >
            {updateStatus === "loading" ? <><ISpinner /> A actualizar…</> :
             updateStatus === "success"  ? <><ICheck /> Actualizado!</>   :
             "Actualizar as Informações"}
          </button>

          {/* Delete */}
          <div className="flex justify-center">
            <button
              onClick={() => setConfirmDelete(true)}
              disabled={loadingUser}
              className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white
                         font-bold text-[14px] px-10 py-2.5 rounded-full shadow-md
                         shadow-red-500/30 transition-all hover:-translate-y-0.5 active:scale-95
                         disabled:opacity-50"
            >
              <ITrash /> Excluir Conta
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-[#0d1b3e] h-11 flex items-center justify-center mt-auto">
        <p className="text-white/40 text-[11px] font-semibold tracking-widest uppercase">
          © 2026 LocaTech – Informação Certa Combustível e Gás Sem Stress
        </p>
      </footer>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {confirmLogout && (
        <ConfirmDialog
          message="Tens a certeza que queres sair da conta?"
          onConfirm={handleLogout}
          onCancel={() => setConfirmLogout(false)}
        />
      )}

      {confirmDelete && (
        <ConfirmDialog
          message="Esta acção é irreversível. Tens a certeza que queres excluir a tua conta?"
          onConfirm={handleDeleteAccount}
          onCancel={() => setConfirmDelete(false)}
          danger
        />
      )}
    </div>
  );
}