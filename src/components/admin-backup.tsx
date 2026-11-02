"use client";

import { useRef, useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, LoaderCircle, ShieldAlert, Upload } from "lucide-react";
import { BACKUP_MAX_BYTES, backupSummaryText, parseBackupPayload, restoreConfirmMessage, RESTORE_CONFIRM_WORD, type BackupPayload } from "@/lib/backup";

/**
 * النسخ الاحتياطي والاسترجاع:
 * - تنزيل نسخة كاملة (JSON ليها استرجاع، أو Excel للمراجعة).
 * - استرجاع من ملف JSON بعد تأكيد مكتوب — بيضيف ويحدّث، ومش بيمسح أي بيانات موجودة.
 */
export default function AdminBackup({ onRestored }: { onRestored: (result: { created: number; updated: number; skipped: number }, message: string) => void }) {
  const [file, setFile] = useState<BackupPayload | null>(null);
  const [fileName, setFileName] = useState("");
  const [error, setError] = useState("");
  const [confirmWord, setConfirmWord] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function pickFile(selected: File | undefined) {
    setError(""); setDone(""); setFile(null); setFileName("");
    if (!selected) return;
    if (selected.size > BACKUP_MAX_BYTES) { setError("الملف أكبر من ٢ ميجابايت — تأكد إنه ملف النسخة الاحتياطية الصحيح."); return; }
    try {
      const text = await selected.text();
      const parsed = parseBackupPayload(JSON.parse(text));
      if (!parsed.ok) { setError(parsed.error); return; }
      setFile(parsed.backup);
      setFileName(selected.name);
    } catch { setError("تعذر قراءة الملف — تأكد إنه ملف JSON صحيح."); }
  }

  async function restore() {
    if (!file) return;
    if (confirmWord.trim() !== RESTORE_CONFIRM_WORD) { setError(`اكتب كلمة «${RESTORE_CONFIRM_WORD}» في الخانة للتأكيد.`); return; }
    setBusy(true); setError(""); setDone("");
    try {
      const response = await fetch("/api/admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "backup", action: "restore", values: file }),
      });
      const data = (await response.json()) as { ok?: boolean; created?: number; updated?: number; skipped?: number; message?: string; error?: string };
      if (!response.ok || !data.ok) throw new Error(data.error || "تعذر الاسترجاع.");
      setDone(data.message || "تم الاسترجاع.");
      setFile(null); setFileName(""); setConfirmWord("");
      if (inputRef.current) inputRef.current.value = "";
      onRestored({ created: data.created ?? 0, updated: data.updated ?? 0, skipped: data.skipped ?? 0 }, data.message || "تم الاسترجاع.");
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "تعذر الاسترجاع.");
    } finally { setBusy(false); }
  }

  return (
    <div className="admin-backup">
      <section className="admin-backup-card">
        <header><span className="admin-backup-icon is-blue" aria-hidden="true"><Download size={19}/></span><div><h3>١. نزّل نسخة احتياطية</h3><p>ملف فيه كل المهن والأقسام والعناوين والإعدادات — احتفظ بيه على جهازك أو جوجل درايف.</p></div></header>
        <div className="admin-backup-actions">
          <a className="button button-primary button-small" href="/api/admin/backup?format=json" download><Download size={15}/> نسخة كاملة (JSON)</a>
          <a className="button button-soft button-small" href="/api/admin/backup?format=xlsx" download><FileSpreadsheet size={15}/> ملف Excel للمراجعة</a>
        </div>
        <small className="admin-backup-hint">الملف لا يحتوي كلمات مرور ولا جلسات — بيانات الدليل فقط.</small>
      </section>

      <section className="admin-backup-card">
        <header><span className="admin-backup-icon is-amber" aria-hidden="true"><Upload size={19}/></span><div><h3>٢. استرجع من نسخة</h3><p>اختار ملف JSON اللي نزّلته من هنا. الاسترجاع <strong>بيضيف ويحدّث</strong> اللي في الملف، ومش بيمسح أي بيانات موجودة.</p></div></header>

        <label className="admin-backup-drop">
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void pickFile(event.target.files?.[0])}
          />
          <span>{fileName || "اختار ملف النسخة الاحتياطية (.json)"}</span>
        </label>

        {file && (
          <div className="admin-backup-preview">
            <strong>{backupSummaryText(file)}</strong>
            <small>{restoreConfirmMessage(file)}</small>
            <div className="admin-backup-confirm">
              <input className="studio-textbox" value={confirmWord} onChange={(event) => setConfirmWord(event.target.value)} placeholder={`اكتب: ${RESTORE_CONFIRM_WORD}`}/>
              <button type="button" className="button button-primary button-small" disabled={busy} onClick={() => void restore()}>
                {busy ? <LoaderCircle size={15} className="spin"/> : <Upload size={15}/>} ابدأ الاسترجاع
              </button>
            </div>
          </div>
        )}

        {error && <p className="admin-backup-error" role="alert"><ShieldAlert size={15}/>{error}</p>}
        {done && <p className="admin-backup-done" role="status"><CheckCircle2 size={15}/>{done}</p>}
      </section>

      <p className="admin-backup-note">
        نصيحة: نزّل نسخة كل أسبوع، وقبل أي تعديل كبير. لو حصل خطأ، ارجع للنسخة الأخيرة في دقيقة.
      </p>
    </div>
  );
}
