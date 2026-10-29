// Usage: npm run seed -- --email you@example.com [--clear]
// Adds (or with --clear removes) demo data for ONE existing account. Never runs implicitly.
import { connectDB } from "../config/db.js";
import { env } from "../config/env.js";
import { Media } from "../models/Media.js";
import { User } from "../models/User.js";
import { clearDemoForUser, seedDemoForUser } from "../services/demoSeed.js";
import mongoose from "mongoose";

const args = process.argv.slice(2);
const email = args[args.indexOf("--email") + 1];

async function main() {
  if (env.isProd) throw new Error("Refusing to seed in production");
  if (!email || email.startsWith("--")) throw new Error("Pass --email <existing account email>");
  await connectDB();
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) throw new Error(`No account for ${email}. Sign up in the app first.`);

  if (args.includes("--clear")) {
    console.log("Removed:", await clearDemoForUser(user.id));
    return;
  }
  console.log("Seeded:", await seedDemoForUser(user.id), "(running OCR on the demo images...)");
  for (let i = 0; i < 150; i++) {
    const left = await Media.countDocuments({ ownerId: user.id, isDemo: true, status: { $in: ["pending", "processing"] } });
    if (!left) break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  const imgs = await Media.find({ ownerId: user.id, isDemo: true }).select("originalFilename status extractedText");
  imgs.forEach((m) => console.log(`${m.status.padEnd(10)} ${m.originalFilename}: ${(m.extractedText ?? "").slice(0, 70)}`));
}

main().catch((e) => { console.error(e.message); process.exitCode = 1; }).finally(() => mongoose.disconnect().then(() => process.exit()));
