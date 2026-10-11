"use client";
import { useState } from "react";

type Item = { id: string; name: string; phone: string; preference: string; serviceName: string; status: string };
const labels: Record<string, string> = { waiting: "بانتظار التواصل", contacted: "تم التواصل", closed: "مغلق" };
export default function AppointmentAdmin() {
  const [items, setItems] = useState<Item[]>([]), [error, setError] = useState(""), [busy, setBusy] = useState(false);
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
  return <section className="admin-content"><h2>طلبات المواعيد وقائمة الانتظار</h2><p>طلبات للتنسيق، وليست حجوزات مؤكدة. تعرض أحدث ٢٠٠ طلب.</p><button className="button button-soft" disabled={busy} onClick={load}>تحميل / تحديث طلبات المواعيد</button>{error && <p role="alert">{error}</p>}{items.map((item) => <article className="admin-service-row" key={item.id}>
    <h3>{item.serviceName} — {item.name}</h3><a href={`tel:${item.phone}`} dir="ltr">{item.phone}</a><p>{item.preference}</p><p>{labels[item.status]}</p>
    {Object.entries(labels).map(([status, label]) => <button className="button button-soft" key={status} disabled={busy || status === item.status} onClick={() => change(item.id, status)}>{label}</button>)}
  </article>)}</section>;
}
