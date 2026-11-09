"""Line up a before/after photo pair for the slider in the Projekte section.

Two photos taken from slightly different spots won't match when you drag the
slider. This warps the BEFORE photo onto the AFTER photo (SIFT features +
homography), crops both to the area they share, and writes:
  img/ba-before.jpg
  img/ba-after.jpg

Usage (run from the repo root):
  pip install opencv-python-headless pillow numpy
  python tools/align_before_after.py before.jpg after.jpg

Check the result by opening index.html and dragging the slider: buildings and
edges should stay still, only the changed area (e.g. the paving) should change.
"""
import sys
import cv2
import numpy as np
from PIL import Image, ImageOps


def load(p):
    return cv2.cvtColor(np.array(ImageOps.exif_transpose(Image.open(p)).convert("RGB")), cv2.COLOR_RGB2BGR)


if len(sys.argv) != 3:
    sys.exit(__doc__)
before, after = load(sys.argv[1]), load(sys.argv[2])

sift = cv2.SIFT_create(6000)
kb, db = sift.detectAndCompute(cv2.cvtColor(before, cv2.COLOR_BGR2GRAY), None)
ka, da = sift.detectAndCompute(cv2.cvtColor(after, cv2.COLOR_BGR2GRAY), None)
good = [m for m, n in cv2.BFMatcher().knnMatch(db, da, k=2) if m.distance < 0.7 * n.distance]
if len(good) < 30:
    sys.exit(f"Only {len(good)} matching points – photos are too different to align automatically.")
src = np.float32([kb[g.queryIdx].pt for g in good])
dst = np.float32([ka[g.trainIdx].pt for g in good])
H, mask = cv2.findHomography(src, dst, cv2.RANSAC, 4.0)
print(f"{len(good)} matches, {int(mask.sum())} inliers")

h, w = after.shape[:2]
warped = cv2.warpPerspective(before, H, (w, h), flags=cv2.INTER_CUBIC)
valid = cv2.warpPerspective(np.full(before.shape[:2], 255, np.uint8), H, (w, h)) > 250
cols = np.where(valid.all(0))[0]
rows = np.where(valid[:, cols[0]:cols[-1] + 1].all(1))[0]
x0, x1, y0, y1 = cols[0] + 4, cols[-1] - 4, rows[0] + 4, rows[-1] - 4

for img, name in [(after, "ba-after"), (warped, "ba-before")]:
    c = Image.fromarray(cv2.cvtColor(img[y0:y1, x0:x1], cv2.COLOR_BGR2RGB))
    c.thumbnail((1800, 1800), Image.LANCZOS)
    c.save(f"img/{name}.jpg", quality=80, optimize=True, progressive=True)
    print(f"img/{name}.jpg {c.size}")
