import { useEffect, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { LINKS } from "../data";
import { ComicButton, DuckMark } from "./ui";
import { CONSENT_OPEN, loadConsent, openCookieSettings, saveConsent } from "../consent";

export function Header() {
  const [menu, setMenu] = useState(false);
  const [scrolled, setScrolled] = useState(() => typeof window !== "undefined" && window.scrollY > 24);
  const { pathname } = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [pathname]);

  return (
    <header className={`topbar${scrolled ? " is-scrolled" : ""}`}>
      <div className="pollen-bar">
        <a className="brand-lockup" href={LINKS.pollen} aria-label="Pollen Robotics × Hugging Face">
          <img src="/brand/pollen-logo-icon.svg" alt="" />
          <span>Pollen Robotics</span>
          <span className="times">×</span>
          <img src="/brand/hf-logo.svg" alt="" />
          <span>Hugging Face</span>
        </a>
        <nav className="pollen-nav" aria-label="Pollen">
          <a href={LINKS.pollen}>Pollen</a>
          <a href={LINKS.reachyMini}>Reachy Mini</a>
          <NavLink to="/" className={({ isActive }) => (isActive ? "is-on" : "")} end>
            Microduck
          </NavLink>
          <a href={LINKS.reachy2}>Reachy 2</a>
        </nav>
      </div>
      <div className="duck-bar">
        <Link className="duck-brand" to="/" aria-label="Microduck">
          <DuckMark />
          <span>Microduck</span>
        </Link>
        <nav className={`duck-nav${menu ? " is-open" : ""}`} aria-label="Microduck">
          <Link to={LINKS.blog} onClick={() => setMenu(false)}>
            Blog
          </Link>
          <Link to={LINKS.pressKit} onClick={() => setMenu(false)}>
            Press kit
          </Link>
          <ComicButton href={LINKS.store} size="sm" variant="nav">
            Pre-order
          </ComicButton>
        </nav>
        <button
          className="menu-btn"
          type="button"
          aria-expanded={menu}
          aria-label={menu ? "Close menu" : "Open menu"}
          onClick={() => setMenu((open) => !open)}
        >
          {menu ? "×" : "☰"}
        </button>
      </div>
    </header>
  );
}

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap foot-grid">
        <div>
          <img src="/brand/pollen-logo-icon.svg" alt="" width={36} height={36} />
          <p style={{ color: "#fff", fontWeight: 700, margin: "12px 0 8px" }}>Pollen Robotics</p>
          <p>Expressive, open-source robots for AI builders and makers.</p>
        </div>
        <div>
          <h2>Products</h2>
          <a href={LINKS.reachyMini}>Reachy Mini</a>
          <Link to="/">Microduck</Link>
          <a href={LINKS.pollen}>Apps</a>
          <a href={LINKS.reachy2}>Reachy 2</a>
        </div>
        <div>
          <h2>Resources</h2>
          <Link to={LINKS.blog}>Blog</Link>
          <Link to={LINKS.pressKit}>Press kit</Link>
        </div>
        <div>
          <h2>Company</h2>
          <a href={`${LINKS.pollen}about-us`}>About us</a>
          <a href={`${LINKS.pollen}contact-us`}>Contact</a>
          <a href={LINKS.discord} target="_blank" rel="noopener noreferrer">
            Discord
          </a>
          <a href={LINKS.huggingFace} target="_blank" rel="noopener noreferrer">
            Hugging Face
          </a>
          <a href={LINKS.x} target="_blank" rel="noopener noreferrer">
            X
          </a>
          <a href={LINKS.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn
          </a>
          <a href={LINKS.youtube} target="_blank" rel="noopener noreferrer">
            YouTube
          </a>
        </div>
        <div>
          <h2>Legal</h2>
          <a href={`${LINKS.pollen}legal`}>Legal notice</a>
          <a href={`${LINKS.pollen}privacy`}>Privacy</a>
          <a href={`${LINKS.pollen}terms`}>Terms of sale</a>
          <a href={LINKS.cookies}>Cookie policy</a>
          <button type="button" className="foot-link" onClick={openCookieSettings}>
            Cookie settings
          </button>
        </div>
      </div>
      <div className="wrap foot-bottom">
        <span>© 2026 Pollen Robotics · Open source under Apache 2.0</span>
        <a className="hf-lock" href={LINKS.huggingFace} target="_blank" rel="noopener noreferrer">
          Part of <img src="/brand/hf-logo.svg" alt="Hugging Face" />
        </a>
      </div>
    </footer>
  );
}

export function CookieBanner() {
  const [view, setView] = useState<"closed" | "banner" | "customize">("closed");
  const [analytics, setAnalytics] = useState(false);

  useEffect(() => {
    const existing = loadConsent();
    if (!existing) setView("banner");
    else setAnalytics(existing.analytics);
    const open = () => {
      const current = loadConsent();
      setAnalytics(current?.analytics ?? false);
      setView("customize");
    };
    window.addEventListener(CONSENT_OPEN, open);
    return () => window.removeEventListener(CONSENT_OPEN, open);
  }, []);

  const accept = () => {
    saveConsent(true);
    setAnalytics(true);
    setView("closed");
  };
  const reject = () => {
    saveConsent(false);
    setAnalytics(false);
    setView("closed");
  };
  const save = () => {
    saveConsent(analytics);
    setView("closed");
  };

  if (view === "closed") return null;

  return (
    <aside className={`cookie${view === "customize" ? " is-panel" : ""}`} role="dialog" aria-label={view === "customize" ? "Cookie settings" : "We value your privacy"}>
      <img src="/brand/duck-head-mark.webp" alt="" />
      {view === "banner" ? (
        <>
          <p>
            We value your privacy. We use cookies to run the site and, with your consent, measure audience. See the{" "}
            <a href={LINKS.cookies} target="_blank" rel="noopener noreferrer">
              cookie policy
            </a>{" "}
            or our{" "}
            <a href={`${LINKS.pollen}privacy`} target="_blank" rel="noopener noreferrer">
              privacy policy
            </a>
            .
          </p>
          <div className="row">
            <button type="button" className="btn-comic btn-sm btn-orange btn-nav" onClick={accept}>
              Accept
            </button>
            <button type="button" className="btn-comic btn-sm btn-ghost" style={{ width: "auto", padding: "8px 14px" }} onClick={reject}>
              Reject
            </button>
            <button type="button" className="ghost" onClick={() => setView("customize")}>
              Customize
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            Strictly necessary storage is always on, so the site can remember this choice for six months. Audience
            measurement is optional and stays off until you turn it on.
          </p>
          <label className="cookie-opt">
            <input type="checkbox" checked disabled />
            <span>
              <b>Strictly necessary</b>
              Remembers your cookie choice. No identifier.
            </span>
          </label>
          <label className="cookie-opt">
            <input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} />
            <span>
              <b>Audience measurement</b>
              {import.meta.env.VITE_GA_ID
                ? "Loads Google Analytics only after you opt in."
                : "Opt-in is stored here. No measurement script is loaded until a measurement ID is configured."}
            </span>
          </label>
          <div className="row">
            <button type="button" className="btn-comic btn-sm btn-orange btn-nav" onClick={save}>
              Save
            </button>
            <button type="button" className="btn-comic btn-sm btn-ghost" style={{ width: "auto", padding: "8px 14px" }} onClick={reject}>
              Reject all
            </button>
            <button type="button" className="ghost" onClick={accept}>
              Accept all
            </button>
          </div>
        </>
      )}
    </aside>
  );
}
