"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, MessageCircle, RefreshCw, SearchX, Trash2 } from "lucide-react";
import { missingFulfilledMessage, missingKindLabel } from "@/lib/missing-profession";
import { whatsappUrl } from "@/lib/catalog";

type MissingRow = { id: string; need: string; name: string; phone: string; categoryName: string | null; status: string; createdAt: string };

const DATE = new Intl.DateTimeFormat("ar-EG", { dateStyle: "short" });

/**
 * «مهنة ناقصة» في لوحة الإدارة: اللي الزوار بيدوروا عليه ومش موجود،
 * مع زر «اتضافت» اللي بيجهّز رسالة واتساب للزائر، وزر حذف.
 */
export default function AdminMissing({ siteName }: { siteName: string }) {
  const [rows, setRows] = useState<MissingRow[]>([]);
  const [open, setOpen] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/missing", { cache: "no-store" });
      if (!response.ok) throw new Error(String(response.status));
      const data = (await response.json()) as { requests?: MissingRow[]; open?: number };
      setRows(data.requests ?? []);
      setOpen(data.open ?? 0);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  // الجلب بعد أول رسم فقط.
  // eslint-disable-next-line react-hooks/set-state-in-effect -- الجلب يبدأ بعد أول رسم فقط.
  useEffect(() => { void load(); }, [load]);

  async function act(id: string, action: "added" | "delete") {
    setBusy(id); setNote("");
    try {
      const response = await fetch("/api/missing", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, action }) });
      if (!response.ok) throw new Error(String(response.status));
      setNote(action === "delete" ? "اتحذف الطلب." : "اتسجل إن الطلب اتضاف — ابعت الرسالة للزائر من زر واتساب.");
      await load();
    } catch {
      setNote("تعذّر تنفيذ الإجراء — جرّب تاني.");
    } finally {
      setBusy("");
    }
  }

  return (
    <section className="analytics-panel-card">
      <div className="analytics-panel-head">
        <div>
          <h3><SearchX size={18}/> مهنة ناقصة ({open})</h3>
          <p>اللي الزوار بيدوروا عليه ومش موجود في الدليل — ده أفضل مصدر تعرف بيه إيه اللي لازم يتضاف.</p>
        </div>
        <button type="button" className="button button-soft button-small" onClick={() => { setState("loading"); void load(); }} disabled={state === "loading"}>
          <RefreshCw size={15} className={state === "loading" ? "code-report-spin" : ""}/> تحديث
        </button>
      </div>

      {state === "error" && <p className="analytics-empty-hint">تعذّر تحميل الطلبات — جرّب التحديث تاني.</p>}
      {state === "ready" && rows.length === 0 && <p className="analytics-empty-hint">مفيش طلبات مهنة ناقصة لحد الآن.</p>}
      {note && <p className="admin-push-note" role="status">{note}</p>}

      <div className="missing-admin-list">
        {rows.map((row) => (
          <article key={row.id} className={`missing-admin-row ${row.status === "added" ? "is-done" : ""}`}>
            <span className="missing-admin-kind">{missingKindLabel(row.need)}</span>
            <div className="missing-admin-main">
              <strong>{row.need}</strong>
              <small>{[row.name, row.categoryName, DATE.format(new Date(row.createdAt))].filter(Boolean).join(" • ")}</small>
            </div>
            <div className="missing-admin-actions">
              {row.status === "added" ? <span className="missing-admin-badge"><Check size={12}/> اتضاف</span> : (
                <button type="button" className="button button-soft button-small" disabled={busy === row.id} onClick={() => void act(row.id, "added")}><Check size={13}/> اتضافت</button>
              )}
              {row.phone && (
                <a
                  className="button button-soft button-small"
                  href={whatsappUrl(row.phone, missingFulfilledMessage({ name: row.name, need: row.need, title: row.categoryName ?? "خدمة جديدة", url: "/" }, siteName))}
                  target="_blank"
                  rel="noopener noreferrer"
                  title="ابعت للزائر إن الطلب اتضاف"
                >
                  <MessageCircle size={13}/> رد
                </a>
              )}
              <button type="button" className="button button-danger-soft button-small" disabled={busy === row.id} onClick={() => void act(row.id, "delete")} aria-label="حذف الطلب"><Trash2 size={13}/></button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
