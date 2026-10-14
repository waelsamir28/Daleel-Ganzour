"use client";

import Link from "next/link";
import { ArrowDownToLine, CirclePlus, Heart, MessageCircle, PhoneCall, Search, ShieldCheck, Smartphone, Star, UsersRound, X } from "lucide-react";
import { Modal } from "@/components/ui";
import { openInstallAppModal } from "@/components/install-app-modal";

type AppInfoModalProps = {
  siteName: string;
  logoUrl?: string;
  memberCount?: number;
  onClose: () => void;
  onAddService?: () => void;
};

const STEPS = [
  { icon: Search, color: "is-blue", title: "ابحث عن اللي محتاجه", text: "اختر القسم (حرفيين – عيادات – محلات – مدرسين..) أو اكتب اسم المهنة في البحث." },
  { icon: PhoneCall, color: "is-green", title: "اتصل أو ابعت واتساب", text: "افتح صفحة مقدم الخدمة وهتلاقي زرار اتصال وواتساب مباشر مع العنوان والتقييمات." },
  { icon: Star, color: "is-amber", title: "قيّم تجربتك", text: "بعد ما تجرب الخدمة سيب تقييمك عشان تساعد باقي أهل القرية يختاروا صح." },
  { icon: CirclePlus, color: "is-purple", title: "أضف مهنتك مجاناً", text: "صاحب مهنة أو محل؟ اضغط «أضف مهنتك»، املأ بياناتك، والإدارة تراجعها وتنشرها." },
];

const FEATURES = [
  { icon: Heart, text: "مفضلة لحفظ المهنيين اللي بتتعامل معاهم" },
  { icon: ShieldCheck, text: "كل مقدم خدمة يُراجَع قبل النشر" },
  { icon: Smartphone, text: "يعمل على أندرويد وآيفون بدون متجر تطبيقات" },
  { icon: MessageCircle, text: "واتساب واتصال مباشر من صفحة كل مهني" },
];

export default function AppInfoModal({ siteName, logoUrl, memberCount, onClose, onAddService }: AppInfoModalProps) {
  return (
    <Modal floating title="عن تطبيق دليل جنزور" subtitle="شرح مبسط لطريقة استخدام التطبيق" onClose={onClose}>
      <div className="app-info">
        <div className="app-info-hero">
          <span className="app-info-logo">
            {/* eslint-disable-next-line @next/next/no-img-element -- Admin-configurable logo */}
            <img src={logoUrl || "/app-icon.png"} alt={siteName} width={92} height={92}/>
          </span>
          <h3>{siteName}</h3>
          <p>دليل رقمي مجاني يجمع كل مهنيي وخدمات ومحلات قرية جنزور في مكان واحد.. من أهل القرية لأهل القرية.</p>
          {typeof memberCount === "number" && memberCount > 0 && (
            <span className="app-info-members"><UsersRound size={14}/> {memberCount} عضو انضموا للدليل</span>
          )}
        </div>

        <h4 className="app-info-section-title">إزاي تستخدم التطبيق؟</h4>
        <ol className="app-info-steps">
          {STEPS.map((step, index) => (
            <li key={step.title} className="app-info-step">
              <span className={`app-info-step-icon ${step.color}`}><step.icon size={20}/></span>
              <div>
                <strong><span className="app-info-step-num">{index + 1}</span>{step.title}</strong>
                <p>{step.text}</p>
              </div>
            </li>
          ))}
        </ol>

        <h4 className="app-info-section-title">مميزات التطبيق</h4>
        <ul className="app-info-features">
          {FEATURES.map((feature) => (
            <li key={feature.text}><feature.icon size={15}/><span>{feature.text}</span></li>
          ))}
        </ul>

        <div className="app-info-actions">
          <button type="button" className="app-info-btn is-primary" onClick={() => { onClose(); if (onAddService) onAddService(); }}>
            <CirclePlus size={18}/><span>أضف مهنتك الآن</span>
          </button>
          <button type="button" className="app-info-btn is-soft" onClick={() => { onClose(); openInstallAppModal(); }}>
            <ArrowDownToLine size={18}/><span>تثبيت التطبيق</span>
          </button>
        </div>
        <p className="app-info-footer">
          بإدارة <strong>مكتب الجمال للدعاية والإعلان</strong> — للاستفسار أو الإبلاغ عن بيانات خاطئة تواصل معنا من <Link href="/#contact" onClick={onClose}>صفحة التواصل</Link>.
        </p>
        <button type="button" className="button button-soft app-info-close" onClick={onClose}><X size={16}/> إغلاق</button>
      </div>
    </Modal>
  );
}
