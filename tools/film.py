"""Render the hero "film": the pencil sketch turns into the real photo while the camera glides
slowly into the garden. Made only from the real photo (img/hero.jpg), its sketch twin
(img/hero-s.jpg) and its depth map (img/hero-depth.png) – nothing is invented.

Output (scrubbed by scroll on the page, like Apple's product pages):
  img/film/d/000.webp …  desktop frames, 4:3, 1280×960
  img/film/m/000.webp …  phone frames, 3:4, 720×960

Usage (repo root):
  python tools/film.py            # 64 frames
  python tools/film.py 96         # more frames = smoother, heavier
"""
import os
import sys
import cv2
import numpy as np

N = int(sys.argv[1]) if len(sys.argv) > 1 else 64
P = cv2.imread("img/hero.jpg").astype(np.float32) / 255
S = cv2.imread("img/hero-s.jpg").astype(np.float32) / 255
H, W = P.shape[:2]
S = cv2.resize(S, (W, H), interpolation=cv2.INTER_AREA)

d = cv2.imread("img/hero-depth.png", cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
d = cv2.resize(d, (W, H), interpolation=cv2.INTER_CUBIC)
d = cv2.GaussianBlur(d, (0, 0), 6)                     # extra smoothing: no tearing at edges
Z = 1.0 / (0.14 + 0.86 * d)                            # white = near (Z≈1), black = far (Z≈7)

f = W * 0.95                                           # focal length in px
cx, cy = W * 0.5, H * 0.46                             # look slightly above centre (into the garden)
uu, vv = np.meshgrid(np.arange(W, dtype=np.float32), np.arange(H, dtype=np.float32))


def ease(t):        # smooth start and end
    return t * t * (3 - 2 * t)


def warp(img, dz, dx, dy):
    """Backward-warp the image to a camera moved by (dx, dy, dz). Depth is looked up at the
    target and refined a few times, so near things move more than far ones (parallax)."""
    Zt = Z.copy()
    for _ in range(3):
        k = (Zt - dz) / Zt
        mu = (cx + (uu - cx) * k + dx * f / Zt).astype(np.float32)
        mv = (cy + (vv - cy) * k + dy * f / Zt).astype(np.float32)
        Zt = cv2.remap(Z, mu, mv, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return cv2.remap(img, mu, mv, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)


def saturate(img, s):
    g = img.mean(axis=2, keepdims=True)
    return g + (img - g) * s


def crop(img, aspect, cxr=0.5, zoom=1.06):
    """Centre crop with a little overscan, so warped borders never show."""
    h, w = img.shape[:2]
    ch = h / zoom
    cw = min(w / zoom, ch * aspect)
    ch = cw / aspect
    x0 = int(np.clip(w * cxr - cw / 2, 0, w - cw)); y0 = int((h - ch) / 2)
    return img[y0:y0 + int(ch), x0:x0 + int(cw)]


os.makedirs("img/film/d", exist_ok=True)
os.makedirs("img/film/m", exist_ok=True)
for i in range(N):
    t = i / (N - 1)
    m = ease(t)
    dz, dx, dy = 0.26 * m, 0.035 * m, -0.02 * m        # glide forward, a touch right and up
    s = np.clip(warp(S, dz, dx, dy), 0, 1)
    p = np.clip(warp(P, dz, dx, dy), 0, 1)
    a = float(np.clip((t - 0.12) / 0.62, 0, 1)); a = a * a * (3 - 2 * a)   # sketch → colour
    photo = saturate(p, 0.25 + 0.75 * a)
    out = s * (1 - a) + photo * a
    # pencil lines linger on top of the colour a little, then fade
    lw = 0.45 * a * (1 - a) * 2
    out = out * (1 - lw + lw * np.clip(cv2.cvtColor(s.astype(np.float32), cv2.COLOR_BGR2GRAY), 0, 1)[..., None] ** 0.6)
    out = np.clip(out * 255, 0, 255).astype(np.uint8)
    dimg = cv2.resize(crop(out, 4 / 3), (1280, 960), interpolation=cv2.INTER_AREA)
    mimg = cv2.resize(crop(out, 3 / 4, cxr=0.52), (720, 960), interpolation=cv2.INTER_AREA)
    cv2.imwrite(f"img/film/d/{i:03d}.webp", dimg, [cv2.IMWRITE_WEBP_QUALITY, 50])
    cv2.imwrite(f"img/film/m/{i:03d}.webp", mimg, [cv2.IMWRITE_WEBP_QUALITY, 48])
    print(i, end=" ", flush=True)
print()
