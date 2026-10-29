import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Avatar } from "./ConversationList";
import SearchBox from "./SearchBox";
import SearchResults from "./SearchResults";
import { useSearch } from "../hooks/useSearch";
import { useViewer } from "../hooks/useViewer";
import { API_BASE, api } from "../services/api";
import type { ChatMessage } from "../types";

interface Detail {
  conversation: { id: string; displayName: string; avatar: string; isDemo: boolean };
  messages: ChatMessage[];
}

export default function ChatPane({ id }: { id: string }) {
  const [detail, setDetail] = useState<Detail | null>(null);
  const [error, setError] = useState("");
  const { open, tick } = useViewer();
  const s = useSearch({ conversationId: id, initialType: "all", idleOnEmptyAll: true, refreshKey: tick });

  const load = useCallback(() => {
    api<Detail & { ok: boolean }>(`/conversations/${id}`).then(setDetail).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load, tick]);

  // refresh while demo images are still being read by OCR
  const busy = detail?.messages.some((m) => m.media && (m.media.status === "pending" || m.media.status === "processing"));
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(load, 2500);
    return () => clearInterval(t);
  }, [busy, load]);

  if (error) return <p role="alert" className="p-6 text-sm text-red-700">{error}</p>;
  if (!detail) return <div className="grid h-full place-items-center p-10"><Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-label="Loading" /></div>;

  const { conversation: c, messages } = detail;
  const searching = !s.idle;
  return (
    <section aria-label={`Conversation with ${c.displayName}`} className="flex h-full flex-col">
      <header className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
        <Link to="/conversations" className="md:hidden" aria-label="Back to conversations"><ArrowLeft className="h-5 w-5" /></Link>
        <Avatar letter={c.avatar || c.displayName[0]} />
        <div>
          <h2 className="text-sm font-semibold">{c.displayName}</h2>
          {c.isDemo && <p className="text-xs text-slate-500">Demonstration conversation</p>}
        </div>
      </header>

      <div className="space-y-3 px-4 pt-4">
        <p className="rounded-lg bg-brand-50 px-3 py-2 text-xs text-brand-700">Independent prototype — not affiliated with or integrated into WhatsApp or Instagram.</p>
        <SearchBox q={s.q} setQ={s.setQ} type={s.type} setType={s.setType} loading={s.loading} onSubmit={() => {}} placeholder={`Search in ${c.displayName}`} />
        {searching && s.data && !s.data.demoOnly && !s.error && (
          <p className="text-sm text-slate-600" aria-live="polite">{s.data.total} result{s.data.total === 1 ? "" : "s"}</p>
        )}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-6">
        {searching ? (
          <SearchResults q={s.q} type={s.type} data={s.data} results={s.results} loading={s.loading} error={s.error} onLoadMore={s.loadMore} />
        ) : (
          <ol className="mt-4 space-y-3">
            {messages.map((m) => (
              <li key={m.id} className={`flex ${m.mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm ${m.mine ? "bg-brand-600 text-white" : "bg-brand-50 text-slate-800"}`}>
                  {!m.mine && <p className="mb-0.5 text-xs font-medium text-brand-700">{m.sender}</p>}
                  {m.media && (
                    <button type="button" onClick={() => open(m.media!.id)} className="block text-left">
                      <img src={`${API_BASE}/media/${m.media.id}/file`} alt={m.media.filename} loading="lazy" className="mb-1 max-h-48 rounded-lg" />
                      {m.media.status !== "done" && <span className="block text-xs opacity-80">{m.media.status === "failed" ? "Text extraction failed" : "Reading text…"}</span>}
                    </button>
                  )}
                  {m.text && <p>{m.text}</p>}
                  <p className={`mt-1 text-[10px] ${m.mine ? "text-white/70" : "text-slate-400"}`}>{new Date(m.timestamp).toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
