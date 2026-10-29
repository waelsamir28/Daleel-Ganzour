"use client";

import { useEffect, useRef, useState } from "react";
import Directory from "@/components/directory";
import type { PublicDirectory, Viewer } from "@/lib/catalog";

/**
 * غلاف الدليل: يفتح الأقسام والتخصصات فورًا من البيانات الموجودة على الجهاز بدل انتظار الخادم.
 * أي رابط داخلي إلى «/» أو «/categories/…» يُعترض: نغيّر العنوان بـ pushState (مدمج مع موجّه Next)
 * ونعيد تركيب <Directory> بالقسم الجديد في اللحظة نفسها، ثم يتحدّث بهدوء من /api/services في الخلفية.
 * الفتح المباشر لأي رابط (مشاركة/محرك بحث) ما زال يُخدَم من الخادم كما هو.
 */
type Route = { rootId?: string; specialtyId?: string; stageId?: string; favorites: boolean };
type Props = { initialData: PublicDirectory; viewer: Viewer; guestLocked?: boolean; rootId?: string; specialtyId?: string; stageId?: string; initialFavorites?: boolean };

function routeKey(route: Route) { return `${route.rootId ?? ""}/${route.specialtyId ?? ""}/${route.stageId ?? ""}/${route.favorites ? "fav" : ""}`; }

/** يحوّل عنوانًا داخليًا إلى مسار معروف، أو null إن لم يكن قسمًا/تخصصًا موجودًا في البيانات. */
function parseRoute(url: URL, categories: PublicDirectory["categories"]): Route | null {
  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length === 0) return { favorites: url.searchParams.get("favorites") === "1" };
  if (parts[0] !== "categories" || parts.length > 3) return null;
  const rootId = decodeURIComponent(parts[1] ?? ""), specialtyId = parts[2] ? decodeURIComponent(parts[2]) : undefined;
  if (!categories.some((item) => item.id === rootId && !item.parentId && item.active)) return null;
  if (specialtyId && !categories.some((item) => item.id === specialtyId && item.parentId === rootId && item.active)) return null;
  return { rootId, specialtyId, stageId: url.searchParams.get("stage") || undefined, favorites: false };
}

export default function DirectoryShell({ initialData, viewer, guestLocked = false, rootId, specialtyId, stageId, initialFavorites = false }: Props) {
  const [data, setData] = useState(initialData);
  // عند إعادة التركيب بعد pushState (مثلًا من غلاف خارجي) نقرأ المسار من عنوان المتصفح لا من خصائص الخادم القديمة.
  const [route, setRoute] = useState<Route>(() => {
    const fromProps: Route = { rootId, specialtyId, stageId, favorites: initialFavorites };
    if (typeof window === "undefined") return fromProps;
    return parseRoute(new URL(window.location.href), initialData.categories) ?? fromProps;
  });
  const [navigated, setNavigated] = useState(false);
  const routeRef = useRef(route);
  const categoriesRef = useRef(data.categories);
  useEffect(() => { routeRef.current = route; }, [route]);
  useEffect(() => { categoriesRef.current = data.categories; }, [data.categories]);
  const scrollMemory = useRef(new Map<string, number>());
  const pendingScroll = useRef<number | null | undefined>(undefined);

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const anchor = (event.target as Element | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      // روابط تفتح نافذة بدل التنقل (مثل مربع «المدرسين» الذي يفتح اختيار المرحلة) تبقى لمعالجها الخاص.
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download") || anchor.hasAttribute("aria-haspopup") || anchor.getAttribute("rel")?.includes("external")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.origin !== window.location.origin) return;
      const next = parseRoute(url, categoriesRef.current);
      if (!next) return;
      const current = routeRef.current;
      if (routeKey(next) === routeKey(current)) {
        // نفس الصفحة (مثلًا رابط #add-service أو الشعار وأنت في الرئيسية): اترك السلوك الافتراضي.
        if (url.hash) return;
        event.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }
      event.preventDefault();
      scrollMemory.current.set(window.location.pathname + window.location.search, window.scrollY);
      window.history.pushState(null, "", url.pathname + url.search + url.hash);
      pendingScroll.current = next.rootId ? undefined : 0;
      setNavigated(true);
      setRoute(next);
    };
    const onPop = () => {
      const url = new URL(window.location.href);
      const next = parseRoute(url, categoriesRef.current);
      if (!next) return;
      if (routeKey(next) === routeKey(routeRef.current)) return;
      pendingScroll.current = scrollMemory.current.get(url.pathname + url.search) ?? (next.rootId ? undefined : 0);
      setNavigated(true);
      setRoute(next);
    };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPop);
    return () => { document.removeEventListener("click", onClick, true); window.removeEventListener("popstate", onPop); };
  }, []);

  // بعد إعادة التركيب: عنوان التبويب + موضع التمرير (الرئيسية للأعلى، والرجوع يعيد الموضع السابق).
  useEffect(() => {
    const root = route.rootId ? data.categories.find((item) => item.id === route.rootId) : undefined;
    const specialty = route.specialtyId ? data.categories.find((item) => item.id === route.specialtyId) : undefined;
    const siteName = data.settings.siteName;
    document.title = specialty ? `${specialty.name} | ${siteName}` : root ? `${root.name} | ${siteName}` : siteName;
    const target = pendingScroll.current;
    pendingScroll.current = undefined;
    if (target === undefined) return;
    const frame = window.requestAnimationFrame(() => window.requestAnimationFrame(() => window.scrollTo({ top: target ?? 0, behavior: "auto" })));
    return () => window.cancelAnimationFrame(frame);
  }, [route, data.categories, data.settings.siteName]);

  return (
    <Directory
      key={routeKey(route)}
      initialData={data}
      viewer={viewer}
      rootId={route.rootId}
      specialtyId={route.specialtyId}
      stageId={route.stageId}
      initialFavorites={route.favorites}
      guestLocked={guestLocked}
      onData={setData}
      refreshOnMount={navigated}
    />
  );
}
