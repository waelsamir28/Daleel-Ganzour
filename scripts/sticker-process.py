"""تحويل صور الملصقات المولّدة إلى أيقونات WebP 256px شفافة الزوايا.
الاستخدام: python3 scripts/sticker-process.py <مجلد المصدر> id1,id2,... [collage_id1,...]
(collage = الصورة تحتوي شبكة المرجع حول البلاطة الوسطى فنقصّ البلاطة الوسطى فقط)."""
import sys, os
from PIL import Image, ImageDraw
SRC = sys.argv[1]
OUT = os.path.join(os.path.dirname(__file__), "..", "public", "images", "specialty-stickers")
def tile_bbox_collage(im):
    w, h = im.size; best = None
    points = [(dx * r, dy * r) for r in (0.08, 0.12, 0.16, 0.2) for dx, dy in [(-1, -1), (1, -1), (-1, 1), (1, 1), (-1.3, 0), (1.3, 0), (0, -1.3), (0, 1.3)]]
    for dx, dy in points:
        x, y = int(w / 2 + dx * min(w, h)), int(h / 2 + dy * min(w, h))
        if min(im.getpixel((x, y))[:3]) < 150: continue
        t = im.convert("RGB"); ImageDraw.floodfill(t, (x, y), (255, 0, 255), thresh=28)
        px = t.load(); xs = []; ys = []
        for yy in range(0, h, 2):
            for xx in range(0, w, 2):
                if px[xx, yy][:3] == (255, 0, 255): xs.append(xx); ys.append(yy)
        if not xs: continue
        bb = (min(xs), min(ys), max(xs), max(ys)); bw, bh = bb[2] - bb[0], bb[3] - bb[1]; area = bw * bh
        # البلاطة الوسطى: شبه مربعة وأصغر من 60% من عرض الصورة (وإلا فهي خلفية الشبكة البيضاء)
        if bw > 0.6 * w or bh > 0.9 * h or min(bw, bh) < 0.15 * h or abs(bw - bh) > 0.25 * max(bw, bh): continue
        if best is None or area > best[0]: best = (area, bb)
    return best[1]
def process(id, collage):
    im = Image.open(f"{SRC}/{id}.png").convert("RGB"); w, h = im.size
    if collage:
        x0, y0, x1, y1 = tile_bbox_collage(im); inset = int(0.012 * (x1 - x0))
    else:
        px = im.load(); xs = []; ys = []
        for y in range(0, h, 2):
            for x in range(0, w, 2):
                if min(px[x, y]) < 215: xs.append(x); ys.append(y)
        x0, y0, x1, y1 = min(xs), min(ys), max(xs), max(ys); inset = int(0.008 * (x1 - x0))
    im = im.crop((x0 + inset, y0 + inset, x1 - inset, y1 - inset))
    s = max(im.size); canvas = Image.new("RGB", (s, s), (255, 255, 255)); canvas.paste(im, ((s - im.size[0]) // 2, (s - im.size[1]) // 2))
    canvas = canvas.resize((256, 256), Image.LANCZOS).convert("RGBA")
    mask = Image.new("L", (256, 256), 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, 255, 255), radius=58, fill=255)
    canvas.putalpha(mask)
    canvas.save(f"{OUT}/{id}.webp", quality=86, method=6)
    return os.path.getsize(f"{OUT}/{id}.webp")
collage = set(sys.argv[3].split(",")) if len(sys.argv) > 3 else set()
for id in sys.argv[2].split(","):
    print(id, process(id, id in collage))
