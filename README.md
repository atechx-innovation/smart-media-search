# Smart Media Search AI

> Find any photo. Just remember a word.

A standalone prototype that lets you search images by the words inside them. Upload images, the server reads their text with OCR (Tesseract.js), and you search by keyword, optionally inside demo chat conversations.

**Independent prototype — not affiliated with or integrated into WhatsApp or Instagram.** It never accesses real WhatsApp or Instagram data. It only processes images you upload.

## Features
- Email + password accounts (bcrypt, HTTP-only cookie session), protected routes, every image private to its owner
- Upload by picker or drag and drop (JPEG, PNG, WebP, 10 MB), with file-signature check and random stored filenames
- Background OCR queue with pending / processing / done / failed status, progress, retry, and recovery after restart
- Keyword search over OCR text, filenames and descriptions: case-insensitive, partial words, several keywords, relevance or date sorting, paging, highlighting
- Demo chat conversations (Aarthi, Study Group, College Friends, Project Team) with in-chat search across All / Messages / Photos / Videos / Documents
- Image viewer (download, delete, description, retry OCR), collections, dashboard, settings, privacy notice, account deletion

Videos and Documents are **demonstration categories only**: nothing is indexed for them. Search is keyword matching, **not** semantic search.

## Tech stack
React 18 + Vite + TypeScript + Tailwind CSS + Lucide + React Router · Node.js + Express + TypeScript · MongoDB Atlas + Mongoose · Tesseract.js · Zod validation · Helmet, CORS, rate limiting.

## Project structure
```
smart-media-search/
  client/   React app (src/components, pages, layouts, hooks, services, types, utils)
  server/   Express API (src/config, controllers, middleware, models, routes, services, utils, scripts)
            seed-assets/  5 generated demo images + generate.py
            tests/        integration tests
            uploads/      local image storage (git-ignored)
  .env.example  README.md  .gitignore
```

## Local setup
Requirements: Node.js 20 or newer, a free MongoDB Atlas account, internet access (OCR downloads English language data the first time it runs).

1. **Database.** In MongoDB Atlas create a free cluster, add a database user, allow your IP under Network Access, then copy the connection string (Connect → Drivers). Replace `<password>` with the user's password (URL-encode special characters).
2. **Server environment.** Copy the server lines of `.env.example` to `server/.env`:
   ```
   PORT=5000
   MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/smart-media-search
   JWT_SECRET=<run: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))">
   CLIENT_ORIGIN=http://localhost:5173
   ```
3. **Client environment (optional locally).** `client/.env` with `VITE_API_URL=http://localhost:5000/api`. This is the default.
4. **Run.**
   ```
   cd server && npm install && npm run dev
   cd client && npm install && npm run dev      # second terminal, open http://localhost:5173
   ```
5. **Try it.** Sign up, open **Conversations**, press **Load demo conversations**, wait a few seconds for OCR, then in the Aarthi chat choose **Photos** and search `GUVI`. Or upload your own images on the **Upload** page.

Optional command-line seeding for an existing account: `cd server && npm run seed -- --email you@example.com` (add `--clear` to remove). Demo data is never created automatically, is flagged `isDemo`, and seeding is blocked when `NODE_ENV=production`.

## Tests
```
cd server
npm test                   # unit tests: search scoring/tokenizing, image-signature check (no database needed)
npm run test:integration   # API tests: needs `npm install` first; downloads a mongod binary on first run
```
Integration tests use an in-memory MongoDB and replace the OCR engine with a fake, so they check the workflow logic (auth, upload validation, search results, failed-OCR retry, ownership, deletion), not Tesseract accuracy. See "Verification status" for what has actually been run.

## API
All routes are under `/api`; all except register, login, logout and health need the session cookie. Responses are `{ ok: true, ... }` or `{ ok: false, error }`.

| Area | Endpoints |
| --- | --- |
| Auth | `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `GET /auth/me` |
| Media | `POST /media/upload`, `GET /media`, `GET /media/:id`, `PATCH /media/:id` (description), `DELETE /media/:id`, `DELETE /media` (all), `POST /media/:id/reprocess`, `GET /media/:id/file[?download=1]` |
| Search | `GET /search?q=&type=all\|messages\|photos\|videos\|documents&sort=relevance\|date&match=all\|any&page=&limit=&conversationId=&record=true`, `GET /search/history`, `DELETE /search/history`, `DELETE /search/history/:id` |
| Collections | `GET /collections`, `POST /collections`, `GET /collections/:id`, `PATCH /collections/:id` (rename, `addMediaIds`, `removeMediaIds`), `DELETE /collections/:id` |
| Conversations | `GET /conversations`, `GET /conversations/:id`, `GET /conversations/:id/media`, `POST /conversations/demo`, `DELETE /conversations/demo` |
| Account | `PATCH /account/profile`, `POST /account/password`, `DELETE /account` (needs password) |
| Other | `GET /dashboard`, `GET /health` |

Changes from the original brief: added `/account`, `/dashboard`, `GET /collections/:id`, `PATCH`/bulk `DELETE` on media, per-item history delete, demo load/remove, and the authenticated image-file route (images are never served from a public folder).

## Deployment
**Why not everything on Vercel:** Vercel hosts the React frontend well, but it does not provide a persistent local upload folder or a long-running Express server with a background OCR queue. Deploy the frontend and backend separately.

1. **MongoDB Atlas.** Use the cluster from local setup. Under Network Access allow your backend host (Atlas's "allow from anywhere" is the simplest for a prototype; restrict it if your host has fixed IPs).
2. **Backend** (any host that runs a persistent Node process, for example Render, Railway or Fly.io). Root directory `server`, build `npm install && npm run build`, start `npm start`. Environment variables:
   ```
   NODE_ENV=production
   MONGODB_URI=...   JWT_SECRET=...   (new, long, random)
   CLIENT_ORIGIN=https://<your-vercel-domain>      # exact origin, no trailing slash
   UPLOAD_DIR=<path on a persistent disk/volume>
   ```
   Uploaded images are stored on the server's disk. Many hosts wipe the disk on every deploy unless you attach a persistent volume, so attach one and point `UPLOAD_DIR` at it. Object storage (S3, Cloudflare R2) would be the next step for production, but it is **not implemented**. Pick an instance with enough memory for OCR (a few hundred MB free; low-memory free tiers can run out).
3. **Frontend on Vercel.** Import the repository, set Root Directory to `client`, framework Vite, and set `VITE_API_URL=https://<your-backend>/api`. `client/vercel.json` already routes all paths to the app. Redeploy after changing any `VITE_` variable.
4. **Cookies across domains.** In production the session cookie is `Secure; SameSite=None` so a Vercel frontend can talk to a backend on another domain. Some browsers (notably Safari and privacy-focused settings) block such third-party cookies, which makes login appear to fail. The reliable fix is to serve both from the same site, for example `app.example.com` and `api.example.com`.
5. **GitHub.** `.gitignore` excludes `.env`, `node_modules` and `server/uploads`. Never commit real secrets; use `.env.example` as the template.

## Troubleshooting
| Problem | Likely cause and fix |
| --- | --- |
| `Missing required environment variable` | `server/.env` is missing or not in the `server` folder. |
| Server stops with a MongoDB connection error | Wrong password (URL-encode special characters), your IP is not in Atlas Network Access, or the URI lacks a database name. |
| Browser shows CORS errors or you are logged out immediately | `CLIENT_ORIGIN` must equal the frontend origin exactly (scheme, host, port, no trailing slash). See the cookie note under Deployment for production. |
| Images stay on "Waiting in the OCR queue" | The server is not running or crashed during OCR; check its logs. Restarting re-queues unfinished images. |
| OCR fails on every image | First run needs internet to fetch English language data. Also check available memory. Use Retry after fixing. |
| "No readable text was found" | The image has no text Tesseract could read (photos, handwriting and blurry or tiny text are common causes). Nothing is invented; try a clearer image. |
| `bcrypt` fails to install | Use a current Node LTS (20 or newer) and reinstall; on Windows, make sure build tools are available. |
| Uploads vanish after a redeploy | The host's disk is not persistent. Attach a volume and set `UPLOAD_DIR`. |
| "File is too large" | Limit is 10 MB (`MAX_UPLOAD_MB` on the server). |
| Frontend still calls localhost after deploy | `VITE_API_URL` was set after the build; redeploy the frontend. |

## Known limitations
- OCR runs inside the API process, one image at a time. Fine for a prototype, not for many users; a separate worker and queue would be the upgrade.
- Search scores the newest 500 matches in memory. Not suited to very large libraries; no semantic search (the scoring lives in `server/src/services/searchCore.ts`, where a semantic ranker could be added).
- English OCR only. Accuracy drops for blurry, handwritten, tiny or stylised text.
- Local disk storage only; no object-storage adapter.
- Sessions are stateless JWT cookies: changing a password does not sign out other devices.
- Videos and Documents search are demonstration categories.
- No email verification or password reset. Not security-audited; do not upload sensitive documents.
- A few confirmations (clearing search history, removing demo data) use the browser's built-in confirm box instead of the app's dialog.
- Dependency versions were chosen without being able to run `npm install` in the build environment.

## Verification status
Honest record of what has and has not been done.

| Item | Status |
| --- | --- |
| Server unit tests (`npm test`, 17 tests) | **Run: 17 passed** (after fixing a real bug found by the tests: non-Latin text with combining marks was split apart) |
| TypeScript syntax check of client, server and tests | Run: no syntax errors. Full type-check and build **not run** (packages not installed) |
| Demo images contain the expected words | Run with the native Tesseract command-line tool: GUVI, Food Processing and React useState were read correctly. **Tesseract.js itself not run** |
| Integration tests (`npm run test:integration`) | **Written, not run** |
| `npm install`, `npm run dev`, MongoDB Atlas connection, browser UI, mobile layout | **Not run** |

## Verification checklist (run these after setup)
1. Register a new account.
2. Log out, then log in again.
3. Open `/dashboard` while logged out: you are sent to login.
4. Upload a PNG or JPEG: it shows "Reading text…" then "Searchable".
5. The extracted text matches what is visible in the image.
6. Load demo data; in the Aarthi chat, Photos, search `GUVI`: the certificate appears.
7. Search `Food Processing`: the study notes appear.
8. Search `React useState`: the screenshot appears.
9. Search `zzzz`: a "No results" message appears.
10. Create a second account: it cannot see the first account's images, and their links return "not found".
11. Delete an image: it disappears from search and its link stops working.
12. Upload a `.txt` file or a renamed non-image: it is rejected with a clear message.
13. Stop the server mid-OCR and restart: the image is processed again; a failed image shows Retry.
14. Switch filters All / Messages / Photos / Videos / Documents: Videos and Documents say they are demo-only.
15. Open the app at phone width: the conversation list and chat switch views and nothing overflows.
