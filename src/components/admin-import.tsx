"use client";

import { useRef, useState } from "react";
import { AlertCircle, Check, CircleCheck, Download, FileSpreadsheet, LoaderCircle, RefreshCw, Upload } from "lucide-react";
import type { AdminDirectory } from "@/lib/catalog";
import SelectField from "@/components/select-field";

type ImportRow = { updateId?: string | null; updateName?: string; rowNumber: number; name: string; contactName: string; phone: string; phoneSecondary: string; profession: string; categoryLabel: string; categoryId: string; categoryName: string; categoryParentId: string; rootName: string; newSpecialty: boolean; address: string; description: string; error: string | null };
type ImportResult = { rows: ImportRow[]; total: number; readyCount: number; updateCount?: number; importedCount?: number; updatedCount?: number; newSpecialtyCount?: number; error?: string };

export default function AdminImport({ data, onImported }: { data: AdminDirectory; onImported: () => void }) {
  const [file, setFile] = useState<File | null>(null);
  const [category, setCategory] = useState("medical-labs");
  const [area, setArea] = useState(data.areas[0]?.name ?? "");
  const [result, setResult] = useState<ImportResult | null>(null);
  const [busy, setBusy] = useState<"preview" | "import" | null>(null);
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const [updateExisting, setUpdateExisting] = useState(false);
  const [skipped, setSkipped] = useState<number[]>([]);
  const [showAll, setShowAll] = useState(false);
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
      body.set("mode", updateExisting ? "update" : "skip");
      if (confirm && skipped.length) body.set("skip", skipped.join(","));
      const response = await fetch("/api/admin/import", { method: "POST", body, cache: "no-store" });
      const payload = (await response.json()) as ImportResult;
      if (response.status === 401) {
        window.location.assign("/login");
        return;
      }
      if (!response.ok) throw new Error(payload.error ?? "تعذر قراءة الملف.");
      setResult(payload);
      if (!confirm) setSkipped([]);
      if (confirm) {
        setSkipped([]);
        setMessage({ text: `تم استيراد ${payload.importedCount ?? 0} سجل إلى طلبات المراجعة${payload.updatedCount ? ` وتحديث ${payload.updatedCount} سجل موجود` : ""}.`, error: false });
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
    <div className="admin-import-intro"><span className="admin-import-icon"><FileSpreadsheet size={24}/></span><div><h3>استيراد بيانات المهن من ملف Excel</h3><p>كل صف يُربط بتخصصه وقسمه الرئيسي. التخصصات الجديدة تُضاف تحت القسم المكتوب في الملف، والوصف الفارغ يُنشأ بصياغة تناسب المهنة وتختلف من شخص لآخر. تراجع البيانات قبل الاستيراد، ثم تذهب كلها للمراجعة قبل ظهورها للزوار.</p></div></div>
    <div className="admin-import-template">
      <div><strong>١. نزّل القالب الجاهز</strong><span>ملف Excel بالأعمدة الصحيحة وقوائم منسدلة للتصنيفات والمهن والعناوين الحالية + ورقة تعليمات.</span></div>
      <div className="admin-import-template-actions">
        <a className="button button-primary button-small" href="/api/admin/import" download><Download size={15}/>تنزيل القالب</a>
        <a className="button button-soft button-small" href="/api/admin/import?sample=1" download><FileSpreadsheet size={15}/>القالب مع صف مثال</a>
      </div>
    </div>
    <div className="admin-import-settings">
      <label>التخصص الافتراضي عند ترك المهنة فارغة<SelectField value={category} onChange={(event) => setCategory(event.target.value)}>{specialties.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</SelectField></label>
      <label>العنوان الافتراضي عند ترك العنوان فارغًا<SelectField value={area} onChange={(event) => setArea(event.target.value)}>{data.areas.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</SelectField></label>
    </div>
    <label className={`admin-import-mode ${updateExisting ? "is-on" : ""}`}><input type="checkbox" checked={updateExisting} onChange={(event) => { setUpdateExisting(event.target.checked); setResult(null); }}/><RefreshCw size={16}/><span><strong>تحديث الموجودين بنفس رقم الهاتف</strong><small>{updateExisting ? "الصف الذي يطابق رقم مهني مسجل يحدّث اسمه ومهنته وعنوانه ووصفه (إن كُتب) ويبقى منشورًا." : "الافتراضي: الأرقام المسجلة بالفعل تُتخطى ولا تُكرر."}</small></span></label>
    <div className="admin-import-upload"><label htmlFor="admin-excel-file">ملف Excel <span>ارفع ملف ‎.xlsx حتى 4 ميجابايت، بحد أقصى 500 صف.</span></label><input ref={fileInput} id="admin-excel-file" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setResult(null); setMessage(null); }}/>{file && <p className="admin-import-filename"><FileSpreadsheet size={16}/>{file.name}</p>}</div>
    <div className="admin-import-format"><strong>٢. املأ القالب ثم ارفعه — ترتيب الأعمدة في الصف الأول</strong><p>الاسم | رقم التليفون | رقم التليفون 1 | المهنة | التصنيف | العنوان | وصف الخدمة</p><small>الهاتف الثاني والعنوان والوصف اختياريون. «التصنيف» يحدد القسم الرئيسي مثل «أطباء»، و«المهنة» تحدد التخصص مثل «مسالك بولية». إذا لم يكن التخصص موجودًا، يُضاف تحت القسم بعد مراجعة المعاينة. الوصف الفارغ يُنشأ تلقائيًا لكل مهنة؛ وملف المعامل القديم ما زال مدعومًا.</small></div>
    <div className="admin-import-actions"><button className="button button-primary" type="button" onClick={() => submit(false)} disabled={Boolean(busy) || !file}><Upload size={16}/>{busy === "preview" ? "جاري فحص الملف..." : "معاينة الملف"}</button>{result && result.readyCount > 0 && <button className="button button-success" type="button" onClick={() => submit(true)} disabled={Boolean(busy) || !file || result.readyCount - skipped.length <= 0}>{busy === "import" ? <LoaderCircle size={16} className="spin"/> : <Check size={16}/>}استيراد {Math.max(0, result.readyCount - skipped.length)} سجل</button>}</div>
    {busy && <p className="admin-import-status" role="status"><LoaderCircle size={16} className="spin"/> جاري {busy === "preview" ? "فحص الملف" : "حفظ البيانات"} بأمان...</p>}
    {message && <p className={`admin-import-message ${message.error ? "is-error" : "is-success"}`} role={message.error ? "alert" : "status"}>{message.error ? <AlertCircle size={17}/> : <CircleCheck size={17}/>}<span>{message.text}</span></p>}
    {result && <section className="admin-import-results" aria-live="polite"><div className="admin-import-summary"><strong>{result.importedCount !== undefined ? "اكتمل الاستيراد" : "نتيجة فحص الملف"}</strong>{result.importedCount === undefined ? <><span>{result.total} صف</span><span>{result.readyCount - (result.updateCount ?? 0)} جديد</span>{Boolean(result.updateCount) && <span>{result.updateCount} سيُحدَّث</span>}<span>{result.total - result.readyCount} يحتاج مراجعة أو مكرر</span>{skipped.length > 0 && <span>{skipped.length} مستبعد يدويًا</span>}{Boolean(result.newSpecialtyCount) && <span>{result.newSpecialtyCount} تخصص جديد سيُضاف</span>}</> : <><span>{result.importedCount} سجل أضيف للمراجعة</span>{Boolean(result.updatedCount) && <span>{result.updatedCount} سجل حُدِّث</span>}{Boolean(result.newSpecialtyCount) && <span>{result.newSpecialtyCount} تخصص جديد أُضيف</span>}</>}</div>{result.rows.length > 0 && <div className="admin-import-table-wrap"><table><thead><tr>{result.importedCount === undefined && <th>استيراد</th>}<th>صف الملف</th><th>الاسم</th><th>رقما الهاتف</th><th>القسم والتخصص</th><th>وصف الخدمة</th><th>العنوان</th><th>الحالة</th></tr></thead><tbody>{(showAll ? result.rows : result.rows.slice(0, 25)).map((row) => <tr key={row.rowNumber} className={row.error ? "is-error" : skipped.includes(row.rowNumber) ? "is-skipped" : row.updateId ? "is-update" : ""}>{result.importedCount === undefined && <td><input type="checkbox" aria-label={`استيراد صف ${row.rowNumber}`} disabled={Boolean(row.error)} checked={!row.error && !skipped.includes(row.rowNumber)} onChange={() => setSkipped((current) => current.includes(row.rowNumber) ? current.filter((item) => item !== row.rowNumber) : [...current, row.rowNumber])}/></td>}<td>{row.rowNumber}</td><td>{row.name || row.contactName || "—"}</td><td dir="ltr">{row.phone || "—"}{row.phoneSecondary && <><br/>{row.phoneSecondary}</>}</td><td><strong>{row.categoryName || row.profession || row.categoryLabel || "—"}</strong>{(row.rootName || row.categoryLabel) && <small className="admin-import-row-root">{row.categoryLabel || row.rootName}</small>}{row.newSpecialty && !row.error && <small className="admin-import-row-new">{result.importedCount !== undefined ? "تخصص أُضيف" : "سيُضاف كتخصص جديد"}</small>}</td><td className="admin-import-description">{row.description || "سيُنشأ بعد تحديد التخصص"}</td><td>{row.address || "العنوان الافتراضي"}</td><td>{row.error ? <span className="admin-import-row-error">{row.error}</span> : skipped.includes(row.rowNumber) ? <span className="admin-import-row-skipped">مستبعد</span> : row.updateId ? <span className="admin-import-row-update">سيُحدَّث: {row.updateName}</span> : <span className="admin-import-row-ready">{result.importedCount !== undefined ? "تمت الإضافة" : "جديد — جاهز للمراجعة"}</span>}</td></tr>)}</tbody></table></div>}{result.rows.length > 25 && <p className="admin-import-more">{showAll ? `تُعرض كل الصفوف (${result.rows.length}).` : `تُعرض أول 25 صفًا من ${result.rows.length}.`} <button type="button" className="button button-soft button-small" onClick={() => setShowAll((value) => !value)}>{showAll ? "عرض أول 25 فقط" : "عرض كل الصفوف"}</button></p>}</section>}
  </div>;
}

export type { ImportResult, ImportRow };
