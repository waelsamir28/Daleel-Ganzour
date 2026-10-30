"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import {
  ClipboardCheck, Copy, CreditCard, Grid2X2, Headphones, MessageCircle, PhoneCall, QrCode,
  Search, Smartphone, Sparkles, Wallet, Wifi, X,
} from "lucide-react";
import QrSvg from "@/components/qr-svg";
import CodeReportButton from "@/components/code-report-button";
import {
  buildReadyCode, telecomDialHref, telecomShareText,
  type TelecomGroup, type TelecomGroupIcon, type TelecomReadyAction, type TelecomRow,
} from "@/lib/telecom";
import type { TelecomScreen as Screen } from "@/lib/telecom-screens";

const GROUP_ICONS: Record<TelecomGroupIcon, typeof PhoneCall> = {
  support: Headphones,
  wallet: Wallet,
  wifi: Wifi,
  card: CreditCard,
  sim: Smartphone,
  phone: PhoneCall,
  siren: Headphones,
  train: PhoneCall,
};

/** ألوان أزرار الأقسام: كل مربّع بلون مختلف حتى يميّزها العميل بسرعة. */
const GROUP_COLORS = [
  { from: "#1d6fdc", to: "#0b3f8f" },
  { from: "#0f9d58", to: "#0a6b3c" },
  { from: "#e88a16", to: "#b25c05" },
  { from: "#7c3aed", to: "#4f1fa0" },
  { from: "#0e8f95", to: "#08666b" },
  { from: "#d94a4a", to: "#992020" },
];

type Props = {
  screen: Screen;
  /** رابط الصفحة الكامل (يُستخدم في QR والمشاركة). */
  link?: string;
  siteName?: string;
};

/**
 * شاشة واحدة (شركة محمول / خط أرضي / بنوك):
 * عنوان على سطرين بلون الشاشة + وصف، ثم أزرار الأقسام كمربّعات ملوّنة في صفين،
 * وزر بارز «كل الأكواد»، وبطاقات أكواد مربّعة، وأكواد جاهزة برقم الزائر.
 */
export default function TelecomScreenView({ screen, link = "", siteName = "دليل جنزور" }: Props) {
  const [selected, setSelected] = useState(0);
  const [showAll, setShowAll] = useState(false);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [actionId, setActionId] = useState<TelecomReadyAction["id"] | "">(screen.ready[0]?.id ?? "");

  const total = screen.groups.reduce((sum, group) => sum + group.rows.length, 0);
  const activeGroup = screen.groups[Math.min(selected, screen.groups.length - 1)];
  const action = screen.ready.find((item) => item.id === actionId) ?? screen.ready[0];
  const readyCode = action ? buildReadyCode(action, number, amount) : "";
  const cleanNumber = number.replace(/\D/g, "");
  const numberHint = !cleanNumber ? "" : cleanNumber.length === 11 && cleanNumber.startsWith("01") ? "رقم صحيح ✓" : "الرقم لازم 11 رقم ويبدأ بـ 01";
  const trimmed = query.trim();

  const results = useMemo(() => {
    if (!trimmed) return null;
    const needle = trimmed.toLowerCase();
    return screen.groups
      .map((group) => ({ group, rows: group.rows.filter((row) => `${row.label} ${row.code}`.toLowerCase().includes(needle)) }))
      .filter((entry) => entry.rows.length > 0);
  }, [screen.groups, trimmed]);

  const style = { "--screen-color": screen.color, "--screen-deep": screen.colorDeep } as CSSProperties;

  const copy = useCallback(async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? "" : current)), 1600);
    } catch { /* قد يمنع المتصفح الحافظة — الكود ظاهر للنسخ اليدوي */ }
  }, []);

  const cardProps = { screenId: screen.id, scope: screen.scope, copied, onCopy: copy };

  return (
    <div className="telecom-screen-body" style={style}>
      <header className="telecom-screen-head">
        <h2 className="telecom-screen-title">
          <span>{screen.title[0]}</span>
          <span>{screen.title[1]}</span>
        </h2>
        <p className="telecom-screen-summary">{screen.summary}</p>
        <p className="telecom-screen-help">{screen.help}</p>
      </header>

      <div className="codes-search">
        <Search size={15} aria-hidden="true"/>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`ابحث في ${total} كودًا… مثال: رصيد، شحن، كاش`}
          aria-label={`البحث في أكواد ${screen.name}`}
          enterKeyHint="search"
        />
        {query && <button type="button" className="codes-search-clear" onClick={() => setQuery("")} aria-label="مسح البحث"><X size={14}/></button>}
      </div>

      {!results && (
        <>
          <button
            type="button"
            className={`all-codes-btn ${showAll ? "is-open" : ""}`}
            onClick={() => setShowAll((value) => !value)}
            aria-pressed={showAll}
          >
            <span className="all-codes-icon"><Grid2X2 size={20}/></span>
            <span className="all-codes-copy">
              <strong>{showAll ? "رجوع لأقسام الأكواد" : `كل أكواد ${screen.name}`}</strong>
              <small>{showAll ? "اعرض الأقسام تاني من المربعات" : `${total} كودًا في صفحة واحدة — من غير ما تدوّر`}</small>
            </span>
          </button>

          {!showAll && (
            <div className="group-tiles" role="tablist" aria-label={`أقسام أكواد ${screen.name}`}>
              {screen.groups.map((group, index) => {
                const GroupIcon = GROUP_ICONS[group.icon] ?? PhoneCall;
                const palette = GROUP_COLORS[index % GROUP_COLORS.length];
                return (
                  <button
                    key={group.title}
                    type="button"
                    role="tab"
                    aria-selected={index === Math.min(selected, screen.groups.length - 1)}
                    className={`group-tile ${index === Math.min(selected, screen.groups.length - 1) ? "is-active" : ""}`}
                    style={{ "--tile-from": palette.from, "--tile-to": palette.to } as CSSProperties}
                    onClick={() => setSelected(index)}
                  >
                    <span className="group-tile-icon"><GroupIcon size={24} aria-hidden="true"/></span>
                    <strong className="group-tile-name">{group.tab}</strong>
                    <small className="group-tile-count">{group.rows.length} كود</small>
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {results && (
        <div className="codes-results">
          {results.length === 0 && <p className="codes-empty">مفيش كود مطابق لـ «{trimmed}» — جرّب كلمة أقصر زي «رصيد» أو «شحن».</p>}
          {results.map(({ group, rows }) => (
            <section key={group.title} className="codes-result-group">
              <h4>{group.title}</h4>
              <CodeGrid group={{ ...group, rows }} {...cardProps}/>
            </section>
          ))}
        </div>
      )}

      {!results && !showAll && activeGroup && <CodeGrid group={activeGroup} {...cardProps}/>}

      {!results && showAll && (
        <div className="codes-results">
          {screen.groups.map((group) => (
            <section key={group.title} className="codes-result-group">
              <h4>{group.title} <em>{group.rows.length}</em></h4>
              <CodeGrid group={group} {...cardProps}/>
            </section>
          ))}
        </div>
      )}

      {action && (
        <section className="ready-panel">
          <header className="ready-panel-head">
            <span className="ready-panel-icon"><Sparkles size={17} aria-hidden="true"/></span>
            <div>
              <h4>أكواد جاهزة برقمك</h4>
              <p>بدل ما تحفظ الكود، اكتب رقم اللي هتحوّل له — إحنا نجهّز لك الكود كامل وتنسخه أو تطلبه بضغطة.</p>
            </div>
          </header>

          <div className="ready-choices" role="group" aria-label="اختار الخدمة">
            {screen.ready.map((item) => (
              <button
                key={item.id}
                type="button"
                className={item.id === action.id ? "is-active" : ""}
                aria-pressed={item.id === action.id}
                onClick={() => setActionId(item.id)}
              >
                {item.label}
              </button>
            ))}
          </div>

          <div className="ready-fields">
            <label className="ready-field">
              <span className="ready-step">1</span>
              <span className="ready-field-label">رقم المستلم</span>
              <input inputMode="numeric" dir="ltr" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="01xxxxxxxxx" maxLength={14}/>
              {numberHint && <small className={cleanNumber.length === 11 && cleanNumber.startsWith("01") ? "is-ok" : "is-warn"}>{numberHint}</small>}
            </label>
            {action.needsAmount && (
              <label className="ready-field">
                <span className="ready-step">2</span>
                <span className="ready-field-label">المبلغ (جنيه)</span>
                <input inputMode="numeric" dir="ltr" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="10" maxLength={6}/>
              </label>
            )}
          </div>

          <div className={`ready-result ${readyCode ? "is-ready" : ""}`}>
            <span className="ready-result-label">الكود الجاهز</span>
            <b dir="ltr">{readyCode || "اكتب الرقم الأول"}</b>
            <span className="ready-result-actions">
              <a
                className={`button button-primary button-small ${readyCode ? "" : "is-disabled"}`}
                href={readyCode ? `tel:${encodeURIComponent(readyCode)}` : undefined}
                aria-disabled={!readyCode}
                onClick={(event) => { if (!readyCode) event.preventDefault(); }}
              >
                <PhoneCall size={14}/> طلب الكود
              </a>
              <button type="button" className="button button-soft button-small" disabled={!readyCode} onClick={() => void copy("ready", readyCode)}>
                {copied === "ready" ? <ClipboardCheck size={14}/> : <Copy size={14}/>} {copied === "ready" ? "تم النسخ" : "نسخ"}
              </button>
            </span>
          </div>
          <p className="ready-hint">{action.note ?? "الكود بيتكوّن من رقم المستلم والمبلغ — اضغط «طلب الكود» وهيتنفّذ زي أي مكالمة عادية."}</p>
        </section>
      )}

      <div className="codes-footer-actions">
        <a
          className="button button-whatsapp button-small"
          href={`https://wa.me/?text=${encodeURIComponent(telecomShareText(screen.operator ?? fakeOperator(screen), link))}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={15}/> ابعتها على واتساب
        </a>
        <button type="button" className="button button-soft button-small" onClick={() => setShowQr((value) => !value)} aria-expanded={showQr}>
          <QrCode size={15}/> {showQr ? "إخفاء QR" : "QR للأكواد"}
        </button>
        <p className="codes-note">الأكواد ممكن تتغير من الشركة — لو كود ما اشتغلش دوس «الكود ده اتغيّر؟» وهيتبعت للإدارة.</p>
      </div>

      {showQr && (
        <div className="codes-qr">
          <QrSvg value={link || `/telecom#${screen.id}`} size={132} label={`رمز QR لصفحة أكواد ${screen.name}`} dark={screen.colorDeep}/>
          <div>
            <strong>امسح الكود بكاميرا أي موبايل</strong>
            <span>يفتح صفحة {screen.name} مباشرة — تقدر تطبعها كلافتة أو ستيكر عند مكتب الجمال ({siteName}).</span>
          </div>
        </div>
      )}
    </div>
  );
}


type CardProps = { screenId: string; scope: string; copied: string; onCopy: (key: string, value: string) => void };

/** بطاقة كود مربّعة: الكود كبير في النص، وتحته نسخ وبلاغ. */
function CodeCard({ row, groupTitle, screenId, scope, copied, onCopy }: CardProps & { row: TelecomRow; groupTitle: string }) {
  const key = `${screenId}-${groupTitle}-${row.label}`;
  return (
    <article className="code-square">
      <div className="code-square-head">
        <span className="code-square-label">{row.label}</span>
        {row.note && <small className="code-square-note">{row.note}</small>}
      </div>
      <a className="code-square-key" dir="ltr" href={telecomDialHref(row)} aria-label={`طلب ${row.code} — ${row.label}`}>
        <PhoneCall size={14} aria-hidden="true"/>
        <span>{row.code}</span>
      </a>
      <div className="code-square-tools">
        <button
          type="button"
          className={`code-square-copy ${copied === key ? "is-copied" : ""}`}
          onClick={() => onCopy(key, row.code)}
          aria-label={`نسخ ${row.code}`}
        >
          {copied === key ? <ClipboardCheck size={14}/> : <Copy size={14}/>}
          <span>{copied === key ? "تم النسخ" : "نسخ"}</span>
        </button>
      </div>
      <CodeReportButton scope={scope} code={row.code} label={row.label}/>
    </article>
  );
}

function CodeGrid({ group, ...rest }: CardProps & { group: TelecomGroup }) {
  return (
    <div className="codes-grid">
      {group.rows.map((row) => <CodeCard key={row.label} groupTitle={group.title} row={row} {...rest}/>)}
    </div>
  );
}

/** يبني كائنًا بشكل TelecomOperator لنصوص المشاركة للأقسام اللي مش شركة محمول. */
function fakeOperator(screen: Screen) {
  return {
    id: screen.operator?.id ?? "we",
    name: screen.name,
    latin: screen.latin,
    color: screen.color,
    colorDeep: screen.colorDeep,
    summary: screen.summary,
    ready: screen.ready,
    quick: [],
    groups: screen.groups,
  };
}
