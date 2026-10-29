import { useCallback, useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Clock } from "lucide-react";
import SearchBox from "../components/SearchBox";
import SearchResults from "../components/SearchResults";
import { useSearch } from "../hooks/useSearch";
import { useViewer } from "../hooks/useViewer";
import { api } from "../services/api";
import type { HistoryItem } from "../types";

export default function Search() {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const loadHistory = useCallback(() => {
    api<{ items: HistoryItem[] }>("/search/history").then((r) => setHistory(r.items)).catch(() => {});
  }, []);
  useEffect(loadHistory, [loadHistory]);

  const { tick } = useViewer();
  const s = useSearch({ initialType: "photos", onRecorded: loadHistory, refreshKey: tick });
  const [params] = useSearchParams();
  const { setQ } = s;
  useEffect(() => { const q = params.get("q"); if (q) setQ(q); }, [params, setQ]);

  async function clearHistory() {
    if (!window.confirm("Delete your entire search history?")) return;
    await api("/search/history", { method: "DELETE" }).catch(() => {});
    setHistory([]);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-brand-900">Smart search</h1>
      <p className="mb-6 mt-1 text-sm text-slate-600">Matches the text found inside your uploaded images (OCR), plus filenames and demo messages. This is keyword search, not semantic search.</p>

      <SearchBox q={s.q} setQ={s.setQ} type={s.type} setType={s.setType} loading={s.loading} onSubmit={s.submit} />

      {!s.q && history.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <Clock className="h-4 w-4 text-slate-400" aria-hidden />
          {history.map((h) => (
            <button key={h.id} onClick={() => { s.setType(h.filterType); s.setQ(h.query); }} className="rounded-full border border-brand-200 px-3 py-1 text-brand-700 hover:bg-brand-50">{h.query}</button>
          ))}
          <button onClick={clearHistory} className="text-xs text-slate-500 underline">Clear history</button>
        </div>
      )}

      <div className="mt-6 flex items-center justify-between text-sm text-slate-600" aria-live="polite">
        <span>{s.data && !s.data.demoOnly && !s.error ? `${s.data.total} result${s.data.total === 1 ? "" : "s"}${s.data.truncated ? " (showing newest matches)" : ""}` : "\u00a0"}</span>
        <label className="flex items-center gap-2">Sort
          <select value={s.sort} onChange={(e) => s.setSort(e.target.value as "relevance" | "date")} className="rounded-lg border border-slate-200 bg-white px-2 py-1">
            <option value="relevance">Relevance</option><option value="date">Newest</option>
          </select>
        </label>
      </div>

      <SearchResults q={s.q} type={s.type} data={s.data} results={s.results} loading={s.loading} error={s.error} onLoadMore={s.loadMore} />
    </main>
  );
}
