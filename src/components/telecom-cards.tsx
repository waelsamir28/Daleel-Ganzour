"use client";

import { useState, type CSSProperties } from "react";
import { Clipboard, ClipboardCheck, CreditCard, Headphones, PhoneCall, Wallet, Wifi, Smartphone } from "lucide-react";
import { Modal } from "@/components/ui";
import { TelecomLogo } from "@/components/telecom-logos";
import { telecomDialHref, telecomOperators, type TelecomGroupIcon, type TelecomOperator, type TelecomRow } from "@/lib/telecom";

const GROUP_ICONS: Record<TelecomGroupIcon, typeof PhoneCall> = {
  support: Headphones,
  wallet: Wallet,
  wifi: Wifi,
  card: CreditCard,
  sim: Smartphone,
  phone: PhoneCall,
};

/**
 * صفّ أزرار شركات المحمول (فودافون / أورنج / اتصالات / وي) أسفل الكروت الثلاثة،
 * بنفس ارتفاع وستايل الكروت فوقها، وكل شركة لها نافذتها المستقلة بكل الأرقام والأكواد.
 */
export default function TelecomCards({ operators = telecomOperators, order }: { operators?: TelecomOperator[]; order?: number }) {
  const [activeId, setActiveId] = useState("");
  const [copied, setCopied] = useState("");
  const active = operators.find((operator) => operator.id === activeId) ?? null;

  async function copyCode(key: string, code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(key);
      window.setTimeout(() => setCopied(""), 1600);
    } catch {
      // قد يمنع المتصفح الوصول إلى الحافظة — المستخدم يظل قادرًا على طلب الكود أو نسخه يدويًا.
    }
  }

  return (
    <>
      <section className="telecom-section" aria-label="أرقام وأكواد شركات المحمول" style={order === undefined ? undefined : { order }}>
        <div className="telecom-section-head">
          <h2><Smartphone size={17} aria-hidden="true"/>أرقام وأكواد شركات المحمول</h2>
          <p>اضغط على أي شركة لعرض كل أرقامها وأكوادها</p>
        </div>
        <div className="telecom-cards-grid">
          {operators.map((operator) => (
            <button
              key={operator.id}
              type="button"
              className="category-tile feature-card-tile telecom-tile"
              style={{ "--category-color": operator.color, "--category-light": `${operator.color}14`, "--brand-deep": operator.colorDeep } as CSSProperties}
              onClick={() => setActiveId(operator.id)}
              aria-label={`أرقام وأكواد ${operator.name}`}
            >
              <span className="telecom-logo-wrap"><TelecomLogo id={operator.id} size={64}/></span>
              <strong className="feature-card-title telecom-title">
                <span>{operator.name}</span>
              </strong>
              <span className="telecom-quick">
                {operator.quick.map((item) => (
                  <span key={item.label} className="telecom-quick-row">
                    <small>{item.label}</small>
                    <b dir="ltr">{item.row.code}</b>
                  </span>
                ))}
              </span>
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
          subtitle={`${active.latin} — كل الأرقام والأكواد المختصرة في مكان واحد`}
          onClose={() => setActiveId("")}
        >
          <div className="telecom-modal" style={{ "--category-color": active.color, "--brand-deep": active.colorDeep } as CSSProperties}>
            <div className="telecom-modal-brand">
              <TelecomLogo id={active.id} size={58}/>
              <div className="telecom-modal-brand-copy">
                <strong>{active.name}</strong>
                <span>{active.summary}</span>
              </div>
            </div>

            {active.groups.map((group) => {
              const GroupIcon = GROUP_ICONS[group.icon] ?? PhoneCall;
              return (
                <section key={group.title} className="telecom-group">
                  <h3><span className="telecom-group-icon"><GroupIcon size={15} aria-hidden="true"/></span>{group.title}</h3>
                  <ul>
                    {group.rows.map((row, index) => {
                      const key = `${active.id}-${group.title}-${index}`;
                      return (
                        <li key={key} className={`telecom-row is-${row.kind}`}>
                          <span className="telecom-row-label">
                            <span>{row.label}</span>
                            {row.note && <small>{row.note}</small>}
                          </span>
                          <span className="telecom-row-actions">
                            <a className="telecom-code" dir="ltr" href={telecomDialHref(row)} aria-label={`طلب ${row.code} — ${row.label}`}>
                              {row.code}
                            </a>
                            <button
                              type="button"
                              className={`telecom-copy ${copied === key ? "is-copied" : ""}`}
                              onClick={() => void copyCode(key, row.code)}
                              aria-label={`نسخ ${row.code}`}
                              title={copied === key ? "تم نسخ الكود" : "نسخ الكود"}
                            >
                              {copied === key ? <ClipboardCheck size={15}/> : <Clipboard size={15}/>}
                            </button>
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </section>
              );
            })}

            <p className="telecom-note">
              <PhoneCall size={14} aria-hidden="true"/>
              اضغط على أي رقم أو كود لطلبه مباشرة من هاتفك. الأكواد قد تُحدّثها الشركة من وقت لآخر — لو لم يعمل كود، اتصل بخدمة العملاء.
            </p>
          </div>
        </Modal>
      )}
    </>
  );
}

export type { TelecomRow };
