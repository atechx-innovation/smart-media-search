export default function PrivacyNotice() {
  const h = "mt-5 text-base font-semibold text-brand-900";
  return (
    <div className="text-sm leading-relaxed text-slate-700">
      <p>Smart Media Search AI is an independent prototype. It is not affiliated with, connected to, or integrated into WhatsApp or Instagram, and it never reads your private conversations. It only processes images you choose to upload here.</p>
      <h3 className={h}>What is stored</h3>
      <ul className="mt-1 list-disc space-y-1 pl-5">
        <li>Your name, email, and a bcrypt hash of your password (never the password itself).</li>
        <li>Images you upload, kept as files on the server, separate from the database.</li>
        <li>For each image: original filename, size, type, upload date, the text extracted by OCR, and an optional description you add.</li>
        <li>Collections you create and searches you submit with Enter (up to 50).</li>
        <li>Demo conversations and sample images only if you choose to load them; they are labeled as demo data.</li>
      </ul>
      <h3 className={h}>How images are processed</h3>
      <p className="mt-1">Text is extracted on this app's own server using Tesseract.js (English only). Your images are not sent to any external AI service. When the OCR engine first starts it may download its English language data from a public CDN; your images are not part of that download. Search is plain keyword matching over the extracted text, filenames and descriptions. OCR can make mistakes, especially on blurry or low-quality images.</p>
      <h3 className={h}>Cookies</h3>
      <p className="mt-1">One HTTP-only session cookie keeps you signed in for up to 7 days. There are no advertising or tracking cookies.</p>
      <h3 className={h}>Your control</h3>
      <p className="mt-1">You can delete a single image, all uploaded images, your search history, or your whole account in Settings. Deleting an image removes its file and its searchable text. Deleting your account removes everything listed above.</p>
      <h3 className={h}>Please note</h3>
      <p className="mt-1">This is a portfolio prototype and has not had a security audit. Avoid uploading images containing highly sensitive information such as government IDs or financial documents.</p>
    </div>
  );
}
