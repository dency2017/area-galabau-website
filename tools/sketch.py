"""Make a web-sized photo plus its pencil-sketch twin for the AREA Galabau site.

Every photo on the site exists twice:
  img/<name>.jpg    the real photo (resized, compressed)
  img/<name>-s.jpg  a pencil-sketch version on the site's paper colour

The page shows the sketch first and fades the real photo in over it.

Usage (run from the repo root):
  pip install opencv-python-headless pillow numpy
  python tools/sketch.py path/to/photo.jpg p11            # gallery photo, 1600px long edge
  python tools/sketch.py path/to/photo.jpg hero 2200      # hero photo, larger

Then add the project to PROJ in index.html (see CLAUDE.md).
"""
import sys
import cv2
import numpy as np
from PIL import Image, ImageOps

PAPER = np.array([0xE6, 0xEE, 0xF1], np.float32)  # BGR of #F1EEE6 (site paper colour)
INK = np.array([0x1C, 0x21, 0x1F], np.float32)


def load(path, long_edge):
    im = ImageOps.exif_transpose(Image.open(path)).convert("RGB")
    im.thumbnail((long_edge, long_edge), Image.LANCZOS)
    return im


def sketch(rgb):
    g = cv2.cvtColor(np.array(rgb), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    g = cv2.bilateralFilter(g, 11, 0.1, 9)
    s = max(g.shape) / 1600
    # XDoG: ink-like contour lines
    k1, k2 = 0.9 * s, 0.9 * s * 1.6
    d = cv2.GaussianBlur(g, (0, 0), k1) - 0.985 * cv2.GaussianBlur(g, (0, 0), k2)
    lines = np.clip(np.where(d >= -0.004, 1.0, 1 + np.tanh(260 * (d + 0.004))), 0, 1)
    # soft pencil shading (colour dodge)
    inv = cv2.GaussianBlur(1 - g, (0, 0), 14 * s)
    shade = np.clip(g / np.maximum(1 - inv, 1e-3), 0, 1)
    shade = 1 - (1 - shade) * 0.55
    v = np.clip(lines * shade, 0, 1)
    v = 1 - np.clip((1 - v) * 1.35, 0, 1) ** 0.85
    out = PAPER[None, None] * v[..., None] + INK[None, None] * (1 - v[..., None])
    return Image.fromarray(cv2.cvtColor(out.astype(np.uint8), cv2.COLOR_BGR2RGB))


if __name__ == "__main__":
    if len(sys.argv) < 3:
        sys.exit(__doc__)
    src, name = sys.argv[1], sys.argv[2]
    long_edge = int(sys.argv[3]) if len(sys.argv) > 3 else 1600
    im = load(src, long_edge)
    im.save(f"img/{name}.jpg", quality=80, optimize=True, progressive=True)
    sketch(im).save(f"img/{name}-s.jpg", quality=78, optimize=True, progressive=True)
    print(f"img/{name}.jpg + img/{name}-s.jpg  size={im.size}  ->  SIZE entry: {name}:[{im.size[0]},{im.size[1]}]")
