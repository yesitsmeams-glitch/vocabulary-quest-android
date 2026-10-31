#!/usr/bin/env python3
"""Extract sharp, clean-cut word art from original PDF image streams.

The old 72px atlases were screenshots of the printed page; this extractor
instead reads the embedded alpha-masked illustrations at their native pixel
resolution, avoiding colored worksheet backgrounds and clipped edges.
Each 240px tile is optimized for retina-resolution mobile rendering.
"""

import argparse
from pathlib import Path

import fitz
import pdfplumber
from PIL import Image, ImageOps

from extract_vocab_pdfs import SOURCE_NAMES


TILE = 240
ART_SIZE = 226


def anchors_for(page):
    anchors = [word for word in page.extract_words()
               if word["text"].isdigit() and 1 <= int(word["text"]) <= 900
               and 120 < word["top"] < 780
               and (30 <= word["x0"] <= 42 or 306 <= word["x0"] <= 318)]
    anchors.sort(key=lambda word: int(word["text"]))
    if len(anchors) != 25:
        raise ValueError(f"Expected 25 numbered illustrations, got {len(anchors)}")
    return anchors


def extract_pixmap(doc, xref):
    image = doc.extract_image(xref)
    base = fitz.Pixmap(doc, xref)
    smask = image.get("smask", 0)
    if smask:
        mask = fitz.Pixmap(doc, smask)
        rgba = fitz.Pixmap(base, mask)
    else:
        rgba = fitz.Pixmap(fitz.csRGB, base) if base.n not in (3, 4) else base
    mode = "RGBA" if rgba.n == 4 else "RGB"
    return Image.frombytes(mode, (rgba.width, rgba.height), rgba.samples).convert("RGBA")


def create_hd_atlas(doc, pdf_page, rendered_page, level):
    page_images = rendered_page.get_image_info(xrefs=True)
    atlas = Image.new("RGBA", (5 * TILE, 5 * TILE), (0, 0, 0, 0))
    extracted = 0
    for index, anchor in enumerate(anchors_for(pdf_page)):
        left = anchor["x0"] < 200
        candidates = []
        for source in page_images:
            x0, y0, x1, y1 = source["bbox"]
            if (source["xref"] > 0 and 17 < y1 - y0 < 46
                and anchor["top"] + 3 < y0 < anchor["top"] + 35
                and (30 < x0 < 165 if left else 304 < x0 < 440)
                and source["width"] >= 64 and source["height"] >= 64):
                candidates.append(source)
        if candidates:
            item = max(candidates, key=lambda source: source["width"] * source["height"])
            picture = extract_pixmap(doc, item["xref"])
            extracted += 1
        else:
            # The workbooks contain a few vector illustrations in place of
            # raster images. Preserve these with a high-resolution crop.
            x = (40 if left else 315) if level == "A1" else (78 if left else 355)
            rect = fitz.Rect(x, anchor["top"] + 8, x + 43, anchor["top"] + 43)
            pix = rendered_page.get_pixmap(matrix=fitz.Matrix(5, 5), clip=rect, alpha=True)
            picture = Image.frombytes("RGBA", (pix.width, pix.height), pix.samples)
        picture = ImageOps.contain(picture, (ART_SIZE, ART_SIZE), Image.Resampling.LANCZOS)
        x = (index % 5) * TILE + (TILE - picture.width) // 2
        y = (index // 5) * TILE + (TILE - picture.height) // 2
        atlas.alpha_composite(picture, (x, y))
    return atlas, extracted


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input-dir", type=Path, required=True)
    parser.add_argument("--out-dir", type=Path, required=True)
    parser.add_argument("--levels", nargs="*", choices=list(SOURCE_NAMES), default=list(SOURCE_NAMES))
    parser.add_argument("--sets", nargs="*", type=int, help="Optional 1-based set numbers (for QA)")
    parser.add_argument("--repair-only", action="store_true", help="Regenerate only empty/corrupt HD files")
    parser.add_argument("--premium-sheet", type=Path, help="Transparent 5x5 premium remake for A1 set 01")
    args = parser.parse_args()
    args.out_dir.mkdir(parents=True, exist_ok=True)
    for level in args.levels:
        path = args.input_dir / SOURCE_NAMES[level]
        if not path.exists():
            raise FileNotFoundError(path)
        set_number = 0
        native_total = 0
        with pdfplumber.open(path) as pdf, fitz.open(path) as doc:
            for page_index, page in enumerate(pdf.pages):
                text = page.extract_text() or ""
                if "25 ILLUSTRATED WORDS" not in text and "25 WORD PICTURES" not in text:
                    continue
                set_number += 1
                if args.sets and set_number not in args.sets:
                    continue
                dest = args.out_dir / f"{level.lower()}-{set_number:02}.webp"
                if args.repair_only and dest.exists() and dest.stat().st_size > 100:
                    try:
                        with Image.open(dest) as existing:
                            existing.verify()
                        continue
                    except (OSError, ValueError):
                        pass
                atlas, native = create_hd_atlas(doc, page, doc[page_index], level)
                native_total += native
                if level == "A1" and set_number == 1 and args.premium_sheet:
                    premium = Image.open(args.premium_sheet).convert("RGBA")
                    atlas = premium.resize((5 * TILE, 5 * TILE), Image.Resampling.LANCZOS)
                temporary = dest.with_name(dest.stem + ".part.webp")
                atlas.save(temporary, "WEBP", quality=88, method=5)
                if temporary.stat().st_size < 100:
                    atlas.save(temporary, "WEBP", lossless=True, method=3)
                if temporary.stat().st_size < 100:
                    raise ValueError(f"Empty HD atlas: {dest}")
                with Image.open(temporary) as verified:
                    verified.verify()
                temporary.replace(dest)
        if set_number != 36:
            raise ValueError(f"{level}: found {set_number} sets, expected 36")
        print(f"{level}: {len(args.sets) if args.sets else 36} HD atlases, {native_total} original alpha images", flush=True)


if __name__ == "__main__":
    main()
