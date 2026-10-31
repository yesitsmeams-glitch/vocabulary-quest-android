#!/usr/bin/env python3
"""Extract numbered vocabulary sets from the user's Vocabulary Quest PDFs.

This is a deterministic content migration script, not OCR. It extracts the
PDF's editable text by position and checks every level for all 900 entries.
The user's original PDFs remain unchanged and are never committed to GitHub.

Usage:
  python3 scripts/extract_vocab_pdfs.py --input-dir ../upload \
      --out-dir app/src/main/assets/curriculum
"""

import argparse
import json
import re
from pathlib import Path

import pdfplumber


SOURCE_NAMES = {
    "A1": "vocabulary Quest 1.pdf",
    "A2": "Vocabulary_Quest_Part_2_A2_100_Pages-1.pdf",
    "B1": "Vocabulary_Quest_Part_3_B1_100_Pages.pdf",
    "B2": "Vocabulary_Quest_Part_4_B2_100_Pages.pdf",
    "C1": "Vocabulary_Quest_Part_5_C1_100_Pages.pdf",
    "C2": "Vocabulary_Quest_Part_6_C2_100_Pages.pdf",
}
ARABIC = re.compile(r"[\u0600-\u06ff]")
LATIN = re.compile(r"[A-Za-z]")


def group_lines(tokens):
    """Reconstruct lines with tolerance for glyph baseline jitter."""
    lines = []
    for token in sorted(tokens, key=lambda w: (w["top"], w["x0"])):
        found = next((line for line in lines if abs(line["top"] - token["top"]) < 2.3), None)
        if found is None:
            found = {"top": token["top"], "tokens": []}
            lines.append(found)
        found["tokens"].append(token)
    return [" ".join(token["text"] for token in sorted(line["tokens"], key=lambda w: w["x0"]))
            for line in sorted(lines, key=lambda line: line["top"])]


def extract_word(page_words, anchor, next_top, level):
    left = anchor["x0"] < 200
    origin = anchor["x1"]
    top = anchor["top"]
    far_end = 292 if left else 568
    title_tokens = [w for w in page_words
                    if origin + 3 <= w["x0"] < far_end
                    and abs(w["top"] - (top - 2.2)) < 3.1
                    and not ARABIC.search(w["text"])
                    and LATIN.search(w["text"])]
    # Arabic meanings sit just below the English terms and are PDF-shaped RTL.
    arabic_tokens = [w for w in page_words
                     if top + 4 < w["top"] < top + 25
                     and (w["x0"] >= 60 if left else w["x0"] >= 330)
                     and w["x0"] < far_end and ARABIC.search(w["text"])]
    arabic_lines = group_lines(arabic_tokens)
    meaning = " ".join(arabic_lines)[::-1].strip()
    example_start = (75 if left else 350) if level == "A1" else (140 if left else 418)
    example_end = min(next_top - 6, top + 47, 770)
    example_tokens = [w for w in page_words
                      if example_start <= w["x0"] < far_end
                      and top + 17 < w["top"] < example_end
                      and not ARABIC.search(w["text"])
                      and (LATIN.search(w["text"]) or w["text"] in {"…", "...", "—"})]
    example = " ".join(group_lines(example_tokens)).strip()
    return {
        "term": " ".join(w["text"] for w in sorted(title_tokens, key=lambda w: w["x0"])).strip(),
        "meaning": meaning,
        "example": example,
    }


def extract_level(level, source):
    lessons = []
    with pdfplumber.open(source) as doc:
        for page_number, page in enumerate(doc.pages, start=1):
            text = page.extract_text() or ""
            if not any(label in text for label in ("25 ILLUSTRATED WORDS", "25 WORD PICTURES")):
                continue
            lines = [line.strip() for line in text.splitlines() if line.strip()]
            try:
                heading_index = next(i for i, line in enumerate(lines) if "Words to Explore!" in line)
                title = lines[heading_index + 1]
            except (StopIteration, IndexError):
                title = f"Adventure {len(lessons) + 1:02d}"
            page_words = page.extract_words(x_tolerance=1.4, y_tolerance=2.8)
            anchors = [w for w in page_words
                       if w["text"].isdigit() and 1 <= int(w["text"]) <= 900
                       and 120 < w["top"] < 780
                       and (30 <= w["x0"] <= 42 or 306 <= w["x0"] <= 318)]
            anchors = sorted(anchors, key=lambda w: int(w["text"]))
            if len(anchors) != 25:
                raise ValueError(f"{level} page {page_number} ({title}): {len(anchors)} numbers, expected 25")
            entries = []
            for anchor in anchors:
                same_side = [w for w in anchors if (w["x0"] < 200) == (anchor["x0"] < 200) and w["top"] > anchor["top"] + 3]
                next_top = min([w["top"] for w in same_side], default=770)
                item = extract_word(page_words, anchor, next_top, level)
                item["number"] = int(anchor["text"])
                item["id"] = f"{level.lower()}:{item['number']:03d}"
                item["level"] = level
                if not item["term"] or not item["meaning"]:
                    raise ValueError(f"{level} page {page_number} #{item['number']}: missing term or Arabic meaning: {item}")
                entries.append(item)
            set_number = len(lessons) + 1
            for item in entries:
                item["lessonId"] = f"{level.lower()}-set-{set_number:02d}"
            expected = list(range((set_number - 1)*25 + 1, set_number*25 + 1))
            numbers = [item["number"] for item in entries]
            if numbers != expected:
                raise ValueError(f"{level} set {set_number}: sequence mismatch {numbers}")
            lessons.append({
                "id": f"{level.lower()}-set-{set_number:02d}",
                "title": title,
                "subtitle": f"{level} foundation adventure {set_number:02d}" if level == "A1" else f"{level} reading adventure {set_number:02d}",
                "level": level,
                "set": set_number,
                "emoji": {"A1":"🦊","A2":"🌱","B1":"🧭","B2":"🌊","C1":"✨","C2":"🌌"}[level],
                "color": {"A1":"#F6A844","A2":"#37BE9C","B1":"#6598EF","B2":"#9278F7","C1":"#EF9A56","C2":"#D36AB7"}[level],
                "words": entries,
            })
    if len(lessons) != 36:
        raise ValueError(f"{level}: found {len(lessons)} sets, expected 36")
    if sum(len(lesson["words"]) for lesson in lessons) != 900:
        raise ValueError(f"{level}: not exactly 900 words")
    return lessons


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    args = parser.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    summary = {}
    for level, filename in SOURCE_NAMES.items():
        source = args.input_dir / filename
        if not source.exists():
            continue
        lessons = extract_level(level, source)
        target = args.out_dir / f"curriculum-{level.lower()}.js"
        payload = json.dumps(lessons, ensure_ascii=False, separators=(",", ":"))
        target.write_text(f"window.VQ_CURRICULUM = (window.VQ_CURRICULUM || []).concat({payload});\n", encoding="utf-8")
        examples = sum(bool(word["example"]) for lesson in lessons for word in lesson["words"])
        summary[level] = {"sets": len(lessons), "words": 900, "examples": examples, "bytes": target.stat().st_size}
    print(json.dumps(summary, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
