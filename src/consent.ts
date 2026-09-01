export type Consent = {
  necessary: true;
  analytics: boolean;
  at: number;
};

const KEY = "md-cookie-consent";
const LEGACY = "md-cookie";
const SIX_MONTHS = 180 * 24 * 60 * 60 * 1000;
export const CONSENT_EVENT = "md-consent";
export const CONSENT_OPEN = "md-cookie-open";

function emit(consent: Consent | null) {
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
}

export function loadConsent(): Consent | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Consent;
      if (!parsed?.at || Date.now() - parsed.at > SIX_MONTHS) return null;
      return { necessary: true, analytics: Boolean(parsed.analytics), at: parsed.at };
    }
    const legacy = localStorage.getItem(LEGACY);
    if (legacy === "accept") return { necessary: true, analytics: true, at: Date.now() };
    if (legacy === "reject") return { necessary: true, analytics: false, at: Date.now() };
  } catch {
    /* ignore */
  }
  return null;
}

export function saveConsent(analytics: boolean): Consent {
  const consent: Consent = { necessary: true, analytics, at: Date.now() };
  try {
    localStorage.setItem(KEY, JSON.stringify(consent));
    localStorage.removeItem(LEGACY);
  } catch {
    /* ignore */
  }
  emit(consent);
  applyConsent(consent);
  return consent;
}

export function clearAnalyticsCookies() {
  for (const cookie of document.cookie.split(";")) {
    const name = cookie.split("=")[0]?.trim();
    if (name === "_ga" || name.startsWith("_ga_")) {
      document.cookie = `${name}=; Max-Age=0; path=/; SameSite=Lax`;
    }
  }
}

export function analyticsAllowed(consent = loadConsent()) {
  return Boolean(consent?.analytics && import.meta.env.VITE_GA_ID);
}

export function applyConsent(consent: Consent | null) {
  const id = import.meta.env.VITE_GA_ID as string | undefined;
  const scriptId = "md-gtag";
  document.getElementById(scriptId)?.remove();
  document.querySelectorAll("script[data-md-gtag]").forEach((node) => node.remove());
  if (!consent?.analytics || !id) {
    clearAnalyticsCookies();
    return;
  }
  const src = document.createElement("script");
  src.id = scriptId;
  src.async = true;
  src.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(src);
  const boot = document.createElement("script");
  boot.dataset.mdGtag = "1";
  boot.textContent = `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${id}',{anonymize_ip:true});`;
  document.head.appendChild(boot);
}

export function openCookieSettings() {
  window.dispatchEvent(new Event(CONSENT_OPEN));
}
