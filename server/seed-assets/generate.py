"""Regenerates the demo images (requires Pillow). Run: python3 generate.py
All images are original, plain-text samples made for this prototype."""
from PIL import Image, ImageDraw, ImageFont

FD = "/usr/share/fonts/truetype/dejavu/"
def font(size, bold=False, mono=False):
    name = "DejaVuSansMono.ttf" if mono else ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
    return ImageFont.truetype(FD + name, size)

def centered(d, w, y, text, f, fill):
    box = d.textbbox((0, 0), text, font=f)
    d.text(((w - (box[2] - box[0])) / 2, y), text, font=f, fill=fill)

def txt(d, xy, text, f, fill):
    d.text(xy, text, font=f, fill=fill)

W, H = 1200, 800

# 1. GUVI-style certificate
im = Image.new("RGB", (W, H), "#fbf9ff"); d = ImageDraw.Draw(im)
d.rectangle([30, 30, W - 30, H - 30], outline="#5b21b6", width=8)
centered(d, W, 90, "CERTIFICATE OF COMPLETION", font(54, True), "#2e1065")
centered(d, W, 200, "GUVI", font(90, True), "#5b21b6")
centered(d, W, 340, "Python Programming Course Completion Certificate", font(36), "#111111")
centered(d, W, 440, "This is to certify that Aarthi S", font(34), "#111111")
centered(d, W, 500, "has successfully completed the course", font(34), "#111111")
centered(d, W, 700, "SAMPLE demonstration image - not a real certificate", font(24), "#555555")
im.save("guvi-certificate.png")

# 2. Food Processing notes
im = Image.new("RGB", (W, H), "#fffef5"); d = ImageDraw.Draw(im)
txt(d, (70, 60), "Food Processing - Unit 3 Notes", font(56, True), "#1e293b")
for i, line in enumerate(["1. Methods of food preservation", "2. Canning and pasteurization", "3. Drying and dehydration",
                          "4. Food safety and HACCP", "5. Packaging and shelf life"]):
    txt(d, (90, 210 + i * 90), line, font(42), "#111111")
txt(d, (70, 720), "Handwritten-style sample notes (generated)", font(24), "#666666")
im.save("food-processing-notes.png")

# 3. React screenshot (light editor theme for reliable OCR)
im = Image.new("RGB", (W, H), "#f6f8fa"); d = ImageDraw.Draw(im)
d.rectangle([0, 0, W, 60], fill="#e2e8f0"); txt(d, (24, 14), "Counter.jsx", font(28), "#111111")
code = ["import React, { useState } from 'react';", "", "function Counter() {", "  const [count, setCount] = useState(0);",
        "  return (", "    <button onClick={() => setCount(count + 1)}>", "      Clicked {count} times", "    </button>", "  );", "}"]
for i, line in enumerate(code):
    txt(d, (40, 100 + i * 62), line, font(36, mono=True), "#111111")
im.save("react-usestate-screenshot.png")

# 4. College ID card (fictional college)
im = Image.new("RGB", (W, H), "#eef2ff"); d = ImageDraw.Draw(im)
d.rounded_rectangle([100, 100, W - 100, H - 100], radius=30, fill="white", outline="#4338ca", width=6)
centered(d, W, 140, "SAMPLE COLLEGE OF ENGINEERING", font(44, True), "#312e81")
centered(d, W, 220, "STUDENT IDENTITY CARD", font(40), "#111111")
for i, line in enumerate(["Name: Aarthi S", "Register No: 000000000", "Department: Computer Science", "Valid until: 2027"]):
    txt(d, (200, 340 + i * 80), line, font(40), "#111111")
txt(d, (200, 650), "SAMPLE - fictional college and number", font(24), "#555555")
im.save("college-id-card.png")

# 5. Mathematics question paper
im = Image.new("RGB", (W, H), "white"); d = ImageDraw.Draw(im)
centered(d, W, 50, "Mathematics Question Paper", font(54, True), "#111111")
centered(d, W, 135, "Time: 3 Hours      Maximum Marks: 100", font(32), "#111111")
for i, line in enumerate(["1. Solve the quadratic equation x^2 - 5x + 6 = 0", "2. Find the derivative of f(x) = 3x^3 + 2x",
                          "3. Evaluate the integral of 2x dx from 0 to 4", "4. Prove that the square root of 2 is irrational"]):
    txt(d, (70, 260 + i * 110), line, font(36), "#111111")
im.save("maths-question-paper.png")
print("done")
