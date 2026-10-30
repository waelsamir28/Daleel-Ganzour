"use client";

/**
 * شعارات شركات المحمول داخل «بلاطة» بلون الشركة:
 *  - فودافون: علامة الاقتباس (Speech mark) الرسمية — مسار simple-icons (رخصة CC0).
 *  - أورنج / اتصالات (e&) / وي: كلمة الشركة (Wordmark) بخط ثقيل أبيض، وهي الشكل الرسمي لشعاراتهم.
 * الشعارات تُرسم بـ CSS/SVG حتى تبقى حادة على أي مقاس وبدون تحميل صور إضافية.
 */
const VODAFONE_MARK = "M12 0A12 12 0 0 0 0 12A12 12 0 0 0 12 24A12 12 0 0 0 24 12A12 12 0 0 0 12 0M16.25 1.12C16.57 1.12 16.9 1.15 17.11 1.22C14.94 1.67 13.21 3.69 13.22 6C13.22 6.05 13.22 6.11 13.23 6.17C16.87 7.06 18.5 9.25 18.5 12.28C18.54 15.31 16.14 18.64 12.09 18.65C8.82 18.66 5.41 15.86 5.39 11.37C5.38 8.4 7 5.54 9.04 3.85C11.04 2.19 13.77 1.13 16.25 1.12Z";

export function TelecomLogo({ id, size = 64, className = "" }: { id: string; size?: number; className?: string }) {
  // الحجم عبر متغيّر CSS فقط حتى تتمكن استعلامات الوسائط من تصغيره على الموبايل.
  const style = { "--logo-size": `${size}px` } as React.CSSProperties;
  if (id === "vodafone") {
    return (
      <span className={`telecom-logo is-vodafone ${className}`} style={style} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="currentColor" role="presentation"><path d={VODAFONE_MARK}/></svg>
      </span>
    );
  }
  if (id === "orange") {
    return <span className={`telecom-logo is-orange ${className}`} style={style} aria-hidden="true"><b className="telecom-wordmark">orange</b></span>;
  }
  if (id === "etisalat") {
    return <span className={`telecom-logo is-etisalat ${className}`} style={style} aria-hidden="true"><b className="telecom-wordmark">e&</b></span>;
  }
  return <span className={`telecom-logo is-we ${className}`} style={style} aria-hidden="true"><b className="telecom-wordmark">we</b></span>;
}
