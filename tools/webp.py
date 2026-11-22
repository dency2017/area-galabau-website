"""Make the web versions of a project photo (run after tools/sketch.py).

  python tools/webp.py p11            -> img/p11.webp (1600, lightbox), img/p11-c.webp (900, card),
                                         img/p11-s.webp (900, sketch for the card)
  python tools/webp.py ba             -> img/ba-before(.webp|-m.webp), img/ba-after(...)
The .jpg files stay as masters (og.jpg is used for link previews and must stay JPG).
"""
import sys
from PIL import Image


def save(src, dst, long, q):
    im = Image.open(src).convert("RGB")
    w, h = im.size
    s = min(1, long / max(w, h))
    if s < 1:
        im = im.resize((round(w * s), round(h * s)), Image.LANCZOS)
    im.save(dst, "WEBP", quality=q, method=6)
    print(dst, im.size)


for n in sys.argv[1:]:
    if n == "ba":
        for k in ("ba-before", "ba-after"):
            save(f"img/{k}.jpg", f"img/{k}.webp", 1800, 80)
            save(f"img/{k}.jpg", f"img/{k}-m.webp", 900, 78)
    else:
        save(f"img/{n}.jpg", f"img/{n}.webp", 1600, 80)
        save(f"img/{n}.jpg", f"img/{n}-c.webp", 900, 78)
        save(f"img/{n}-s.jpg", f"img/{n}-s.webp", 900, 72)
