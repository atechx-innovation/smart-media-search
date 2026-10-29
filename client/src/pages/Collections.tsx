import { FormEvent, useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Check, FolderPlus, Loader2, Pencil, Trash2, X } from "lucide-react";
import ConfirmDialog from "../components/ConfirmDialog";
import { useViewer } from "../hooks/useViewer";
import { API_BASE, api } from "../services/api";
import type { CollectionSummary } from "../types";

const SUGGESTED = ["Certificates", "Study Materials", "Projects", "Personal", "Important Documents"];

export default function Collections() {
  const { tick } = useViewer();
  const [items, setItems] = useState<CollectionSummary[] | null>(null);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [toDelete, setToDelete] = useState<CollectionSummary | null>(null);

  const load = useCallback(() => {
    api<{ items: CollectionSummary[] }>("/collections").then((r) => setItems(r.items)).catch((e) => setError(e.message));
  }, []);
  useEffect(load, [load, tick]);

  async function create(n: string) {
    setError("");
    try { await api("/collections", { method: "POST", body: JSON.stringify({ name: n }) }); setName(""); load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function rename(c: CollectionSummary) {
    setError("");
    try { await api(`/collections/${c.id}`, { method: "PATCH", body: JSON.stringify({ name: editName }) }); setEditing(null); load(); }
    catch (e) { setError((e as Error).message); }
  }
  async function remove() {
    if (!toDelete) return;
    try { await api(`/collections/${toDelete.id}`, { method: "DELETE" }); setToDelete(null); load(); }
    catch (e) { setError((e as Error).message); setToDelete(null); }
  }

  if (!items) return <div className="grid min-h-[50vh] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand-600" aria-label="Loading" /></div>;
  const free = SUGGESTED.filter((s) => !items.some((c) => c.name.toLowerCase() === s.toLowerCase()));

  return (
    <main className="mx-auto max-w-4xl px-6 py-8">
      <h1 className="text-2xl font-semibold text-brand-900">Collections</h1>
      <p className="mt-1 text-sm text-slate-600">Group images however you like. Add an image to a collection from its detail view.</p>

      <form onSubmit={(e: FormEvent) => { e.preventDefault(); if (name.trim()) create(name); }} className="mt-5 flex gap-2">
        <label htmlFor="cname" className="sr-only">New collection name</label>
        <input id="cname" className="input" value={name} maxLength={60} onChange={(e) => setName(e.target.value)} placeholder="New collection name" />
        <button className="btn-primary shrink-0"><FolderPlus className="h-4 w-4" />Create</button>
      </form>
      {free.length > 0 && (
        <p className="mt-3 flex flex-wrap items-center gap-2 text-sm text-slate-600">Quick add:
          {free.map((s) => <button key={s} onClick={() => create(s)} className="rounded-full border border-brand-200 px-3 py-1 text-brand-700 hover:bg-brand-50">{s}</button>)}
        </p>
      )}
      {error && <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {items.length === 0 ? <p className="mt-10 text-center text-sm text-slate-500">No collections yet. Create your first one above.</p> : (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {items.map((c) => (
            <li key={c.id} className="card p-4">
              <div className="flex items-start justify-between gap-2">
                {editing === c.id ? (
                  <form className="flex flex-1 gap-1" onSubmit={(e) => { e.preventDefault(); rename(c); }}>
                    <label htmlFor={`rn-${c.id}`} className="sr-only">Rename collection</label>
                    <input id={`rn-${c.id}`} autoFocus className="input py-1" value={editName} maxLength={60} onChange={(e) => setEditName(e.target.value)} />
                    <button aria-label="Save name" className="p-1 text-green-700"><Check className="h-4 w-4" /></button>
                    <button type="button" aria-label="Cancel rename" onClick={() => setEditing(null)} className="p-1 text-slate-500"><X className="h-4 w-4" /></button>
                  </form>
                ) : (
                  <Link to={`/collections/${c.id}`} className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-brand-900">{c.name}</span>
                    <span className="text-xs text-slate-500">{c.count} image{c.count === 1 ? "" : "s"}</span>
                  </Link>
                )}
                {editing !== c.id && (<>
                  <button aria-label={`Rename ${c.name}`} title="Rename" onClick={() => { setEditing(c.id); setEditName(c.name); }} className="p-1 text-slate-400 hover:text-brand-700"><Pencil className="h-4 w-4" /></button>
                  <button aria-label={`Delete ${c.name}`} title="Delete" onClick={() => setToDelete(c)} className="p-1 text-slate-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </>)}
              </div>
              <div className="mt-3 flex gap-2">
                {c.mediaIds.slice(0, 4).map((mid) => <img key={mid} src={`${API_BASE}/media/${mid}/file`} alt="" loading="lazy" className="h-14 w-14 rounded-lg object-cover" />)}
              </div>
            </li>
          ))}
        </ul>
      )}
      <ConfirmDialog open={!!toDelete} title="Delete collection?" message={`"${toDelete?.name}" will be deleted. The images inside it are not deleted.`} onConfirm={remove} onCancel={() => setToDelete(null)} />
    </main>
  );
}
