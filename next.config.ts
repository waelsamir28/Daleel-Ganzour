import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // جودة إضافية 92 لصور البانر الكبيرة (نص واضح) بجانب الجودة الافتراضية 75.
    qualities: [75, 92],
    // صور المظهر المرفوعة تُخدم من /api/design-image/<key>?v=N ويُحسّنها next/image (مقاسات متعددة + WebP/AVIF).
    localPatterns: [{ pathname: "/api/design-image/**" }, { pathname: "/**", search: "" }],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Strict-Transport-Security", value: "max-age=63072000" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
      {
        // الصور الثابتة (الشعارات، رسومات المهن، صور OG) تُخزَّن في المتصفح ساعة وتُحدَّث في الخلفية يومًا كاملًا → تحميل أسرع للزيارات المتكررة.
        source: "/images/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=3600, stale-while-revalidate=86400" }],
      },
      {
        // ملفات عائلات الثيمات تُحمَّل عند الطلب؛ تخزين قصير مع إعادة تحقق حتى تصل أي تعديلات بسرعة.
        source: "/themes/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=600, stale-while-revalidate=86400" }],
      },
      {
        source: "/fonts/:path*",
        headers: [{ key: "Cache-Control", value: "public, max-age=31536000, immutable" }],
      },
    ];
  },
};

export default nextConfig;
