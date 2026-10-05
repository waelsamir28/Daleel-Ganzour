"use client";

import { useRef, useState } from "react";
import { AlertCircle, Check, CircleCheck, FileSpreadsheet, LoaderCircle, Upload } from "lucide-react";
import type { AdminDirectory } from "@/lib/catalog";

type ImportRow = { rowNumber: number; name: string; phone: string; contactName: string; error: string | null };
type ImportResult = { rows: ImportRow[]; total: number; readyCount: number; importedCount?: number; error?: string };

export default function AdminImport({ data, onImported }: { data: AdminDirectory; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("medical-labs");
  const [area, setArea] = useState(data.areas[0]?.name ?? "");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState<"preview" | "import" | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const specialties = data.categories.filter((item) => item.parentId && item.active && data.categories.some((parent) => parent.id === item.parentId && parent.active));

  async function submit(confirm = false) {
    if (!file) {
      setMessage({ text: "اختار ملف Excel الأول.", error: true });
      return;
    }
    setBusy(confirm ? "import" : "preview");
    setMessage(null);
    try {
      const body = new FormData();
      body.set("file", file);
      body.set("category", category);
      body.set("area", area);
      body.set("confirm", String(confirm));
      const response = await fetch("/api/admin/import", { method: "POST", body, cache: "no-store" });
      const payload = (await response.json()) as ImportResult;
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "تعذر قراءة الملف.");
      setResult(payload);
      if (confirm) {
        setMessage({ text: `تم استيراد ${payload.importedCount ?? 0} سجل إلى طلبات المراجعة.`, error: false });
        setFile(null);
        if (fileInput.current) fileInput.current.value = "";
        onImported();
      }
    } catch (error) {
      setMessage({ text: error instanceof Error ? error.message : "تعذر الاتصال. حاول مرة أخرى.", error: true });
    } finally {
      setBusy(null);
    }
  }

  return <div className="admin-import">
    <div className="admin-import-intro"><span className="admin-import-icon"><FileSpreadsheet size={24}/></span><div><h3>أضف بيانات المعامل من ملف Excel</h3><p>ارفع ملف ‎.xlsx يحتوي على الاسم ورقم التليفون واسم المعمل. تتم إضافة السجلات كطلبات قيد المراجعة، ولا تظهر للزوار قبل موافقتك.</p></div></div>
    <div className="admin-import-settings">
      <label>تصنيف السجلات<select value={category} onChange={(event) => setCategory(event.target.value)}>{specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
      <label>العنوان الافتراضي<select value={area} onChange={(event) => setArea(event.target.value)}>{data.areas.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select></label>
    </div>
    <div className="admin-import-upload"><label htmlFor="admin-excel-file">ملف Excel <span>اختياريًا: ارفع ملفًا حتى 4 ميجابايت، بحد أقصى 500 صف.</span></label><input ref={fileInput} id="admin-excel-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); setMessage(null); }}/>{file && <p className="admin-import-filename"><FileSpreadsheet size={16}/>{file.name}</p>}</div>
    <div className="admin-import-format"><strong>ترتيب الأعمدة المدعوم</strong><p>الاسم | رقم التليفون | المعمل</p><small>تُقبل عناوين الأعمدة القريبة مثل «رقم الهاتف» و«اسم المعمل». ويمكن أن يكون الاسم واسم المعمل متطابقين.</small></div>
    <div className="admin-import-actions"><button className="button button-primary" type="button" onClick={() => submit(false)} disabled={Boolean(busy) || !file}><Upload size={16}/>{busy === "preview" ? "جاري فحص الملف..." : "معاينة الملف"}</button>{result && result.readyCount > 0 && <button className="button button-success" type="button" onClick={() => submit(true)} disabled={Boolean(busy) || !file}>{busy === "import" ? <LoaderCircle size={16} className="spin"/> : <Check size={16}/>}استيراد {result.readyCount} سجل</button>}</div>
    {busy && <p className="admin-import-status" role="status"><LoaderCircle size={16} className="spin"/> جاري {busy === "preview" ? "فحص الملف" : "حفظ البيانات"} بأمان...</p>}
    {message && <p className={`admin-import-message ${message.error ? "is-error" : "is-success"}`} role={message.error ? "alert" : "status"}>{message.error ? <AlertCircle size={17}/> : <CircleCheck size={17}/>}<span>{message.text}</span></p>}
    {result && <section className="admin-import-results" aria-live="polite"><div className="admin-import-summary"><strong>نتيجة فحص الملف</strong><span>{result.total} صف</span><span>{result.readyCount} جاهز للاستيراد</span><span>{result.total - result.readyCount} يحتاج مراجعة أو مكرر</span>{result.importedCount !== undefined && <span>{result.importedCount} أضيف للمراجعة</span>}</div>{result.rows.length > 0 && <div className="admin-import-table-wrap"><table><thead><tr><th>صف الملف</th><th>اسم المعمل</th><th>رقم الهاتف</th><th>الحالة</th></tr></thead><tbody>{result.rows.slice(0, 10).map((row) => <tr key={row.rowNumber}><td>{row.rowNumber}</td><td>{row.name || row.contactName || "—"}</td><td dir="ltr">{row.phone || "—"}</td><td>{row.error ? <span className="admin-import-row-error">{row.error}</span> : <span className="admin-import-row-ready">جاهز للمراجعة</span>}</td></tr>)}</tbody></table></div>}{result.rows.length > 10 && <p className="admin-import-more">تُعرض أول 10 صفوف فقط هنا؛ سيتم فحص جميع الصفوف قبل الحفظ.</p>}</section>}
  </div>;
}

export type { ImportResult, ImportRow };
