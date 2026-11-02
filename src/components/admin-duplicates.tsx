"use client";

import { useMemo, useState } from "react";
import { CopyCheck, LoaderCircle, Trash2, UserRound } from "lucide-react";
import type { ServiceRecord } from "@/lib/catalog";
import { duplicateGroups, duplicateReasonLabel, duplicateSummary } from "@/lib/duplicate-groups";

/**
 * شاشة «فحص الأرقام المكررة»: مجموعة لكل تكرار (رقم واحد أو اسم متشابه)،
 * ومعاها اقتراح السجل الأكمل اللي يفضل، وأزرار حذف المكرر أو فتحه للتعديل.
 */
export default function AdminDuplicates({
  services,
  busy,
  onDelete,
  onEdit,
}: {
  services: ServiceRecord[];
  busy: string | null;
  onDelete: (service: ServiceRecord) => void;
  onEdit: (service: ServiceRecord) => void;
}) {
  const [hideApproved, setHideApproved] = useState(false);
  const [onlyPhone, setOnlyPhone] = useState(false);
  const groups = useMemo(() => {
    const all = duplicateGroups(services);
    return all.filter((group) => (!onlyPhone || group.reason === "phone") && (!hideApproved || group.all.some((service) => service.status !== "approved")));
  }, [services, hideApproved, onlyPhone]);
  const summary = duplicateSummary(groups);

  if (!services.length) return <p className="empty-state">مفيش خدمات في الدليل لسه.</p>;

  return (
    <div className="admin-duplicates">
      <div className="admin-duplicates-head">
        <div className="admin-duplicates-summary">
          <strong>{summary.groups} مجموعة مكررة</strong>
          <span>{summary.extra} سجل زيادة (يفضل يتشال) · {summary.phones} منهم بنفس الرقم</span>
        </div>
        <div className="admin-duplicates-filters">
          <button type="button" className={`button button-small ${onlyPhone ? "button-primary" : "button-soft"}`} aria-pressed={onlyPhone} onClick={() => setOnlyPhone((value) => !value)}>نفس الرقم فقط</button>
          <button type="button" className={`button button-small ${hideApproved ? "button-primary" : "button-soft"}`} aria-pressed={hideApproved} onClick={() => setHideApproved((value) => !value)}>فيها غير منشور</button>
        </div>
      </div>

      {groups.length === 0 && <p className="empty-state">مفيش تكرارات مطابقة للفلتر الحالي — الدليل نضيف ✅</p>}

      <div className="admin-duplicates-list">
        {groups.map((group) => (
          <article key={group.id} className={`admin-duplicate-group is-${group.reason}`}>
            <header className="admin-duplicate-head">
              <span className="admin-duplicate-reason"><CopyCheck size={15}/>{duplicateReasonLabel(group)}</span>
              <span className="admin-duplicate-count">{group.all.length} سجلات</span>
            </header>
            <ul className="admin-duplicate-rows">
              {group.all.map((service) => {
                const isKeep = service.id === group.keep.id;
                return (
                  <li key={service.id} className={`admin-duplicate-row ${isKeep ? "is-keep" : ""}`}>
                    <span className="admin-duplicate-avatar" aria-hidden="true"><UserRound size={16}/></span>
                    <div className="admin-duplicate-copy">
                      <strong>{service.name}{isKeep && <em className="admin-duplicate-badge">الأكمل — يفضل يفضل</em>}</strong>
                      <small dir="ltr">{service.phone}{service.phoneSecondary ? ` / ${service.phoneSecondary}` : ""}</small>
                      <small>{service.status === "approved" ? "منشور" : service.status === "pending" ? "بانتظار المراجعة" : service.status} • {service.area || "بدون عنوان"}</small>
                    </div>
                    <div className="admin-duplicate-actions">
                      <button type="button" className="button button-soft button-small" onClick={() => onEdit(service)}>تعديل</button>
                      {!isKeep && (
                        <button type="button" className="button button-danger-soft button-small" disabled={busy === service.id} onClick={() => onDelete(service)}>
                          {busy === service.id ? <LoaderCircle size={14} className="spin"/> : <Trash2 size={14}/>} حذف المكرر
                        </button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </article>
        ))}
      </div>

      <p className="admin-duplicates-note">
        «الأكمل» = أعلى ترتيب في: منشور ← موثّق ← صورة ← عنوان ← خدمات وتخصصات. احذف المكرر واحتفظ بالأكمل حتى لا يتوه الزائر بين رقمين لنفس الشخص.
      </p>
    </div>
  );
}
