#!/usr/bin/env python3
"""
remove_bg.py — Local AI background removal for Toys4Joys product photos.

Uses rembg (U2Net / ISNet) to produce pixel-perfect transparent PNGs
at the original image resolution. No external API, no quality loss.

INSTALL (once):
    pip install rembg[gpu] Pillow          # if you have a CUDA GPU
    pip install rembg Pillow               # CPU-only (still fast)

USAGE:
    # Single image → creates product_nobg.png next to it
    python remove_bg.py product.jpg

    # Single image with explicit output path
    python remove_bg.py product.jpg output/product.png

    # Whole folder → creates <folder>/nobg/ with all results
    python remove_bg.py photos/
    python remove_bg.py photos/ output/

    # Choose a different model (default: isnet-general-use)
    python remove_bg.py product.jpg --model u2net

MODELS:
    isnet-general-use   Best overall quality (recommended, default)
    u2net               Good general purpose, fast
    u2net_human_seg     Optimised for people/clothing
    silueta             Fast, lower memory usage

OUTPUT:
    Transparent PNG at full original resolution.
    Upload directly to the KI-Produkt-Tool — it detects the alpha
    channel and skips its own background-removal step.
"""

import sys
import os
import argparse
from pathlib import Path
from io import BytesIO

# ── Dependency check ─────────────────────────────────────────────────────────
try:
    from rembg import remove, new_session
except ImportError:
    print("ERROR: rembg is not installed.")
    print("Run:  pip install rembg Pillow")
    sys.exit(1)

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow is not installed.")
    print("Run:  pip install Pillow")
    sys.exit(1)


SUPPORTED_EXTS = {'.jpg', '.jpeg', '.png', '.webp', '.bmp', '.tiff', '.tif', '.heic', '.heif'}


# ── Core processing ───────────────────────────────────────────────────────────

def process_image(input_path: Path, output_path: Path, session) -> None:
    """
    Remove background from one image and save a transparent PNG.

    Strategy:
      1. Read the original at full resolution via Pillow (lossless).
      2. Feed raw bytes to rembg — it returns a transparent PNG at the same
         resolution (rembg never downscales).
      3. Write the result directly — RGB pixels are untouched, only the
         alpha channel is added.
    """
    print(f"  {input_path.name}", end="", flush=True)

    # Read original bytes — keep them raw so rembg sees the full resolution
    raw_bytes = input_path.read_bytes()

    # AI background removal (rembg returns RGBA PNG bytes)
    result_bytes = remove(raw_bytes, session=session)

    # Load result and verify resolution matches input
    result_img = Image.open(BytesIO(result_bytes)).convert("RGBA")
    orig_img   = Image.open(BytesIO(raw_bytes))
    orig_size  = orig_img.size  # (width, height)

    if result_img.size != orig_size:
        # Shouldn't happen with rembg, but just in case — scale mask back up
        print(f" [mask {result_img.size} → upscaling to {orig_size}]", end="")
        # Apply the rembg mask onto the original full-res pixels
        orig_rgba = orig_img.convert("RGBA")
        mask      = result_img.resize(orig_size, Image.LANCZOS).split()[3]  # alpha only
        orig_rgba.putalpha(mask)
        result_img = orig_rgba

    output_path.parent.mkdir(parents=True, exist_ok=True)
    result_img.save(output_path, "PNG", optimize=False, compress_level=1)

    w, h = result_img.size
    kb   = output_path.stat().st_size // 1024
    print(f"  →  {output_path.name}  ({w}×{h}px, {kb} KB)")


# ── CLI ───────────────────────────────────────────────────────────────────────

def parse_args():
    p = argparse.ArgumentParser(
        description="Remove image backgrounds locally using AI (rembg).",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument("input",  help="Input image file or folder")
    p.add_argument("output", nargs="?", help="Output file or folder (optional)")
    p.add_argument(
        "--model", "-m",
        default="isnet-general-use",
        help="rembg model to use (default: isnet-general-use)",
    )
    return p.parse_args()


def main():
    args   = parse_args()
    inp    = Path(args.input)
    model  = args.model

    if not inp.exists():
        print(f"ERROR: '{inp}' does not exist.")
        sys.exit(1)

    # ── Load model once ───────────────────────────────────────────────────────
    print(f"Loading model '{model}' (downloads on first use, ~170 MB)…")
    session = new_session(model)
    print("Model ready.\n")

    # ── Folder mode ───────────────────────────────────────────────────────────
    if inp.is_dir():
        out_dir = Path(args.output) if args.output else inp / "nobg"
        out_dir.mkdir(parents=True, exist_ok=True)

        images = sorted(
            f for f in inp.iterdir()
            if f.is_file() and f.suffix.lower() in SUPPORTED_EXTS
        )

        if not images:
            print(f"No supported images found in '{inp}'.")
            print(f"Supported: {', '.join(sorted(SUPPORTED_EXTS))}")
            sys.exit(1)

        print(f"Processing {len(images)} image(s)  →  {out_dir}\n")
        ok, failed = 0, []
        for img_path in images:
            out_path = out_dir / (img_path.stem + "_nobg.png")
            try:
                process_image(img_path, out_path, session)
                ok += 1
            except Exception as e:
                print(f"  FAILED: {e}")
                failed.append(img_path.name)

        print(f"\n✓ {ok} succeeded", end="")
        if failed:
            print(f"  ✗ {len(failed)} failed: {', '.join(failed)}")
        else:
            print()
        print(f"Output: {out_dir.resolve()}")

    # ── Single-file mode ──────────────────────────────────────────────────────
    else:
        if inp.suffix.lower() not in SUPPORTED_EXTS:
            print(f"WARNING: '{inp.suffix}' may not be supported. Trying anyway…")

        if args.output:
            out_path = Path(args.output)
            if out_path.is_dir():
                out_path = out_path / (inp.stem + "_nobg.png")
        else:
            out_path = inp.parent / (inp.stem + "_nobg.png")

        print(f"Processing:")
        try:
            process_image(inp, out_path, session)
            print(f"\n✓ Done  →  {out_path.resolve()}")
        except Exception as e:
            print(f"\n✗ Failed: {e}")
            sys.exit(1)


if __name__ == "__main__":
    main()
