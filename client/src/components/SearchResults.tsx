import { Link } from "react-router-dom";
import { Loader2 } from "lucide-react";
import Highlight from "./Highlight";
import { useViewer } from "../hooks/useViewer";
import { API_BASE } from "../services/api";
import type { SearchResponse, SearchResult, SearchType } from "../types";

interface Props {
  q: string; type: SearchType; data: SearchResponse | null; results: SearchResult[];
  loading: boolean; error: string; onLoadMore: () => void;
}

export default function SearchResults({ q, type, data, results, loading, error, onLoadMore }: Props) {
  const { open } = useViewer();
  const terms = data?.terms ?? [];
  return (
    <div>
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {data?.demoOnly ? (
        <p className="mt-10 text-center text-sm text-slate-500">{type === "videos" ? "Video" : "Document"} search is a demonstration category in this prototype. Nothing is indexed for it yet.</p>
      ) : data && !loading && !error && results.length === 0 ? (
        <div className="mt-10 text-center text-sm text-slate-600">
          <p className="font-medium text-brand-900">{q ? `No results for “${q}”` : "Nothing here yet"}</p>
          <p className="mt-1">{q ? "Try fewer or shorter words. Only images whose text was read successfully can match." : <>Upload an image on the <Link to="/upload" className="underline">upload page</Link> to get started.</>}</p>
        </div>
      ) : (
        <ul className="mt-4 grid gap-4 sm:grid-cols-2">
          {results.map((r) => (
            <li key={`${r.kind}-${r.id}`} className="card flex gap-3 p-4">
              {r.kind === "photo" && (
                <button type="button" onClick={() => open(r.id)} className="shrink-0" aria-label={`Open ${r.filename}`}>
                  <img src={`${API_BASE}/media/${r.id}/file`} alt={r.filename} loading="lazy" className="h-24 w-24 rounded-xl object-cover" />
                </button>
              )}
              <div className="min-w-0 flex-1 text-sm">
                {r.kind === "photo"
                  ? <p className="truncate font-medium"><Highlight text={r.filename ?? ""} terms={terms} /></p>
                  : <p className="font-medium">{r.sender}</p>}
                <p className="mt-1 text-slate-600"><Highlight text={r.snippet} terms={terms} />
                  {r.kind === "photo" && !r.snippet && <span className="text-slate-400">{r.status === "done" ? "No readable text found" : "Text not extracted yet"}</span>}
                </p>
                <p className="mt-2 text-xs text-slate-400">
                  {r.kind === "photo" ? "Photo" : "Message"}{r.conversationName ? ` · ${r.conversationName}` : ""}{r.isDemo ? " · demo" : ""} · {new Date(r.date).toLocaleDateString()}
                </p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {data?.hasMore && (
        <div className="mt-6 text-center">
          <button className="btn-secondary" disabled={loading} onClick={onLoadMore}>
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}Load more
          </button>
        </div>
      )}
    </div>
  );
}
