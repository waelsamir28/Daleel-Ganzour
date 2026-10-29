"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";
import { Check, Copy, ExternalLink, LoaderCircle, QrCode, ShieldCheck, UserRoundPen, X } from "lucide-react";
import AvatarPicker from "@/components/avatar-picker";
import AvatarPlaceholder from "@/components/avatar-placeholder";
import QrSvg from "@/components/qr-svg";
import { MEMBER_PROFILE_FIELDS, profileUrl, type MemberProfileValues } from "@/lib/catalog";
import { refreshOwnership } from "@/lib/viewer-ownership";

/**
 * «تعديل الملف الشخصي» داخل «حسابي»: نافذة عائمة بالصورة الشخصية (المشتركة مع كارت المهنة)،
 * الاسم والهاتف واسم المستخدم، الخانات الإضافية الاختيارية، ورمز QR لرابط الملف.
 * أي تعديل هنا لا يمس بيانات المهنة المضافة في الدليل.
 */
type Props = {
  member: { id: string; name: string; username: string; phone: string; createdAt: string };
  profile: MemberProfileValues;
  photoUrl: string;
  ownedCount: number;
};

export default function ProfileEditor({ member, profile, photoUrl, ownedCount }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(member.name);
  const [phone, setPhone] = useState(member.phone);
  const [values, setValues] = useState<MemberProfileValues>(profile);
  const [photo, setPhoto] = useState<string | null | undefined>(undefined);
  const [currentPhoto, setCurrentPhoto] = useState(photoUrl);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ text: string; error: boolean } | null>(null);
  const [copied, setCopied] = useState(false);
  const [origin, setOrigin] = useState("");
  useEffect(() => { setTimeout(() => setOrigin(window.location.origin), 0); }, []);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const link = `${origin}${profileUrl(member.id)}`;

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true); setNotice(null);
    try {
      const response = await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "update", name, phone, ...values, ...(photo !== undefined ? { photo } : {}) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر الحفظ.");
      setCurrentPhoto(data.photoUrl ?? ""); setPhoto(undefined);
      setNotice({ text: data.message ?? "تم الحفظ.", error: false });
      void refreshOwnership();
      router.refresh();
    } catch (error) { setNotice({ text: error instanceof Error ? error.message : "تعذر الاتصال.", error: true }); }
    finally { setBusy(false); }
  }
  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setCopied(true); window.setTimeout(() => setCopied(false), 1600); } catch { window.prompt("انسخ الرابط:", link); }
  }

  const avatar = currentPhoto
    // eslint-disable-next-line @next/next/no-img-element
    ? <img src={currentPhoto} alt="" />
    : <AvatarPlaceholder />;

  return <>
    <div className="profile-head-stack">
      <button type="button" className={`profile-avatar profile-avatar-button ${currentPhoto ? "has-photo" : ""}`} onClick={() => setOpen(true)} aria-label="تعديل الصورة الشخصية">{avatar}</button>
      <button type="button" className="button button-primary button-small profile-edit-button" onClick={() => setOpen(true)}><UserRoundPen size={16}/> تعديل الملف الشخصي</button>
    </div>
    {open && <div className="modal-overlay modal-overlay-floating profile-editor-overlay" role="dialog" aria-modal="true" aria-label="تعديل الملف الشخصي" onClick={() => setOpen(false)}>
      <form className="profile-editor" onClick={(event) => event.stopPropagation()} onSubmit={(event) => void submit(event)}>
        <header className="profile-editor-head">
          <div><strong>تعديل الملف الشخصي</strong><small>ملفك الشخصي مستقل عن بيانات مهنتك — التعديل هنا لا يغيّر شيئًا في الدليل.</small></div>
          <button type="button" className="icon-button" onClick={() => setOpen(false)} aria-label="إغلاق"><X size={18}/></button>
        </header>
        <div className="profile-editor-body">
          <section className="profile-editor-photo">
            <AvatarPicker value={photo} currentUrl={currentPhoto} onChange={setPhoto} size={112} hint={ownedCount > 0 ? `صورة واحدة مشتركة: تظهر على ملفك وعلى كارت مهنتك${ownedCount > 1 ? ` (${ownedCount} مهن)` : ""} وبطاقة عملك.` : "تظهر على ملفك الشخصي، وعلى كارت مهنتك إن سجّلتها بنفس رقم هاتفك."}/>
          </section>
          <section className="profile-editor-grid">
            <label className="field"><span>الاسم</span><input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required/></label>
            <label className="field"><span>رقم الهاتف</span><input value={phone} onChange={(event) => setPhone(event.target.value)} dir="ltr" inputMode="tel" maxLength={24} required/><small>هذا الرقم هو الذي يربط ملفك بكارت مهنتك في الدليل.</small></label>
            <label className="field"><span>اسم المستخدم</span><input value={member.username} dir="ltr" readOnly disabled/></label>
            <label className="field"><span>تاريخ الانضمام</span><input value={new Date(member.createdAt).toLocaleDateString("ar-EG")} readOnly disabled/></label>
            {MEMBER_PROFILE_FIELDS.map((field) => <label key={field.key} className={`field ${field.type === "textarea" ? "is-wide" : ""}`}>
              <span>{field.label} <em>(اختياري)</em></span>
              {field.type === "textarea"
                ? <textarea value={values[field.key]} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} maxLength={field.max} rows={3} placeholder={field.placeholder}/>
                : <input type={field.type} value={values[field.key]} onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))} maxLength={field.max} placeholder={field.placeholder} dir={field.type === "text" ? undefined : "ltr"} inputMode={field.type === "tel" ? "tel" : undefined}/>}
            </label>)}
          </section>
          <section className="profile-editor-qr">
            <QrSvg value={link || profileUrl(member.id)} size={104} label="رمز QR لملفك الشخصي"/>
            <div>
              <strong><QrCode size={16}/> رمز ملفك الشخصي</strong>
              <small>أي شخص يمسح الرمز أو يضغط على صورتك في الكارت يفتح ملفك العام.</small>
              <div className="profile-editor-qr-actions">
                <Link href={profileUrl(member.id)} className="button button-soft button-small" target="_blank"><ExternalLink size={14}/> عرض ملفي</Link>
                <button type="button" className="button button-soft button-small" onClick={() => void copyLink()}>{copied ? <Check size={14}/> : <Copy size={14}/>}{copied ? "تم النسخ" : "نسخ الرابط"}</button>
              </div>
            </div>
          </section>
          <p className="profile-editor-note"><ShieldCheck size={16}/> كل الخانات الإضافية اختيارية ويمكن تركها فارغة. ما تكتبه هنا يظهر في ملفك العام فقط.</p>
          {notice && <div className={`form-notice ${notice.error ? "is-error" : "is-success"}`} role="status">{notice.text}</div>}
        </div>
        <footer className="profile-editor-foot">
          <button type="button" className="button button-soft" onClick={() => setOpen(false)}>إغلاق</button>
          <button type="submit" className="button button-primary" disabled={busy}>{busy ? <LoaderCircle size={16} className="spin"/> : <Check size={16}/>} حفظ الملف الشخصي</button>
        </footer>
      </form>
    </div>}
  </>;
}
