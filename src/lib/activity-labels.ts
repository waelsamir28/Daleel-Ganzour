/** تسميات عربية لسجل النشاط — ملف مشترك بين الخادم ولوحة التحكم (بدون server-only). */
const kindLabels: Record<string, string> = {
  service: "مهنة", category: "تصنيف", area: "عنوان", rating: "تقييم", member: "عضو", event: "مناسبة", ad: "إعلان", "ad-request": "طلب إعلان",
  settings: "إعدادات الموقع", "design-settings": "استوديو التصميم", "ad-pricing": "أسعار الإعلانات", greetings: "التهاني", "utility-numbers": "أرقام الخدمات", "whatsapp-alert-kinds": "تنبيهات واتساب", notification: "إشعار",
};
export const activityKindLabel = (kind: string) => kindLabels[kind] ?? kind;

const actionLabels: Record<string, string> = {
  "POST:": "إضافة", "PATCH:": "تعديل", "DELETE:": "حذف",
  "PATCH:approve": "قبول ونشر", "PATCH:reject": "رفض", "PATCH:request-info": "طلب استكمال بيانات", "PATCH:request-completion": "طلب استكمال", "PATCH:approve-completion": "اعتماد الاستكمال", "PATCH:reject-completion": "رفض الاستكمال",
  "PATCH:notify-provider": "إشعار صاحب المهنة", "PATCH:feature": "تمييز", "PATCH:unfeature": "إلغاء التمييز", "PATCH:verify": "توثيق", "PATCH:unverify": "إلغاء التوثيق", "PATCH:pin": "تثبيت", "PATCH:role": "تغيير الرتبة", "PATCH:active": "تفعيل/إيقاف",
  "PATCH:read": "تعليم كمقروء", "PATCH:read-all": "تعليم الكل كمقروء", "DELETE:delete-all": "حذف الكل", "DELETE:delete-selected": "حذف المحدد", "DELETE:purge-all": "حذف جميع المهن", "POST:availability-link": "إنشاء رابط الإتاحة", "POST:account-link": "إنشاء رابط حساب المهني", "POST:account-link-reset": "تجديد رابط حساب المهني",
};
export const activityActionLabel = (action: string) => actionLabels[action] ?? action.split(":")[1] ?? action;

