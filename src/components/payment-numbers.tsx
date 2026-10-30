"use client";

import { useMemo, useState } from "react";
import { Building2, CreditCard, Search, X, Landmark } from "lucide-react";
import { paymentDialHref, paymentServices } from "@/lib/payments";

/** أرقام تطبيقات الدفع والبنوك — بحث سريع + طلب بضغطة، بدون أي اتصال بالخادم. */
export default function PaymentNumbers() {
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState<"all" | "app" | "bank">("all");

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return paymentServices.filter((service) => {
      if (group !== "all" && service.group !== group) return false;
      if (!needle) return true;
      return `${service.name} ${service.number} ${service.keywords ?? ""}`.toLowerCase().includes(needle);
    });
  }, [group, query]);

  return (
    <section className="payments-section" aria-label="أرقام البنوك وتطبيقات الدفع">
      <h2><Landmark size={18}/> أرقام البنوك وتطبيقات الدفع</h2>
      <p>الخطوط الساخنة لخدمة العملاء — اضغط على الرقم للاتصال، وكلها أرقام قصيرة تعمل من أي هاتف.</p>

      <div className="payments-controls">
        <div className="codes-search">
          <Search size={15} aria-hidden="true"/>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث باسم البنك أو الرقم…"
            aria-label="البحث في أرقام البنوك وتطبيقات الدفع"
            enterKeyHint="search"
          />
          {query && <button type="button" className="codes-search-clear" onClick={() => setQuery("")} aria-label="مسح البحث"><X size={14}/></button>}
        </div>
        <div className="payments-tabs" role="group" aria-label="نوع الجهة">
          <button type="button" className={group === "all" ? "is-active" : ""} onClick={() => setGroup("all")}>الكل</button>
          <button type="button" className={group === "app" ? "is-active" : ""} onClick={() => setGroup("app")}><CreditCard size={13}/> تطبيقات الدفع</button>
          <button type="button" className={group === "bank" ? "is-active" : ""} onClick={() => setGroup("bank")}><Building2 size={13}/> البنوك</button>
        </div>
      </div>

      <div className="payments-grid">
        {visible.map((service) => (
          <a key={service.id} className={`payment-card is-${service.group}`} href={paymentDialHref(service.number)}>
            <span className="payment-card-copy">
              <strong>{service.name}</strong>
              {service.note && <small>{service.note}</small>}
            </span>
            <b dir="ltr">{service.number}</b>
          </a>
        ))}
      </div>
      {visible.length === 0 && <p className="codes-empty">مفيش نتيجة مطابقة — جرّب اسم بنك مختصر زي «الأهلي» أو «CIB».</p>}
      <p className="codes-note">الأرقام الرسمية المتداولة لخدمة العملاء، وقد تُحدّثها البنوك — راجع موقع البنك لو الرقم ما ردّش.</p>
    </section>
  );
}
