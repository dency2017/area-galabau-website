"""Make img/hero-depth.png – a smooth grayscale depth map of img/hero.jpg for the 3D hero.

White = near the camera, black = far away. The 3D hero (js/hero3d.js) pushes a finely
subdivided plane towards the camera by this value, so the terrace, raised beds and fence
separate in depth when the camera moves a few degrees.

The raw model output has hard steps at object outlines (fence vs. sky, bed vs. lawn).
Displacing a mesh by a hard step stretches triangles into visible "tears", so this script
  1. removes outliers (percentile normalisation),
  2. smooths with an edge-aware filter, then a soft blur, so every step becomes a gentle ramp,
  3. compresses the far range (sky/background shouldn't fly away).
The edges are handled in js/hero3d.js: far (black) stays exactly on the plane and only near
parts come towards the camera, and the plane is larger than the screen (overscan), so no gap
can ever open at the border.

Setup (once – torch has no wheels for very new Pythons, so use 3.12 in its own venv):
  py -3.12 -m venv tools/.venv
  tools/.venv/Scripts/python -m pip install torch --index-url https://download.pytorch.org/whl/cpu
  tools/.venv/Scripts/python -m pip install transformers pillow numpy opencv-python-headless

Usage (from the repo root):
  tools/.venv/Scripts/python tools/depth.py                 # img/hero.jpg -> img/hero-depth.png
  tools/.venv/Scripts/python tools/depth.py img/x.jpg img/x-depth.png
"""
import sys
import cv2
import numpy as np
import torch
from PIL import Image
from transformers import AutoImageProcessor, AutoModelForDepthEstimation

MODEL = "depth-anything/Depth-Anything-V2-Small-hf"
OUT_W = 1024          # depth only needs to be as detailed as the mesh (~256 columns)


def estimate(path):
    im = Image.open(path).convert("RGB")
    proc = AutoImageProcessor.from_pretrained(MODEL)
    model = AutoModelForDepthEstimation.from_pretrained(MODEL).eval()
    with torch.no_grad():
        out = model(**proc(images=im, return_tensors="pt")).predicted_depth
    d = torch.nn.functional.interpolate(out[:, None], size=im.size[::-1], mode="bicubic", align_corners=False)
    return d[0, 0].numpy().astype(np.float32), im.size


def clean(d):
    h, w = d.shape
    lo, hi = np.percentile(d, [1, 99.5])
    d = np.clip((d - lo) / (hi - lo), 0, 1).astype(np.float32)  # 0 = far, 1 = near
    d = cv2.resize(d, (OUT_W, round(OUT_W * h / w)), interpolation=cv2.INTER_AREA)
    for _ in range(3):                                         # keep shapes, flatten texture noise
        d = cv2.bilateralFilter(d, 9, 0.08, 6)
    d = cv2.GaussianBlur(d, (0, 0), 6)                         # hard outline steps -> soft ramps
    d = d ** 1.25                                              # compress the far range
    return np.clip(d, 0, 1)


if __name__ == "__main__":
    src = sys.argv[1] if len(sys.argv) > 1 else "img/hero.jpg"
    dst = sys.argv[2] if len(sys.argv) > 2 else "img/hero-depth.png"
    raw, size = estimate(src)
    d = clean(raw)
    Image.fromarray((d * 255 + 0.5).astype(np.uint8), "L").save(dst, optimize=True)
    print(f"{dst}  {d.shape[1]}x{d.shape[0]}  (from {src} {size[0]}x{size[1]})")
