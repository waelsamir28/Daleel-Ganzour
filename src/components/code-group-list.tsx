"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Clipboard, ClipboardCheck, CreditCard, Headphones, PhoneCall, Search, Siren, Smartphone, TrainFront, Wallet, Wifi, X } from "lucide-react";
import CodeReportButton from "@/components/code-report-button";
import { telecomDialHref, type TelecomGroup, type TelecomGroupIcon } from "@/lib/telecom";

const GROUP_ICONS: Record<TelecomGroupIcon, typeof PhoneCall> = {
  support: Headphones,
  wallet: Wallet,
  wifi: Wifi,
  card: CreditCard,
  sim: Smartphone,
  phone: PhoneCall,
  siren: Siren,
  train: TrainFront,
};

type Props = {
  groups: TelecomGroup[];
  /** لون الشركة/القسم الذي تُلوَّن به البطاقات. */
  accent: string;
  accentDeep: string;
  /** نطاق البلاغات: landline / gov / … */
  scope: string;
  title: string;
  intro: string;
  icon: "siren" | "phone" | "support" | "card";
  searchPlaceholder: string;
  note?: string;
  emptyText: string;
  /** نص عائم اختياري يظهر أعلى البطاقات (مثل رقم موحّد لكل الخدمات). */
  highlight?: string;
};

/**
 * قائمة أكواد/أرقام على شكل مجموعات (تبويبات + بحث + بطاقات كبيرة للكود).
 * تُستخدم لأرقام الخط الأرضي والأرقام الحكومية بنفس شكل شاشة أكواد المحمول.
 */
export default function CodeGroupList({ groups, accent, accentDeep, scope, title, intro, icon, searchPlaceholder, note, emptyText, highlight }: Props) {
  const [groupIndex, setGroupIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const SectionIcon = GROUP_ICONS[icon];
  const trimmed = query.trim();

  const results = useMemo(() => {
    if (!trimmed) return null;
    const needle = trimmed.toLowerCase();
    return groups
      .map((group) => ({ group, rows: group.rows.filter((row) => `${row.label} ${row.code}`.toLowerCase().includes(needle)) }))
      .filter((entry) => entry.rows.length > 0);
  }, [groups, trimmed]);

  const activeIndex = Math.min(Math.max(groupIndex, 0), groups.length - 1);
  const activeGroup = groups[activeIndex];
  const total = groups.reduce((sum, group) => sum + group.rows.length, 0);

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? "" : current)), 1600);
    } catch { /* قد يمنع المتصفح الحافظة — الكود ظاهر للنسخ اليدوي */ }
  }

  function Card({ groupTitle, row }: { groupTitle: string; row: TelecomGroup["rows"][number] }) {
    const key = `${scope}-${groupTitle}-${row.label}`;
    return (
      <article className="code-card" style={{ "--category-color": accent, "--brand-deep": accentDeep } as CSSProperties}>
        <div className="code-card-head">
          <span className="code-card-label">{row.label}</span>
          {row.note && <small className="code-card-note">{row.note}</small>}
        </div>
        <div className="code-card-actions">
          <a className="code-key" dir="ltr" href={telecomDialHref(row)} aria-label={`طلب ${row.code} — ${row.label}`}>
            <span>{row.code}</span>
            <PhoneCall size={13} aria-hidden="true"/>
          </a>
          <button
            type="button"
            className={`code-copy ${copied === key ? "is-copied" : ""}`}
            onClick={() => void copy(key, row.code)}
            aria-label={`نسخ ${row.code}`}
            title={copied === key ? "تم نسخ الكود" : "نسخ الكود"}
          >
            {copied === key ? <ClipboardCheck size={16}/> : <Clipboard size={16}/>}
          </button>
        </div>
        <CodeReportButton scope={scope} code={row.code} label={row.label}/>
      </article>
    );
  }

  return (
    <section className="payments-section number-section" style={{ "--category-color": accent, "--brand-deep": accentDeep } as CSSProperties} aria-label={title}>
      <h2><SectionIcon size={18}/> {title}</h2>
      <p>{intro}</p>
      {highlight && <p className="number-section-highlight"><PhoneCall size={13}/> {highlight}</p>}

      <div className="payments-controls">
        <div className="codes-search">
          <Search size={15} aria-hidden="true"/>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchPlaceholder}
            enterKeyHint="search"
          />
          {query && <button type="button" className="codes-search-clear" onClick={() => setQuery("")} aria-label="مسح البحث"><X size={14}/></button>}
        </div>
      </div>

      {!results && (
        <>
          <div className="codes-tabs" role="tablist" aria-label="مجموعات الأرقام">
            {groups.map((group, index) => {
              const GroupIcon = GROUP_ICONS[group.icon] ?? PhoneCall;
              return (
                <button
                  key={group.title}
                  type="button"
                  role="tab"
                  aria-selected={index === activeIndex}
                  className={`codes-tab ${index === activeIndex ? "is-active" : ""}`}
                  onClick={() => setGroupIndex(index)}
                >
                  <GroupIcon size={14} aria-hidden="true"/>
                  <span>{group.tab}</span>
                  <em>{group.rows.length}</em>
                </button>
              );
            })}
          </div>
          <div className="codes-grid">
            {activeGroup?.rows.map((row) => <Card key={row.label} groupTitle={activeGroup.title} row={row}/>)}
          </div>
        </>
      )}

      {results && (
        <div className="codes-results">
          {results.length === 0 && <p className="codes-empty">{emptyText}</p>}
          {results.map(({ group, rows }) => (
            <section key={group.title} className="codes-result-group">
              <h4>{group.title}</h4>
              <div className="codes-grid">{rows.map((row) => <Card key={row.label} groupTitle={group.title} row={row}/>)}</div>
            </section>
          ))}
        </div>
      )}

      <p className="codes-note">{note ?? `${total} رقم وكود — لو رقم منهم اتغيّر دوس «الكود ده اتغيّر؟» وهيتبعت للإدارة فورًا.`}</p>
    </section>
  );
}
