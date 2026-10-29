#!/usr/bin/env python3
"""يولّد خلفيات التطبيق المكوّنة من شعار «دليل جنزور» مكررًا: 6 أعمدة × 10 صفوف = 60 شعارًا.

الاستخدام: python3 scripts/make-logo-backgrounds.py
المخرجات: public/images/backgrounds/logo-<id>.webp + logo-<id>-dark.webp + logo-<id>-thumb.webp
يتطلب: pip install pillow numpy
"""
from PIL import Image, ImageFilter
import numpy as np
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOGO = os.path.join(ROOT, "public/images/logo-app.webp")
OUT = os.path.join(ROOT, "public/images/backgrounds")
W, H = 1080, 1920
COLS, ROWS = 6, 10
CELL_W, CELL_H = W / COLS, H / ROWS  # 180 × 192

logo = Image.open(LOGO).convert("RGBA")
logo = logo.crop(logo.getbbox())


def gradient(size, top, bottom, diagonal=False):
    w, h = size
    yy, xx = np.mgrid[0:h, 0:w]
    t = ((xx + yy) / (w + h - 2)) if diagonal else (yy / max(h - 1, 1))
    arr = np.zeros((h, w, 4), np.uint8)
    for i in range(3):
        arr[..., i] = (top[i] * (1 - t) + bottom[i] * t).astype(np.uint8)
    arr[..., 3] = 255
    return Image.fromarray(arr, "RGBA")


def tiled_logos(size, scale, opacity, stagger=False, shadow=False, mono=None):
    """طبقة شفافة فيها الشعار مكرر 6×10. mono=(r,g,b) يحوّل الشعار إلى لون واحد (ووترمارك)."""
    w, h = size
    layer = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    lw = int(CELL_W * scale)
    lh = int(lw * logo.height / logo.width)
    small = logo.resize((lw, lh), Image.LANCZOS)
    if mono is not None:
        a = np.array(small)
        a[..., 0], a[..., 1], a[..., 2] = mono
        small = Image.fromarray(a, "RGBA")
    if shadow:
        sh = Image.new("RGBA", (lw + 24, lh + 24), (0, 0, 0, 0))
        alpha = small.split()[3]
        dark = Image.new("RGBA", small.size, (0, 0, 0, 110))
        dark.putalpha(Image.eval(alpha, lambda v: int(v * 0.45)))
        sh.alpha_composite(dark, (12, 16))
        sh = sh.filter(ImageFilter.GaussianBlur(6))
    for r in range(ROWS):
        for c in range(COLS):
            cx = c * CELL_W + CELL_W / 2
            if stagger and r % 2 == 1:
                cx += CELL_W / 2
            cy = r * CELL_H + CELL_H / 2
            x, y = int(cx - lw / 2), int(cy - lh / 2)
            if shadow:
                layer.alpha_composite(sh, (x - 12, y - 12))
            layer.alpha_composite(small, (x, y))
            if stagger and r % 2 == 1 and c == COLS - 1:
                # يكمل الصف المزاح من اليسار حتى لا يبقى فراغ على الطرف
                layer.alpha_composite(small, (int(-CELL_W / 2 + CELL_W / 2 - lw / 2), y))
    if opacity < 1:
        a = np.array(layer)
        a[..., 3] = (a[..., 3] * opacity).astype(np.uint8)
        layer = Image.fromarray(a, "RGBA")
    return layer


VARIANTS = [
    # id, (light bg top, bottom), (dark bg top, bottom), scale, opacity light, opacity dark, stagger, shadow, mono
    ("white", ((255, 255, 255), (246, 240, 230)), ((28, 30, 36), (18, 20, 26)), 0.80, 0.34, 0.22, False, False, None),
    ("navy", ((16, 38, 72), (7, 20, 42)), ((10, 22, 44), (4, 10, 24)), 0.80, 0.55, 0.40, False, True, None),
    ("orange", ((255, 170, 48), (240, 100, 12)), ((120, 56, 8), (70, 28, 4)), 0.80, 0.60, 0.35, False, True, None),
    ("green", ((22, 120, 84), (6, 62, 42)), ((8, 50, 34), (3, 26, 18)), 0.80, 0.55, 0.38, False, True, None),
]

os.makedirs(OUT, exist_ok=True)
for vid, light, dark, scale, op_l, op_d, stagger, shadow, mono in VARIANTS:
    for suffix, colours, opacity in (("", light, op_l), ("-dark", dark, op_d)):
        bg = gradient((W, H), colours[0], colours[1], diagonal=(vid in ("orange", "green")))
        layer = tiled_logos((W, H), scale, opacity, stagger=stagger, shadow=shadow and suffix == "", mono=(mono if suffix == "" else ((150, 180, 220) if mono else None)))
        bg.alpha_composite(layer)
        path = os.path.join(OUT, f"logo-{vid}{suffix}.webp")
        bg.convert("RGB").save(path, quality=80, method=6)
        print(path, os.path.getsize(path) // 1024, "KB")
        if suffix == "":
            bg.convert("RGB").resize((180, 320), Image.LANCZOS).save(os.path.join(OUT, f"logo-{vid}-thumb.webp"), quality=70, method=6)
