import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, Download, Loader2, RotateCw, Trash2, X } from "lucide-react";
import ConfirmDialog from "./ConfirmDialog";
import { API_BASE, api } from "../services/api";
import type { CollectionSummary, MediaDetail } from "../types";

export default function ImageViewer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const [m, setM] = useState<MediaDetail | null>(null);
  const [cols, setCols] = useState<CollectionSummary[]>([]);
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);

  const load = useCallback(async (first = false) => {
    try {
      const r = await api<{ media: MediaDetail }>(`/media/${id}`);
      setM(r.media);
      if (first) setDesc(r.media.description);
    } catch (e) { setError((e as Error).message); }
  }, [id]);
  const loadCols = useCallback(() => {
    api<{ items: CollectionSummary[] }>("/collections").then((r) => setCols(r.items)).catch(() => {});
  }, []);

  useEffect(() => { load(true); loadCols(); closeBtn.current?.focus(); }, [load, loadCols]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !confirm) onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, confirm]);
  const processing = m?.status === "pending" || m?.status === "processing";
  useEffect(() => {
    if (!processing) return;
    const t = setInterval(() => load(), 2000);
    return () => clearInterval(t);
  }, [processing, load]);

  async function act(fn: () => Promise<unknown>, ok?: string) {
    setError(""); setNotice("");
    try { await fn(); if (ok) setNotice(ok); } catch (e) { setError((e as Error).message); }
  }
  const saveDesc = () => act(async () => { await api(`/media/${id}`, { method: "PATCH", body: JSON.stringify({ description: desc }) }); onChanged(); }, "Description saved.");
  const retry = () => act(async () => { await api(`/media/${id}/reprocess`, { method: "POST" }); await load(); onChanged(); });
  const toggle = (c: CollectionSummary) => act(async () => {
    const inIt = c.mediaIds.includes(id);
    await api(`/collections/${c.id}`, { method: "PATCH", body: JSON.stringify(inIt ? { removeMediaIds: [id] } : { addMediaIds: [id] }) });
    loadCols(); onChanged();
  });
  async function remove() {
    setBusy(true);
    try { await api(`/media/${id}`, { method: "DELETE" }); onChanged(); onClose(); }
    catch (e) { setError((e as Error).message); setConfirm(false); } finally { setBusy(false); }
  }

  return (
    <div className="fixed inset-0 z-40 overflow-y-auto bg-slate-900/50 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label="Image details" className="mx-auto my-4 max-w-4xl rounded-2xl bg-white p-5 shadow-card">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-brand-900">{m?.originalFilename ?? "Image"}</h2>
            {m && <p className="text-xs text-slate-500">Uploaded {new Date(m.uploadedAt).toLocaleString()}{m.conversationName ? ` · ${m.conversationName}` : ""}{m.isDemo ? " · demo image" : ""}</p>}
          </div>
          <button ref={closeBtn} onClick={onClose} aria-label="Close" title="Close" className="rounded-lg p-2 hover:bg-slate-100"><X className="h-5 w-5" /></button>
        </div>

        {error && <p role="alert" className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {notice && <p role="status" className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}
        {!m && !error && <div className="grid place-items-center py-20"><Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-label="Loading" /></div>}

        {m && (
          <div className="mt-4 grid gap-5 md:grid-cols-2">
            <img src={`${API_BASE}/media/${id}/file`} alt={m.originalFilename} className="max-h-[60vh] w-full rounded-xl bg-brand-50 object-contain" />
            <div className="space-y-4 text-sm">
              <section>
                <h3 className="font-medium">Extracted text</h3>
                {processing && <p className="mt-1 flex items-center gap-1 text-brand-700"><Loader2 className="h-4 w-4 animate-spin" />Reading text… {m.ocrProgress}%</p>}
                {m.status === "failed" && (
                  <p className="mt-1 flex flex-wrap items-center gap-2 text-red-700"><AlertCircle className="h-4 w-4" />{m.ocrError ?? "Processing failed"}
                    <button className="btn-secondary px-2 py-1 text-xs" onClick={retry}><RotateCw className="h-3 w-3" />Retry</button></p>
                )}
                {m.status === "done" && (m.extractedText
                  ? <p className="mt-1 max-h-40 overflow-y-auto whitespace-pre-wrap rounded-lg bg-brand-50 p-3 text-slate-700">{m.extractedText}</p>
                  : <p className="mt-1 text-slate-500">No readable text was found in this image.</p>)}
                {m.status === "done" && <button className="mt-2 text-xs text-brand-600 underline" onClick={retry}>Run text extraction again</button>}
              </section>

              <section>
                <label htmlFor="desc" className="font-medium">Description (searchable)</label>
                <textarea id="desc" value={desc} onChange={(e) => setDesc(e.target.value)} maxLength={500} rows={2} className="input mt-1" placeholder="Optional note to help you find this later" />
                <button className="btn-secondary mt-2" onClick={saveDesc} disabled={desc.trim() === m.description}>Save description</button>
              </section>

              <section>
                <h3 className="font-medium">Collections</h3>
                {cols.length === 0 ? <p className="mt-1 text-slate-500">No collections yet. Create one on the Collections page.</p> : (
                  <ul className="mt-1 space-y-1">{cols.map((c) => (
                    <li key={c.id}><label className="flex items-center gap-2"><input type="checkbox" checked={c.mediaIds.includes(id)} onChange={() => toggle(c)} />{c.name}</label></li>
                  ))}</ul>
                )}
              </section>

              <div className="flex flex-wrap gap-2 pt-2">
                <a className="btn-secondary" href={`${API_BASE}/media/${id}/file?download=1`}><Download className="h-4 w-4" />Download</a>
                <button className="btn bg-red-50 text-red-700 hover:bg-red-100" onClick={() => setConfirm(true)}><Trash2 className="h-4 w-4" />Delete</button>
              </div>
            </div>
          </div>
        )}
      </div>
      <ConfirmDialog open={confirm} busy={busy} title="Delete this image?" message="The image file and its extracted text will be permanently removed, and it will no longer appear in search or collections."
        onConfirm={remove} onCancel={() => setConfirm(false)} />
    </div>
  );
}
