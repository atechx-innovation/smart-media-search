// Set these in client/.env (see .env.example). Nothing here is a real company address.
export const GITHUB_URL: string = import.meta.env.VITE_GITHUB_URL ?? "https://github.com";
const email: string | undefined = import.meta.env.VITE_CONTACT_EMAIL;
export const CONTACT_HREF = email ? `mailto:${email}` : GITHUB_URL;
