import { FormEvent } from "react";
import { Loader2, Search as SearchIcon, X } from "lucide-react";
import type { SearchType } from "../types";

export const TABS: { id: SearchType; label: string; demo?: boolean }[] = [
  { id: "all", label: "All" },
  { id: "messages", label: "Messages" },
  { id: "photos", label: "Photos" },
  { id: "videos", label: "Videos", demo: true },
  { id: "documents", label: "Documents", demo: true },
];

interface Props {
  q: string; setQ: (v: string) => void; type: SearchType; setType: (t: SearchType) => void;
  loading: boolean; onSubmit: () => void; placeholder?: string;
}

export default function SearchBox({ q, setQ, type, setType, loading, onSubmit, placeholder }: Props) {
  const submit = (e: FormEvent) => { e.preventDefault(); onSubmit(); };
  return (
    <>
      <form onSubmit={submit} role="search" className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-card">
        <SearchIcon className="h-5 w-5 text-brand-500" aria-hidden />
        <label htmlFor="q" className="sr-only">Search</label>
        <input id="q" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder ?? 'Try "GUVI" or "Food Processing"'}
          className="min-w-0 flex-1 bg-transparent py-2 text-sm outline-none" autoComplete="off" />
        {loading && <Loader2 className="h-4 w-4 animate-spin text-brand-600" aria-label="Searching" />}
        {q && <button type="button" onClick={() => setQ("")} aria-label="Clear search" title="Clear search" className="p-1 text-slate-400 hover:text-slate-700"><X className="h-4 w-4" /></button>}
      </form>
      <div role="tablist" aria-label="Filter by type" className="mt-3 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button key={t.id} role="tab" aria-selected={type === t.id} onClick={() => setType(t.id)}
            className={`rounded-full px-4 py-1.5 text-sm transition ${type === t.id ? "bg-brand-600 text-white" : "bg-brand-50 text-brand-700 hover:bg-brand-100"}`}>
            {t.label}{t.demo && <span className="ml-1 text-[10px] uppercase opacity-70">demo</span>}
          </button>
        ))}
      </div>
    </>
  );
}
