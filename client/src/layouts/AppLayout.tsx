import { NavLink, Outlet } from "react-router-dom";
import { LogOut } from "lucide-react";
import { ViewerProvider } from "../hooks/useViewer";
import { useAuth } from "../hooks/useAuth";

const LINKS = [
  ["/dashboard", "Dashboard"], ["/search", "Search"], ["/conversations", "Conversations"],
  ["/upload", "Upload"], ["/collections", "Collections"], ["/settings", "Settings"],
] as const;

export default function AppLayout() {
  const { logout } = useAuth();
  return (
    <ViewerProvider>
      <header className="border-b border-brand-100 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-3">
          <span className="font-semibold text-brand-900">Smart Media Search AI</span>
          <nav aria-label="Main" className="flex flex-1 flex-wrap gap-1 text-sm">
            {LINKS.map(([to, label]) => (
              <NavLink key={to} to={to} className={({ isActive }) => `rounded-lg px-3 py-1.5 transition ${isActive ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-brand-50"}`}>{label}</NavLink>
            ))}
          </nav>
          <button onClick={logout} className="btn-secondary px-3 py-1.5" title="Log out"><LogOut className="h-4 w-4" />Log out</button>
        </div>
      </header>
      <Outlet />
    </ViewerProvider>
  );
}
