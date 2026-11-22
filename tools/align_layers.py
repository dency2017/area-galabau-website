"""Align the five cross-section renders for "Was unter dem Pflaster steckt" and export them for the web.

The renders (layer-1.png = Erdreich … layer-5.png = Fugen, made with OpenArt Kling Image 4.0 image-to-image,
each from its neighbour) sit a few pixels apart. Each one is aligned to layer-5 with OpenCV's ECC
(affine) on the soil base + shadow, which every stage shares, then cropped and saved as
  img/layers/<n>-d.webp  (1600 px wide, desktop)
  img/layers/<n>-m.webp  ( 820 px wide, phones)

Usage (repo root):
  pip install opencv-python-headless numpy
  python tools/align_layers.py path/to/folder-with-layer-1..5.png
Check the result by scrolling the section: the soil base must not jump between stages.
"""
import sys
import cv2
import numpy as np

folder = sys.argv[1] if len(sys.argv) > 1 else "."
ims = [cv2.imread(f"{folder}/layer-{i}.png") for i in range(1, 6)]
H, W = ims[0].shape[:2]
s = 0.5


def prep(im):
    g = cv2.cvtColor(cv2.resize(im, None, fx=s, fy=s, interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2GRAY).astype(np.float32)
    return cv2.GaussianBlur(g, (0, 0), 5)


ref = prep(ims[4])
h, w = ref.shape
mask = np.zeros((h, w), np.uint8)
mask[int(h * .55):int(h * .97), :] = 255
out = []
for i, im in enumerate(ims):
    if i == 4:
        out.append(im)
        continue
    warp = np.eye(2, 3, dtype=np.float32)
    cc, warp = cv2.findTransformECC(ref, prep(im), warp, cv2.MOTION_AFFINE,
                                    (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 300, 1e-6), mask, 5)
    warp[:, 2] /= s
    print(f"layer-{i + 1}: correlation {cc:.3f}")
    out.append(cv2.warpAffine(im, warp, (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE))

y0, y1 = int(H * .10), int(H * .92)
for i, im in enumerate(out, 1):
    im = im[y0:y1]
    for width, q, tag in [(1600, 74, "d"), (820, 70, "m")]:
        hh = round(im.shape[0] * width / im.shape[1])
        cv2.imwrite(f"img/layers/{i}-{tag}.webp", cv2.resize(im, (width, hh), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_WEBP_QUALITY, q])
print("done")
