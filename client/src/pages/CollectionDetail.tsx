import { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Loader2, X } from "lucide-react";
import { useViewer } from "../hooks/useViewer";
import { API_BASE, api } from "../services/api";
import type { CollectionSummary, MediaItem } from "../types";

export default function CollectionDetail() {
  const { id } = useParams();
  const { open, tick } = useViewer();
  const [col, setCol] = useState<CollectionSummary | null>(null);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    api<{ collection: CollectionSummary; media: MediaItem[] }>(`/collections/${id}`)
      .then((r) => { setCol(r.collection); setMedia(r.media); }).catch((e) => setError(e.message));
  }, [id]);
  useEffect(load, [load, tick]);

  async function removeFrom(mid: string) {
    try { await api(`/collections/${id}`, { method: "PATCH", body: JSON.stringify({ removeMediaIds: [mid] }) }); load(); }
    catch (e) { setError((e as Error).message); }
  }

  if (error) return <main className="mx-auto max-w-4xl px-6 py-8"><p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p><Link to="/collections" className="mt-3 inline-block text-sm text-brand-600 underline">Back to collections</Link></main>;
  if (!col) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-label="Loading" /></div>;
  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <Link to="/collections" className="text-sm text-brand-600 underline">All collections</Link>
      <h1 className="mt-2 text-2xl font-semibold text-brand-900">{col.name}</h1>
      <p className="text-sm text-slate-500">{media.length} image{media.length === 1 ? "" : "s"}</p>
      {media.length === 0 ? <p className="mt-10 text-center text-sm text-slate-500">This collection is empty. Open an image and tick this collection to add it.</p> : (
        <ul className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {media.map((m) => (
            <li key={m.id} className="card relative p-2">
              <button type="button" onClick={() => open(m.id)} aria-label={`Open ${m.originalFilename}`} className="block w-full">
                <img src={`${API_BASE}/media/${m.id}/file`} alt={m.originalFilename} loading="lazy" className="h-32 w-full rounded-lg object-cover" />
              </button>
              <p className="mt-1 truncate text-xs text-slate-600">{m.originalFilename}</p>
              <button onClick={() => removeFrom(m.id)} aria-label={`Remove ${m.originalFilename} from collection`} title="Remove from collection" className="absolute right-3 top-3 rounded-full bg-white/90 p-1 shadow"><X className="h-3.5 w-3.5" /></button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
