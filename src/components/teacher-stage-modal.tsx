"use client";
import Link from "next/link";
import { ChevronLeft, GraduationCap } from "lucide-react";
import type { CSSProperties } from "react";
import { TEACHER_STAGES, TEACHERS_ROOT_ID, stageHref, type TeacherStageId } from "@/lib/catalog";
import { Modal, StickerIcon } from "@/components/ui";

/** شاشة عائمة لاختيار المرحلة الدراسية قبل عرض تخصصات قسم «المدرسين». */
export default function TeacherStageModal({ current, counts, onClose, onPick, allowAll = true }: { current?: TeacherStageId | null; counts?: Partial<Record<TeacherStageId, number>>; onClose: () => void; onPick?: (stage: TeacherStageId | null) => void; allowAll?: boolean }) {
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
    </div>
    {allowAll && <Link href={stageHref(TEACHERS_ROOT_ID, null)} className="button button-soft stage-choice-all" onClick={() => { onPick?.(null); onClose(); }}><GraduationCap size={17}/> عرض كل التخصصات بدون تحديد مرحلة</Link>}
  </Modal>;
}
