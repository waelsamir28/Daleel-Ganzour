#!/usr/bin/env python3
"""يولّد صور معاينة المشاركة (Open Graph 1200×630) لكل قسم وتخصص له ملصق.

الاستخدام:  python3 scripts/og-build.py cats.json
حيث cats.json = [{id,name,parentId,color}] (يمكن استخراجه من initialCategories).
يحتاج: pillow, arabic_reshaper, python-bidi.
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import arabic_reshaper
from bidi.algorithm import get_display

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FONT = os.path.join(ROOT, "public/fonts/ge-ss-two-bold.ttf")
STICKERS = os.path.join(ROOT, "public/images/specialty-stickers")
LOGO = os.path.join(ROOT, "public/images/logo-daleel-transparent.png")
LATIN_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
OUT = os.path.join(ROOT, "public/images/og")
W, H = 1200, 630
SITE = "دليل المهن والخدمات بقرية جنزور"
TAGLINE = "الأرقام والعناوين والتواصل المباشر.. بضغطة واحدة"
URL = "daleel-ganzour.vercel.app"

def ar(text):
    return get_display(arabic_reshaper.reshape(text))

def hex_rgb(h):
    h = h.lstrip("#"); return tuple(int(h[i:i+2], 16) for i in (0, 2, 4))

def mix(a, b, t):
    return tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))

def font(size):
    return ImageFont.truetype(FONT, size)

def text_w(draw, text, f):
    l, t, r, b = draw.textbbox((0, 0), text, font=f); return r - l

def build(cat, parent):
    color = hex_rgb(cat["color"])
    light = mix(color, (255, 255, 255), 0.86)
    lighter = mix(color, (255, 255, 255), 0.95)
    # خلفية متدرجة ناعمة
    img = Image.new("RGB", (W, H), lighter)
    grad = Image.linear_gradient("L").rotate(90, expand=True).resize((W, H))
    img = Image.composite(Image.new("RGB", (W, H), light), img, grad)
    draw = ImageDraw.Draw(img)
    # دائرة ملونة خلف الملصق
    glow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    gd = ImageDraw.Draw(glow)
    gd.ellipse((W - 560, -120, W + 40, 560), fill=color + (70,))
    glow = glow.filter(ImageFilter.GaussianBlur(60))
    img.paste(glow, (0, 0), glow)
    # شريط سفلي بلون القسم
    draw = ImageDraw.Draw(img)
    draw.rectangle((0, H - 14, W, H), fill=color)
    # الملصق
    sticker_path = os.path.join(STICKERS, f"{cat['id']}.webp")
    st = Image.open(sticker_path).convert("RGBA").resize((400, 400), Image.LANCZOS)
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    sd = ImageDraw.Draw(shadow)
    sd.rounded_rectangle((W - 500 + 10, 125 + 26, W - 100 + 10, 525 + 26), radius=92, fill=(20, 30, 50, 90))
    shadow = shadow.filter(ImageFilter.GaussianBlur(26))
    img.paste(shadow, (0, 0), shadow)
    img.paste(st, (W - 500, 125), st)
    # النصوص (محاذاة يمين النص = يسار الملصق)
    draw = ImageDraw.Draw(img)
    right = W - 560
    dark = (18, 32, 56)
    # اسم التخصص
    name = cat["name"]
    size = 96
    f = font(size)
    while text_w(draw, ar(name), f) > 600 and size > 48:
        size -= 6; f = font(size)
    y = 150 if parent else 190
    draw.text((right, y), ar(name), font=f, fill=dark, anchor="ra")
    y += size + 26
    # شارة القسم الرئيسي
    if parent:
        chip_font = font(36)
        chip_text = ar(f"قسم {parent['name']}")
        cw = text_w(draw, chip_text, chip_font) + 56
        draw.rounded_rectangle((right - cw, y, right, y + 64), radius=32, fill=color)
        draw.text((right - 28, y + 10), chip_text, font=chip_font, fill=(255, 255, 255), anchor="ra")
        y += 64 + 34
    else:
        y += 10
    # اسم الدليل + السطر الدعائي
    draw.text((right, y), ar(SITE), font=font(38), fill=mix(dark, color, 0.35), anchor="ra")
    y += 60
    tf, ts = font(30), 30
    while text_w(draw, ar(TAGLINE), tf) > right - 56 and ts > 18:
        ts -= 2; tf = font(ts)
    draw.text((right, y), ar(TAGLINE), font=tf, fill=mix(dark, (120, 130, 150), 0.5), anchor="ra")
    # الشعار + الرابط أسفل اليسار
    logo = Image.open(LOGO).convert("RGBA").resize((96, 96), Image.LANCZOS)
    img.paste(logo, (56, H - 14 - 112), logo)
    latin = ImageFont.truetype(LATIN_FONT, 30) if os.path.exists(LATIN_FONT) else font(30)
    draw.text((164, H - 14 - 66), URL, font=latin, fill=mix(dark, color, 0.3), anchor="lm")
    os.makedirs(OUT, exist_ok=True)
    out = os.path.join(OUT, f"{cat['id']}.jpg")
    img.save(out, "JPEG", quality=80, optimize=True, progressive=True)
    return out

def main():
    cats = json.load(open(sys.argv[1], encoding="utf-8"))
    only = set(sys.argv[2].split(",")) if len(sys.argv) > 2 else None
    by_id = {c["id"]: c for c in cats}
    total = 0
    for c in cats:
        if only and c["id"] not in only: continue
        if not os.path.exists(os.path.join(STICKERS, f"{c['id']}.webp")): continue
        out = build(c, by_id.get(c["parentId"]) if c["parentId"] else None)
        total += os.path.getsize(out)
    print(f"done, total {total // 1024} KB")

if __name__ == "__main__":
    main()
