import { Link } from "react-router-dom";
import { FileText, Lock, Search, ShieldCheck, Upload, Zap } from "lucide-react";
import LandingDemo from "../components/LandingDemo";
import { CONTACT_HREF, GITHUB_URL } from "../utils/links";

const STEPS = [
  { icon: Upload, title: "Add your photos", text: "Upload the images you want to be able to find, with the picker or drag and drop." },
  { icon: FileText, title: "We read the words", text: "OCR extracts the text inside each image on the server and saves it, so every photo becomes searchable." },
  { icon: Search, title: "Search by a word", text: "Type a word you remember, like a course name, and the matching photos appear with the words highlighted." },
];
const BENEFITS = [
  { icon: Zap, title: "Search by what is inside", text: "Matches text found in the image itself, not just the filename." },
  { icon: Search, title: "Forgiving matching", text: "Partial words, any letter case, and several keywords at once." },
  { icon: Lock, title: "You stay in control", text: "Delete one image, everything, or your whole account whenever you like." },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-brand-50 via-white to-white">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-5">
        <span className="font-semibold text-brand-900">Smart Media Search AI</span>
        <nav className="flex gap-2"><Link to="/login" className="btn-secondary">Log in</Link><Link to="/signup" className="btn-primary hidden sm:inline-flex">Sign up</Link></nav>
      </header>

      <main>
        <section className="mx-auto grid max-w-5xl items-center gap-10 px-6 py-14 md:grid-cols-2">
          <div>
            <h1 className="text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">Find the photo. Not the conversation.</h1>
            <p className="mt-3 font-medium text-brand-600">Find any photo. Just remember a word.</p>
            <p className="mt-4 text-lg text-slate-600">Search images shared in your conversations using the words inside them. Find certificates, study notes, screenshots, and important memories without scrolling through endless chats.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link to="/signup" className="btn-primary">Try Smart Search</Link>
              <a href="#demo" className="btn-secondary">Explore Demo</a>
            </div>
            <p className="mt-6 text-xs text-slate-500">Independent prototype — not affiliated with or integrated into WhatsApp or Instagram.</p>
          </div>
          <div className="card space-y-3" aria-hidden>
            <div className="flex items-center gap-2 rounded-xl bg-brand-50 px-3 py-2 text-sm"><Search className="h-4 w-4 text-brand-500" /><span>GUVI</span></div>
            <div className="rounded-xl border border-brand-100 p-3 text-sm"><p className="font-medium">certificate-001.jpg</p><p className="text-slate-600"><mark className="rounded bg-brand-100 px-0.5">GUVI</mark> Python Programming Course Completion Certificate</p><p className="mt-1 text-xs text-slate-400">Photo · Aarthi</p></div>
            <div className="rounded-xl border border-dashed border-slate-200 p-3 text-xs text-slate-400">4 other photos in this conversation did not match</div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-semibold text-brand-900">How it works</h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <li key={s.title} className="card"><span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-100 text-brand-700"><s.icon className="h-5 w-5" aria-hidden /></span>
                <h3 className="mt-3 font-medium">{i + 1}. {s.title}</h3><p className="mt-1 text-sm text-slate-600">{s.text}</p></li>
            ))}
          </ol>
        </section>

        <section className="mx-auto max-w-5xl px-6 py-12">
          <h2 className="text-2xl font-semibold text-brand-900">Why it helps</h2>
          <ul className="mt-6 grid gap-4 md:grid-cols-3">
            {BENEFITS.map((b) => (
              <li key={b.title} className="card"><b.icon className="h-5 w-5 text-brand-600" aria-hidden /><h3 className="mt-3 font-medium">{b.title}</h3><p className="mt-1 text-sm text-slate-600">{b.text}</p></li>
            ))}
          </ul>
        </section>

        <section id="demo" className="mx-auto max-w-5xl scroll-mt-6 px-6 py-12">
          <h2 className="text-2xl font-semibold text-brand-900">Try it</h2>
          <p className="mb-5 mt-1 text-slate-600">Five sample photos from a demo conversation. Search for a word you can see in the text.</p>
          <LandingDemo />
        </section>

        <section id="privacy" className="mx-auto max-w-5xl px-6 py-12">
          <div className="card flex flex-col gap-3 md:flex-row md:items-start">
            <ShieldCheck className="h-6 w-6 shrink-0 text-brand-600" aria-hidden />
            <div>
              <h2 className="text-xl font-semibold text-brand-900">Privacy and security</h2>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
                <li>Only images you upload yourself are processed. The app never reads your WhatsApp or Instagram chats.</li>
                <li>Text is extracted on the app's own server. Images are not sent to an external AI service.</li>
                <li>Passwords are hashed, sessions use an HTTP-only cookie, and every image is private to its owner.</li>
                <li>Delete any image, or your entire account, at any time.</li>
              </ul>
              <Link to="/privacy" className="mt-3 inline-block text-sm text-brand-600 underline">Read the privacy notice</Link>
            </div>
          </div>
        </section>

        <section id="about" className="mx-auto max-w-5xl px-6 pb-16 pt-6">
          <h2 className="text-xl font-semibold text-brand-900">About</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">Smart Media Search AI is a portfolio prototype that explores one idea: finding a photo in a chat by a word written in it. It is a standalone web app with its own demo conversations, not a feature of any messaging platform.</p>
        </section>
      </main>

      <footer className="border-t border-brand-100">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-6 py-6 text-sm text-slate-600">
          <p>Independent prototype. Not affiliated with WhatsApp or Instagram.</p>
          <nav aria-label="Footer" className="flex gap-4">
            <a href="#about" className="hover:underline">About</a>
            <Link to="/privacy" className="hover:underline">Privacy</Link>
            <a href={CONTACT_HREF} className="hover:underline">Contact</a>
            <a href={GITHUB_URL} target="_blank" rel="noreferrer" className="hover:underline">GitHub</a>
          </nav>
        </div>
      </footer>
    </div>
  );
}
