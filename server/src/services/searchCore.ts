export const MAX_TERMS = 8;
export const MAX_TERM_LEN = 50;

export const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Lowercases, splits on anything that isn't a letter, combining mark or digit, de-duplicates, and caps the count. */
export function tokenize(query: string) {
  const phrase = query.trim().toLowerCase().replace(/\s+/g, " ");
  const terms = [...new Set(phrase.split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean))]
    .map((t) => t.slice(0, MAX_TERM_LEN))
    .slice(0, MAX_TERMS);
  return { terms, phrase };
}

function countOccurrences(haystack: string, needle: string) {
  let n = 0, i = haystack.indexOf(needle);
  while (i !== -1) { n++; i = haystack.indexOf(needle, i + needle.length); }
  return n;
}

export interface Searchable { text?: string; filename?: string; description?: string }

/**
 * Simple term-based relevance (no semantic matching):
 *  - OCR/message text hit: 3, +0.5 per extra occurrence (max +1.5), +1 if the term starts a word
 *  - filename or description hit: 2 each
 *  - +5 when the whole multi-word query appears as a contiguous phrase in the text
 * `matched` counts how many distinct query terms hit at least one field.
 */
export function scoreDoc(doc: Searchable, terms: string[], phrase: string) {
  const text = (doc.text ?? "").toLowerCase();
  const filename = (doc.filename ?? "").toLowerCase();
  const description = (doc.description ?? "").toLowerCase();
  let score = 0, matched = 0;
  for (const t of terms) {
    let hit = false;
    const count = countOccurrences(text, t);
    if (count) {
      hit = true;
      score += 3 + Math.min(count - 1, 3) * 0.5;
      if (new RegExp(`(^|[^\\p{L}\\p{M}\\p{N}])${escapeRegex(t)}`, "u").test(text)) score += 1;
    }
    if (filename.includes(t)) { hit = true; score += 2; }
    if (description.includes(t)) { hit = true; score += 2; }
    if (hit) matched++;
  }
  if (terms.length > 1 && text.includes(phrase)) score += 5;
  return { score, matched };
}

/** A short excerpt around the first matching term. */
export function makeSnippet(text: string, terms: string[], radius = 80) {
  const lower = text.toLowerCase();
  const idx = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (idx === undefined) return text.slice(0, radius * 2) + (text.length > radius * 2 ? "…" : "");
  const start = Math.max(0, idx - radius);
  const end = Math.min(text.length, idx + radius);
  return (start > 0 ? "…" : "") + text.slice(start, end) + (end < text.length ? "…" : "");
}
