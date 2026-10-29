import { DragEvent, useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, RotateCw, Trash2, UploadCloud } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useViewer } from "../hooks/useViewer";
import { API_BASE, api } from "../services/api";
import type { MediaItem } from "../types";

const TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_MB = 10;

export default function Upload() {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const { open, tick } = useViewer();
  const [toDelete, setToDelete] = useState<MediaItem | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await api<{ items: MediaItem[] }>("/media?limit=50");
      setItems(r.items);
    } catch (e) { setError((e as Error).message); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load, tick]);

  // poll while anything is still being processed
  const busy = items.some((i) => i.status === "pending" || i.status === "processing");
  useEffect(() => {
    if (!busy) return;
    const t = setInterval(load, 2000);
    return () => clearInterval(t);
  }, [busy, load]);

  async function uploadFiles(files: FileList | File[]) {
    setError(""); setNotice("");
    setUploading(true);
    let ok = 0;
    for (const f of Array.from(files)) {
      if (!TYPES.includes(f.type)) { setError(`${f.name}: only JPEG, PNG and WebP are allowed`); continue; }
      if (f.size > MAX_MB * 1024 * 1024) { setError(`${f.name}: larger than ${MAX_MB} MB`); continue; }
      const body = new FormData();
      body.append("file", f);
      try { await api("/media/upload", { method: "POST", body }); ok++; }
      catch (e) { setError(`${f.name}: ${(e as Error).message}`); }
    }
    setUploading(false);
    if (ok) setNotice(`${ok} image${ok > 1 ? "s" : ""} uploaded. Text extraction is running.`);
    await load();
  }

  function onDrop(e: DragEvent) {
    e.preventDefault(); setDrag(false);
    if (e.dataTransfer.files.length) uploadFiles(e.dataTransfer.files);
  }

  async function retry(id: string) {
    try { await api(`/media/${id}/reprocess`, { method: "POST" }); await load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function remove() {
    if (!toDelete) return;
    try { await api(`/media/${toDelete.id}`, { method: "DELETE" }); setNotice("Image deleted."); await load(); }
    catch (e) { setError((e as Error).message); }
    setToDelete(null);
  }

  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <h1 className="text-2xl font-semibold text-brand-900">Upload images</h1>
      <p className="mt-1 text-sm text-slate-600">Only images you choose here are processed. Text is extracted on the server with Tesseract OCR.</p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        className={`mt-6 grid place-items-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${drag ? "border-brand-500 bg-brand-50" : "border-brand-200 bg-white"}`}
      >
        <UploadCloud className="h-8 w-8 text-brand-500" aria-hidden />
        <p className="mt-2 text-sm">Drag and drop images here, or</p>
        <button className="btn-primary mt-3" onClick={() => input.current?.click()} disabled={uploading}>
          {uploading && <Loader2 className="h-4 w-4 animate-spin" />} Choose files
        </button>
        <input ref={input} type="file" multiple accept={TYPES.join(",")} className="sr-only" aria-label="Choose image files"
          onChange={(e) => { if (e.target.files) uploadFiles(e.target.files); e.target.value = ""; }} />
        <p className="mt-2 text-xs text-slate-500">JPEG, PNG or WebP, up to {MAX_MB} MB each</p>
      </div>

      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-4 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{notice}</p>}

      <section className="mt-8" aria-live="polite">
        {loading ? <Loader2 className="mx-auto h-6 w-6 animate-spin text-brand-600" aria-label="Loading" />
          : items.length === 0 ? <p className="text-center text-sm text-slate-500">No images yet. Upload one to get started.</p>
          : <ul className="space-y-4">{items.map((m) => (
              <li key={m.id} className="card flex gap-4 p-4">
                <button type="button" onClick={() => open(m.id)} aria-label={`Open ${m.originalFilename}`} className="shrink-0"><img src={`${API_BASE}/media/${m.id}/file`} alt={m.originalFilename} className="h-24 w-24 rounded-xl object-cover" /></button>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="truncate font-medium">{m.originalFilename}</p>
                    <button onClick={() => setToDelete(m)} aria-label={`Delete ${m.originalFilename}`} title="Delete" className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </div>
                  <p className="text-xs text-slate-500">{new Date(m.uploadedAt).toLocaleString()}</p>
                  <Status m={m} onRetry={() => retry(m.id)} />
                </div>
              </li>))}</ul>}
      </section>
      <ConfirmDialog open={!!toDelete} title="Delete this image?" message={`"${toDelete?.originalFilename}" and its extracted text will be permanently removed.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </main>
  );
}

function Status({ m, onRetry }: { m: MediaItem; onRetry: () => void }) {
  if (m.status === "pending") return <p className="mt-2 flex items-center gap-1 text-sm text-slate-600"><Loader2 className="h-4 w-4 animate-spin" />Waiting in the OCR queue</p>;
  if (m.status === "processing") return <p className="mt-2 flex items-center gap-1 text-sm text-brand-700"><Loader2 className="h-4 w-4 animate-spin" />Reading text… {m.ocrProgress}%</p>;
  if (m.status === "failed") return (
    <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-red-700">
      <AlertCircle className="h-4 w-4" />{m.ocrError ?? "Processing failed"}
      <button className="btn-secondary px-2 py-1 text-xs" onClick={onRetry}><RotateCw className="h-3 w-3" />Retry</button>
    </div>);
  return (
    <div className="mt-2 text-sm">
      <p className="flex items-center gap-1 text-green-700"><CheckCircle2 className="h-4 w-4" />Searchable</p>
      {m.extractedText
        ? <p className="mt-1 line-clamp-3 text-slate-600">{m.extractedText}</p>
        : <p className="mt-1 text-slate-500">No readable text was found in this image, so it can't be found by keyword.</p>}
    </div>);
}
