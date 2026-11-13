#!/usr/bin/env python3
"""Build the Firefox extension and emit an .xpi file.

Runs `bun run zip:firefox` (build + zip), then renames the produced
`.zip` artifact to `.xpi` for Firefox distribution.

Usage:
    python build_xpi.py [--script <bun-script>] [--output <path>]
"""

from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
OUTPUT_DIR = PROJECT_ROOT / ".output"


def run_bun(script: str) -> None:
    """Run `bun run <script>` in the project root, failing on non-zero exit."""
    print(f"[build_xpi] Running: bun run {script}")
    result = subprocess.run(["bun", "run", script], cwd=PROJECT_ROOT, text=True)
    if result.returncode != 0:
        print(f"[build_xpi] bun run failed with exit code {result.returncode}", file=sys.stderr)
        sys.exit(result.returncode)


def find_latest_zip(search_dir: Path) -> Path | None:
    """Find the most recently modified extension .zip under search_dir.

    Skips sources zips (those ending in ``-sources.zip``), since those
    contain the project source tree rather than the installable extension.
    """
    zips = [
        p for p in search_dir.rglob("*.zip")
        if not p.name.endswith("-sources.zip")
    ]
    zips.sort(key=lambda p: p.stat().st_mtime, reverse=True)
    return zips[0] if zips else None


def main() -> int:
    parser = argparse.ArgumentParser(description="Build a Firefox .xpi via bun.")
    parser.add_argument("--script", default="zip:firefox", help="bun script to run (default: zip:firefox)")
    parser.add_argument("--output", default="dashload_extension.xpi", help="output .xpi path (default: ./dashload_extension.xpi)")
    args = parser.parse_args()

    run_bun(args.script)

    zip_file = find_latest_zip(OUTPUT_DIR)
    if zip_file is None:
        print(f"[build_xpi] No .zip found under {OUTPUT_DIR}", file=sys.stderr)
        return 1

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(zip_file, out_path)

    print(f"[build_xpi] Wrote xpi: {out_path.resolve()} (source: {zip_file})")
    return 0


if __name__ == "__main__":
    sys.exit(main())