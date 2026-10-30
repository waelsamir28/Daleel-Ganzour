"use client";

import { useMemo, useState, type CSSProperties } from "react";
import { Clipboard, ClipboardCheck, Copy, Headphones, MessageCircle, PhoneCall, QrCode, Search, Sparkles, Wallet, Wifi, CreditCard, Smartphone, X } from "lucide-react";
import QrSvg from "@/components/qr-svg";
import { buildReadyCode, telecomDialHref, telecomPageUrl, telecomShareText, type TelecomGroupIcon, type TelecomOperator, type TelecomRow } from "@/lib/telecom";

const GROUP_ICONS: Record<TelecomGroupIcon, typeof PhoneCall> = {
  support: Headphones,
  wallet: Wallet,
  wifi: Wifi,
  card: CreditCard,
  sim: Smartphone,
  phone: PhoneCall,
};

type Props = {
  operator: TelecomOperator;
  /** رابط الصفحة الكاملة (يُستخدم في QR والمشاركة). */
  link?: string;
  /** اسم الموقع يظهر في رسالة المشاركة. */
  siteName?: string;
};

/**
 * شاشة أرقام وأكواد الشركة — ستايل «بطاقات أكواد»:
 * تبويبات للمجموعات + بحث + بطاقات كبيرة للكود، مع أزرار طلب/نسخ،
 * و«أكواد جاهزة برقمك» لتوليد كود التحويل أو كلمني، ومشاركة على واتساب وQR للصفحة.
 */
export default function TelecomCodes({ operator, link = "", siteName = "دليل جنزور" }: Props) {
  const [groupIndex, setGroupIndex] = useState(0);
  const [query, setQuery] = useState("");
  const [copied, setCopied] = useState("");
  const [showQr, setShowQr] = useState(false);
  const [number, setNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [actionId, setActionId] = useState(operator.ready[0]?.id ?? "transfer");

  const action = operator.ready.find((item) => item.id === actionId) ?? operator.ready[0];
  const readyCode = action ? buildReadyCode(action, number, amount) : "";
  const trimmed = query.trim();
  const results = useMemo(() => {
    if (!trimmed) return null;
    const needle = trimmed.toLowerCase();
    return operator.groups
      .map((group) => ({ group, rows: group.rows.filter((row) => `${row.label} ${row.code}`.toLowerCase().includes(needle)) }))
      .filter((entry) => entry.rows.length > 0);
  }, [operator.groups, trimmed]);

  const activeGroup = operator.groups[Math.min(groupIndex, operator.groups.length - 1)];
  const totalCodes = operator.groups.reduce((sum, group) => sum + group.rows.length, 0);

  async function copy(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(key);
      window.setTimeout(() => setCopied((current) => (current === key ? "" : current)), 1600);
    } catch {
      // قد يمنع المتصفح الحافظة — يظل الكود ظاهرًا للنسخ اليدوي.
    }
  }

  function CodeCard({ row, groupTitle }: { row: TelecomRow; groupTitle: string }) {
    const key = `${operator.id}-${groupTitle}-${row.label}`;
    return (
      <article className="code-card" style={{ "--category-color": operator.color, "--brand-deep": operator.colorDeep } as CSSProperties}>
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
      </article>
    );
  }

  return (
    <div className="telecom-codes" style={{ "--category-color": operator.color, "--brand-deep": operator.colorDeep } as CSSProperties}>
      <div className="codes-search">
        <Search size={15} aria-hidden="true"/>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={`ابحث في ${totalCodes} كودًا… مثال: رصيد، شحن، كاش`}
          aria-label={`البحث في أكواد ${operator.name}`}
          enterKeyHint="search"
        />
        {query && <button type="button" className="codes-search-clear" onClick={() => setQuery("")} aria-label="مسح البحث"><X size={14}/></button>}
      </div>

      {!results && (
        <>
          <div className="codes-tabs" role="tablist" aria-label="مجموعات الأكواد">
            {operator.groups.map((group, index) => {
              const GroupIcon = GROUP_ICONS[group.icon] ?? PhoneCall;
              return (
                <button
                  key={group.title}
                  type="button"
                  role="tab"
                  aria-selected={index === activeGroupIndex(operator.groups, groupIndex)}
                  className={`codes-tab ${index === activeGroupIndex(operator.groups, groupIndex) ? "is-active" : ""}`}
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
            {activeGroup?.rows.map((row) => <CodeCard key={row.label} row={row} groupTitle={activeGroup.title}/>)}
          </div>
        </>
      )}

      {results && (
        <div className="codes-results">
          {results.length === 0 && <p className="codes-empty">مفيش كود مطابق لـ «{trimmed}» — جرّب كلمة أقصر زي «رصيد» أو «شحن».</p>}
          {results.map(({ group, rows }) => (
            <section key={group.title} className="codes-result-group">
              <h4>{group.title}</h4>
              <div className="codes-grid">{rows.map((row) => <CodeCard key={row.label} row={row} groupTitle={group.title}/>)}</div>
            </section>
          ))}
        </div>
      )}

      {action && (
        <section className="codes-ready">
          <header>
            <span className="codes-ready-icon"><Sparkles size={15} aria-hidden="true"/></span>
            <div>
              <h4>أكواد جاهزة برقمك</h4>
              <p>اكتب رقم المستلم — نجهّز لك الكود كامل وتنسخه أو تطلبه بضغطة.</p>
            </div>
          </header>
          <div className="codes-ready-fields">
            <label className="field">
              رقم المستلم
              <input inputMode="numeric" dir="ltr" value={number} onChange={(event) => setNumber(event.target.value)} placeholder="01xxxxxxxxx" maxLength={14}/>
            </label>
            {action.needsAmount && (
              <label className="field">
                المبلغ (جنيه)
                <input inputMode="numeric" dir="ltr" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="10" maxLength={6}/>
              </label>
            )}
            <label className="field">
              الخدمة
              <select value={action.id} onChange={(event) => setActionId(event.target.value as typeof actionId)}>
                {operator.ready.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}
              </select>
            </label>
          </div>
          {action.note && <p className="codes-ready-hint">{action.note}</p>}
          <div className="codes-ready-result">
            <b dir="ltr">{readyCode || "اكتب الرقم أولًا"}</b>
            <span className="codes-ready-actions">
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
        </section>
      )}

      <div className="codes-footer-actions">
        <a
          className="button button-whatsapp button-small"
          href={`https://wa.me/?text=${encodeURIComponent(telecomShareText(operator, link))}`}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle size={15}/> ابعتها على واتساب
        </a>
        <button type="button" className="button button-soft button-small" onClick={() => setShowQr((value) => !value)} aria-expanded={showQr}>
          <QrCode size={15}/> {showQr ? "إخفاء QR" : "QR للأكواد"}
        </button>
        <p className="codes-note">الأكواد ممكن تتغير من الشركة — لو كود ما اشتغلش اتصل بخدمة العملاء.</p>
      </div>

      {showQr && (
        <div className="codes-qr">
          <QrSvg value={link || telecomPageUrl(operator.id)} size={132} label={`رمز QR لصفحة أكواد ${operator.name}`} dark={operator.colorDeep}/>
          <div>
            <strong>امسح الكود بكاميرا أي موبايل</strong>
            <span>يفتح صفحة أكواد {operator.name} مباشرة — تقدر تطبعها كلافتة أو ستيكر عند مكتب الجمال ({siteName}).</span>
          </div>
        </div>
      )}
    </div>
  );
}

function activeGroupIndex(groups: { title: string }[], index: number) {
  return Math.min(Math.max(index, 0), groups.length - 1);
}
