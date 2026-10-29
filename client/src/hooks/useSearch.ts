import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../services/api";
import type { SearchResponse, SearchResult, SearchType } from "../types";
import { useDebounce } from "./useDebounce";

interface Options {
  conversationId?: string;
  initialType?: SearchType;
  /** when true, "All" with an empty query makes no request (the caller shows something else) */
  idleOnEmptyAll?: boolean;
  onRecorded?: () => void;
  /** change this value to re-run the current search (e.g. after an image was deleted) */
  refreshKey?: number;
}

export function useSearch(opts: Options = {}) {
  const [q, setQ] = useState("");
  const [type, setType] = useState<SearchType>(opts.initialType ?? "photos");
  const [sort, setSort] = useState<"relevance" | "date">("relevance");
  const [data, setData] = useState<SearchResponse | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const reqId = useRef(0);
  const onRecorded = useRef(opts.onRecorded);
  onRecorded.current = opts.onRecorded;
  const debounced = useDebounce(q, 350);
  const idle = !!opts.idleOnEmptyAll && type === "all" && !debounced.trim();

  const run = useCallback(async (query: string, pageNo: number, record: boolean) => {
    const id = ++reqId.current; // drop out-of-order responses
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({ q: query, type, sort, page: String(pageNo), record: String(record) });
      if (opts.conversationId) params.set("conversationId", opts.conversationId);
      const r = await api<SearchResponse>(`/search?${params}`);
      if (id !== reqId.current) return;
      setData(r); setPage(pageNo);
      setResults((prev) => (pageNo === 1 ? r.results : [...prev, ...r.results]));
      if (record) onRecorded.current?.();
    } catch (e) {
      if (id === reqId.current) setError((e as Error).message);
    } finally {
      if (id === reqId.current) setLoading(false);
    }
  }, [type, sort, opts.conversationId]);

  useEffect(() => {
    if (idle) { reqId.current++; setData(null); setResults([]); setLoading(false); setError(""); return; }
    run(debounced, 1, false);
  }, [debounced, run, idle, opts.refreshKey]);

  return {
    q, setQ, type, setType, sort, setSort, data, results, loading, error, idle,
    submit: () => run(q, 1, true),
    loadMore: () => run(debounced, page + 1, false),
  };
}
