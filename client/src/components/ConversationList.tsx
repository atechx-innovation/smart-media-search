import { useState } from "react";
import { Link } from "react-router-dom";
import { Search as SearchIcon } from "lucide-react";
import type { ConversationSummary } from "../types";

export function Avatar({ letter, size = "h-10 w-10" }: { letter: string; size?: string }) {
  return <span className={`grid ${size} shrink-0 place-items-center rounded-full bg-brand-100 font-semibold text-brand-700`} aria-hidden>{letter}</span>;
}

export default function ConversationList({ items, activeId }: { items: ConversationSummary[]; activeId?: string }) {
  const [filter, setFilter] = useState("");
  const shown = items.filter((c) => c.displayName.toLowerCase().includes(filter.trim().toLowerCase()));
  return (
    <div>
      <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2">
        <SearchIcon className="h-4 w-4 text-brand-500" aria-hidden />
        <label htmlFor="conv-filter" className="sr-only">Search conversations</label>
        <input id="conv-filter" value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Search conversations" className="min-w-0 flex-1 bg-transparent text-sm outline-none" />
      </div>
      <ul className="mt-3 space-y-1">
        {shown.map((c) => (
          <li key={c.id}>
            <Link to={`/conversations/${c.id}`} aria-current={c.id === activeId ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-brand-50 ${c.id === activeId ? "bg-brand-50" : ""}`}>
              <Avatar letter={c.avatar || c.displayName[0]} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{c.displayName}</span>
                <span className="block truncate text-xs text-slate-500">{c.preview}</span>
              </span>
              {c.lastAt && <span className="text-xs text-slate-400">{new Date(c.lastAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>}
            </Link>
          </li>
        ))}
        {shown.length === 0 && <li className="px-3 py-4 text-center text-sm text-slate-500">No conversations match.</li>}
      </ul>
    </div>
  );
}
