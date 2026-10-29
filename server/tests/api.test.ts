// Integration tests: real Express app + in-memory MongoDB, OCR engine replaced by a fake.
// Run with: npm run test:integration   (downloads a mongod binary on first run)
import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";

let app: any, mongoose: any, waitForOcrIdle: () => Promise<void>, mongod: MongoMemoryServer;
let nextText = "";
let failNext = false;
let png: Buffer;

before(async () => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri();
  process.env.JWT_SECRET = "test-secret-test-secret-test-secret";
  process.env.NODE_ENV = "test";
  process.env.UPLOAD_DIR = await fs.mkdtemp(path.join(os.tmpdir(), "sms-uploads-"));
  ({ app } = await import("../src/app.js"));
  const ocr = await import("../src/services/ocr.js");
  waitForOcrIdle = ocr.waitForOcrIdle;
  ocr.setRecognizer(async () => { if (failNext) { failNext = false; throw new Error("simulated OCR failure"); } return nextText; });
  mongoose = (await import("mongoose")).default;
  await mongoose.connect(process.env.MONGODB_URI);
  png = await fs.readFile(path.resolve("seed-assets/guvi-certificate.png"));
});
after(async () => { await mongoose?.disconnect(); await mongod?.stop(); });

async function signup(email: string) {
  const agent = request.agent(app);
  const r = await agent.post("/api/auth/register").send({ name: "Tester", email, password: "Passw0rdX" });
  assert.equal(r.status, 201);
  return agent;
}
const attach = (agent: any, buf: Buffer, filename: string, contentType: string) =>
  agent.post("/api/media/upload").attach("file", buf, { filename, contentType });
async function upload(agent: any, text: string) {
  nextText = text;
  const r = await attach(agent, png, "photo.png", "image/png");
  assert.equal(r.status, 201);
  await waitForOcrIdle();
  return r.body.media.id as string;
}
const search = (agent: any, q: string, type = "photos") => agent.get("/api/search").query({ q, type });

describe("authentication", () => {
  it("registers, rejects duplicates and weak passwords", async () => {
    const a = request.agent(app);
    const ok = await a.post("/api/auth/register").send({ name: "A", email: "a@example.com", password: "Passw0rdX" });
    assert.equal(ok.status, 201);
    assert.match(String(ok.headers["set-cookie"]), /HttpOnly/);
    assert.equal((await a.post("/api/auth/register").send({ name: "A", email: "a@example.com", password: "Passw0rdX" })).status, 409);
    assert.equal((await a.post("/api/auth/register").send({ name: "B", email: "b@example.com", password: "short" })).status, 400);
  });
  it("logs in and out, and protects routes", async () => {
    const a = request.agent(app);
    assert.equal((await a.post("/api/auth/login").send({ email: "a@example.com", password: "wrong-pass1" })).status, 401);
    assert.equal((await a.get("/api/auth/me")).status, 401);
    assert.equal((await a.post("/api/auth/login").send({ email: "a@example.com", password: "Passw0rdX" })).status, 200);
    assert.equal((await a.get("/api/auth/me")).status, 200);
    await a.post("/api/auth/logout");
    assert.equal((await a.get("/api/auth/me")).status, 401);
    for (const url of ["/api/media", "/api/search?q=x", "/api/collections", "/api/conversations"]) {
      assert.equal((await request(app).get(url)).status, 401, url);
    }
  });
});

describe("upload, OCR, search, ownership and deletion", () => {
  let alice: any, bob: any, certId: string, notesId: string;

  before(async () => {
    alice = await signup("alice@example.com");
    bob = await signup("bob@example.com");
    certId = await upload(alice, "GUVI Python Programming Course Completion Certificate");
    notesId = await upload(alice, "Food Processing - Unit 3 Notes");
    await upload(alice, "import React, { useState } from 'react';");
  });

  it("finds images by OCR text: case-insensitive, partial and multi-keyword", async () => {
    assert.equal((await search(alice, "GUVI")).body.total, 1);
    assert.equal((await search(alice, "guvi")).body.results[0].id, certId);
    assert.equal((await search(alice, "Python Programming")).body.total, 1);
    assert.equal((await search(alice, "Food Processing")).body.results[0].id, notesId);
    assert.equal((await search(alice, "proces")).body.total, 1);
    assert.equal((await search(alice, "React useState")).body.total, 1);
  });
  it("shows an empty result for a nonexistent keyword and demo-only for videos", async () => {
    assert.equal((await search(alice, "banana")).body.total, 0);
    const v = await search(alice, "guvi", "videos");
    assert.equal(v.body.demoOnly, true);
    assert.equal(v.body.total, 0);
  });
  it("rejects invalid files", async () => {
    assert.equal((await attach(alice, Buffer.from("hello"), "a.txt", "text/plain")).status, 400);
    assert.equal((await attach(alice, Buffer.from("not really a png"), "fake.png", "image/png")).status, 400);
    assert.equal((await alice.post("/api/media/upload")).status, 400);
  });
  it("records a failed OCR run honestly and allows a retry", async () => {
    failNext = true;
    const r = await attach(alice, png, "again.png", "image/png");
    await waitForOcrIdle();
    const failed = await alice.get(`/api/media/${r.body.media.id}`);
    assert.equal(failed.body.media.status, "failed");
    assert.ok(failed.body.media.ocrError);
    nextText = "Retry worked";
    assert.equal((await alice.post(`/api/media/${r.body.media.id}/reprocess`)).status, 200);
    await waitForOcrIdle();
    assert.equal((await alice.get(`/api/media/${r.body.media.id}`)).body.media.status, "done");
  });
  it("marks an image with no readable text as done with empty text", async () => {
    const id = await upload(alice, "   ");
    const m = (await alice.get(`/api/media/${id}`)).body.media;
    assert.equal(m.status, "done");
    assert.equal(m.extractedText, "");
  });
  it("keeps one user's images private from another", async () => {
    for (const [method, url] of [["get", `/api/media/${certId}`], ["get", `/api/media/${certId}/file`], ["post", `/api/media/${certId}/reprocess`], ["delete", `/api/media/${certId}`]] as const) {
      assert.equal((await (bob as any)[method](url)).status, 404, `${method} ${url}`);
    }
    assert.equal((await search(bob, "GUVI")).body.total, 0);
    const col = (await bob.post("/api/collections").send({ name: "Mine" })).body.collection;
    assert.equal((await bob.patch(`/api/collections/${col.id}`).send({ addMediaIds: [certId] })).status, 404);
    assert.equal((await alice.get(`/api/media/${certId}/file`)).status, 200);
  });
  it("removes searchable data and the file when an image is deleted", async () => {
    assert.equal((await alice.delete(`/api/media/${certId}`)).status, 200);
    assert.equal((await search(alice, "GUVI")).body.total, 0);
    assert.equal((await alice.get(`/api/media/${certId}`)).status, 404);
    assert.equal((await alice.get(`/api/media/${certId}/file`)).status, 404);
  });
});
