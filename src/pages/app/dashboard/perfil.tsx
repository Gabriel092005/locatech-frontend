import { useRef, useState, useEffect, ChangeEvent } from "react";
import { api } from "@/lib/axios";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { fazerLogout } from "@/lib/auth";

interface UserMe {
  id: number;
  nome: string;
  email: string;
  phone: string | null;
  role: string;
  image_path: string | null;
  created_at: string;
}

type Status = "idle" | "loading" | "success" | "error";

function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-300/60 rounded-xl ${className}`} />;
}

function avatarUrl(path: string | null): string | null {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  return `http://localhost:3001/uploads/${path}`;
}

const roleLabel: Record<string, string> = {
  ADMIN: "Administrador",
  GESTOR: "Gestor",
  MEMBER: "Cliente",
};

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
          <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-500 text-sm font-semibold hover:bg-slate-50 transition-colors">
            Cancelar
          </button>
          <button onClick={onConfirm} className={`flex-1 py-2.5 rounded-xl text-white text-sm font-bold transition-all active:scale-95 ${danger ? "bg-red-500 hover:bg-red-600" : "bg-[#0d1b3e] hover:bg-[#162251]"}`}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

function Toast({ message, type }: { message: string; type: "success" | "error" }) {
  return (
    <div className={`fixed bottom-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-xl text-sm font-semibold flex items-center gap-2 backdrop-blur-sm ${
      type === "success" ? "bg-emerald-500/90 text-white" : "bg-red-500/90 text-white"
    }`}>
      {message}
    </div>
  );
}

export default function PerfilPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const {
    data: user,
    isLoading: loadingUser,
    isError: userError,
  } = useQuery<UserMe>({
    queryKey: ["user-me"],
    queryFn: async () => {
      const { data } = await api.get<UserMe>("/me");
      return data;
    },
    staleTime: 1000 * 60 * 5,
    retry: 1,
  });

  const [preview, setPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarStatus, setAvatarStatus] = useState<Status>("idle");

  const [form, setForm] = useState({
    nome: "", email: "", phone: "",
    oldPassword: "", newPassword: "",
  });

  const [updateStatus, setUpdateStatus] = useState<Status>("idle");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => {
    if (!user) return;
    setForm({
      nome: user.nome ?? "",
      email: user.email ?? "",
      phone: user.phone ?? "",
      oldPassword: "",
      newPassword: "",
    });
  }, [user]);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

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
      await api.patch("/me/avatar", body);
      const { data: userData } = await api.get<UserMe>("/me");
      queryClient.setQueryData(["user-me"], userData);
      setAvatarFile(null);
      setPreview(null);
      setAvatarStatus("success");
      showToast("Foto actualizada com sucesso!", "success");
    } catch {
      setAvatarStatus("error");
      showToast("Erro ao actualizar foto.", "error");
    } finally {
      setTimeout(() => setAvatarStatus("idle"), 2000);
    }
  }

  async function handleUpdate() {
    setUpdateStatus("loading");
    try {
      const payload: Record<string, string> = {};
      if (form.nome.trim() && form.nome !== user?.nome) payload.nome = form.nome.trim();
      if (form.email.trim() && form.email !== user?.email) payload.email = form.email.trim();
      if (form.phone.trim() && form.phone !== user?.phone) payload.phone = form.phone.trim();
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

  function handleLogout() { fazerLogout(); }

  async function handleDeleteAccount() {
    try {
      await api.delete("/me");
      fazerLogout();
    } catch (err: any) {
      showToast(err?.response?.data?.message ?? "Erro ao excluir conta.", "error");
    }
  }

  const imgSrc = preview ?? avatarUrl(user?.image_path ?? null);

  return (
    <div className="min-h-full bg-gradient-to-br from-slate-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-slate-800 tracking-tight">Perfil</h1>
            <p className="text-sm text-slate-400 mt-0.5">Gerir a sua conta</p>
          </div>
          <button
            onClick={() => setConfirmLogout(true)}
            className="flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-600 font-semibold text-xs px-4 py-2 rounded-xl shadow-sm transition-all"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            Sair
          </button>
        </div>

        {/* Avatar Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 flex items-center gap-5">
          <div className="relative w-20 h-20 shrink-0 group">
            <div className="w-20 h-20 rounded-full bg-slate-100 overflow-hidden flex items-center justify-center ring-2 ring-slate-200">
              {loadingUser ? (
                <Skeleton className="w-full h-full rounded-full" />
              ) : imgSrc ? (
                <img src={imgSrc} alt="avatar" className="w-full h-full object-cover" />
              ) : (
                <svg className="w-8 h-8 text-slate-400" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
            >
              <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </button>
          </div>

          <div className="flex-1 min-w-0">
            {loadingUser ? (
              <>
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-3 w-24" />
              </>
            ) : (
              <>
                <p className="font-bold text-lg text-slate-900 truncate">{user?.nome}</p>
                <p className="text-xs text-slate-400 font-medium">{roleLabel[user?.role ?? ""] ?? user?.role}</p>
              </>
            )}
          </div>

          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

          <button
            onClick={avatarFile ? handleAvatarUpload : () => fileRef.current?.click()}
            disabled={avatarStatus === "loading"}
            className="bg-[#0d1b3e] hover:bg-[#162251] disabled:opacity-60 text-white font-semibold text-xs px-5 py-2.5 rounded-xl transition-all hover:-translate-y-0.5 active:scale-95 shadow-sm shrink-0"
          >
            {avatarStatus === "loading" ? "A enviar…" :
             avatarStatus === "success" ? "Guardado!" :
             avatarFile ? "Confirmar" : "Alterar"}
          </button>
        </div>

        {/* Error State */}
        {userError && !loadingUser && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center">
            <p className="text-sm font-semibold text-red-600 mb-2">Erro ao carregar perfil</p>
            <p className="text-xs text-red-400 mb-3">Nao foi possível obter os dados do utilizador.</p>
            <button
              onClick={() => queryClient.invalidateQueries({ queryKey: ["user-me"] })}
              className="bg-red-500 hover:bg-red-600 text-white text-xs font-semibold px-5 py-2 rounded-xl transition-all"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 space-y-5">
          <h2 className="font-bold text-slate-800 text-base">Informações pessoais</h2>

          {loadingUser ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-11" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {([
                { name: "nome", placeholder: "Nome Completo", type: "text" },
                { name: "email", placeholder: "E-mail", type: "email" },
                { name: "phone", placeholder: "Contacto", type: "tel" },
                { name: "oldPassword", placeholder: "Palavra-passe antiga", type: "password" },
                { name: "newPassword", placeholder: "Nova palavra-passe", type: "password" },
              ] as const).map(({ name, placeholder, type }) => (
                <input
                  key={name}
                  name={name}
                  type={type}
                  placeholder={placeholder}
                  value={form[name]}
                  onChange={handleChange}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm text-slate-700 placeholder-slate-400 outline-none focus:border-[#0d1b3e] focus:ring-2 focus:ring-[#0d1b3e]/10 transition-all"
                />
              ))}
            </div>
          )}

          {!loadingUser && user && (
            <div className="flex items-center gap-4 text-[11px] text-slate-400 font-medium -mt-1">
              <span>ID: <strong className="text-slate-600">#{user.id}</strong></span>
              <span>Membro desde: <strong className="text-slate-600">
                {new Date(user.created_at).toLocaleDateString("pt-AO", {
                  day: "2-digit", month: "short", year: "numeric",
                })}
              </strong></span>
            </div>
          )}

          <button
            onClick={handleUpdate}
            disabled={updateStatus === "loading" || loadingUser}
            className="w-full bg-[#0d1b3e] hover:bg-[#162251] disabled:opacity-50 text-white font-semibold text-sm py-3 rounded-xl transition-all active:scale-[0.99]"
          >
            {updateStatus === "loading" ? "A actualizar…" :
             updateStatus === "success" ? "Actualizado!" :
             "Guardar alterações"}
          </button>
        </div>

        {/* Delete Card */}
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 text-center">
          <button
            onClick={() => setConfirmDelete(true)}
            disabled={loadingUser}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50 font-semibold text-xs px-6 py-2.5 rounded-xl transition-all"
          >
            Excluir conta
          </button>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} />}

      {confirmLogout && (
        <ConfirmDialog message="Tens a certeza que queres sair da conta?" onConfirm={handleLogout} onCancel={() => setConfirmLogout(false)} />
      )}

      {confirmDelete && (
        <ConfirmDialog message="Esta acção é irreversível. Tens a certeza que queres excluir a tua conta?" onConfirm={handleDeleteAccount} onCancel={() => setConfirmDelete(false)} danger />
      )}
    </div>
  );
}
