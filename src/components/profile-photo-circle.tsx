"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";
import { createPortal } from "react-dom";
import { Camera, Check, UserRound, X } from "lucide-react";
import { profileUrl, servicePhotoUrl, type ServiceRecord } from "@/lib/catalog";
import { ownsService, refreshOwnership, useOwnership } from "@/lib/viewer-ownership";
import AvatarPicker from "@/components/avatar-picker";

/**
 * دائرة الصورة الشخصية على كارت المهني (تظهر دائمًا حتى بلا صورة):
 * - بلا صورة: شكل صورة شخصية + كلمة «أضف صورة».
 * - الضغط من الزائر → يفتح الملف الشخصي لصاحب الكارت.
 * - الضغط من صاحب الكارت (عضو بنفس الرقم أو دخل على رابط «حسابي») → يفتح رفع/تغيير الصورة فورًا.
 */
type Props = { service: ServiceRecord; size?: number; className?: string; preview?: boolean };

export default function ProfilePhotoCircle({ service, size = 54, className = "", preview = false }: Props) {
  const router = useRouter();
  const ownership = useOwnership();
  const owner = !preview && ownsService(ownership, service);
  const [localVersion, setLocalVersion] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const version = localVersion ?? service.photoVersion ?? 0;
  const url = servicePhotoUrl({ id: service.id, photoVersion: version });

  function handleClick(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    event.preventDefault();
    if (preview) return;
    if (owner) { setOpen(true); return; }
    router.push(profileUrl(service.id));
  }

  return <>
    <button
      type="button"
      className={`profile-photo-circle ${url ? "has-photo" : "is-empty"} ${owner ? "is-owner" : ""} ${className}`}
      style={{ width: size, height: size }}
      onClick={handleClick}
      title={owner ? (url ? "تغيير صورتك" : "أضف صورتك الشخصية") : `الملف الشخصي لـ ${service.name}`}
      aria-label={owner ? (url ? "تغيير صورتك الشخصية" : "أضف صورتك الشخصية") : `فتح الملف الشخصي لـ ${service.name}`}
    >
      {url
        // eslint-disable-next-line @next/next/no-img-element
        ? <img src={url} alt="" loading="lazy" decoding="async" />
        : <span className="profile-photo-empty"><UserRound size={Math.round(size * 0.4)} strokeWidth={1.8} /><small>أضف صورة</small></span>}
      {owner && <span className="profile-photo-owner-badge" aria-hidden="true"><Camera size={11} /></span>}
    </button>
    {open && <PhotoUploadModal service={service} currentUrl={url} token={ownership.tokens[service.id]} onClose={() => setOpen(false)} onSaved={(nextVersion) => { setLocalVersion(nextVersion); setOpen(false); router.refresh(); }} />}
  </>;
}

type ModalProps = { service: ServiceRecord; currentUrl: string; token?: string; onClose: () => void; onSaved: (version: number) => void };

function PhotoUploadModal({ service, currentUrl, token, onClose, onSaved }: ModalProps) {
  const [value, setValue] = useState<string | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  async function save() {
    if (value === undefined) { setError("اختر صورة أولًا."); return; }
    setBusy(true); setError("");
    try {
      // عضو مسجّل بنفس الرقم → /api/profile (تنعكس على ملفه وكل مهنه)؛ وإلا رابط «حسابي» → /api/my.
      const response = token
        ? await fetch("/api/my", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, action: "photo", photo: value }) })
        : await fetch("/api/profile", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "service-photo", serviceId: service.id, photo: value }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "تعذر حفظ الصورة.");
      const nextVersion = typeof data.servicePhotoVersion === "number" ? data.servicePhotoVersion : (data.service?.photoVersion ?? (value ? (service.photoVersion ?? 0) + 1 : 0));
      void refreshOwnership();
      onSaved(nextVersion);
    } catch (fail) { setError(fail instanceof Error ? fail.message : "تعذر الاتصال."); }
    finally { setBusy(false); }
  }

  if (typeof document === "undefined") return null;
  return createPortal(
    <div className="modal-overlay modal-overlay-floating profile-photo-modal-overlay" role="dialog" aria-modal="true" aria-label="الصورة الشخصية" onClick={(event) => { event.stopPropagation(); onClose(); }}>
      <div className="profile-photo-modal" onClick={(event) => event.stopPropagation()}>
        <header>
          <strong>{currentUrl ? "تغيير صورتك الشخصية" : "أضف صورتك الشخصية"}</strong>
          <button type="button" className="icon-button" onClick={onClose} aria-label="إغلاق"><X size={18} /></button>
        </header>
        <p>الصورة تظهر على كارت «{service.name}» وبطاقة العمل وملفك الشخصي. نقصّها داخل دائرة ونضغطها تلقائيًا.</p>
        <AvatarPicker value={value} currentUrl={currentUrl} onChange={setValue} size={96} hint="صورتك أو لوجو المحل — حتى 3 ميجابايت." />
        {error && <small className="form-error" role="alert">{error}</small>}
        <div className="profile-photo-modal-actions">
          <button type="button" className="button button-soft" onClick={onClose}>إلغاء</button>
          <button type="button" className="button button-primary" disabled={busy || value === undefined} onClick={() => void save()}><Check size={16} />{busy ? "جارٍ الحفظ…" : "حفظ الصورة"}</button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
