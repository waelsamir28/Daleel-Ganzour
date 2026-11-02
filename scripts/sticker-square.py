"""تحويل صور أيقونات (مربع ملوّن يملأ الإطار) إلى ملصق WebP 256px شفاف الزوايا.

الاستخدام: python3 scripts/sticker-square.py <مجلد المصدر> id1,id2,...
- الصور المولّدة بتيجي بخلفية بيضاء حول البلاطة الملوّنة، فبنقصّ البلاطة بالظبط،
  بنكبّرها 256px، وبنعمل الزوايا دائرية زي باقي الملصقات في public/images/specialty-stickers.
"""
import sys, os
from PIL import Image, ImageDraw

SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "images", "specialty-stickers")
SIZE = 256
RADIUS = 58
WHITE_CUTOFF = 240  # أقل من كده = جزء من البلاطة الملوّنة


def tile_bbox(im):
    px = im.load()
    w, h = im.size
    xs, ys = [], []
    for y in range(0, h, 2):
        for x in range(0, w, 2):
            if min(px[x, y][:3]) < WHITE_CUTOFF:
                xs.append(x)
                ys.append(y)
    if not xs:
        return (0, 0, w, h)
    return (min(xs), min(ys), max(xs) + 1, max(ys) + 1)


def process(sticker_id):
    im = Image.open(f"{SRC}/{sticker_id}.png").convert("RGB")
    im = im.crop(tile_bbox(im))
    # البلاطة مربعة تقريبًا: نوسّطها على كانفاس مربّع قبل التصغير.
    side = max(im.size)
    canvas = Image.new("RGB", (side, side), (255, 255, 255))
    canvas.paste(im, ((side - im.size[0]) // 2, (side - im.size[1]) // 2))
    sticker = canvas.resize((SIZE, SIZE), Image.LANCZOS).convert("RGBA")
    mask = Image.new("L", (SIZE, SIZE), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=RADIUS, fill=255)
    sticker.putalpha(mask)
    path = f"{OUT}/{sticker_id}.webp"
    sticker.save(path, quality=86, method=6)
    return path, os.path.getsize(path)


for sid in sys.argv[2].split(","):
    path, size = process(sid)
    print(sid, size, path)
