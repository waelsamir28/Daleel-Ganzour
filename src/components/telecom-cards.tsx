"use client";

import { useEffect, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowLeft, Clock, Smartphone } from "lucide-react";
import { Modal } from "@/components/ui";
import { TelecomLogo } from "@/components/telecom-logos";
import TelecomCodes from "@/components/telecom-codes";
import { telecomOperators, TELECOM_PAGE_PATH, type TelecomOperator } from "@/lib/telecom";

const LAST_OPERATOR_KEY = "janzour-telecom-last";

/**
 * صفّ أزرار شركات المحمول أسفل الكروت الثلاثة.
 * الزر يعرض شعار الشركة فقط واسمها أسفله، والضغط يفتح شاشة الأكواد الكاملة داخل نافذة.
 * يتذكّر آخر شركة فتحها الزائر ويعرضها كاختصار سريع في العنوان.
 */
export default function TelecomCards({ operators = telecomOperators, order }: { operators?: TelecomOperator[]; order?: number }) {
  const [activeId, setActiveId] = useState("");
  const [lastId, setLastId] = useState("");

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LAST_OPERATOR_KEY) || "";
      // eslint-disable-next-line react-hooks/set-state-in-effect -- قراءة تفضيل محفوظ بعد التركيب فقط (لا يوجد DOM على الخادم).
      if (stored) setLastId(stored);
    } catch {
      // التخزين المحلي قد يكون معطّلًا — الاختصار يبقى مخفيًا فقط.
    }
  }, []);

  function open(id: string) {
    setActiveId(id);
    setLastId(id);
    try { localStorage.setItem(LAST_OPERATOR_KEY, id); } catch { /* ignore */ }
  }

  const active = operators.find((operator) => operator.id === activeId) ?? null;
  const last = operators.find((operator) => operator.id === lastId) ?? null;

  return (
    <>
      <section className="telecom-section" aria-label="أرقام وأكواد شركات المحمول" style={order === undefined ? undefined : { order }}>
        <div className="telecom-section-head">
          <h2><Smartphone size={17} aria-hidden="true"/>أرقام وأكواد شركات المحمول</h2>
          <div className="telecom-head-side">
            {last && last.id !== activeId && (
              <button type="button" className="telecom-last-chip" onClick={() => open(last.id)}>
                <Clock size={12} aria-hidden="true"/>
                <span>آخر شركة: {last.name}</span>
              </button>
            )}
            <Link href={TELECOM_PAGE_PATH} className="telecom-all-link">
              كل الأكواد
              <ArrowLeft size={13} aria-hidden="true"/>
            </Link>
          </div>
        </div>
        <div className="telecom-cards-grid">
          {operators.map((operator) => (
            <button
              key={operator.id}
              type="button"
              className="category-tile feature-card-tile telecom-tile"
              style={{ "--category-color": operator.color, "--category-light": `${operator.color}14`, "--brand-deep": operator.colorDeep } as CSSProperties}
              onClick={() => open(operator.id)}
              aria-label={`أرقام وأكواد ${operator.name}`}
            >
              <span className="telecom-logo-wrap"><TelecomLogo id={operator.id} size={72}/></span>
              <strong className="telecom-name">{operator.name}</strong>
            </button>
          ))}
        </div>
      </section>

      {active && (
        <Modal
          floating
          wide
          className="modal-quiet-scroll"
          title={`أرقام وأكواد ${active.name}`}
          subtitle={`${active.latin} — ${active.summary}`}
          onClose={() => setActiveId("")}
        >
          <div className="telecom-modal">
            <div className="telecom-modal-brand" style={{ "--category-color": active.color, "--brand-deep": active.colorDeep } as CSSProperties}>
              <TelecomLogo id={active.id} size={58}/>
              <div className="telecom-modal-brand-copy">
                <strong>{active.name}</strong>
                <span>كل الأرقام والأكواد — تُطلب بضغطة أو تُنسخ، وتشتغل من صفحة الأكواد حتى بدون إنترنت.</span>
              </div>
            </div>
            <TelecomCodes key={active.id} operator={active}/>
          </div>
        </Modal>
      )}
    </>
  );
}
