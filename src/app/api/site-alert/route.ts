import { getSettings } from "@/lib/directory";
import { activeEmergencyAlert } from "@/lib/emergency-alert";
import { databaseConfigured } from "@/db";

export const dynamic = "force-dynamic";

/**
 * شريط التنبيه الطارئ أعلى الموقع (بدون أي بيانات شخصية).
 * يرجّع التنبيه النشط فقط؛ لو مفيش تنبيه أو انتهت مدته يرجّع `{ active: false }`
 * فيختفي الشريط من كل الأجهزة تلقائيًا.
 */
export async function GET() {
  const settings = databaseConfigured ? await getSettings() : null;
  const alert = activeEmergencyAlert(settings);
  return Response.json(alert, { headers: { "Cache-Control": "no-store" } });
}
