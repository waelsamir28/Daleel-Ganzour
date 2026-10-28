"use client";
import Link from "next/link";
import { ChevronLeft, GraduationCap, School } from "lucide-react";
import type { CSSProperties } from "react";
import { TEACHER_CENTER_ID, TEACHER_STAGES, TEACHERS_ROOT_ID, stageHref, stickerIconUrl, type TeacherStageId } from "@/lib/catalog";
import { Modal, StickerIcon } from "@/components/ui";

/** شاشة عائمة لاختيار المرحلة الدراسية قبل عرض تخصصات قسم «المدرسين». */
export default function TeacherStageModal({ current, counts, centerCount, onClose, onPick, allowAll = true, showCenter = true }: { current?: TeacherStageId | null; counts?: Partial<Record<TeacherStageId, number>>; centerCount?: number; onClose: () => void; onPick?: (stage: TeacherStageId | null) => void; allowAll?: boolean; showCenter?: boolean }) {
  return <Modal floating className="stage-modal" title="اختر المرحلة الدراسية" subtitle="عشان نعرض لك مدرسين ومواد المرحلة اللي تهمك" onClose={onClose}>
    <div className="stage-choice-grid">
      {TEACHER_STAGES.map((stage) => {
        const total = counts?.[stage.id];
        return <Link key={stage.id} href={stageHref(TEACHERS_ROOT_ID, stage.id)} className={`stage-choice ${current === stage.id ? "is-current" : ""}`} style={{ "--stage-color": stage.color } as CSSProperties} onClick={() => { onPick?.(stage.id); onClose(); }} aria-current={current === stage.id ? "page" : undefined}>
          <span className="stage-choice-art"><StickerIcon src={stage.sticker} size={92}/></span>
          <span className="stage-choice-text">
            <strong>{stage.name}</strong>
            <small>{stage.hint}</small>
            {typeof total === "number" && <em>{total ? `${total} تخصص` : "التخصصات قيد التجهيز"}</em>}
          </span>
          <ChevronLeft size={20} className="stage-choice-arrow" aria-hidden="true"/>
        </Link>;
      })}
      {showCenter && <Link href={`/categories/${TEACHERS_ROOT_ID}/${TEACHER_CENTER_ID}`} className="stage-choice stage-choice-center" style={{ "--stage-color": "#9160df" } as CSSProperties} onClick={() => { onPick?.(null); onClose(); }}>
        <span className="stage-choice-art"><StickerIcon src={stickerIconUrl(TEACHER_CENTER_ID)} size={92}/></span>
        <span className="stage-choice-text">
          <strong>سنتر تعليمي ومجموعات تقوية</strong>
          <small>سناتر تضم أكثر من مادة ومرحلة في مكان واحد، مع جدول الحصص وأسماء المدرسين</small>
          {typeof centerCount === "number" && <em><School size={13}/> {centerCount ? `${centerCount} سنتر مسجّل` : "كن أول سنتر يسجّل"}</em>}
        </span>
        <ChevronLeft size={20} className="stage-choice-arrow" aria-hidden="true"/>
      </Link>}
    </div>
    {allowAll && <Link href={stageHref(TEACHERS_ROOT_ID, null)} className="button button-soft stage-choice-all" onClick={() => { onPick?.(null); onClose(); }}><GraduationCap size={17}/> عرض كل التخصصات بدون تحديد مرحلة</Link>}
  </Modal>;
}
