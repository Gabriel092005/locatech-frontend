import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import { io, Socket } from "socket.io-client";
import { api } from "@/lib/axios";

// ── Icons ─────────────────────────────────────────────────────────────
function IUser({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}

function IGrid({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  );
}

function IBell({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function IChart({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 3v18h18"/><path d="m19 9-5 5-4-4-3 3"/>
    </svg>
  );
}

function ISettings({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
                   a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
                   A1.65 1.65 0 0 0-1.51-1.65 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
                   l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
                   A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
                   l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
                   a1.65 1.65 0 0 0 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
                   l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
                   a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

function IMap({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  );
}

function IBookmark({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

// ── Navigation items with permissions ────────────────────────────────────────────

interface NavItem {
  to: string;
  label: string;
  Icon: (props: { className?: string }) => JSX.Element;
  roles: ('MEMBER' | 'GESTOR' | 'ADMIN')[]; // Who can see this item
}

const ALL_NAV_ITEMS: NavItem[] = [
  { to: "/dashboard/perfil", label: "Perfil", Icon: IUser, roles: ['MEMBER', 'GESTOR', 'ADMIN'] },
  { to: "/dashboard", label: "Dashboard", Icon: IGrid, roles: ['MEMBER', 'GESTOR', 'ADMIN'] },
  { to: "/dashboard/monitoramento", label: "Monitoramento", Icon: IMap, roles: ['GESTOR', 'ADMIN'] },
  { to: "/dashboard/analise", label: "Análise", Icon: IChart, roles: ['GESTOR', 'ADMIN'] },
  { to: "/dashboard/notificacoes", label: "Notificações", Icon: IBell, roles: ['MEMBER', 'GESTOR', 'ADMIN'] },
  { to: "/dashboard/salvos", label: "Salvos", Icon: IBookmark, roles: ['MEMBER', 'GESTOR', 'ADMIN'] },
  { to: "/dashboard/definicoes", label: "Definições", Icon: ISettings, roles: ['GESTOR', 'ADMIN'] },
];

// ── Sidebar Component ────────────────────────────────────────────────────────────

export function SidebarUnified() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUserRole(payload.role);
      } catch {
        setUserRole(null);
      }
    }
  }, []);

  // ── Socket.IO for real-time notifications ─────────────────────────────
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    const socket: Socket = io("http://localhost:3001", {
      auth: { token },
      transports: ["websocket"],
    });

    // Get user ID from token to join room
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      const userId = payload.sub;
      
      socket.emit("register", userId);

      // Listen for new notifications
      socket.on("nova_notificacao", (data) => {
        console.log("Nova notificação recebida:", data);
        setUnreadCount((prev) => prev + 1);
      });
    } catch (err) {
      console.error("Erro ao conectar socket:", err);
    }

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch initial notification count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const { data } = await api.get<{ notifications: any[] }>("/notif");
        setUnreadCount(data.notifications?.length || 0);
      } catch (err) {
        console.error("Erro ao buscar notificações:", err);
      }
    };
    fetchUnreadCount();
  }, []);

  // Filter items based on user role
  const visibleItems = ALL_NAV_ITEMS.filter(item => 
    !userRole || item.roles.includes(userRole as any)
  );

  // Check if current path matches (for nested routes)
  const isActivePath = (path: string) => {
    if (path === "/dashboard" && location.pathname === "/dashboard") return true;
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex flex-col w-full h-full bg-[#001140]">
      {/* Brand */}
      <div className="px-7 pt-8 pb-7 select-none">
        <span className="text-white font-black text-[22px] tracking-tight">
          Loca<span className="text-amber-400">tech</span>
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1 px-3">
        {visibleItems.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex items-center gap-4 px-4 py-[11px] rounded-xl",
                "text-[14px] font-semibold tracking-wide",
                "transition-all duration-150 group select-none relative",
                isActivePath(to)
                  ? "bg-white/[0.10] text-white"
                  : "text-white/45 hover:bg-white/[0.05] hover:text-white/75",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={[
                    "w-[18px] h-[18px] shrink-0 transition-colors",
                    isActive
                      ? "text-white"
                      : "text-white/45 group-hover:text-white/70",
                  ].join(" ")}
                />
                <span>{label}</span>
                {/* Badge para notificações */}
                {to === "/dashboard/notificacoes" && unreadCount > 0 && (
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 bg-red-500 text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer with role info */}
      <div className="px-4 py-4 border-t border-white/10">
        <p className="text-[10px] text-white/30 font-semibold uppercase tracking-widest">
          {userRole === 'GESTOR' ? 'Gestor' : userRole === 'ADMIN' ? 'Admin' : 'Membro'}
        </p>
      </div>
    </div>
  );
}
