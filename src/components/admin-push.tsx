"use client";

import { useCallback, useEffect, useState } from "react";
import { BellRing, LoaderCircle, Send, Smartphone, UserRound } from "lucide-react";
import { PUSH_BODY_MAX, PUSH_TITLE_MAX } from "@/lib/push-shared";

/**
 * «إشعار الزوار» في لوحة الإدارة: عدّاد المشتركين + إرسال إشعار واحد لكل الأجهزة
 * المفعّلة. لو مفاتيح VAPID غير موجودة على الخادم، البطاقة بتشرح الخطوات بهدوء
 * بدل ما تفشل.
 */
export default function AdminPush({ sections = [] }: { sections?: { id: string; name: string }[] }) {
  const [state, setState] = useState<"loading" | "ready" | "off">("loading");
  const [subscribers, setSubscribers] = useState(0);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState("/");
  const [section, setSection] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/push", { cache: "no-store" });
      const data = (await response.json()) as { configured?: boolean; subscribers?: number };
      setSubscribers(data.subscribers ?? 0);
      setState(data.configured ? "ready" : "off");
    } catch {
      setState("off");
    }
  }, []);

  // الجلب بعد أول رسم فقط (المزوّد يعتمد على جلسة الإدارة في الخادم).
  // eslint-disable-next-line react-hooks/set-state-in-effect -- الجلب يبدأ بعد أول رسم فقط.
  useEffect(() => { void load(); }, [load]);

  async function send() {
    setBusy(true); setNote(""); setFailed(false);
    try {
      const response = await fetch("/api/push", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, body, url, ...(section ? { section } : {}) }),
      });
      const data = (await response.json()) as { ok?: boolean; error?: string; sent?: number; failed?: number; removed?: number; total?: number };
      if (!response.ok || !data.ok) throw new Error(data.error ?? "تعذر الإرسال.");
      setNote(`تم الإرسال: ${data.sent ?? 0} جهاز${data.failed ? ` • فشل ${data.failed}` : ""}${data.removed ? ` • اتشال ${data.removed} اشتراك قديم` : ""}.`);
      setTitle(""); setBody("");
      await load();
    } catch (error) {
      setFailed(true);
      setNote(error instanceof Error ? error.message : "تعذر إرسال الإشعار.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="analytics-panel-card">
      <div className="push-explainer" role="note">
        <div className="push-explainer-head"><Smartphone size={18}/> <strong>إشعار الزوار — الرقم اللي جانبه معناه إيه؟</strong></div>
        <p>
          الرقم <b>{subscribers}</b> = <b>عدد الأجهزة</b> اللي فعّلت «إشعارات الموقع» من فوتر الصفحات (مش عدد الأشخاص — عضو واحد على موبايل وكمبيوتر = ٢).
          لو الرقم ٣ يبقى ٣ أجهزة بس هي اللي هتشوف الرسالة.
        </p>
        <ul>
          <li><UserRound size={13}/> <b>مين بيشوفه:</b> كل الأجهزة المشتركة (أو مشتركو قسم معيّن لو اخترت قسم).</li>
          <li><BellRing size={13}/> <b>بيظهر إزاي:</b> إشعار على شاشة الموبايل/الكمبيوتر زي إشعار أي تطبيق — حتى لو الموقع مقفول.</li>
          <li><Send size={13}/> <b>فين بيفتح:</b> عند الضغط بيفتح الرابط اللي تكتبه تحت (الصفحة الرئيسية افتراضيًا).</li>
          <li><b>امتى يختفي:</b> بعد ٧ أيام لو محدش فتحه (الرسائل القديمة مش بتزحم).</li>
        </ul>
        <small>يحتاج إذن الزائر مرة واحدة؛ اللي رفض الإشعارات مش هيوصله حاجة، ومفيش أرقام هواتف ولا رسائل واتساب هنا.</small>
      </div>
      <div className="analytics-panel-head">
        <div>
          <h3><BellRing size={18}/> إشعار الزوار ({subscribers})</h3>
          <p>اكتب عنوان ونص قصير، اختار مين يوصله، وأرسل. استخدمه في خبر مهم أو عرض موسمي فقط.</p>
        </div>
      </div>

      {state === "off" ? (
        <p className="analytics-empty-hint">
          الميزة متوقفة: محتاجة قاعدة بيانات متصلة حتى يولّد الموقع مفاتيح الإشعارات ويحفظها على الخادم تلقائيًا.
          لو حبيت تتحكم في المفاتيح، ضيف <b>NEXT_PUBLIC_VAPID_PUBLIC_KEY</b> و<b>VAPID_PRIVATE_KEY</b> في متغيرات بيئة Vercel
          (من <code dir="ltr">npx web-push generate-vapid-keys</code>) وهياخدهم بالأولوية.
        </p>
      ) : (
        <div className="admin-push-form">
          <label>
            <span>عنوان الإشعار</span>
            <input className="studio-textbox" value={title} maxLength={PUSH_TITLE_MAX} onChange={(event) => setTitle(event.target.value)} placeholder="مثال: ٣ مهن جديدة في قسم الحرفيين"/>
          </label>
          <label>
            <span>نص الإشعار</span>
            <input className="studio-textbox" value={body} maxLength={PUSH_BODY_MAX} onChange={(event) => setBody(event.target.value)} placeholder="سطر واحد واضح — يظهر تحت العنوان على الموبايل"/>
          </label>
          <label>
            <span>لمين الإشعار؟</span>
            <select className="studio-textbox" value={section} onChange={(event) => { setSection(event.target.value); setUrl(event.target.value ? `/categories/${event.target.value}` : "/"); }}>
              <option value="">كل المشتركين</option>
              {sections.map((item) => <option key={item.id} value={item.id}>مشتركو قسم {item.name}</option>)}
            </select>
          </label>
          <label>
            <span>الرابط عند الضغط</span>
            <input className="studio-textbox" dir="ltr" value={url} maxLength={200} onChange={(event) => setUrl(event.target.value)} placeholder="/telecom"/>
          </label>
          <button type="button" className="button button-primary button-small" onClick={() => void send()} disabled={busy || title.trim().length < 2 || body.trim().length < 2}>
            {busy ? <LoaderCircle size={15} className="code-report-spin"/> : <Send size={15}/>} إرسال للزوار
          </button>
          {note && <p className={`admin-push-note ${failed ? "is-error" : ""}`} role="status">{note}</p>}
        </div>
      )}
    </section>
  );
}
