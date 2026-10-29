import { ReactNode, useEffect, useRef } from "react";
import { Loader2 } from "lucide-react";

interface Props {
  open: boolean; title: string; message: string; confirmLabel?: string; busy?: boolean;
  children?: ReactNode; onConfirm: () => void; onCancel: () => void;
}

export default function ConfirmDialog({ open, title, message, confirmLabel = "Delete", busy, children, onConfirm, onCancel }: Props) {
  const cancel = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    cancel.current?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !busy) onCancel(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, busy, onCancel]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onCancel(); }}>
      <div role="alertdialog" aria-modal="true" aria-labelledby="cd-title" aria-describedby="cd-msg" className="card w-full max-w-sm">
        <h2 id="cd-title" className="text-lg font-semibold text-brand-900">{title}</h2>
        <p id="cd-msg" className="mt-2 text-sm text-slate-600">{message}</p>
        {children}
        <div className="mt-5 flex justify-end gap-2">
          <button ref={cancel} className="btn-secondary" onClick={onCancel} disabled={busy}>Cancel</button>
          <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={onConfirm} disabled={busy}>
            {busy && <Loader2 className="h-4 w-4 animate-spin" />}{confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
