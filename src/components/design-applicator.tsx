"use client";

import { useEffect } from "react";
import { defaultDesignSettings, type DesignSettings } from "@/lib/catalog";

export function applyDesignSettingsToDocument(design: DesignSettings = defaultDesignSettings) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;

  root.style.setProperty("--design-primary", design.primaryColor);
  root.style.setProperty("--design-page-bg", design.pageBgColor);
  root.style.setProperty("--design-modal-header-bg", design.modalHeaderBg);
  root.style.setProperty("--design-button-color", design.buttonColor);
  root.style.setProperty("--design-border-color", design.borderColor);
  root.style.setProperty("--design-card-bg", design.cardBgColor);
  root.style.setProperty("--design-header-bg", design.headerBgColor);
  root.style.setProperty("--design-footer-bg", design.footerBgColor);
  root.style.setProperty("--design-auth-border", design.authInputBorderColor);
  root.style.setProperty("--design-announcement-bg", design.announcementBgColor);
  root.style.setProperty("--design-whatsapp-color", design.whatsappButtonColor);
  root.style.setProperty("--design-mobile-cols", design.mobileColumns);
  root.style.setProperty("--design-desktop-cols", design.desktopColumns);

  root.setAttribute("data-design-active", "true");
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
  root.setAttribute("data-design-provider-whatsapp", design.showProviderWhatsappBtn ? "true" : "false");
  root.setAttribute("data-design-section-spacing", design.sectionSpacing);
  root.setAttribute("data-design-hover-effect", design.cardHoverEffect);
  root.setAttribute("data-design-section-divider", design.sectionDividerStyle);
  root.setAttribute("data-design-splash-enabled", design.splashEnabled ? "true" : "false");
  root.setAttribute("data-design-splash-image", design.splashImageUrl || "/images/logo-daleel-transparent.png");
  root.setAttribute("data-design-splash-duration", design.splashDuration || "900");
  if (!design.splashEnabled) {
    root.classList.add("skip-splash");
  }

  try {
    const userPref = localStorage.getItem("janzour-theme");
    if (!userPref) {
      if (design.themeMode === "dark") root.classList.add("dark");
      else if (design.themeMode === "light") root.classList.remove("dark");
    }
  } catch {
    // Ignore storage access errors
  }
}

export default function DesignApplicator({ design }: { design?: DesignSettings }) {
  useEffect(() => {
    applyDesignSettingsToDocument(design ?? defaultDesignSettings);
  }, [design]);
  return null;
}
