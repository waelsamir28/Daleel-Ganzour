/**
 * هيكل فوري يظهر لحظة الضغط على أي قسم/تخصص (loading.tsx) بينما يحمّل الخادم البيانات،
 * فيشعر المستخدم أن الصفحة فتحت في الحال بدل شاشة ثابتة لثوانٍ.
 */
export default function PageSkeleton({ tiles = 8, hero = true }: { tiles?: number; hero?: boolean }) {
  return (
    <div className="page-skeleton" aria-busy="true" aria-live="polite" aria-label="جارٍ التحميل…">
      <div className="page-skeleton-header">
        <span className="page-skeleton-pill" style={{ width: 128 }}/>
        <span className="page-skeleton-pill" style={{ width: 44, height: 36 }}/>
      </div>
      {hero && (
        <div className="container">
          <div className="page-skeleton-hero">
            <span className="page-skeleton-line" style={{ width: "52%" }}/>
            <span className="page-skeleton-line" style={{ width: "34%" }}/>
            <span className="page-skeleton-search"/>
          </div>
        </div>
      )}
      <div className="container">
        <span className="page-skeleton-line page-skeleton-title"/>
        <div className="page-skeleton-grid">
          {Array.from({ length: tiles }, (_, index) => (
            <div key={index} className="page-skeleton-tile">
              <span className="page-skeleton-icon"/>
              <span className="page-skeleton-line" style={{ width: "70%" }}/>
              <span className="page-skeleton-line" style={{ width: "45%" }}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
