"use client";

import { useEffect } from "react";
import { defaultDesignSettings, designThemePresets, type DesignSettings, readableTextOn, shadeHex } from "@/lib/catalog";

export function applyDesignSettingsToDocument(design: DesignSettings = defaultDesignSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  const presetEntry = design.themePreset !== "custom" ? designThemePresets[design.themePreset] : undefined;
  const headingGradient =
    presetEntry?.gradientPreview ??
    `linear-gradient(135deg, ${design.darkPageBgColor || "#112b5a"} 0%, ${design.primaryColor || "#095de2"} 52%, ${design.darkPrimaryColor || "#50b4ff"} 100%)`;

  root.style.setProperty("--design-primary", design.primaryColor);
  root.style.setProperty("--design-heading-gradient", headingGradient);
  root.style.setProperty("--design-page-bg", design.pageBgColor);
  root.style.setProperty("--design-modal-header-bg", design.modalHeaderBg);
  root.style.setProperty("--design-button-color", design.buttonColor);
  root.style.setProperty("--design-border-color", design.borderColor);
  root.style.setProperty("--design-card-bg", design.cardBgColor);
  root.style.setProperty("--design-header-bg", design.headerBgColor);
  root.style.setProperty("--design-footer-bg", design.footerBgColor);
  root.style.setProperty("--design-auth-border", design.authInputBorderColor);
  root.style.setProperty("--design-announcement-bg", design.announcementBgColor);
  root.style.setProperty("--design-announcement-bg-light", design.announcementBgColorLight);
  // لون نص الشريط النهاري يتحدد تلقائيًا (أبيض على الداكن، كحلي على الفاتح) حتى لا يختفي الكلام مع أي لون.
  const tickerDay = /^#[0-9a-fA-F]{6}$/.test(design.announcementBgColorLight || "") ? design.announcementBgColorLight : "#0b4a93";
  root.style.setProperty("--design-announcement-bg-light-mid", shadeHex(tickerDay, 0.18));
  root.style.setProperty("--design-announcement-bg-light-deep", shadeHex(tickerDay, -0.22));
  root.style.setProperty("--design-announcement-border-light", shadeHex(tickerDay, 0.55));
  const tickerFg = readableTextOn(design.announcementBgColorLight);
  root.style.setProperty("--design-announcement-fg-light", tickerFg);
  root.style.setProperty("--design-announcement-fg-light-soft", tickerFg === "#ffffff" ? "rgba(255,255,255,.22)" : "rgba(15,35,64,.12)");
  root.style.setProperty("--design-announcement-accent-light", tickerFg === "#ffffff" ? "#ffe066" : "#b45309");
  root.style.setProperty("--design-whatsapp-color", design.whatsappButtonColor);
  root.style.setProperty("--design-detail-name-bg", design.detailNameBoxColor || "#134595");
  root.style.setProperty("--design-dark-bg", design.darkPageBgColor || "#112b5a");
  root.style.setProperty("--design-dark-card", design.darkCardBgColor || "#134595");
  root.style.setProperty("--design-dark-border", design.darkBorderColor || "#0f4ebe");
  root.style.setProperty("--design-dark-primary", design.darkPrimaryColor || "#50b4ff");
  root.style.setProperty("--design-mobile-cols", design.mobileColumns);
  root.style.setProperty("--design-desktop-cols", design.desktopColumns);

  root.setAttribute("data-design-active", "true");
  root.setAttribute("data-design-shimmer", design.shimmerEffectEnabled !== false ? "true" : "false");
  root.setAttribute("data-design-preset", design.themePreset);
  root.setAttribute("data-design-heading-align", design.headingAlign);
  root.setAttribute("data-design-card-align", design.cardTextAlign);
  root.setAttribute("data-design-notice-align", design.noticeAlign);
  root.setAttribute("data-design-font-scale", design.fontScale);
  root.setAttribute("data-design-font-weight", design.fontWeight);
  root.setAttribute("data-design-font-family", design.fontFamily);
  root.setAttribute("data-design-section-heading", design.sectionHeadingStyle);
  root.setAttribute("data-design-border-width", design.borderWidth);
  root.setAttribute("data-design-card-radius", design.cardRadius);
  root.setAttribute("data-design-card-shadow", design.cardShadow);
  root.setAttribute("data-design-button-shape", design.buttonShape);
  root.setAttribute("data-design-button-effect", design.buttonEffect);
  root.setAttribute("data-design-button-align", design.buttonAlign);
  root.setAttribute("data-design-icon-style", design.iconStyle);
  root.setAttribute("data-design-icon-size", design.iconSize);
  root.setAttribute("data-design-icon-pos", design.iconPosition);
  root.setAttribute("data-design-mobile-cols", design.mobileColumns);
  root.setAttribute("data-design-desktop-cols", design.desktopColumns);
  root.setAttribute("data-design-header-sticky", design.headerSticky ? "true" : "false");
  root.setAttribute("data-design-auth-layout", design.authFieldsLayout);
  root.setAttribute("data-design-hero-style", design.heroStyle);
  root.setAttribute("data-design-search-style", design.searchBoxStyle);
  root.setAttribute("data-design-provider-layout", design.providerCardLayout);
  root.setAttribute("data-design-provider-badges", design.showProviderBadges ? "true" : "false");
  root.setAttribute("data-design-provider-share", design.showProviderShareBtn ? "true" : "false");
  root.setAttribute("data-design-tap-feedback", design.tapFeedback);
  root.setAttribute("data-design-edge-tools-pos", design.providerEdgeToolsPosition);
  root.setAttribute("data-design-power-save", design.powerSaveMode);
  root.setAttribute("data-design-specialty-art", design.specialtyArt3d ? "3d" : "flat");
  root.setAttribute("data-design-provider-whatsapp", design.showProviderWhatsappBtn ? "true" : "false");
  root.setAttribute("data-design-section-spacing", design.sectionSpacing);
  root.setAttribute("data-design-hover-effect", design.cardHoverEffect);
  // Aliases used by the extended visual rules (heading frames / button shapes & effects / card hover animations).
  root.setAttribute("data-design-heading-style", design.sectionHeadingStyle);
  root.setAttribute("data-design-btn-shape", design.buttonShape);
  root.setAttribute("data-design-btn-effect", design.buttonEffect);
  root.setAttribute("data-design-hover", design.cardHoverEffect);
  root.setAttribute("data-design-section-divider", design.sectionDividerStyle);
  root.setAttribute("data-design-seasonal-ribbon", design.seasonalRibbon);
  root.setAttribute("data-design-mobile-nav", design.mobileBottomNavEnabled ? "true" : "false");
  root.setAttribute("data-design-install-banner", design.showInstallAppBanner ? "true" : "false");
  root.setAttribute("data-design-header-pattern", design.headerPattern || "none");
  root.setAttribute("data-design-hero-pattern", design.heroPattern || "none");
  root.setAttribute("data-design-pattern-opacity", design.patternOpacity || "subtle");
  root.setAttribute("data-design-prayer-style", design.prayerCardStyle || "dark-sky");
  root.setAttribute("data-design-category-counts", design.showCategoryCounts !== false ? "true" : "false");
  root.setAttribute("data-design-call-strip", design.providerCallStripStyle || "sky");
  root.setAttribute("data-design-animation-speed", design.cardAnimationSpeed || "normal");
  root.setAttribute("data-design-outer-card", design.outerCardStyle || "modern");
  root.setAttribute("data-design-search-trigger", design.searchTriggerStyle || "pill-gradient");
  root.setAttribute("data-design-splash-enabled", design.splashEnabled ? "true" : "false");
  root.setAttribute("data-design-splash-image", design.splashImageUrl || "/images/logo-daleel-transparent.png");
  root.setAttribute("data-design-splash-duration", design.splashDuration || "900");
  if (!design.splashEnabled) {
    root.classList.add("skip-splash");
  }

  try {
    const userPref = localStorage.getItem("janzour-theme");
    if (userPref === "light") {
      root.classList.remove("dark");
    } else if (userPref === "dark") {
      root.classList.add("dark");
    } else {
      if (design.themeMode === "light") root.classList.remove("dark");
      else root.classList.add("dark");
    }
  } catch {
    root.classList.add("dark");
  }
}

export default function DesignApplicator({ design }: { design?: DesignSettings }) {
  useEffect(() => {
    applyDesignSettingsToDocument(design ?? defaultDesignSettings);
  }, [design]);
  return null;
}
