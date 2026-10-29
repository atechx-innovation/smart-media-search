import { useState } from "react";
import { Search } from "lucide-react";
import Highlight from "./Highlight";

// Fixed sample text, matched in the browser. The real app reads this text from uploaded images with OCR.
const SAMPLES = [
  { file: "certificate-001.jpg", from: "Aarthi", text: "GUVI Python Programming Course Completion Certificate" },
  { file: "notes-unit3.jpg", from: "Aarthi", text: "Food Processing - Unit 3 Notes: preservation, canning, drying" },
  { file: "hooks.png", from: "Aarthi", text: "const [count, setCount] = useState(0); React hook example" },
  { file: "id-card.jpg", from: "Aarthi", text: "SAMPLE COLLEGE OF ENGINEERING Student Identity Card" },
  { file: "maths-paper.jpg", from: "Aarthi", text: "Mathematics Question Paper Time: 3 Hours Maximum Marks: 100" },
];

export default function LandingDemo() {
  const [q, setQ] = useState("GUVI");
  const terms = q.toLowerCase().split(/[^\p{L}\p{M}\p{N}]+/u).filter(Boolean);
  const hits = SAMPLES.filter((s) => terms.every((t) => (s.text + " " + s.file).toLowerCase().includes(t)));
  return (
    <div className="card mx-auto max-w-2xl">
      <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2">
        <Search className="h-4 w-4 text-brand-500" aria-hidden />
        <label htmlFor="demo-q" className="sr-only">Try a search</label>
        <input id="demo-q" value={q} onChange={(e) => setQ(e.target.value)} className="min-w-0 flex-1 bg-transparent text-sm outline-none" placeholder="Try GUVI, food, useState" />
      </div>
      <p className="mt-3 text-xs text-slate-500" aria-live="polite">{hits.length} of {SAMPLES.length} sample photos in the "Aarthi" conversation match</p>
      <ul className="mt-2 space-y-2">
        {hits.map((s) => (
          <li key={s.file} className="rounded-xl border border-brand-100 p-3 text-sm">
            <p className="font-medium"><Highlight text={s.file} terms={terms} /></p>
            <p className="text-slate-600"><Highlight text={s.text} terms={terms} /></p>
          </li>
        ))}
        {hits.length === 0 && <li className="p-3 text-center text-sm text-slate-500">No photos match. Try a shorter word.</li>}
      </ul>
      <p className="mt-3 text-xs text-slate-400">Sample data running in your browser, so you can feel the search. In the app, text is read from your uploaded images with OCR.</p>
    </div>
  );
}
