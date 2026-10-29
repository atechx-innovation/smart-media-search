import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { escapeRegex, makeSnippet, scoreDoc, tokenize } from "./searchCore.js";

const cert = { text: "GUVI Python Programming Course Completion Certificate", filename: "certificate-001.jpg" };
const score = (doc: object, q: string) => { const { terms, phrase } = tokenize(q); return { terms, ...scoreDoc(doc, terms, phrase) }; };

describe("tokenize", () => {
  it("lowercases, splits on punctuation and removes duplicates", () => {
    assert.deepEqual(tokenize("React, useState! react").terms, ["react", "usestate"]);
  });
  it("returns no terms for blank input", () => assert.deepEqual(tokenize("   ").terms, []));
  it("caps the number of terms and term length", () => {
    assert.equal(tokenize("a b c d e f g h i j k").terms.length, 8);
    assert.equal(tokenize("x".repeat(200)).terms[0].length, 50);
  });
  it("keeps non-English letters and digits", () => assert.deepEqual(tokenize("தமிழ் 2026").terms.length, 2));
});

describe("escapeRegex", () => {
  it("neutralises regex metacharacters", () => {
    assert.ok(new RegExp(escapeRegex("a.b(c)*")).test("a.b(c)*"));
    assert.ok(!new RegExp(escapeRegex("a.b")).test("axb"));
  });
});

describe("scoreDoc", () => {
  it("finds GUVI case-insensitively in OCR text", () => {
    assert.equal(score(cert, "GUVI").matched, 1);
    assert.equal(score(cert, "guvi").matched, 1);
  });
  it("matches partial words", () => assert.equal(score(cert, "progr").matched, 1));
  it("matches multiple keywords and rewards the exact phrase", () => {
    const phrase = score(cert, "Python Programming");
    const scattered = score(cert, "Programming Python");
    assert.equal(phrase.matched, 2);
    assert.ok(phrase.score > scattered.score);
  });
  it("reports unmatched terms", () => assert.equal(score(cert, "GUVI banana").matched, 1));
  it("returns zero for a nonexistent keyword", () => { const r = score(cert, "banana"); assert.equal(r.matched, 0); assert.equal(r.score, 0); });
  it("matches filenames and descriptions, but OCR text scores higher than a filename hit", () => {
    const fileOnly = score({ text: "", filename: "guvi-final.jpg" }, "guvi");
    assert.equal(fileOnly.matched, 1);
    assert.ok(score(cert, "guvi").score > fileOnly.score);
    assert.equal(score({ text: "", description: "my guvi certificate" }, "guvi").matched, 1);
  });
  it("finds the sample queries from the product brief", () => {
    assert.equal(score({ text: "Food Processing - Unit 3 Notes" }, "Food Processing").matched, 2);
    assert.equal(score({ text: "const [count, setCount] = useState(0);" }, "React useState").matched, 1); // "React" absent
    assert.equal(score({ text: "import React, { useState } from 'react';" }, "React useState").matched, 2);
  });
});

describe("makeSnippet", () => {
  it("centres on the first match with ellipses", () => {
    const s = makeSnippet("a ".repeat(100) + "GUVI certificate " + "b ".repeat(100), ["guvi"]);
    assert.ok(s.includes("GUVI") && s.startsWith("…") && s.endsWith("…"));
  });
  it("falls back to the start of the text when nothing matches", () => assert.equal(makeSnippet("short text", ["zzz"]), "short text"));
});
