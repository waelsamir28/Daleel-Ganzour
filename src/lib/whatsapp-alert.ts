import "server-only";
import { getSettings } from "@/lib/directory";

// تنبيهات واتساب فورية للإدارة عبر خدمة CallMeBot المجانية:
// الإدارة تفعّلها مرة واحدة (رقم واتساب + مفتاح API من إعدادات الموقع)،
// وبعدها كل طلب مهنة أو تقييم جديد يوصل رسالة واتساب على رقم الإدارة.
// التنبيه محاولة بلا أثر عند الفشل — إشعار لوحة التحكم يظل موجودًا دائمًا.
export async function sendAdminWhatsappAlert(title: string, message: string) {
  try {
    const { whatsappAlertsNumber, whatsappAlertsApiKey } = await getSettings();
    const phone = whatsappAlertsNumber.replace(/\D/g, "").replace(/^0/, "20");
    if (phone.length < 10 || !whatsappAlertsApiKey) return;
    const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(phone)}&apikey=${encodeURIComponent(whatsappAlertsApiKey)}&text=${encodeURIComponent(`${title}\n${message}`)}`;
    await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(6000) });
  } catch { /* Alerts are best-effort; the dashboard notification always remains. */ }
}
