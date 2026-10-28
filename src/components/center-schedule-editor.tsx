"use client";

import { Plus, Trash2 } from "lucide-react";
import { CENTER_SCHEDULE_MAX, TEACHER_STAGES, WEEK_DAYS, type CenterLesson, type CenterSchedule } from "@/lib/catalog";
import SelectField from "@/components/select-field";

/** محرر جدول حصص السنتر: صف لكل حصة (يوم، مادة، مرحلة، مدرس، موعد). */
export default function CenterScheduleEditor({ value, onChange, subjects, name }: { value: CenterSchedule; onChange: (next: CenterSchedule) => void; subjects: string[]; name?: string }) {
  const dayOrder = [6, 0, 1, 2, 3, 4, 5];
  function update(index: number, patch: Partial<CenterLesson>) { onChange(value.map((lesson, i) => i === index ? { ...lesson, ...patch } : lesson)); }
  function add() {
    if (value.length >= CENTER_SCHEDULE_MAX) return;
    const last = value[value.length - 1];
    onChange([...value, { day: last?.day ?? 6, subject: subjects[0] ?? "", teacher: "", time: "", stage: last?.stage ?? "" }]);
  }
  return <fieldset className="center-schedule-editor">
    <legend>🗓️ جدول الحصص الأسبوعي</legend>
    {name && <input type="hidden" name={name} value={JSON.stringify(value)}/>}
    {value.length === 0 && <p className="input-help">لا توجد حصص بعد. أضف حصة لكل مادة ويوم، وسيظهر الجدول للزوار في صفحة السنتر مع زر مشاركته صورة على واتساب.</p>}
    {value.length > 0 && <div className="center-schedule-rows">
      {value.map((lesson, index) => <div key={index} className="center-schedule-row">
        <SelectField aria-label="اليوم" value={String(lesson.day)} onChange={(event) => update(index, { day: Number(event.target.value) })}>{dayOrder.map((day) => <option key={day} value={day}>{WEEK_DAYS[day]}</option>)}</SelectField>
        <input list={`center-subjects-${index}`} aria-label="المادة" value={lesson.subject} onChange={(event) => update(index, { subject: event.target.value })} placeholder="المادة" maxLength={60} required/>
        <datalist id={`center-subjects-${index}`}>{subjects.map((subject) => <option key={subject} value={subject}/>)}</datalist>
        <SelectField aria-label="المرحلة" value={lesson.stage} onChange={(event) => update(index, { stage: event.target.value })}><option value="">كل المراحل</option>{TEACHER_STAGES.map((stage) => <option key={stage.id} value={stage.short}>{stage.short}</option>)}</SelectField>
        <input aria-label="المدرس" value={lesson.teacher} onChange={(event) => update(index, { teacher: event.target.value })} placeholder="أ. اسم المدرس (اختياري)" maxLength={60}/>
        <input aria-label="الموعد" value={lesson.time} onChange={(event) => update(index, { time: event.target.value })} placeholder="الموعد: ٤ – ٦ م" maxLength={40} required/>
        <button type="button" className="icon-button center-schedule-remove" aria-label="حذف الحصة" onClick={() => onChange(value.filter((_, i) => i !== index))}><Trash2 size={16}/></button>
      </div>)}
    </div>}
    <button type="button" className="button button-soft center-schedule-add" onClick={add} disabled={value.length >= CENTER_SCHEDULE_MAX}><Plus size={16}/> إضافة حصة</button>
  </fieldset>;
}
