import { createWorker, Worker } from "tesseract.js";
import path from "node:path";
import { env } from "../config/env.js";
import { Media } from "../models/Media.js";

const MAX_TEXT = 50_000;
const TIMEOUT_MS = 120_000;

let worker: Worker | null = null;
let currentId: string | null = null;
let lastWrite = 0;
const queue: string[] = [];
let running = false;

async function getWorker(): Promise<Worker> {
  if (!worker) {
    worker = await createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text" && currentId && Date.now() - lastWrite > 500) {
          lastWrite = Date.now();
          Media.updateOne({ _id: currentId }, { ocrProgress: Math.round(m.progress * 100) }).catch(() => {});
        }
      },
    });
  }
  return worker;
}

async function resetWorker() {
  const w = worker;
  worker = null;
  await w?.terminate().catch(() => {});
}

type Recognizer = (filePath: string) => Promise<string>;

async function tesseractRecognize(filePath: string): Promise<string> {
  const w = await getWorker();
  let timer: NodeJS.Timeout | undefined;
  try {
    const result = await Promise.race([
      w.recognize(filePath),
      new Promise<never>((_, rej) => { timer = setTimeout(() => rej(new Error("OCR timed out")), TIMEOUT_MS); }),
    ]);
    return result.data.text;
  } finally {
    clearTimeout(timer);
  }
}

let recognizer: Recognizer = tesseractRecognize;
/** Test hook: swap the OCR engine for a deterministic fake. */
export function setRecognizer(fn: Recognizer) { recognizer = fn; }
/** Test hook: resolves when the queue is empty and nothing is running. */
export async function waitForOcrIdle() {
  while (running || queue.length) await new Promise((r) => setTimeout(r, 25));
}

async function processOne(id: string) {
  const media = await Media.findById(id);
  if (!media || media.status !== "pending") return; // deleted or already handled
  media.status = "processing";
  media.ocrProgress = 0;
  media.ocrError = undefined;
  await media.save();
  currentId = id;
  try {
    const raw = await recognizer(path.join(env.uploadDir, media.storedFile));
    const text = raw.replace(/\s+/g, " ").trim().slice(0, MAX_TEXT);
    // An image with no readable text is a real "done" with empty text, not a fake success with invented text.
    await Media.updateOne({ _id: id }, { status: "done", extractedText: text, ocrProgress: 100, $unset: { ocrError: 1 } });
  } catch (err) {
    console.error("OCR failed for", id, (err as Error).message);
    await resetWorker(); // a timed-out or crashed worker is not reused
    await Media.updateOne({ _id: id }, { status: "failed", ocrError: "Text extraction failed. You can retry." });
  } finally {
    currentId = null;
  }
}

async function drain() {
  if (running) return;
  running = true;
  try {
    while (queue.length) await processOne(queue.shift()!);
  } finally {
    running = false;
  }
}

/** Adds a pending media item to the in-process queue (one OCR job at a time). */
export function enqueueOcr(id: string) {
  if (!queue.includes(id)) queue.push(id);
  void drain();
}

/** After a restart, anything left pending/processing is re-queued. */
export async function recoverQueue() {
  await Media.updateMany({ status: "processing" }, { status: "pending" });
  const stuck = await Media.find({ status: "pending" }).select("_id");
  stuck.forEach((m) => enqueueOcr(m.id));
}
