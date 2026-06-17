import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Film, Heart, History, Home, LogOut, Radio, Search, Settings, Tv } from "lucide-react";
import { useAuthStore } from "../store/authStore";
import { Logo } from "./Logo";

const links = [
  { to: "/", label: "Painel", icon: Home },
  { to: "/live", label: "TV ao Vivo", icon: Tv },
  { to: "/movies", label: "Filmes", icon: Film },
  { to: "/series", label: "Séries", icon: Radio },
  { to: "/favorites", label: "Favoritos", icon: Heart },
  { to: "/continue", label: "Continuar", icon: History },
  { to: "/search", label: "Busca", icon: Search },
  { to: "/guide", label: "Guia", icon: Settings }
];

export function Layout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[18rem_1fr]">
      <aside className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/95 p-4 backdrop-blur lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between lg:block">
          <Logo />
          <button
            onClick={handleLogout}
            className="rounded-xl border border-white/10 p-3 text-slate-300 hover:bg-white/10 lg:hidden"
            aria-label="Sair"
          >
            <LogOut size={18} />
          </button>
        </div>

        <nav className="mt-5 flex gap-2 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
          {links.map((link) => {
            const Icon = link.icon;
            return (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === "/"}
                className={({ isActive }) =>
                  `focus-ring flex min-w-max items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                    isActive ? "bg-blue-500 text-white shadow-glow" : "text-slate-300 hover:bg-white/10 hover:text-white"
                  }`
                }
              >
                <Icon size={18} />
                {link.label}
              </NavLink>
            );
          })}
        </nav>

        <div className="mt-6 hidden rounded-2xl border border-white/10 bg-white/5 p-4 lg:block">
          <p className="text-sm font-semibold text-white">{user?.name || "Usuário"}</p>
          <p className="mt-1 truncate text-xs text-slate-400">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2 text-sm font-semibold text-slate-200 hover:bg-white/15"
          >
            <LogOut size={16} />
            Sair
          </button>
        </div>
      </aside>

      <main className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">
        <Outlet />
      </main>
    </div>
  );
}
