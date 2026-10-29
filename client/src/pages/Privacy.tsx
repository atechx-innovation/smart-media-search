import { Link } from "react-router-dom";
import PrivacyNotice from "../components/PrivacyNotice";

export default function Privacy() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-10">
      <Link to="/" className="text-sm text-brand-600 underline">Home</Link>
      <h1 className="mb-4 mt-3 text-2xl font-semibold text-brand-900">Privacy notice</h1>
      <PrivacyNotice />
    </main>
  );
}
