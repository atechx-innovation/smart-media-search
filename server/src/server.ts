import { app } from "./app.js";
import { connectDB } from "./config/db.js";
import { env } from "./config/env.js";
import { recoverQueue } from "./services/ocr.js";

connectDB()
  .then(() => recoverQueue())
  .then(() => app.listen(env.port, () => console.log(`API on http://localhost:${env.port}`)))
  .catch((err) => { console.error("Startup failed:", err.message); process.exit(1); });
