"""Make img/hero-lines.json – the pencil line work that "draws itself in" over the 3D hero sketch.

Finds the main outlines of img/hero.jpg (terrace edge, raised beds, fence, house, trees) and saves
them as simplified polylines. js/hero3d.js turns them into thin three.js LineSegments and reveals
them stroke by stroke as the visitor scrolls (longest, most important strokes first).

Usage (from the repo root, any Python with opencv + numpy, e.g. the tools/.venv from depth.py):
  python tools/lines.py                     # img/hero.jpg -> img/hero-lines.json
  python tools/lines.py img/x.jpg img/x-lines.json

Knobs: MAX_STROKES (more = denser drawing, bigger file), MIN_LEN (drop short scribbles).
"""
import json
import sys
import cv2
import numpy as np

W = 1024            # working width; coordinates are saved as integers in this space
MAX_STROKES = 420
MIN_LEN = 48        # px at W=1024
EPS = 1.1           # polyline simplification (px)


def strokes(path):
    im = cv2.imread(path)
    h = round(W * im.shape[0] / im.shape[1])
    im = cv2.resize(im, (W, h), interpolation=cv2.INTER_AREA)
    g = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY)
    for _ in range(2):                       # flatten paving/wood texture, keep big shapes
        g = cv2.bilateralFilter(g, 9, 40, 7)
    e = cv2.Canny(g, 35, 100)
    cs, _ = cv2.findContours(e, cv2.RETR_LIST, cv2.CHAIN_APPROX_NONE)
    out = []
    for c in cs:
        L = cv2.arcLength(c, False)
        if L < MIN_LEN:
            continue
        p = cv2.approxPolyDP(c, EPS, False)[:, 0]
        # Canny contours of thin edges come back as "there and back" loops: keep the first half
        if len(p) > 6 and np.linalg.norm(p[0] - p[-1]) < 4:
            p = p[: len(p) // 2 + 1]
        if len(p) >= 2:
            out.append((L, p))
    out.sort(key=lambda t: -t[0])
    return W, h, [p for _, p in out[:MAX_STROKES]]


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "img/hero.jpg"
    dst = sys.argv[2] if len(sys.argv) > 2 else "img/hero-lines.json"
    w, h, ss = strokes(src)
    data = {"w": w, "h": h, "lines": [p.flatten().astype(int).tolist() for p in ss]}
    with open(dst, "w") as f:
        json.dump(data, f, separators=(",", ":"))
    pts = sum(len(s) for s in ss)
    print(f"{dst}: {len(ss)} strokes, {pts} points")
    if "--preview" in sys.argv:
        im = np.full((h, w), 255, np.uint8)
        for s in ss:
            cv2.polylines(im, [s.reshape(-1, 1, 2)], False, 0, 1, cv2.LINE_AA)
        cv2.imwrite(dst.replace(".json", "-preview.png"), im)
