import { useEffect } from "react";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { CookieBanner, Footer, Header } from "./components/Chrome";
import { HomePage } from "./pages/HomePage";
import { CheckoutPage, ThanksPage } from "./pages/CheckoutPage";
import { BlogPage, PressKitPage } from "./pages/InnerPages";
import { applyConsent, CONSENT_EVENT, loadConsent, type Consent } from "./consent";
import { siteUrl } from "./data";

function HashScroll() {
  const { hash, search } = useLocation();
  useEffect(() => {
    const fromHash = hash ? decodeURIComponent(hash.slice(1)) : "";
    const fromQuery = new URLSearchParams(search).get("shot") ?? "";
    const id = fromHash || fromQuery;
    if (!id) return;
    const timer = window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({ block: "start" });
    }, 600);
    return () => window.clearTimeout(timer);
  }, [hash, search]);
  return null;
}

function setMeta(attr: "name" | "property", key: string, value: string) {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", value);
}

function SeoHead() {
  const { pathname } = useLocation();
  useEffect(() => {
    const url = siteUrl(pathname);
    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", url);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:url", url);

    const robots = document.head.querySelector('meta[name="robots"]');
    if (pathname.startsWith("/checkout")) {
      setMeta("name", "robots", "noindex, nofollow");
    } else {
      robots?.remove();
    }
  }, [pathname]);
  return null;
}

function AnalyticsGate() {
  useEffect(() => {
    applyConsent(loadConsent());
    const onChange = (event: Event) => {
      const consent = (event as CustomEvent<Consent | null>).detail ?? loadConsent();
      applyConsent(consent);
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);
  return null;
}

export function App() {
  return (
    <BrowserRouter>
      <HashScroll />
      <SeoHead />
      <AnalyticsGate />
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/thanks" element={<ThanksPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/blog/introducing-microduck" element={<BlogPage />} />
        <Route path="/press-kit" element={<PressKitPage />} />
      </Routes>
      <Footer />
      <CookieBanner />
    </BrowserRouter>
  );
}
