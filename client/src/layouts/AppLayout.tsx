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
  <div className="mx-auto max-w-6xl px-4 py-3">
    <div className="flex items-center justify-between gap-3">
      <span className="font-semibold text-brand-900">Smart Media Search AI</span>
      <button onClick={logout} aria-label="Log out" title="Log out" className="btn-secondary px-3 py-1.5">
        <LogOut className="h-4 w-4" /><span className="hidden sm:inline">Log out</span>
      </button>
    </div>
    <nav aria-label="Main" className="-mx-1 mt-2 flex gap-1 overflow-x-auto pb-1 text-sm">
      {LINKS.map(([to, label]) => (
        <NavLink key={to} to={to} className={({ isActive }) => `shrink-0 whitespace-nowrap rounded-lg px-3 py-1.5 transition ${isActive ? "bg-brand-100 text-brand-700" : "text-slate-600 hover:bg-brand-50"}`}>{label}</NavLink>
      ))}
    </nav>
  </div>
</header>
      <Outlet />
    </ViewerProvider>
  );
}
