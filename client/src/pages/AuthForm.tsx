import { FormEvent, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "../hooks/useAuth";

export default function AuthForm({ mode }: { mode: "login" | "signup" }) {
  const { user, login, register } = useAuth();
  const nav = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const isSignup = mode === "signup";

  if (user) return <Navigate to="/dashboard" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Enter a valid email address");
    if (isSignup && (password.length < 8 || !/[A-Za-z]/.test(password) || !/\d/.test(password)))
      return setError("Password needs 8+ characters with a letter and a number");
    setBusy(true);
    try {
      if (isSignup) await register(name, email, password); else await login(email, password);
      nav("/dashboard");
    } catch (err) {
      setError((err as Error).message);
    } finally { setBusy(false); }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-brand-50 px-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4" noValidate>
        <h1 className="text-2xl font-semibold text-brand-900">{isSignup ? "Create your account" : "Welcome back"}</h1>
        {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        {isSignup && (
          <div><label htmlFor="name" className="mb-1 block text-sm font-medium">Name</label>
            <input id="name" className="input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required /></div>
        )}
        <div><label htmlFor="email" className="mb-1 block text-sm font-medium">Email</label>
          <input id="email" type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></div>
        <div><label htmlFor="password" className="mb-1 block text-sm font-medium">Password</label>
          <div className="relative">
            <input id="password" type={show ? "text" : "password"} className="input pr-10" value={password}
              onChange={(e) => setPassword(e.target.value)} autoComplete={isSignup ? "new-password" : "current-password"} required />
            <button type="button" onClick={() => setShow(!show)} aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-500">
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {isSignup && <p className="mt-1 text-xs text-slate-500">At least 8 characters, with a letter and a number.</p>}
        </div>
        <button className="btn-primary w-full" disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}{isSignup ? "Sign up" : "Log in"}
        </button>
        <p className="text-center text-sm text-slate-600">
          {isSignup ? <>Already have an account? <Link className="text-brand-600 underline" to="/login">Log in</Link></>
            : <>New here? <Link className="text-brand-600 underline" to="/signup">Create an account</Link></>}
        </p>
      </form>
    </main>
  );
}
