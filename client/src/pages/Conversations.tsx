import { useCallback, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import ChatPane from "../components/ChatPane";
import ConversationList from "../components/ConversationList";
import { api } from "../services/api";
import type { ConversationSummary } from "../types";

export default function Conversations() {
  const { id } = useParams();
  const [items, setItems] = useState<ConversationSummary[] | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => {
    api<{ items: ConversationSummary[] }>("/conversations").then((r) => setItems(r.items)).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load]);

  async function demo(action: "POST" | "DELETE") {
    if (action === "DELETE" && !window.confirm("Remove the demo conversations and demo images? Your own uploads are not affected.")) return;
    setBusy(true); setError("");
    try { await api("/conversations/demo", { method: action }); load(); }
    catch (e) { setError((e as Error).message); } finally { setBusy(false); }
  }

  if (!items) return <div className="grid min-h-screen place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-label="Loading" /></div>;
  const hasDemo = items.some((c) => c.isDemo);

  return (
    <main className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-brand-900">Conversations</h1>
        {hasDemo && <button className="btn-secondary" disabled={busy} onClick={() => demo("DELETE")}>Remove demo data</button>}
      </div>
      {error && <p role="alert" className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {items.length === 0 ? (
        <div className="card mx-auto max-w-lg text-center">
          <h2 className="text-lg font-semibold text-brand-900">No conversations yet</h2>
          <p className="mt-2 text-sm text-slate-600">Load sample conversations (Aarthi, Study Group, College Friends, Project Team) to try search inside a chat. This adds 4 demo conversations and 5 generated sample images to your account, clearly marked as demo data. OCR runs on the images for real, and you can remove everything afterwards.</p>
          <button className="btn-primary mt-4" disabled={busy} onClick={() => demo("POST")}>{busy && <Loader2 className="h-4 w-4 animate-spin" />}Load demo conversations</button>
        </div>
      ) : (
        <div className="grid h-[75vh] overflow-hidden rounded-2xl bg-white shadow-card md:grid-cols-[300px_1fr]">
          <aside className={`overflow-y-auto border-r border-slate-100 p-3 ${id ? "hidden md:block" : ""}`}>
            <ConversationList items={items} activeId={id} />
          </aside>
          <div className={`min-h-0 ${id ? "" : "hidden md:block"}`}>
            {id ? <ChatPane key={id} id={id} /> : <p className="grid h-full place-items-center text-sm text-slate-500">Select a conversation</p>}
          </div>
        </div>
      )}
    </main>
  );
}
