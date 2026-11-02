import { getDesignSettings } from "@/lib/directory";
import { apiError } from "@/lib/inputs";
import { databaseConfigured } from "@/db";

export const dynamic = "force-dynamic";

/**
 * عناوين المقاطع الصوتية المفعّلة في الموقع (بدون أي بيانات شخصية):
 * - splash: صوت شاشة البداية.
 * - welcome: صوت الترحيب بالمهني في صفحة «حسابي».
 * ترجع فارغة لو الميزة مقفولة أو القاعدة غير متصلة.
 */
export async function GET() {
  try {
    if (!databaseConfigured) return Response.json({ splash: "", welcome: "" });
    const design = await getDesignSettings();
    return Response.json({
      splash: design.splashAudioEnabled && design.splashAudioUrl ? design.splashAudioUrl : "",
      welcome: design.welcomeAudioEnabled && design.welcomeAudioUrl ? design.welcomeAudioUrl : "",
    });
  } catch (error) { return apiError(error); }
}
