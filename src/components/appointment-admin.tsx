"use client";
import { useState } from "react";

type Item = { id: string; name: string; phone: string; preference: string; serviceName: string; serviceId: string; createdAt: string; status: string };
const labels: Record<string, string> = { waiting: "بانتظار التواصل", contacted: "تم التواصل", closed: "مغلق" };
export default function AppointmentAdmin() {
  const [items, setItems] = useState<Item[]>([]), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const [provider, setProvider] = useState(""), [statusFilter, setStatusFilter] = useState(""), [from, setFrom] = useState(""), [to, setTo] = useState("");
  const dateError = Boolean(from && to && from > to);
  const filtered = items.filter((item) => {
    const date = new Intl.DateTimeFormat("en-CA", { timeZone: "Africa/Cairo", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(item.createdAt));
    return (!provider || item.serviceId === provider) && (!statusFilter || item.status === statusFilter) && (!from || date >= from) && (!to || date <= to);
  });
  async function load() {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/appointments", { cache: "no-store" }), result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر تحميل الطلبات.");
      setItems(result.items);
    } catch (error) { setError(error instanceof Error ? error.message : "تعذر الاتصال."); }
    finally { setBusy(false); }
  }
  async function change(id: string, status: string) {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/appointments", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? "تعذر الحفظ.");
      setItems(items.map((item) => item.id === id ? { ...item, status } : item));
    } catch (error) { setError(error instanceof Error ? error.message : "تعذر الاتصال."); }
    finally { setBusy(false); }
  }
  return <section className="admin-content"><h2>طلبات المواعيد وقائمة الانتظار</h2><p>طلبات للتنسيق، وليست حجوزات مؤكدة. الفلاتر تعمل على أحدث ٢٠٠ طلب محمّل، حسب تاريخ الإرسال بتوقيت جنزور.</p><button className="button button-soft" disabled={busy} onClick={load}>تحميل / تحديث طلبات المواعيد</button>
    <div className="request-form"><label className="field">مقدم الخدمة<select value={provider} onChange={(event) => setProvider(event.target.value)}><option value="">كل مقدمي الخدمات</option>{[...new Map(items.map((item) => [item.serviceId, item.serviceName])).entries()].map(([id, name]) => <option key={id} value={id}>{name}</option>)}</select></label>
    <label className="field">حالة طلب الموعد<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}><option value="">كل الحالات</option>{Object.entries(labels).map(([status, label]) => <option key={status} value={status}>{label}</option>)}</select></label>
    <label className="field">من تاريخ<input type="date" value={from} onChange={(event) => setFrom(event.target.value)}/></label><label className="field">إلى تاريخ<input type="date" value={to} onChange={(event) => setTo(event.target.value)}/></label>
    <button className="button button-soft" onClick={() => { setProvider(""); setStatusFilter(""); setFrom(""); setTo(""); }}>مسح فلاتر المواعيد</button></div>
    {dateError && <p role="alert">تاريخ البداية يجب أن يسبق تاريخ النهاية.</p>}{error && <p role="alert">{error}</p>}<p>{dateError ? 0 : filtered.length} طلب مطابق</p>{!dateError && filtered.map((item) => <article className="admin-service-row" key={item.id}>
    <h3>{item.serviceName} — {item.name}</h3><a href={`tel:${item.phone}`} dir="ltr">{item.phone}</a><p>{item.preference}</p><p>{labels[item.status]}</p>
    {Object.entries(labels).map(([status, label]) => <button className="button button-soft" key={status} disabled={busy || status === item.status} onClick={() => change(item.id, status)}>{label}</button>)}
  </article>)}</section>;
}
