# الجولة ٢١ — إلغاء «باقات الرعاية والتميز» نهائيًا من التطبيق

## اللي اتشال

### ١) زر «باقات الرعاية» في لوحة الإدارة
- الزر اللي كان في شريط اللوحة العلوي اتشال خالص.

### ٢) تبويب «باقات الرعاية والتميز»
- اتشال من قائمة تبويبات لوحة الإدارة (كان مخفي من القائمة لكن كان لسه بيُفتح من الزر).
- **الملفات المحذوفة:**
  - `src/components/admin-sponsors.tsx` (٦٣٩ سطر).
  - `src/components/sponsorship-modal.tsx` (٣١٣ سطر).

### ٣) كل إعدادات ودوال الرعاية من `src/lib/catalog.ts`
اتشالت نهائيًا:
- من نوع `DesignSettings`: `sponsorModalEnabled`، `sponsorModalDelaySeconds`، `sponsorModalTitle`، `sponsorModalSubtitle`، `sponsorModalOfferBanner`، `sponsorModalPhone`، `showSponsorsRibbon`، `sponsoredProvidersJson`، `showDailyOffersSection`.
- نوع `SponsoredProviderConfig` و`SponsorTrialStatus`.
- الدوال: `getSponsorTrialStatus`، `getSponsorOfferCategoryGroup`، `parseSponsoredProviders`، `defaultSponsoredProviders`، ونوع `DailyOfferFilterGroup`.
- تنظيف الإعدادات (`sanitizeDesignSettings`) بقى مش بيتعامل معاهم خالص.

> ملاحظة: أي قيم قديمة محفوظة في قاعدة البيانات لسه موجودة كصفوف، لكن التطبيق بقى **بيتجاهلها تمامًا** — مش بتظهر ولا بتتقرأ.

### ٤) تنسيقات CSS
- اتشال **~٣٢٠ سطر** من تنسيقات الرعاة: نافذة الباقات، شريط الرعاة، البرواز الذهبي، بطاقة VIP، زر الباقات في الرئيسية، وتنسيقات تبويب الإدارة.
- **صفر** إشارة لكلمة sponsor في `janzour.css` بعد التنظيف.

## الملفات

- `src/components/admin-panel.tsx` — إزالة التبويب والزر والاستيراد.
- `src/lib/catalog.ts` — إزالة كل أنواع/إعدادات/دوال الرعاية.
- `src/app/janzour.css` — إزالة كل تنسيقات الرعاية.
- `src/components/admin-sponsors.tsx` + `src/components/sponsorship-modal.tsx` — **محذوفين**.
- `scripts/catalog.test.mjs` + `scripts/round10.test.mjs` — تحديث الاختبارات (١٠٤ اختبار).

## الفحوصات

`npm run typecheck` ✅ · `npm run lint` ✅ · `npm test` 104/104 ✅ · `npm run build` ✅
