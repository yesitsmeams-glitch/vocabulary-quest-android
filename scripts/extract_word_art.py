#!/usr/bin/env python3
"""Create compact 5x5 WebP illustration atlases from the user's source PDFs.

The original 5,400 illustrated vocabulary panels are not embedded as PDFs.
Each of the 216 sets instead gets a lazy-loaded 360px square sprite atlas.
"""

import argparse
from pathlib import Path

import fitz
import pdfplumber
from PIL import Image, ImageOps

from extract_vocab_pdfs import SOURCE_NAMES


TILE = 72


def create_atlas(page, rendered_page, level, set_number):
    anchors = sorted([w for w in page.extract_words()
                      if w["text"].isdigit() and 1 <= int(w["text"]) <= 900
                      and 120 < w["top"] < 780
                      and (30 <= w["x0"] <= 42 or 306 <= w["x0"] <= 318)],
                     key=lambda w: int(w["text"]))
    if len(anchors) != 25:
        raise ValueError(f"{level} set {set_number}: expected 25 illustration anchors")
    atlas = Image.new("RGBA", (5 * TILE, 5 * TILE), (0, 0, 0, 0))
    for index, anchor in enumerate(anchors):
        left = anchor["x0"] < 200
        images = [img for img in page.images
                  if 19 < img["height"] < 45
                  and anchor["top"] + 3 < img["top"] < anchor["top"] + 35
                  and (30 < img["x0"] < 165 if left else 304 < img["x0"] < 440)]
        if images:
            item = max(images, key=lambda image: image["width"] * image["height"])
            rect = fitz.Rect(item["x0"] - 2, item["top"] - 2, item["x1"] + 2, item["bottom"] + 2)
        else:
            # Colors, numbers, and some icon sets are PDF vector drawings,
            # not bitmap images. Crop their known illustration column.
            x = (40 if left else 315) if level == "A1" else (78 if left else 355)
            rect = fitz.Rect(x, anchor["top"] + 8, x + 43, anchor["top"] + 43)
        pixels = rendered_page.get_pixmap(matrix=fitz.Matrix(2.6, 2.6), clip=rect, alpha=False)
        picture = Image.frombytes("RGB", (pixels.width, pixels.height), pixels.samples)
        picture = ImageOps.contain(picture, (64, 64), Image.Resampling.LANCZOS).convert("RGBA")
        x, y = (index % 5) * TILE + (TILE - picture.width) // 2, (index // 5) * TILE + (TILE - picture.height) // 2
        atlas.alpha_composite(picture, (x, y))
    return atlas


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--repair-only", action="store_true", help="Only regenerate missing or empty atlas files")
    args = parser.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    for level, filename in SOURCE_NAMES.items():
        pdf_path = args.input_dir / filename
        if not pdf_path.exists():
            continue
        count = 0
        with pdfplumber.open(pdf_path) as pdf, fitz.open(pdf_path) as rendered:
            for page_index, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                if "25 ILLUSTRATED WORDS" not in text and "25 WORD PICTURES" not in text:
                    continue
                count += 1
                dest = args.out_dir / f"{level.lower()}-{count:02}.webp"
                if args.repair_only and dest.exists() and dest.stat().st_size > 100:
                    continue
                atlas = create_atlas(page, rendered[page_index], level, count)
                temporary = dest.with_name(dest.stem + ".part.webp")
                atlas.save(temporary, "WEBP", quality=85, method=5)
                if temporary.stat().st_size < 100:
                    # Pillow/libwebp occasionally produces an empty file for a
                    # complex transparency tile; lossless mode is reliable.
                    atlas.save(temporary, "WEBP", lossless=True, method=3)
                if temporary.stat().st_size < 100:
                    raise ValueError(f"{level} set {count}: empty atlas output")
                temporary.replace(dest)
        if count != 36:
            raise ValueError(f"{level}: {count} picture atlases, expected 36")
        print(f"{level}: {count} illustration atlases (900 individual illustrated words)", flush=True)


if __name__ == "__main__":
    main()
