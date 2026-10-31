#!/usr/bin/env python3
"""توليد صور السوشيال ميديا من داخل التطبيق (موك-أب بدقة عالية للشاشات الحقيقية).

الاستخدام:
    pip install --break-system-packages pillow arabic-reshaper python-bidi
    python3 scripts/make-social-cards.py

الناتج: docs/social/*.png  (1080×1350 — مناسبة لإنستجرام/فيسبوك/واتساب)
الصور تحاكي شاشات الموقع الفعلية (الرئيسية، الأقسام، التخصص، صفحة الأكواد) بنفس
الألوان والأسماء والبيانات الموجودة في الكود — تُستخدم للنشر دون الحاجة لجهاز.
"""
from pathlib import Path

import arabic_reshaper
from bidi.algorithm import get_display
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "docs" / "social"
FONT = ROOT / "public" / "fonts" / "ge-ss-two-bold.ttf"
LATIN_FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
LOGO = ROOT / "public" / "images" / "logo-daleel-transparent.png"
QR = ROOT / "public" / "images" / "app-qr.png"

W, H = 1080, 1350
NAVY = "#12344f"
MUTED = "#6b8298"
BRAND = "#0b5f9e"


def font(size):
    return ImageFont.truetype(str(FONT), int(size))


def latin(size):
    return ImageFont.truetype(LATIN_FONT, int(size))


def ar(text):
    return get_display(arabic_reshaper.reshape(text))


def mix(hex_color, amount, base=(255, 255, 255)):
    color = tuple(int(hex_color[i:i + 2], 16) for i in (1, 3, 5))
    return tuple(int(base[i] * (1 - amount) + color[i] * amount) for i in range(3))


def rtl(draw, xy, text, fnt, fill, anchor="ra"):
    draw.text(xy, ar(text), font=fnt, fill=fill, anchor=anchor)


def rounded(draw, box, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def gradient_rect(img, box, top, bottom):
    """تدرّج رأسي داخل مستطيل (مقصوص بزوايا دائرية عبر قناع)."""
    x1, y1, x2, y2 = [int(v) for v in box]
    height = max(1, y2 - y1)
    strip = Image.new("RGB", (1, height))
    for i in range(height):
        t = i / height
        strip.putpixel((0, i), tuple(int(top[c] * (1 - t) + bottom[c] * t) for c in range(3)))
    return strip.resize((int(x2 - x1), height))


def paste_gradient(img, box, top, bottom, radius=18):
    x1, y1, x2, y2 = [int(v) for v in box]
    grad = gradient_rect(img, (x1, y1, x2, y2), top, bottom)
    mask = Image.new("L", grad.size, 0)
    ImageDraw.Draw(mask).rounded_rectangle([0, 0, grad.size[0] - 1, grad.size[1] - 1], radius=radius, fill=255)
    img.paste(grad, (x1, y1), mask)


def background():
    img = Image.new("RGB", (W, H), "#eef4fb")
    draw = ImageDraw.Draw(img)
    draw.ellipse([-180, -220, 420, 380], fill="#dfeafa")
    draw.ellipse([W - 320, H - 420, W + 220, H + 120], fill="#e6f0fb")
    return img, draw


def phone_frame(img, draw, x, y, w, h):
    """إطار موبايل بزوايا دائرية وشاشة بيضاء بالداخل."""
    draw.rounded_rectangle([x - 10, y - 10, x + w + 10, y + h + 10], radius=46, fill="#0f2233")
    draw.rounded_rectangle([x, y, x + w, y + h], radius=38, fill="#ffffff")
    # نوتش
    draw.rounded_rectangle([x + w / 2 - 42, y + 10, x + w / 2 + 42, y + 24], radius=8, fill="#0f2233")
    return x + 14, y + 36, w - 28, h - 50


def screen_header(draw, x, y, w, title, subtitle=None):
    """هيدر التطبيق: لوجو + اسم + زر قائمة."""
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((int(w * 0.16), int(w * 0.16)))
    return logo


def pill(draw, box, text, fnt, fill, color, outline=None):
    rounded(draw, box, (box[3] - box[1]) / 2, fill=fill, outline=outline)
    rtl(draw, ((box[2] + box[0]) / 2, (box[3] + box[1]) / 2), text, fnt, color, anchor="mm")


def screen_shell(img, draw, x, y, w, h, screen_title):
    """يرسم الهيدر العلوي للتطبيق داخل الشاشة ويعيد إحداثيات المحتوى."""
    # شريط علوي
    rounded(draw, [x, y, x + w, y + 54], 18, fill="#ffffff", outline="#e8f0f8")
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((40, 40))
    img.paste(logo, (int(x + w - 54), int(y + 7)), logo)
    rtl(draw, (x + w - 64, y + 18), "دليل جنزور", font(13), NAVY)
    rtl(draw, (x + w - 64, y + 36), screen_title, font(9), MUTED)
    for i in range(3):
        draw.rectangle([x + 18, y + 18 + i * 8, x + 42, y + 21 + i * 8], fill="#9fb4c9")
    return x, y + 66


def screen_home(img, draw, x, y, w, h):
    cx, cy = screen_shell(img, draw, x, y, w, h, "الرئيسية")
    # بحث
    rounded(draw, [cx, cy, cx + w, cy + 34], 12, fill="#f7fbff", outline="#dbe7f2")
    rtl(draw, (cx + w - 12, cy + 17), "ابحث عن مهنة أو خدمة…", font(10), "#a3b6c8", anchor="rm")
    draw.ellipse([cx + 12, cy + 11, cx + 24, cy + 23], outline="#7d94ac", width=2)
    cy += 44
    # بانر
    paste_gradient(img, [cx, cy, cx + w, cy + 108], (11, 95, 158), (30, 64, 120), radius=16)
    rtl(draw, (cx + w - 16, cy + 12), "دليل أهل جنزور", font(9), "#cfe4f7")
    rtl(draw, (cx + w - 16, cy + 30), "أهل الخبرة قريبين منك..", font(15), "#ffffff")
    rtl(draw, (cx + w - 16, cy + 54), "كل خدمات جنزور في مكان واحد", font(12), "#dbeafd")
    rounded(draw, [cx + w - 138, cy + 76, cx + w - 16, cy + 100], 12, fill=None, outline=(255, 255, 255), width=1)
    rtl(draw, (cx + w - 26, cy + 88), "بسهولة • بسرعة • بثقة", font(8.5), "#ffffff", anchor="rm")
    cy += 120
    # كروت المزايا
    tiles = [("مناوبة الآن", "#0e9f6e"), ("مرافق وطوارئ", "#e0245e"), ("خدمات سريعة", "#f59e0b")]
    tw = (w - 2 * 8) / 3
    for i, (label, color) in enumerate(tiles):
        bx = cx + (2 - i) * (tw + 8)
        rounded(draw, [bx, cy, bx + tw, cy + 62], 13, fill=mix(color, 0.07), outline=mix(color, 0.28))
        draw.ellipse([bx + tw / 2 - 12, cy + 9, bx + tw / 2 + 12, cy + 33], fill=mix(color, 0.18))
        rtl(draw, (bx + tw / 2, cy + 46), label, font(9), mix(color, 0.9, (20, 40, 60)), anchor="mm")
    cy += 74
    # صف شركات المحمول
    rtl(draw, (cx + w, cy + 6), "أرقام وأكواد شركات المحمول", font(10), NAVY)
    cy += 18
    brands = [("Vodafone", "#e60000"), ("Orange", "#ff7900"), ("Etisalat", "#00a651"), ("WE", "#6d2077")]
    bw = (w - 3 * 8) / 4
    for i, (label, color) in enumerate(brands):
        bx = cx + (3 - i) * (bw + 8)
        rounded(draw, [bx, cy, bx + bw, cy + 44], 12, fill="#ffffff", outline="#e2ecf6")
        d2 = ImageDraw.Draw(img)
        rounded(draw, [bx + bw / 2 - 22, cy + 8, bx + bw / 2 + 22, cy + 26], 7, fill=mix(color, 0.12))
        draw.text((bx + bw / 2, cy + 17), label, font=latin(7), fill=color, anchor="mm")
        rtl(draw, (bx + bw / 2, cy + 35), "الأكواد", font(7), MUTED, anchor="mm")
    cy += 56
    # شبكة الأقسام
    rtl(draw, (cx + w, cy + 6), "أقسام الدليل", font(10), NAVY)
    cy += 20
    cats = [("الحرفيين", "#ff941f"), ("العيادات", "#22b96d"), ("الصيدليات", "#15a37f"), ("المحلات", "#078cf0"), ("المدرسين", "#9160df"), ("النقل والتوصيل", "#f2a900")]
    cw = (w - 2 * 8) / 3
    for i, (label, color) in enumerate(cats):
        bx = cx + (2 - i % 3) * (cw + 8)
        by = cy + (i // 3) * 58
        rounded(draw, [bx, by, bx + cw, by + 50], 12, fill="#ffffff", outline="#e8f0f8")
        draw.ellipse([bx + cw / 2 - 11, by + 6, bx + cw / 2 + 11, by + 28], fill=mix(color, 0.2))
        rtl(draw, (bx + cw / 2, by + 40), label, font(7.5), "#37536d", anchor="mm")
    cy += 2 * 58 + 8
    # مهن مميزة
    rtl(draw, (cx + w, cy + 4), "مهن مميزة", font(10), NAVY)
    cy += 18
    for name, area, color in [("أسطى محمد الصاوي", "سباكة • جنزور الشرقية", "#22b96d"), ("مكتب النور للمحاماة", "محاماة • جنزور الغربية", "#8a6a2f")]:
        rounded(draw, [cx, cy, cx + w, cy + 52], 12, fill="#ffffff", outline="#e8f0f8")
        draw.ellipse([cx + w - 42, cy + 8, cx + w - 14, cy + 36], fill=mix(color, 0.2))
        rtl(draw, (cx + w - 52, cy + 8), name, font(9.5), NAVY)
        rtl(draw, (cx + w - 52, cy + 26), area, font(8), MUTED)
        rounded(draw, [cx + 12, cy + 14, cx + 92, cy + 38], 9, fill="#0a9d5b")
        rtl(draw, (cx + 52, cy + 26), "واتساب", font(7.5), "#ffffff", anchor="mm")
        cy += 60


def screen_categories(img, draw, x, y, w, h):
    cx, cy = screen_shell(img, draw, x, y, w, h, "الأقسام")
    rtl(draw, (cx + w, cy + 4), "كل أقسام الدليل", font(15), NAVY)
    rtl(draw, (cx + w, cy + 26), "اختار القسم اللي محتاجه وشوف التخصصات", font(9), MUTED)
    cy += 44
    rounded(draw, [cx, cy, cx + w, cy + 32], 12, fill="#f7fbff", outline="#dbe7f2")
    rtl(draw, (cx + w - 12, cy + 16), "ابحث في 14 قسمًا…", font(9.5), "#a3b6c8", anchor="rm")
    cy += 42
    rows = [("الحرفيين", "نجارة • سباكة • كهرباء • نقاشة", "#ff941f", "38 مهنيًا"),
            ("العيادات", "باطنة • أطفال • أسنان • جلدية", "#22b96d", "12 عيادة"),
            ("الصيدليات", "صيدليات ٢٤ ساعة ومستلزمات طبية", "#15a37f", "9 صيدليات"),
            ("المحلات", "بقالة • ملابس • أدوات منزلية", "#078cf0", "24 محلًا"),
            ("المدرسين", "ابتدائي • إعدادي • ثانوي", "#9160df", "21 مدرسًا"),
            ("النقل والتوصيل", "نقل عفش • بضائع • مشاوير", "#f2a900", "7 خدمات"),
            ("الطباعة والدعاية", "مطابع • لافتات • تصميم", "#5b5fe8", "6 خدمات"),
            ("الأفراح والمناسبات", "مصورين • دي جي • قاعات", "#ff5a36", "11 خدمة")]
    for label, sub, color, count in rows:
        rounded(draw, [cx, cy, cx + w, cy + 66], 14, fill="#ffffff", outline="#e8f0f8")
        draw.ellipse([cx + w - 54, cy + 15, cx + w - 18, cy + 51], fill=mix(color, 0.16))
        draw.ellipse([cx + w - 46, cy + 23, cx + w - 26, cy + 43], fill=mix(color, 0.55))
        rtl(draw, (cx + w - 64, cy + 15), label, font(11), NAVY)
        rtl(draw, (cx + w - 64, cy + 34), sub, font(8), MUTED)
        pill(draw, [cx + 12, cy + 22, cx + 96, cy + 44], count, font(7.5), mix(color, 0.1), mix(color, 0.9, (20, 40, 60)), mix(color, 0.3))
        cy += 70
    rounded(draw, [cx, cy + 4, cx + w, cy + 42], 12, fill="#eef6ff", outline="#d7e7f6")
    rtl(draw, (cx + w / 2, cy + 23), "اعرض كل الأقسام والتخصصات", font(9), BRAND, anchor="mm")


def screen_specialty(img, draw, x, y, w, h):
    cx, cy = screen_shell(img, draw, x, y, w, h, "الحرفيين / السباكة")
    rtl(draw, (cx + w, cy + 4), "سباكة", font(16), NAVY)
    rtl(draw, (cx + w, cy + 28), "أهل الصنعة والخبرة في القرية — ٩ مقدمي خدمة", font(9), MUTED)
    cy += 46
    pill(draw, [cx + w - 110, cy, cx + w, cy + 26], "متاح الآن", font(8.5), (238, 251, 244), "#0a9d5b", "#b7e8cd")
    pill(draw, [cx + w - 200, cy, cx + w - 118, cy + 26], "توصيل للمنازل", font(8.5), "#f7fbff", "#42678a", "#d7e7f6")
    cy += 38
    people = [("أسطى محمد الصاوي", "جنزور / الناحية الشرقية", "0100 123 4567", True),
              ("أسطى أحمد عبد الله", "جنزور / شارع حسيب", "0111 987 6543", False),
              ("ورشة النور للسباكة", "جنزور / السوق القديم", "0122 555 8899", True),
              ("أسطى كريم مصطفى", "جنزور / بجوار المسجد البحري", "0106 333 2244", False),
              ("أسطى سيد الشربيني", "جنزور / الناحية الغربية", "0128 741 6633", True),
              ("مؤسسة الأمانة للصيانة", "جنزور / شارع السويقة", "0155 220 7788", False)]
    for name, area, phone, verified in people:
        rounded(draw, [cx, cy, cx + w, cy + 92], 14, fill="#ffffff", outline="#e8f0f8")
        draw.ellipse([cx + w - 52, cy + 12, cx + w - 16, cy + 48], fill="#e8f2fb")
        rtl(draw, (cx + w - 66, cy + 14), name, font(10.5), NAVY)
        rtl(draw, (cx + w - 66, cy + 33), area, font(8), MUTED)
        if verified:
            pill(draw, [cx + w - 66, cy + 48, cx + w - 12, cy + 66], "موثّق", font(7), "#eefbf3", "#0a8f54", "#b7e8cd")
        draw.text((cx + 60, cy + 58), phone, font=latin(8), fill="#37536d", anchor="mm")
        rounded(draw, [cx + 10, cy + 60, cx + 108, cy + 82], 9, fill="#e9f8f1")
        rtl(draw, (cx + 59, cy + 71), "واتساب", font(7.5), "#0a8f54", anchor="mm")
        rounded(draw, [cx + 114, cy + 60, cx + 200, cy + 82], 9, fill="#eaf2fd")
        rtl(draw, (cx + 157, cy + 71), "اتصال", font(7.5), "#0b5f9e", anchor="mm")
        cy += 100


def screen_telecom(img, draw, x, y, w, h):
    cx, cy = screen_shell(img, draw, x, y, w, h, "كل الأكواد")
    rtl(draw, (cx + w / 2, cy + 6), "كل الأرقام والأكواد", font(13), NAVY, anchor="ma")
    rtl(draw, (cx + w / 2, cy + 26), "المحمول والأرضي والبنوك — بدون إنترنت", font(8.5), MUTED, anchor="ma")
    cy += 42
    cards = [("فودافون", "Vodafone", "#e60000"), ("أورنج", "Orange", "#ff7900"), ("اتصالات", "Etisalat", "#00a651"),
             ("وي", "WE", "#6d2077"), ("الخط الأرضي", "Landline", "#6d2077"), ("أرقام حكومية", "Gov", "#0f766e"),
             ("البنوك", "Banks", "#0b5f9e")]
    cw = (w - 2 * 7) / 3
    for i, (label, latin_name, color) in enumerate(cards):
        bx = cx + (2 - i % 3) * (cw + 7)
        by = cy + (i // 3) * 62
        active = i == 0
        rounded(draw, [bx, by, bx + cw, by + 54], 14, fill=mix(color, 0.06) if active else "#ffffff", outline=color if active else "#e8f0f8", width=2 if active else 1)
        rounded(draw, [bx + cw / 2 - 18, by + 6, bx + cw / 2 + 18, by + 25], 8, fill=mix(color, 0.14))
        draw.text((bx + cw / 2, by + 15), latin_name, font=latin(6.5), fill=color, anchor="mm")
        rtl(draw, (bx + cw / 2, by + 39), label, font(7.5), color if active else "#17324c", anchor="mm")
    cy += 196
    # شاشة الشركة
    rounded(draw, [cx, cy, cx + w, cy + 268], 16, fill="#ffffff", outline="#e2ecf6")
    rtl(draw, (cx + w / 2, cy + 10), "أرقام وأكواد", font(8), mix("#e60000", 0.8), anchor="ma")
    rtl(draw, (cx + w / 2, cy + 24), "فودافون", font(14), "#e60000", anchor="ma")
    rounded(draw, [cx + 8, cy + 46, cx + w - 8, cy + 70], 9, fill="#e60000")
    rtl(draw, (cx + w / 2, cy + 58), "كل أكواد فودافون — 18 كودًا", font(8), "#ffffff", anchor="mm")
    tiles = [("الدعم", "#1d6fdc"), ("الرصيد والشحن", "#0f9d58"), ("الإنترنت", "#e88a16"), ("المحفظة", "#7c3aed")]
    tw = (w - 2 * 7) / 2
    for i, (label, color) in enumerate(tiles):
        bx = cx + (1 - i % 2) * (tw + 7) + 8
        by = cy + 78 + (i // 2) * 52
        base = tuple(int(color[i:i + 2], 16) for i in (1, 3, 5))
        paste_gradient(img, [bx, by, bx + tw, by + 46], base, tuple(int(c * 0.72) for c in base), radius=10)
        rtl(draw, (bx + tw / 2, by + 23), label, font(8), "#ffffff", anchor="mm")
    rtl(draw, (cx + w - 10, cy + 190), "بطاقات الأكواد: الكود كبير + نسخ بضغطة", font(7.5), MUTED)
    for i, code in enumerate(["888", "*888#", "16888"]):
        bx = cx + (2 - i) * (cw + 7) + 2
        rounded(draw, [bx, cy + 202, bx + cw - 4, cy + 248], 9, fill=mix("#e60000", 0.07), outline=mix("#e60000", 0.25))
        draw.text((bx + (cw - 4) / 2, cy + 225), code, font=latin(10), fill="#a80000", anchor="mm")
    # أكواد جاهزة برقمك
    cy += 286
    rounded(draw, [cx, cy, cx + w, cy + 132], 14, fill=mix("#e60000", 0.04), outline=mix("#e60000", 0.2))
    rtl(draw, (cx + w - 12, cy + 12), "أكواد جاهزة برقمك", font(10), NAVY)
    rtl(draw, (cx + w - 12, cy + 30), "اكتب رقم المستلم والمبلغ ونجهّز الكود كامل", font(8), MUTED)
    rounded(draw, [cx + w - 120, cy + 44, cx + w - 12, cy + 66], 999, fill="#e60000")
    rtl(draw, (cx + w - 66, cy + 55), "تحويل رصيد", font(8), "#ffffff", anchor="mm")
    rounded(draw, [cx + w - 236, cy + 44, cx + w - 128, cy + 66], 999, fill="#ffffff", outline="#e0eaf4")
    rtl(draw, (cx + w - 182, cy + 55), "كلمني شكرًا", font(8), "#52708b", anchor="mm")
    rounded(draw, [cx + 8, cy + 76, cx + w - 8, cy + 92], 6, fill="#e60000")
    rtl(draw, (cx + w - 14, cy + 84), "الكود الجاهز: تحويل 10 جنيه", font(7), "#ffffff", anchor="rm")
    draw.text((cx + w / 2, cy + 112), "*868*2*01000000000*10#", font=latin(9), fill="#a80000", anchor="mm")


def screen_gov(img, draw, x, y, w, h):
    """شاشة الأرقام الحكومية والطوارئ — نفس محتوى src/lib/gov-numbers.ts."""
    cx, cy = screen_shell(img, draw, x, y, w, h, "أرقام حكومية")
    rounded(draw, [cx, cy, cx + w, cy + 46], 14, fill=mix("#d64545", 0.08), outline=mix("#d64545", 0.28))
    rtl(draw, (cx + w / 2, cy + 14), "أرقام الطوارئ", font(14), "#b3261e", anchor="mm")
    rtl(draw, (cx + w / 2, cy + 32), "كل الأرقام مجانية من أي خط — اطلب بضغطة", font(8), MUTED, anchor="mm")
    cy += 56
    emergency = [("الإسعاف", "123"), ("الشرطة", "122"), ("المطافئ", "180"),
                 ("الكهرباء", "121"), ("المياه", "125"), ("الغاز", "129")]
    cw = (w - 2 * 6) / 3
    for i, (label, code) in enumerate(emergency):
        bx = cx + (2 - i % 3) * (cw + 6)
        by = cy + (i // 3) * 62
        rounded(draw, [bx, by, bx + cw, by + 54], 12, fill="#fff5f5", outline="#f3dcdc")
        draw.text((bx + cw / 2, by + 18), code, font=latin(15), fill="#b3261e", anchor="mm")
        rtl(draw, (bx + cw / 2, by + 40), label, font(8), "#7a2b26", anchor="mm")
    cy += 132
    rtl(draw, (cx + w - 8, cy), "خدمات وشكاوى حكومية", font(10), NAVY)
    cy += 18
    services = [("منظومة الشكاوى الحكومية", "16528"), ("حماية المستهلك", "19588"),
                ("تنظيم الاتصالات", "155"), ("الشهر العقاري", "15999"),
                ("التأمين الاجتماعي", "16217"), ("البريد المصري", "16789")]
    for label, code in services:
        rounded(draw, [cx, cy, cx + w, cy + 34], 10, fill="#ffffff", outline="#e8f0f8")
        rtl(draw, (cx + w - 10, cy + 17), label, font(8.5), "#17324c", anchor="rm")
        draw.text((cx + 12, cy + 17), code, font=latin(10), fill=BRAND, anchor="lm")
        cy += 40
    cy += 8
    rounded(draw, [cx, cy, cx + w, cy + 62], 12, fill=mix("#0f766e", 0.07), outline=mix("#0f766e", 0.22))
    rtl(draw, (cx + w / 2, cy + 16), "أكواد الخط الأرضي والإنترنت المنزلي", font(9), "#0b5751", anchor="mm")
    rtl(draw, (cx + w / 2, cy + 34), "111 من الأرضي · 19777 من الموبايل · تحويل المكالمات #21#", font(7.5), MUTED, anchor="mm")
    rtl(draw, (cx + w / 2, cy + 50), "ولو رقم اتغيّر — اضغط «الكود ده اتغيّر؟» وهيتبعت للإدارة", font(7), MUTED, anchor="mm")


def bottom_nav(img, draw, x, y, w, h):
    """شريط التنقل السفلي داخل الشاشة (ثابت في كل الشاشات)."""
    bar = [x, y + h - 54, x + w, y + h]
    rounded(draw, bar, 14, fill="#ffffff", outline="#e8f0f8")
    items = [("الرئيسية", True), ("الأقسام", False), ("الأكواد", False), ("حسابي", False)]
    for i, (label, active) in enumerate(items):
        cx = x + w - (w / 4) * (i + 0.5)
        color = BRAND if active else "#9fb4c9"
        draw.ellipse([cx - 7, y + h - 42, cx + 7, y + h - 28], fill=color if active else "#dbe7f2")
        rtl(draw, (cx, y + h - 14), label, font(7.5), color, anchor="mm")


SCREENS = [
    ("01-home", "الرئيسية", "كل خدمات جنزور في مكان واحد", "ابحث عن أي مهنة، شوف المناوب الآن، ووصل لصاحب الخدمة بضغطة.", screen_home),
    ("02-categories", "الأقسام والتخصصات", "١٤ قسمًا و١٠٠+ تخصص", "من الحرفيين والعيادات والصيدليات للنقل والمدرسين — كل قسم بتخصصاته.", screen_categories),
    ("03-specialty", "التخصصات", "كل تخصص بمقدميه وأرقامهم", "بطاقة لكل مهني: التوثيق، المنطقة، واتساب، واتصال مباشر.", screen_specialty),
    ("04-telecom", "صفحة الأكواد", "كل الأكواد في جيبك بدون إنترنت", "المحمول والأرضي والبنوك — مسح ضوئي، نسخ، وطلب بضغطة.", screen_telecom),
    ("05-gov", "الأرقام الحكومية", "أرقام الطوارئ والحكومة في مكان واحد", "إسعاف وشرطة ومطافئ ومرافق، وشكاوى ومستندات — بدون بحث.", screen_gov),
]


def build(slug, badge, title, subtitle, renderer):
    img, draw = background()
    # الهوية أعلى الصورة
    logo = Image.open(LOGO).convert("RGBA")
    logo.thumbnail((120, 120))
    img.paste(logo, (int(W / 2 - logo.size[0] / 2), 34), logo)
    rtl(draw, (W / 2, 176), title, font(30), NAVY, anchor="ma")
    rtl(draw, (W / 2, 218), subtitle, font(14), MUTED, anchor="ma")
    pill(draw, [W / 2 - 90, 248, W / 2 + 90, 280], badge, font(12), (255, 255, 255), BRAND, "#cfe1f4")

    # الموبايل
    px, py, pw, ph = 286, 310, 508, 862
    sx, sy, sw, sh = phone_frame(img, draw, px, py, pw, ph)
    renderer(img, draw, sx, sy, sw, sh)
    bottom_nav(img, draw, sx, sy, sw, sh)

    # أسفل الصورة: QR + دعوة
    qr = Image.open(QR).convert("RGB")
    qr.thumbnail((118, 118))
    qr_x, qr_y = 66, H - 168
    draw.rounded_rectangle([qr_x - 8, qr_y - 8, qr_x + qr.size[0] + 8, qr_y + qr.size[1] + 8], radius=14, fill="#ffffff", outline="#d7e7f6")
    img.paste(qr, (qr_x, qr_y))
    rtl(draw, (W - 66, H - 150), "دليل المهن والخدمات بقرية جنزور", font(18), NAVY)
    rtl(draw, (W - 66, H - 122), "امسح الكود وافتح الدليل على موبايلك — يشتغل بدون تحميل تطبيق", font(12), MUTED)
    rtl(draw, (W - 66, H - 96), "مكتب الجمال للدعاية والإعلان • 01222355769", font(11), "#8aa0b5")

    OUT.mkdir(parents=True, exist_ok=True)
    path = OUT / f"{slug}.png"
    img.save(path, optimize=True)
    print("saved", path.relative_to(ROOT), img.size)


if __name__ == "__main__":
    for slug, badge, title, subtitle, renderer in SCREENS:
        build(slug, badge, title, subtitle, renderer)
