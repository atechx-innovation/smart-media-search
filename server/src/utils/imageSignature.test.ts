import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { hasImageSignature } from "./imageSignature.js";

const pad = (b: number[]) => Buffer.from([...b, ...new Array(12).fill(0)].slice(0, 12));
const webp = Buffer.concat([Buffer.from("RIFF"), Buffer.from([0, 0, 0, 0]), Buffer.from("WEBP")]);

describe("hasImageSignature", () => {
  it("accepts real JPEG, PNG and WebP headers", () => {
    assert.ok(hasImageSignature(pad([0xff, 0xd8, 0xff]), "image/jpeg"));
    assert.ok(hasImageSignature(pad([0x89, 0x50, 0x4e, 0x47]), "image/png"));
    assert.ok(hasImageSignature(webp, "image/webp"));
  });
  it("rejects content that does not match the claimed type", () => {
    assert.ok(!hasImageSignature(Buffer.from("just some text!"), "image/png"));
    assert.ok(!hasImageSignature(pad([0x89, 0x50, 0x4e, 0x47]), "image/jpeg"));
    assert.ok(!hasImageSignature(webp, "image/png"));
  });
  it("rejects unsupported types", () => assert.ok(!hasImageSignature(pad([0x47, 0x49, 0x46]), "image/gif")));
});
