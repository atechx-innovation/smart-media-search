import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/ConfirmDialog";
import PrivacyNotice from "../components/PrivacyNotice";
import { useAuth } from "../hooks/useAuth";
import { useViewer } from "../hooks/useViewer";
import { api } from "../services/api";
import type { User } from "../types";

type Danger = null | "history" | "images" | "account";

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const { tick } = useViewer();
  void tick;
  const nav = useNavigate();
  const [name, setName] = useState(user?.name ?? "");
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [danger, setDanger] = useState<Danger>(null);
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<string | void>) => {
    setMsg(null);
    try { const t = await fn(); if (t) setMsg({ ok: true, text: t }); } catch (e) { setMsg({ ok: false, text: (e as Error).message }); }
  };

  const saveName = (e: FormEvent) => { e.preventDefault(); run(async () => {
    const r = await api<{ user: User }>("/account/profile", { method: "PATCH", body: JSON.stringify({ name }) });
    setUser(r.user); return "Name updated.";
  }); };
  const savePw = (e: FormEvent) => { e.preventDefault(); run(async () => {
    await api("/account/password", { method: "POST", body: JSON.stringify({ currentPassword: cur, newPassword: next }) });
    setCur(""); setNext(""); return "Password changed.";
  }); };

  async function confirmDanger() {
    setBusy(true);
    await run(async () => {
      if (danger === "history") { await api("/search/history", { method: "DELETE" }); return "Search history deleted."; }
      if (danger === "images") { const r = await api<{ deleted: number }>("/media", { method: "DELETE" }); return `${r.deleted} image${r.deleted === 1 ? "" : "s"} deleted.`; }
      await api("/account", { method: "DELETE", body: JSON.stringify({ password: pw }) });
      await logout(); nav("/");
    });
    setBusy(false); setDanger(null); setPw("");
  }

  const section = "card space-y-3";
  return (
    <main className="mx-auto max-w-2xl space-y-6 px-6 py-8">
      <h1 className="text-2xl font-semibold text-brand-900">Settings and privacy</h1>
      {msg && <p role={msg.ok ? "status" : "alert"} className={`rounded-lg px-3 py-2 text-sm ${msg.ok ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"}`}>{msg.text}</p>}

      <section className={section} aria-labelledby="s-acc">
        <h2 id="s-acc" className="font-medium text-brand-900">Account</h2>
        <form onSubmit={saveName} className="space-y-2">
          <label htmlFor="sn" className="block text-sm font-medium">Name</label>
          <div className="flex gap-2"><input id="sn" className="input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} /><button className="btn-secondary shrink-0" disabled={!name.trim() || name.trim() === user?.name}>Save</button></div>
          <p className="text-xs text-slate-500">Email: {user?.email}</p>
        </form>
        <form onSubmit={savePw} className="space-y-2 border-t border-slate-100 pt-3">
          <label htmlFor="cp" className="block text-sm font-medium">Current password</label>
          <input id="cp" type="password" className="input" value={cur} autoComplete="current-password" onChange={(e) => setCur(e.target.value)} />
          <label htmlFor="np" className="block text-sm font-medium">New password</label>
          <input id="np" type="password" className="input" value={next} autoComplete="new-password" onChange={(e) => setNext(e.target.value)} />
          <p className="text-xs text-slate-500">At least 8 characters, with a letter and a number. Other signed-in devices stay signed in until their session expires.</p>
          <button className="btn-secondary" disabled={!cur || !next}>Change password</button>
        </form>
      </section>

      <section className={section} aria-labelledby="s-data">
        <h2 id="s-data" className="font-medium text-brand-900">Your data</h2>
        <div className="flex flex-wrap gap-2">
          <button className="btn-secondary" onClick={() => setDanger("history")}>Delete search history</button>
          <button className="btn-secondary" onClick={() => setDanger("images")}>Delete all uploaded images</button>
        </div>
        <p className="text-xs text-slate-500">To remove only the sample conversations, use "Remove demo data" on the <Link to="/conversations" className="underline">Conversations</Link> page.</p>
      </section>

      <section className={section} aria-labelledby="s-priv">
        <h2 id="s-priv" className="font-medium text-brand-900">Privacy and OCR processing</h2>
        <PrivacyNotice />
      </section>

      <section className="card space-y-2 border border-red-100" aria-labelledby="s-del">
        <h2 id="s-del" className="font-medium text-red-700">Delete account</h2>
        <p className="text-sm text-slate-600">Permanently removes your account, images, extracted text, collections, conversations and search history. This cannot be undone.</p>
        <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={() => setDanger("account")}>Delete my account</button>
      </section>

      <ConfirmDialog open={danger !== null} busy={busy}
        title={danger === "history" ? "Delete search history?" : danger === "images" ? "Delete all uploaded images?" : "Delete your account?"}
        message={danger === "history" ? "All saved searches will be removed." : danger === "images" ? "Every image, including demo images, and its extracted text will be permanently removed." : "Everything in your account will be permanently removed. Enter your password to confirm."}
        confirmLabel={danger === "account" ? "Delete account" : "Delete"} onConfirm={confirmDanger} onCancel={() => { setDanger(null); setPw(""); }}>
        {danger === "account" && (<div className="mt-3"><label htmlFor="dp" className="block text-sm font-medium">Password</label>
          <input id="dp" type="password" className="input mt-1" value={pw} autoComplete="current-password" onChange={(e) => setPw(e.target.value)} /></div>)}
      </ConfirmDialog>
    </main>
  );
}
