#!/usr/bin/env python3
"""Builds fonts/posedge-clock.woff: the glyphs the Posedge status-bar clock is drawn with.

The status bar cannot change fonts, but it can show contributed icons. So the clock's characters
are taken from JetBrains Mono (SIL Open Font License 1.1), scaled to sit nicely in the 16 px icon
box on the status bar baseline, remapped to Private Use Area code points and contributed as icons
(`contributes.icons` in package.json, written by build/manifest.mts from the generated map).

Usage:
    python build/font/build_clock_font.py [--src path/to/JetBrainsMono-Bold.ttf]

Only needed when the glyph set or the source font changes; the outputs are committed.
Requires: pip install fonttools
"""

from __future__ import annotations

import argparse
import glob
import json
import os
import sys

from fontTools.fontBuilder import FontBuilder
from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.recordingPen import DecomposingRecordingPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.ttGlyphPen import TTGlyphPen
from fontTools.ttLib import TTFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
OUT_FONT = os.path.join(ROOT, "fonts", "posedge-clock.woff")
OUT_MAP = os.path.join(ROOT, "build", "font", "glyph-map.json")

# Characters the clock can render with the glyph font (anything else falls back to UI text).
PUNCT = {
    ":": "colon", ".": "dot", "-": "dash", "/": "slash", "\u00b7": "middot", "@": "at",
    "(": "lparen", ")": "rparen", "[": "lbracket", "]": "rbracket", "%": "percent",
    ",": "comma", "+": "plus", "#": "hash", " ": "space",
}
CHARS = "0123456789" + "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + "abcdefghijklmnopqrstuvwxyz" + "".join(PUNCT)

UPM = 1000
ASCENT, DESCENT = 800, 200  # baseline 12.8 px from the top of the 16 px icon box
SCALE = 0.77  # JetBrains Mono caps (730 units) become ~9 px tall, a touch larger than UI text
SPACE_ADVANCE = 280


def icon_id(ch: str) -> str:
    if ch.isdigit():
        return f"posedge-c-{ch}"
    if ch.isalpha():
        return f"posedge-c-up-{ch.lower()}" if ch.isupper() else f"posedge-c-{ch}"
    return f"posedge-c-{PUNCT[ch]}"


def find_source() -> str | None:
    home = os.path.expanduser("~")
    candidates = [
        os.path.join(os.environ.get("LOCALAPPDATA", ""), "Microsoft", "Windows", "Fonts", "JetBrainsMono-Bold.ttf"),
        r"C:\Windows\Fonts\JetBrainsMono-Bold.ttf",
        *glob.glob(os.path.join(home, ".local", "share", "fonts", "**", "JetBrainsMono-Bold.ttf"), recursive=True),
        *glob.glob(os.path.join(home, ".fonts", "**", "JetBrainsMono-Bold.ttf"), recursive=True),
        *glob.glob("/usr/share/fonts/**/JetBrainsMono-Bold.ttf", recursive=True),
        *glob.glob(os.path.join(home, "Library", "Fonts", "JetBrainsMono-Bold.ttf")),
    ]
    return next((p for p in candidates if p and os.path.isfile(p)), None)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--src", help="path to JetBrainsMono-Bold.ttf")
    args = parser.parse_args()
    src = args.src or find_source()
    if not src:
        print("JetBrainsMono-Bold.ttf not found. Download JetBrains Mono (OFL) and pass --src.", file=sys.stderr)
        return 1

    source = TTFont(src)
    cmap = source.getBestCmap()
    glyph_set = source.getGlyphSet()
    hmtx = source["hmtx"]

    order = [".notdef"]
    glyphs = {".notdef": TTGlyphPen(None).glyph()}
    metrics = {".notdef": (SPACE_ADVANCE, 0)}
    char_map = {}
    entries = []
    for i, ch in enumerate(CHARS):
        name = f"g{i:02d}"
        codepoint = 0xE000 + i
        pen = TTGlyphPen(None)
        bounds = BoundsPen(None)
        if ch == " ":
            advance = SPACE_ADVANCE
        else:
            src_name = cmap.get(ord(ch))
            if src_name is None:
                print(f"source font has no glyph for {ch!r}", file=sys.stderr)
                return 1
            # Decompose composites (e.g. accented or derived glyphs) so the outline stands alone.
            outline = DecomposingRecordingPen(glyph_set)
            glyph_set[src_name].draw(outline)
            outline.replay(TransformPen(pen, (SCALE, 0, 0, SCALE, 0, 0)))
            outline.replay(TransformPen(bounds, (SCALE, 0, 0, SCALE, 0, 0)))
            advance = round(hmtx[src_name][0] * SCALE)
        glyph = pen.glyph()
        lsb = round(bounds.bounds[0]) if bounds.bounds else 0
        order.append(name)
        glyphs[name] = glyph
        metrics[name] = (advance, lsb)
        char_map[codepoint] = name
        entries.append({"char": ch, "id": icon_id(ch), "codepoint": codepoint})

    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap(char_map)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASCENT, descent=-DESCENT)
    fb.setupNameTable(
        {
            "familyName": "Posedge Clock",
            "styleName": "Bold",
            "uniqueFontIdentifier": "Posedge Clock Bold",
            "fullName": "Posedge Clock Bold",
            "psName": "PosedgeClock-Bold",
            "version": "Version 1.000",
            "copyright": "Copyright 2020 The JetBrains Mono Project Authors (https://github.com/JetBrains/JetBrainsMono). "
            "Subset, scaled and remapped for the Posedge VS Code extension.",
            "licenseDescription": "This Font Software is licensed under the SIL Open Font License, Version 1.1.",
            "licenseInfoURL": "https://openfontlicense.org",
        }
    )
    fb.setupOS2(
        sTypoAscender=ASCENT, sTypoDescender=-DESCENT, sTypoLineGap=0,
        usWinAscent=ASCENT, usWinDescent=DESCENT, usWeightClass=700,
        achVendID="PSDG", fsType=0,
    )
    fb.setupPost()
    fb.font.flavor = "woff"
    os.makedirs(os.path.dirname(OUT_FONT), exist_ok=True)
    fb.save(OUT_FONT)

    with open(OUT_MAP, "w", encoding="utf-8") as f:
        json.dump({"font": "./fonts/posedge-clock.woff", "glyphs": entries}, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"wrote {os.path.relpath(OUT_FONT, ROOT)} ({os.path.getsize(OUT_FONT)} bytes, {len(entries)} glyphs)")
    print(f"wrote {os.path.relpath(OUT_MAP, ROOT)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
