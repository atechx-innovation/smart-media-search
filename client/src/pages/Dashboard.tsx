import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, Search as SearchIcon, Upload } from "lucide-react";
import { useAuth } from "../hooks/useAuth";
import { useViewer } from "../hooks/useViewer";
import { API_BASE, api } from "../services/api";
import type { MediaItem, SearchType } from "../types";

interface Data {
  stats: { total: number; searchable: number; processing: number; failed: number };
  collections: { id: string; name: string; count: number }[];
  recentUploads: MediaItem[];
  recentSearches: { id: string; query: string; filterType: SearchType }[];
}

export default function Dashboard() {
  const { user } = useAuth();
  const { open, tick } = useViewer();
  const nav = useNavigate();
  const [d, setD] = useState<Data | null>(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => { api<Data>("/dashboard").then(setD).catch((e) => setError(e.message)); }, [tick]);
  const go = (e: FormEvent) => { e.preventDefault(); nav(`/search${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}`); };

  const stat = (label: string, v: number) => (
    <div className="card p-4"><p className="text-2xl font-semibold text-brand-900">{v}</p><p className="text-xs text-slate-500">{label}</p></div>
  );

  return (
    <main className="mx-auto max-w-5xl px-6 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-brand-900">Hi, {user?.name}</h1>
        <Link to="/upload" className="btn-primary"><Upload className="h-4 w-4" />Upload images</Link>
      </div>

      <form onSubmit={go} role="search" className="mt-5 flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-card">
        <SearchIcon className="h-5 w-5 text-brand-500" aria-hidden />
        <label htmlFor="dq" className="sr-only">Search your media</label>
        <input id="dq" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the words inside your images" className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" />
        <button className="btn-primary py-1.5">Search</button>
      </form>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {!d && !error && <div className="grid place-items-center py-16"><Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-label="Loading" /></div>}

      {d && (<>
        <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stat("Photos uploaded", d.stats.total)}{stat("Searchable (text found)", d.stats.searchable)}
          {stat("Processing", d.stats.processing)}{stat("Needs retry", d.stats.failed)}
        </div>

        <section className="mt-8">
          <h2 className="font-medium text-brand-900">Recent uploads</h2>
          {d.recentUploads.length === 0 ? <p className="mt-2 text-sm text-slate-500">Nothing yet. <Link to="/upload" className="underline">Upload an image</Link> or <Link to="/conversations" className="underline">load the demo conversations</Link>.</p> : (
            <ul className="mt-3 flex gap-3 overflow-x-auto pb-2">
              {d.recentUploads.map((m) => (
                <li key={m.id} className="shrink-0"><button onClick={() => open(m.id)} aria-label={`Open ${m.originalFilename}`}>
                  <img src={`${API_BASE}/media/${m.id}/file`} alt={m.originalFilename} loading="lazy" className="h-24 w-24 rounded-xl object-cover" /></button></li>
              ))}
            </ul>
          )}
        </section>

        <div className="mt-8 grid gap-8 sm:grid-cols-2">
          <section>
            <h2 className="font-medium text-brand-900">Recent searches</h2>
            {d.recentSearches.length === 0 ? <p className="mt-2 text-sm text-slate-500">Searches you submit with Enter appear here.</p> : (
              <div className="mt-3 flex flex-wrap gap-2">{d.recentSearches.map((h) => (
                <Link key={h.id} to={`/search?q=${encodeURIComponent(h.query)}`} className="rounded-full border border-brand-200 px-3 py-1 text-sm text-brand-700 hover:bg-brand-50">{h.query}</Link>))}</div>
            )}
          </section>
          <section>
            <h2 className="font-medium text-brand-900">Collections</h2>
            {d.collections.length === 0 ? <p className="mt-2 text-sm text-slate-500"><Link to="/collections" className="underline">Create a collection</Link> to organize images.</p> : (
              <ul className="mt-3 space-y-1 text-sm">{d.collections.map((c) => (
                <li key={c.id}><Link to={`/collections/${c.id}`} className="text-brand-700 underline">{c.name}</Link> <span className="text-slate-500">({c.count})</span></li>))}</ul>
            )}
          </section>
        </div>
      </>)}
    </main>
  );
}
