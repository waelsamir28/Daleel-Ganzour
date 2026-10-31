/**
 * الترحيب بمقدم الخدمة الجديد — منطق نقي:
 * أول ما الإدارة تنشر مهنة، بتبعتله واتساب فيه رابط صفحته وخطوات بسيطة،
 * ومعه ملصق QR جاهز للطباعة (زر مستقل في اللوحة) — تسويق مجاني له وانتشار للدليل.
 */

export function providerPublicUrl(serviceId: string, siteUrl = "https://daleel-ganzour.vercel.app") {
  return `${siteUrl.replace(/\/+$/, "")}/?service=${encodeURIComponent(serviceId)}`;
}

export function providerWelcomeMessage(input: { name: string; categoryName: string; siteName?: string; siteUrl?: string; serviceId: string }) {
  const site = input.siteName || "دليل جنزور";
  return [
    `السلام عليكم ${input.name} 👋`,
    `تم نشر مهنتك «${input.categoryName}» على ${site} — صفحتك بقت متاحة لأهل القرية.`,
    `رابط صفحتك: ${providerPublicUrl(input.serviceId, input.siteUrl)}`,
    "تحب ملصق QR مجاني تحطه على المحل أو الكاشير؟ ابعتلنا وهنجهزه.",
    "لو فيه أي بيانات عايز تحدّثها (رقم، مواعيد، خدمات)، رد علينا هنا وهنظبطها فورًا.",
  ].join("\n");
}

/** رسالة الطلب من المهني: ملصق QR — تُستخدم في لوحة الإدارة كرد سريع. */
export function providerStickerRequestMessage(name: string) {
  return `السلام عليكم ${name} 🌿\nملصق الـQR بتاعك جاهز — هيتبعتلك هنا كصورة، وتقدر تطبعه A6 وتحطه على المحل.`;
}
