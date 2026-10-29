import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "../config/env.js";
import { Conversation } from "../models/Conversation.js";
import { Media } from "../models/Media.js";
import { Message } from "../models/Message.js";
import { AppError } from "../utils/errors.js";
import { deleteMediaDocs } from "./mediaCleanup.js";
import { enqueueOcr } from "./ocr.js";

// server/seed-assets, resolved the same way from src/ (tsx) and dist/ (node)
const ASSETS = fileURLToPath(new URL("../../seed-assets/", import.meta.url));

interface Msg { from: string; text?: string; media?: string; daysAgo: number }
interface Conv { name: string; messages: Msg[] }

const DEMO: Conv[] = [
  { name: "Aarthi", messages: [
    { from: "Aarthi", text: "Hey! Did you start the Python course?", daysAgo: 41 },
    { from: "You", text: "Yes, almost done. How about you?", daysAgo: 41 },
    { from: "Aarthi", text: "Finished mine today. Sending the certificate", daysAgo: 38 },
    { from: "Aarthi", media: "guvi-certificate.png", daysAgo: 38 },
    { from: "You", text: "Congratulations!", daysAgo: 38 },
    { from: "Aarthi", text: "Here are my notes for the exam", daysAgo: 30 },
    { from: "Aarthi", media: "food-processing-notes.png", daysAgo: 30 },
    { from: "Aarthi", text: "This is the hook example from the class", daysAgo: 21 },
    { from: "Aarthi", media: "react-usestate-screenshot.png", daysAgo: 21 },
    { from: "Aarthi", media: "college-id-card.png", daysAgo: 14 },
    { from: "You", text: "Thanks, I needed that for the form", daysAgo: 14 },
    { from: "Aarthi", text: "Last year's paper, in case it helps", daysAgo: 7 },
    { from: "Aarthi", media: "maths-question-paper.png", daysAgo: 7 },
  ]},
  { name: "Study Group", messages: [
    { from: "Meena", text: "Exam timetable is out", daysAgo: 12 },
    { from: "Ravi", text: "Who has the Food Processing unit 3 notes?", daysAgo: 11 },
    { from: "You", text: "Aarthi shared them, I will forward", daysAgo: 11 },
  ]},
  { name: "College Friends", messages: [
    { from: "Karthik", text: "Reunion on Saturday, who is in?", daysAgo: 5 },
    { from: "You", text: "Count me in", daysAgo: 5 },
  ]},
  { name: "Project Team", messages: [
    { from: "Divya", text: "Sprint review on Friday at 4 PM", daysAgo: 3 },
    { from: "You", text: "I will deploy the frontend on Vercel before that", daysAgo: 3 },
  ]},
];

const at = (daysAgo: number, i: number) => new Date(Date.now() - daysAgo * 86_400_000 + i * 60_000);

/** Adds clearly flagged (isDemo) conversations, messages and images to ONE user's account. Real OCR runs on the images. */
export async function seedDemoForUser(userId: string) {
  if (env.isProd && process.env.ALLOW_DEMO_DATA !== "true") throw new AppError(403, "Demo data is disabled in production");
  if (await Conversation.exists({ ownerId: userId, isDemo: true })) throw new AppError(409, "Demo data is already loaded");
  let images = 0;
  for (const c of DEMO) {
    const conv = await Conversation.create({ ownerId: userId, displayName: c.name, avatar: c.name[0], isDemo: true });
    for (const [i, m] of c.messages.entries()) {
      let mediaId;
      if (m.media) {
        const stored = crypto.randomUUID() + ".png";
        await fs.copyFile(path.join(ASSETS, m.media), path.join(env.uploadDir, stored));
        const { size } = await fs.stat(path.join(env.uploadDir, stored));
        const media = await Media.create({
          ownerId: userId, originalFilename: m.media, storedFile: stored, mimeType: "image/png", size,
          status: "pending", conversationId: conv._id, isDemo: true, uploadedAt: at(m.daysAgo, i),
        });
        mediaId = media._id; images++;
        enqueueOcr(media.id);
      }
      await Message.create({ conversationId: conv._id, text: m.text ?? "", sender: m.from, timestamp: at(m.daysAgo, i), mediaId });
    }
  }
  return { conversations: DEMO.length, images };
}

/** Removes only this user's demo data (files, OCR text, messages, conversations). Uploaded images are untouched. */
export async function clearDemoForUser(userId: string) {
  const demoMedia = await Media.find({ ownerId: userId, isDemo: true });
  await deleteMediaDocs(userId, demoMedia);
  const convs = await Conversation.find({ ownerId: userId, isDemo: true }).select("_id");
  await Message.deleteMany({ conversationId: { $in: convs.map((c) => c._id) } });
  await Conversation.deleteMany({ ownerId: userId, isDemo: true });
  return { conversations: convs.length, images: demoMedia.length };
}
